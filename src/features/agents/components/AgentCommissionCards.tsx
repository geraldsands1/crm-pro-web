import { Alert, Box, Card, CardContent, Skeleton, Typography } from '@mui/material';

import { ApiError } from '../../../lib/api/types';
import { formatCurrency, formatNumber } from '../../../lib/format';
import type { AgentCommissionStats } from '../types';

interface AgentCommissionCardsProps {
  stats: AgentCommissionStats | undefined;
  isLoading: boolean;
  error?: ApiError | null;
  /**
   * The fifth card: 'received' (lifetime count — the admin Edit page) or
   * 'today' (payments dated today — the agent Dashboard). Defaults to
   * 'received'.
   */
  paymentsMetric?: 'received' | 'today';
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" noWrap>
          {label}
        </Typography>
        <Typography variant="h5" component="p" noWrap>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

/**
 * The five RC2.8 commission figures, as a responsive card grid. Shared by
 * the Agent Edit page (admin) and the agent's own Dashboard, so the two
 * render an identical summary. Every figure is server-computed; this only
 * formats what the API returns.
 */
export function AgentCommissionCards({
  stats,
  isLoading,
  error,
  paymentsMetric = 'received',
}: AgentCommissionCardsProps) {
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(5, 1fr)',
          },
        }}
      >
        {Array.from({ length: 5 }, (_, index) => (
          <Card key={index}>
            <CardContent>
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="text" width="50%" height={40} />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  if (error || !stats) {
    return (
      <Alert severity={error?.kind === 'forbidden' ? 'warning' : 'info'}>
        {error?.message ?? 'Commission statistics are not available.'}
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(5, 1fr)',
        },
      }}
    >
      <StatCard
        label="Commission %"
        value={`${formatNumber(stats.commission_percentage)}%`}
      />
      <StatCard label="Total Sales" value={formatCurrency(stats.total_sales)} />
      <StatCard
        label="Total Commission"
        value={formatCurrency(stats.total_commission)}
      />
      <StatCard
        label="Customers"
        value={formatNumber(stats.customer_count)}
      />
      {paymentsMetric === 'today' ? (
        <StatCard
          label="Payments Today"
          value={formatNumber(stats.payments_today)}
        />
      ) : (
        <StatCard
          label="Payments Received"
          value={formatNumber(stats.payments_received)}
        />
      )}
    </Box>
  );
}
