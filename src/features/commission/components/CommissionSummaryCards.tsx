import { Box, Card, CardContent, Skeleton, Typography } from '@mui/material';

import { formatCurrency } from '../../../lib/format';
import type { CommissionSummary } from '../types';

interface CommissionSummaryCardsProps {
  summary: CommissionSummary | undefined;
  isLoading: boolean;
}

function SummaryCard({ label, value }: { label: string; value: string }) {
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

const GRID = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, 1fr)',
    md: 'repeat(3, 1fr)',
    lg: 'repeat(5, 1fr)',
  },
} as const;

/**
 * The five commission figures at the top of the page: Total Earned, Pending
 * Payout, Paid Out, This Month and Last Month. Every value comes from the
 * server's `summary` (SQL aggregates), never summed from the table rows —
 * matching PaymentSummaryCards.
 */
export function CommissionSummaryCards({
  summary,
  isLoading,
}: CommissionSummaryCardsProps) {
  if (isLoading) {
    return (
      <Box sx={GRID}>
        {Array.from({ length: 5 }, (_, index) => (
          <Card key={index}>
            <CardContent>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" height={40} />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  // No summary and not loading (e.g. the summary request failed) — omit the
  // cards rather than showing a permanent skeleton. The ledger table's own
  // PageError covers a full outage.
  if (!summary) return null;

  return (
    <Box sx={GRID}>
      <SummaryCard
        label="Total Commission Earned"
        value={formatCurrency(summary.total)}
      />
      <SummaryCard
        label="Pending Payout"
        value={formatCurrency(summary.pending)}
      />
      <SummaryCard
        label="Commission Paid Out"
        value={formatCurrency(summary.paid)}
      />
      <SummaryCard label="This Month" value={formatCurrency(summary.current_month)} />
      <SummaryCard label="Last Month" value={formatCurrency(summary.previous_month)} />
    </Box>
  );
}
