import { expect, test } from "@playwright/test";
import { gotoHydrated, uniqueName } from "./support/app";

test("creates a project that persists and opens its detail page", async ({ page }) => {
  const name = uniqueName("プロジェクト");
  await gotoHydrated(page, "/");
  await page.getByLabel("プロジェクト名").fill(name);
  await page.getByRole("button", { name: "作成" }).click();
  await expect(page.getByRole("link", { name })).toBeVisible();

  await page.reload();
  await page.getByRole("link", { name }).click();
  await expect(page).toHaveURL(/\/projects\/\d+$/);
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
});

test("shows an error for a blank project name", async ({ page }) => {
  await gotoHydrated(page, "/");
  await page.getByLabel("プロジェクト名").fill("   ");
  await page.getByRole("button", { name: "作成" }).click();
  await expect(page.getByRole("alert")).toHaveText("プロジェクト名を入力してください");
});

test("the API rejects a blank project name", async ({ request }) => {
  const response = await request.post("/api/projects", { data: { name: " " } });
  expect(response.status()).toBe(400);
});

test("a missing project is a 404", async ({ page }) => {
  for (const id of ["999999999", "abc"]) {
    const response = await page.goto(`/projects/${id}`);
    expect(response?.status()).toBe(404);
  }
});
