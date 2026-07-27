import { Box, Stack, Typography } from '@mui/material';
import PeopleIcon from '@mui/icons-material/PeopleAltOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import PaymentsIcon from '@mui/icons-material/PaymentsOutlined';
import TodayIcon from '@mui/icons-material/TodayOutlined';
import StarIcon from '@mui/icons-material/WorkspacePremiumOutlined';

import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { useAuth } from '../../auth/hooks/useAuth';
import { formatCurrency, formatNumber } from '../../../lib/format';
import { StatCard } from '../components/StatCard';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { AgentCommissionCards } from '../../agents/components/AgentCommissionCards';
import { CommissionHistoryTable } from '../../agents/components/CommissionHistoryTable';
import { PendingPayoutCards } from '../../agents/components/PendingPayoutCards';
import { useAgentCommission } from '../../agents/hooks/useAgentCommission';

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isPending, isError, error, refetch } = useDashboardStats();

  // RC2.8: an agent sees their own commission summary here (the Agents
  // module is admin-only, so this is where they reach it). Empty id for an
  // admin, which disables the query — admins have no single "own" agent.
  const commissionQuery = useAgentCommission(
    user?.role === 'agent' ? user.id : '',
  );

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" component="h1">
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.role === 'admin'
            ? 'Organisation-wide figures.'
            : 'Figures for your own customers.'}
        </Typography>
      </Box>

      {isPending ? <LoadingState /> : null}

      {isError ? (
        <ErrorState
          title="Could not load the dashboard"
          message={error.message}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      {data ? (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            // Desktop-first: four across on a wide screen, degrading to
            // two and then one. `auto-fit` with a min track keeps the
            // cards from ever being squeezed unreadably narrow.
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
            },
          }}
        >
          <StatCard
            label="Total Customers"
            value={formatNumber(data.totalCustomers)}
            icon={PeopleIcon}
            tone="primary"
          />
          <StatCard
            label="Today's Customers"
            value={formatNumber(data.todayCustomers)}
            icon={PersonAddIcon}
            tone="secondary"
          />
          <StatCard
            label="Total Revenue"
            value={formatCurrency(data.totalRevenue)}
            icon={PaymentsIcon}
            tone="success"
          />
          <StatCard
            label="Today's Payments"
            value={formatCurrency(data.todayPayments)}
            icon={TodayIcon}
            tone="warning"
          />
          <StatCard
            label="Total VIP Customers"
            value={formatNumber(data.totalVipCustomers)}
            icon={StarIcon}
            tone="primary"
          />
        </Box>
      ) : null}

      {/* RC2.8: the signed-in agent's own commission and sales. Admins
          don't have a single "own" agent, so this is agent-only. The API
          only ever returns the caller's own data — an agent cannot request
          another's. */}
      {user?.role === 'agent' ? (
        <>
          <Box>
            <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
              My Commission
            </Typography>
            <AgentCommissionCards
              stats={commissionQuery.data}
              isLoading={commissionQuery.isPending}
              error={commissionQuery.error}
              paymentsMetric="today"
            />
          </Box>

          <Box>
            <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
              Pending Payout
            </Typography>
            <PendingPayoutCards
              totalCommission={commissionQuery.data?.total_commission ?? 0}
            />
          </Box>

          <Box>
            <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
              Commission History
            </Typography>
            <CommissionHistoryTable
              history={commissionQuery.data?.history ?? []}
              isLoading={commissionQuery.isPending}
            />
          </Box>
        </>
      ) : null}
    </Stack>
  );
}
