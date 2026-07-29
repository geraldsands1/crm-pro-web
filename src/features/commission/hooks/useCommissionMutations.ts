import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';

import { ApiError } from '../../../lib/api/types';
import { commissionApi } from '../api/commissionApi';
import { commissionKeys } from '../api/commissionKeys';
import type { CommissionEntry } from '../types';

/**
 * Mark a Pending commission as Paid.
 *
 * On success it invalidates the whole `['commission']` feature, so both the
 * summary cards and the ledger table refetch and agree — the figures are
 * SQL aggregates, so the only way to know the new Pending/Paid split is to
 * ask the server, not to patch the cache by hand.
 */
export function useMarkCommissionPaid(): UseMutationResult<
  CommissionEntry,
  ApiError,
  string
> {
  const queryClient = useQueryClient();

  return useMutation<CommissionEntry, ApiError, string>({
    mutationFn: (id) => commissionApi.markPaid(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commissionKeys.all });
    },
  });
}
