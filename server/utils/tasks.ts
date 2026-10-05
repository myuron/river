import { and, eq } from "drizzle-orm";
import type { H3Event } from "h3";
import { tasks } from "../db/schema";

/** Loads the task in the `taskId` route param within the `id` project, or throws 404. */
export async function requireTask(event: H3Event) {
  const project = await requireProject(event);
  const taskId = requireIdParam(event, "taskId");
  const [task] = await useDb()
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.projectId, project.id)));
  if (!task) {
    throw createError({
      statusCode: 404,
      statusMessage: "Task not found",
      message: "タスクが見つかりません",
    });
  }
  return task;
}
