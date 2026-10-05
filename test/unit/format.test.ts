import { describe, expect, it } from "vitest";
import { formatHours, formatPeriod } from "../../app/utils/format";

describe("formatHours", () => {
  it("formats hours with at most two decimals", () => {
    expect(formatHours(8)).toBe("8h");
    expect(formatHours(0.1 + 0.2)).toBe("0.3h");
    expect(formatHours(0)).toBe("0h");
    expect(formatHours(null)).toBe("-");
  });
});

describe("formatPeriod", () => {
  it("formats closed, open-ended and empty periods", () => {
    expect(formatPeriod("2026-01-05", "2026-01-09")).toBe("2026-01-05〜2026-01-09");
    expect(formatPeriod(null, "2026-01-09")).toBe("〜2026-01-09");
    expect(formatPeriod("2026-01-05", null)).toBe("2026-01-05〜");
    expect(formatPeriod(null, null)).toBe("-");
  });
});
