import { describe, expect, it } from "vitest";
import { isForeignKeyViolation } from "../../server/utils/db-errors";

describe("isForeignKeyViolation", () => {
  it("detects the Postgres error code directly or in a cause chain", () => {
    expect(isForeignKeyViolation({ code: "23503" })).toBe(true);
    expect(isForeignKeyViolation(new Error("wrapped", { cause: { code: "23503" } }))).toBe(true);
  });

  it("ignores other errors", () => {
    expect(isForeignKeyViolation({ code: "23505" })).toBe(false);
    expect(isForeignKeyViolation(new Error("x"))).toBe(false);
    expect(isForeignKeyViolation(undefined)).toBe(false);
  });
});
