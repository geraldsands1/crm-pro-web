/**
 * An agent, as `GET /api/agents` returns it.
 *
 * The backend stores agents in the shared `users` table and selects them
 * by joining `roles` on `name = 'agent'`, so every record here is an
 * agent by construction — there is no role column in the payload and no
 * way for this endpoint to return an admin.
 *
 * `password_hash` is never selected by any agent query, so it has no
 * place in this type.
 */
export interface Agent {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  /** Null until the agent has signed in at least once. */
  last_login: string | null;
  created_at: string;
  updated_at: string | null;
}

/**
 * `POST /api/agents`.
 *
 * No role field: the insert hard-codes the agent role in SQL. Sending one
 * would be ignored, so the portal does not pretend to offer the choice.
 */
export interface CreateAgentInput {
  full_name: string;
  email: string;
  password: string;
  phone: string | null;
}

/**
 * `PUT /api/agents/:id`.
 *
 * Every field is optional because the backend COALESCEs each one: null
 * means "leave this column alone". Email is absent by design — the update
 * query does not touch it, so offering an email field would be a control
 * that silently does nothing.
 */
export interface UpdateAgentInput {
  full_name?: string;
  phone?: string | null;
  is_active?: boolean;
  /** Only sent when the admin is actually setting a new password. */
  password?: string;
}

export type AgentSortField = 'name' | 'email' | 'status' | 'created';

export type SortDirection = 'asc' | 'desc';

export interface AgentSort {
  field: AgentSortField;
  direction: SortDirection;
}
