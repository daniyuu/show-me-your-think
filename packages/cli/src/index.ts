#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile } from 'fs/promises';
import { RepoAnalyzer, MarkdownGenerator } from '@smyt/core';
import type { AnalysisConfig } from '@smyt/core';
import { config } from 'dotenv';
import { GitHubAuth } from './github-auth.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the project root directory (2 levels up from this file)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../..');

// Load environment variables from project root
config({ path: resolve(projectRoot, '.env') });

const program = new Command();

program
  .name('smyt')
  .description('Show Me Your Think - Analyze GitHub repositories to understand what and why')
  .version('0.1.0');

program
  .command('analyze <repo>')
  .description('Analyze a GitHub repository (format: owner/repo)')
  .option('-o, --output <file>', 'Output file path', './think-report.md')
  .option('--days <number>', 'Consider branches active within N days', '30')
  .option('--github-token <token>', 'GitHub personal access token')
  .option('--anthropic-key <key>', 'Anthropic API key')
  .option(
    '--anthropic-base-url <url>',
    'Custom Anthropic API base URL (e.g., http://localhost:4141)'
  )
  .option('--model <model>', 'AI model to use (default: claude-opus-4.6)', 'claude-opus-4.6')
  .action(async (repo: string, options) => {
    const spinner = ora();

    try {
      // Parse repo
      const [owner, repoName] = repo.split('/');
      if (!owner || !repoName) {
        console.error(chalk.red('❌ Invalid repo format. Use: owner/repo'));
        process.exit(1);
      }

      // Get API keys and config
      let githubToken = options.githubToken || process.env.GITHUB_TOKEN;
      const anthropicKey = options.anthropicKey || process.env.ANTHROPIC_API_KEY;
      const anthropicBaseUrl = options.anthropicBaseUrl || process.env.ANTHROPIC_BASE_URL;
      const model = options.model;

      // Interactive GitHub authentication if no token provided
      if (!githubToken) {
        const auth = new GitHubAuth();
        githubToken = await auth.getToken();
      }

      if (!anthropicKey) {
        console.error(
          chalk.red(
            '❌ Anthropic API key required. Set ANTHROPIC_API_KEY env var or use --anthropic-key'
          )
        );
        process.exit(1);
      }

      // Configure analyzer with progress callback
      const analysisConfig: AnalysisConfig = {
        githubToken,
        anthropicApiKey: anthropicKey,
        anthropicBaseUrl,
        model,
        activeDaysThreshold: parseInt(options.days),
        onProgress: (current: number, total: number, branchName: string) => {
          const filled = Math.round((current / total) * 20);
          const empty = 20 - filled;
          const bar = '█'.repeat(filled) + '░'.repeat(empty);
          const pct = Math.round((current / total) * 100);
          spinner.text = `Analyzing features [${bar}] ${current}/${total} (${pct}%) — ${branchName}`;
        },
      };

      console.log(chalk.bold.cyan('\n🧠 Show Me Your Think\n'));
      console.log(`Repository: ${chalk.bold(repo)}`);
      console.log(`Model: ${chalk.bold(model)}`);
      if (anthropicBaseUrl) {
        console.log(`API Endpoint: ${chalk.bold(anthropicBaseUrl)}`);
      }
      console.log(`Output: ${chalk.bold(options.output)}\n`);

      // Run analysis
      spinner.start('Analyzing features...');
      const analyzer = new RepoAnalyzer(analysisConfig);
      const analysis = await analyzer.analyze(owner, repoName);
      spinner.succeed(
        chalk.green(`Analyzed ${analysis.summary.totalActiveBranches} active branches`)
      );

      // Generate report
      spinner.start('Generating markdown report...');
      const generator = new MarkdownGenerator();
      const markdown = generator.generate(analysis);

      // Write to file
      await writeFile(options.output, markdown, 'utf-8');
      spinner.succeed(chalk.green(`Report generated: ${options.output}`));

      // Print summary
      console.log(chalk.bold('\n📊 Summary:'));
      console.log(`  Active branches: ${analysis.summary.totalActiveBranches}`);
      console.log(`  Main themes: ${analysis.summary.mainThemes.join(', ') || 'None'}`);
      console.log(`  Potential conflicts: ${analysis.summary.potentialConflicts.length}`);

      console.log(chalk.dim('\n✨ Analysis complete!\n'));
    } catch (error) {
      spinner.fail(chalk.red('Analysis failed'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Show configuration help')
  .action(() => {
    console.log(chalk.bold.cyan('\n🔧 Configuration\n'));
    console.log('Required environment variables:\n');
    console.log(chalk.yellow('GITHUB_TOKEN'));
    console.log('  Get from: https://github.com/settings/tokens');
    console.log('  Scopes needed: repo (for private repos) or public_repo');
    console.log("  Or run without it - you'll be prompted to login interactively\n");
    console.log(chalk.yellow('ANTHROPIC_API_KEY'));
    console.log('  Get from: https://console.anthropic.com/\n');
    console.log('You can also pass these as CLI options:');
    console.log('  --github-token <token>');
    console.log('  --anthropic-key <key>\n');
  });

program
  .command('logout')
  .description('Clear saved GitHub token')
  .action(async () => {
    await GitHubAuth.clearToken();
  });

program.parse();
