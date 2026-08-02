import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { ApiError } from '../../../lib/api/types';
import { agentsApi } from '../api/agentsApi';
import { agentKeys } from '../api/agentKeys';
import type { AgentReport } from '../types';

/**
 * One agent's detailed performance report (admin only).
 *
 * `GET /agents/:id/report` — sales from the agent's assigned customers,
 * commission read from the ledger, latest payments, and assigned customers.
 * A missing/non-agent id returns 404 (surfaced as an `ApiError`). The query
 * is disabled until an id is present so a blank route param never fires it.
 */
export function useAgentReport(
  agentId: string,
): UseQueryResult<AgentReport, ApiError> {
  return useQuery<AgentReport, ApiError>({
    queryKey: agentKeys.report(agentId),
    queryFn: () => agentsApi.getReport(agentId),
    enabled: agentId.length > 0,
  });
}
