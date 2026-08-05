import { NextResponse } from 'next/server';
import { appendCorkboardNote, readCorkboardNotes, sheetsConfigured } from '@/lib/sheets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!sheetsConfigured()) return NextResponse.json({ notes: [] });
  try {
    const notes = await readCorkboardNotes();
    return NextResponse.json({ notes });
  } catch (err) {
    console.error('[corkboard] failed to read sheet', err);
    return NextResponse.json({ notes: [] });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const { name, initiative } = (body ?? {}) as { name?: unknown; initiative?: unknown };

  if (typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  if (typeof initiative !== 'string' || initiative.trim().length === 0) {
    return NextResponse.json({ error: 'initiative is required' }, { status: 400 });
  }

  if (!sheetsConfigured()) {
    console.warn('[corkboard] Google Sheets not configured — note not recorded.');
    return NextResponse.json({ ok: true, recorded: false });
  }

  try {
    await appendCorkboardNote({
      name: name.trim().slice(0, 200),
      initiative: initiative.trim().slice(0, 1000),
    });
    return NextResponse.json({ ok: true, recorded: true });
  } catch (err) {
    console.error('[corkboard] failed to write to sheet', err);
    return NextResponse.json({ error: 'sheet write failed' }, { status: 502 });
  }
}
