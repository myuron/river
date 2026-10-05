import { describe, expect, it } from "vitest";
import { compareDatesNullsLast, deadlineState, summarizeMyWork } from "../../shared/utils/my-work";

describe("compareDatesNullsLast", () => {
  it("orders dates ascending with unset dates last", () => {
    const dates = ["2026-05-03", null, "2026-04-30", null, "2026-05-01"];
    expect([...dates].sort(compareDatesNullsLast)).toEqual([
      "2026-04-30",
      "2026-05-01",
      "2026-05-03",
      null,
      null,
    ]);
  });
});

describe("deadlineState", () => {
  const today = "2026-04-10";

  it("is overdue before today", () => {
    expect(deadlineState("2026-04-09", today)).toBe("overdue");
  });

  it("is due soon from today up to 7 days ahead", () => {
    expect(deadlineState(today, today)).toBe("soon");
    expect(deadlineState("2026-04-17", today)).toBe("soon");
  });

  it("is neither further out or without a date", () => {
    expect(deadlineState("2026-04-18", today)).toBeNull();
    expect(deadlineState(null, today)).toBeNull();
  });
});

describe("summarizeMyWork", () => {
  const today = "2026-04-10";

  it("counts zero for nothing assigned", () => {
    expect(summarizeMyWork([], [], today)).toEqual({
      taskCount: 0,
      issueCount: 0,
      overdueCount: 0,
      soonCount: 0,
    });
  });

  it("counts tasks, issues, overdue and due-soon items across both", () => {
    const tasks = [
      { plannedEnd: "2026-04-01" },
      { plannedEnd: "2026-04-12" },
      { plannedEnd: null },
    ];
    const issues = [{ dueDate: "2026-04-09" }, { dueDate: today }, { dueDate: "2026-05-01" }];
    expect(summarizeMyWork(tasks, issues, today)).toEqual({
      taskCount: 3,
      issueCount: 3,
      overdueCount: 2,
      soonCount: 2,
    });
  });
});
