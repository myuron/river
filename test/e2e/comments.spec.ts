import { expect, test } from "@playwright/test";
import { createIssue, createProject, gotoHydrated } from "./support/app";

test("posts comments that persist in chronological order", async ({ page, request }) => {
  const projectId = await createProject(request);
  const issueId = await createIssue(request, projectId, { title: "コメント対象" });
  await gotoHydrated(page, `/projects/${projectId}/issues/${issueId}`);
  await expect(page.getByText("コメントはまだありません")).toBeVisible();

  await page.getByLabel("投稿者名").fill("山田");
  await page.getByLabel("コメント", { exact: true }).fill("調査します\n原因は未特定");
  await page.getByRole("button", { name: "コメントを投稿" }).click();
  await expect(page.getByTestId("comment")).toHaveCount(1);

  await page.getByLabel("投稿者名").fill("   ");
  await page.getByLabel("コメント", { exact: true }).fill("2件目");
  await page.getByRole("button", { name: "コメントを投稿" }).click();
  await expect(page.getByTestId("comment")).toHaveCount(2);

  await page.reload();
  const comments = page.getByTestId("comment");
  await expect(comments.getByTestId("comment-author")).toHaveText(["山田", "匿名"]);
  await expect(comments.getByTestId("comment-body")).toHaveText([
    "調査します\n原因は未特定",
    "2件目",
  ]);
  await expect(comments.first().locator("time")).toHaveText(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
  await expect(page.getByText("コメントはまだありません")).toHaveCount(0);
});

test("rejects a blank comment", async ({ page, request }) => {
  const projectId = await createProject(request);
  const issueId = await createIssue(request, projectId, { title: "空コメント" });
  await gotoHydrated(page, `/projects/${projectId}/issues/${issueId}`);
  await page.getByLabel("コメント", { exact: true }).fill(" \n ");
  await page.getByRole("button", { name: "コメントを投稿" }).click();
  await expect(page.getByRole("alert")).toHaveText("コメントを入力してください");
  await expect(page.getByTestId("comment")).toHaveCount(0);

  const url = `/api/projects/${projectId}/issues/${issueId}/comments`;
  expect((await request.post(url, { data: { body: "  " } })).status()).toBe(400);
  expect((await request.post(url, { data: { body: "x", author: 1 } })).status()).toBe(400);
});

test("keeps comments per issue and removes them with the issue", async ({ page, request }) => {
  const projectId = await createProject(request);
  const first = await createIssue(request, projectId, { title: "課題A" });
  const second = await createIssue(request, projectId, { title: "課題B" });
  const url = (id: number) => `/api/projects/${projectId}/issues/${id}/comments`;
  expect((await request.post(url(first), { data: { body: "Aへのコメント" } })).status()).toBe(201);

  await gotoHydrated(page, `/projects/${projectId}/issues/${second}`);
  await expect(page.getByText("コメントはまだありません")).toBeVisible();
  await expect(page.getByText("Aへのコメント")).toHaveCount(0);

  const otherProject = await createProject(request);
  expect(
    (await request.get(`/api/projects/${otherProject}/issues/${first}/comments`)).status(),
  ).toBe(404);

  expect((await request.delete(`/api/projects/${projectId}/issues/${first}`)).status()).toBe(204);
  expect((await request.get(url(first))).status()).toBe(404);
});
