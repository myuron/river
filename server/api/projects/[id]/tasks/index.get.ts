import { asc, eq } from "drizzle-orm";
import { tasks } from "../../../../db/schema";

export default defineEventHandler(async (event) => {
  const project = await requireProject(event);
  return useDb().select().from(tasks).where(eq(tasks.projectId, project.id)).orderBy(asc(tasks.id));
});
