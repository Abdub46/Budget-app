import type { Metadata } from 'next';
import AssistantClient from '@/components/assistant/AssistantClient';

export const metadata: Metadata = { title: 'AI Financial Assistant' };

export default function AssistantPage() {
  return <AssistantClient />;
}
