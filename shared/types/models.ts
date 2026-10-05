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
  assignee: string | null;
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
  assignee: string | null;
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
