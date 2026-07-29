import { Chip } from '@mui/material';

interface CommissionStatusChipProps {
  status: string;
}

type ChipColor = 'default' | 'success' | 'warning';

/**
 * Colours a commission's payout status. Same approach as CustomerStatusChip:
 * matching is case-insensitive, and an unrecognised value falls back to a
 * neutral chip showing the raw string rather than being hidden.
 */
const STATUS_COLORS: Record<string, ChipColor> = {
  pending: 'warning',
  paid: 'success',
};

export function CommissionStatusChip({ status }: CommissionStatusChipProps) {
  const normalized = status.trim().toLowerCase();
  const color = STATUS_COLORS[normalized] ?? 'default';

  return (
    <Chip
      size="small"
      color={color}
      variant={color === 'default' ? 'outlined' : 'filled'}
      label={status.trim() === '' ? 'Unknown' : status}
      sx={{ textTransform: 'capitalize' }}
    />
  );
}
