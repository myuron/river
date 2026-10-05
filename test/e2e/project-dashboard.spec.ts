import { expect, type Page, test } from "@playwright/test";
import { createIssue, createProject, createTask, gotoHydrated, isoDate } from "./support/app";

async function openDashboard(page: Page, projectId: number) {
  await gotoHydrated(page, `/projects/${projectId}`);
  await page.getByRole("link", { name: "ダッシュボード" }).click();
  await expect(page).toHaveURL(`/projects/${projectId}/dashboard`);
}

test("summarizes leaf task progress and lists delayed tasks", async ({ page, request }) => {
  const projectId = await createProject(request);
  const parent = await createTask(request, projectId, { title: "設計", status: "done" });
  await createTask(request, projectId, {
    title: "要件定義",
    parentId: parent,
    status: "done",
    estimateHours: 3,
    plannedEnd: isoDate(-10),
  });
  await createTask(request, projectId, {
    title: "基本設計",
    parentId: parent,
    status: "in_progress",
    estimateHours: 6,
    plannedEnd: isoDate(-2),
    assignee: "佐藤",
  });
  await createTask(request, projectId, { title: "実装", plannedEnd: isoDate(-5) });
  await createTask(request, projectId, { title: "テスト", plannedEnd: isoDate(0) });

  // Tasks in other projects are not counted.
  const other = await createProject(request);
  await createTask(request, other, { title: "他", plannedEnd: isoDate(-1) });

  await openDashboard(page, projectId);
  await expect(page.getByTestId("leaf-total")).toHaveText("4");
  await expect(page.getByTestId("leaf-todo")).toHaveText("2");
  await expect(page.getByTestId("leaf-in_progress")).toHaveText("1");
  await expect(page.getByTestId("leaf-done")).toHaveText("1");
  await expect(page.getByTestId("count-rate")).toHaveText("25%");
  await expect(page.getByTestId("hours-rate")).toHaveText("33%");

  const rows = page.getByTestId("delayed-row");
  await expect(rows.getByTestId("delayed-title")).toHaveText(["実装", "基本設計"]);
  await expect(rows.getByTestId("delayed-assignee")).toHaveText(["-", "佐藤"]);
  await expect(rows.getByTestId("delayed-end")).toHaveText([isoDate(-5), isoDate(-2)]);
  await expect(rows.getByTestId("delayed-days")).toHaveText(["5日", "2日"]);
});

test("shows empty states for a project without tasks", async ({ page, request }) => {
  const projectId = await createProject(request);
  await openDashboard(page, projectId);
  await expect(page.getByText("WBSタスクがまだありません")).toBeVisible();
  await expect(page.getByTestId("count-rate")).toHaveText("-");
  await expect(page.getByTestId("hours-rate")).toHaveText("-");
  await expect(page.getByText("遅延しているタスクはありません")).toBeVisible();
});

test("shows '-' for the hours rate when no estimates are set", async ({ page, request }) => {
  const projectId = await createProject(request);
  await createTask(request, projectId, { title: "見積なし", status: "done" });
  await openDashboard(page, projectId);
  await expect(page.getByTestId("count-rate")).toHaveText("100%");
  await expect(page.getByTestId("hours-rate")).toHaveText("-");
});

test("a missing project's dashboard is a 404", async ({ page }) => {
  expect((await page.goto("/projects/999999999/dashboard"))?.status()).toBe(404);
});

test("summarizes issues and lists overdue ones", async ({ page, request }) => {
  const projectId = await createProject(request);
  await createIssue(request, projectId, {
    title: "高・期限切れ",
    priority: "high",
    dueDate: isoDate(-1),
    assignee: "佐藤",
  });
  await createIssue(request, projectId, {
    title: "中・対応中・古い期限",
    status: "in_progress",
    dueDate: isoDate(-7),
  });
  await createIssue(request, projectId, {
    title: "解決済み",
    status: "resolved",
    priority: "high",
    dueDate: isoDate(-30),
  });
  await createIssue(request, projectId, {
    title: "低・今日まで",
    priority: "low",
    dueDate: isoDate(0),
  });
  const other = await createProject(request);
  await createIssue(request, other, {
    title: "他プロジェクト",
    priority: "high",
    dueDate: isoDate(-3),
  });

  await openDashboard(page, projectId);
  await expect(page.getByTestId("issues-open")).toHaveText("2");
  await expect(page.getByTestId("issues-in_progress")).toHaveText("1");
  await expect(page.getByTestId("issues-resolved")).toHaveText("1");
  await expect(page.getByTestId("issues-priority-high")).toHaveText("1");
  await expect(page.getByTestId("issues-priority-medium")).toHaveText("1");
  await expect(page.getByTestId("issues-priority-low")).toHaveText("1");

  const rows = page.getByTestId("overdue-issue-row");
  await expect(rows.getByTestId("overdue-issue-title")).toHaveText([
    "中・対応中・古い期限",
    "高・期限切れ",
  ]);
  await expect(rows.getByTestId("overdue-issue-assignee")).toHaveText(["-", "佐藤"]);
  await expect(rows.getByTestId("overdue-issue-priority")).toHaveText(["中", "高"]);
  await expect(rows.getByTestId("overdue-issue-due")).toHaveText([isoDate(-7), isoDate(-1)]);

  // Clicking anywhere on the row opens the issue.
  await rows.last().getByTestId("overdue-issue-due").click();
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/issues/\\d+$`));
  await expect(page.getByRole("heading", { level: 1, name: "高・期限切れ" })).toBeVisible();
});

test("shows zero issue counts for a project without issues", async ({ page, request }) => {
  const projectId = await createProject(request);
  await openDashboard(page, projectId);
  for (const id of [
    "issues-open",
    "issues-in_progress",
    "issues-resolved",
    "issues-priority-high",
  ]) {
    await expect(page.getByTestId(id)).toHaveText("0");
  }
  await expect(page.getByText("期限切れの課題はありません")).toBeVisible();
});
