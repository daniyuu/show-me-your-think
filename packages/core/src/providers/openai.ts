import OpenAI from 'openai';
import type { LLMProvider } from '../types.js';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, options?: { baseUrl?: string; model?: string }) {
    const clientConfig: Record<string, unknown> = { apiKey };

    if (options?.baseUrl) {
      clientConfig.baseURL = options.baseUrl;
      console.log(`🔧 Using custom API endpoint: ${options.baseUrl}`);
    }

    this.client = new OpenAI(clientConfig as ConstructorParameters<typeof OpenAI>[0]);
    this.model = options?.model || 'gpt-4o';
  }

  async complete(prompt: string, maxTokens: number): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return content;
  }
}
