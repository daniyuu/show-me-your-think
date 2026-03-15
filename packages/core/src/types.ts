/**
 * Core type definitions for show-me-your-think
 */

/**
 * Represents a Git branch being analyzed
 */
export interface Branch {
  name: string;
  lastCommitSha: string;
  lastCommitDate: Date;
  author: string;
  isActive: boolean; // Active if updated within last 30 days
}

/**
 * Information extracted from a commit
 */
export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: Date;
  filesChanged: string[];
  additions: number;
  deletions: number;
}

/**
 * Pull request information (if linked)
 */
export interface PullRequest {
  number: number;
  title: string;
  description: string;
  author: string;
  createdAt: Date;
  linkedIssues: number[];
}

/**
 * AI-analyzed intent and reasoning for a feature
 */
export interface FeatureIntent {
  // What is being built
  what: string;

  // Why it's being built (business/technical reasoning)
  why: string;

  // How it relates to the overall architecture
  architecturalImpact: string;

  // Confidence score (0-1) of the AI analysis
  confidence: number;
}

/**
 * Represents a logical feature being developed
 */
export interface Feature {
  id: string;
  branch: Branch;
  commits: CommitInfo[];
  pr?: PullRequest;

  // AI-extracted understanding
  intent: FeatureIntent;

  // Related features (dependencies, conflicts, etc.)
  relatedFeatures: Array<{
    featureId: string;
    relationship: 'depends-on' | 'conflicts-with' | 'builds-on' | 'related-to';
    description: string;
  }>;
}

/**
 * Complete analysis result for a repository
 */
export interface RepoAnalysis {
  repoOwner: string;
  repoName: string;
  analyzedAt: Date;
  features: Feature[];

  // High-level insights
  summary: {
    totalActiveBranches: number;
    mainThemes: string[]; // e.g., ["Authentication refactor", "Performance optimization"]
    potentialConflicts: string[];
  };
}

/**
 * Abstract LLM provider interface.
 * Implementations wrap a specific LLM SDK (Anthropic, OpenAI, etc.).
 */
export interface LLMProvider {
  complete(prompt: string, maxTokens: number): Promise<string>;
}

/**
 * Configuration for analysis
 */
export interface AnalysisConfig {
  // GitHub token for API access (required)
  githubToken: string;

  // LLM provider to use (default: 'anthropic')
  provider?: 'anthropic' | 'openai';

  // API key for the selected provider
  apiKey?: string;

  // Custom base URL for the LLM API
  baseUrl?: string;

  /** @deprecated Use `apiKey` instead */
  anthropicApiKey?: string;

  /** @deprecated Use `baseUrl` instead */
  anthropicBaseUrl?: string;

  // Model to use for analysis (default depends on provider)
  model?: string;

  // How many days back to consider "active"
  activeDaysThreshold: number;

  // Which branches to analyze (default: all except main/master)

  branchFilter?: (branch: Branch) => boolean;
}

/**
 * Progress callback for long-running analysis
 */

export type ProgressCallback = (current: number, total: number, branchName: string) => void;
