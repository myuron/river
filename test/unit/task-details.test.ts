import { describe, expect, it } from "vitest";
import { checkTaskDateOrder, parseTaskDetails } from "../../shared/utils/task-details";
import { buildWbsTree, estimateTotals } from "../../shared/utils/wbs";

describe("parseTaskDetails", () => {
  it("parses only the fields that are present", () => {
    expect(parseTaskDetails({ status: "done" })).toEqual({ ok: true, value: { status: "done" } });
  });

  it("normalizes empty values to null", () => {
    expect(
      parseTaskDetails({
        plannedStart: "",
        plannedEnd: null,
        assignee: "  ",
        estimateHours: "",
      }),
    ).toEqual({
      ok: true,
      value: { plannedStart: null, plannedEnd: null, assignee: null, estimateHours: null },
    });
  });

  it("accepts valid dates, trimmed assignees and non-negative estimates", () => {
    expect(
      parseTaskDetails({
        plannedStart: "2026-02-28",
        actualEnd: "2024-02-29",
        assignee: " 山田 ",
        estimateHours: "1.5",
      }),
    ).toEqual({
      ok: true,
      value: {
        plannedStart: "2026-02-28",
        actualEnd: "2024-02-29",
        assignee: "山田",
        estimateHours: 1.5,
      },
    });
    expect(parseTaskDetails({ estimateHours: 0 })).toEqual({
      ok: true,
      value: { estimateHours: 0 },
    });
  });

  it.each([
    [{ plannedStart: "2026-02-30" }, "日付の形式が正しくありません"],
    [{ actualStart: "2026/01/01" }, "日付の形式が正しくありません"],
    [{ status: "blocked" }, "ステータスが正しくありません"],
    [{ estimateHours: -1 }, "見積工数は0以上の数値で入力してください"],
    [{ estimateHours: "abc" }, "見積工数は0以上の数値で入力してください"],
    [{ estimateHours: "1e999" }, "見積工数は0以上の数値で入力してください"],
    [{ estimateHours: "0x10" }, "見積工数は0以上の数値で入力してください"],
    [{ estimateHours: "1e2" }, "見積工数は0以上の数値で入力してください"],
    [{ assignee: 3 }, "担当者が正しくありません"],
  ])("rejects %j", (input, message) => {
    expect(parseTaskDetails(input)).toEqual({ ok: false, message });
  });
});

describe("checkTaskDateOrder", () => {
  const empty = { plannedStart: null, plannedEnd: null, actualStart: null, actualEnd: null };

  it("allows same-day and partially set ranges", () => {
    expect(
      checkTaskDateOrder({ ...empty, plannedStart: "2026-01-01", plannedEnd: "2026-01-01" }),
    ).toBeNull();
    expect(checkTaskDateOrder({ ...empty, plannedEnd: "2026-01-01" })).toBeNull();
  });

  it("rejects an end before its start", () => {
    expect(
      checkTaskDateOrder({ ...empty, plannedStart: "2026-01-02", plannedEnd: "2026-01-01" }),
    ).toBe("終了予定日は開始予定日以降にしてください");
    expect(
      checkTaskDateOrder({ ...empty, actualStart: "2026-01-02", actualEnd: "2026-01-01" }),
    ).toBe("終了日は開始日以降にしてください");
  });
});

describe("estimateTotals", () => {
  const task = (id: number, parentId: number | null, estimateHours: number | null) => ({
    id,
    parentId,
    estimateHours,
  });

  it("uses a leaf's own estimate and sums descendants for parents", () => {
    const totals = estimateTotals(
      buildWbsTree([
        task(1, null, 100),
        task(2, 1, 3),
        task(3, 1, null),
        task(4, 3, 5),
        task(5, 3, null),
        task(6, null, null),
      ]),
    );
    expect(totals.get(1)).toBe(8);
    expect(totals.get(3)).toBe(5);
    expect(totals.get(5)).toBeNull();
    expect(totals.get(6)).toBeNull();
  });

  it("shows 0 for a parent whose descendants are all unset", () => {
    const totals = estimateTotals(buildWbsTree([task(1, null, 4), task(2, 1, null)]));
    expect(totals.get(1)).toBe(0);
  });
});
