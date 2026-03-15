import { GitHubFetcher } from './fetcher.js';
import { AIAnalyzer } from './analyzer.js';
import { createProvider } from './providers/index.js';
import type { AnalysisConfig, RepoAnalysis, Feature, Branch, ProgressCallback } from './types.js';

export class RepoAnalyzer {
  private fetcher: GitHubFetcher;
  private analyzer: AIAnalyzer;
  private config: AnalysisConfig;

  constructor(config: AnalysisConfig) {
    this.config = config;
    this.fetcher = new GitHubFetcher(config.githubToken);
    this.analyzer = new AIAnalyzer(createProvider(config));
  }

  /**
   * Main analysis entry point
   */
  async analyze(owner: string, repo: string, onProgress?: ProgressCallback): Promise<RepoAnalysis> {
    console.log(`🔍 Analyzing ${owner}/${repo}...`);

    // 1. Detect the repo's default branch
    const defaultBranch = await this.fetcher.getDefaultBranch(owner, repo);
    console.log(`🌿 Default branch: ${defaultBranch}`);

    // 2. Fetch all branches
    console.log('📊 Fetching branches...');
    const branches = await this.fetcher.fetchBranches(owner, repo, this.config.activeDaysThreshold);

    // Filter out the default branch and apply custom filter
    const activeBranches = branches.filter((branch) => {
      if (branch.name === defaultBranch) return false;
      if (!branch.isActive) return false;
      if (this.config.branchFilter) {
        return this.config.branchFilter(branch);
      }
      return true;
    });

    console.log(`✅ Found ${activeBranches.length} active branches`);

    // 3. Analyze each branch
    console.log('🤖 Analyzing features with AI...');
    const features: Feature[] = [];
    const total = activeBranches.length;

    for (let i = 0; i < activeBranches.length; i++) {
      const branch = activeBranches[i];
      if (onProgress) {
        onProgress(i + 1, total, branch.name);
      } else {
        console.log(`   Analyzing (${i + 1}/${total}): ${branch.name}`);
      }
      const feature = await this.analyzeFeature(owner, repo, branch, defaultBranch);
      if (feature) {
        features.push(feature);
      }
    }

    // 4. Analyze relationships between features
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

    // 5. Generate high-level insights
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
    branch: Branch,
    defaultBranch: string
  ): Promise<Feature | null> {
    try {
      // Fetch commits
      const commits = await this.fetcher.fetchCommits(owner, repo, branch.name, defaultBranch);

      if (commits.length === 0) {
        console.log(`   ⚠️  No commits found for ${branch.name}, skipping`);
        return null;
      }

      // Fetch PR if exists
      const pr = await this.fetcher.fetchPullRequest(owner, repo, branch.name);

      // Fetch code diff
      const codeDiff = await this.fetcher.fetchDiff(owner, repo, branch.name, defaultBranch);

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

  /** Expanded stop words list covering common English function words */
  private static readonly STOP_WORDS = new Set([
    // Articles & determiners
    'the',
    'a',
    'an',
    'this',
    'that',
    'these',
    'those',
    'some',
    'any',
    'each',
    'every',
    // Conjunctions & connectors
    'and',
    'or',
    'but',
    'nor',
    'yet',
    'so',
    'both',
    'either',
    'neither',
    // Prepositions
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'into',
    'through',
    'during',
    'before',
    'after',
    'above',
    'below',
    'between',
    'under',
    'over',
    'about',
    'against',
    'along',
    'among',
    'around',
    'within',
    'without',
    // Pronouns
    'it',
    'its',
    'they',
    'them',
    'their',
    'we',
    'our',
    'you',
    'your',
    'he',
    'she',
    'his',
    'her',
    'who',
    'whom',
    'which',
    'what',
    'where',
    'when',
    'how',
    'why',
    // Be / have / do / modal verbs
    'is',
    'was',
    'are',
    'were',
    'be',
    'been',
    'being',
    'am',
    'has',
    'have',
    'had',
    'having',
    'do',
    'does',
    'did',
    'doing',
    'done',
    'will',
    'would',
    'shall',
    'should',
    'may',
    'might',
    'can',
    'could',
    'must',
    // Common generic verbs & adverbs
    'get',
    'got',
    'make',
    'made',
    'also',
    'just',
    'only',
    'very',
    'really',
    'quite',
    'then',
    'than',
    'more',
    'most',
    'less',
    'much',
    'many',
    'well',
    'still',
    'already',
    'now',
    'here',
    'there',
    'all',
    'not',
    'no',
    'yes',
    // Generic software terms (too vague to be themes)
    'new',
    'add',
    'added',
    'adding',
    'update',
    'updated',
    'change',
    'changed',
    'changes',
    'use',
    'used',
    'using',
    'uses',
    'implement',
    'implemented',
    'implementing',
    'feature',
    'features',
    'support',
    'supports',
    'based',
    'like',
    'etc',
  ]);

  /**
   * Synonym groups for deduplicating similar terms.
   * The first entry in each group is the canonical form.
   */
  private static readonly SYNONYM_GROUPS: string[][] = [
    ['authentication', 'auth', 'authn', 'login', 'signin', 'sign'],
    [
      'authorization',
      'authz',
      'permissions',
      'permission',
      'access',
      'roles',
      'role',
      'rbac',
      'acl',
    ],
    ['database', 'db', 'datastore', 'storage', 'persistence'],
    ['api', 'endpoint', 'endpoints', 'rest', 'graphql'],
    ['test', 'tests', 'testing', 'spec', 'specs'],
    ['config', 'configuration', 'settings', 'setup'],
    ['performance', 'perf', 'optimization', 'optimisation', 'speed', 'latency'],
    ['error', 'errors', 'exception', 'exceptions', 'handling'],
    ['logging', 'logger', 'logs', 'log'],
    ['cache', 'caching', 'cached', 'memoize', 'memoization'],
    ['deploy', 'deployment', 'ci', 'cd', 'pipeline'],
    ['user', 'users', 'account', 'accounts', 'profile', 'profiles'],
    ['notification', 'notifications', 'alert', 'alerts', 'notify'],
    ['payment', 'payments', 'billing', 'checkout', 'stripe'],
    ['middleware', 'interceptor', 'interceptors'],
    ['component', 'components', 'widget', 'widgets'],
    ['refactor', 'refactoring', 'restructure', 'cleanup', 'reorganize'],
    ['migration', 'migrate', 'migrations'],
    ['security', 'secure', 'vulnerability', 'vulnerabilities'],
    ['documentation', 'docs', 'readme'],
  ];

  /** Precomputed word → canonical form lookup */
  private static readonly _synonymMap: Map<string, string> = (() => {
    const map = new Map<string, string>();
    for (const group of RepoAnalyzer.SYNONYM_GROUPS) {
      const canonical = group[0];
      for (const term of group) {
        map.set(term, canonical);
      }
    }
    return map;
  })();

  /** Resolve a word to its canonical synonym, or return as-is */
  private canonicalize(word: string): string {
    return RepoAnalyzer._synonymMap.get(word) || word;
  }

  private extractMainThemes(features: Feature[]): string[] {
    // Collect scored keywords across all features, deduplicating by canonical form
    const themeScores = new Map<string, { label: string; score: number }>();

    for (const feature of features) {
      const keywords = this.extractKeywords(feature.intent.what);
      for (const keyword of keywords) {
        const canonical = this.canonicalize(keyword.replace(/\s+/g, ' ').split(' ')[0]) || keyword;
        // Use the longest / most descriptive variant as the display label
        const existing = themeScores.get(canonical);
        if (existing) {
          existing.score += 1;
          // Prefer longer (more descriptive) label
          if (keyword.length > existing.label.length) {
            existing.label = keyword;
          }
        } else {
          themeScores.set(canonical, { label: keyword, score: 1 });
        }
      }
    }

    // Return top themes sorted by score, title-cased
    return Array.from(themeScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ label }) =>
        label
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      );
  }

  /**
   * Extract up to 3 meaningful keywords/phrases from text.
   *
   * Strategy:
   *  1. Tokenize into words, filter stop words and short words.
   *  2. Build bigrams from adjacent meaningful words.
   *  3. Score: bigrams get a relevance bonus over single words.
   *  4. Deduplicate via synonym canonicalization.
   *  5. Return top 3.
   */
  extractKeywords(text: string): string[] {
    if (!text) return [];

    const words = text.toLowerCase().split(/\W+/).filter(Boolean);

    // Filter to meaningful words (>3 chars, not stop words)
    const meaningful = words.filter((w) => w.length > 3 && !RepoAnalyzer.STOP_WORDS.has(w));

    if (meaningful.length === 0) return [];

    // Score unigrams by position (earlier = more relevant) + frequency
    const unigramScores = new Map<string, number>();
    for (let i = 0; i < meaningful.length; i++) {
      const canon = this.canonicalize(meaningful[i]);
      const positionalBoost = 1 + (meaningful.length - i) / meaningful.length;
      unigramScores.set(canon, (unigramScores.get(canon) || 0) + positionalBoost);
    }

    // Build bigrams from adjacent meaningful words in the original token stream.
    // We track which original-word indices are meaningful so bigrams only pair
    // words that were adjacent in the source text.
    const meaningfulIndices: number[] = [];
    for (let i = 0; i < words.length; i++) {
      if (words[i].length > 3 && !RepoAnalyzer.STOP_WORDS.has(words[i])) {
        meaningfulIndices.push(i);
      }
    }

    const bigramScores = new Map<string, number>();
    for (let k = 0; k < meaningfulIndices.length - 1; k++) {
      // Only pair words that were adjacent or separated by at most 1 stop word
      if (meaningfulIndices[k + 1] - meaningfulIndices[k] <= 2) {
        const w1 = this.canonicalize(words[meaningfulIndices[k]]);
        const w2 = this.canonicalize(words[meaningfulIndices[k + 1]]);
        if (w1 !== w2) {
          const bigram = `${w1} ${w2}`;
          // Bigrams get a 2x relevance bonus
          bigramScores.set(bigram, (bigramScores.get(bigram) || 0) + 2);
        }
      }
    }

    // Merge unigrams and bigrams into a single candidate list
    const candidates: Array<{ phrase: string; score: number }> = [];

    for (const [bigram, score] of bigramScores) {
      candidates.push({ phrase: bigram, score });
    }
    for (const [unigram, score] of unigramScores) {
      candidates.push({ phrase: unigram, score });
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    // Deduplicate: if a bigram contains a unigram, suppress the unigram
    const selected: string[] = [];
    const coveredTokens = new Set<string>();

    for (const { phrase } of candidates) {
      if (selected.length >= 3) break;

      const tokens = phrase.split(' ');
      // Skip if all tokens are already covered by a selected bigram
      if (tokens.every((t) => coveredTokens.has(t))) continue;

      selected.push(phrase);
      for (const t of tokens) {
        coveredTokens.add(t);
      }
    }

    return selected;
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
