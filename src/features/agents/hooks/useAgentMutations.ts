import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';

import { ApiError } from '../../../lib/api/types';
import { agentsApi } from '../api/agentsApi';
import { agentKeys } from '../api/agentKeys';
import type { Agent, CreateAgentInput, UpdateAgentInput } from '../types';

/**
 * Create, update, toggle-active and delete.
 *
 * All four invalidate the single agent list key, so the table, the
 * customer form's picker and anything else reading agents refresh
 * together the moment the server confirms. Nothing guesses the outcome
 * in advance — a created agent's id and `created_at` are only knowable
 * from the response.
 */

export function useCreateAgent(): UseMutationResult<
  Agent,
  ApiError,
  CreateAgentInput
> {
  const queryClient = useQueryClient();

  return useMutation<Agent, ApiError, CreateAgentInput>({
    mutationFn: (input) => agentsApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: agentKeys.all });
    },
  });
}

export function useUpdateAgent(
  id: string,
): UseMutationResult<Agent, ApiError, UpdateAgentInput> {
  const queryClient = useQueryClient();

  return useMutation<Agent, ApiError, UpdateAgentInput>({
    mutationFn: (input) => agentsApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: agentKeys.all });
    },
  });
}

/**
 * Activate / deactivate.
 *
 * A separate hook from [useUpdateAgent] even though both call PUT: the
 * toggle is fired from a row in the table for an arbitrary agent, so the
 * id belongs in the variables rather than being bound at hook-creation
 * time. It also lets the row show its own pending state without the edit
 * form's error state bleeding into it.
 */
export function useSetAgentActive(): UseMutationResult<
  Agent,
  ApiError,
  { id: string; isActive: boolean }
> {
  const queryClient = useQueryClient();

  return useMutation<Agent, ApiError, { id: string; isActive: boolean }>({
    mutationFn: ({ id, isActive }) =>
      agentsApi.update(id, { is_active: isActive }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: agentKeys.all });
    },
  });
}

export function useDeleteAgent(): UseMutationResult<void, ApiError, string> {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) => agentsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: agentKeys.all });
      // A deleted agent may have been assigned to customers, whose rows
      // carry the joined agent name. Refreshing those keeps a stale name
      // from lingering in the customer table.
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}
