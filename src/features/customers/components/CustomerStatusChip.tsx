import { Chip } from '@mui/material';

interface CustomerStatusChipProps {
  status: string;
}

type ChipColor = 'default' | 'primary' | 'success' | 'warning';

/**
 * Colours a status value.
 *
 * The backend column is free-form TEXT, so an unrecognised value must
 * still render — it falls back to a neutral chip showing the raw string
 * rather than being hidden or mapped to a wrong colour. Matching is
 * case-insensitive because nothing enforces the casing on the way in.
 */
const STATUS_COLORS: Record<string, ChipColor> = {
  new: 'primary',
  active: 'success',
  pending: 'warning',
  closed: 'default',
};

export function CustomerStatusChip({ status }: CustomerStatusChipProps) {
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
