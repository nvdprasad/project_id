import { NextResponse } from 'next/server';
import { updateCardStatus } from '@/db/cards';

const ALLOWED_STATUSES = new Set(['active', 'inactive', 'expired']);

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json()) as { status?: string };

  if (!body.status || !ALLOWED_STATUSES.has(body.status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  await updateCardStatus(id, body.status);

  return NextResponse.json({ ok: true });
}
