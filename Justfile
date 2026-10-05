default:
  @just --list

# Install dependencies
install:
  pnpm install

# Start the Nuxt dev server
dev:
  pnpm dev

# Build for production
build:
  pnpm build

# Lint with oxlint
lint:
  pnpm lint

# Type-check with vue-tsc
typecheck:
  pnpm typecheck

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
  pnpm typecheck
  pnpm test
