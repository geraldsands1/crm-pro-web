import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import ErrorIcon from '@mui/icons-material/ReportProblemOutlined';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

/**
 * Last line of defence against a render-time crash.
 *
 * Everything else in this app handles *request* failures — this handles
 * the case where a component throws while rendering. Without it React 19
 * unmounts the entire tree, leaving a blank white page with no
 * explanation and no way back except the browser's reload button.
 *
 * Still a class component: `getDerivedStateFromError` and
 * `componentDidCatch` have no hook equivalent, and React provides no
 * function-component error boundary.
 *
 * Recovery is a full reload rather than clearing the flag. Whatever state
 * produced the crash is still in memory, so re-rendering the same tree
 * would usually just throw again; a reload is the honest reset.
 */
export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  override state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // The one deliberate console call in the app. A crash that leaves no
    // trace is far worse to diagnose than a logged one, and this is
    // exactly where an error-reporting service would be wired in.
    console.error('Unhandled render error:', error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Card sx={{ maxWidth: 480, width: '100%' }}>
          <CardContent>
            <Stack
              spacing={2}
              sx={{ alignItems: 'center', textAlign: 'center', py: 4 }}
            >
              <Box sx={{ color: 'text.disabled' }}>
                <ErrorIcon fontSize="large" />
              </Box>
              <Typography variant="h6" component="h1">
                Something went wrong
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The page could not be displayed. Reloading usually clears
                it. If it keeps happening, please report it.
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  window.location.reload();
                }}
              >
                Reload
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }
}
