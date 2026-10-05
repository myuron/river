import { daysBetween } from "./dates";

/** Days ahead (inclusive) that still count as "due soon"; today is day 0. */
export const DUE_SOON_DAYS = 7;

/** Ascending "YYYY-MM-DD" dates, unset dates last. */
export function compareDatesNullsLast(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a < b ? -1 : 1;
}

export type DeadlineState = "overdue" | "soon" | null;

/** Overdue before today; due soon from today through DUE_SOON_DAYS ahead. For unfinished work only. */
export function deadlineState(date: string | null, today: string): DeadlineState {
  if (date === null) return null;
  const days = daysBetween(today, date);
  if (days < 0) return "overdue";
  return days <= DUE_SOON_DAYS ? "soon" : null;
}

export interface MyWorkSummary {
  taskCount: number;
  issueCount: number;
  /** Tasks + issues past their deadline. */
  overdueCount: number;
  /** Tasks + issues due within DUE_SOON_DAYS, excluding overdue ones. */
  soonCount: number;
}

/** Counts for the personal dashboard; the inputs are already unfinished/unresolved. */
export function summarizeMyWork(
  tasks: readonly { plannedEnd: string | null }[],
  issues: readonly { dueDate: string | null }[],
  today: string,
): MyWorkSummary {
  const states = [
    ...tasks.map((t) => deadlineState(t.plannedEnd, today)),
    ...issues.map((i) => deadlineState(i.dueDate, today)),
  ];
  return {
    taskCount: tasks.length,
    issueCount: issues.length,
    overdueCount: states.filter((s) => s === "overdue").length,
    soonCount: states.filter((s) => s === "soon").length,
  };
}
