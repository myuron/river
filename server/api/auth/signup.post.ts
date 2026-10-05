import { users } from "../../db/schema";

const DUPLICATE_EMAIL = "このメールアドレスは既に登録されています";

export default defineEventHandler(async (event) => {
  const parsed = parseSignup(await readBody<Record<string, unknown> | null>(event));
  if (!parsed.ok) {
    throw createError({ statusCode: 400, message: parsed.message });
  }
  const { name, email, password } = parsed.value;

  const [user] = await useDb()
    .insert(users)
    .values({ name, email, passwordHash: await hashPassword(password) })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id, name: users.name, email: users.email });
  if (!user) {
    throw createError({ statusCode: 409, message: DUPLICATE_EMAIL });
  }

  await createSession(event, user.id);
  setResponseStatus(event, 201);
  return { user };
});
