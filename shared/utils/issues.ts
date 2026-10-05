import { isIsoDate } from "./dates";
import { isBlank, normalizeRequiredText } from "./text";

export const ISSUE_STATUSES = ["open", "in_progress", "resolved"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  open: "未対応",
  in_progress: "対応中",
  resolved: "解決済み",
};

export const ISSUE_PRIORITIES = ["high", "medium", "low"] as const;
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number];

export const ISSUE_PRIORITY_LABELS: Record<IssuePriority, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export interface IssueFields {
  title: string;
  body: string;
  status: IssueStatus;
  assignee: string | null;
  priority: IssuePriority;
  /** "YYYY-MM-DD" */
  dueDate: string | null;
}

type ParseResult = { ok: true; value: Partial<IssueFields> } | { ok: false; message: string };

/** Validates the issue fields present in `raw`; blank optional fields become null. */
export function parseIssueFields(raw: Record<string, unknown>): ParseResult {
  const value: Partial<IssueFields> = {};

  if ("title" in raw) {
    const title = normalizeRequiredText(raw.title);
    if (!title) return { ok: false, message: "タイトルを入力してください" };
    value.title = title;
  }

  if ("body" in raw) {
    if (raw.body !== null && raw.body !== undefined && typeof raw.body !== "string") {
      return { ok: false, message: "本文が正しくありません" };
    }
    value.body = raw.body ?? "";
  }

  if ("status" in raw) {
    if (!ISSUE_STATUSES.includes(raw.status as IssueStatus)) {
      return { ok: false, message: "ステータスが正しくありません" };
    }
    value.status = raw.status as IssueStatus;
  }

  if ("assignee" in raw) {
    const input = raw.assignee;
    if (input !== null && input !== undefined && typeof input !== "string") {
      return { ok: false, message: "担当者が正しくありません" };
    }
    value.assignee = isBlank(input) ? null : (input as string).trim();
  }

  if ("priority" in raw) {
    if (!ISSUE_PRIORITIES.includes(raw.priority as IssuePriority)) {
      return { ok: false, message: "優先度が正しくありません" };
    }
    value.priority = raw.priority as IssuePriority;
  }

  if ("dueDate" in raw) {
    const input = raw.dueDate;
    if (isBlank(input)) {
      value.dueDate = null;
    } else if (typeof input === "string" && isIsoDate(input)) {
      value.dueDate = input;
    } else {
      return { ok: false, message: "期限日の形式が正しくありません" };
    }
  }

  return { ok: true, value };
}

/** Past its due date (before `today`) and not resolved. */
export function isIssueOverdue(
  issue: { dueDate: string | null; status: IssueStatus },
  today: string,
): boolean {
  return issue.dueDate !== null && issue.dueDate < today && issue.status !== "resolved";
}
