<template>
  <span class="overdue" data-testid="issue-overdue">期限切れ</span>
</template>

<style scoped>
.overdue {
  display: inline-block;
  margin-left: 0.35rem;
  padding: 0 0.4rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--danger);
  background: var(--danger-bg);
}
</style>
