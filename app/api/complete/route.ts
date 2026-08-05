import { NextResponse } from 'next/server';
import { appendResult, sheetsConfigured } from '@/lib/sheets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const { name, phoneNumber, unitReached, passed } = (body ?? {}) as {
    name?: unknown;
    phoneNumber?: unknown;
    unitReached?: unknown;
    passed?: unknown;
  };

  if (typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  if (!sheetsConfigured()) {
    console.warn('[complete] Google Sheets not configured — completion not recorded.');
    return NextResponse.json({ ok: true, recorded: false });
  }

  try {
    await appendResult({
      name: name.trim().slice(0, 200),
      phoneNumber:
        typeof phoneNumber === 'string' ? phoneNumber.trim().slice(0, 40) : undefined,
      unitReached: typeof unitReached === 'number' ? unitReached : 4,
      passed: passed !== false,
    });
    return NextResponse.json({ ok: true, recorded: true });
  } catch (err) {
    console.error('[complete] failed to write to sheet', err);
    return NextResponse.json({ error: 'sheet write failed' }, { status: 502 });
  }
}
