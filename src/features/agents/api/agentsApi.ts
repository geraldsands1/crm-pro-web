import { apiClient } from '../../../lib/api/client';
import { endpoints } from '../../../lib/api/endpoints';
import { ensureSuccess } from '../../../lib/api/envelope';
import type { ApiDataResponse, ApiEnvelope } from '../../../lib/api/types';
import type {
  Agent,
  AgentCommissionStats,
  AgentReport,
  AgentReportCustomer,
  AgentReportPayment,
  CreateAgentInput,
  UpdateAgentInput,
} from '../types';

/** Coerce NUMERIC-as-string / missing values to a finite number. */
function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function nullableStr(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function parseReportPayment(raw: unknown): AgentReportPayment {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: str(r.id),
    customerName: str(r.customerName) || 'Unknown',
    amount: toNumber(r.amount),
    method: nullableStr(r.method),
    source: str(r.source) || 'CRM',
    paidAt: str(r.paidAt),
  };
}

function parseReportCustomer(raw: unknown): AgentReportCustomer {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: str(r.id),
    name: str(r.name) || 'Unknown',
    phone: nullableStr(r.phone),
    email: nullableStr(r.email),
    status: str(r.status),
    createdAt: str(r.createdAt),
    totalPaid: toNumber(r.totalPaid),
  };
}

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

  /**
   * `GET /agents/:id/commission` — RC2.8 commission statistics.
   *
   * An admin may request any agent; an agent only their own (a 403
   * otherwise, surfaced as an `ApiError` of kind `forbidden`). The
   * figures are computed server-side in SQL.
   */
  async getCommission(id: string): Promise<AgentCommissionStats> {
    const { data } = await apiClient.get<ApiDataResponse<AgentCommissionStats>>(
      endpoints.agents.commission(id),
    );

    ensureSuccess(data, 'Could not load commission statistics.');
    return data.data;
  },

  /**
   * `GET /agents/:id/report` — the admin-only detailed report for one agent.
   *
   * A missing or non-agent id returns 404, which the interceptor turns into
   * an `ApiError` of kind `notFound`. Numeric fields are coerced defensively
   * (NUMERIC aggregates arrive as strings).
   */
  async getReport(id: string): Promise<AgentReport> {
    const { data } = await apiClient.get<
      ApiDataResponse<Record<string, unknown>>
    >(endpoints.agents.report(id));

    ensureSuccess(data, 'Could not load the agent report.');

    const d = data.data;
    const agent = (d.agent ?? {}) as Record<string, unknown>;
    const summary = (d.summary ?? {}) as Record<string, unknown>;

    return {
      agent: {
        id: str(agent.id),
        name: str(agent.name) || 'Unknown',
        email: str(agent.email),
        isActive: Boolean(agent.isActive),
      },
      summary: {
        assignedCustomers: toNumber(summary.assignedCustomers),
        totalSales: toNumber(summary.totalSales),
        thisMonthSales: toNumber(summary.thisMonthSales),
        totalCommission: toNumber(summary.totalCommission),
        pendingCommission: toNumber(summary.pendingCommission),
        paidCommission: toNumber(summary.paidCommission),
      },
      recentPayments: Array.isArray(d.recentPayments)
        ? d.recentPayments.map(parseReportPayment)
        : [],
      customers: Array.isArray(d.customers)
        ? d.customers.map(parseReportCustomer)
        : [],
    };
  },
};
