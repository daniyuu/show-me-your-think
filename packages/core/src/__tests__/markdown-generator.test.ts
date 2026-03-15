import { describe, it, expect } from 'vitest';
import { MarkdownGenerator } from '../markdown-generator.js';
import type { RepoAnalysis } from '../types.js';

describe('MarkdownGenerator', () => {
  const generator = new MarkdownGenerator();

  it('generates markdown with repo info and features', () => {
    const analysis: RepoAnalysis = {
      repoOwner: 'test-org',
      repoName: 'test-repo',
      analyzedAt: new Date('2025-06-15'),
      features: [
        {
          id: 'test-org/test-repo/feature-branch',
          branch: {
            name: 'feature-branch',
            lastCommitSha: 'abc123',
            lastCommitDate: new Date('2025-06-14'),
            author: 'Dev',
            isActive: true,
          },
          commits: [
            {
              sha: 'abc123',
              message: 'feat: add something',
              author: 'Dev',
              date: new Date('2025-06-14'),
              filesChanged: ['src/index.ts'],
              additions: 50,
              deletions: 10,
            },
          ],
          intent: {
            what: 'Adding a new feature',
            why: 'Business need',
            architecturalImpact: 'Adds new module',
            confidence: 0.85,
          },
          relatedFeatures: [],
        },
      ],
      summary: {
        totalActiveBranches: 1,
        mainThemes: ['feature'],
        potentialConflicts: [],
      },
    };

    const md = generator.generate(analysis);
    expect(md).toContain('test-org/test-repo');
    expect(md).toContain('feature-branch');
    expect(md).toContain('Adding a new feature');
    expect(md).toContain('Business need');
    expect(typeof md).toBe('string');
  });

  it('includes conflict warnings when present', () => {
    const analysis: RepoAnalysis = {
      repoOwner: 'org',
      repoName: 'repo',
      analyzedAt: new Date(),
      features: [],
      summary: {
        totalActiveBranches: 0,
        mainThemes: [],
        potentialConflicts: ['branch-a ⚠️ branch-b: Both modify auth'],
      },
    };

    const md = generator.generate(analysis);
    expect(md).toContain('branch-a');
    expect(md).toContain('branch-b');
  });

  it('handles empty features list', () => {
    const analysis: RepoAnalysis = {
      repoOwner: 'org',
      repoName: 'repo',
      analyzedAt: new Date(),
      features: [],
      summary: {
        totalActiveBranches: 0,
        mainThemes: [],
        potentialConflicts: [],
      },
    };

    const md = generator.generate(analysis);
    expect(md).toContain('org/repo');
    expect(typeof md).toBe('string');
  });
});
