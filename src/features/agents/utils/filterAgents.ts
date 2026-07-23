import { collator } from '../../../lib/collection/collator';
import type { Agent, AgentSort } from '../types';

/**
 * Client-side search across name, email and phone.
 *
 * `GET /api/agents` accepts no query parameters at all, so filtering has
 * to happen here. It is applied to the complete cached collection rather
 * than to one page, so a match on the last agent is still found from the
 * first page.
 */
export function filterAgents(
  agents: readonly Agent[],
  search: string,
): Agent[] {
  const term = search.trim().toLowerCase();
  if (term === '') return [...agents];

  return agents.filter((agent) => {
    const haystack = [agent.full_name, agent.email, agent.phone ?? '']
      .join(' ')
      .toLowerCase();

    return haystack.includes(term);
  });
}

function valueFor(agent: Agent, field: AgentSort['field']): string {
  switch (field) {
    case 'name':
      return agent.full_name;
    case 'email':
      return agent.email;
    case 'status':
      // Sorts the two groups apart; the label is what the user sees.
      return agent.is_active ? 'active' : 'inactive';
    case 'created':
      // ISO-8601 sorts correctly as a string, so no Date parsing is
      // needed and an unparseable value cannot become NaN.
      return agent.created_at;
  }
}

/**
 * Returns a sorted copy — never mutates, which would corrupt the array
 * React Query is caching.
 */
export function sortAgents(
  agents: readonly Agent[],
  sort: AgentSort,
): Agent[] {
  const direction = sort.direction === 'asc' ? 1 : -1;

  return [...agents].sort(
    (a, b) =>
      collator.compare(valueFor(a, sort.field), valueFor(b, sort.field)) *
      direction,
  );
}
