import { and, eq } from "drizzle-orm";
import type { H3Event } from "h3";
import { issues } from "../db/schema";

/** Loads the issue in the `issueId` route param within the `id` project, or throws 404. */
export async function requireIssue(event: H3Event) {
  const project = await requireProject(event);
  const issueId = requireIdParam(event, "issueId");
  const [issue] = await useDb()
    .select()
    .from(issues)
    .where(and(eq(issues.id, issueId), eq(issues.projectId, project.id)));
  if (!issue) {
    throw createError({
      statusCode: 404,
      statusMessage: "Issue not found",
      message: "課題が見つかりません",
    });
  }
  return issue;
}
