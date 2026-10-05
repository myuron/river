---
name: verify
description: Run the project's full CI checks (`just ci`) locally and fix failures until everything passes. Use after implementing a change, before committing or opening a PR, or when the user asks to "verify", "check", or "make CI green".
---

# verify

Make the working tree pass exactly what CI runs: `just ci` (format check → lint → typecheck → test → e2e).

## Steps

1. Run `nix fmt` first — `just ci` only checks formatting, and new or generated files (e.g. drizzle migration meta) are never formatted by the edit hook. Then run `just ci`. It stops at the first failing step, so read which step failed.
2. Fix the failure according to the table below, then re-run `just ci`.
3. Repeat until it passes. If the same failure survives 3 attempts, stop and report what you tried instead of looping.

| Failing step               | How to fix                                                                                                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nix fmt -- --ci`          | Run `nix fmt` to apply formatting, then check `git diff` to confirm only formatting changed.                                                                                                       |
| `pnpm lint` (oxlint)       | Fix the code. Do not disable rules or add `eslint-disable`/`oxlint-disable` comments unless the rule is clearly a false positive — and say so in your report.                                      |
| `pnpm typecheck` (vue-tsc) | Fix the types. Don't paper over with `any`, `as unknown as`, or `@ts-ignore`. TypeScript is pinned to 6.x on purpose (vue-tsc breaks on 7) — never upgrade it.                                     |
| `pnpm test` (vitest)       | Decide whether the code or the test is wrong. Only change a test's expectation when the spec actually changed; never delete or skip a failing test to go green.                                    |
| `playwright test` (e2e)    | Same rule as vitest. Use the trace in `test-results/` to see why. If browsers fail to launch, check `@playwright/test` still matches nixpkgs `playwright-driver` — never run `playwright install`. |

## Rules

- Fix root causes; don't weaken checks (config, rule severity, `--passWithNoTests` etc.) to get green.
- If a fix needs a new tool, add it to `devShells.default.packages` in `flake.nix` instead of installing globally.

## Report

End with one line per step: passed, or what was fixed. If you gave up, include the remaining error output. Also state how many times `just ci` was run.
