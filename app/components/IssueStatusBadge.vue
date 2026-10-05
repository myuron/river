<script setup lang="ts">
defineProps<{ status: IssueStatus }>();
</script>

<template>
  <span class="status" :class="`status-${status}`" data-testid="issue-status">
    {{ ISSUE_STATUS_LABELS[status] }}
  </span>
</template>

<style scoped>
.status {
  display: inline-block;
  padding: 0 0.5rem;
  border-radius: 999px;
  font-size: 0.8rem;
  white-space: nowrap;
  border: 1px solid var(--border);
  background: var(--bg);
}

.status-open {
  color: var(--danger);
  border-color: var(--danger);
}

.status-in_progress {
  color: var(--accent);
  border-color: var(--accent);
}

.status-resolved {
  color: var(--muted);
}
</style>
