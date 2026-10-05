<script setup lang="ts">
const route = useRoute();
const projectId = computed(() => String(route.params.id));

const { data: project, error } = await useFetch(() => `/api/projects/${projectId.value}`);
throwOnFetchError(error);

useHead({ title: () => project.value?.name ?? "" });
</script>

<template>
  <div v-if="project">
    <h1>{{ project.name }}</h1>
  </div>
</template>
