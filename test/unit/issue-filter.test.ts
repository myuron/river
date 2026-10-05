import { describe, expect, it } from "vitest";
import {
  DEFAULT_ISSUE_FILTER,
  filterIssues,
  issueFilterToQuery,
  parseIssueFilter,
  type IssueFilter,
} from "../../shared/utils/issue-filter";

describe("parseIssueFilter", () => {
  it("defaults to open and in-progress issues when there is no query", () => {
    expect(parseIssueFilter({})).toEqual(DEFAULT_ISSUE_FILTER);
    expect(DEFAULT_ISSUE_FILTER).toEqual({
      statuses: ["open", "in_progress"],
      priorities: [],
      assignee: { type: "any" },
      overdueOnly: false,
    });
  });

  it("reads every condition and ignores unknown values", () => {
    expect(
      parseIssueFilter({
        status: "resolved,bogus",
        priority: "high,low",
        assignee: "佐藤",
        overdue: "1",
      }),
    ).toEqual({
      statuses: ["resolved"],
      priorities: ["high", "low"],
      assignee: { type: "name", name: "佐藤" },
      overdueOnly: true,
    });
    expect(parseIssueFilter({ status: "", unassigned: "1" })).toEqual({
      statuses: [],
      priorities: [],
      assignee: { type: "unassigned" },
      overdueOnly: false,
    });
  });

  it("round-trips through the query", () => {
    const filters: IssueFilter[] = [
      DEFAULT_ISSUE_FILTER,
      { statuses: [], priorities: [], assignee: { type: "any" }, overdueOnly: false },
      {
        statuses: ["open"],
        priorities: ["medium"],
        assignee: { type: "unassigned" },
        overdueOnly: true,
      },
      { statuses: [], priorities: [], assignee: { type: "name", name: "a,b" }, overdueOnly: false },
    ];
    for (const filter of filters) {
      expect(parseIssueFilter(issueFilterToQuery(filter))).toEqual(filter);
    }
  });
});

describe("filterIssues", () => {
  const today = "2026-04-10";
  const issue = (id: number, fields: Partial<Parameters<typeof filterIssues>[0][number]>) => ({
    id,
    status: "open" as const,
    priority: "medium" as const,
    assignee: null,
    dueDate: null,
    ...fields,
  });
  const issues = [
    issue(1, { status: "open", assignee: "佐藤", priority: "high", dueDate: "2026-04-01" }),
    issue(2, { status: "in_progress", assignee: "鈴木", priority: "low" }),
    issue(3, { status: "resolved", assignee: "佐藤", dueDate: "2026-04-01" }),
    issue(4, { status: "open" }),
  ];
  const ids = (filter: Partial<IssueFilter>) =>
    filterIssues(issues, { ...DEFAULT_ISSUE_FILTER, ...filter }, today).map((i) => i.id);

  it("applies the default status filter", () => {
    expect(ids({})).toEqual([1, 2, 4]);
  });

  it("matches nothing-selected lists as 'any'", () => {
    expect(ids({ statuses: [] })).toEqual([1, 2, 3, 4]);
  });

  it("combines conditions with AND", () => {
    expect(ids({ statuses: [], assignee: { type: "name", name: "佐藤" } })).toEqual([1, 3]);
    expect(
      ids({ statuses: [], assignee: { type: "name", name: "佐藤" }, priorities: ["high"] }),
    ).toEqual([1]);
    expect(ids({ statuses: [], assignee: { type: "unassigned" } })).toEqual([4]);
    expect(ids({ statuses: [], overdueOnly: true })).toEqual([1]);
    expect(ids({ statuses: ["in_progress", "resolved"], priorities: ["low", "medium"] })).toEqual([
      2, 3,
    ]);
  });
});
