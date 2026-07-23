import { Chip } from '@mui/material';

interface AgentStatusChipProps {
  isActive: boolean;
}

/**
 * Active / Inactive.
 *
 * A boolean column, unlike the customer status which is free-form text —
 * so this needs no fallback branch and the two chips stay separate
 * components rather than one over-generalised chip that has to know
 * about both shapes.
 */
export function AgentStatusChip({ isActive }: AgentStatusChipProps) {
  return (
    <Chip
      size="small"
      color={isActive ? 'success' : 'default'}
      variant={isActive ? 'filled' : 'outlined'}
      label={isActive ? 'Active' : 'Inactive'}
    />
  );
}
