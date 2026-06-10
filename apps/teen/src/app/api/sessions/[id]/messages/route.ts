// GET /api/sessions/[id]/messages — повертає історію розмови з БД.
// Використовується для page-reload resilience у chat-UI: якщо юзер
// перезавантажить /[sessionId], React state втрачено, але БД-historія
// дозволяє відновити розмову у межах ТЇЕЇ Ж сесії (це in-session
// continuity, не cross-session memory — методологія дозволяє).
//
// Якщо Supabase не сконфігурований або session-row не існує (наприклад,
// сесія створена через fallback-шлях /api/sessions) — повертає
// порожній масив. UI коректно покаже greeting і чекатиме першого ходу.

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

type Turn = { role: 'user' | 'assistant'; content: string; created_at: string };

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await params;

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'missing session id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Supabase ще не сконфігурований — повертаємо порожньо, UI відштовхується
  // від client-state (greeting). Це коректний fallback, не помилка.
  if (!isSupabaseConfigured()) {
    return new Response(JSON.stringify({ messages: [], persisted: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(40); // достатньо для 25-хв сесії

  if (error) {
    console.warn('[messages.GET] supabase error:', error.message);
    // Тут теж віддаємо порожньо — UI має продовжувати працювати
    return new Response(JSON.stringify({ messages: [], persisted: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const messages: Turn[] = (data ?? [])
    .filter(
      (m): m is Turn =>
        !!m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string',
    )
    .map((m) => ({ role: m.role, content: m.content, created_at: m.created_at }));

  return new Response(JSON.stringify({ messages, persisted: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
