/** Session of the user signed up by auth.setup.ts (git-ignored). */
export const AUTH_STATE = "test/e2e/.auth/user.json";

/** Logged-out state for specs that exercise signup/login. */
export const LOGGED_OUT = { cookies: [], origins: [] };

export function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}
