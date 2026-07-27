import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { ApiError } from '../../../lib/api/types';
import { paymentsApi } from '../api/paymentsApi';
import { paymentKeys } from '../api/paymentKeys';
import type { PaymentsList } from '../types';

export interface PaymentsListFilters {
  /** Inclusive `paid_at` lower bound as `yyyy-MM-dd`, or null. */
  from: string | null;
  /** Inclusive `paid_at` upper bound as `yyyy-MM-dd`, or null. */
  to: string | null;
}

/**
 * The standalone Payments list's data source.
 *
 * Only the date range is sent to the server — the customer filter and the
 * free-text search are applied in the page, so changing either must not
 * refetch. The query key mirrors that: it carries the date range only.
 *
 * `placeholderData` keeps the previous rows on screen while a new date
 * range loads, so the table does not blank out between fetches.
 */
export function usePaymentsList(
  filters: PaymentsListFilters,
): UseQueryResult<PaymentsList, ApiError> {
  return useQuery<PaymentsList, ApiError>({
    queryKey: paymentKeys.list(filters),
    queryFn: () => paymentsApi.list({ from: filters.from, to: filters.to }),
    placeholderData: (previous) => previous,
  });
}
