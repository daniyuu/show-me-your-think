import { Octokit } from '@octokit/rest';
import type { Branch, CommitInfo, PullRequest } from './types.js';

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

    const branchDetails = await Promise.all(
      branches.map(async (branch) => {
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
      })
    );

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
