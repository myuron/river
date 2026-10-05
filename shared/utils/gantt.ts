import { addDays, daysBetween } from "./dates";
import type { TaskDates } from "./task-details";
import { buildWbsTree, flattenWbsTree, type WbsItem } from "./wbs";

export interface GanttBar {
  start: string;
  end: string;
  /** Days from the first day of the axis. */
  offset: number;
  /** Days covered, both ends inclusive. */
  length: number;
}

export interface GanttRow<T> {
  task: T;
  number: string;
  depth: number;
  planned: GanttBar | null;
  actual: GanttBar | null;
}

export interface Gantt<T> {
  /** Every day on the axis, in order. */
  days: string[];
  rows: GanttRow<T>[];
}

type Span = { start: string; end: string };

/** Guards against reversed rows in the DB (the API rejects them) breaking the axis. */
const ordered = (a: string, b: string): Span =>
  a <= b ? { start: a, end: b } : { start: b, end: a };

/** A single set date becomes a one-day span. */
function plannedSpan(task: TaskDates): Span | null {
  const start = task.plannedStart ?? task.plannedEnd;
  const end = task.plannedEnd ?? task.plannedStart;
  return start && end ? ordered(start, end) : null;
}

/** An actual span without an end date runs to today (never before its start). */
function actualSpan(task: TaskDates, today: string): Span | null {
  if (task.actualStart) {
    const end = task.actualEnd ?? (today > task.actualStart ? today : task.actualStart);
    return ordered(task.actualStart, end);
  }
  return task.actualEnd ? { start: task.actualEnd, end: task.actualEnd } : null;
}

/** Lays out tasks on a daily axis; null when no task has any date. */
export function buildGantt<T extends WbsItem & TaskDates>(
  tasks: readonly T[],
  today: string,
): Gantt<T> | null {
  const nodes = flattenWbsTree(buildWbsTree(tasks));
  const spans = nodes.map((node) => ({
    node,
    planned: plannedSpan(node.task),
    actual: actualSpan(node.task, today),
  }));

  const bounds = spans.flatMap((s) => [s.planned, s.actual]).filter((s): s is Span => s !== null);
  if (bounds.length === 0) return null;
  const first = bounds.reduce((min, s) => (s.start < min ? s.start : min), bounds[0]!.start);
  const last = bounds.reduce((max, s) => (s.end > max ? s.end : max), bounds[0]!.end);

  const toBar = (span: Span | null): GanttBar | null =>
    span && {
      ...span,
      offset: daysBetween(first, span.start),
      length: daysBetween(span.start, span.end) + 1,
    };

  return {
    days: Array.from({ length: daysBetween(first, last) + 1 }, (_, i) => addDays(first, i)),
    rows: spans.map(({ node, planned, actual }) => ({
      task: node.task,
      number: node.number,
      depth: node.depth,
      planned: toBar(planned),
      actual: toBar(actual),
    })),
  };
}
