import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';

interface StatCardProps {
  label: string;
  value: string;
  icon: SvgIconComponent;
  /** Tints the icon chip so related figures read as a group. */
  tone?: 'primary' | 'secondary' | 'success' | 'warning';
}

/**
 * One headline figure.
 *
 * Presentational only — it receives an already-formatted string, so
 * currency and number formatting live at the page level and this
 * component never has to know which of its figures is money.
 */
export function StatCard({ label, value, icon: Icon, tone = 'primary' }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: `${tone}.main`,
              color: `${tone}.contrastText`,
              flexShrink: 0,
            }}
          >
            <Icon fontSize="small" />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" noWrap>
              {label}
            </Typography>
            <Typography variant="h5" component="p" noWrap>
              {value}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
