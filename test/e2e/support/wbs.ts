import { expect, type Page } from "@playwright/test";

export function wbsRow(page: Page, title: string) {
  return page.getByTestId("wbs-row").filter({
    has: page.getByTestId("wbs-title").getByText(title, { exact: true }),
  });
}

export async function addTopLevel(page: Page, title: string) {
  await page.getByLabel("タスク名", { exact: true }).fill(title);
  await page.getByRole("button", { name: "タスクを追加", exact: true }).click();
  await expect(page.getByTestId("wbs-title").getByText(title, { exact: true })).toBeVisible();
}

export async function addChild(page: Page, parentTitle: string, title: string) {
  await wbsRow(page, parentTitle).first().getByRole("button", { name: "子タスクを追加" }).click();
  await page.getByLabel("子タスク名").fill(title);
  await page.getByRole("button", { name: "追加", exact: true }).click();
  await expect(page.getByTestId("wbs-title").getByText(title, { exact: true })).toBeVisible();
}

/** "<number> <title>" for every row, in display order. */
export async function wbsRows(page: Page) {
  const numbers = await page.getByTestId("wbs-number").allTextContents();
  const titles = await page.getByTestId("wbs-title").allTextContents();
  return numbers.map((n, i) => `${n} ${titles[i]}`);
}
