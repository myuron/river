import { eq } from "drizzle-orm";
import { tasks } from "../../../../db/schema";

// Descendants are removed by the parent_id ON DELETE CASCADE.
export default defineEventHandler(async (event) => {
  const task = await requireTask(event);
  await useDb().delete(tasks).where(eq(tasks.id, task.id));
  setResponseStatus(event, 204);
  return null;
});
