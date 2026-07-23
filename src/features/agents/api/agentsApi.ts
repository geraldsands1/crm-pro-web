import { apiClient } from '../../../lib/api/client';
import { endpoints } from '../../../lib/api/endpoints';
import { ensureSuccess } from '../../../lib/api/envelope';
import type { ApiDataResponse, ApiEnvelope } from '../../../lib/api/types';
import type { Agent, CreateAgentInput, UpdateAgentInput } from '../types';

export const agentsApi = {
  /**
   * `GET /agents` — every agent, unpaginated and unfiltered.
   *
   * The endpoint accepts no query parameters at all, so search, sort and
   * pagination are applied client-side over this one response.
   *
   * Admin-only server-side: an agent session receives a 403, which the
   * response interceptor turns into an `ApiError` of kind `forbidden`.
   * Callers that render this optionally — the customer form's agent
   * picker — check for that rather than treating it as a hard failure.
   */
  async getAll(): Promise<Agent[]> {
    const { data } = await apiClient.get<ApiDataResponse<Agent[]>>(
      endpoints.agents.root,
    );

    ensureSuccess(data, 'Could not load agents.');
    return Array.isArray(data.data) ? data.data : [];
  },

  /**
   * `POST /agents`.
   *
   * The role is assigned by the backend, which hard-codes the agent role
   * in its INSERT — nothing is sent for it. A duplicate email comes back
   * as a 409 with a usable message, which the interceptor preserves.
   */
  async create(input: CreateAgentInput): Promise<Agent> {
    const { data } = await apiClient.post<ApiDataResponse<Agent>>(
      endpoints.agents.root,
      input,
    );

    ensureSuccess(data, 'Could not create this agent.');
    return data.data;
  },

  /**
   * `PUT /agents/:id`.
   *
   * Only the fields being changed are sent: the backend COALESCEs each
   * one, so an omitted field keeps its stored value. That is what lets
   * the same endpoint serve a full edit, a password reset, and the
   * activate/deactivate toggle without three separate routes.
   */
  async update(id: string, input: UpdateAgentInput): Promise<Agent> {
    const { data } = await apiClient.put<ApiDataResponse<Agent>>(
      endpoints.agents.byId(id),
      input,
    );

    ensureSuccess(data, 'Could not save this agent.');
    return data.data;
  },

  /** `DELETE /agents/:id` — a hard delete, admin only. */
  async remove(id: string): Promise<void> {
    const { data } = await apiClient.delete<ApiEnvelope>(
      endpoints.agents.byId(id),
    );

    ensureSuccess(data, 'Could not delete this agent.');
  },
};
