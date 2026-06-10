// Server page: читає sessionId з searchParams і передає у клієнтський екран.
// Без useSearchParams → не потребує Suspense boundary при next build.

import { CrisisScreen } from '@/components/crisis/CrisisScreen';

export default async function CrisisPage({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string }>;
}) {
  const { sessionId } = await searchParams;
  return <CrisisScreen sessionId={sessionId ?? null} />;
}
