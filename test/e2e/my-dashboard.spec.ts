import { expect, type Page, test } from "@playwright/test";
import {
  createIssue,
  createProject,
  createTask,
  createUsers,
  gotoHydrated,
  uniqueName,
} from "./support/app";
import { LOGGED_OUT, uniqueEmail } from "./support/auth";

// A fresh user per test: the shared e2e user collects assignments from every run.
test.use({ storageState: LOGGED_OUT });

async function signUp(page: Page) {
  const response = await page.request.post("/api/auth/signup", {
    data: { name: uniqueName("本人"), email: uniqueEmail(), password: "password123" },
  });
  expect(response.status()).toBe(201);
  return ((await response.json()) as { user: { id: number } }).user;
}

test("lists the user's unfinished tasks and unresolved issues across projects", async ({
  page,
  playwright,
}) => {
  const me = await signUp(page);
  const [other] = await createUsers(playwright, "他人");
  const request = page.request;

  const alpha = uniqueName("Alpha");
  const beta = uniqueName("Beta");
  const alphaId = await createProject(request, alpha);
  const betaId = await createProject(request, beta);

  const parent = await createTask(request, alphaId, { title: "設計" });
  await createTask(request, alphaId, {
    title: "画面設計",
    parentId: parent,
    assigneeId: me.id,
    status: "in_progress",
    plannedEnd: "2026-06-10",
  });
  await createTask(request, alphaId, { title: "期限なし", assigneeId: me.id });
  await createTask(request, betaId, {
    title: "API実装",
    assigneeId: me.id,
    plannedEnd: "2026-06-01",
  });
  await createTask(request, betaId, { title: "完了済み", assigneeId: me.id, status: "done" });
  await createTask(request, betaId, { title: "他人のタスク", assigneeId: other.id });
  await createTask(request, betaId, { title: "担当なし" });

  await createIssue(request, alphaId, { title: "期限なし課題", assigneeId: me.id });
  const urgent = await createIssue(request, betaId, {
    title: "急ぎの課題",
    assigneeId: me.id,
    priority: "high",
    status: "in_progress",
    dueDate: "2026-05-20",
  });
  await createIssue(request, alphaId, {
    title: "後の課題",
    assigneeId: me.id,
    dueDate: "2026-07-01",
  });
  await createIssue(request, alphaId, {
    title: "解決済み課題",
    assigneeId: me.id,
    status: "resolved",
  });
  await createIssue(request, alphaId, { title: "他人の課題", assigneeId: other.id });
  await createIssue(request, alphaId, { title: "担当なし課題" });

  await gotoHydrated(page, "/");
  await page
    .getByRole("navigation", { name: "メイン" })
    .getByRole("link", { name: "ダッシュボード" })
    .click();
  await expect(page).toHaveURL("/dashboard");

  const tasks = page.getByTestId("my-task-row");
  await expect(tasks.getByTestId("my-task-title")).toHaveText(["API実装", "画面設計", "期限なし"]);
  await expect(tasks.getByTestId("my-task-project")).toHaveText([beta, alpha, alpha]);
  await expect(tasks.getByTestId("my-task-number")).toHaveText(["1", "1.1", "2"]);
  await expect(tasks.getByTestId("my-task-status")).toHaveText(["未着手", "進行中", "未着手"]);
  await expect(tasks.getByTestId("my-task-end")).toHaveText(["2026-06-01", "2026-06-10", "-"]);

  const issues = page.getByTestId("my-issue-row");
  await expect(issues.getByTestId("my-issue-title")).toHaveText([
    "急ぎの課題",
    "後の課題",
    "期限なし課題",
  ]);
  await expect(issues.getByTestId("my-issue-project")).toHaveText([beta, alpha, alpha]);
  await expect(issues.getByTestId("issue-status")).toHaveText(["対応中", "未対応", "未対応"]);
  await expect(issues.getByTestId("my-issue-priority")).toHaveText(["高", "中", "中"]);
  await expect(issues.getByTestId("my-issue-due")).toHaveText(["2026-05-20", "2026-07-01", "-"]);

  await tasks.first().getByTestId("my-task-end").click();
  await expect(page).toHaveURL(`/projects/${betaId}`);

  await page.goBack();
  await issues.first().getByTestId("my-issue-due").click();
  await expect(page).toHaveURL(`/projects/${betaId}/issues/${urgent}`);
});

test("shows empty messages when nothing is assigned", async ({ page }) => {
  await signUp(page);
  await gotoHydrated(page, "/dashboard");
  await expect(page.getByText("担当中のタスクはありません")).toBeVisible();
  await expect(page.getByText("担当中の課題はありません")).toBeVisible();
});
