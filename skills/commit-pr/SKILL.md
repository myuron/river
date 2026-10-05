---
name: commit-pr
description: Commit the current changes with a Conventional Commits message on a feature branch, push it, and open a GitHub pull request with `gh`. Use when the user asks to commit, push, or open/create a PR for finished work.
---

# commit-pr

## Steps

1. **Check state**: `git status`, `git diff`, `git log --oneline -5`. Make sure the change is the intended one and contains no secrets, debug output, or unrelated edits. If there are unrelated changes, ask which to include instead of guessing.
2. **Branch**: if on `main`, create a branch first — `<type>/<short-kebab-summary>` (e.g. `feat/river-list-page`, `fix/12-empty-state`; include the issue number when there is one). Never commit directly to `main`.
3. **Commit**: stage files explicitly by path (not `git add -A`). Message format:

   ```
   <type>(<optional scope>): <imperative summary, ≤72 chars>

   <why the change was made, if not obvious>

   Closes #<issue>   ← only when an issue exists
   ```

   `type` is one of `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`, `perf`, `build`. Split unrelated changes into separate commits.

4. **Push**: `git push -u origin <branch>`. Never force-push and never push to `main`.
5. **PR**: `gh pr create --base main --title "<same as commit summary>" --body-file <file>` with this body:

   ```markdown
   ## Summary

   <what changed and why, 1–3 bullets>

   ## Testing

   <tests added/updated, and `just ci` result>

   Closes #<issue>
   ```

6. Report the PR URL.

## Rules

- Run the `verify` skill first if `just ci` has not passed since the last code change.
- If a hook or `gh` rejects something, report it — don't work around it with `--no-verify` or force flags.
