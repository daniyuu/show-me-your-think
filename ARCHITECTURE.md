# Architecture & Design

## Philosophy

**"Code is cheap, thinking is expensive"**

In the AI-assisted coding era, the bottleneck has shifted from writing code to understanding context and making decisions. This tool aims to extract and preserve the "why" behind code changes.

## Design Principles

1. **Separation of Concerns**: Data fetching, analysis, and presentation are independent
2. **Future-Proof**: Built for CLI today, web dashboard tomorrow
3. **AI-Powered**: Leverage LLMs for intent extraction, not just pattern matching
4. **Developer-Friendly**: TypeScript throughout, strong types, clear interfaces

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                         │
│                                                               │
│  ┌─────────────┐              ┌──────────────┐              │
│  │  CLI (MVP)  │              │ Web (Future) │              │
│  └─────────────┘              └──────────────┘              │
└────────────────────┬──────────────────┬──────────────────────┘
                     │                  │
                     └──────┬───────────┘
                            │
        ┌───────────────────▼────────────────────┐
        │         @smyt/core (Shared Logic)      │
        │                                        │
        │  ┌────────────────────────────────┐   │
        │  │      RepoAnalyzer (Main)       │   │
        │  │   • Orchestrates analysis      │   │
        │  │   • Coordinates all modules    │   │
        │  └────────────────────────────────┘   │
        │                                        │
        │  ┌──────────┐  ┌──────────┐          │
        │  │ Fetcher  │  │ Analyzer │          │
        │  │ (GitHub  │  │ (Claude  │          │
        │  │   API)   │  │   AI)    │          │
        │  └──────────┘  └──────────┘          │
        │                                        │
        │  ┌─────────────────────────────────┐  │
        │  │   Output Generators              │  │
        │  │  • MarkdownGenerator             │  │
        │  │  • (Future: JSON, HTML, etc.)    │  │
        │  └─────────────────────────────────┘  │
        └────────────────────────────────────────┘
                     │           │
         ┌───────────┴───┐   ┌───┴──────────┐
         │  GitHub API   │   │ Anthropic API│
         └───────────────┘   └──────────────┘
```

## Core Components

### 1. Type System (`types.ts`)

Defines the domain model:

```typescript
Branch → CommitInfo[] → Feature → RepoAnalysis
              ↓
         PullRequest (optional)
              ↓
         FeatureIntent (AI-extracted)
```

**Design Decision**: Use explicit types rather than loose objects to:
- Enable IDE autocomplete
- Catch errors at compile time
- Document the data structure

### 2. Data Layer (`fetcher.ts`)

**Responsibilities**:
- Fetch branches, commits, PRs from GitHub
- Handle pagination and rate limiting
- Return structured data

**Design Decision**: Separate GitHub logic from analysis logic:
- Easier to mock for testing
- Could swap for GitLab/Bitbucket in future
- Isolated API credential handling

### 3. Analysis Engine (`analyzer.ts`)

**Responsibilities**:
- Send code diffs + context to Claude
- Parse structured responses
- Extract "what", "why", and architectural impact
- Analyze relationships between features

**Design Decision**: Structured prompts with JSON output:
- More reliable than free-form text parsing
- Confidence scores enable quality filtering
- Relationship analysis in separate pass (better context)

**Key Insight**: The prompt design is critical:
```
Code diff + Commits + PR → "What" + "Why" + "Impact"
```

We provide:
- Branch name (often descriptive)
- Commit messages (developer intent)
- PR description (business context)
- Code diff (implementation details)

Claude synthesizes these into coherent reasoning.

### 4. Orchestration (`repo-analyzer.ts`)

**Responsibilities**:
- Coordinate fetcher and analyzer
- Handle errors gracefully
- Generate high-level insights
- Batch relationship analysis

**Design Decision**: Two-pass analysis:
1. **Pass 1**: Analyze each feature independently
2. **Pass 2**: Analyze relationships across all features

Why? Features need individual context first, relationships need global view.

### 5. Output Layer (`markdown-generator.ts`)

**Responsibilities**:
- Transform `RepoAnalysis` into human-readable format
- Handle formatting, emojis, collapsible sections

**Design Decision**: Separate generator from analysis:
- Easy to add new output formats (JSON, HTML)
- Presentation logic isolated from business logic
- Template-like approach for consistency

## Data Flow

```
1. User Input
   └─> "owner/repo" + config

2. Fetch Phase
   ├─> List all branches
   ├─> Filter active branches (last 30 days)
   └─> For each branch:
       ├─> Fetch commits (vs main)
       ├─> Fetch PR (if exists)
       └─> Fetch code diff

3. Analysis Phase
   ├─> For each feature:
   │   └─> AI: Extract intent (what/why/impact)
   │
   └─> Batch relationship analysis:
       └─> AI: Find dependencies/conflicts

4. Synthesis Phase
   ├─> Extract main themes
   ├─> Identify conflicts
   └─> Generate summary

5. Output Phase
   └─> Generate Markdown report
```

## AI Prompt Design

### Feature Analysis Prompt

**Input**: Branch name, commits, PR, code diff
**Output**: JSON with `what`, `why`, `architecturalImpact`, `confidence`

**Key Design Choices**:
- Truncate diffs to 10k chars (context window limits)
- Request confidence score (enables filtering low-quality results)
- Structured JSON (easier parsing, less hallucination)

### Relationship Analysis Prompt

**Input**: Array of features with their intents
**Output**: JSON array of relationships

**Key Design Choices**:
- Analyze in batch (global context)
- Four relationship types (clear taxonomy)
- File overlap hints (concrete evidence)

## Scalability Considerations

### Current (MVP)
- Analyzes one repo at a time
- Sequential feature analysis
- No caching

### Future Optimizations

1. **Parallel Analysis**
   - Analyze multiple features concurrently
   - Use Promise.all() for independent operations

2. **Caching Layer**
   - Cache commit analysis (immutable)
   - Only re-analyze new commits
   - Store in local DB (SQLite)

3. **Incremental Updates**
   - Watch for new commits
   - Only analyze changed branches

4. **Web Backend**
   - Job queue for analysis
   - Real-time updates via WebSocket
   - Multi-repo dashboard

## Extension Points

### 1. New Data Sources
Implement interface:
```typescript
interface DataFetcher {
  fetchBranches(): Promise<Branch[]>
  fetchCommits(): Promise<CommitInfo[]>
  // ...
}
```

Examples: GitLab, Bitbucket, local Git repos

### 2. New Analysis Strategies
Extend `AIAnalyzer` or create alternative:
- Pattern-based analysis (no AI)
- Multi-model ensemble
- Fine-tuned model for code understanding

### 3. New Output Formats
Implement interface:
```typescript
interface OutputGenerator {
  generate(analysis: RepoAnalysis): string | Buffer
}
```

Examples: JSON (for web), HTML, PDF, Notion page

## Technology Choices

### TypeScript
**Why**:
- Type safety across packages
- Better IDE support
- Shared types between CLI and (future) web

**Trade-off**: More verbose than Python, but worth it for full-stack vision

### Monorepo (pnpm workspaces)
**Why**:
- Share code between CLI and future web
- Single source of truth for types
- Easier dependency management

**Trade-off**: Slightly more complex setup, but scales better

### Claude Sonnet 4
**Why**:
- Best code understanding
- Large context window (200k tokens)
- Structured output support

**Trade-off**: More expensive than GPT-4o-mini, but quality matters here

## Performance Characteristics

**Typical Analysis** (5 active branches):
- GitHub API calls: ~20 requests (< 1% of rate limit)
- AI API calls: 6 (5 features + 1 relationship analysis)
- Cost: ~$0.10
- Time: 30-60 seconds

**Bottlenecks**:
1. AI analysis (sequential, 5-10s per feature)
2. GitHub API diff fetching (can be large)
3. Network latency

**Not bottlenecks** (yet):
- TypeScript/Node performance
- Memory usage

## Future Roadmap

### Phase 1: MVP ✅
- CLI tool
- GitHub data fetching
- AI-powered analysis
- Markdown output

### Phase 2: Enhanced CLI
- Interactive TUI (blessed, ink)
- Real-time progress
- Filter/search features
- Export to multiple formats

### Phase 3: Web Dashboard
- Next.js full-stack app
- Multi-repo monitoring
- Team collaboration
- Real-time updates
- Historical tracking

### Phase 4: Intelligence
- Learn from codebase patterns
- Suggest feature improvements
- Detect architectural drift
- Predict merge conflicts

## Design Trade-offs

### Explicit Over Implicit
We prefer verbose, explicit code over clever abstractions.

**Example**: Separate files for each concern rather than one mega-file.

### Reliability Over Performance
We optimize for correct results over speed.

**Example**: Sequential AI calls ensure proper context (could be parallelized).

### Simplicity Over Features
We ship a focused MVP rather than a feature-packed v1.

**Example**: Markdown only (could support 10 formats).

---

**Last Updated**: 2026-03-09
