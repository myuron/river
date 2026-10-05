<script setup lang="ts">
const route = useRoute();
const projectId = computed(() => String(route.params.id));

const [{ data: project, error }, { data: tasks, refresh: refreshTasks }] = await Promise.all([
  useFetch<Project>(() => `/api/projects/${projectId.value}`),
  useFetch<Task[]>(() => `/api/projects/${projectId.value}/tasks`, { default: () => [] }),
]);
throwOnFetchError(error);

useHead({ title: () => project.value?.name ?? "" });
</script>

<template>
  <div v-if="project">
    <h1>{{ project.name }}</h1>

    <h2>WBS</h2>
    <WbsTree :project-id="project.id" :tasks="tasks" @changed="refreshTasks" />
  </div>
</template>
