import { Box, Card, CardContent, Skeleton, Typography } from '@mui/material';

import { formatCurrency, formatDate } from '../../../lib/format';
import type { PaymentSummary } from '../../payments/types';

interface CustomerProfileSummaryProps {
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
 * The payment figures shown at the top of a customer's profile:
 * Outstanding Balance, Lifetime Payments and Last Payment.
 *
 * "Outstanding Balance" is always "Not tracked" — this CRM records
 * payments received but no amount owed (no invoices/charges), so there is
 * no figure to compute and none is invented. Lifetime Payments and Last
 * Payment come straight from the backend's SQL summary, never summed on
 * the client. Mirrors the visual style of PaymentSummaryCards.
 */
export function CustomerProfileSummary({
  summary,
  isLoading,
}: CustomerProfileSummaryProps) {
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

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
      }}
    >
      <SummaryCard label="Outstanding Balance" value="Not tracked" />
      <SummaryCard
        label="Lifetime Payments"
        value={formatCurrency(summary?.total_paid ?? 0)}
      />
      <SummaryCard
        label="Last Payment"
        value={formatDate(summary?.last_payment_at ?? null, 'None yet')}
      />
    </Box>
  );
}
