import { createOAuthDeviceAuth } from '@octokit/auth-oauth-device';
import open from 'open';
import chalk from 'chalk';
import ora from 'ora';
import { homedir } from 'os';
import { join } from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const CONFIG_DIR = join(homedir(), '.smyt');
const TOKEN_FILE = join(CONFIG_DIR, 'github-token');

// Check if OAuth is properly configured
const isOAuthConfigured = () => {
  // Read CLIENT_ID dynamically, not at module load time
  const CLIENT_ID = process.env.GITHUB_OAUTH_CLIENT_ID || 'Ov23liYourClientIdHere_ReplaceMe';
  return CLIENT_ID && !CLIENT_ID.includes('ReplaceMe');
};

export class GitHubAuth {
  /**
   * Get GitHub token using Device Flow (OAuth)
   */
  async getToken(): Promise<string> {
    // Check if token exists in cache
    const cachedToken = await this.loadCachedToken();
    if (cachedToken) {
      console.log(chalk.green('✓ Using saved GitHub credentials\n'));
      return cachedToken;
    }

    // Start Device Flow
    return this.performDeviceFlow();
  }

  /**
   * Perform GitHub Device Flow authentication
   */
  private async performDeviceFlow(): Promise<string> {
    // Check if OAuth is configured
    if (!isOAuthConfigured()) {
      console.log(chalk.yellow('⚠️  OAuth Device Flow not configured'));
      console.log(chalk.dim('See OAUTH_SETUP.md for setup instructions\n'));
      console.log(chalk.cyan('Falling back to manual token entry...\n'));
      return this.promptForManualToken();
    }

    // Get CLIENT_ID at runtime
    const CLIENT_ID = process.env.GITHUB_OAUTH_CLIENT_ID!;

    console.log(chalk.cyan('\n🔐 GitHub Authentication\n'));
    console.log('Opening GitHub in your browser for authentication...\n');

    const spinner = ora('Waiting for authentication...').start();

    try {
      const auth = createOAuthDeviceAuth({
        clientType: 'oauth-app',
        clientId: CLIENT_ID,
        scopes: ['repo', 'public_repo'],
        onVerification: async (verification) => {
          spinner.stop();

          // Display the code prominently
          console.log(chalk.bold.cyan('\n┌─────────────────────────────────────┐'));
          console.log(chalk.bold.cyan('│  GitHub Authentication Required     │'));
          console.log(chalk.bold.cyan('└─────────────────────────────────────┘\n'));

          console.log(chalk.yellow('Enter this code in your browser:\n'));
          console.log(chalk.bold.green(`    ${verification.user_code}\n`));
          console.log(chalk.dim(`Verification URL: ${verification.verification_uri}\n`));

          // Auto-open browser
          try {
            await open(verification.verification_uri);
            console.log(chalk.green('✓ Browser opened automatically\n'));
          } catch {
            console.log(chalk.yellow('⚠ Could not open browser automatically'));
            console.log(chalk.dim(`Please visit: ${verification.verification_uri}\n`));
          }

          spinner.start('Waiting for you to approve in browser...');
        },
      });

      // This will wait until user approves in browser
      const { token } = await auth({ type: 'oauth' });

      spinner.succeed(chalk.green('Authentication successful!'));

      // Save token
      await this.saveToken(token);
      console.log(chalk.dim(`Token saved to ${TOKEN_FILE}\n`));

      return token;
    } catch (error) {
      spinner.fail(chalk.red('Authentication failed'));

      if (error instanceof Error) {
        console.error(chalk.red(`Error: ${error.message}`));
      }

      // Fallback to manual token entry
      console.log(chalk.yellow('\n⚠️  Falling back to manual token entry...'));
      return this.promptForManualToken();
    }
  }

  /**
   * Fallback: Prompt user to manually paste token
   */
  private async promptForManualToken(): Promise<string> {
    const inquirer = (await import('inquirer')).default;

    console.log(chalk.cyan('\n📝 Manual Token Entry\n'));
    console.log('Create a token at: https://github.com/settings/tokens/new');
    console.log(chalk.dim('Required scopes: repo or public_repo\n'));

    const { openBrowser } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'openBrowser',
        message: 'Open GitHub token settings in browser?',
        default: true,
      },
    ]);

    if (openBrowser) {
      await open('https://github.com/settings/tokens/new?description=show-me-your-think&scopes=repo,public_repo');
      console.log(chalk.green('\n✓ Browser opened'));
      console.log('After creating your token, paste it below:\n');
    }

    const { token } = await inquirer.prompt([
      {
        type: 'password',
        name: 'token',
        message: 'Enter your GitHub token:',
        mask: '*',
        validate: (input: string) => {
          if (!input || input.length < 10) {
            return 'Please enter a valid GitHub token';
          }
          return true;
        },
      },
    ]);

    // Save token
    await this.saveToken(token);
    console.log(chalk.green(`✓ Token saved\n`));

    return token;
  }

  /**
   * Load cached token from disk
   */
  private async loadCachedToken(): Promise<string | null> {
    try {
      if (!existsSync(TOKEN_FILE)) {
        return null;
      }
      const token = await readFile(TOKEN_FILE, 'utf-8');
      return token.trim() || null;
    } catch {
      return null;
    }
  }

  /**
   * Save token to disk
   */
  private async saveToken(token: string): Promise<void> {
    try {
      if (!existsSync(CONFIG_DIR)) {
        await mkdir(CONFIG_DIR, { recursive: true });
      }
      await writeFile(TOKEN_FILE, token, { mode: 0o600 }); // Secure permissions
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Failed to save token:'), error);
    }
  }

  /**
   * Clear saved token
   */
  static async clearToken(): Promise<void> {
    try {
      if (existsSync(TOKEN_FILE)) {
        await writeFile(TOKEN_FILE, '', 'utf-8');
        console.log(chalk.green('✅ Token cleared'));
      } else {
        console.log(chalk.dim('No saved token found'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to clear token:'), error);
    }
  }
}
