import { asc, eq } from "drizzle-orm";
import { issueComments } from "../../../../../db/schema";

/** Oldest first. */
export default defineEventHandler(async (event) => {
  const issue = await requireIssue(event);
  return useDb()
    .select()
    .from(issueComments)
    .where(eq(issueComments.issueId, issue.id))
    .orderBy(asc(issueComments.createdAt), asc(issueComments.id));
});
