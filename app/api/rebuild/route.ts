import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const { key } = (body ?? {}) as { key?: unknown };
  const secret = process.env.REBUILD_SECRET;

  if (!secret || typeof key !== 'string' || key !== secret) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const hookUrl = process.env.NETLIFY_BUILD_HOOK_URL;
  if (!hookUrl) {
    return NextResponse.json({ error: 'rebuild hook not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(hookUrl, { method: 'POST' });
    if (!res.ok) {
      return NextResponse.json({ error: 'build hook responded with an error' }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[rebuild] failed to call build hook', err);
    return NextResponse.json({ error: 'failed to trigger rebuild' }, { status: 502 });
  }
}
