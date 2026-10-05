import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it } from "vitest";
import { clearNuxtData } from "#imports";
import IssuesPage from "~/pages/projects/[id]/issues/index.vue";

let issues: unknown[] = [];

registerEndpoint("/api/projects/1", () => ({
  id: 1,
  name: "PJ",
  createdAt: "2026-01-01T00:00:00Z",
}));
registerEndpoint("/api/projects/1/issues", { method: "GET", handler: () => issues });

describe("issue list page", () => {
  beforeEach(() => {
    clearNuxtData();
    issues = [];
  });

  it("shows an empty message when there are no issues", async () => {
    const wrapper = await mountSuspended(IssuesPage, { route: "/projects/1/issues" });
    expect(wrapper.text()).toContain("課題がまだありません");
  });

  it("lists issues with their status, linking to the detail page", async () => {
    issues = [
      {
        id: 7,
        projectId: 1,
        title: "新しい課題",
        body: "",
        status: "in_progress",
        createdAt: "2026-01-02T03:04:00Z",
      },
      {
        id: 3,
        projectId: 1,
        title: "古い課題",
        body: "",
        status: "open",
        createdAt: "2026-01-01T00:00:00Z",
      },
    ];
    const wrapper = await mountSuspended(IssuesPage, { route: "/projects/1/issues" });
    const rows = wrapper.findAll("[data-testid=issue-row]");
    expect(rows.map((r) => r.find("a").text())).toEqual(["新しい課題", "古い課題"]);
    expect(rows[0]!.text()).toContain("対応中");
    expect(rows[1]!.text()).toContain("未対応");
    expect(rows[0]!.find("a").attributes("href")).toBe("/projects/1/issues/7");
    expect(rows[0]!.find("time").attributes("datetime")).toBe("2026-01-02T03:04:00.000Z");
  });
});
