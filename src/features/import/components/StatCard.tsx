import { Card, CardContent, Typography } from '@mui/material';

import { formatNumber } from '../../../lib/format';

export type StatTone = 'default' | 'success' | 'error' | 'warning' | 'info';

const TONE_COLOR: Record<StatTone, string> = {
  default: 'text.primary',
  success: 'success.main',
  error: 'error.main',
  warning: 'warning.main',
  info: 'info.main',
};

/** A single labelled count, styled like the app's other summary cards. */
export function StatCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: StatTone;
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" noWrap>
          {label}
        </Typography>
        <Typography
          variant="h5"
          component="p"
          sx={{ color: TONE_COLOR[tone], fontWeight: 600 }}
          noWrap
        >
          {formatNumber(value)}
        </Typography>
      </CardContent>
    </Card>
  );
}
