// Drizzle table definitions. Run `just db-generate` after changing this file.
import {
  type AnyPgColumn,
  date,
  doublePrecision,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { IssuePriority, IssueStatus } from "../../shared/utils/issues";
import type { TaskStatus } from "../../shared/utils/task-details";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** WBS tasks. Siblings are ordered by id; deleting a task deletes its subtree. */
export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    parentId: integer("parent_id").references((): AnyPgColumn => tasks.id, {
      onDelete: "cascade",
    }),
    title: text("title").notNull(),
    plannedStart: date("planned_start", { mode: "string" }),
    plannedEnd: date("planned_end", { mode: "string" }),
    actualStart: date("actual_start", { mode: "string" }),
    actualEnd: date("actual_end", { mode: "string" }),
    assigneeId: integer("assignee_id").references((): AnyPgColumn => users.id, {
      onDelete: "set null",
    }),
    status: text("status").$type<TaskStatus>().notNull().default("todo"),
    estimateHours: doublePrecision("estimate_hours"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("tasks_project_id_idx").on(table.projectId),
    index("tasks_parent_id_idx").on(table.parentId),
  ],
);

export const issues = pgTable(
  "issues",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    status: text("status").$type<IssueStatus>().notNull().default("open"),
    assigneeId: integer("assignee_id").references((): AnyPgColumn => users.id, {
      onDelete: "set null",
    }),
    priority: text("priority").$type<IssuePriority>().notNull().default("medium"),
    dueDate: date("due_date", { mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("issues_project_id_idx").on(table.projectId)],
);

/** Comments on an issue, deleted with it. */
export const issueComments = pgTable(
  "issue_comments",
  {
    id: serial("id").primaryKey(),
    issueId: integer("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    /** Null when posted without a name (shown as 匿名). */
    author: text("author"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("issue_comments_issue_id_idx").on(table.issueId)],
);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  /** Stored lowercased. */
  email: text("email").notNull().unique(),
  /** scrypt hash from server/utils/password.ts; never the plain password. */
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Login sessions. The id is the SHA-256 of the cookie token, so a DB leak can't be replayed. */
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);
