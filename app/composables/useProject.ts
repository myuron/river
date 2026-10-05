/** Loads the project of the current `/projects/:id/...` route; a missing project is a 404. */
export async function useProject() {
  const route = useRoute();
  const projectId = computed(() => String(route.params.id));
  const { data: project, error } = await useFetch<Project>(
    () => `/api/projects/${projectId.value}`,
  );
  throwOnFetchError(error);
  return { projectId, project };
}
