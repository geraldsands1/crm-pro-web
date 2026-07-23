import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { ApiError } from '../../../lib/api/types';
import { agentsApi } from '../api/agentsApi';
import { agentKeys } from '../api/agentKeys';
import type { Agent } from '../types';

interface UseAgentsOptions {
  /**
   * Skip the request entirely. Used by the customer form, which offers
   * the agent picker only to admins — `GET /agents` is admin-only, so
   * firing it from an agent session guarantees a 403.
   */
  enabled?: boolean;
}

/**
 * The full agent collection, cached once.
 *
 * Every consumer — the list page, the customer form's picker — reads
 * this same query, so switching between them costs no extra request and
 * a mutation anywhere refreshes all of them together.
 *
 * A 403 is not retried — that is the client-wide default in AppProviders
 * — because an agent session will never be allowed through.
 */
export function useAgents(
  options: UseAgentsOptions = {},
): UseQueryResult<Agent[], ApiError> {
  return useQuery<Agent[], ApiError>({
    queryKey: agentKeys.list(),
    queryFn: () => agentsApi.getAll(),
    enabled: options.enabled ?? true,
  });
}
