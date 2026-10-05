import { registerEndpoint } from "@nuxt/test-utils/runtime";

// Pages require a logged-in user (app/middleware/auth.global.ts).
registerEndpoint("/api/auth/me", () => ({
  user: { id: 1, name: "テストユーザー", email: "test@example.com" },
}));
