import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Button, Typography } from '@mui/material';

import { DataTable } from '../../../components/data/DataTable';
import type { DataTableColumn } from '../../../components/data/DataTable';
import {
  formatCurrency,
  formatDate,
  formatNumber,
  orDash,
} from '../../../lib/format';
import { CommissionStatusChip } from './CommissionStatusChip';
import type { CommissionEntry } from '../types';

interface CommissionTableProps {
  entries: readonly CommissionEntry[];
  isLoading: boolean;
  emptyState: ReactNode;
  /** Admin-only: renders the Agent column and the Mark Paid action. */
  isAdmin: boolean;
  /** Id of the entry currently being marked paid, to disable its button. */
  payingId: string | null;
  onMarkPaid: (entry: CommissionEntry) => void;
}

/**
 * The commission ledger table over the shared DataTable, so skeleton, empty
 * body and layout match the customer/payment/agent tables.
 *
 * The Agent column and the Mark Paid action render for admins only. Mark Paid
 * appears only on Pending rows (a Paid row shows a dash) — hiding it for
 * agents is presentation; the backend rejects an agent's PATCH regardless.
 */
export function CommissionTable({
  entries,
  isLoading,
  emptyState,
  isAdmin,
  payingId,
  onMarkPaid,
}: CommissionTableProps) {
  const columns = useMemo<readonly DataTableColumn<CommissionEntry>[]>(() => {
    const cols: DataTableColumn<CommissionEntry>[] = [
      {
        id: 'created_at',
        label: 'Date',
        render: (row) => formatDate(row.created_at),
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
    ];

    if (isAdmin) {
      cols.push({
        id: 'agent',
        label: 'Agent',
        hideBelow: 'md',
        render: (row) => orDash(row.agent_name),
      });
    }

    cols.push(
      {
        id: 'payment_amount',
        label: 'Payment',
        align: 'right',
        hideBelow: 'sm',
        render: (row) => formatCurrency(row.payment_amount),
      },
      {
        id: 'commission_rate',
        label: 'Rate',
        align: 'right',
        hideBelow: 'md',
        render: (row) => `${formatNumber(row.commission_rate)}%`,
      },
      {
        id: 'commission_amount',
        label: 'Commission',
        align: 'right',
        render: (row) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {formatCurrency(row.commission_amount)}
          </Typography>
        ),
      },
      {
        id: 'status',
        label: 'Status',
        render: (row) => <CommissionStatusChip status={row.status} />,
      },
      {
        id: 'paid_at',
        label: 'Paid On',
        hideBelow: 'lg',
        render: (row) => formatDate(row.paid_at),
      },
    );

    if (isAdmin) {
      cols.push({
        id: 'actions',
        label: 'Actions',
        align: 'right',
        width: 130,
        render: (row) =>
          row.status.trim().toLowerCase() === 'pending' ? (
            <Button
              size="small"
              variant="outlined"
              disabled={payingId === row.id}
              onClick={() => {
                onMarkPaid(row);
              }}
            >
              {payingId === row.id ? 'Saving…' : 'Mark Paid'}
            </Button>
          ) : (
            '—'
          ),
      });
    }

    return cols;
  }, [isAdmin, payingId, onMarkPaid]);

  return (
    <DataTable<CommissionEntry>
      columns={columns}
      rows={entries}
      getRowKey={(row) => row.id}
      isLoading={isLoading}
      emptyState={emptyState}
    />
  );
}
