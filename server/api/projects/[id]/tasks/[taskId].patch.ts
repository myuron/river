import { eq } from "drizzle-orm";
import { tasks } from "../../../../db/schema";

/** Updates the title and/or detail fields present in the body. */
export default defineEventHandler(async (event) => {
  const task = await requireTask(event);
  const body = (await readBody<unknown>(event)) ?? {};
  if (typeof body !== "object" || Array.isArray(body)) {
    throw createError({ statusCode: 400, message: "リクエストの形式が正しくありません" });
  }

  const changes: Partial<typeof tasks.$inferInsert> = {};
  if ("title" in body) {
    const title = normalizeRequiredText(body.title);
    if (!title) {
      throw createError({ statusCode: 400, message: "タイトルを入力してください" });
    }
    changes.title = title;
  }

  const details = parseTaskDetails(body);
  if (!details.ok) {
    throw createError({ statusCode: 400, message: details.message });
  }
  Object.assign(changes, details.value);

  const dateError = checkTaskDateOrder({ ...task, ...details.value });
  if (dateError) {
    throw createError({ statusCode: 400, message: dateError });
  }

  if (Object.keys(changes).length === 0) return task;

  const [updated] = await useDb()
    .update(tasks)
    .set(changes)
    .where(eq(tasks.id, task.id))
    .returning();
  if (!updated) {
    // Deleted after requireTask().
    throw createError({ statusCode: 404, message: "タスクが見つかりません" });
  }
  return updated;
});
