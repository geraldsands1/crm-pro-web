import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { IconButton, Tooltip, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';

import { DataTable } from '../../../components/data/DataTable';
import type { DataTableColumn } from '../../../components/data/DataTable';
import { formatCurrency, formatDate, orDash, parseNumeric } from '../../../lib/format';
import type { Payment } from '../types';

interface PaymentTableProps {
  payments: readonly Payment[];
  isLoading: boolean;
  emptyState: ReactNode;
  /** Delete is admin-only, mirroring the backend's own rule. */
  canDelete: boolean;
  onDelete: (payment: Payment) => void;
}

/**
 * The payment history table.
 *
 * Column definitions over the shared `DataTable`, so skeleton, empty body
 * and layout match the customer and agent tables for free.
 *
 * Deliberately not sortable: the backend already returns payments
 * `paid_at DESC` and there is no sort parameter, so offering column
 * sorting would either reorder one unpaginated list arbitrarily or imply
 * a server capability that does not exist. Newest-first is the one order
 * a payment history actually wants.
 */
export function PaymentTable({
  payments,
  isLoading,
  emptyState,
  canDelete,
  onDelete,
}: PaymentTableProps) {
  const columns = useMemo<readonly DataTableColumn<Payment>[]>(
    () => [
      {
        id: 'paid_at',
        label: 'Payment Date',
        render: (payment) => formatDate(payment.paid_at),
      },
      {
        id: 'amount',
        label: 'Amount',
        align: 'right',
        render: (payment) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {formatCurrency(parseNumeric(payment.amount))}
          </Typography>
        ),
      },
      {
        id: 'method',
        label: 'Method',
        render: (payment) => orDash(payment.method),
      },
      {
        id: 'note',
        label: 'Notes',
        hideBelow: 'md',
        render: (payment) => orDash(payment.note),
      },
      {
        id: 'recorded_by',
        label: 'Recorded By',
        hideBelow: 'lg',
        // Resolved server-side from the JWT at write time. Null when the
        // recording user has since been deleted, so the column degrades
        // rather than disappearing.
        render: (payment) => orDash(payment.recorded_by),
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        width: 90,
        render: (payment) =>
          canDelete ? (
            <Tooltip title="Delete payment">
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  onDelete(payment);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            '—'
          ),
      },
    ],
    [canDelete, onDelete],
  );

  return (
    <DataTable<Payment>
      columns={columns}
      rows={payments}
      getRowKey={(payment) => payment.id}
      isLoading={isLoading}
      emptyState={emptyState}
    />
  );
}
