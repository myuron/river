import { daysBetween } from "./dates";
import { isIssueOverdue, type IssuePriority, type IssueStatus } from "./issues";
import type { TaskStatus } from "./task-details";
import { buildWbsTree, flattenWbsTree, type WbsItem } from "./wbs";

type DashboardTask = WbsItem & {
  status: TaskStatus;
  estimateHours: number | null;
  plannedEnd: string | null;
};

export interface DelayedTask<T> {
  task: T;
  number: string;
  daysLate: number;
}

export interface WbsSummary<T> {
  /** Tasks without children; progress is measured on these. */
  leafCount: number;
  byStatus: Record<TaskStatus, number>;
  /** Done leaves / leaves, in whole percent; null without leaves. */
  countRate: number | null;
  /** Done leaf hours / leaf hours (unset = 0), in whole percent; null when the total is 0. */
  hoursRate: number | null;
  /** Unfinished tasks whose planned end is before today, oldest first. */
  delayed: DelayedTask<T>[];
}

const percent = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 100) : null;

export function summarizeWbs<T extends DashboardTask>(
  tasks: readonly T[],
  today: string,
): WbsSummary<T> {
  const nodes = flattenWbsTree(buildWbsTree(tasks));
  const leaves = nodes.filter((n) => n.children.length === 0).map((n) => n.task);

  const byStatus: Record<TaskStatus, number> = { todo: 0, in_progress: 0, done: 0 };
  let totalHours = 0;
  let doneHours = 0;
  for (const leaf of leaves) {
    byStatus[leaf.status] += 1;
    totalHours += leaf.estimateHours ?? 0;
    if (leaf.status === "done") doneHours += leaf.estimateHours ?? 0;
  }

  const delayed = nodes
    .filter(
      (n) => n.task.status !== "done" && n.task.plannedEnd !== null && n.task.plannedEnd < today,
    )
    .map((n) => ({
      task: n.task,
      number: n.number,
      daysLate: daysBetween(n.task.plannedEnd!, today),
    }))
    .sort((a, b) => b.daysLate - a.daysLate);

  return {
    leafCount: leaves.length,
    byStatus,
    countRate: percent(byStatus.done, leaves.length),
    hoursRate: percent(doneHours, totalHours),
    delayed,
  };
}

type DashboardIssue = {
  id: number;
  status: IssueStatus;
  priority: IssuePriority;
  dueDate: string | null;
};

export interface IssueSummary<T> {
  byStatus: Record<IssueStatus, number>;
  /** Issues other than resolved, by priority. */
  unresolvedByPriority: Record<IssuePriority, number>;
  /** Unresolved issues past their due date, oldest due date first. */
  overdue: T[];
}

export function summarizeIssues<T extends DashboardIssue>(
  issues: readonly T[],
  today: string,
): IssueSummary<T> {
  const byStatus: Record<IssueStatus, number> = { open: 0, in_progress: 0, resolved: 0 };
  const unresolvedByPriority: Record<IssuePriority, number> = { high: 0, medium: 0, low: 0 };
  for (const issue of issues) {
    byStatus[issue.status] += 1;
    if (issue.status !== "resolved") unresolvedByPriority[issue.priority] += 1;
  }
  const overdue = issues
    .filter((issue) => isIssueOverdue(issue, today))
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!) || a.id - b.id);
  return { byStatus, unresolvedByPriority, overdue };
}
