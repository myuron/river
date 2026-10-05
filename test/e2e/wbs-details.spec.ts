import { expect, type Page, test } from "@playwright/test";
import { createProject, gotoHydrated } from "./support/app";
import { addChild, addTopLevel, wbsRow } from "./support/wbs";

async function openDetails(page: Page, title: string) {
  await wbsRow(page, title).getByRole("button", { name: "詳細" }).click();
}

async function saveDetails(page: Page) {
  await page.getByRole("button", { name: "詳細を保存" }).click();
}

test("sets task details that persist and show in the tree", async ({ page, request }) => {
  const projectId = await createProject(request);
  await gotoHydrated(page, `/projects/${projectId}`);
  await addTopLevel(page, "実装");
  const row = wbsRow(page, "実装");
  await expect(row.getByTestId("wbs-status")).toHaveText("未着手");

  await openDetails(page, "実装");
  await page.getByLabel("開始予定日").fill("2026-04-01");
  await page.getByLabel("終了予定日").fill("2026-04-10");
  await page.getByLabel("開始日", { exact: true }).fill("2026-04-02");
  await page.getByLabel("終了日", { exact: true }).fill("2026-04-09");
  await page.getByLabel("担当者").fill("山田");
  await page.getByLabel("ステータス").selectOption({ label: "進行中" });
  await page.getByLabel("見積工数（時間）").fill("12.5");
  await saveDetails(page);

  await expect(row.getByTestId("wbs-period")).toHaveText("2026-04-01〜2026-04-10");
  await expect(row.getByTestId("wbs-assignee")).toHaveText("山田");
  await expect(row.getByTestId("wbs-status")).toHaveText("進行中");
  await expect(row.getByTestId("wbs-estimate")).toHaveText("12.5h");

  await page.reload();
  await expect(row.getByTestId("wbs-period")).toHaveText("2026-04-01〜2026-04-10");
  await expect(row.getByTestId("wbs-estimate")).toHaveText("12.5h");
  await openDetails(page, "実装");
  await expect(page.getByLabel("開始日", { exact: true })).toHaveValue("2026-04-02");
  await expect(page.getByLabel("終了日", { exact: true })).toHaveValue("2026-04-09");

  // Clearing optional fields
  await page.getByLabel("担当者").fill("");
  await page.getByLabel("見積工数（時間）").fill("");
  await saveDetails(page);
  await expect(row.getByTestId("wbs-assignee")).toHaveText("-");
  await expect(row.getByTestId("wbs-estimate")).toHaveText("-");
});

test("rejects reversed dates and invalid estimates", async ({ page, request }) => {
  const projectId = await createProject(request);
  await gotoHydrated(page, `/projects/${projectId}`);
  await addTopLevel(page, "検証");
  await openDetails(page, "検証");

  await page.getByLabel("開始予定日").fill("2026-04-10");
  await page.getByLabel("終了予定日").fill("2026-04-01");
  await saveDetails(page);
  await expect(page.getByRole("alert")).toHaveText("終了予定日は開始予定日以降にしてください");

  await page.getByLabel("終了予定日").fill("2026-04-10");
  await page.getByLabel("開始日", { exact: true }).fill("2026-04-05");
  await page.getByLabel("終了日", { exact: true }).fill("2026-04-04");
  await saveDetails(page);
  await expect(page.getByRole("alert")).toHaveText("終了日は開始日以降にしてください");

  await page.getByLabel("終了日", { exact: true }).fill("");
  for (const bad of ["-1", "abc"]) {
    await page.getByLabel("見積工数（時間）").fill(bad);
    await saveDetails(page);
    await expect(page.getByRole("alert")).toHaveText("見積工数は0以上の数値で入力してください");
  }
});

test("a parent shows the sum of its descendants' estimates", async ({ page, request }) => {
  const projectId = await createProject(request);
  await gotoHydrated(page, `/projects/${projectId}`);
  await addTopLevel(page, "親");
  await addChild(page, "親", "子A");
  await addChild(page, "親", "子B");
  await addChild(page, "親", "子C");
  for (const [title, hours] of [
    ["子A", "3"],
    ["子B", "5"],
  ] as const) {
    await openDetails(page, title);
    await page.getByLabel("見積工数（時間）").fill(hours);
    await saveDetails(page);
    await expect(wbsRow(page, title).getByTestId("wbs-estimate")).toHaveText(`${hours}h`);
  }
  await expect(wbsRow(page, "親").getByTestId("wbs-estimate")).toHaveText("8h");
  await expect(wbsRow(page, "子C").getByTestId("wbs-estimate")).toHaveText("-");
});

test("the API validates detail fields", async ({ request }) => {
  const projectId = await createProject(request);
  const created = await request.post(`/api/projects/${projectId}/tasks`, { data: { title: "t" } });
  const task = (await created.json()) as { id: number; status: string };
  expect(task.status).toBe("todo");
  const url = `/api/projects/${projectId}/tasks/${task.id}`;

  expect((await request.patch(url, { data: { plannedStart: "2026-05-02" } })).status()).toBe(200);
  // Order is checked against the stored start date too
  expect((await request.patch(url, { data: { plannedEnd: "2026-05-01" } })).status()).toBe(400);
  for (const data of [
    { estimateHours: -2 },
    { status: "x" },
    { actualStart: "2026-13-01" },
    "abc",
  ]) {
    expect((await request.patch(url, { data })).status()).toBe(400);
  }
});

test("a parent's estimate is not editable", async ({ page, request }) => {
  const projectId = await createProject(request);
  await gotoHydrated(page, `/projects/${projectId}`);
  await addTopLevel(page, "親");
  await addChild(page, "親", "子");
  await expect(wbsRow(page, "親").getByTestId("wbs-estimate")).toHaveText("0h");
  await openDetails(page, "親");
  await expect(page.getByLabel("見積工数（時間）")).toBeDisabled();
  await expect(page.getByText("子タスクの合計が表示されます")).toBeVisible();
});
