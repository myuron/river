import { describe, expect, it } from "vitest";
import { parseCommentInput } from "../../shared/utils/comments";

describe("parseCommentInput", () => {
  it("keeps the body as typed and trims the author", () => {
    expect(parseCommentInput({ author: " 山田 ", body: "1行目\n2行目" })).toEqual({
      ok: true,
      value: { author: "山田", body: "1行目\n2行目" },
    });
  });

  it("treats a missing or blank author as anonymous", () => {
    for (const author of [undefined, null, "  "]) {
      expect(parseCommentInput({ author, body: "x" })).toEqual({
        ok: true,
        value: { author: null, body: "x" },
      });
    }
  });

  it.each([
    [null, "コメントを入力してください"],
    [{ body: " \n " }, "コメントを入力してください"],
    [{ body: 1 }, "コメントを入力してください"],
    [{ body: "x", author: 1 }, "投稿者名が正しくありません"],
  ])("rejects %j", (input, message) => {
    expect(parseCommentInput(input)).toEqual({ ok: false, message });
  });
});
