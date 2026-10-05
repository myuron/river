import { eq } from "drizzle-orm";
import { issues } from "../../../../db/schema";

/** Newest first. */
export default defineEventHandler(async (event) => {
  const project = await requireProject(event);
  return selectIssues(eq(issues.projectId, project.id));
});
