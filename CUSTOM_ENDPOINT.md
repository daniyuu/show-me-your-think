# Using Custom API Endpoints (Local Proxy)

This guide explains how to configure `show-me-your-think` to use a custom API endpoint instead of the official Anthropic API.

## Use Cases

- **Local Development**: Use a local proxy for testing
- **Cost Optimization**: Route through a caching layer
- **Custom Models**: Point to your own fine-tuned models
- **Corporate Proxy**: Route through company infrastructure

## Configuration

### Method 1: Environment Variables

Create a `.env` file:

```env
# Required
GITHUB_TOKEN=ghp_your_token_here
ANTHROPIC_API_KEY=dummy-key  # Can be any value for local proxy

# Custom endpoint
ANTHROPIC_BASE_URL=http://localhost:4141

# Optional: specify model
MODEL=claude-opus-4.6
```

Then run:

```bash
pnpm dev analyze owner/repo
```

### Method 2: Command Line Options

```bash
pnpm dev analyze owner/repo \
  --anthropic-base-url http://localhost:4141 \
  --anthropic-key dummy-key \
  --model claude-opus-4.6
```

## Setting Up a Local Proxy

### Example: Simple Proxy Server

Here's a minimal example of a local proxy that forwards to Anthropic:

```typescript
// proxy-server.ts
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

app.use('/v1', createProxyMiddleware({
  target: 'https://api.anthropic.com',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    // Add real API key here
    proxyReq.setHeader('x-api-key', process.env.REAL_ANTHROPIC_KEY);
  },
}));

app.listen(4141, () => {
  console.log('Proxy running on http://localhost:4141');
});
```

### Example: Caching Proxy

Add caching to reduce costs:

```typescript
import express from 'express';
import NodeCache from 'node-cache';

const app = express();
const cache = new NodeCache({ stdTTL: 3600 });

app.post('/v1/messages', express.json(), async (req, res) => {
  const cacheKey = JSON.stringify(req.body);

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('Cache hit!');
    return res.json(cached);
  }

  // Forward to Anthropic
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.REAL_ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(req.body),
  });

  const data = await response.json();
  cache.set(cacheKey, data);
  res.json(data);
});

app.listen(4141);
```

## Verification

When using a custom endpoint, you'll see:

```
🧠 Show Me Your Think

Repository: owner/repo
Model: claude-opus-4.6
API Endpoint: http://localhost:4141
Output: ./think-report.md

🔧 Using custom API endpoint: http://localhost:4141
🔍 Analyzing owner/repo...
```

## Troubleshooting

### Connection Refused

Make sure your local proxy is running:

```bash
# Check if port 4141 is listening
netstat -an | grep 4141
```

### Authentication Errors

The proxy must handle authentication. Options:
1. Proxy adds real API key to requests
2. Pass real API key through from client

### Model Not Found

Ensure your custom endpoint supports the specified model. Default is `claude-opus-4.6`.

## Advanced: Mock Server for Testing

For testing without API calls:

```typescript
import express from 'express';

const app = express();
app.use(express.json());

app.post('/v1/messages', (req, res) => {
  // Return mock response
  res.json({
    id: 'msg_mock',
    type: 'message',
    role: 'assistant',
    content: [{
      type: 'text',
      text: JSON.stringify({
        what: 'Mock feature analysis',
        why: 'Testing without real API',
        architecturalImpact: 'No real impact',
        confidence: 0.95,
      }),
    }],
    model: 'claude-opus-4.6',
    stop_reason: 'end_turn',
    usage: { input_tokens: 100, output_tokens: 50 },
  });
});

app.listen(4141, () => {
  console.log('Mock server running on http://localhost:4141');
});
```

Then analyze repos without making real API calls:

```bash
ANTHROPIC_BASE_URL=http://localhost:4141 \
ANTHROPIC_API_KEY=mock \
pnpm dev analyze owner/repo
```

## Production Considerations

### Security

- Never expose proxy publicly
- Use authentication if needed
- Rate limit requests

### Performance

- Add connection pooling
- Implement request queuing
- Monitor latency

### Cost Optimization

- Cache similar analyses
- Batch requests when possible
- Use cheaper models for simple analysis

## Example: Complete Production Proxy

```typescript
import express from 'express';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import pino from 'pino';

const app = express();
const cache = new NodeCache({ stdTTL: 3600 });
const logger = pino();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(express.json());
app.use(limiter);

// Logging middleware
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url });
  next();
});

// Proxy endpoint
app.post('/v1/messages', async (req, res) => {
  const cacheKey = JSON.stringify(req.body);

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached) {
    logger.info('Cache hit');
    return res.json(cached);
  }

  try {
    // Forward to Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.REAL_ANTHROPIC_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Cache and return
    cache.set(cacheKey, data);
    res.json(data);

    logger.info('API call successful');
  } catch (error) {
    logger.error({ error }, 'API call failed');
    res.status(500).json({ error: 'Proxy error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4141;
app.listen(PORT, () => {
  logger.info(`Proxy server running on port ${PORT}`);
});
```

Run with:

```bash
REAL_ANTHROPIC_KEY=sk-ant-xxx node proxy-server.js
```

Configure client:

```bash
ANTHROPIC_BASE_URL=http://localhost:4141 \
ANTHROPIC_API_KEY=dummy \
pnpm dev analyze owner/repo
```
