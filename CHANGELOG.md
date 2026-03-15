# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- MIT license (#44)
- GitHub Actions CI workflow for lint + test (#42)

### Fixed

- Branch listing capped at 100 — added pagination (#42)
- `parseInt` on `--days` option silently produced NaN (#41)
- `fetchCommits` hardcoded `main` instead of detecting default branch (#40)

## [0.1.0] — 2026-03-14

### Added

- Web dashboard with Next.js and OAuth 2.0 Authorization Code Flow
- CLI tool with OAuth Device Flow authentication
- Multi-provider LLM support (Anthropic, OpenAI) via `LLMProvider` interface
- Repository analysis: branch listing, commit fetching, AI-powered intent analysis
- Progress bar during analysis (branch X of N)
- Graceful GitHub API rate limit handling
- Keyword extraction with bigrams, deduplication, and expanded stop words
- Unit tests for core package with vitest
- `CONTRIBUTING.md` with development setup guide

### Fixed

- Duplicated "Option 2: CLI Tool" heading in README
- Clarified `.env.example` scope (root vs `packages/web`)
- AI response parsing with validation and fallbacks (no more silent failures)
- Concurrency limit on `fetchBranches` (max 5 parallel API calls)
