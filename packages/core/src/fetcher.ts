import { Octokit } from '@octokit/rest';
import type { Branch, CommitInfo, PullRequest } from './types.js';

/** Simple concurrency limiter — runs at most `limit` promises at a time */
async function pLimit<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * Check if an error is a GitHub rate limit error (HTTP 403 or 429).
 * Returns the reset timestamp (epoch seconds) if available, or null.
 */
function getRateLimitReset(error: unknown): number | null {
  if (!error || typeof error !== 'object' || !('status' in error)) {
    return null;
  }
  const status = (error as { status: number }).status;
  if (status !== 403 && status !== 429) {
    return null;
  }
  const headers = (error as { response?: { headers?: Record<string, string> } }).response?.headers;
  const remaining = headers?.['x-ratelimit-remaining'];
  if (remaining === '0' || status === 429) {
    const reset = headers?.['x-ratelimit-reset'];
    return reset ? Number(reset) : null;
  }
  return null;
}

/**
 * Sleep for the given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

/**
 * Execute a GitHub API call with rate-limit awareness.
 * If rate-limited, waits until the reset time and retries (up to maxRetries).
 */
async function withRateLimitRetry<T>(
  fn: () => Promise<T>,
  label: string = 'API call',
  maxRetries: number = 2
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const resetEpoch = getRateLimitReset(error);
      if (resetEpoch !== null && attempt < maxRetries) {
        const now = Math.floor(Date.now() / 1000);
        const waitSeconds = Math.max(resetEpoch - now, 1) + 1; // +1s buffer
        console.warn(
          `⚠️  Rate limited on ${label}. ` +
            `Waiting ${waitSeconds}s until reset (attempt ${attempt + 1}/${maxRetries})...`
        );
        await sleep(waitSeconds * 1000);
        continue;
      }
      throw error;
    }
  }
  // Should never reach here, but satisfy TypeScript
  throw new Error(`Rate limit retries exhausted for ${label}`);
}

export class GitHubFetcher {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  /**
   * Fetch all branches for a repository
   */
  async fetchBranches(
    owner: string,
    repo: string,
    activeDaysThreshold: number = 30
  ): Promise<Branch[]> {
    const { data: branches } = await withRateLimitRetry(
      () => this.octokit.repos.listBranches({ owner, repo, per_page: 100 }),
      `listBranches(${owner}/${repo})`
    );

    const now = new Date();
    const threshold = activeDaysThreshold * 24 * 60 * 60 * 1000;

    // Fetch commit details with concurrency limit + rate-limit retry
    const tasks = branches.map((branch) => async () => {
      try {
        const { data: commit } = await withRateLimitRetry(
          () => this.octokit.repos.getCommit({ owner, repo, ref: branch.commit.sha }),
          `getCommit(${branch.name})`
        );

        const commitDate = new Date(commit.commit.author?.date || now);
        const isActive = now.getTime() - commitDate.getTime() < threshold;

        return {
          name: branch.name,
          lastCommitSha: branch.commit.sha,
          lastCommitDate: commitDate,
          author: commit.commit.author?.name || 'Unknown',
          isActive,
        };
      } catch (error: unknown) {
        const resetEpoch = getRateLimitReset(error);
        if (resetEpoch !== null) {
          const resetTime = new Date(resetEpoch * 1000).toLocaleTimeString();
          console.warn(
            `⚠️  Rate limited while fetching branch "${branch.name}". ` +
              `Rate limit resets at ${resetTime}. Skipping branch.`
          );
        }
        // If we can't fetch commit details, mark as inactive
        return {
          name: branch.name,
          lastCommitSha: branch.commit.sha,
          lastCommitDate: now,
          author: 'Unknown',
          isActive: false,
        };
      }
    });

    const branchDetails = await pLimit(tasks, 5);

    return branchDetails;
  }

  /**
   * Fetch commit history for a branch
   */
  async fetchCommits(
    owner: string,
    repo: string,
    branch: string,
    baseBranch: string = 'main'
  ): Promise<CommitInfo[]> {
    try {
      // Get commits that are in branch but not in base
      const { data: comparison } = await withRateLimitRetry(
        () => this.octokit.repos.compareCommits({ owner, repo, base: baseBranch, head: branch }),
        `compareCommits(${branch})`
      );

      return comparison.commits.map((commit) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author?.name || 'Unknown',
        date: new Date(commit.commit.author?.date || Date.now()),
        filesChanged: commit.files?.map((f) => f.filename) || [],
        additions: commit.stats?.additions || 0,
        deletions: commit.stats?.deletions || 0,
      }));
    } catch (error) {
      console.warn(`Failed to fetch commits for branch ${branch}:`, error);
      return [];
    }
  }

  /**
   * Fetch pull request for a branch (if exists)
   */
  async fetchPullRequest(
    owner: string,
    repo: string,
    branch: string
  ): Promise<PullRequest | undefined> {
    try {
      const { data: prs } = await withRateLimitRetry(
        () => this.octokit.pulls.list({ owner, repo, head: `${owner}:${branch}`, state: 'open' }),
        `listPRs(${branch})`
      );

      if (prs.length === 0) return undefined;

      const pr = prs[0];

      // Extract issue numbers from PR body
      const issueRegex = /#(\d+)/g;
      const linkedIssues: number[] = [];
      let match;
      while ((match = issueRegex.exec(pr.body || '')) !== null) {
        linkedIssues.push(parseInt(match[1]));
      }

      return {
        number: pr.number,
        title: pr.title,
        description: pr.body || '',
        author: pr.user?.login || 'Unknown',
        createdAt: new Date(pr.created_at),
        linkedIssues,
      };
    } catch (error) {
      console.warn(`Failed to fetch PR for branch ${branch}:`, error);
      return undefined;
    }
  }

  /**
   * Fetch code diff for a branch
   */
  async fetchDiff(
    owner: string,
    repo: string,
    branch: string,
    baseBranch: string = 'main'
  ): Promise<string> {
    try {
      const { data: comparison } = await withRateLimitRetry(
        () =>
          this.octokit.repos.compareCommits({
            owner,
            repo,
            base: baseBranch,
            head: branch,
            mediaType: { format: 'diff' },
          }),
        `fetchDiff(${branch})`
      );

      return comparison as unknown as string;
    } catch (error) {
      console.warn(`Failed to fetch diff for branch ${branch}:`, error);
      return '';
    }
  }
}
