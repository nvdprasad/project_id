import { getCard } from '@/db/cards';
import { getPhoto } from '@/lib/storage';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const record = await getCard(id);

  if (!record?.photoKey) {
    return new Response('Not found', { status: 404 });
  }

  const photo = await getPhoto(record.photoKey);

  if (!photo) {
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers();
  headers.set('content-type', photo.contentType);
  headers.set('cache-control', photo.cacheControl);

  return new Response(photo.body, { headers });
}
