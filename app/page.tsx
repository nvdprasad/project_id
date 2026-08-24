import { IdCardStudio } from './id-card-studio';
import { listCards } from '@/db/cards';

export default async function Home() {
  const cards = await listCards();

  return <IdCardStudio initialCards={cards} />;
}
