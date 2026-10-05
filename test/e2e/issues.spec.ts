import { expect, test } from "@playwright/test";
import { createIssue, createProject, gotoHydrated } from "./support/app";

test("registers an issue and shows it in the list and detail pages", async ({ page, request }) => {
  const projectId = await createProject(request);
  await gotoHydrated(page, `/projects/${projectId}`);
  await page.getByRole("link", { name: "課題", exact: true }).click();
  await expect(page).toHaveURL(`/projects/${projectId}/issues`);
  await expect(page.getByText("課題がまだありません")).toBeVisible();
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });

  await page.getByLabel("タイトル").fill("ログインできない");
  await page.getByLabel("本文").fill("手順:\n1. ログイン画面を開く\n2. 送信する");
  await page.getByRole("button", { name: "課題を登録" }).click();
  const row = page.getByTestId("issue-row").filter({ hasText: "ログインできない" });
  await expect(row).toBeVisible();
  await expect(row.getByTestId("issue-status")).toHaveText("未対応");
  await expect(row.locator("time")).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}T/);
  await expect(row.locator("time")).toHaveText(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);

  await page.reload();
  await page.getByRole("link", { name: "ログインできない" }).click();
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/issues/\\d+$`));
  await expect(page.getByRole("heading", { level: 1, name: "ログインできない" })).toBeVisible();
  await expect(page.getByTestId("issue-body")).toHaveText(
    "手順:\n1. ログイン画面を開く\n2. 送信する",
  );
  await expect(page.getByTestId("issue-status")).toHaveText("未対応");
  await expect(page.locator("time")).toHaveText(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
});

test("lists issues newest first", async ({ page, request }) => {
  const projectId = await createProject(request);
  await createIssue(request, projectId, { title: "一件目" });
  await createIssue(request, projectId, { title: "二件目" });
  await createIssue(request, projectId, { title: "三件目" });
  await gotoHydrated(page, `/projects/${projectId}/issues`);
  await expect(page.getByTestId("issue-title")).toHaveText(["三件目", "二件目", "一件目"]);
});

test("rejects a blank title", async ({ page, request }) => {
  const projectId = await createProject(request);
  await gotoHydrated(page, `/projects/${projectId}/issues`);
  await page.getByLabel("タイトル").fill("   ");
  await page.getByRole("button", { name: "課題を登録" }).click();
  await expect(page.getByRole("alert")).toHaveText("タイトルを入力してください");
  await expect(page.getByText("課題がまだありません")).toBeVisible();
  const response = await request.post(`/api/projects/${projectId}/issues`, {
    data: { title: " " },
  });
  expect(response.status()).toBe(400);
  const badBody = await request.post(`/api/projects/${projectId}/issues`, {
    data: { title: "t", body: 1 },
  });
  expect(badBody.status()).toBe(400);
});

test("keeps issues within their project and 404s otherwise", async ({ page, request }) => {
  const projectId = await createProject(request);
  const otherId = await createProject(request);
  const issueId = await createIssue(request, otherId, { title: "他プロジェクトの課題" });

  await gotoHydrated(page, `/projects/${projectId}/issues`);
  await expect(page.getByText("他プロジェクトの課題")).toHaveCount(0);

  for (const url of [
    `/projects/${projectId}/issues/${issueId}`,
    `/projects/${otherId}/issues/999999999`,
    `/projects/999999999/issues`,
  ]) {
    const response = await page.goto(url);
    expect(response?.status(), url).toBe(404);
  }
});
