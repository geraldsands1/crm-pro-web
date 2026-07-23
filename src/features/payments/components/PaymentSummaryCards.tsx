import { Alert, Box, Card, CardContent, Skeleton, Typography } from '@mui/material';

import { formatCurrency, formatDate, formatNumber } from '../../../lib/format';
import type { PaymentSummary } from '../types';

interface PaymentSummaryCardsProps {
  summary: PaymentSummary | null;
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

/**
 * Total Paid, Payment Count and Last Payment.
 *
 * Every figure comes from the backend's `summary` object and none is
 * derived from the rows in the table. That is not a stylistic choice: the
 * server computes these with SQL aggregates over the whole payments
 * table, so a client-side sum of the visible list would be a different
 * number wearing the same label the moment the history is filtered,
 * paged, or partially loaded.
 *
 * When the summary is missing — an older backend that predates it — the
 * cards say so rather than quietly substituting a figure the server never
 * produced.
 */
export function PaymentSummaryCards({
  summary,
  isLoading,
}: PaymentSummaryCardsProps) {
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
        }}
      >
        {Array.from({ length: 3 }, (_, index) => (
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

  if (!summary) {
    return (
      <Alert severity="info">
        Payment totals are not available from the server for this customer.
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
      }}
    >
      <SummaryCard
        label="Total Paid"
        value={formatCurrency(summary.total_paid)}
      />
      <SummaryCard
        label="Payment Count"
        value={formatNumber(summary.payment_count)}
      />
      <SummaryCard
        label="Last Payment"
        value={formatDate(summary.last_payment_at, 'None yet')}
      />
    </Box>
  );
}
