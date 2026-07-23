import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';

import { ApiError } from '../../../lib/api/types';
import { customersApi } from '../api/customersApi';
import { customerKeys } from '../api/customerKeys';
import type { Customer, CustomerInput } from '../types';

/**
 * Create, update and delete, each invalidating what it actually changed.
 *
 * "Optimistic refresh" here means the cache is corrected the moment the
 * server confirms — not that the UI guesses the outcome in advance.
 * Deliberately so: a created customer's id, `created_at` and any
 * server-side defaults are only knowable from the response, and a
 * fabricated row would flicker and be replaced a moment later. Every
 * mutation returns the saved record, so the detail cache is seeded
 * directly from it and the list is invalidated to refetch in the
 * background.
 */

export function useCreateCustomer(): UseMutationResult<
  Customer,
  ApiError,
  CustomerInput
> {
  const queryClient = useQueryClient();

  return useMutation<Customer, ApiError, CustomerInput>({
    mutationFn: (input) => customersApi.create(input),
    onSuccess: (customer) => {
      // Seed the detail cache so navigating straight to the new record
      // renders immediately instead of showing a skeleton for data the
      // response already contained.
      queryClient.setQueryData(customerKeys.detail(customer.id), customer);
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useUpdateCustomer(
  id: string,
): UseMutationResult<Customer, ApiError, CustomerInput> {
  const queryClient = useQueryClient();

  return useMutation<Customer, ApiError, CustomerInput>({
    mutationFn: (input) => customersApi.update(id, input),
    onSuccess: (customer) => {
      queryClient.setQueryData(customerKeys.detail(customer.id), customer);
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useDeleteCustomer(): UseMutationResult<void, ApiError, string> {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) => customersApi.remove(id),
    onSuccess: (_result, id) => {
      // Drop rather than invalidate: the record is gone, so refetching it
      // would only produce a 404.
      queryClient.removeQueries({ queryKey: customerKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}
