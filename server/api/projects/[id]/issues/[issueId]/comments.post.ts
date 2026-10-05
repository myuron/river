import { issueComments } from "../../../../../db/schema";

export default defineEventHandler(async (event) => {
  const issue = await requireIssue(event);
  const parsed = parseCommentInput(await readBody<Record<string, unknown> | null>(event));
  if (!parsed.ok) {
    throw createError({ statusCode: 400, message: parsed.message });
  }

  const [comment] = await useDb()
    .insert(issueComments)
    .values({ issueId: issue.id, ...parsed.value })
    .returning()
    .catch((error: unknown) => {
      // The issue was deleted after requireIssue().
      if (isForeignKeyViolation(error)) {
        throw createError({ statusCode: 404, message: "課題が見つかりません" });
      }
      throw error;
    });
  setResponseStatus(event, 201);
  return comment;
});
