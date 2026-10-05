import { registerEndpoint } from "@nuxt/test-utils/runtime";

// Pages require a logged-in user (app/middleware/auth.global.ts).
registerEndpoint("/api/auth/me", () => ({
  user: { id: 1, name: "テストユーザー", email: "test@example.com" },
}));

// Registered users offered as assignees.
registerEndpoint("/api/users", () => [
  { id: 1, name: "佐藤" },
  { id: 2, name: "鈴木" },
]);
