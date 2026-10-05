import { and, eq } from "drizzle-orm";
import { tasks } from "../../../../db/schema";

export default defineEventHandler(async (event) => {
  const project = await requireProject(event);
  const body = await readBody<{ title?: unknown; parentId?: unknown }>(event);

  const title = normalizeRequiredText(body?.title);
  if (!title) {
    throw createError({ statusCode: 400, message: "タイトルを入力してください" });
  }

  const parentId = body?.parentId ?? null;
  if (parentId !== null) {
    const [parent] = isId(parentId)
      ? await useDb()
          .select({ id: tasks.id })
          .from(tasks)
          .where(and(eq(tasks.id, parentId), eq(tasks.projectId, project.id)))
      : [];
    if (!parent) {
      throw createError({ statusCode: 400, message: "親タスクが見つかりません" });
    }
  }

  const [task] = await useDb()
    .insert(tasks)
    .values({ projectId: project.id, parentId: parentId as number | null, title })
    .returning();
  setResponseStatus(event, 201);
  return task;
});
