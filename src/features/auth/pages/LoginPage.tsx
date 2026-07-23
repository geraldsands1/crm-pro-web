import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { appRoutes } from '../../../app/router/routes';
import { FullPageLoader } from '../../../components/feedback/FullPageLoader';
import { ApiError } from '../../../lib/api/types';
import { useAuth } from '../hooks/useAuth';
import { loginSchema } from '../schemas/loginSchema';
import type { LoginFormValues } from '../schemas/loginSchema';

interface LocationState {
  from?: { pathname?: string };
}

export function LoginPage() {
  const { login, isAuthenticated, isRestoringSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Server-side failures (wrong password, unreachable backend) live
  // outside React Hook Form: they are not field validation errors and
  // must not be cleared by the resolver on the next keystroke.
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Wait for the boot-time token check before deciding anything, or an
  // already-signed-in user landing on /login would see the form flash
  // before being redirected away.
  if (isRestoringSession) {
    return <FullPageLoader message="Restoring your session…" />;
  }

  if (isAuthenticated) {
    return <Navigate to={appRoutes.dashboard} replace />;
  }

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    setSubmitError(null);

    try {
      await login(values);

      // Return the user to whatever they originally asked for, falling
      // back to the dashboard. ProtectedRoute records it when it bounces
      // an unauthenticated visitor here.
      const state = location.state as LocationState | null;
      const target = state?.from?.pathname ?? appRoutes.dashboard;
      navigate(target, { replace: true });
    } catch (error) {
      // `isSubmitting` is managed by React Hook Form and resets whether
      // this resolves or throws, so the button can never stick on
      // "Signing in…".
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : 'Could not sign in right now. Please try again.',
      );
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={1} sx={{ mb: 3 }}>
            <Typography variant="h5" component="h1">
              CRM Pro
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to continue to the portal.
            </Typography>
          </Stack>

          <Box
            component="form"
            noValidate
            onSubmit={(event) => {
              void handleSubmit(onSubmit)(event);
            }}
          >
            <Stack spacing={2}>
              <TextField
                {...register('email')}
                label="Email"
                type="email"
                autoComplete="email"
                autoFocus
                fullWidth
                error={Boolean(errors.email)}
                helperText={errors.email?.message ?? ' '}
                disabled={isSubmitting}
              />

              <TextField
                {...register('password')}
                label="Password"
                type="password"
                autoComplete="current-password"
                fullWidth
                error={Boolean(errors.password)}
                helperText={errors.password?.message ?? ' '}
                disabled={isSubmitting}
              />

              {submitError ? (
                <Alert severity="error">{submitError}</Alert>
              ) : null}

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isSubmitting}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : null
                }
              >
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
