import { describe, expect, it } from "vitest";
import { normalizeRequiredText } from "../../shared/utils/text";

describe("normalizeRequiredText", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeRequiredText("  river  ")).toBe("river");
  });

  it("returns null for empty or whitespace-only strings", () => {
    expect(normalizeRequiredText("")).toBeNull();
    expect(normalizeRequiredText(" \t\n　")).toBeNull();
  });

  it("returns null for non-string values", () => {
    expect(normalizeRequiredText(undefined)).toBeNull();
    expect(normalizeRequiredText(123)).toBeNull();
  });
});
