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
import type { IssueStatus } from "../../shared/utils/issues";
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
    assignee: text("assignee"),
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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("issues_project_id_idx").on(table.projectId)],
);
