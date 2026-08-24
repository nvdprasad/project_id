import { NextResponse } from 'next/server';
import { updateCardStatus } from '@/db/cards';
import { cardStatuses, type CardStatus } from '@/db/schema';

const ALLOWED_STATUSES = new Set<string>(cardStatuses);

function isCardStatus(value: string): value is CardStatus {
  return ALLOWED_STATUSES.has(value);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json()) as { status?: string };

  if (!body.status || !isCardStatus(body.status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  await updateCardStatus(id, body.status);

  return NextResponse.json({ ok: true });
}
