import { env } from 'cloudflare:workers';
import { desc, eq } from 'drizzle-orm';
import { getDb } from './index';
import { cards } from './schema';

let ensureCardsTablePromise: Promise<void> | null = null;

async function ensureCardsTable() {
  if (ensureCardsTablePromise) {
    return ensureCardsTablePromise;
  }

  if (!env.DB) {
    throw new Error(
      'Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database.',
    );
  }

  ensureCardsTablePromise = env.DB
    .batch([
      env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS cards (
          id text PRIMARY KEY NOT NULL,
          full_name text NOT NULL,
          employee_id text NOT NULL,
          department text NOT NULL,
          role_title text NOT NULL,
          email text NOT NULL,
          phone text NOT NULL,
          blood_group text,
          issue_date text NOT NULL,
          expiry_date text NOT NULL,
          status text DEFAULT 'active' NOT NULL,
          accent_color text DEFAULT '#0f766e' NOT NULL,
          photo_key text,
          notes text,
          created_at integer NOT NULL,
          updated_at integer NOT NULL
        )`,
      ),
      env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_cards_status ON cards (status)',
      ),
      env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_cards_department ON cards (department)',
      ),
      env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards (created_at)',
      ),
      env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_cards_employee_id ON cards (employee_id)',
      ),
      env.DB.prepare('PRAGMA optimize'),
    ])
    .then(() => undefined)
    .catch((error) => {
      ensureCardsTablePromise = null;
      throw error;
    });

  return ensureCardsTablePromise;
}

export async function listCards() {
  await ensureCardsTable();
  return getDb().select().from(cards).orderBy(desc(cards.createdAt));
}

export async function createCard(input: typeof cards.$inferInsert) {
  await ensureCardsTable();
  await getDb().insert(cards).values(input);
}

export async function updateCardStatus(id: string, status: string) {
  await ensureCardsTable();
  await getDb()
    .update(cards)
    .set({
      status,
      updatedAt: Date.now(),
    })
    .where(eq(cards.id, id));
}
