import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import ErrorIcon from '@mui/icons-material/ReportProblemOutlined';
import SearchOffIcon from '@mui/icons-material/SearchOffOutlined';
import LockIcon from '@mui/icons-material/LockOutlined';

import type { ApiError } from '../../lib/api/types';

interface PageErrorProps {
  error: ApiError;
  onRetry?: () => void;
  /** Secondary action, typically "Back to list". */
  secondaryAction?: React.ReactNode;
}

/**
 * Whole-page failure, used when a route cannot render at all.
 *
 * Chooses its icon, heading and whether to offer a retry from the error's
 * `kind` rather than showing one generic message: "not found" and
 * "permission denied" are final and a Retry button on them is a lie,
 * whereas a network or server failure genuinely may succeed on a second
 * attempt.
 */
export function PageError({ error, onRetry, secondaryAction }: PageErrorProps) {
  const isNotFound = error.status === 404;
  const isForbidden = error.kind === 'forbidden';
  const isRetryable = !isNotFound && !isForbidden;

  const Icon = isNotFound ? SearchOffIcon : isForbidden ? LockIcon : ErrorIcon;

  const title = isNotFound
    ? 'Not found'
    : isForbidden
      ? 'You do not have access'
      : 'Something went wrong';

  return (
    <Card>
      <CardContent>
        <Stack
          spacing={2}
          sx={{ alignItems: 'center', textAlign: 'center', py: 6 }}
        >
          <Box sx={{ color: 'text.disabled' }}>
            <Icon fontSize="large" />
          </Box>

          <Typography variant="h6" component="h2">
            {title}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 460 }}
          >
            {error.message}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
            {secondaryAction}
            {isRetryable && onRetry ? (
              <Button variant="contained" onClick={onRetry}>
                Try again
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
