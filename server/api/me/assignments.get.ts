import { and, eq, inArray, ne } from "drizzle-orm";
import { issues, projects, tasks } from "../../db/schema";

/**
 * The current user's unfinished tasks and unresolved issues across all
 * projects, each sorted by its deadline (unset last).
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user!;
  const db = useDb();

  const myTasks = await db
    .select({
      id: tasks.id,
      projectId: tasks.projectId,
      projectName: projects.name,
      title: tasks.title,
      status: tasks.status,
      plannedEnd: tasks.plannedEnd,
    })
    .from(tasks)
    .innerJoin(projects, eq(projects.id, tasks.projectId))
    .where(and(eq(tasks.assigneeId, user.id), ne(tasks.status, "done")));

  // WBS numbers depend on every task in the project, not just the user's.
  const projectIds = [...new Set(myTasks.map((t) => t.projectId))];
  const numbers = new Map<number, string>();
  if (projectIds.length > 0) {
    const all = await db
      .select({ id: tasks.id, parentId: tasks.parentId, projectId: tasks.projectId })
      .from(tasks)
      .where(inArray(tasks.projectId, projectIds));
    for (const projectId of projectIds) {
      const tree = buildWbsTree(all.filter((t) => t.projectId === projectId));
      for (const node of flattenWbsTree(tree)) numbers.set(node.task.id, node.number);
    }
  }

  const myIssues = await db
    .select({
      id: issues.id,
      projectId: issues.projectId,
      projectName: projects.name,
      title: issues.title,
      status: issues.status,
      priority: issues.priority,
      dueDate: issues.dueDate,
    })
    .from(issues)
    .innerJoin(projects, eq(projects.id, issues.projectId))
    .where(and(eq(issues.assigneeId, user.id), ne(issues.status, "resolved")));

  return {
    tasks: myTasks
      .map((t) => ({ ...t, wbsNumber: numbers.get(t.id) ?? "" }))
      .sort((a, b) => compareDatesNullsLast(a.plannedEnd, b.plannedEnd) || a.id - b.id),
    issues: myIssues.sort((a, b) => compareDatesNullsLast(a.dueDate, b.dueDate) || a.id - b.id),
  } satisfies { tasks: MyTask[]; issues: MyIssue[] };
});
