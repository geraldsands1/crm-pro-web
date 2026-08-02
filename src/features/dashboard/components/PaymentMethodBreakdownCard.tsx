import {
  Box,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';

import { EmptyState } from '../../../components/feedback/EmptyState';
import { formatCurrency, formatNumber } from '../../../lib/format';
import type { PaymentMethodBreakdownItem } from '../types';

/**
 * Payment method breakdown as a dependency-free horizontal bar list: one row
 * per method with its total, count and share, and a MUI LinearProgress bar
 * sized to the percentage. Cash is excluded server-side.
 */
export function PaymentMethodBreakdownCard({
  methods,
}: {
  methods: readonly PaymentMethodBreakdownItem[];
}) {
  if (methods.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            title="No payments yet"
            description="Non-cash payments will appear here, grouped by method."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={2.5}>
          {methods.map((m) => {
            // Clamp defensively so a stray value can never overflow the bar.
            const pct = Math.min(Math.max(m.percentage, 0), 100);
            return (
              <Box key={m.method}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {m.method}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {`${formatCurrency(m.totalAmount)} · ${formatNumber(
                      m.paymentCount,
                    )} payment${m.paymentCount === 1 ? '' : 's'} · ${pct.toFixed(
                      1,
                    )}%`}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}
