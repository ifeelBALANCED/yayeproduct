import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  let result: string;
  try {
    const body = (await req.json()) as { result?: unknown };
    result = body.result as string;
    if (result !== 'helped' && result !== 'neutral') throw new Error('invalid result');
  } catch {
    return new Response(JSON.stringify({ error: 'bad request' }), { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await supabase.from('exercise_feedback').insert({ result });
    if (error) console.warn('[exercise-feedback] insert error:', error.message);
  } else {
    console.warn('[exercise-feedback] Supabase not configured');
  }

  return new Response(null, { status: 204 });
}
