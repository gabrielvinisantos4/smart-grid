import { QUOTE_STATUS_LABELS, type QuoteStatus } from '@shared/types';
import { Badge } from './ui';

const tone: Record<QuoteStatus, 'neutral' | 'positive' | 'muted' | 'warning'> = {
  new: 'warning',
  contacted: 'neutral',
  won: 'positive',
  lost: 'muted',
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return <Badge tone={tone[status]}>{QUOTE_STATUS_LABELS[status]}</Badge>;
}
