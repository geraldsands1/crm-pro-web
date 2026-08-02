import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';
import PeopleIcon from '@mui/icons-material/PeopleAltOutlined';
import PaidIcon from '@mui/icons-material/PaidOutlined';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonthOutlined';
import PaymentsIcon from '@mui/icons-material/PaymentsOutlined';
import HourglassIcon from '@mui/icons-material/HourglassEmptyOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';

import { DataTable } from '../../../components/data/DataTable';
import type { DataTableColumn } from '../../../components/data/DataTable';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { appRoutes } from '../../../app/router/routes';
import {
  formatCurrency,
  formatDate,
  formatNumber,
  orDash,
} from '../../../lib/format';
import { StatCard } from '../../dashboard/components/StatCard';
import { CustomerStatusChip } from '../../customers/components/CustomerStatusChip';
import { AgentStatusChip } from '../components/AgentStatusChip';
import { useAgentReport } from '../hooks/useAgentReport';
import type { AgentReportCustomer, AgentReportPayment } from '../types';

export function AgentReportPage() {
  const { agentId = '' } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { data, isPending, isError, error, refetch } = useAgentReport(agentId);

  const backToDashboard = (): void => {
    void navigate(appRoutes.dashboard);
  };

  const paymentColumns = useMemo<
    readonly DataTableColumn<AgentReportPayment>[]
  >(
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
        render: (r) => orDash(r.source),
      },
      {
        id: 'paidAt',
        label: 'Paid Date',
        hideBelow: 'sm',
        render: (r) => formatDate(r.paidAt),
      },
    ],
    [],
  );

  const customerColumns = useMemo<
    readonly DataTableColumn<AgentReportCustomer>[]
  >(
    () => [
      {
        id: 'customer',
        label: 'Customer',
        render: (r) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {orDash(r.name)}
          </Typography>
        ),
      },
      {
        id: 'phone',
        label: 'Phone',
        hideBelow: 'md',
        render: (r) => orDash(r.phone),
      },
      {
        id: 'email',
        label: 'Email',
        hideBelow: 'md',
        render: (r) => orDash(r.email),
      },
      {
        id: 'status',
        label: 'Status',
        render: (r) => <CustomerStatusChip status={r.status} />,
      },
      {
        id: 'totalPaid',
        label: 'Total Paid',
        align: 'right',
        render: (r) => formatCurrency(r.totalPaid),
      },
      {
        id: 'createdAt',
        label: 'Created',
        hideBelow: 'sm',
        render: (r) => formatDate(r.createdAt),
      },
    ],
    [],
  );

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Typography variant="h5" component="h1">
              {data ? orDash(data.agent.name) : 'Agent Report'}
            </Typography>
            {data ? <AgentStatusChip isActive={data.agent.isActive} /> : null}
          </Stack>
          {data ? (
            <Typography variant="body2" color="text.secondary">
              {orDash(data.agent.email)}
            </Typography>
          ) : null}
        </Box>

        <Button startIcon={<ArrowBackIcon />} onClick={backToDashboard}>
          Back to Dashboard
        </Button>
      </Box>

      {isPending ? <LoadingState /> : null}

      {isError ? (
        <ErrorState
          title={
            error.status === 404
              ? 'Agent not found'
              : 'Could not load the agent report'
          }
          message={error.message}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      {data ? (
        <>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(3, minmax(0, 1fr))',
              },
            }}
          >
            <StatCard
              label="Assigned Customers"
              value={formatNumber(data.summary.assignedCustomers)}
              icon={PeopleIcon}
              tone="primary"
            />
            <StatCard
              label="Total Sales"
              value={formatCurrency(data.summary.totalSales)}
              icon={PaidIcon}
              tone="success"
            />
            <StatCard
              label="This Month Sales"
              value={formatCurrency(data.summary.thisMonthSales)}
              icon={CalendarMonthIcon}
              tone="primary"
            />
            <StatCard
              label="Total Commission"
              value={formatCurrency(data.summary.totalCommission)}
              icon={PaymentsIcon}
              tone="secondary"
            />
            <StatCard
              label="Pending Commission"
              value={formatCurrency(data.summary.pendingCommission)}
              icon={HourglassIcon}
              tone="warning"
            />
            <StatCard
              label="Paid Commission"
              value={formatCurrency(data.summary.paidCommission)}
              icon={CheckCircleIcon}
              tone="success"
            />
          </Box>

          <Box>
            <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
              Recent Payments
            </Typography>
            <DataTable<AgentReportPayment>
              columns={paymentColumns}
              rows={data.recentPayments}
              getRowKey={(r) => r.id}
              emptyState={<EmptyState title="No payments yet" />}
            />
          </Box>

          <Box>
            <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
              Assigned Customers
            </Typography>
            <DataTable<AgentReportCustomer>
              columns={customerColumns}
              rows={data.customers}
              getRowKey={(r) => r.id}
              emptyState={<EmptyState title="No assigned customers" />}
            />
          </Box>
        </>
      ) : null}
    </Stack>
  );
}
