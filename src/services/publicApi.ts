import type { PublicSitePayload, QuoteRequestInput, QuoteRequestResult } from '@shared/types';
import { http } from './http';

export const publicApi = {
  getSite: () => http.get<PublicSitePayload>('/api/public/site'),
  requestQuote: (input: QuoteRequestInput & { website?: string }) =>
    http.post<QuoteRequestResult>('/api/public/quotes', input as unknown as Record<string, unknown>),
};
