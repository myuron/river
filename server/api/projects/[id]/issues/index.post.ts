import { issues } from "../../../../db/schema";

export default defineEventHandler(async (event) => {
  const project = await requireProject(event);
  const body = await readBody<{ title?: unknown; body?: unknown }>(event);

  const title = normalizeRequiredText(body?.title);
  if (!title) {
    throw createError({ statusCode: 400, message: "タイトルを入力してください" });
  }
  if (body?.body !== undefined && body.body !== null && typeof body.body !== "string") {
    throw createError({ statusCode: 400, message: "本文が正しくありません" });
  }

  const [issue] = await useDb()
    .insert(issues)
    .values({ projectId: project.id, title, body: body?.body ?? "" })
    .returning();
  setResponseStatus(event, 201);
  return issue;
});
