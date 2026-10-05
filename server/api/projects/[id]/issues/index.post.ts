import { issues } from "../../../../db/schema";

/** Creates an issue from its title and body; other fields start at their defaults. */
export default defineEventHandler(async (event) => {
  const project = await requireProject(event);
  const body = await readBody<{ title?: unknown; body?: unknown } | null>(event);

  const parsed = parseIssueFields({ title: body?.title, body: body?.body });
  if (!parsed.ok) {
    throw createError({ statusCode: 400, message: parsed.message });
  }

  const [issue] = await useDb()
    .insert(issues)
    .values({ projectId: project.id, title: parsed.value.title!, body: parsed.value.body ?? "" })
    .returning();
  setResponseStatus(event, 201);
  return issue;
});
