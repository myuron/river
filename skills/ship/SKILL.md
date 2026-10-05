---
name: ship
description: Take a GitHub issue (or a short task description) all the way to an open pull request — plan, implement test-first, verify with `just ci`, get an independent review, open the PR, and log friction for later improvement. Invoke as `/ship <issue-number>` or `/ship <description>`.
disable-model-invocation: true
argument-hint: <issue-number | task description>
---

# ship

Input: `$ARGUMENTS` — an issue number, or a free-text task.

Track progress with a todo list, one item per phase below.

## 1. Understand

- Issue number → `gh issue view <n> --comments`. Free text → use it as the requirement.
- Write down the **acceptance criteria** as a short checklist. If the issue doesn't state them, derive them and show them to the user.
- **Stop and ask** if the requirement is ambiguous in a way that changes the design (unclear behavior, UI, or data shape). Don't guess on those; do decide small details yourself and mention them in the PR.

## 2. Plan

- Read the relevant code under `app/` (and `server/` if present) and the existing tests.
- Make a short plan: files to touch, tests to add. Keep it to the minimum that satisfies the acceptance criteria — no unrequested refactors or features.
- Create a branch from an up-to-date `main`: `git switch main && git pull --ff-only && git switch -c <type>/<issue>-<kebab-summary>`. If the working tree has unrelated uncommitted changes, stop and ask first.

## 3. Implement (test-first)

For each acceptance criterion:

1. Write a vitest test that expresses it, in `test/unit/` (plain logic) or `test/nuxt/` (components/composables) — see "Testing" in `CLAUDE.md`. Tests elsewhere are not picked up.
2. Run `just test <file>` and confirm it **fails for the expected reason**.
3. Implement the minimum to make it pass; re-run.

Where a criterion can't reasonably be unit-tested (pure layout/visual), note it and check it by running the app instead.

## 4. Verify

Run the `verify` skill until `just ci` passes.

## 5. Review

Spawn the `reviewer` agent. Pass it the acceptance criteria and the issue number; don't pass your own reasoning about the implementation, so it reviews with fresh eyes.

- Fix `blocker` and `major` findings, then go back to step 4.
- For findings you disagree with, keep a one-line reason for the PR description.
- At most 2 review rounds; if blockers remain after that, stop and report to the user.

## 6. Open the PR

Run the `commit-pr` skill. Include in the PR body: the acceptance criteria checklist, decisions you made on unclear details, and any review findings you chose not to address (with reasons).

## 7. Log friction

Append one entry to `.claude/friction.md` (git-ignored, local only; create it with a `# Friction log` heading if missing). Do this even if the run stopped early — a stopped run is the most useful entry. Be factual and specific; don't write "went smoothly" filler, and leave a section as `none` if nothing happened.

```markdown
## YYYY-MM-DD #<issue or short task> — <PR URL | stopped at phase N>

- just ci runs: <n> (failures: <step: cause>, ...)
- review rounds: <n>; findings: <severity: one-line gist>, ...
- human interventions: <each time the user interrupted, corrected, rejected a tool call, or asked a question you should have answered yourself — quote or paraphrase what they said>
- stuck points: <where you spent many steps, re-read files, or were unsure what to do, and why>
- missing knowledge: <facts about this repo you had to discover that a skill/CLAUDE.md could have told you>
```

## Report

Finish with: PR URL, acceptance criteria status, and anything the user should look at manually.
