import { apiClient } from '../../../lib/api/client';
import { endpoints } from '../../../lib/api/endpoints';
import { ensureSuccess } from '../../../lib/api/envelope';
import { parseNumeric } from '../../../lib/format';
import type { ApiEnvelope } from '../../../lib/api/types';
import type { CommissionEntry, CommissionSummary } from '../types';

interface ListResponse extends ApiEnvelope {
  count: number;
  data: unknown[];
}

interface SummaryResponse extends ApiEnvelope {
  data: Record<string, unknown> | null;
}

interface PayResponse extends ApiEnvelope {
  data: Record<string, unknown>;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function nullableStr(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/**
 * Normalises one raw ledger row. Amounts and the rate are cast to float8
 * server-side (so already numbers), but `parseNumeric` keeps this robust if a
 * NUMERIC ever comes through as a string.
 */
function parseEntry(raw: Record<string, unknown>): CommissionEntry {
  return {
    id: str(raw.id),
    payment_id: str(raw.payment_id),
    customer_id: str(raw.customer_id),
    agent_id: str(raw.agent_id),
    payment_amount: parseNumeric(raw.payment_amount as string | number | null),
    commission_rate: parseNumeric(raw.commission_rate as string | number | null),
    commission_amount: parseNumeric(
      raw.commission_amount as string | number | null,
    ),
    status: str(raw.status),
    paid_at: nullableStr(raw.paid_at),
    paid_by: nullableStr(raw.paid_by),
    created_at: str(raw.created_at),
    customer_name: nullableStr(raw.customer_name),
    agent_name: nullableStr(raw.agent_name),
  };
}

function parseSummary(raw: Record<string, unknown> | null): CommissionSummary {
  const value = raw ?? {};
  return {
    total: parseNumeric(value.total as string | number | null),
    pending: parseNumeric(value.pending as string | number | null),
    paid: parseNumeric(value.paid as string | number | null),
    current_month: parseNumeric(value.current_month as string | number | null),
    previous_month: parseNumeric(
      value.previous_month as string | number | null,
    ),
  };
}

export const commissionApi = {
  /**
   * `GET /commission-ledger` — every entry in the caller's scope, newest
   * first. The backend derives the scope from the JWT (an agent sees only
   * their own), so nothing about who-sees-what is decided here.
   */
  async list(): Promise<CommissionEntry[]> {
    const { data } = await apiClient.get<ListResponse>(
      endpoints.commissionLedger.root,
    );

    ensureSuccess(data, 'Could not load commissions.');

    return Array.isArray(data.data)
      ? data.data.map((row) => parseEntry(row as Record<string, unknown>))
      : [];
  },

  /** `GET /commission-ledger/summary` — the aggregate figures, same scope. */
  async summary(): Promise<CommissionSummary> {
    const { data } = await apiClient.get<SummaryResponse>(
      endpoints.commissionLedger.summary,
    );

    ensureSuccess(data, 'Could not load the commission summary.');

    return parseSummary(data.data);
  },

  /**
   * `PATCH /commission-ledger/:id/pay` — mark one Pending entry Paid. Admin
   * only, server-enforced; the server stamps who paid it and when from the
   * JWT, so this sends no body.
   */
  async markPaid(id: string): Promise<CommissionEntry> {
    const { data } = await apiClient.patch<PayResponse>(
      endpoints.commissionLedger.pay(id),
    );

    ensureSuccess(data, 'Could not mark this commission as paid.');

    return parseEntry(data.data);
  },
};
