import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  isIssueOverdue,
  type IssuePriority,
  type IssueStatus,
} from "./issues";

export type AssigneeFilter =
  | { type: "any" }
  | { type: "unassigned" }
  | { type: "user"; id: number };

/** Empty status/priority lists mean "any". Conditions combine with AND. */
export interface IssueFilter {
  statuses: IssueStatus[];
  priorities: IssuePriority[];
  assignee: AssigneeFilter;
  overdueOnly: boolean;
}

export const DEFAULT_ISSUE_FILTER: IssueFilter = {
  statuses: ["open", "in_progress"],
  priorities: [],
  assignee: { type: "any" },
  overdueOnly: false,
};

type QueryValue = string | null | undefined | (string | null)[];
type Query = Record<string, QueryValue>;

const first = (value: QueryValue): string | undefined =>
  (Array.isArray(value) ? value[0] : value) ?? undefined;

function parseList<T extends string>(value: string, allowed: readonly T[]): T[] {
  return value.split(",").filter((v): v is T => allowed.includes(v as T));
}

/**
 * Reads the filter from the URL query. Without a `status` key the default
 * statuses apply; `status=` (empty) means any status.
 */
export function parseIssueFilter(query: Query): IssueFilter {
  const status = first(query.status);
  const priority = first(query.priority);
  const assignee = first(query.assignee);
  return {
    statuses:
      status === undefined ? [...DEFAULT_ISSUE_FILTER.statuses] : parseList(status, ISSUE_STATUSES),
    priorities: priority ? parseList(priority, ISSUE_PRIORITIES) : [],
    assignee:
      first(query.unassigned) === "1"
        ? { type: "unassigned" }
        : assignee && /^\d+$/.test(assignee)
          ? { type: "user", id: Number(assignee) }
          : { type: "any" },
    overdueOnly: first(query.overdue) === "1",
  };
}

/** The URL query for a filter (inverse of parseIssueFilter). */
export function issueFilterToQuery(filter: IssueFilter): Record<string, string> {
  const query: Record<string, string> = { status: filter.statuses.join(",") };
  if (filter.priorities.length > 0) query.priority = filter.priorities.join(",");
  if (filter.assignee.type === "unassigned") query.unassigned = "1";
  if (filter.assignee.type === "user") query.assignee = String(filter.assignee.id);
  if (filter.overdueOnly) query.overdue = "1";
  return query;
}

export function filterIssues<
  T extends {
    status: IssueStatus;
    priority: IssuePriority;
    assignee: { id: number } | null;
    dueDate: string | null;
  },
>(issues: readonly T[], filter: IssueFilter, today: string): T[] {
  return issues.filter((issue) => {
    if (filter.statuses.length > 0 && !filter.statuses.includes(issue.status)) return false;
    if (filter.priorities.length > 0 && !filter.priorities.includes(issue.priority)) return false;
    if (filter.assignee.type === "unassigned" && issue.assignee !== null) return false;
    if (filter.assignee.type === "user" && issue.assignee?.id !== filter.assignee.id) return false;
    if (filter.overdueOnly && !isIssueOverdue(issue, today)) return false;
    return true;
  });
}
