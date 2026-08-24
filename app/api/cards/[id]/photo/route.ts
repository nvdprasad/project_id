import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { cards } from '@/db/schema';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const [record] = await getDb()
    .select({ photoKey: cards.photoKey })
    .from(cards)
    .where(eq(cards.id, id))
    .limit(1);

  if (!record?.photoKey) {
    return new Response('Not found', { status: 404 });
  }

  const object = await env.FILES.get(record.photoKey);

  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);

  return new Response(object.body, { headers });
}
