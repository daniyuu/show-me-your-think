# 🧠 show-me-your-think

> **Code is cheap, thinking is expensive.** Understand *what* people are building and *why* they're building it.

In the age of AI-assisted coding, code itself has become a commodity. What matters now is the **reasoning** behind the code — the "why" behind every feature. This tool analyzes GitHub repositories to extract and visualize the thinking process behind active development work.

## 🎯 What It Does

Given any GitHub repository, `show-me-your-think` will:

1. **Find active branches** - Identifies what everyone is currently working on
2. **Extract intent** - Uses AI to understand *what* is being built and *why*
3. **Map relationships** - Discovers dependencies, conflicts, and connections between features
4. **Generate insights** - Creates a comprehensive report with architectural impact analysis

## 📦 Available Interfaces

- **🌐 Web Dashboard** - Beautiful web interface with real-time analysis
- **⌨️ CLI Tool** - Command-line interface with OAuth Device Flow

## 🚀 Quick Start

### Option 1: Web Dashboard (Recommended)

```bash
# Install dependencies
pnpm install

# Configure environment (see packages/web/.env.example)
cp packages/web/.env.example packages/web/.env.local
# Edit .env.local and set GITHUB_TOKEN

# Start web server
pnpm --filter @smyt/web dev

# Open http://localhost:3000 in your browser
```

### Option 2: CLI Tool

### Option 2: CLI Tool

```bash
# Install dependencies
pnpm install
pnpm build

# Configure OAuth Client ID
cp .env.example .env
# Edit .env and set GITHUB_OAUTH_CLIENT_ID (see OAUTH_SETUP.md)

# Run analysis
pnpm dev analyze googleworkspace/cli
```

**CLI Features:**
- OAuth Device Flow authentication (no manual token copy-paste)
- Saves token for subsequent runs
- Command-line options for customization

See [DEVICE_FLOW.md](DEVICE_FLOW.md) for detailed CLI authentication guide.

## 📊 Example Usage

### Web Dashboard
1. Enter repository: `facebook/react`
2. Set active days: `30`
3. Click "开始分析"
4. View beautiful results
5. Download Markdown report

### CLI
```bash
# Basic analysis
pnpm dev analyze owner/repo

# Custom options
pnpm dev analyze owner/repo --output ./my-report.md

# Adjust active days threshold (default: 30)
pnpm dev analyze owner/repo --days 14

# Custom model
pnpm dev analyze owner/repo --model claude-opus-4.6
```

## 🏗️ Architecture

```
show-me-your-think/
├── packages/
│   ├── core/                 # Shared analysis logic
│   │   ├── fetcher.ts       # GitHub API data fetching
│   │   ├── analyzer.ts      # AI-powered intent extraction
│   │   ├── repo-analyzer.ts # Main orchestrator
│   │   └── markdown-generator.ts
│   ├── cli/                  # Command-line interface
│   │   └── github-auth.ts   # OAuth Device Flow
│   └── web/                  # Web dashboard (Next.js)
│       ├── app/             # Next.js App Router
│       ├── components/      # React components
│       └── api/             # API routes
```

## 🔮 Roadmap

- [x] **V1**: CLI tool with Markdown reports
- [x] **V2**: Web dashboard with beautiful UI
- [ ] **V3**: Real-time collaboration features
  - Multi-repo monitoring
  - Team notifications
  - Webhook integrations

## 🤝 Contributing

Contributions welcome! This project is in early stages and we'd love your input.

## 📄 License

MIT

---

*Built by [@daniyuu](https://github.com/daniyuu) - because understanding the "why" matters more than the "what"*
