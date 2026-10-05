import { expect, test } from "@playwright/test";
import { createProject, gotoHydrated } from "./support/app";
import { addChild, addTopLevel, wbsRows } from "./support/wbs";

test("builds a nested WBS that survives reload", async ({ page, request }) => {
  const projectId = await createProject(request);
  await gotoHydrated(page, `/projects/${projectId}`);
  await expect(page.getByText("タスクがまだありません")).toBeVisible();

  await addTopLevel(page, "設計");
  await addChild(page, "設計", "要件定義");
  await addChild(page, "設計", "基本設計");
  await addChild(page, "基本設計", "画面設計");
  await addChild(page, "画面設計", "一覧画面");
  await addChild(page, "一覧画面", "検索条件");
  await addTopLevel(page, "実装");

  const expected = [
    "1 設計",
    "1.1 要件定義",
    "1.2 基本設計",
    "1.2.1 画面設計",
    "1.2.1.1 一覧画面",
    "1.2.1.1.1 検索条件",
    "2 実装",
  ];
  expect(await wbsRows(page)).toEqual(expected);

  await page.reload();
  expect(await wbsRows(page)).toEqual(expected);
});

test("rejects blank task titles", async ({ page, request }) => {
  const projectId = await createProject(request);
  await gotoHydrated(page, `/projects/${projectId}`);
  await page.getByLabel("タスク名", { exact: true }).fill("  ");
  await page.getByRole("button", { name: "タスクを追加", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("タイトルを入力してください");

  await addTopLevel(page, "親");
  await page.getByRole("button", { name: "子タスクを追加" }).click();
  await page.getByRole("button", { name: "追加", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("タイトルを入力してください");
  expect(await wbsRows(page)).toEqual(["1 親"]);
});

test("does not show tasks of other projects", async ({ page, request }) => {
  const other = await createProject(request);
  const seeded = await request.post(`/api/projects/${other}/tasks`, {
    data: { title: "他プロジェクトのタスク" },
  });
  expect(seeded.status()).toBe(201);
  const projectId = await createProject(request);
  await gotoHydrated(page, `/projects/${projectId}`);
  await expect(page.getByText("タスクがまだありません")).toBeVisible();
  await expect(page.getByText("他プロジェクトのタスク")).toHaveCount(0);
});

test("the API rejects invalid parents and blank titles", async ({ request }) => {
  const other = await createProject(request);
  const parent = await request.post(`/api/projects/${other}/tasks`, { data: { title: "p" } });
  const parentId = ((await parent.json()) as { id: number }).id;
  const projectId = await createProject(request);
  for (const bad of [parentId, 99999999999, "1"]) {
    const response = await request.post(`/api/projects/${projectId}/tasks`, {
      data: { title: "child", parentId: bad },
    });
    expect(response.status()).toBe(400);
  }
  const blank = await request.post(`/api/projects/${projectId}/tasks`, { data: { title: "  " } });
  expect(blank.status()).toBe(400);
});
