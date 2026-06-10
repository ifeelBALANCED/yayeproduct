import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const PLACEHOLDER_HOSTS = ['your-project.supabase.co'];
const PLACEHOLDER_KEYS = ['your-service-role-key', 'your-anon-key'];

/**
 * True iff the Supabase env vars look like real (non-placeholder) values.
 * Until the user creates a real project, the .env.local contains template
 * values and we degrade gracefully (e.g. /api/sessions falls back to a
 * client-style UUID, route.ts logs warnings instead of failing).
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '';
  if (!url || !key) return false;
  if (PLACEHOLDER_HOSTS.some((h) => url.includes(h))) return false;
  if (PLACEHOLDER_KEYS.includes(key)) return false;
  return true;
}

const BOM_RE = /^﻿/;

function stripBom(s: string): string {
  return s.replace(BOM_RE, '').trim();
}

export function createClient() {
  // Returns a client even when not configured — callers that depend on real
  // persistence should gate with isSupabaseConfigured() first. This keeps the
  // existing non-blocking inserts in route.ts working without crashing.
  const url = stripBom(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '');
  const key = stripBom(process.env.SUPABASE_SERVICE_ROLE_KEY ?? '');
  return createSupabaseClient(url || 'https://placeholder.supabase.co', key || 'placeholder-key');
}
