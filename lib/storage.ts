import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getStore } from '@netlify/blobs';

const FILE_STORE_NAME = 'cardmint-files';
const LOCAL_STORAGE_DIRECTORY = path.join(process.cwd(), '.local-data', 'files');

type StoredPhoto = {
  body: Blob | ArrayBuffer;
  contentType: string;
  cacheControl: string;
};

function isNetlifyRuntime() {
  return Boolean(process.env.NETLIFY || process.env.NETLIFY_SITE_ID);
}

function getLocalFilePath(key: string) {
  return path.join(LOCAL_STORAGE_DIRECTORY, key);
}

function getLocalMetadataPath(key: string) {
  return `${getLocalFilePath(key)}.meta.json`;
}

async function ensureLocalStorageDirectory(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function uploadPhoto(key: string, file: File) {
  const contentType = file.type || 'application/octet-stream';
  const cacheControl = 'public, max-age=86400';

  if (isNetlifyRuntime()) {
    await getStore(FILE_STORE_NAME).set(key, file, {
      metadata: {
        contentType,
        cacheControl,
      },
    });
    return;
  }

  const filePath = getLocalFilePath(key);
  const metadataPath = getLocalMetadataPath(key);
  const buffer = Buffer.from(await file.arrayBuffer());

  await ensureLocalStorageDirectory(filePath);
  await fs.writeFile(filePath, buffer);
  await fs.writeFile(
    metadataPath,
    JSON.stringify({ contentType, cacheControl }, null, 2),
  );
}

export async function getPhoto(key: string): Promise<StoredPhoto | null> {
  if (isNetlifyRuntime()) {
    const entry = await getStore(FILE_STORE_NAME).getWithMetadata(key, {
      type: 'blob',
    });

    if (!entry) {
      return null;
    }

    return {
      body: entry.data,
      contentType:
        typeof entry.metadata?.contentType === 'string'
          ? entry.metadata.contentType
          : 'application/octet-stream',
      cacheControl:
        typeof entry.metadata?.cacheControl === 'string'
          ? entry.metadata.cacheControl
          : 'public, max-age=86400',
    };
  }

  const filePath = getLocalFilePath(key);
  const metadataPath = getLocalMetadataPath(key);

  try {
    const [buffer, metadataContent] = await Promise.all([
      fs.readFile(filePath),
      fs.readFile(metadataPath, 'utf8'),
    ]);
    const metadata = JSON.parse(metadataContent) as {
      contentType?: string;
      cacheControl?: string;
    };

    return {
      body: buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ),
      contentType: metadata.contentType || 'application/octet-stream',
      cacheControl: metadata.cacheControl || 'public, max-age=86400',
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}
