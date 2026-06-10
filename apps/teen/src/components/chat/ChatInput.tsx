'use client';

import { useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@ya-ye/ui';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled,
  placeholder = 'напиши...',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  return (
    <div className="flex items-end gap-2 border-t border-divider bg-bg px-4 py-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          'flex-1 resize-none rounded-2xl border border-divider bg-bgSoft px-4 py-3',
          'font-sans text-base text-ink placeholder:text-inkSoft/50',
          'focus:outline-none focus:ring-1 focus:ring-accent/50',
          'disabled:opacity-50',
        )}
        style={{ maxHeight: '120px' }}
        aria-label="Повідомлення"
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || disabled}
        className={cn(
          'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl transition-all',
          value.trim() && !disabled
            ? 'bg-accent text-white active:opacity-80'
            : 'bg-divider text-inkSoft',
        )}
        aria-label="Надіслати"
      >
        <Send size={18} strokeWidth={1.5} />
      </button>
    </div>
  );
}
