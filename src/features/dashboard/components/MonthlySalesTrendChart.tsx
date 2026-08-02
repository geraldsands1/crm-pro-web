import { Box, Card, CardContent, Tooltip, Typography } from '@mui/material';

import { EmptyState } from '../../../components/feedback/EmptyState';
import { formatCurrency } from '../../../lib/format';
import type { MonthlySalesTrendPoint } from '../types';

/**
 * A lightweight, dependency-free monthly sales bar chart. The project has no
 * charting library, so this uses plain MUI boxes: one bar per month, height
 * proportional to that month's sales, with the exact figure in a tooltip.
 */
export function MonthlySalesTrendChart({
  months,
}: {
  months: readonly MonthlySalesTrendPoint[];
}) {
  const total = months.reduce((sum, m) => sum + m.sales, 0);

  if (months.length === 0 || total === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            title="No sales yet"
            description="Sales for the last 12 months will appear here."
          />
        </CardContent>
      </Card>
    );
  }

  const peak = Math.max(...months.map((m) => m.sales));
  const max = Math.max(peak, 1);

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
            height: 200,
          }}
        >
          {months.map((m) => {
            const heightPct = m.sales > 0 ? Math.max((m.sales / max) * 100, 2) : 0;
            return (
              <Box
                key={m.month}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                }}
              >
                <Tooltip title={`${m.label}: ${formatCurrency(m.sales)}`} arrow>
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: 36,
                      height: `${heightPct}%`,
                      minHeight: m.sales > 0 ? 4 : 0,
                      bgcolor: 'primary.main',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.2s ease',
                    }}
                  />
                </Tooltip>
              </Box>
            );
          })}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          {months.map((m) => (
            <Typography
              key={m.month}
              variant="caption"
              color="text.secondary"
              sx={{
                flex: 1,
                minWidth: 0,
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {m.label.split(' ')[0]}
            </Typography>
          ))}
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 1.5 }}
        >
          {`Peak month: ${formatCurrency(peak)}`}
        </Typography>
      </CardContent>
    </Card>
  );
}
