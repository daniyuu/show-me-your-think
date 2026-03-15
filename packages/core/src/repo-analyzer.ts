import { GitHubFetcher } from './fetcher.js';
import { AIAnalyzer } from './analyzer.js';
import type { AnalysisConfig, RepoAnalysis, Feature, Branch } from './types.js';

export class RepoAnalyzer {
  private fetcher: GitHubFetcher;
  private analyzer: AIAnalyzer;
  private config: AnalysisConfig;

  constructor(config: AnalysisConfig) {
    this.config = config;
    this.fetcher = new GitHubFetcher(config.githubToken);
    this.analyzer = new AIAnalyzer(config.anthropicApiKey, {
      baseUrl: config.anthropicBaseUrl,
      model: config.model,
    });
  }

  /**
   * Main analysis entry point
   */
  async analyze(owner: string, repo: string): Promise<RepoAnalysis> {
    console.log(`🔍 Analyzing ${owner}/${repo}...`);

    // 1. Fetch all branches
    console.log('📊 Fetching branches...');
    const branches = await this.fetcher.fetchBranches(owner, repo, this.config.activeDaysThreshold);

    // Filter out main/master and apply custom filter
    const activeBranches = branches.filter((branch) => {
      if (['main', 'master'].includes(branch.name)) return false;
      if (!branch.isActive) return false;
      if (this.config.branchFilter) {
        return this.config.branchFilter(branch);
      }
      return true;
    });

    console.log(`✅ Found ${activeBranches.length} active branches`);

    // 2. Analyze each branch
    console.log('🤖 Analyzing features with AI...');
    const features: Feature[] = [];
    const total = activeBranches.length;

    for (let i = 0; i < activeBranches.length; i++) {
      const branch = activeBranches[i];
      const current = i + 1;

      if (this.config.onProgress) {
        this.config.onProgress(current, total, branch.name);
      } else {
        console.log(`   Analyzing: ${branch.name}`);
      }

      const feature = await this.analyzeFeature(owner, repo, branch);
      if (feature) {
        features.push(feature);
      }
    }

    // 3. Analyze relationships between features
    console.log('🔗 Analyzing feature relationships...');
    const relationships = await this.analyzer.analyzeRelationships(
      features.map((f) => ({
        id: f.id,
        branchName: f.branch.name,
        intent: f.intent,
        filesChanged: [...new Set(f.commits.flatMap((c) => c.filesChanged))],
      }))
    );

    // Attach relationships to features
    for (const feature of features) {
      feature.relatedFeatures = relationships.get(feature.id) || [];
    }

    // 4. Generate high-level insights
    console.log('💡 Generating insights...');
    const summary = this.generateSummary(features);

    return {
      repoOwner: owner,
      repoName: repo,
      analyzedAt: new Date(),
      features,
      summary,
    };
  }

  /**
   * Analyze a single feature (branch)
   */
  private async analyzeFeature(
    owner: string,
    repo: string,
    branch: Branch
  ): Promise<Feature | null> {
    try {
      // Fetch commits
      const commits = await this.fetcher.fetchCommits(owner, repo, branch.name);

      if (commits.length === 0) {
        console.log(`   ⚠️  No commits found for ${branch.name}, skipping`);
        return null;
      }

      // Fetch PR if exists
      const pr = await this.fetcher.fetchPullRequest(owner, repo, branch.name);

      // Fetch code diff
      const codeDiff = await this.fetcher.fetchDiff(owner, repo, branch.name);

      // Analyze with AI
      const intent = await this.analyzer.analyzeFeature({
        branchName: branch.name,
        commits,
        pr,
        codeDiff,
      });

      return {
        id: `${owner}/${repo}/${branch.name}`,
        branch,
        commits,
        pr,
        intent,
        relatedFeatures: [], // Will be filled later
      };
    } catch (error) {
      console.error(`   ❌ Failed to analyze ${branch.name}:`, error);
      return null;
    }
  }

  /**
   * Generate high-level summary
   */
  private generateSummary(features: Feature[]) {
    const mainThemes = this.extractMainThemes(features);
    const potentialConflicts = this.findPotentialConflicts(features);

    return {
      totalActiveBranches: features.length,
      mainThemes,
      potentialConflicts,
    };
  }

  private extractMainThemes(features: Feature[]): string[] {
    // Group features by common keywords in their "what"
    const themes = new Map<string, number>();

    for (const feature of features) {
      const keywords = this.extractKeywords(feature.intent.what);
      for (const keyword of keywords) {
        themes.set(keyword, (themes.get(keyword) || 0) + 1);
      }
    }

    // Return top themes
    return Array.from(themes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme]) => theme);
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction (can be improved)
    const words = text.toLowerCase().split(/\W+/);
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'is',
      'was',
      'are',
      'been',
      'be',
      'this',
      'that',
    ]);

    return words.filter((w) => w.length > 3 && !stopWords.has(w)).slice(0, 3);
  }

  private findPotentialConflicts(features: Feature[]): string[] {
    const conflicts: string[] = [];

    for (const feature of features) {
      const conflictRelations = feature.relatedFeatures.filter(
        (r) => r.relationship === 'conflicts-with'
      );

      for (const conflict of conflictRelations) {
        const otherFeature = features.find((f) => f.id === conflict.featureId);
        if (otherFeature) {
          conflicts.push(
            `${feature.branch.name} ⚠️ ${otherFeature.branch.name}: ${conflict.description}`
          );
        }
      }
    }

    return conflicts;
  }
}
