import type { AnalysisConfig, LLMProvider } from '../types.js';
import { AnthropicProvider } from './anthropic.js';
import { OpenAIProvider } from './openai.js';

export { AnthropicProvider } from './anthropic.js';
export { OpenAIProvider } from './openai.js';

/**
 * Factory function that creates the appropriate LLM provider based on config.
 * Supports backward-compatible `anthropicApiKey` / `anthropicBaseUrl` aliases.
 */
export function createProvider(config: AnalysisConfig): LLMProvider {
  const provider = config.provider || 'anthropic';
  const apiKey = config.apiKey || config.anthropicApiKey;
  const baseUrl = config.baseUrl || config.anthropicBaseUrl;

  if (!apiKey) {
    throw new Error(`API key is required. Set apiKey in config or use the --api-key CLI option.`);
  }

  const opts = { baseUrl, model: config.model };

  switch (provider) {
    case 'openai':
      return new OpenAIProvider(apiKey, opts);
    case 'anthropic':
    default:
      return new AnthropicProvider(apiKey, opts);
  }
}
