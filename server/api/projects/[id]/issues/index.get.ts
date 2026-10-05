import { desc, eq } from "drizzle-orm";
import { issues } from "../../../../db/schema";

/** Newest first. */
export default defineEventHandler(async (event) => {
  const project = await requireProject(event);
  return useDb()
    .select()
    .from(issues)
    .where(eq(issues.projectId, project.id))
    .orderBy(desc(issues.createdAt), desc(issues.id));
});
