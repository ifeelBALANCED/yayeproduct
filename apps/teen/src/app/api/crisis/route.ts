// Crisis detection + logging — реалізація у Phase 2
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(_req: NextRequest) {
  return NextResponse.json({ error: 'not implemented yet' }, { status: 501 });
}
