---
name: create-issue
description: Turn a feature idea, bug report, or task into a well-formed GitHub issue with testable acceptance criteria, ready for `/ship`. Use when the user wants to register, file, create, or split work into issues (issue-driven development).
argument-hint: <idea | bug | task description>
---

# create-issue

Input: `$ARGUMENTS` — a rough description of the work. Issues created here are the input to `/ship`, so the acceptance criteria must be concrete enough to write tests from.

## 1. Understand

- Read the request. Check the relevant code under `app/` (and `server/` if present) only as far as needed to make the issue concrete — don't plan the implementation.
- Look for duplicates: `gh issue list --state open --search "<keywords>"`. If one exists, show it and ask whether to update it instead.
- **Ask** when the expected behavior, UI, or data shape is unclear — that's exactly what `/ship` would otherwise stop on. Ask everything in one round; decide small details yourself.

## 2. Size

One issue = one PR that can be reviewed on its own. If the request is bigger (several screens, independent behaviors, or setup + feature), split it into issues that each deliver something verifiable, in dependency order. Prefer vertical slices over "backend issue / frontend issue".

## 3. Draft

Title: imperative, specific, ≤60 chars, no type prefix (e.g. `Show river list on the top page`). Labels: `enhancement` for features, `bug` for defects, `documentation` for docs-only; only use labels that exist (`gh label list`).

Body:

```markdown
## Background

<why this is needed — the user problem or motivation, 1–3 sentences>

## Acceptance criteria

- [ ] <observable behavior, testable: "Given X, when Y, then Z" or a concrete check>
- [ ] ...

## Out of scope

- <things a reader might expect but that are deliberately excluded>

## Notes

<related issues (`Depends on #n`), constraints, links — omit the section if empty>
```

For bugs, replace Background with `## Steps to reproduce`, `## Expected`, `## Actual`, then keep Acceptance criteria (at least: the bug no longer reproduces, covered by a regression test).

Acceptance criteria rules:

- Each item is a behavior someone can check, not an implementation step ("Empty list shows 'No rivers yet'", not "Add an EmptyState component").
- Include edge cases that matter (empty, error, loading) only when they are in scope.
- Keep it to what this issue needs; extra ideas go to Out of scope or a separate issue.

## 4. Confirm, then create

Show all drafts (title, labels, body) to the user and **wait for approval** — creating issues is visible on GitHub. Apply requested edits.

Then create each one, in dependency order so later issues can reference earlier numbers:

```sh
gh issue create --title "<title>" --label "<label>" --body-file <file>
```

Write bodies to a file in the scratchpad directory rather than passing them inline (avoids shell quoting issues).

## Report

List each created issue as `#<n> <title> — <URL>`, and suggest the first one to run with `/ship <n>`.
