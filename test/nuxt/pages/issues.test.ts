import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it } from "vitest";
import { clearNuxtData, useState } from "#imports";
import IssuesPage from "~/pages/projects/[id]/issues/index.vue";

let issues: unknown[] = [];

const issue = (fields: Record<string, unknown>) => ({
  projectId: 1,
  body: "",
  status: "open",
  assignee: null,
  priority: "medium",
  dueDate: null,
  createdAt: "2026-01-01T00:00:00Z",
  ...fields,
});

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
      issue({
        id: 7,
        title: "新しい課題",
        status: "in_progress",
        createdAt: "2026-01-02T03:04:00Z",
      }),
      issue({ id: 3, title: "古い課題" }),
    ];
    const wrapper = await mountSuspended(IssuesPage, { route: "/projects/1/issues" });
    const rows = wrapper.findAll("[data-testid=issue-row]");
    expect(rows.map((r) => r.find("a").text())).toEqual(["新しい課題", "古い課題"]);
    expect(rows[0]!.text()).toContain("対応中");
    expect(rows[1]!.text()).toContain("未対応");
    expect(rows[0]!.find("a").attributes("href")).toBe("/projects/1/issues/7");
    expect(rows[0]!.find("time").attributes("datetime")).toBe("2026-01-02T03:04:00.000Z");
  });

  it("shows assignee, priority and due date, and flags overdue unresolved issues", async () => {
    useState("today").value = "2026-04-10";
    issues = [
      issue({
        id: 1,
        title: "期限切れ",
        assignee: { id: 1, name: "佐藤" },
        priority: "high",
        dueDate: "2026-04-09",
      }),
      issue({
        id: 2,
        title: "解決済み",
        status: "resolved",
        priority: "low",
        dueDate: "2026-04-01",
      }),
      issue({ id: 3, title: "未設定" }),
    ];
    const wrapper = await mountSuspended(IssuesPage, { route: "/projects/1/issues?status=" });
    const rows = wrapper.findAll("[data-testid=issue-row]");
    const cell = (i: number, id: string) => rows[i]!.find(`[data-testid=${id}]`).text();

    expect([cell(0, "issue-assignee"), cell(0, "issue-priority"), cell(0, "issue-due")]).toEqual([
      "佐藤",
      "高",
      "2026-04-09",
    ]);
    expect([cell(2, "issue-assignee"), cell(2, "issue-priority"), cell(2, "issue-due")]).toEqual([
      "-",
      "中",
      "-",
    ]);
    // useToday() switches to the real date on mount, which is well after these due dates.
    expect(rows[0]!.classes()).toContain("overdue");
    expect(rows[0]!.find("[data-testid=issue-overdue]").exists()).toBe(true);
    expect(rows[1]!.find("[data-testid=issue-overdue]").exists()).toBe(false);
    expect(rows[2]!.find("[data-testid=issue-overdue]").exists()).toBe(false);
  });
});

describe("issue list filters", () => {
  beforeEach(() => {
    clearNuxtData();
    issues = [
      issue({ id: 1, title: "未対応の課題" }),
      issue({
        id: 2,
        title: "対応中の課題",
        status: "in_progress",
        assignee: { id: 1, name: "佐藤" },
      }),
      issue({ id: 3, title: "解決した課題", status: "resolved", priority: "high" }),
    ];
  });

  const titles = (wrapper: { findAll: (selector: string) => { text: () => string }[] }) =>
    wrapper.findAll("[data-testid=issue-title]").map((a) => a.text());

  it("shows only open and in-progress issues by default, with a count", async () => {
    const wrapper = await mountSuspended(IssuesPage, { route: "/projects/1/issues" });
    expect(titles(wrapper)).toEqual(["未対応の課題", "対応中の課題"]);
    expect(wrapper.find("[data-testid=issue-count]").text()).toBe("2件");
  });

  it("applies the conditions in the query", async () => {
    const wrapper = await mountSuspended(IssuesPage, {
      route: "/projects/1/issues?status=&priority=high",
    });
    expect(titles(wrapper)).toEqual(["解決した課題"]);
  });

  it("offers registered users plus 未割り当て", async () => {
    const wrapper = await mountSuspended(IssuesPage, { route: "/projects/1/issues" });
    const options = wrapper.findAll("select option").map((o) => o.text());
    expect(options).toEqual(["すべて", "佐藤", "鈴木", "未割り当て"]);
  });

  it("distinguishes 'no match' from 'no issues'", async () => {
    const wrapper = await mountSuspended(IssuesPage, {
      route: "/projects/1/issues?status=&unassigned=1&priority=low",
    });
    expect(wrapper.text()).toContain("条件に一致する課題はありません");
    expect(wrapper.text()).not.toContain("課題がまだありません");
    expect(wrapper.find("[data-testid=issue-count]").text()).toBe("0件");
  });
});

describe("issue list edge cases", () => {
  beforeEach(() => {
    clearNuxtData();
    issues = [issue({ id: 1, title: "課題", assignee: { id: 1, name: "佐藤" } })];
  });

  it("filters by the assignee's user id from the URL", async () => {
    issues = [...issues, issue({ id: 2, title: "鈴木の課題", assignee: { id: 2, name: "鈴木" } })];
    const wrapper = await mountSuspended(IssuesPage, { route: "/projects/1/issues?assignee=2" });
    const select = wrapper.find("select").element as HTMLSelectElement;
    expect(select.value).toBe("2");
    expect(wrapper.findAll("[data-testid=issue-title]").map((a) => a.text())).toEqual([
      "鈴木の課題",
    ]);
  });
});

describe("issue list unknown assignee", () => {
  beforeEach(() => {
    clearNuxtData();
    issues = [issue({ id: 1, title: "課題" })];
  });

  it("shows a user id from the URL that is no longer registered as 不明なユーザー", async () => {
    const wrapper = await mountSuspended(IssuesPage, { route: "/projects/1/issues?assignee=999" });
    const select = wrapper.find("select").element as HTMLSelectElement;
    expect(select.value).toBe("999");
    expect(select.selectedOptions[0]?.text).toBe("不明なユーザー");
    expect(wrapper.text()).toContain("条件に一致する課題はありません");
  });
});
