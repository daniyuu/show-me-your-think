# Getting Started

## Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build
```

## Configuration

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
GITHUB_TOKEN=ghp_your_token_here
ANTHROPIC_API_KEY=sk-ant-your_key_here
```

### Getting API Keys

**GitHub Token:**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes:
   - `public_repo` (for public repos only)
   - `repo` (for private repos)
4. Copy the token

**Anthropic API Key:**
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new key
5. Copy the key

## Usage

### Analyze a Repository

```bash
# Using dev mode (no build needed)
pnpm dev analyze owner/repo

# After building
cd packages/cli
node dist/index.js analyze owner/repo
```

### Examples

```bash
# Analyze a small repo
pnpm dev analyze daniyuu/show-me-your-think

# Analyze with custom output
pnpm dev analyze facebook/react --output react-analysis.md

# Only consider branches active in last 7 days
pnpm dev analyze vercel/next.js --days 7
```

## Understanding the Output

The generated Markdown report includes:

### 1. Summary Section
- **Total active branches**: How many branches are being actively developed
- **Main themes**: Common patterns across features
- **Potential conflicts**: Features that might interfere with each other

### 2. Feature Analysis
For each active branch:
- **What**: Description of the feature
- **Why**: Business/technical reasoning
- **Architectural Impact**: How it affects the codebase
- **Related Features**: Dependencies and conflicts
- **Confidence Score**: 🟢 High | 🟡 Medium | 🔴 Low

### 3. Commit History
Collapsible section showing all commits for each feature

## Troubleshooting

### Rate Limiting

GitHub API has rate limits:
- Authenticated: 5,000 requests/hour
- Unauthenticated: 60 requests/hour

If you hit rate limits, wait an hour or analyze smaller repos.

### API Costs

Anthropic API pricing (as of 2024):
- Claude Sonnet 4: ~$3 per million input tokens

A typical analysis of a repo with 5 active branches might cost $0.05-0.20.

### Common Errors

**"GitHub token required"**
- Make sure `.env` file exists and contains `GITHUB_TOKEN`

**"Anthropic API key required"**
- Make sure `.env` file contains `ANTHROPIC_API_KEY`

**"Failed to fetch branches"**
- Check repo name format: `owner/repo`
- Verify GitHub token has correct permissions
- Ensure repo exists and is accessible

## Development

### Project Structure

```
show-me-your-think/
├── packages/
│   ├── core/                    # Core analysis logic
│   │   ├── src/
│   │   │   ├── types.ts        # TypeScript definitions
│   │   │   ├── fetcher.ts      # GitHub API client
│   │   │   ├── analyzer.ts     # AI analysis engine
│   │   │   ├── repo-analyzer.ts # Main orchestrator
│   │   │   ├── markdown-generator.ts
│   │   │   └── index.ts        # Exports
│   │   └── package.json
│   └── cli/                     # CLI interface
│       ├── src/
│       │   └── index.ts        # CLI commands
│       └── package.json
├── .env.example
├── package.json                 # Root package
├── pnpm-workspace.yaml
└── tsconfig.json
```

### Making Changes

```bash
# Work in watch mode
pnpm --filter @smyt/cli dev analyze owner/repo

# Run build after changes
pnpm build

# Test specific package
pnpm --filter @smyt/core build
```

### Adding New Features

The architecture is designed for extensibility:

1. **New data sources**: Extend `GitHubFetcher` or create new fetchers
2. **Better analysis**: Improve prompts in `AIAnalyzer`
3. **New output formats**: Add generators alongside `MarkdownGenerator`
4. **Web dashboard**: Create `packages/web` (architecture ready for it)

## Next Steps

- Try analyzing your own repositories
- Experiment with different repos to see how analysis quality varies
- Share feedback on what works and what doesn't!
