import { useMemo } from 'react';
import { Typography } from '@mui/material';

import { DataTable } from '../../../components/data/DataTable';
import type { DataTableColumn } from '../../../components/data/DataTable';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { formatDate, orDash } from '../../../lib/format';
import { CustomerStatusChip } from '../../customers/components/CustomerStatusChip';
import type { RecentCustomer } from '../types';

/** The most recently added customers, over the shared DataTable. */
export function RecentCustomersTable({
  rows,
}: {
  rows: readonly RecentCustomer[];
}) {
  const columns = useMemo<readonly DataTableColumn<RecentCustomer>[]>(
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
        id: 'mobile',
        label: 'Mobile',
        hideBelow: 'sm',
        render: (r) => orDash(r.phone),
      },
      {
        id: 'status',
        label: 'Status',
        render: (r) => <CustomerStatusChip status={r.status} />,
      },
      {
        id: 'date',
        label: 'Date',
        hideBelow: 'sm',
        render: (r) => formatDate(r.createdAt),
      },
    ],
    [],
  );

  return (
    <DataTable<RecentCustomer>
      columns={columns}
      rows={rows}
      getRowKey={(r) => r.id}
      emptyState={<EmptyState title="No recent customers" />}
    />
  );
}
