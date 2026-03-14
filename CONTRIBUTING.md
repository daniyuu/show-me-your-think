# Contributing to Show Me Your Think

Thanks for wanting to contribute! Here's how to get started.

## Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0 (project uses `pnpm@9.5.0`)

## Setup

```bash
# Clone the repo
git clone https://github.com/daniyuu/show-me-your-think.git
cd show-me-your-think

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

## Project Structure

This is a **pnpm monorepo** with three packages:

| Package | Path | Description |
|---------|------|-------------|
| `@smyt/core` | `packages/core/` | Core analysis engine — fetcher, analyzer, types |
| `@smyt/cli` | `packages/cli/` | CLI tool for analyzing repos from the terminal |
| `@smyt/web` | `packages/web/` | Next.js web dashboard |

## Development

```bash
# Run the CLI in dev mode
pnpm dev

# Run the web dashboard
pnpm --filter @smyt/web dev

# Build all packages
pnpm build

# Lint the web package
pnpm --filter @smyt/web lint
```

## Code Style

The project uses **Prettier** and **ESLint** with a pre-commit hook (via Husky + lint-staged):

- **Prettier** formats `.ts`, `.tsx`, `.json`, and `.md` files on commit
- **ESLint** auto-fixes `.ts` and `.tsx` files on commit

You don't need to run these manually — they run automatically when you commit. But if you want to check:

```bash
pnpm --filter @smyt/web lint
```

Key style rules (from `.prettierrc`):
- Semicolons: **yes**
- Quotes: **single**
- Tab width: **2**
- Trailing commas: **es5**
- Print width: **100**

## Submitting Changes

1. **Fork the repo** and create a branch from `main`:
   ```bash
   git checkout -b fix/issue-number-short-description
   ```

2. **Make your changes** and test them locally

3. **Commit** with a descriptive message following [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   fix: resolve duplicate heading in README (#3)
   feat: add rate limit handling to fetcher
   docs: add contributing guide
   ```

4. **Push** to your fork and open a **Pull Request**

5. In your PR description, reference the issue: `Fixes #<number>`

## Branch Naming

- `fix/<issue>-<description>` — bug fixes
- `feat/<issue>-<description>` — new features
- `docs/<issue>-<description>` — documentation
- `chore/<description>` — maintenance tasks

## Environment Variables

- **Root `.env`**: OAuth Client ID for GitHub App (`cp .env.example .env`)
- **`packages/web/.env`**: `GITHUB_TOKEN` for the web dashboard (`cp packages/web/.env.example packages/web/.env`)

See each `.env.example` for details.

## Questions?

Open an issue! We're happy to help.
