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

// Built once at module scope rather than per render — constructing an
// Intl formatter is comparatively expensive and these never change.
export function DashboardPage() {
  const { user } = useAuth();
  const { data, isPending, isError, error, refetch } = useDashboardStats();

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
    </Stack>
  );
}
