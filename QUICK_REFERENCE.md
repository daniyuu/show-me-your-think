# Quick Reference

## Command Line Usage

### Basic Analysis

```bash
pnpm dev analyze owner/repo
```

### All Options

```bash
pnpm dev analyze owner/repo \
  --output ./custom-report.md \
  --days 14 \
  --github-token ghp_xxx \
  --anthropic-key sk-ant-xxx \
  --anthropic-base-url http://localhost:4141 \
  --model claude-opus-4.6
```

## Environment Variables

Create `.env` file:

```env
# Required
GITHUB_TOKEN=ghp_your_token
ANTHROPIC_API_KEY=sk-ant-your_key

# Optional
ANTHROPIC_BASE_URL=http://localhost:4141
MODEL=claude-opus-4.6
```

## Configuration Priority

Options are resolved in this order (highest priority first):

1. **Command line arguments** (`--anthropic-base-url`)
2. **Environment variables** (`ANTHROPIC_BASE_URL`)
3. **Default values**

## Examples

### Example 1: Local Development with Mock API

```bash
# Start mock server (see CUSTOM_ENDPOINT.md)
node mock-server.js

# Run analysis
ANTHROPIC_BASE_URL=http://localhost:4141 \
ANTHROPIC_API_KEY=mock \
pnpm dev analyze daniyuu/show-me-your-think
```

### Example 2: Production with Custom Model

```bash
pnpm dev analyze facebook/react \
  --model claude-sonnet-4-20250514 \
  --output react-analysis.md \
  --days 7
```

### Example 3: Analyze Multiple Repos

```bash
#!/bin/bash
REPOS=(
  "facebook/react"
  "vercel/next.js"
  "vuejs/core"
)

for repo in "${REPOS[@]}"; do
  echo "Analyzing $repo..."
  pnpm dev analyze "$repo" --output "./${repo//\//-}-report.md"
done
```

## Output

### Console Output

```
🧠 Show Me Your Think

Repository: owner/repo
Model: claude-opus-4.6
API Endpoint: http://localhost:4141
Output: ./think-report.md

🔧 Using custom API endpoint: http://localhost:4141
🔍 Analyzing owner/repo...
📊 Fetching branches...
✅ Found 5 active branches
🤖 Analyzing features with AI...
   Analyzing: feature/auth-refactor
   Analyzing: fix/memory-leak
   Analyzing: perf/optimize-render
   Analyzing: feat/dark-mode
   Analyzing: refactor/api-client
🔗 Analyzing feature relationships...
💡 Generating insights...
✔ Report generated: ./think-report.md

📊 Summary:
  Active branches: 5
  Main themes: authentication, performance, refactor
  Potential conflicts: 1

✨ Analysis complete!
```

### Markdown Report Structure

```markdown
# 🧠 Show Me Your Think

**Repository:** `owner/repo`
**Analyzed at:** 2024-03-09 14:30:00

## 📊 Summary
...

## 🚀 Active Features

### 1. `feature/auth-refactor` 🟢
...

## ⚠️ Potential Conflicts
...

## 📌 Notes
...
```

## Common Workflows

### First-Time Setup

```bash
# Clone and setup
git clone https://github.com/daniyuu/show-me-your-think.git
cd show-me-your-think
pnpm install

# Configure
cp .env.example .env
# Edit .env with your tokens

# Test
pnpm dev config
pnpm dev analyze daniyuu/show-me-your-think
```

### Daily Usage

```bash
# Quick analysis
pnpm dev analyze owner/repo

# With custom settings
pnpm dev analyze owner/repo --days 7 --output today-analysis.md
```

### CI/CD Integration

```yaml
# .github/workflows/analyze.yml
name: Analyze Branches
on:
  schedule:
    - cron: '0 9 * * *' # Daily at 9 AM

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - run: pnpm install

      - name: Run Analysis
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          pnpm dev analyze ${{ github.repository }} \
            --output ./analysis-report.md

      - uses: actions/upload-artifact@v3
        with:
          name: analysis-report
          path: ./analysis-report.md
```

## Troubleshooting

### Error: GitHub token required

```bash
# Set token
export GITHUB_TOKEN=ghp_your_token

# Or use command line
pnpm dev analyze owner/repo --github-token ghp_your_token
```

### Error: Anthropic API key required

```bash
# Set key
export ANTHROPIC_API_KEY=sk-ant-your_key

# Or use command line
pnpm dev analyze owner/repo --anthropic-key sk-ant-your_key
```

### Error: Connection refused (custom endpoint)

```bash
# Check if proxy is running
curl http://localhost:4141/health

# Check port
netstat -an | grep 4141
```

### Error: Rate limit exceeded

```bash
# Analyze fewer branches
pnpm dev analyze owner/repo --days 7

# Wait and retry (GitHub resets hourly)
```

## Performance Tips

### Reduce API Calls

```bash
# Analyze only recent branches
pnpm dev analyze owner/repo --days 7

# Use caching proxy (see CUSTOM_ENDPOINT.md)
```

### Parallel Analysis

```bash
# Analyze multiple repos in parallel
pnpm dev analyze owner/repo1 &
pnpm dev analyze owner/repo2 &
pnpm dev analyze owner/repo3 &
wait
```

## Advanced Configuration

### Custom Branch Filter

Edit `packages/core/src/types.ts`:

```typescript
export interface AnalysisConfig {
  // ...
  branchFilter?: (branch: Branch) => boolean;
}
```

Usage:

```typescript
const config: AnalysisConfig = {
  // ...
  branchFilter: (branch) => {
    // Only analyze branches starting with "feature/"
    return branch.name.startsWith('feature/');
  },
};
```

## Help Commands

```bash
# General help
pnpm dev --help

# Command help
pnpm dev analyze --help

# Configuration guide
pnpm dev config
```
