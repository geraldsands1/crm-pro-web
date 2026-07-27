import { useMemo } from 'react';
import { Typography } from '@mui/material';

import { DataTable } from '../../../components/data/DataTable';
import type { DataTableColumn } from '../../../components/data/DataTable';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { formatCurrency, formatDate, formatNumber, orDash } from '../../../lib/format';
import type { CommissionHistoryRow } from '../types';

interface CommissionHistoryTableProps {
  history: readonly CommissionHistoryRow[];
  isLoading: boolean;
}

/**
 * The RC2.8 Commission History table — reused by the Agent Edit page
 * (admin) and the agent's own Dashboard, so both render an identical view
 * over the same server data (newest first). Every column is a frozen
 * snapshot taken at payment time; nothing is recomputed here.
 */
export function CommissionHistoryTable({
  history,
  isLoading,
}: CommissionHistoryTableProps) {
  const columns = useMemo<readonly DataTableColumn<CommissionHistoryRow>[]>(
    () => [
      {
        id: 'paid_at',
        label: 'Payment Date',
        render: (row) => formatDate(row.paid_at),
      },
      {
        id: 'customer',
        label: 'Customer',
        render: (row) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {orDash(row.customer_name)}
          </Typography>
        ),
      },
      {
        id: 'amount',
        label: 'Payment Amount',
        align: 'right',
        render: (row) => formatCurrency(row.amount),
      },
      {
        id: 'commission_rate',
        label: 'Commission %',
        align: 'right',
        hideBelow: 'sm',
        render: (row) =>
          row.commission_rate === null
            ? '—'
            : `${formatNumber(row.commission_rate)}%`,
      },
      {
        id: 'commission_amount',
        label: 'Commission Earned',
        align: 'right',
        render: (row) =>
          row.commission_amount === null
            ? '—'
            : formatCurrency(row.commission_amount),
      },
    ],
    [],
  );

  return (
    <DataTable<CommissionHistoryRow>
      columns={columns}
      rows={history}
      getRowKey={(row) => row.id}
      isLoading={isLoading}
      emptyState={
        <EmptyState
          title="No commission yet"
          description="Commission appears here once a payment is recorded for an assigned customer."
        />
      }
    />
  );
}
