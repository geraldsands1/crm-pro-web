import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { ApiError } from '../../../lib/api/types';
import { agentsApi } from '../api/agentsApi';
import { agentKeys } from '../api/agentKeys';
import type { AgentCommissionStats } from '../types';

/**
 * One agent's commission statistics (RC2.8).
 *
 * `GET /agents/:id/commission` — an admin may request any agent, an agent
 * only their own (the server returns 403 otherwise). Used on the Agent
 * Edit page (admin) and on the agent's own Dashboard.
 */
export function useAgentCommission(
  agentId: string,
): UseQueryResult<AgentCommissionStats, ApiError> {
  return useQuery<AgentCommissionStats, ApiError>({
    queryKey: agentKeys.commission(agentId),
    queryFn: () => agentsApi.getCommission(agentId),
    enabled: agentId.length > 0,
  });
}
