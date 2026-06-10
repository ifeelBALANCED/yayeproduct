// adapters/anthropicSdk.ts — ЄДИНЕ місце імпорту @anthropic-ai/sdk у apps/teen.
// Dependency-cruiser rule §2.2: будь-який інший файл (крім цього) що імпортує
// '@anthropic-ai/sdk' безпосередньо — порушення архітектурного правила.

import Anthropic from '@anthropic-ai/sdk';
import type { AnthropicPort, AnthropicStreamParams } from '@/server/ports/anthropic';

class AnthropicSdkAdapter implements AnthropicPort {
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async *streamChat(params: AnthropicStreamParams): AsyncIterable<string> {
    const stream = this.client.messages.stream({
      model: params.model,
      max_tokens: params.maxTokens,
      system: params.system,
      messages: params.messages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }
}

// Фабрика — читає env at request time (не при завантаженні модуля).
// NOTE: порожній ANTHROPIC_API_KEY у shell env перекриє .env.local —
// Next.js ніколи не перезаписує pre-existing process.env.
export function createAnthropicAdapter(): AnthropicPort | null {
  const apiKey = process.env.ANTHROPIC_API_KEY?.replace(/^﻿/, '').trim();
  if (!apiKey) return null;
  return new AnthropicSdkAdapter(apiKey);
}
