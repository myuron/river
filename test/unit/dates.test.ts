import { describe, expect, it } from "vitest";
import { addDays, daysBetween, isIsoDate, todayIsoDate } from "../../shared/utils/dates";

describe("dates", () => {
  it("validates calendar dates", () => {
    expect(isIsoDate("2024-02-29")).toBe(true);
    expect(isIsoDate("2025-02-29")).toBe(false);
    expect(isIsoDate("2025-1-01")).toBe(false);
  });

  it("formats today in local time", () => {
    expect(todayIsoDate(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("does day arithmetic across months and years", () => {
    expect(daysBetween("2025-12-30", "2026-01-02")).toBe(3);
    expect(daysBetween("2026-01-02", "2025-12-30")).toBe(-3);
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
});
