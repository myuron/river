import { describe, expect, it } from "vitest";
import { compareDatesNullsLast } from "../../shared/utils/my-work";

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
