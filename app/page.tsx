import { IdCardStudio } from './id-card-studio';
import type { CardRecord } from '@/db/schema';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let cards: CardRecord[] = [];

  try {
    const { listCards } = await import('@/db/cards');
    cards = await listCards();
  } catch (error) {
    console.error('Unable to load cards for homepage render.', error);
  }

  return <IdCardStudio initialCards={cards} />;
}
