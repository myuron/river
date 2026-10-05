default:
  @just --list

# Install dependencies
install:
  pnpm install

# Lint with oxlint
lint:
  pnpm lint

# Run tests once with vitest
test *args:
  pnpm test {{args}}

# Run tests in watch mode
test-watch:
  pnpm exec vitest

# Run all checks (used by CI)
ci: install
  nix fmt -- --ci
  pnpm lint
  pnpm test
