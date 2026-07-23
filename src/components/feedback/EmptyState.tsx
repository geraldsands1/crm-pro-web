import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import InboxIcon from '@mui/icons-material/InboxOutlined';

interface EmptyStateProps {
  title: string;
  description?: string;
  /** Optional call to action, e.g. "Add Customer". */
  action?: ReactNode;
}

/**
 * "There is nothing here" — distinct from a loading state (data may still
 * be coming) and from an error (something went wrong). Conflating the
 * three is what makes a UI feel broken when it is merely empty.
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Stack spacing={1.5} sx={{ alignItems: 'center', textAlign: 'center' }}>
      <Box sx={{ color: 'text.disabled' }}>
        <InboxIcon fontSize="large" />
      </Box>
      <Typography variant="h6" component="p">
        {title}
      </Typography>
      {description ? (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      ) : null}
      {action ? <Box sx={{ pt: 1 }}>{action}</Box> : null}
    </Stack>
  );
}
