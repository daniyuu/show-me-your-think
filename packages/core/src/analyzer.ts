import Anthropic from '@anthropic-ai/sdk';
import type { CommitInfo, PullRequest, FeatureIntent } from './types.js';

export class AIAnalyzer {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, options?: { baseUrl?: string; model?: string }) {
    const clientConfig: any = { apiKey };

    // Support custom base URL (e.g., localhost proxy)
    if (options?.baseUrl) {
      clientConfig.baseURL = options.baseUrl;
      console.log(`🔧 Using custom API endpoint: ${options.baseUrl}`);
    }

    this.client = new Anthropic(clientConfig);
    this.model = options?.model || 'claude-opus-4.6';
  }

  /**
   * Analyze a feature to extract intent and reasoning
   */
  async analyzeFeature(params: {
    branchName: string;
    commits: CommitInfo[];
    pr?: PullRequest;
    codeDiff: string;
  }): Promise<FeatureIntent> {
    const { branchName, commits, pr, codeDiff } = params;

    const prompt = this.buildAnalysisPrompt(branchName, commits, pr, codeDiff);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return this.parseIntentResponse(content.text);
  }

  /**
   * Analyze relationships between features
   */
  async analyzeRelationships(features: Array<{
    id: string;
    branchName: string;
    intent: FeatureIntent;
    filesChanged: string[];
  }>): Promise<Map<string, Array<{
    featureId: string;
    relationship: 'depends-on' | 'conflicts-with' | 'builds-on' | 'related-to';
    description: string;
  }>>> {
    if (features.length < 2) {
      return new Map();
    }

    const prompt = this.buildRelationshipPrompt(features);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return this.parseRelationshipResponse(content.text, features);
  }

  private buildAnalysisPrompt(
    branchName: string,
    commits: CommitInfo[],
    pr: PullRequest | undefined,
    codeDiff: string
  ): string {
    const commitMessages = commits.map((c) => `- ${c.message}`).join('\n');
    const filesChanged = [...new Set(commits.flatMap((c) => c.filesChanged))];

    // Truncate diff if too long (keep first 10000 chars)
    const truncatedDiff = codeDiff.length > 10000
      ? codeDiff.substring(0, 10000) + '\n\n[... diff truncated ...]'
      : codeDiff;

    return `You are analyzing a feature branch in a software project. Your goal is to understand:
1. WHAT is being built
2. WHY it's being built (the reasoning/motivation)
3. How it impacts the overall architecture

Branch: ${branchName}

${pr ? `Pull Request: ${pr.title}\nDescription: ${pr.description}\n` : ''}

Commits:
${commitMessages}

Files changed (${filesChanged.length}):
${filesChanged.slice(0, 20).join('\n')}
${filesChanged.length > 20 ? `\n... and ${filesChanged.length - 20} more` : ''}

Code changes:
\`\`\`diff
${truncatedDiff}
\`\`\`

Please analyze this and provide a response in the following JSON format:
{
  "what": "A clear, concise description of what is being built (2-3 sentences)",
  "why": "The reasoning/motivation behind this change - business value, technical debt, bug fix, etc. (2-4 sentences)",
  "architecturalImpact": "How this affects the codebase architecture, what modules/layers are touched, potential risks (2-3 sentences)",
  "confidence": 0.85
}

Confidence should be 0-1, where:
- 0.9-1.0: Very clear from PR description and code
- 0.7-0.9: Reasonably clear from commits and changes
- 0.5-0.7: Inferred from code patterns
- <0.5: Highly speculative

Return ONLY the JSON, no other text.`;
  }

  private buildRelationshipPrompt(features: Array<{
    id: string;
    branchName: string;
    intent: FeatureIntent;
    filesChanged: string[];
  }>): string {
    const featureDescriptions = features
      .map((f, i) => {
        return `[${i}] ${f.branchName}
What: ${f.intent.what}
Why: ${f.intent.why}
Files: ${f.filesChanged.slice(0, 10).join(', ')}${f.filesChanged.length > 10 ? '...' : ''}`;
      })
      .join('\n\n');

    return `You are analyzing relationships between multiple features being developed in parallel.

Features:
${featureDescriptions}

Analyze the relationships between these features. Look for:
- Dependencies (one feature needs another to be completed first)
- Conflicts (features touching the same code/areas, potential merge conflicts)
- Build-on relationships (one feature extends another)
- General relatedness (working on similar areas/goals)

Return a JSON array of relationships:
[
  {
    "from": 0,
    "to": 1,
    "relationship": "conflicts-with",
    "description": "Both modify the authentication middleware"
  }
]

Relationship types: "depends-on", "conflicts-with", "builds-on", "related-to"

Return ONLY the JSON array, no other text.`;
  }

  private parseIntentResponse(response: string): FeatureIntent {
    try {
      // Try to extract JSON from response (in case there's extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const json = jsonMatch ? jsonMatch[0] : response;

      const parsed = JSON.parse(json);

      return {
        what: parsed.what || 'Unable to determine',
        why: parsed.why || 'Unable to determine',
        architecturalImpact: parsed.architecturalImpact || 'Unknown impact',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {
        what: 'Unable to analyze (parse error)',
        why: 'Unable to analyze (parse error)',
        architecturalImpact: 'Unknown',
        confidence: 0.1,
      };
    }
  }

  private parseRelationshipResponse(
    response: string,
    features: Array<{ id: string }>
  ): Map<string, Array<{
    featureId: string;
    relationship: 'depends-on' | 'conflicts-with' | 'builds-on' | 'related-to';
    description: string;
  }>> {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      const json = jsonMatch ? jsonMatch[0] : response;

      const relationships = JSON.parse(json);
      const map = new Map<string, Array<any>>();

      for (const rel of relationships) {
        const fromId = features[rel.from]?.id;
        const toId = features[rel.to]?.id;

        if (!fromId || !toId) continue;

        if (!map.has(fromId)) {
          map.set(fromId, []);
        }

        map.get(fromId)!.push({
          featureId: toId,
          relationship: rel.relationship,
          description: rel.description,
        });
      }

      return map;
    } catch (error) {
      console.error('Failed to parse relationship response:', error);
      return new Map();
    }
  }
}
