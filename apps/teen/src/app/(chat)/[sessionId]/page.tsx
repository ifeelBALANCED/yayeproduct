'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { Send } from 'lucide-react';
import { CrisisModal } from '@/components/crisis/CrisisModal';
import { Grounding54321 } from '@/components/crisis/Grounding54321';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { SpecialistRedirectInline } from '@/components/chat/SpecialistRedirectInline';
import { cn } from '@ya-ye/ui';
import { getExercise, type ExerciseId } from '@ya-ye/method/exercises';
import { SseEventSchema, type ChatRequest } from '@ya-ye/contracts';
import { parseModeLabel, stripModeLabel, DEFAULT_MODE_LABEL } from '@/lib/parseModeLabel';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  role: 'user' | 'assistant';
  bubbles: string[];
  isStreaming?: boolean;
  hasModeRedirect?: boolean; // true якщо AI емітив [MODE:4] — UI рендерить SpecialistRedirectInline під реплікою
  postCrisisExercise?: boolean; // true для пост-кризового повідомлення з пропозицією вправи
}

// Регекс для парсингу маркера. Підтримує опційний whitespace навколо
// і повторні маркери (хоч промт забороняє — все одно стрипаємо всі).
const MODE_REDIRECT_RE = /\s*\[MODE:4\]\s*/g;

// ---------------------------------------------------------------------------
// Exercise card — rendered inline when AI sends exercise signal
// ---------------------------------------------------------------------------

const EXERCISE_PREFIXES = ['[ВПРАВА', '[ЗАЗЕМЛЕННЯ', '[ТІЛО', '[RAIN', '[КОМПАС', '[ЯКІР'];

// Маркер промта → id вправи у whitelist (docs/exercises-whitelist.json)
const PREFIX_TO_EXERCISE: Record<string, ExerciseId> = {
  '[ВПРАВА': 'breathing-4-6',
  '[ЗАЗЕМЛЕННЯ': 'grounding-54321',
  '[ТІЛО': 'body-scan-short',
  '[RAIN': 'rain',
  '[КОМПАС': 'values-compass',
  '[ЯКІР': 'meaning-anchor',
};

function ExerciseCard({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = text.slice(1, -1).split(' · ');
  const title = lines[0] ?? text;
  const subtitle = lines.slice(1).join(' · ');

  const prefix = EXERCISE_PREFIXES.find((p) => text.startsWith(p));
  const exerciseId = prefix ? PREFIX_TO_EXERCISE[prefix] : undefined;
  const exercise = exerciseId ? getExercise(exerciseId) : null;

  return (
    <div className="my-1 rounded-2xl border border-divider bg-bgSoft px-4 py-3">
      <p className="font-mono text-xs uppercase tracking-wider text-inkSoft">{title}</p>
      {subtitle && <p className="mt-0.5 font-sans text-sm text-ink">{subtitle}</p>}
      {exercise?.steps && expanded && (
        <ol className="mt-3 space-y-2">
          {exercise.steps.map((step, i) => (
            <li key={i} className="flex gap-2 font-sans text-sm text-ink">
              <span className="font-mono text-xs text-inkSoft">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}
      {exercise?.steps && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 font-mono text-xs text-accent transition-opacity active:opacity-80"
        >
          {expanded ? 'згорнути' : exercise.ui_card.cta}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Session timer — 25:00 countdown
// ---------------------------------------------------------------------------

function SessionTimer({ onExpire }: { onExpire: () => void }) {
  const DURATION = 25 * 60;
  const [remaining, setRemaining] = useState(DURATION);
  const expiredRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onExpire]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const isLow = remaining <= 60;

  return (
    <span
      className={cn('font-mono text-[10px] tabular-nums', isLow ? 'text-crisis' : 'text-inkSoft')}
    >
      {mm}:{ss}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main chat screen
// ---------------------------------------------------------------------------

const UA_HOTLINES = [
  { name: 'дитяча лінія довіри', number: '116 111', note: 'безкоштовно · 24/7' },
  { name: 'Teenergizer', number: '7333', note: 'чат · безкоштовно' },
];

export default function ChatPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [expired, setExpired] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  // postCrisisMode — true після того як спрацювала криза і юзер продовжив розмову
  const [postCrisisMode, setPostCrisisMode] = useState(false);
  const [showGroundingInChat, setShowGroundingInChat] = useState(false);
  // Hydrated від БД? Поки не закінчилось — не показуємо greeting, щоб уникнути
  // flicker'а (greeting → DB-історія). Якщо Supabase плейсхолдер — endpoint
  // одразу повертає [] і ми переходимо у звичайний first-turn flow.
  const [hydrated, setHydrated] = useState(false);
  // mode-лейбл — оновлюється з першого рядка кожної assistant-відповіді
  const [modeLabel, setModeLabel] = useState(DEFAULT_MODE_LABEL);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentStreamId = useRef<string | null>(null);
  // Встановлюється при першому відправленому повідомленні — рахуємо активний час розмови,
  // а не час відкритої сторінки. null = розмова ще не почалась.
  const sessionStartedAtRef = useRef<number | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Hydrate розмови з БД (in-session resilience при page reload). Виконується
  // один раз. У fallback-режимі endpoint віддає [] і ми просто продовжуємо.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/sessions/${sessionId}/messages`)
      .then(
        (r) =>
          r.json() as Promise<{
            messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
          }>,
      )
      .then((data) => {
        if (cancelled) return;
        const dbMessages = data.messages ?? [];
        if (dbMessages.length > 0) {
          setMessages(
            dbMessages.map((m, i) => ({
              id: `db-${i}`,
              role: m.role,
              bubbles: m.content.split('\n\n').filter((b) => b.trim().length > 0),
            })),
          );
        }
      })
      .catch(() => {
        /* мовчазний fallback — UI працює без БД */
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Читаємо ім'я з sessionStorage один раз після mount
  useEffect(() => {
    const stored = sessionStorage.getItem('user_name');
    if (stored) setUserName(stored);
  }, []);

  // First turn greeting — показуємо тільки ПІСЛЯ гідратації, інакше
  // greeting блимне до того як ми завантажимо історію з БД.
  // EU AI Act Art. 50 disclosure вже є на splash-екрані та у header чату постійно.
  useEffect(() => {
    if (hydrated && messages.length === 0) {
      const name = sessionStorage.getItem('user_name');
      const greeting = name ? `розкажи, як ти зараз, ${name}?` : 'розкажи, як ти зараз?';
      setMessages([
        {
          id: 'greeting',
          role: 'assistant',
          bubbles: [greeting],
        },
      ]);
    }
  }, [hydrated, messages.length]);

  // Зберігаємо id таймера, щоб скасувати його при unmount (запобігає leak).
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup таймера при unmount компонента
  useEffect(() => {
    return () => {
      if (exitTimerRef.current !== null) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  const handleExpire = useCallback(() => {
    setExpired(true);
    setMessages((prev) => [
      ...prev,
      {
        id: 'expired',
        role: 'assistant',
        bubbles: [
          'час. сесія закривається — це за дизайном.',
          'зроби собі паузу. вийди на повітря на 5 хвилин.',
          'я тут, якщо повернешся.',
        ],
      },
    ]);
    // Канонічний промт 4.9: «UI зараз закриє чат». Даємо 8с прочитати
    // closing-баббли, потім ведемо на graduation-екран /exit. Route group
    // (chat) не додає prefix — URL є /${sessionId}/exit.
    // Таймер зберігається у ref — cleanup у useEffect вище скасує його при unmount.
    exitTimerRef.current = setTimeout(() => {
      router.push(`/${sessionId}/exit`);
    }, 8000);
  }, [router, sessionId]);

  const appendToStream = useCallback(
    (id: string, text: string) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m;
          // Join existing + new text, then check for [MODE:4] marker.
          // Strip marker from display, but remember it for rendering the inline.
          const rawWithMarker = m.bubbles.join('\n\n') + text;
          const hasModeRedirect = MODE_REDIRECT_RE.test(rawWithMarker);
          // Reset regex state (g-flag is stateful) before next test elsewhere
          MODE_REDIRECT_RE.lastIndex = 0;
          // Витягуємо mode-лейбл з першого рядка відповіді і оновлюємо стрічку.
          // stripModeLabel прибирає тег з тексту перед розбивкою на баббли.
          const label = parseModeLabel(rawWithMarker);
          if (label !== DEFAULT_MODE_LABEL) {
            setModeLabel(label);
          }
          const raw = stripModeLabel(rawWithMarker).replace(MODE_REDIRECT_RE, '');
          MODE_REDIRECT_RE.lastIndex = 0;
          return {
            ...m,
            bubbles: raw.split('\n\n').filter(Boolean),
            isStreaming: true,
            hasModeRedirect: m.hasModeRedirect || hasModeRedirect,
          };
        }),
      );
    },
    [setModeLabel],
  );

  const finalizeStream = useCallback((id: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isStreaming: false } : m)));
    currentStreamId.current = null;
  }, []);

  async function sendMessage() {
    const text = input.trim();
    if (!text || isLoading || expired) return;

    setInput('');
    setIsLoading(true);

    // Фіксуємо час першого відправленого повідомлення — звідси рахується 25 хв
    if (!sessionStartedAtRef.current) {
      sessionStartedAtRef.current = Date.now();
    }

    // Build conversation history from current state for the model.
    // Exclude the client-only opening greeting and any empty/streaming bubbles —
    // this keeps the dialogue continuous without depending on DB persistence.
    const history = messages
      .filter((m) => m.id !== 'greeting')
      .map((m) => ({ role: m.role, content: m.bubbles.join('\n\n').trim() }))
      .filter((m) => m.content.length > 0);
    // §2.4: turnNumber — серверне поле, не передається у тілі запиту.
    // Сервер рахує user-turns сам по history.

    // Add user message
    const userId = `u-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userId, role: 'user', bubbles: [text] }]);

    // Placeholder for streaming assistant message
    const assistantId = `a-${Date.now()}`;
    currentStreamId.current = assistantId;
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', bubbles: [''], isStreaming: true },
    ]);

    try {
      // Тіло запиту будується з inferred-типу ChatRequest (quality-gate §2.4).
      // Поля turnNumber / sessionStartedAt / postCrisisMode — серверні, не передаємо.
      const chatBody: ChatRequest = {
        sessionId,
        userMessage: text,
        history,
        // Demo-fallback для P0-3: коли Supabase не сконфігуровано, сервер
        // не має age_band з БД — передаємо вибір з онбордингу (сервер валідує enum)
        ageBand: (sessionStorage.getItem('age_band') as ChatRequest['ageBand']) ?? null,
        userName: sessionStorage.getItem('user_name') ?? null,
      };
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatBody),
      });

      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        const data = (await response.json()) as { type: string; message?: string };
        if (data.type === 'crisis' && data.message) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, bubbles: data.message!.split('\n\n').filter(Boolean), isStreaming: false }
                : m,
            ),
          );
          setCrisisOpen(true);
          setPostCrisisMode(true);
          setIsLoading(false);
          return;
        }
        // Non-crisis JSON (error response) — show fallback and stop
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, bubbles: ['щось пішло не так. спробуй ще раз.'], isStreaming: false }
              : m,
          ),
        );
        setIsLoading(false);
        return;
      }

      // SSE streaming
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';
        for (const event of events) {
          if (!event.startsWith('data: ')) continue;
          // SseEventSchema.safeParse замість голого JSON.parse:
          // обрив стріму або невалідний chunk → пропускаємо без краша UI
          // (quality-gate §2.4, S3: «обрив стріму → UI не зависає»).
          let parsed;
          try {
            parsed = SseEventSchema.safeParse(JSON.parse(event.slice(6)));
          } catch {
            // Невалідний JSON — пропускаємо chunk
            continue;
          }
          if (!parsed.success) {
            // Невідомий або некоректний SSE-event — пропускаємо без краша
            continue;
          }
          const data = parsed.data;
          if (data.type === 'token') {
            appendToStream(assistantId, data.text);
          } else if (data.type === 'done') {
            finalizeStream(assistantId);
          } else if (data.type === 'error') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, bubbles: ['щось пішло не так. спробуй ще раз.'], isStreaming: false }
                  : m,
              ),
            );
          }
          // type === 'crisis' обробляється через JSON Content-Type вище, не SSE
        }
      }
      // Stream ended — ensure the bubble is finalized even if 'done' event was missed
      finalizeStream(assistantId);
    } catch (err) {
      console.error('Chat error', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, bubbles: ['щось пішло не так. спробуй ще раз.'], isStreaming: false }
            : m,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* Mode strip — лейбл оновлюється з першого рядка кожної assistant-відповіді */}
      <div className="flex items-center justify-between border-b border-divider px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-inkSoft">
          {modeLabel}
        </span>
        <SessionTimer onExpire={handleExpire} />
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        aria-live="polite"
        aria-label="Розмова"
      >
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-3">
            {msg.bubbles.map((bubble, i) => {
              const isExercise =
                msg.role === 'assistant' && EXERCISE_PREFIXES.some((p) => bubble.startsWith(p));
              return isExercise ? (
                <ExerciseCard key={`${msg.id}-${i}`} text={bubble} />
              ) : (
                <ChatBubble
                  key={`${msg.id}-${i}`}
                  role={msg.role}
                  content={bubble}
                  isStreaming={msg.isStreaming === true && i === msg.bubbles.length - 1}
                />
              );
            })}
            {/* [MODE:4] inline-блок — прибираємо під час і після кризи */}
            {msg.role === 'assistant' &&
              msg.hasModeRedirect &&
              !msg.isStreaming &&
              !crisisOpen &&
              !postCrisisMode && <SpecialistRedirectInline />}

            {/* Пост-кризова вправа */}
            {msg.postCrisisExercise && !showGroundingInChat && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowGroundingInChat(true)}
                  className="w-full rounded-2xl border border-divider bg-bgSoft px-4 py-3 text-left transition-colors hover:border-accent/30 active:opacity-80"
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                    заземлення · 5-4-3-2-1
                  </p>
                  <p className="mt-0.5 font-sans text-sm text-inkSoft">
                    5 чуттів — крок за кроком · ~2 хв
                  </p>
                </button>
                <button
                  onClick={() => {
                    /* просто продовжити — нічого не робимо */
                  }}
                  className="w-full rounded-2xl px-4 py-2 font-sans text-sm text-inkSoft/60 underline-offset-2 hover:underline"
                >
                  просто поговоримо
                </button>
              </div>
            )}
            {msg.postCrisisExercise && showGroundingInChat && (
              <div className="rounded-3xl border border-divider bg-bgSoft px-5 py-5">
                <Grounding54321
                  onDone={() => {
                    setShowGroundingInChat(false);
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: `after-grounding-${Date.now()}`,
                        role: 'assistant',
                        bubbles: ['ти тут. як зараз?'],
                      },
                    ]);
                  }}
                />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-divider px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={isLoading || expired}
            placeholder={expired ? 'сесія завершена' : 'напиши тут...'}
            rows={1}
            className={cn(
              'flex-1 resize-none rounded-2xl border border-divider bg-bgSoft px-4 py-3',
              'font-sans text-base text-ink placeholder:text-inkSoft/50',
              'focus:border-accent/50 focus:outline-none',
              'max-h-32 overflow-y-auto',
              (isLoading || expired) && 'opacity-50',
            )}
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || expired}
            aria-label="надіслати"
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-white',
              'transition-opacity active:opacity-70',
              (!input.trim() || isLoading || expired) && 'opacity-40',
            )}
          >
            <Send size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* SOS shortcut below input */}
        <div className="mt-2 flex justify-end">
          <Link
            href={`/crisis?sessionId=${sessionId}` as `/crisis?sessionId=${string}`}
            className="font-mono text-[10px] uppercase tracking-wider text-crisis/70 hover:text-crisis"
          >
            SOS →
          </Link>
        </div>
      </div>

      {/* Crisis modal */}
      {crisisOpen && (
        <CrisisModal
          hotlines={UA_HOTLINES}
          onClose={() => {
            setCrisisOpen(false);
            // Після закриття модалу — додаємо повідомлення з пропозицією вправи
            setMessages((prev) => [
              ...prev,
              {
                id: `post-crisis-${Date.now()}`,
                role: 'assistant',
                bubbles: [
                  'ти повернувся. я тут.',
                  'є вправа заземлення — вона може допомогти зараз. хочеш спробуємо?',
                ],
                postCrisisExercise: true,
              },
            ]);
          }}
          onGrounding={() => {
            setCrisisOpen(false);
            setPostCrisisMode(true);
          }}
        />
      )}
    </>
  );
}
