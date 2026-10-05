import { expect, type Page, test } from "@playwright/test";
import { createIssue, createProject, createUsers, gotoHydrated, isoDate } from "./support/app";

async function openEdit(page: Page) {
  await page.getByRole("button", { name: "編集" }).click();
}

test("edits an issue's fields, persists them and shows them in the list", async ({
  page,
  request,
  playwright,
}) => {
  const [sato] = await createUsers(playwright, "佐藤");
  const projectId = await createProject(request);
  const issueId = await createIssue(request, projectId, {
    title: "元のタイトル",
    body: "元の本文",
  });
  const url = `/projects/${projectId}/issues/${issueId}`;
  await gotoHydrated(page, url);
  await expect(page.getByTestId("issue-priority")).toHaveText("中");

  await openEdit(page);
  await page.getByLabel("タイトル").fill("  ");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByRole("alert")).toHaveText("タイトルを入力してください");

  await page.getByLabel("タイトル").fill("新しいタイトル");
  await page.getByLabel("本文").fill("新しい本文\n2行目");
  await page.getByLabel("ステータス").selectOption({ label: "対応中" });
  await page.getByLabel("担当者").selectOption({ label: sato.name });
  await page.getByLabel("優先度").selectOption({ label: "高" });
  await page.getByLabel("期限日").fill("2099-12-31");
  await page.getByRole("button", { name: "保存" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "新しいタイトル" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "新しいタイトル" })).toBeVisible();
  await expect(page.getByTestId("issue-body")).toHaveText("新しい本文\n2行目");
  await expect(page.getByTestId("issue-status")).toHaveText("対応中");
  await expect(page.getByTestId("issue-assignee")).toHaveText(sato.name);
  await expect(page.getByTestId("issue-priority")).toHaveText("高");
  await expect(page.getByTestId("issue-due")).toHaveText("2099-12-31");
  await expect(page.getByTestId("issue-overdue")).toHaveCount(0);

  await gotoHydrated(page, `/projects/${projectId}/issues`);
  const row = page.getByTestId("issue-row").filter({ hasText: "新しいタイトル" });
  await expect(row.getByTestId("issue-assignee")).toHaveText(sato.name);
  await expect(row.getByTestId("issue-priority")).toHaveText("高");
  await expect(row.getByTestId("issue-due")).toHaveText("2099-12-31");

  // Clearing optional fields
  await gotoHydrated(page, url);
  await openEdit(page);
  await page.getByLabel("担当者").selectOption({ label: "未設定" });
  await page.getByLabel("期限日").fill("");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByTestId("issue-assignee")).toHaveText("-");
  await page.reload();
  await expect(page.getByTestId("issue-assignee")).toHaveText("-");
  await expect(page.getByTestId("issue-due")).toHaveText("-");
});

test("marks unresolved issues past their due date as overdue", async ({ page, request }) => {
  const projectId = await createProject(request);
  const overdue = await createIssue(request, projectId, {
    title: "期限切れ",
    dueDate: isoDate(-1),
  });
  await createIssue(request, projectId, { title: "今日まで", dueDate: isoDate(0) });
  await createIssue(request, projectId, {
    title: "解決済み",
    dueDate: isoDate(-5),
    status: "resolved",
  });

  await gotoHydrated(page, `/projects/${projectId}/issues?status=`);
  const rowOf = (title: string) => page.getByTestId("issue-row").filter({ hasText: title });
  await expect(rowOf("期限切れ").getByTestId("issue-overdue")).toBeVisible();
  await expect(rowOf("今日まで").getByTestId("issue-overdue")).toHaveCount(0);
  await expect(rowOf("解決済み")).toBeVisible();
  await expect(rowOf("解決済み").getByTestId("issue-overdue")).toHaveCount(0);

  await gotoHydrated(page, `/projects/${projectId}/issues/${overdue}`);
  await expect(page.getByTestId("issue-overdue")).toBeVisible();
});

test("deletes an issue after confirmation", async ({ page, request }) => {
  const projectId = await createProject(request);
  const issueId = await createIssue(request, projectId, { title: "消す課題" });
  await gotoHydrated(page, `/projects/${projectId}/issues/${issueId}`);

  page.once("dialog", (dialog) => void dialog.dismiss());
  await page.getByRole("button", { name: "削除" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "消す課題" })).toBeVisible();

  let message = "";
  page.once("dialog", (dialog) => {
    message = dialog.message();
    void dialog.accept();
  });
  await page.getByRole("button", { name: "削除" }).click();
  await expect(page).toHaveURL(`/projects/${projectId}/issues`);
  expect(message).toContain("消す課題");
  await expect(page.getByText("消す課題")).toHaveCount(0);
  expect((await page.goto(`/projects/${projectId}/issues/${issueId}`))?.status()).toBe(404);
});

test("the API validates issue updates", async ({ request }) => {
  const projectId = await createProject(request);
  const issueId = await createIssue(request, projectId, { title: "t" });
  const url = `/api/projects/${projectId}/issues/${issueId}`;
  for (const data of [{ title: " " }, { priority: "x" }, { status: "x" }, { dueDate: "x" }]) {
    expect((await request.patch(url, { data })).status(), JSON.stringify(data)).toBe(400);
  }
  const other = await createProject(request);
  expect((await request.delete(`/api/projects/${other}/issues/${issueId}`)).status()).toBe(404);
});
