import { expect, test } from "@playwright/test";
import { createProject, gotoHydrated } from "./support/app";
import { addChild, addTopLevel, wbsRow, wbsRows } from "./support/wbs";

test("edits a task title and keeps it after reload", async ({ page, request }) => {
  const projectId = await createProject(request);
  await gotoHydrated(page, `/projects/${projectId}`);
  await addTopLevel(page, "旧タイトル");

  await wbsRow(page, "旧タイトル").getByRole("button", { name: "編集" }).click();
  await page.getByLabel("新しいタイトル").fill("   ");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(page.getByRole("alert")).toHaveText("タイトルを入力してください");

  await page.getByLabel("新しいタイトル").fill("新タイトル");
  await page.getByRole("button", { name: "保存" }).click();
  await expect(wbsRow(page, "新タイトル")).toBeVisible();

  await page.reload();
  expect(await wbsRows(page)).toEqual(["1 新タイトル"]);
});

test("cancelling the delete confirmation keeps the task", async ({ page, request }) => {
  const projectId = await createProject(request);
  await gotoHydrated(page, `/projects/${projectId}`);
  await addTopLevel(page, "残すタスク");

  const dialogShown = new Promise<string>((resolve) => {
    page.once("dialog", (dialog) => {
      resolve(dialog.message());
      void dialog.dismiss();
    });
  });
  await wbsRow(page, "残すタスク").getByRole("button", { name: "削除" }).click();
  const message = await dialogShown;
  expect(message).toContain("「残すタスク」を削除しますか？");
  expect(message).not.toContain("配下のタスク");
  await expect(wbsRow(page, "残すタスク")).toBeVisible();

  await page.reload();
  expect(await wbsRows(page)).toEqual(["1 残すタスク"]);
});

test("deleting a parent removes its descendants and renumbers", async ({ page, request }) => {
  const projectId = await createProject(request);
  await gotoHydrated(page, `/projects/${projectId}`);
  await addTopLevel(page, "A");
  await addTopLevel(page, "B");
  await addChild(page, "B", "B-1");
  await addChild(page, "B-1", "B-1-1");
  await addTopLevel(page, "C");
  await addChild(page, "C", "C-1");

  let message = "";
  page.once("dialog", (dialog) => {
    message = dialog.message();
    void dialog.accept();
  });
  await wbsRow(page, "B").getByRole("button", { name: "削除" }).click();
  await expect(wbsRow(page, "B")).toHaveCount(0);
  expect(message).toContain("配下のタスク2件もすべて削除されます");

  const expected = ["1 A", "2 C", "2.1 C-1"];
  expect(await wbsRows(page)).toEqual(expected);
  await page.reload();
  expect(await wbsRows(page)).toEqual(expected);
});

test("the API rejects blank titles and unknown tasks", async ({ request }) => {
  const projectId = await createProject(request);
  const created = await request.post(`/api/projects/${projectId}/tasks`, { data: { title: "t" } });
  const taskId = ((await created.json()) as { id: number }).id;
  const otherProject = await createProject(request);

  const blank = await request.patch(`/api/projects/${projectId}/tasks/${taskId}`, {
    data: { title: " " },
  });
  expect(blank.status()).toBe(400);

  const wrongProject = await request.delete(`/api/projects/${otherProject}/tasks/${taskId}`);
  expect(wrongProject.status()).toBe(404);
  const missing = await request.patch(`/api/projects/${projectId}/tasks/999999999`, {
    data: { title: "x" },
  });
  expect(missing.status()).toBe(404);
});
