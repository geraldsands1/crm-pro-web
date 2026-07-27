import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';

import { ApiError } from '../../../lib/api/types';
import { paymentsApi } from '../api/paymentsApi';
import { paymentKeys } from '../api/paymentKeys';
import { customerKeys } from '../../customers/api/customerKeys';
import { agentKeys } from '../../agents/api/agentKeys';
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
  // Customer payment history (Customer Details tab).
  void queryClient.invalidateQueries({
    queryKey: paymentKeys.history(customerId),
  });
  // Standalone Payments page + its per-customer totals: a payment recorded
  // or deleted from the Customer Details tab must show there immediately
  // too, without a refresh.
  void queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
  // Customer balance and VIP status on the details header.
  void queryClient.invalidateQueries({
    queryKey: customerKeys.detail(customerId),
  });
  // VIP badge in the customer list.
  void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
  // Dashboard revenue / today's payments.
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  // RC2.8: agent commission stats + history (Agent Edit page + the agent's
  // own Dashboard) — a payment changes the assigned agent's totals.
  void queryClient.invalidateQueries({ queryKey: agentKeys.commissions() });
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

/**
 * List-level variants for the standalone Payments page, where the affected
 * customer differs per row rather than being fixed by the surrounding
 * screen. They invalidate the whole payments and customers features (plus
 * the dashboard) rather than one customer's keys.
 */
function invalidateAll(
  queryClient: ReturnType<typeof useQueryClient>,
): void {
  void queryClient.invalidateQueries({ queryKey: paymentKeys.all });
  void queryClient.invalidateQueries({ queryKey: customerKeys.all });
  void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  // RC2.8: agent commission stats + history.
  void queryClient.invalidateQueries({ queryKey: agentKeys.commissions() });
}

export function useRecordPayment(): UseMutationResult<
  CreatePaymentResult,
  ApiError,
  CreatePaymentInput
> {
  const queryClient = useQueryClient();

  return useMutation<CreatePaymentResult, ApiError, CreatePaymentInput>({
    mutationFn: (input) => paymentsApi.create(input),
    onSuccess: () => {
      invalidateAll(queryClient);
    },
  });
}

export function useRemovePayment(): UseMutationResult<void, ApiError, string> {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) => paymentsApi.remove(id),
    onSuccess: () => {
      invalidateAll(queryClient);
    },
  });
}
