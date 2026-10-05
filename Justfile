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

# Run Playwright e2e tests (applies migrations, builds and starts the app; needs `just db-up`)
e2e *args:
  pnpm exec drizzle-kit migrate
  pnpm exec playwright test {{args}}

# Run all checks (used by CI)
ci: install
  nix fmt -- --ci
  pnpm lint
  pnpm typecheck
  pnpm test
  pnpm exec drizzle-kit migrate
  pnpm exec playwright test

# Start the local PostgreSQL container
db-up:
  docker compose up -d --wait db

# Stop the local PostgreSQL container
db-down:
  docker compose down

# Generate SQL migrations from server/db/schema.ts
db-generate *args:
  pnpm exec drizzle-kit generate {{args}}

# Apply pending migrations to the database
db-migrate:
  pnpm exec drizzle-kit migrate

# Open Drizzle Studio
db-studio:
  pnpm exec drizzle-kit studio
