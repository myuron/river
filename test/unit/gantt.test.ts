import { describe, expect, it } from "vitest";
import { buildGantt } from "../../shared/utils/gantt";

const task = (
  id: number,
  dates: Partial<Record<"plannedStart" | "plannedEnd" | "actualStart" | "actualEnd", string>> = {},
  parentId: number | null = null,
) => ({
  id,
  parentId,
  title: `t${id}`,
  plannedStart: null,
  plannedEnd: null,
  actualStart: null,
  actualEnd: null,
  ...dates,
});

const TODAY = "2026-03-20";

describe("buildGantt", () => {
  it("returns null when no task has a date", () => {
    expect(buildGantt([task(1), task(2)], TODAY)).toBeNull();
  });

  it("spans the earliest to latest planned/actual date and keeps WBS order", () => {
    const gantt = buildGantt(
      [
        task(1, { plannedStart: "2026-03-03", plannedEnd: "2026-03-05" }),
        task(2, { actualStart: "2026-03-01", actualEnd: "2026-03-02" }, 1),
        task(3),
        task(4, { plannedEnd: "2026-03-09" }),
      ],
      TODAY,
    )!;
    expect(gantt.days[0]).toBe("2026-03-01");
    expect(gantt.days.at(-1)).toBe("2026-03-09");
    expect(gantt.days).toHaveLength(9);
    expect(gantt.rows.map((r) => [r.number, r.task.id])).toEqual([
      ["1", 1],
      ["1.1", 2],
      ["2", 3],
      ["3", 4],
    ]);
  });

  it("places planned bars inclusively and omits bars without dates", () => {
    const gantt = buildGantt(
      [
        task(1, { plannedStart: "2026-03-03", plannedEnd: "2026-03-05" }),
        task(2, { plannedStart: "2026-03-01" }),
      ],
      TODAY,
    )!;
    expect(gantt.rows[0]!.planned).toEqual({
      start: "2026-03-03",
      end: "2026-03-05",
      offset: 2,
      length: 3,
    });
    expect(gantt.rows[0]!.actual).toBeNull();
    // Only one planned date: a one-day bar on that date
    expect(gantt.rows[1]!.planned).toEqual({
      start: "2026-03-01",
      end: "2026-03-01",
      offset: 0,
      length: 1,
    });
  });

  it("runs an unfinished actual bar up to today and widens the axis to include it", () => {
    const gantt = buildGantt([task(1, { actualStart: "2026-03-18" })], TODAY)!;
    expect(gantt.rows[0]!.actual).toEqual({
      start: "2026-03-18",
      end: TODAY,
      offset: 0,
      length: 3,
    });
    expect(gantt.days.at(-1)).toBe(TODAY);
  });

  it("does not run an actual bar backwards when it starts after today", () => {
    const gantt = buildGantt([task(1, { actualStart: "2026-03-25" })], TODAY)!;
    expect(gantt.rows[0]!.actual).toEqual({
      start: "2026-03-25",
      end: "2026-03-25",
      offset: 0,
      length: 1,
    });
  });
});

describe("buildGantt edge cases", () => {
  it("draws a one-day actual bar when only the actual end date is set", () => {
    const gantt = buildGantt(
      [task(1, { plannedStart: "2026-03-01", plannedEnd: "2026-03-10", actualEnd: "2026-03-04" })],
      TODAY,
    )!;
    expect(gantt.rows[0]!.actual).toEqual({
      start: "2026-03-04",
      end: "2026-03-04",
      offset: 3,
      length: 1,
    });
    expect(gantt.days.at(-1)).toBe("2026-03-10");
  });

  it("tolerates reversed dates instead of breaking the axis", () => {
    const gantt = buildGantt(
      [task(1, { plannedStart: "2026-03-10", plannedEnd: "2026-03-05" })],
      TODAY,
    )!;
    expect(gantt.rows[0]!.planned).toEqual({
      start: "2026-03-05",
      end: "2026-03-10",
      offset: 0,
      length: 6,
    });
    expect(gantt.days).toHaveLength(6);
  });
});
