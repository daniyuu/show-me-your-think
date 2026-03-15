import { describe, it, expect } from 'vitest';
import { RepoAnalyzer } from '../repo-analyzer.js';

// Access private methods via any-cast
function makeRepoAnalyzer(): any {
  return new RepoAnalyzer({
    githubToken: 'fake',
    anthropicApiKey: 'fake',
    activeDaysThreshold: 30,
  });
}

describe('RepoAnalyzer.extractKeywords', () => {
  const ra = makeRepoAnalyzer();

  it('extracts meaningful words (>3 chars, no stop words)', () => {
    const keywords = ra.extractKeywords('Adding the new authentication system for users');
    expect(keywords).not.toContain('the');
    expect(keywords).not.toContain('for');
    expect(keywords.length).toBeGreaterThan(0);
    expect(keywords.length).toBeLessThanOrEqual(3);
    // Should include words like 'adding', 'authentication', 'system'
    expect(keywords.some((k: string) => k.length > 3)).toBe(true);
  });

  it('filters out short words', () => {
    const keywords = ra.extractKeywords('a to be or not to be');
    // All are stop words or <= 3 chars
    expect(keywords).toHaveLength(0);
  });

  it('returns at most 3 keywords', () => {
    const keywords = ra.extractKeywords(
      'Implementing advanced authentication middleware with comprehensive logging'
    );
    expect(keywords.length).toBeLessThanOrEqual(3);
  });

  it('handles empty string', () => {
    const keywords = ra.extractKeywords('');
    expect(keywords).toHaveLength(0);
  });
});

describe('RepoAnalyzer.findPotentialConflicts', () => {
  const ra = makeRepoAnalyzer();

  it('returns conflict descriptions for conflicts-with relationships', () => {
    const features = [
      {
        id: 'a',
        branch: { name: 'feature-a' },
        relatedFeatures: [
          {
            featureId: 'b',
            relationship: 'conflicts-with',
            description: 'Both modify auth middleware',
          },
        ],
      },
      {
        id: 'b',
        branch: { name: 'feature-b' },
        relatedFeatures: [],
      },
    ];
    const conflicts = ra.findPotentialConflicts(features);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toContain('feature-a');
    expect(conflicts[0]).toContain('feature-b');
    expect(conflicts[0]).toContain('Both modify auth middleware');
  });

  it('ignores non-conflict relationships', () => {
    const features = [
      {
        id: 'a',
        branch: { name: 'feature-a' },
        relatedFeatures: [{ featureId: 'b', relationship: 'depends-on', description: 'A needs B' }],
      },
      {
        id: 'b',
        branch: { name: 'feature-b' },
        relatedFeatures: [],
      },
    ];
    const conflicts = ra.findPotentialConflicts(features);
    expect(conflicts).toHaveLength(0);
  });

  it('handles empty feature list', () => {
    const conflicts = ra.findPotentialConflicts([]);
    expect(conflicts).toHaveLength(0);
  });
});

describe('RepoAnalyzer.generateSummary', () => {
  const ra = makeRepoAnalyzer();

  it('returns totalActiveBranches count', () => {
    const features = [
      {
        id: 'a',
        branch: { name: 'feat-a' },
        intent: {
          what: 'User authentication system',
          why: '',
          architecturalImpact: '',
          confidence: 0.8,
        },
        commits: [],
        relatedFeatures: [],
      },
      {
        id: 'b',
        branch: { name: 'feat-b' },
        intent: {
          what: 'Payment processing module',
          why: '',
          architecturalImpact: '',
          confidence: 0.8,
        },
        commits: [],
        relatedFeatures: [],
      },
    ];
    const summary = ra.generateSummary(features);
    expect(summary.totalActiveBranches).toBe(2);
    expect(summary.mainThemes.length).toBeGreaterThan(0);
    expect(summary.potentialConflicts).toHaveLength(0);
  });
});
