import { expect, test } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Nuxt/);
  await expect(page.getByRole("link", { name: /documentation/i }).first()).toBeVisible();
});
