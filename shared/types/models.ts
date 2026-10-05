// JSON shapes returned by the API (dates are ISO strings).

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
  createdAt: string;
}
