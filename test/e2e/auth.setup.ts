import { expect, test as setup } from "@playwright/test";
import { AUTH_STATE, uniqueEmail } from "./support/auth";

// Signs up one user per run; every spec reuses its session via storageState.
setup("sign up the e2e user", async ({ request }) => {
  const response = await request.post("/api/auth/signup", {
    data: { name: "E2Eユーザー", email: uniqueEmail(), password: "password123" },
  });
  expect(response.status()).toBe(201);
  await request.storageState({ path: AUTH_STATE });
});
