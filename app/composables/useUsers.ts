/** Registered users for assignee pickers, fetched once and shared across components. */
export function useUsers() {
  return useFetch<AssigneeRef[]>("/api/users", { key: "users", default: () => [] });
}
