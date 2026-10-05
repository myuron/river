import { isIsoDate } from "./dates";

export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "未着手",
  in_progress: "進行中",
  done: "完了",
};

export interface TaskDates {
  plannedStart: string | null;
  plannedEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
}

export interface TaskDetails extends TaskDates {
  assignee: string | null;
  status: TaskStatus;
  estimateHours: number | null;
}

const DATE_FIELDS = ["plannedStart", "plannedEnd", "actualStart", "actualEnd"] as const;

type ParseResult = { ok: true; value: Partial<TaskDetails> } | { ok: false; message: string };

const isBlank = (value: unknown) =>
  value === null || value === undefined || (typeof value === "string" && value.trim() === "");

/**
 * Validates the detail fields present in `raw` (form or request body).
 * Blank values clear the field (null). Absent keys are left out of the result.
 */
export function parseTaskDetails(raw: Record<string, unknown>): ParseResult {
  const value: Partial<TaskDetails> = {};

  for (const field of DATE_FIELDS) {
    if (!(field in raw)) continue;
    const input = raw[field];
    if (isBlank(input)) {
      value[field] = null;
    } else if (typeof input === "string" && isIsoDate(input)) {
      value[field] = input;
    } else {
      return { ok: false, message: "日付の形式が正しくありません" };
    }
  }

  if ("assignee" in raw) {
    const input = raw.assignee;
    if (input !== null && input !== undefined && typeof input !== "string") {
      return { ok: false, message: "担当者が正しくありません" };
    }
    value.assignee = isBlank(input) ? null : (input as string).trim();
  }

  if ("status" in raw) {
    if (!TASK_STATUSES.includes(raw.status as TaskStatus)) {
      return { ok: false, message: "ステータスが正しくありません" };
    }
    value.status = raw.status as TaskStatus;
  }

  if ("estimateHours" in raw) {
    const input = raw.estimateHours;
    if (isBlank(input)) {
      value.estimateHours = null;
    } else {
      const hours =
        typeof input === "number"
          ? input
          : typeof input === "string" && /^\d+(\.\d+)?$/.test(input.trim())
            ? Number(input)
            : Number.NaN;
      if (!Number.isFinite(hours) || hours < 0) {
        return { ok: false, message: "見積工数は0以上の数値で入力してください" };
      }
      value.estimateHours = hours;
    }
  }

  return { ok: true, value };
}

/** Returns an error message when an end date is before its start date. */
export function checkTaskDateOrder(dates: TaskDates): string | null {
  if (dates.plannedStart && dates.plannedEnd && dates.plannedEnd < dates.plannedStart) {
    return "終了予定日は開始予定日以降にしてください";
  }
  if (dates.actualStart && dates.actualEnd && dates.actualEnd < dates.actualStart) {
    return "終了日は開始日以降にしてください";
  }
  return null;
}
