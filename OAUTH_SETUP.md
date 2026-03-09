# GitHub OAuth App Setup

## ⚠️ IMPORTANT: GitHub OAuth App Required

To enable Device Flow authentication, you need to create a GitHub OAuth App.

## Quick Setup (5 minutes)

### 1. Create OAuth App

Visit: https://github.com/settings/applications/new

Fill in:
- **Application name**: `show-me-your-think`
- **Homepage URL**: `https://github.com/daniyuu/show-me-your-think`
- **Application description**: `Analyze GitHub repositories to understand what and why`
- **Authorization callback URL**: `http://127.0.0.1` (required, but not used for Device Flow)

Click **"Register application"**

### 2. Get Client ID

After creating, you'll see:
- **Client ID**: `Ov23li...` (copy this)

### 3. Configure Environment Variable

Edit `.env` file in project root:

```env
GITHUB_OAUTH_CLIENT_ID=Ov23liYourClientId
ANTHROPIC_API_KEY=dummy-key
ANTHROPIC_BASE_URL=http://localhost:4141
MODEL=claude-opus-4.6
```

### 4. Rebuild

```bash
pnpm build
```

## Security Note

**Client ID is safe to publish** - it's public by design in OAuth Device Flow. Only the Client Secret needs to be kept private (and we don't use it for Device Flow).

## Testing Device Flow

After setup:

```bash
# Clear any cached tokens
pnpm dev logout

# Test authentication
pnpm dev analyze googleworkspace/cli
```

You should see:

```
🔐 GitHub Authentication

Opening GitHub in your browser for authentication...

┌─────────────────────────────────────┐
│  GitHub Authentication Required     │
└─────────────────────────────────────┘

Enter this code in your browser:

    ABCD-1234

✓ Browser opened automatically
⠋ Waiting for you to approve in browser...
```

## Troubleshooting

### "Client ID not found"

Make sure you:
1. Created the OAuth App correctly
2. Copied the Client ID (starts with `Ov23li`)
3. Updated the `.env` file
4. Ran `pnpm build`

### Browser doesn't open

The URL will be printed in terminal. Copy it manually:
```
https://github.com/login/device
```

Then enter the code shown.

### "Invalid client"

Double-check your Client ID is correct.
