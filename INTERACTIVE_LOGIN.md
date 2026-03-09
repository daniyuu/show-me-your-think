# Interactive GitHub Authentication

## 🎯 New Feature: No More Manual Token Configuration!

You can now use `show-me-your-think` without manually configuring GitHub tokens. The CLI will guide you through the login process.

## 🚀 Usage

### First Time Usage

Just run the analyze command without any token:

```bash
pnpm dev analyze googleworkspace/cli
```

You'll see an interactive prompt:

```
🔑 GitHub Authentication Required

You need a GitHub Personal Access Token to analyze repositories.
Scopes needed: repo (private) or public_repo (public only)

? How would you like to authenticate?
  🌐 Open GitHub settings to create token
❯ 📋 Paste existing token
```

### Option 1: Create New Token (Recommended)

1. Select **"Open GitHub settings to create token"**
2. Your browser will open to GitHub's token creation page
3. Review the pre-filled settings and click **"Generate token"**
4. Copy the generated token
5. Return to terminal and paste it
6. Choose **"Yes"** to save it for future use

```bash
? Enter your GitHub token: ********************************
? Save token for future use? (Y/n) Y
✅ Token saved to /home/user/.smyt/github-token
```

### Option 2: Use Existing Token

1. Select **"Paste existing token"**
2. Paste your existing GitHub token
3. Optionally save it for future use

### Subsequent Usage

On your next run, you'll be asked:

```bash
? Use saved GitHub token? (Y/n) Y
```

Simply press Enter to continue with your saved token!

## 📋 Commands

### Analyze Repository

```bash
# Will prompt for login if needed
pnpm dev analyze googleworkspace/cli

# Use specific token (skip login prompt)
pnpm dev analyze googleworkspace/cli --github-token ghp_xxx
```

### Logout (Clear Saved Token)

```bash
pnpm dev logout
```

Output:
```
✅ Token cleared
```

### Configuration Help

```bash
pnpm dev config
```

## 🔒 Security

- Tokens are saved to `~/.smyt/github-token`
- File permissions are set to `600` (owner read/write only)
- Token is never displayed in logs
- You can clear saved tokens anytime with `pnpm dev logout`

## 📁 Token Storage Location

**Linux/Mac**: `~/.smyt/github-token`
**Windows**: `C:\Users\YourName\.smyt\github-token`

## 🔄 Login Flow Diagram

```
Start analyze command
         ↓
   Token in CLI args? ────Yes───→ Use it
         ↓ No
   Token in env var? ────Yes───→ Use it
         ↓ No
   Saved token exists? ──Yes───→ Ask to use it
         ↓ No                          ↓ No
   Show login prompt ←───────────────┘
         ↓
   Create or paste token
         ↓
   Ask to save token
         ↓
   Continue analysis
```

## 💡 Pro Tips

### Skip Login Prompt with Environment Variable

```bash
export GITHUB_TOKEN=ghp_your_token
pnpm dev analyze owner/repo
```

### One-Time Token (Don't Save)

When prompted **"Save token for future use?"**, select **No**.

### Switch Accounts

```bash
# Clear current token
pnpm dev logout

# Next analyze will prompt for login again
pnpm dev analyze owner/repo
```

### CI/CD Usage

In automated environments, use environment variables:

```yaml
# GitHub Actions
- name: Analyze Repository
  env:
    GITHUB_TOKEN: ${{ secrets.GH_TOKEN }}
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_KEY }}
  run: pnpm dev analyze ${{ github.repository }}
```

## 🆚 Comparison: Before vs After

### Before (Manual Configuration)

```bash
# Step 1: Get token manually from GitHub
# Step 2: Create .env file
# Step 3: Edit .env file
echo "GITHUB_TOKEN=ghp_xxx" >> .env
echo "ANTHROPIC_API_KEY=sk-ant-xxx" >> .env

# Step 4: Run analysis
pnpm dev analyze owner/repo
```

### After (Interactive Login)

```bash
# Just run it!
pnpm dev analyze owner/repo

# CLI guides you through the rest
```

## ❓ FAQ

**Q: Do I need to create a token every time?**
A: No! Save it on first use, and it will be reused automatically.

**Q: Can I still use .env file?**
A: Yes! Tokens from `.env` (or CLI args) take precedence over saved tokens.

**Q: Is my token secure?**
A: Yes, it's stored with restricted file permissions (600) in your home directory.

**Q: What if I lose my token?**
A: Run `pnpm dev logout` and you'll be prompted to create a new one.

**Q: Can multiple people share the same token file?**
A: No, each user should have their own token in their home directory.

## 🐛 Troubleshooting

### "Failed to save token"

- Check write permissions for `~/.smyt/` directory
- Manually create directory: `mkdir -p ~/.smyt`

### "Token invalid" errors during analysis

- Token may have expired or been revoked
- Run `pnpm dev logout` and create a new token

### Browser doesn't open automatically

- Copy this URL manually: https://github.com/settings/tokens/new?description=show-me-your-think&scopes=repo
- Create token and paste it when prompted
