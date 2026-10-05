import { eq } from "drizzle-orm";
import { tasks } from "../../../../db/schema";

export default defineEventHandler(async (event) => {
  const project = await requireProject(event);
  return selectTasks(eq(tasks.projectId, project.id));
});
