import type { AgentSort } from './types';

export { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, SEARCH_DEBOUNCE_MS } from '../../config/list';

/**
 * Newest first, mirroring the backend's own `ORDER BY created_at DESC` —
 * so the initial view matches what the API returned before any
 * client-side sorting is applied.
 */
export const DEFAULT_SORT: AgentSort = {
  field: 'created',
  direction: 'desc',
};
