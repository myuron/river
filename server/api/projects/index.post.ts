import { projects } from "../../db/schema";

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: unknown }>(event);
  const name = normalizeRequiredText(body?.name);
  if (!name) {
    throw createError({ statusCode: 400, message: "プロジェクト名を入力してください" });
  }
  const [project] = await useDb().insert(projects).values({ name }).returning();
  setResponseStatus(event, 201);
  return project;
});
