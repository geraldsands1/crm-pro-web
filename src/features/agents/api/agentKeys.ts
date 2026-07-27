/**
 * Query keys for the agent module.
 *
 * `GET /api/agents` takes no parameters and returns the whole list, so
 * there is exactly one list key — searching, sorting and paging all
 * happen in memory over that single cached response and must not refetch.
 *
 *   ['agents']          → everything, for post-mutation invalidation
 *   ['agents','list']   → the one cached collection
 */
export const agentKeys = {
  all: ['agents'] as const,
  list: () => [...agentKeys.all, 'list'] as const,
  /** RC2.8: every agent's commission stats, for blanket invalidation. */
  commissions: () => [...agentKeys.all, 'commission'] as const,
  /** RC2.8: one agent's commission stats + history. */
  commission: (id: string) => [...agentKeys.commissions(), id] as const,
};
