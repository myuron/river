import { eq } from "drizzle-orm";
import { issues } from "../../../../db/schema";

/** Updates the fields present in the body. */
export default defineEventHandler(async (event) => {
  const issue = await requireIssue(event);
  const body = (await readBody<unknown>(event)) ?? {};
  if (typeof body !== "object" || Array.isArray(body)) {
    throw createError({ statusCode: 400, message: "リクエストの形式が正しくありません" });
  }

  const parsed = parseIssueFields(body as Record<string, unknown>);
  if (!parsed.ok) {
    throw createError({ statusCode: 400, message: parsed.message });
  }
  if (Object.keys(parsed.value).length === 0) return issue;

  const [updated] = await useDb()
    .update(issues)
    .set(parsed.value)
    .where(eq(issues.id, issue.id))
    .returning();
  if (!updated) {
    throw createError({ statusCode: 404, message: "課題が見つかりません" });
  }
  return updated;
});
