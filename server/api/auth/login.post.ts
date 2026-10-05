import { eq } from "drizzle-orm";
import { users } from "../../db/schema";

// Same message for unknown email and wrong password, so accounts can't be probed.
const INVALID = "メールアドレスまたはパスワードが正しくありません";

// Checked against when the email is unknown, so both cases take the same time.
const DUMMY_HASH = hashPassword("dummy password for timing");

export default defineEventHandler(async (event) => {
  const credentials = parseCredentials(await readBody<Record<string, unknown> | null>(event));
  if (!credentials) {
    throw createError({ statusCode: 401, message: INVALID });
  }

  const [user] = await useDb().select().from(users).where(eq(users.email, credentials.email));
  const valid = await verifyPassword(
    credentials.password,
    user?.passwordHash ?? (await DUMMY_HASH),
  );
  if (!user || !valid) {
    throw createError({ statusCode: 401, message: INVALID });
  }

  await createSession(event, user.id);
  return { user: { id: user.id, name: user.name, email: user.email } };
});
