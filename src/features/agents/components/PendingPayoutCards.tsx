import { Box, Card, CardContent, Typography } from '@mui/material';

import { formatCurrency } from '../../../lib/format';

interface PendingPayoutCardsProps {
  totalCommission: number;
}

function PayoutCard({ label, value }: { label: string; value: string }) {
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
 * RC2.8 Pending Payout — prepares the UI for a future payout module
 * without building one now.
 *
 * "Commission Paid Out" is "Not tracked" because no payout is recorded
 * yet, so Pending Payout equals the full Total Commission Earned. When a
 * payout module lands it fills in the middle figure and Pending becomes
 * (earned − paid) — no layout change required.
 */
export function PendingPayoutCards({ totalCommission }: PendingPayoutCardsProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
      }}
    >
      <PayoutCard
        label="Total Commission Earned"
        value={formatCurrency(totalCommission)}
      />
      <PayoutCard label="Commission Paid Out" value="Not tracked" />
      <PayoutCard
        label="Pending Payout"
        value={formatCurrency(totalCommission)}
      />
    </Box>
  );
}
