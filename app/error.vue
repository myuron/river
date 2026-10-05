<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();

const message = computed(() =>
  props.error.statusCode === 404 ? "ページが見つかりません" : "エラーが発生しました",
);
</script>

<template>
  <main class="error-page">
    <h1>{{ error.statusCode }}</h1>
    <p>{{ message }}</p>
    <button type="button" @click="clearError({ redirect: '/' })">トップへ戻る</button>
  </main>
</template>

<style scoped>
.error-page {
  max-width: 600px;
  margin: 4rem auto;
  text-align: center;
}
</style>
