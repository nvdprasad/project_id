import { IdCardStudio } from './id-card-studio';
import { listCards } from '@/db/cards';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const cards = await listCards();

  return <IdCardStudio initialCards={cards} />;
}
