import { expect, test } from "@playwright/test";
import { createProject, gotoHydrated } from "./support/app";
import { AUTH_STATE, LOGGED_OUT, uniqueEmail } from "./support/auth";
import { withDb } from "./support/db";

test.use({ storageState: LOGGED_OUT });

const PASSWORD = "password123";

test("signs up, stays logged in across reloads and logs out", async ({ page }) => {
  const email = uniqueEmail();
  await gotoHydrated(page, "/signup");
  await page.getByLabel("表示名").fill("山田 太郎");
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード（8文字以上）").fill(PASSWORD);
  await page.getByRole("button", { name: "登録" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByTestId("current-user")).toHaveText("山田 太郎");
  await page.reload();
  await expect(page.getByTestId("current-user")).toHaveText("山田 太郎");

  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
  await page.getByRole("button", { name: "ログアウト" }).click();
  await expect(page).toHaveURL("/login");
  await page.goto("/");
  await expect(page).toHaveURL(/\/login\?redirect=/);
});

test("validates signup input", async ({ page, request }) => {
  const taken = uniqueEmail();
  expect(
    (
      await request.post("/api/auth/signup", {
        data: { name: "既存", email: taken, password: PASSWORD },
      })
    ).status(),
  ).toBe(201);
  // Use a fresh, logged-out page (the request above set a cookie on its own context only).
  await gotoHydrated(page, "/signup");
  const fill = async (name: string, email: string, password: string) => {
    await page.getByLabel("表示名").fill(name);
    await page.getByLabel("メールアドレス").fill(email);
    await page.getByLabel("パスワード（8文字以上）").fill(password);
    await page.getByRole("button", { name: "登録" }).click();
  };
  const alert = page.getByRole("alert");

  await fill(" ", uniqueEmail(), PASSWORD);
  await expect(alert).toHaveText("表示名を入力してください");
  await fill("名前", "", PASSWORD);
  await expect(alert).toHaveText("メールアドレスを入力してください");
  await fill("名前", "not-an-email", PASSWORD);
  await expect(alert).toHaveText("メールアドレスの形式が正しくありません");
  await fill("名前", uniqueEmail(), "short");
  await expect(alert).toHaveText("パスワードは8文字以上で入力してください");
  await fill("名前", taken.toUpperCase(), PASSWORD);
  await expect(alert).toHaveText("このメールアドレスは既に登録されています");
  await expect(page).toHaveURL("/signup");
});

test("logs in, rejects wrong credentials without saying which, and returns to the original page", async ({
  browser,
  page,
}) => {
  const email = uniqueEmail();
  // Sign up in a separate context, then log in from a logged-out page.
  const other = await browser.newContext({ storageState: LOGGED_OUT });
  expect(
    (
      await other.request.post("/api/auth/signup", {
        data: { name: "ログイン確認", email, password: PASSWORD },
      })
    ).status(),
  ).toBe(201);
  const projectId = await createProject(other.request, "戻り先プロジェクト");
  await other.close();

  const response = await page.goto(`/projects/${projectId}`);
  expect(response?.ok()).toBe(true);
  await expect(page).toHaveURL(/\/login\?redirect=/);
  expect(new URL(page.url()).searchParams.get("redirect")).toBe(`/projects/${projectId}`);
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });

  const alert = page.getByRole("alert");
  for (const [mail, password] of [
    [email, "wrong-password"],
    [uniqueEmail(), PASSWORD],
  ] as const) {
    await page.getByLabel("メールアドレス").fill(mail);
    await page.getByLabel("パスワード").fill(password);
    await page.getByRole("button", { name: "ログイン" }).click();
    await expect(alert).toHaveText("メールアドレスまたはパスワードが正しくありません");
  }

  await page.getByLabel("メールアドレス").fill(email.toUpperCase());
  await page.getByLabel("パスワード").fill(PASSWORD);
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page).toHaveURL(`/projects/${projectId}`);
  await expect(page.getByRole("heading", { level: 1, name: "戻り先プロジェクト" })).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("current-user")).toHaveText("ログイン確認");
});

test("APIs other than auth return 401 without a session", async ({ request }) => {
  for (const url of ["/api/projects", "/api/projects/1/tasks", "/api/projects/1/issues"]) {
    expect((await request.get(url)).status(), url).toBe(401);
  }
  expect((await request.post("/api/projects", { data: { name: "x" } })).status()).toBe(401);
  expect((await request.get("/api/auth/me")).status()).toBe(200);
});

test("stores only a password hash", async ({ request }) => {
  const email = uniqueEmail();
  const response = await request.post("/api/auth/signup", {
    data: { name: "平文確認", email, password: PASSWORD },
  });
  expect(response.status()).toBe(201);
  expect(JSON.stringify(await response.json())).not.toContain(PASSWORD);

  const [row] = await withDb((sql) => sql`select password_hash from users where email = ${email}`);
  expect(row!.password_hash).toMatch(/^scrypt\$/);
  expect(row!.password_hash).not.toContain(PASSWORD);
});

test("rejects auth and API writes coming from another site", async ({ request }) => {
  const crossSite = { origin: "https://evil.example", "sec-fetch-site": "cross-site" };
  const login = await request.post("/api/auth/login", {
    headers: { ...crossSite, "content-type": "application/x-www-form-urlencoded" },
    data: "email=a%40b.jp&password=password123",
  });
  expect(login.status()).toBe(403);
  expect(login.headers()["set-cookie"]).toBeUndefined();
  const signup = await request.post("/api/auth/signup", {
    headers: { origin: "https://evil.example" },
    data: { name: "x", email: uniqueEmail(), password: PASSWORD },
  });
  expect(signup.status()).toBe(403);
});

test.describe("with a session", () => {
  test.use({ storageState: AUTH_STATE });

  test("rejects cross-site writes to regular APIs even when logged in", async ({ request }) => {
    const response = await request.post("/api/projects", {
      headers: { origin: "https://evil.example", "sec-fetch-site": "cross-site" },
      data: { name: "CSRF" },
    });
    expect(response.status()).toBe(403);
  });
});
