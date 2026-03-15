import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider } from '../types.js';

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, options?: { baseUrl?: string; model?: string }) {
    const clientConfig: Record<string, unknown> = { apiKey };

    if (options?.baseUrl) {
      clientConfig.baseURL = options.baseUrl;
      console.log(`🔧 Using custom API endpoint: ${options.baseUrl}`);
    }

    this.client = new Anthropic(clientConfig);
    this.model = options?.model || 'claude-opus-4.6';
  }

  async complete(prompt: string, maxTokens: number): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }

    return content.text;
  }
}
