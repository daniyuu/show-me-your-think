#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFile } from 'fs/promises';
import { RepoAnalyzer, MarkdownGenerator } from '@smyt/core';
import type { AnalysisConfig, ProgressCallback } from '@smyt/core';
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
  .option('--provider <provider>', 'LLM provider: anthropic or openai', 'anthropic')
  .option('--api-key <key>', 'API key for the selected LLM provider')
  .option('--anthropic-key <key>', 'Anthropic API key (deprecated, use --api-key)')
  .option('--base-url <url>', 'Custom LLM API base URL')
  .option(
    '--anthropic-base-url <url>',
    'Custom Anthropic API base URL (deprecated, use --base-url)'
  )
  .option('--model <model>', 'AI model to use', '')
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
      const providerName: 'anthropic' | 'openai' =
        options.provider === 'openai' ? 'openai' : 'anthropic';

      // Resolve API key: --api-key > --anthropic-key > env vars based on provider
      const apiKey =
        options.apiKey ||
        options.anthropicKey ||
        (providerName === 'openai' ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY) ||
        process.env.ANTHROPIC_API_KEY;

      const baseUrl = options.baseUrl || options.anthropicBaseUrl || process.env.ANTHROPIC_BASE_URL;
      const model = options.model || undefined;

      // Interactive GitHub authentication if no token provided
      if (!githubToken) {
        const auth = new GitHubAuth();
        githubToken = await auth.getToken();
      }

      if (!apiKey) {
        const envVar = providerName === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY';
        console.error(chalk.red(`❌ API key required. Set ${envVar} env var or use --api-key`));
        process.exit(1);
      }

      // Validate --days option
      const days = parseInt(options.days, 10);
      if (Number.isNaN(days) || days <= 0) {
        console.error(
          chalk.red(`❌ Invalid --days value: "${options.days}". Must be a positive integer.`)
        );
        process.exit(1);
      }

      // Configure analyzer
      const analysisConfig: AnalysisConfig = {
        githubToken,
        provider: providerName,
        apiKey,
        baseUrl,
        model,
        activeDaysThreshold: days,
      };

      console.log(chalk.bold.cyan('\n🧠 Show Me Your Think\n'));
      console.log(`Repository: ${chalk.bold(repo)}`);
      console.log(`Provider: ${chalk.bold(providerName)}`);
      if (model) {
        console.log(`Model: ${chalk.bold(model)}`);
      }
      if (baseUrl) {
        console.log(`API Endpoint: ${chalk.bold(baseUrl)}`);
      }
      console.log(`Output: ${chalk.bold(options.output)}\n`);

      // Run analysis with progress
      const analyzer = new RepoAnalyzer(analysisConfig);
      const progressSpinner = ora();
      const onProgress: ProgressCallback = (current, total, branchName) => {
        const pct = Math.round((current / total) * 100);
        const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
        progressSpinner.text = `Analyzing features [${bar}] ${current}/${total} — ${branchName}`;
        if (!progressSpinner.isSpinning) {
          progressSpinner.start();
        }
      };
      const analysis = await analyzer.analyze(owner, repoName, onProgress);
      if (progressSpinner.isSpinning) {
        progressSpinner.succeed(chalk.green(`Analyzed ${analysis.features.length} features`));
      }

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
