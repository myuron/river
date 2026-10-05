import { eq } from "drizzle-orm";
import { issues } from "../../../../db/schema";

export default defineEventHandler(async (event) => {
  const issue = await requireIssue(event);
  const [result] = await selectIssues(eq(issues.id, issue.id));
  return result;
});
