# 🧠 show-me-your-think

> **Code is cheap, thinking is expensive.** Understand *what* people are building and *why* they're building it.

In the age of AI-assisted coding, code itself has become a commodity. What matters now is the **reasoning** behind the code — the "why" behind every feature. This tool analyzes GitHub repositories to extract and visualize the thinking process behind active development work.

## 🎯 What It Does

Given any GitHub repository, `show-me-your-think` will:

1. **Find active branches** - Identifies what everyone is currently working on
2. **Extract intent** - Uses AI to understand *what* is being built and *why*
3. **Map relationships** - Discovers dependencies, conflicts, and connections between features
4. **Generate insights** - Creates a comprehensive report with architectural impact analysis

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- GitHub OAuth App ([setup guide](OAUTH_SETUP.md))
- Anthropic API Key ([get one here](https://console.anthropic.com/)) or use local proxy

### Installation

```bash
# Clone the repository
git clone https://github.com/daniyuu/show-me-your-think.git
cd show-me-your-think

# Install dependencies
pnpm install

# Build the project
pnpm build

# Configure OAuth Client ID (one-time setup)
cp .env.example .env
# Edit .env and set GITHUB_OAUTH_CLIENT_ID (see OAUTH_SETUP.md)
```

### Usage

**First Run - OAuth Device Flow**

```bash
# First time: OAuth Device Flow authentication
pnpm dev analyze googleworkspace/cli

# 🔐 GitHub Authentication
# Opening GitHub in your browser for authentication...
#
# Enter this code in your browser:
#     WXYZ-1234
#
# ✓ Browser opened automatically
# ⠋ Waiting for you to approve in browser...

# Subsequent runs: uses saved token
pnpm dev analyze owner/repo
# ✓ Using saved GitHub credentials
```

See [DEVICE_FLOW.md](DEVICE_FLOW.md) for detailed authentication guide.

**Command Options**

```bash
# Analyze any GitHub repository
pnpm dev analyze owner/repo
pnpm dev analyze facebook/react

# Specify output file
pnpm dev analyze owner/repo --output ./my-report.md

# Adjust active days threshold (default: 30)
pnpm dev analyze owner/repo --days 14

# Use custom API endpoint (e.g., local proxy)
pnpm dev analyze owner/repo --anthropic-base-url http://localhost:4141

# Specify model
pnpm dev analyze owner/repo --model claude-opus-4.6
```

### Custom API Endpoints

You can route requests through a local proxy or custom endpoint:

```bash
# Via environment variable
export ANTHROPIC_BASE_URL=http://localhost:4141
pnpm dev analyze owner/repo

# Via command line
pnpm dev analyze owner/repo --anthropic-base-url http://localhost:4141
```

**Use cases:**
- Local development and testing
- Cost optimization with caching
- Corporate proxy requirements
- Custom model endpoints

See [CUSTOM_ENDPOINT.md](CUSTOM_ENDPOINT.md) for detailed setup instructions.

## 📊 Example Output

The tool generates a detailed Markdown report with:

### Summary
- Total active branches
- Main development themes
- Potential conflicts

### Per-Feature Analysis
- **What**: Clear description of what's being built
- **Why**: The reasoning and motivation
- **Architectural Impact**: How it affects the codebase
- **Relationships**: Dependencies and conflicts with other features
- **Confidence Score**: AI's confidence in the analysis

### Example

```markdown
### 1. `feature/auth-refactor` 🟢

**What**
Migrating authentication system from JWT to OAuth2.0 with support for enterprise SSO providers.

**Why**
Responding to enterprise customer requirements for SSO integration. Current JWT implementation
lacks the flexibility needed for multi-tenant scenarios.

**Architectural Impact**
Major refactor of auth middleware layer. Touches user session management, API gateway, and
3 downstream microservices. Requires database migration for user identity mapping.

**Related Features**
- ⚠️ conflicts-with: `fix/session-memory-leak` - Both modify session store
- 🏗️ builds-on: `infra/redis-cluster` - Requires new session backend
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
│   └── cli/                  # Command-line interface
└── (future: web dashboard)
```

## 🔮 Roadmap

- [x] **MVP**: CLI tool with Markdown reports
- [ ] **V2**: Interactive terminal UI (TUI)
- [ ] **V3**: Web dashboard for team collaboration
  - Real-time updates
  - Multi-repo monitoring
  - Team notifications

## 🤝 Contributing

Contributions welcome! This project is in early stages and we'd love your input.

## 📄 License

MIT

---

*Built by [@daniyuu](https://github.com/daniyuu) - because understanding the "why" matters more than the "what"*
