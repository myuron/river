<script setup lang="ts">
defineProps<{ value: string }>();
</script>

<template>
  <NuxtTime
    :datetime="value"
    locale="ja-JP"
    year="numeric"
    month="2-digit"
    day="2-digit"
    hour="2-digit"
    minute="2-digit"
  />
</template>
