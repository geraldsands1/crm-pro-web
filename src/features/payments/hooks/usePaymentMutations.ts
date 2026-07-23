import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';

import { ApiError } from '../../../lib/api/types';
import { paymentsApi } from '../api/paymentsApi';
import { paymentKeys } from '../api/paymentKeys';
import { customerKeys } from '../../customers/api/customerKeys';
import type { CreatePaymentInput, CreatePaymentResult } from '../types';

/**
 * Recording and deleting payments.
 *
 * Both invalidate more than the payment history, because a payment
 * changes figures owned by other features:
 *
 *   * the customer record — a payment can flip `is_vip`, which the
 *     details header and the customer table both render;
 *   * the dashboard — Total Revenue and Today's Payments are aggregated
 *     from this same table server-side.
 *
 * Invalidating rather than patching the cache by hand: the totals are
 * computed in SQL, so the only way to know the new ones is to ask.
 */

function invalidateAffected(
  queryClient: ReturnType<typeof useQueryClient>,
  customerId: string,
): void {
  void queryClient.invalidateQueries({
    queryKey: paymentKeys.history(customerId),
  });
  void queryClient.invalidateQueries({
    queryKey: customerKeys.detail(customerId),
  });
  void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}

export function useCreatePayment(
  customerId: string,
): UseMutationResult<CreatePaymentResult, ApiError, CreatePaymentInput> {
  const queryClient = useQueryClient();

  return useMutation<CreatePaymentResult, ApiError, CreatePaymentInput>({
    mutationFn: (input) => paymentsApi.create(input),
    onSuccess: () => {
      invalidateAffected(queryClient, customerId);
    },
  });
}

export function useDeletePayment(
  customerId: string,
): UseMutationResult<void, ApiError, string> {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) => paymentsApi.remove(id),
    onSuccess: () => {
      // Note that deleting a payment does NOT revoke VIP — the backend
      // treats the badge as earned and never takes it back — so the
      // customer refresh here is about the totals, not the flag.
      invalidateAffected(queryClient, customerId);
    },
  });
}
