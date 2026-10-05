<script setup lang="ts">
defineProps<{ state: "overdue" | "soon" }>();
</script>

<template>
  <span class="badge" :class="state" data-testid="deadline-badge" :data-state="state">
    {{ state === "overdue" ? "期限切れ" : "期限間近" }}
  </span>
</template>

<style scoped>
.badge {
  display: inline-block;
  margin-left: 0.35rem;
  padding: 0 0.4rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.overdue {
  color: var(--danger);
  background: var(--danger-bg);
}

.soon {
  color: var(--warning);
  background: var(--warning-bg);
}
</style>
