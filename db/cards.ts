import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getStore } from '@netlify/blobs';
import type { CardRecord, CardStatus, NewCardRecord } from './schema';

const CARD_RECORD_STORE = 'cardmint-records';
const LOCAL_DATA_DIRECTORY = path.join(process.cwd(), '.local-data');
const LOCAL_CARD_FILE = path.join(LOCAL_DATA_DIRECTORY, 'cards.json');

function isNetlifyRuntime() {
  return Boolean(process.env.NETLIFY || process.env.NETLIFY_SITE_ID);
}

function getNetlifyStore(name: string) {
  const siteID =
    process.env.NETLIFY_BLOBS_SITE_ID || process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;

  if (siteID && token) {
    return getStore(name, { siteID, token });
  }

  return getStore(name);
}

function getCardKey(id: string) {
  return `cards/${id}.json`;
}

async function ensureLocalDataDirectory() {
  await fs.mkdir(LOCAL_DATA_DIRECTORY, { recursive: true });
}

async function readLocalCards() {
  await ensureLocalDataDirectory();

  try {
    const content = await fs.readFile(LOCAL_CARD_FILE, 'utf8');
    return JSON.parse(content) as CardRecord[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

async function writeLocalCards(cards: CardRecord[]) {
  await ensureLocalDataDirectory();
  await fs.writeFile(LOCAL_CARD_FILE, JSON.stringify(cards, null, 2));
}

function sortCards(cards: CardRecord[]) {
  return cards.sort((left, right) => right.createdAt - left.createdAt);
}

export async function listCards() {
  if (isNetlifyRuntime()) {
    const store = getNetlifyStore(CARD_RECORD_STORE);
    const { blobs } = await store.list({ prefix: 'cards/' });

    const cards = await Promise.all(
      blobs.map(async ({ key }) => {
        const record = await store.get(key, { type: 'json' });
        return record as CardRecord | null;
      }),
    );

    return sortCards(cards.filter((record): record is CardRecord => Boolean(record)));
  }

  return sortCards(await readLocalCards());
}

export async function getCard(id: string) {
  if (isNetlifyRuntime()) {
    const record = await getNetlifyStore(CARD_RECORD_STORE).get(getCardKey(id), {
      type: 'json',
    });

    return (record as CardRecord | null) ?? null;
  }

  const cards = await readLocalCards();
  return cards.find((record) => record.id === id) ?? null;
}

export async function createCard(input: NewCardRecord) {
  if (isNetlifyRuntime()) {
    await getNetlifyStore(CARD_RECORD_STORE).set(
      getCardKey(input.id),
      JSON.stringify(input),
    );
    return;
  }

  const cards = await readLocalCards();
  cards.push(input);
  await writeLocalCards(cards);
}

export async function updateCardStatus(id: string, status: CardStatus) {
  if (isNetlifyRuntime()) {
    const existing = await getCard(id);

    if (!existing) {
      return;
    }

    const updated = {
      ...existing,
      status,
      updatedAt: Date.now(),
    };

    await getNetlifyStore(CARD_RECORD_STORE).set(
      getCardKey(id),
      JSON.stringify(updated),
    );
    return;
  }

  const cards = await readLocalCards();
  const nextCards = cards.map((card) =>
    card.id === id ? { ...card, status, updatedAt: Date.now() } : card,
  );
  await writeLocalCards(nextCards);
}
