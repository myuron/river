import { expect, test } from "@playwright/test";
import { createIssue, createProject, createTask, createUsers } from "./support/app";

test("assignees must be registered users", async ({ request, playwright }) => {
  const [sato] = await createUsers(playwright, "佐藤");
  const projectId = await createProject(request);
  const taskId = await createTask(request, projectId, { title: "t" });
  const issueId = await createIssue(request, projectId, { title: "i" });
  const taskUrl = `/api/projects/${projectId}/tasks/${taskId}`;
  const issueUrl = `/api/projects/${projectId}/issues/${issueId}`;

  for (const url of [taskUrl, issueUrl]) {
    for (const assigneeId of [999999999, "佐藤", -1]) {
      const response = await request.patch(url, { data: { assigneeId } });
      expect(response.status(), `${url} ${assigneeId}`).toBe(400);
    }
    const assigned = await request.patch(url, { data: { assigneeId: sato.id } });
    expect(assigned.status()).toBe(200);
    expect((await assigned.json()).assignee).toEqual({ id: sato.id, name: sato.name });

    const cleared = await request.patch(url, { data: { assigneeId: null } });
    expect((await cleared.json()).assignee).toBeNull();
  }
});

test("lists registered users without their emails", async ({ request, playwright }) => {
  const [suzuki] = await createUsers(playwright, "鈴木");
  const users = (await (await request.get("/api/users")).json()) as Record<string, unknown>[];
  expect(users).toContainEqual({ id: suzuki.id, name: suzuki.name });
  expect(users.every((u) => !("email" in u) && !("passwordHash" in u))).toBe(true);
});
