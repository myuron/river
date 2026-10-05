<script setup lang="ts">
defineProps<{ label: string; value: string | number; testid?: string }>();
</script>

<template>
  <div class="tile">
    <div class="label">{{ label }}</div>
    <div class="value" :data-testid="testid">{{ value }}</div>
  </div>
</template>

<style scoped>
.tile {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.75rem 1rem;
  min-width: 7.5rem;
}

.label {
  font-size: 0.8rem;
  color: var(--muted);
}

.value {
  font-size: 1.6rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.3;
}
</style>
