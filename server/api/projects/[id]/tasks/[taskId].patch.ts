import { eq } from "drizzle-orm";
import { tasks } from "../../../../db/schema";

export default defineEventHandler(async (event) => {
  const task = await requireTask(event);
  const body = await readBody<{ title?: unknown }>(event);

  const title = normalizeRequiredText(body?.title);
  if (!title) {
    throw createError({ statusCode: 400, message: "タイトルを入力してください" });
  }

  const [updated] = await useDb()
    .update(tasks)
    .set({ title })
    .where(eq(tasks.id, task.id))
    .returning();
  if (!updated) {
    // Deleted after requireTask().
    throw createError({ statusCode: 404, message: "タスクが見つかりません" });
  }
  return updated;
});
