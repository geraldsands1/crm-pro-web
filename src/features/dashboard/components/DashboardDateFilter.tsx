import {
  Box,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';

import type { DateRange, DateRangePreset } from '../types';
import { presetRange } from '../utils/dateRange';

const PRESETS: readonly { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this-week', label: 'This Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'this-year', label: 'This Year' },
  { value: 'last-12-months', label: 'Last 12 Months' },
  { value: 'custom', label: 'Custom' },
];

interface DashboardDateFilterProps {
  preset: DateRangePreset;
  range: DateRange;
  onChange: (preset: DateRangePreset, range: DateRange) => void;
}

/**
 * The dashboard date filter: preset buttons plus, when Custom is chosen, two
 * date inputs. Every preset resolves to a concrete inclusive range that the
 * page passes to the admin dashboard queries.
 */
export function DashboardDateFilter({
  preset,
  range,
  onChange,
}: DashboardDateFilterProps) {
  const handlePreset = (
    _e: React.MouseEvent<HTMLElement>,
    next: DateRangePreset | null,
  ): void => {
    if (!next) return; // ignore de-selection; one option is always active
    if (next === 'custom') {
      // Keep the current range as the editable starting point.
      onChange('custom', range);
    } else {
      onChange(next, presetRange(next));
    }
  };

  const handleFrom = (value: string): void => {
    if (!value) return;
    // Never let `from` exceed `to`.
    const nextTo = value > range.to ? value : range.to;
    onChange('custom', { from: value, to: nextTo });
  };

  const handleTo = (value: string): void => {
    if (!value) return;
    const nextFrom = value < range.from ? value : range.from;
    onChange('custom', { from: nextFrom, to: value });
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', md: 'center' } }}
      >
        <ToggleButtonGroup
          value={preset}
          exclusive
          onChange={handlePreset}
          size="small"
          color="primary"
          sx={{ flexWrap: 'wrap' }}
          aria-label="Dashboard date range"
        >
          {PRESETS.map((p) => (
            <ToggleButton key={p.value} value={p.value}>
              {p.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {preset === 'custom' ? (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <TextField
              label="From"
              type="date"
              size="small"
              value={range.from}
              onChange={(e) => handleFrom(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="To"
              type="date"
              size="small"
              value={range.to}
              onChange={(e) => handleTo(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {`${range.from} → ${range.to}`}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
