import { describe, expect, it } from "vitest";
import { summarizeIssues, summarizeWbs } from "../../shared/utils/dashboard";

const TODAY = "2026-04-10";

const task = (
  id: number,
  parentId: number | null,
  fields: Partial<{
    status: "todo" | "in_progress" | "done";
    estimateHours: number | null;
    plannedEnd: string | null;
    assignee: string | null;
  }> = {},
) => ({
  id,
  parentId,
  title: `t${id}`,
  status: "todo" as const,
  estimateHours: null,
  plannedEnd: null,
  assignee: null,
  ...fields,
});

describe("summarizeWbs", () => {
  it("has no rates when there are no tasks", () => {
    expect(summarizeWbs([], TODAY)).toEqual({
      leafCount: 0,
      byStatus: { todo: 0, in_progress: 0, done: 0 },
      countRate: null,
      hoursRate: null,
      delayed: [],
    });
  });

  it("counts only leaf tasks by status and computes rates", () => {
    const summary = summarizeWbs(
      [
        task(1, null, { status: "done" }), // parent: not counted
        task(2, 1, { status: "done", estimateHours: 3 }),
        task(3, 1, { status: "in_progress", estimateHours: 6 }),
        task(4, null, { status: "todo" }), // leaf without estimate
      ],
      TODAY,
    );
    expect(summary.leafCount).toBe(3);
    expect(summary.byStatus).toEqual({ todo: 1, in_progress: 1, done: 1 });
    expect(summary.countRate).toBe(33); // 1 / 3
    expect(summary.hoursRate).toBe(33); // 3 / 9
  });

  it("rounds rates to whole percents and has no hours rate without estimates", () => {
    const summary = summarizeWbs(
      [task(1, null, { status: "done" }), task(2, null, { status: "done" }), task(3, null)],
      TODAY,
    );
    expect(summary.countRate).toBe(67);
    expect(summary.hoursRate).toBeNull();
  });

  it("lists unfinished tasks past their planned end, oldest first, with days late", () => {
    const summary = summarizeWbs(
      [
        task(1, null, { plannedEnd: "2026-04-08", assignee: "佐藤" }),
        task(2, 1, { plannedEnd: "2026-04-01", status: "in_progress" }),
        task(3, null, { plannedEnd: "2026-04-05", status: "done" }), // finished
        task(4, null, { plannedEnd: TODAY }), // due today: not late
      ],
      TODAY,
    );
    expect(summary.delayed.map((d) => [d.task.id, d.number, d.daysLate])).toEqual([
      [2, "1.1", 9],
      [1, "1", 2],
    ]);
  });
});

describe("summarizeWbs delayed parents", () => {
  it("lists any unfinished overdue task, including parents", () => {
    const summary = summarizeWbs(
      [task(1, null, { plannedEnd: "2026-04-01" }), task(2, 1, { status: "done" })],
      TODAY,
    );
    expect(summary.delayed.map((d) => d.task.id)).toEqual([1]);
  });
});

describe("summarizeIssues", () => {
  const issue = (
    id: number,
    fields: Partial<{
      status: "open" | "in_progress" | "resolved";
      priority: "high" | "medium" | "low";
      dueDate: string | null;
    }> = {},
  ) => ({ id, status: "open" as const, priority: "medium" as const, dueDate: null, ...fields });

  it("counts zero for every bucket without issues", () => {
    expect(summarizeIssues([], TODAY)).toEqual({
      byStatus: { open: 0, in_progress: 0, resolved: 0 },
      unresolvedByPriority: { high: 0, medium: 0, low: 0 },
      overdue: [],
    });
  });

  it("counts by status, unresolved by priority, and lists overdue oldest first", () => {
    const summary = summarizeIssues(
      [
        issue(5, { status: "in_progress", dueDate: "2026-04-05" }),
        issue(2, { status: "in_progress", priority: "high", dueDate: "2026-04-01" }),
        issue(3, { status: "resolved", priority: "high", dueDate: "2026-03-01" }),
        issue(4, { priority: "low", dueDate: TODAY }),
        issue(1, { priority: "high", dueDate: "2026-04-05" }),
      ],
      TODAY,
    );
    expect(summary.byStatus).toEqual({ open: 2, in_progress: 2, resolved: 1 });
    expect(summary.unresolvedByPriority).toEqual({ high: 2, medium: 1, low: 1 });
    expect(summary.overdue.map((i) => i.id)).toEqual([2, 1, 5]);
  });
});
