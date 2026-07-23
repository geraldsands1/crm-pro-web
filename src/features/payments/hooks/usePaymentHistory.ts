import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { ApiError } from '../../../lib/api/types';
import { paymentsApi } from '../api/paymentsApi';
import { paymentKeys } from '../api/paymentKeys';
import type { PaymentHistory } from '../types';

/**
 * One customer's payment history and its server-computed totals.
 *
 * `enabled` lets the Customer Details screen hold the request until the
 * Payments tab is actually opened, so simply viewing a profile does not
 * fetch a history nobody looked at.
 */
export function usePaymentHistory(
  customerId: string,
  options: { enabled?: boolean } = {},
): UseQueryResult<PaymentHistory, ApiError> {
  return useQuery<PaymentHistory, ApiError>({
    queryKey: paymentKeys.history(customerId),
    queryFn: () => paymentsApi.getHistory(customerId),
    enabled: (options.enabled ?? true) && customerId.length > 0,
  });
}
