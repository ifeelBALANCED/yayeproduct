// ports/anthropic.ts — мінімальний інтерфейс AI-стріму (DIP, quality-gate §2.1).
// Єдина точка, через яку command-handlers взаємодіють з LLM.
// У тестах замінюється фейком: async function* fakeAnthropic() { yield 'токен'; }

// Формат system — як у buildSystemPrompt (@ya-ye/method): блоки з cache_control
// для prompt caching. Рядок — для простих випадків/фейків у тестах.
type SystemPromptBlock = {
  type: 'text';
  text: string;
  cache_control?: { type: 'ephemeral' };
};

export interface AnthropicStreamParams {
  model: string;
  maxTokens: number;
  system: string | SystemPromptBlock[];
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// AsyncIterable<string> — кожен yielded рядок є текстовим токеном.
// Реальний адаптер wraps SDK streaming; фейк — фіксований генератор.
export interface AnthropicPort {
  streamChat(params: AnthropicStreamParams): AsyncIterable<string>;
}
