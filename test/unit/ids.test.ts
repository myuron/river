import { describe, expect, it } from "vitest";
import { parseOptionalId } from "../../shared/utils/ids";

describe("parseOptionalId", () => {
  it("parses ids from numbers and digit strings, and blanks as null", () => {
    expect(parseOptionalId(5)).toEqual({ ok: true, value: 5 });
    expect(parseOptionalId("12")).toEqual({ ok: true, value: 12 });
    for (const blank of [null, undefined, "", " "]) {
      expect(parseOptionalId(blank)).toEqual({ ok: true, value: null });
    }
  });

  it("rejects anything that cannot be an id", () => {
    for (const bad of [0, -1, 1.5, "1.5", "x", 2_147_483_648, {}, true]) {
      expect(parseOptionalId(bad)).toEqual({ ok: false });
    }
  });
});
