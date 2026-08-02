import { useMemo } from 'react';
import { Button, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { DataTable } from '../../../components/data/DataTable';
import type { DataTableColumn } from '../../../components/data/DataTable';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { agentReportPath } from '../../../app/router/routes';
import { formatCurrency, formatNumber, orDash } from '../../../lib/format';
import type { AgentPerformanceRow } from '../types';

/** The agent ranking table, over the shared DataTable. */
export function AgentRankingTable({
  rows,
}: {
  rows: readonly AgentPerformanceRow[];
}) {
  const columns = useMemo<readonly DataTableColumn<AgentPerformanceRow>[]>(
    () => [
      { id: 'rank', label: 'Rank', width: 70, render: (r) => `#${r.rank}` },
      {
        id: 'agent',
        label: 'Agent',
        render: (r) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {orDash(r.agentName)}
          </Typography>
        ),
      },
      {
        id: 'customers',
        label: 'Customers',
        align: 'right',
        hideBelow: 'sm',
        render: (r) => formatNumber(r.customerCount),
      },
      {
        id: 'total_sales',
        label: 'Total Sales',
        align: 'right',
        render: (r) => formatCurrency(r.totalSales),
      },
      {
        id: 'this_month',
        label: 'This Month Sales',
        align: 'right',
        hideBelow: 'md',
        render: (r) => formatCurrency(r.thisMonthSales),
      },
      {
        id: 'total_commission',
        label: 'Total Commission',
        align: 'right',
        hideBelow: 'md',
        render: (r) => formatCurrency(r.totalCommission),
      },
      {
        id: 'pending_commission',
        label: 'Pending Commission',
        align: 'right',
        hideBelow: 'lg',
        render: (r) => formatCurrency(r.pendingCommission),
      },
      {
        id: 'paid_commission',
        label: 'Paid Commission',
        align: 'right',
        hideBelow: 'lg',
        render: (r) => formatCurrency(r.paidCommission),
      },
      {
        id: 'actions',
        label: '',
        align: 'right',
        render: (r) => (
          <Button
            component={RouterLink}
            to={agentReportPath(r.agentId)}
            size="small"
            variant="outlined"
          >
            View Report
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable<AgentPerformanceRow>
      columns={columns}
      rows={rows}
      getRowKey={(r) => r.agentId}
      emptyState={<EmptyState title="No agents" />}
    />
  );
}
