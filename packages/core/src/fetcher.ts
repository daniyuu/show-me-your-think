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
    const { data: branches } = await this.octokit.repos.listBranches({
      owner,
      repo,
      per_page: 100,
    });

    const now = new Date();
    const threshold = activeDaysThreshold * 24 * 60 * 60 * 1000;

    // Fetch commit details with concurrency limit to avoid API rate limits
    const tasks = branches.map((branch) => async () => {
      try {
        const { data: commit } = await this.octokit.repos.getCommit({
          owner,
          repo,
          ref: branch.commit.sha,
        });

        const commitDate = new Date(commit.commit.author?.date || now);
        const isActive = now.getTime() - commitDate.getTime() < threshold;

        return {
          name: branch.name,
          lastCommitSha: branch.commit.sha,
          lastCommitDate: commitDate,
          author: commit.commit.author?.name || 'Unknown',
          isActive,
        };
      } catch {
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
      const { data: comparison } = await this.octokit.repos.compareCommits({
        owner,
        repo,
        base: baseBranch,
        head: branch,
      });

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
      const { data: prs } = await this.octokit.pulls.list({
        owner,
        repo,
        head: `${owner}:${branch}`,
        state: 'open',
      });

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
      const { data: comparison } = await this.octokit.repos.compareCommits({
        owner,
        repo,
        base: baseBranch,
        head: branch,
        mediaType: {
          format: 'diff',
        },
      });

      return comparison as unknown as string;
    } catch (error) {
      console.warn(`Failed to fetch diff for branch ${branch}:`, error);
      return '';
    }
  }
}
