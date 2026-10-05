import { eq } from "drizzle-orm";
import { issues } from "../../../../db/schema";

export default defineEventHandler(async (event) => {
  const issue = await requireIssue(event);
  await useDb().delete(issues).where(eq(issues.id, issue.id));
  setResponseStatus(event, 204);
  return null;
});
