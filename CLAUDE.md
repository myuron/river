# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

river is a web application (early stage — no application code yet).

## Environment

- The dev environment is a Nix flake devShell (`flake.nix`), loaded via direnv (`.envrc`: `use flake`). It provides `nodejs`, `pnpm`, and `just`.
- Add new tools to `devShells.default.packages` in `flake.nix` — don't install globally or rely on ad-hoc `npx`/`nix-env`.
- Use `pnpm` as the package manager (not npm/yarn).

## Commands

- Define recurring tasks (dev, build, test, lint, etc.) as recipes in `Justfile`; run `just` to list them.
- `just lint` — oxlint (config: `.oxlintrc.json`). Run after editing JS/TS.
- `just test` — vitest run; pass args through, e.g. `just test src/foo.test.ts -t "name"`. `just test-watch` for watch mode.
- Format with `nix fmt` (treefmt-nix; currently only nixfmt). When adding a formatter for another language, register it under `treefmt.programs` in `flake.nix`.

## Conventions

- Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, ...).
