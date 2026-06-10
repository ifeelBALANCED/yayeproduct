// Node 20 (CI, NODE_VERSION у ci.yml) не має нативного WebSocket —
// @supabase/realtime-js@2.x кидає у конструкторі SupabaseClient
// (getWebSocketConstructor), навіть якщо realtime-канали не відкриваються.
// Поліфіл через ws — офіційно рекомендований воркераунд для Node < 22.
// На Node 22+ нативний WebSocket вже є — `??=` нічого не змінює.
import ws from 'ws';

const g = globalThis as { WebSocket?: unknown };
g.WebSocket ??= ws;
