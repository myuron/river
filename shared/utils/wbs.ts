export interface WbsItem {
  id: number;
  parentId: number | null;
}

export interface WbsNode<T extends WbsItem> {
  task: T;
  /** Hierarchical WBS number, e.g. "1.2.1". */
  number: string;
  /** 0 for top-level tasks. */
  depth: number;
  children: WbsNode<T>[];
}

/** Builds the WBS tree. Siblings are ordered by id (= creation order). */
export function buildWbsTree<T extends WbsItem>(tasks: readonly T[]): WbsNode<T>[] {
  const byParent = new Map<number | null, T[]>();
  for (const task of [...tasks].sort((a, b) => a.id - b.id)) {
    const siblings = byParent.get(task.parentId) ?? [];
    siblings.push(task);
    byParent.set(task.parentId, siblings);
  }

  const build = (parentId: number | null, prefix: string, depth: number): WbsNode<T>[] =>
    (byParent.get(parentId) ?? []).map((task, index) => {
      const number = prefix ? `${prefix}.${index + 1}` : String(index + 1);
      return { task, number, depth, children: build(task.id, number, depth + 1) };
    });

  return build(null, "", 0);
}

/** Flattens the tree in display (pre-) order. */
export function flattenWbsTree<T extends WbsItem>(nodes: readonly WbsNode<T>[]): WbsNode<T>[] {
  return nodes.flatMap((node) => [node, ...flattenWbsTree(node.children)]);
}

/** Number of tasks below `node` at any depth. */
export function countDescendants(node: WbsNode<WbsItem>): number {
  return node.children.reduce((sum, child) => sum + 1 + countDescendants(child), 0);
}
