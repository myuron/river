import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt, or } from "drizzle-orm";
import type { H3Event } from "h3";
import { sessions, users } from "../db/schema";

const COOKIE_NAME = "river_session";
const SESSION_DAYS = 30;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Starts a session for `userId` and sets the session cookie. */
export async function createSession(event: H3Event, userId: number) {
  // End the session this browser had (e.g. another user's) and sweep expired ones.
  const previous = getCookie(event, COOKIE_NAME);
  await useDb()
    .delete(sessions)
    .where(
      previous
        ? or(eq(sessions.id, hashToken(previous)), lt(sessions.expiresAt, new Date()))
        : lt(sessions.expiresAt, new Date()),
    );

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await useDb()
    .insert(sessions)
    .values({ id: hashToken(token), userId, expiresAt });
  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: getRequestProtocol(event, { xForwardedProto: true }) === "https",
    path: "/",
    expires: expiresAt,
  });
}

/** The user of a valid session cookie, or null. */
export async function getSessionUser(event: H3Event): Promise<SessionUser | null> {
  const token = getCookie(event, COOKIE_NAME);
  if (!token) return null;
  const [user] = await useDb()
    .select({ id: users.id, name: users.name, email: users.email })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())));
  return user ?? null;
}

export async function destroySession(event: H3Event) {
  const token = getCookie(event, COOKIE_NAME);
  if (token) {
    await useDb()
      .delete(sessions)
      .where(eq(sessions.id, hashToken(token)));
  }
  deleteCookie(event, COOKIE_NAME, { path: "/" });
}
