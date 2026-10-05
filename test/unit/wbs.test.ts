import { describe, expect, it } from "vitest";
import { buildWbsTree, flattenWbsTree } from "../../shared/utils/wbs";

const task = (id: number, parentId: number | null = null) => ({ id, parentId, title: `t${id}` });

const numbers = (tasks: ReturnType<typeof task>[]) =>
  flattenWbsTree(buildWbsTree(tasks)).map((n) => [n.task.id, n.number, n.depth]);

describe("WBS tree", () => {
  it("returns no rows for no tasks", () => {
    expect(numbers([])).toEqual([]);
  });

  it("numbers tasks hierarchically in pre-order", () => {
    const tasks = [task(1), task(2, 1), task(3, 1), task(4, 3), task(5)];
    expect(numbers(tasks)).toEqual([
      [1, "1", 0],
      [2, "1.1", 1],
      [3, "1.2", 1],
      [4, "1.2.1", 2],
      [5, "2", 0],
    ]);
  });

  it("orders siblings by creation (id), regardless of input order", () => {
    const tasks = [task(9, 1), task(1), task(4, 1), task(2)];
    expect(numbers(tasks)).toEqual([
      [1, "1", 0],
      [4, "1.1", 1],
      [9, "1.2", 1],
      [2, "2", 0],
    ]);
  });

  it("supports unlimited depth", () => {
    const tasks = [task(1), task(2, 1), task(3, 2), task(4, 3), task(5, 4)];
    expect(numbers(tasks).at(-1)).toEqual([5, "1.1.1.1.1", 4]);
  });

  it("exposes children on each node", () => {
    const [root] = buildWbsTree([task(1), task(2, 1), task(3, 2)]);
    expect(root!.children.map((c) => c.task.id)).toEqual([2]);
    expect(root!.children[0]!.children.map((c) => c.task.id)).toEqual([3]);
  });
});
