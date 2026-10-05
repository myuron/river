import { asc, desc, eq, getTableColumns, type SQL } from "drizzle-orm";
import { issues, tasks, users } from "../db/schema";

type WithAssigneeColumns = { assigneeId: number | null; assigneeName: string | null };

/** Replaces assigneeId/assigneeName with `assignee: { id, name } | null`. */
function toAssignee<T extends WithAssigneeColumns>({ assigneeId, assigneeName, ...rest }: T) {
  return {
    ...rest,
    assignee: assigneeId === null ? null : { id: assigneeId, name: assigneeName ?? "" },
  };
}

/** Tasks with their assignee, siblings in creation order. */
export async function selectTasks(where: SQL) {
  const rows = await useDb()
    .select({ ...getTableColumns(tasks), assigneeName: users.name })
    .from(tasks)
    .leftJoin(users, eq(users.id, tasks.assigneeId))
    .where(where)
    .orderBy(asc(tasks.id));
  return rows.map(toAssignee);
}

/** Issues with their assignee, newest first. */
export async function selectIssues(where: SQL) {
  const rows = await useDb()
    .select({ ...getTableColumns(issues), assigneeName: users.name })
    .from(issues)
    .leftJoin(users, eq(users.id, issues.assigneeId))
    .where(where)
    .orderBy(desc(issues.createdAt), desc(issues.id));
  return rows.map(toAssignee);
}

/** 400 unless `assigneeId` is null or an existing user. */
export async function assertAssigneeExists(assigneeId: number | null | undefined) {
  if (assigneeId === null || assigneeId === undefined) return;
  const [user] = await useDb().select({ id: users.id }).from(users).where(eq(users.id, assigneeId));
  if (!user) {
    throw createError({ statusCode: 400, message: "担当者が見つかりません" });
  }
}
