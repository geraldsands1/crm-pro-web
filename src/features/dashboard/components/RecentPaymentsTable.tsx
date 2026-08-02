import { useMemo } from 'react';
import { Chip, Typography } from '@mui/material';

import { DataTable } from '../../../components/data/DataTable';
import type { DataTableColumn } from '../../../components/data/DataTable';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { formatCurrency, formatDate, orDash } from '../../../lib/format';
import type { RecentPayment } from '../types';

/** The latest payments, over the shared DataTable. Shows CRM vs IMPORTED. */
export function RecentPaymentsTable({
  rows,
}: {
  rows: readonly RecentPayment[];
}) {
  const columns = useMemo<readonly DataTableColumn<RecentPayment>[]>(
    () => [
      {
        id: 'customer',
        label: 'Customer',
        render: (r) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {orDash(r.customerName)}
          </Typography>
        ),
      },
      {
        id: 'amount',
        label: 'Amount',
        align: 'right',
        render: (r) => formatCurrency(r.amount),
      },
      {
        id: 'method',
        label: 'Method',
        hideBelow: 'sm',
        render: (r) => orDash(r.method),
      },
      {
        id: 'source',
        label: 'Source',
        render: (r) => (
          <Chip
            size="small"
            label={r.source || 'CRM'}
            color={r.source === 'IMPORTED' ? 'default' : 'primary'}
            variant={r.source === 'IMPORTED' ? 'outlined' : 'filled'}
          />
        ),
      },
      {
        id: 'date',
        label: 'Date',
        hideBelow: 'sm',
        render: (r) => formatDate(r.paidAt),
      },
    ],
    [],
  );

  return (
    <DataTable<RecentPayment>
      columns={columns}
      rows={rows}
      getRowKey={(r) => r.id}
      emptyState={<EmptyState title="No recent payments" />}
    />
  );
}
