// JSON shapes returned by the API (dates are ISO strings).
import type { IssuePriority, IssueStatus } from "../utils/issues";
import type { TaskStatus } from "../utils/task-details";

export interface Project {
  id: number;
  name: string;
  createdAt: string;
}

export interface Task {
  id: number;
  projectId: number;
  parentId: number | null;
  title: string;
  /** "YYYY-MM-DD" calendar dates. */
  plannedStart: string | null;
  plannedEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  assignee: AssigneeRef | null;
  status: TaskStatus;
  estimateHours: number | null;
  createdAt: string;
}

export interface Issue {
  id: number;
  projectId: number;
  title: string;
  body: string;
  status: IssueStatus;
  assignee: AssigneeRef | null;
  priority: IssuePriority;
  /** "YYYY-MM-DD" */
  dueDate: string | null;
  createdAt: string;
}

export interface IssueComment {
  id: number;
  issueId: number;
  author: string | null;
  body: string;
  createdAt: string;
}

/** The logged-in user as exposed to the client (no password hash). */
export interface SessionUser {
  id: number;
  name: string;
  email: string;
}

/** A user as shown in pickers and assignee columns. */
export interface AssigneeRef {
  id: number;
  name: string;
}

/** An unfinished task assigned to the current user, for the personal dashboard. */
export interface MyTask {
  id: number;
  projectId: number;
  projectName: string;
  wbsNumber: string;
  title: string;
  status: TaskStatus;
  plannedEnd: string | null;
}

/** An unresolved issue assigned to the current user, for the personal dashboard. */
export interface MyIssue {
  id: number;
  projectId: number;
  projectName: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  dueDate: string | null;
}
