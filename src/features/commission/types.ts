/**
 * A commission ledger entry, as `GET /api/commission-ledger` returns it.
 *
 * Field names follow the wire format exactly. The amounts and the rate are
 * cast to float8 server-side, so they arrive as numbers (not the NUMERIC
 * strings node-postgres produces elsewhere); `customer_name`/`agent_name` are
 * joined in server-side for display.
 */
export interface CommissionEntry {
  id: string;
  payment_id: string;
  customer_id: string;
  agent_id: string;
  payment_amount: number;
  commission_rate: number;
  commission_amount: number;
  /** 'Pending' until an admin marks it 'Paid'. Free-form TEXT server-side. */
  status: string;
  /** Set when marked Paid; null while Pending. */
  paid_at: string | null;
  paid_by: string | null;
  created_at: string;
  customer_name: string | null;
  agent_name: string | null;
}

/**
 * The aggregate figures from `GET /api/commission-ledger/summary`, scoped the
 * same way the list is. Every value is a currency amount computed in SQL —
 * never summed from the rows on screen.
 */
export interface CommissionSummary {
  /** All commission, regardless of status. */
  total: number;
  /** Commission still awaiting payout. */
  pending: number;
  /** Commission already paid out. */
  paid: number;
  /** Commission earned in the current calendar month. */
  current_month: number;
  /** Commission earned in the previous calendar month. */
  previous_month: number;
}
