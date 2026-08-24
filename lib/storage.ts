import { env } from 'cloudflare:workers';

export function getFilesBucket() {
  if (!env.FILES) {
    throw new Error(
      'Cloudflare R2 binding `FILES` is unavailable. Set the `r2` field in .openai/hosting.json to `FILES` or let your control plane inject the real binding values before using object storage.',
    );
  }

  return env.FILES;
}

export async function uploadPhoto(key: string, file: File) {
  const bucket = getFilesBucket();
  const buffer = await file.arrayBuffer();

  await bucket.put(key, buffer, {
    httpMetadata: {
      contentType: file.type || 'application/octet-stream',
      cacheControl: 'public, max-age=86400',
    },
  });
}
