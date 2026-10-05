import { describe, expect, it } from "vitest";
import { isIssueOverdue, parseIssueFields } from "../../shared/utils/issues";

describe("parseIssueFields", () => {
  it("parses only present fields and normalizes blanks", () => {
    expect(parseIssueFields({ status: "resolved" })).toEqual({
      ok: true,
      value: { status: "resolved" },
    });
    expect(
      parseIssueFields({
        title: " 題 ",
        body: "a\nb",
        assigneeId: "",
        priority: "high",
        dueDate: "",
      }),
    ).toEqual({
      ok: true,
      value: { title: "題", body: "a\nb", assigneeId: null, priority: "high", dueDate: null },
    });
    expect(parseIssueFields({ assigneeId: "7", dueDate: "2026-04-30", body: null })).toEqual({
      ok: true,
      value: { assigneeId: 7, dueDate: "2026-04-30", body: "" },
    });
  });

  it.each([
    [{ title: "  " }, "タイトルを入力してください"],
    [{ title: 1 }, "タイトルを入力してください"],
    [{ body: 1 }, "本文が正しくありません"],
    [{ status: "closed" }, "ステータスが正しくありません"],
    [{ priority: "urgent" }, "優先度が正しくありません"],
    [{ dueDate: "2026-02-30" }, "期限日の形式が正しくありません"],
    [{ assigneeId: [] }, "担当者が正しくありません"],
    [{ assigneeId: "abc" }, "担当者が正しくありません"],
    [{ assignee: "佐藤" }, "担当者は登録ユーザーから選択してください"],
    [{ assigneeId: 0 }, "担当者が正しくありません"],
    [{ assigneeId: 1.5 }, "担当者が正しくありません"],
  ])("rejects %j", (input, message) => {
    expect(parseIssueFields(input)).toEqual({ ok: false, message });
  });
});

describe("isIssueOverdue", () => {
  const today = "2026-04-10";

  it("is overdue when the due date has passed and it is not resolved", () => {
    expect(isIssueOverdue({ dueDate: "2026-04-09", status: "open" }, today)).toBe(true);
    expect(isIssueOverdue({ dueDate: "2026-04-09", status: "in_progress" }, today)).toBe(true);
  });

  it("is not overdue on the due date, when resolved, or without a due date", () => {
    expect(isIssueOverdue({ dueDate: "2026-04-10", status: "open" }, today)).toBe(false);
    expect(isIssueOverdue({ dueDate: "2026-04-09", status: "resolved" }, today)).toBe(false);
    expect(isIssueOverdue({ dueDate: null, status: "open" }, today)).toBe(false);
  });
});
