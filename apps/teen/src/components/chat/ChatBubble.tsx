import { cn } from '@ya-ye/ui';
import type { Mode } from '@ya-ye/method';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  mode?: Mode;
  isStreaming?: boolean;
}

const MODE_LABELS: Record<Mode, string> = {
  1: '01 · підтримую',
  2: '02 · поруч',
  3: '03 · обережно',
  4: '04 · пауза',
};

export function ChatBubble({ role, content, mode, isStreaming }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[90%] space-y-1',
          isUser ? 'items-end' : 'items-start',
          'flex flex-col',
        )}
      >
        {/* Mode label для assistant — показується над бабблом */}
        {!isUser && mode && (
          <span className="px-1 font-mono text-[10px] uppercase tracking-wider text-inkSoft">
            [{MODE_LABELS[mode]}]
          </span>
        )}

        <div
          className={cn(
            'rounded-2xl px-4 py-3',
            isUser
              ? 'bg-accent text-white'
              : 'bg-bgSoft text-ink',
          )}
        >
          {/* AI-репліки — малі літери, за дизайном */}
          <p
            className={cn(
              'font-sans text-base leading-relaxed',
              !isUser && 'lowercase',
            )}
          >
            {content}
            {isStreaming && (
              <span className="ml-1 inline-block h-3 w-0.5 animate-pulse bg-current opacity-70" />
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
