import { describe, expect, it } from "vitest";
import { parseCredentials, parseSignup, safeRedirect } from "../../shared/utils/auth";
import { hashPassword, verifyPassword } from "../../server/utils/password";

describe("parseSignup", () => {
  it("accepts and normalizes valid input", () => {
    expect(
      parseSignup({ name: " 山田 ", email: " Taro@Example.COM ", password: "12345678" }),
    ).toEqual({
      ok: true,
      value: { name: "山田", email: "taro@example.com", password: "12345678" },
    });
  });

  it.each([
    [{ name: " ", email: "a@b.jp", password: "12345678" }, "表示名を入力してください"],
    [{ name: "a", email: "", password: "12345678" }, "メールアドレスを入力してください"],
    [
      { name: "a", email: "not-an-email", password: "12345678" },
      "メールアドレスの形式が正しくありません",
    ],
    [{ name: "a", email: "a@b", password: "12345678" }, "メールアドレスの形式が正しくありません"],
    [
      { name: "a", email: "a@b.jp", password: "1234567" },
      "パスワードは8文字以上で入力してください",
    ],
    [{ name: "a", email: "a@b.jp" }, "パスワードは8文字以上で入力してください"],
  ])("rejects %j", (input, message) => {
    expect(parseSignup(input)).toEqual({ ok: false, message });
  });
});

describe("parseCredentials", () => {
  it("normalizes the email", () => {
    expect(parseCredentials({ email: " A@B.jp ", password: "x" })).toEqual({
      email: "a@b.jp",
      password: "x",
    });
  });

  it("returns null for missing fields", () => {
    expect(parseCredentials({ email: "a@b.jp" })).toBeNull();
    expect(parseCredentials(null)).toBeNull();
  });
});

describe("safeRedirect", () => {
  it("allows same-site paths", () => {
    expect(safeRedirect("/projects/1?x=1#y")).toBe("/projects/1?x=1#y");
  });

  it("falls back to / for anything that could leave the site", () => {
    for (const value of [
      undefined,
      "",
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "projects",
    ]) {
      expect(safeRedirect(value)).toBe("/");
    }
  });
});

describe("password hashing", () => {
  it("verifies the right password and rejects others", async () => {
    const hash = await hashPassword("correct horse");
    expect(hash).not.toContain("correct horse");
    expect(await verifyPassword("correct horse", hash)).toBe(true);
    expect(await verifyPassword("wrong horse", hash)).toBe(false);
  });

  it("salts each hash", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });

  it("rejects malformed hashes", async () => {
    expect(await verifyPassword("x", "garbage")).toBe(false);
  });
});
