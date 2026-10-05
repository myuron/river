import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { createError } from "h3";
import { describe, expect, it } from "vitest";
import IssuesPage from "~/pages/projects/[id]/issues/index.vue";

registerEndpoint("/api/projects/1", () => ({
  id: 1,
  name: "PJ",
  createdAt: "2026-01-01T00:00:00Z",
}));
registerEndpoint("/api/projects/1/issues", () => {
  throw createError({ statusCode: 500 });
});

describe("issue list load failure", () => {
  it("shows a load error instead of the empty message", async () => {
    const wrapper = await mountSuspended(IssuesPage, { route: "/projects/1/issues" });
    expect(wrapper.text()).toContain("課題を読み込めませんでした");
    expect(wrapper.text()).not.toContain("課題がまだありません");
  });
});
