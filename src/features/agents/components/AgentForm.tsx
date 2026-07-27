import { useForm } from 'react-hook-form';
import type { Resolver, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { agentSchema } from '../schemas/agentSchema';
import type { AgentFormOutput, AgentFormValues } from '../schemas/agentSchema';

interface AgentFormProps {
  defaultValues: AgentFormValues;
  onSubmit: (values: AgentFormOutput) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  submitError?: string | null;
}

/**
 * The single agent form, shared by Create and Edit.
 *
 * `defaultValues.mode` drives the three differences between them —
 * whether the password is required, whether email is editable, and
 * whether the active toggle is offered — so there is one component, one
 * schema and one layout rather than two copies that drift.
 *
 * It owns no data fetching and no mutation; the parent page decides what
 * submitting means.
 */
export function AgentForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
  submitError,
}: AgentFormProps) {
  const isCreate = defaultValues.mode === 'create';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AgentFormValues, unknown, AgentFormOutput>({
    resolver: zodResolver(agentSchema) as Resolver<
      AgentFormValues,
      unknown,
      AgentFormOutput
    >,
    defaultValues,
  });

  const submit: SubmitHandler<AgentFormOutput> = async (values) => {
    await onSubmit(values);
  };

  return (
    <Box
      component="form"
      noValidate
      onSubmit={(event) => {
        void handleSubmit(submit)(event);
      }}
    >
      {/* mode is form state, not user input — registered hidden so it
          reaches the resolver without being rendered. */}
      <input type="hidden" {...register('mode')} />

      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Account
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              }}
            >
              <TextField
                {...register('full_name')}
                label="Full name"
                required
                fullWidth
                error={Boolean(errors.full_name)}
                helperText={errors.full_name?.message ?? ' '}
                disabled={isSubmitting}
              />

              <TextField
                {...register('email')}
                label="Email"
                type="email"
                required
                fullWidth
                // PUT /agents/:id does not touch the email column, so on
                // edit this is read-only rather than a field that looks
                // editable and silently discards the change.
                disabled={!isCreate || isSubmitting}
                error={Boolean(errors.email)}
                helperText={
                  errors.email?.message ??
                  (isCreate ? ' ' : 'Email cannot be changed after creation.')
                }
              />

              <TextField
                {...register('phone')}
                label="Phone"
                fullWidth
                error={Boolean(errors.phone)}
                helperText={errors.phone?.message ?? ' '}
                disabled={isSubmitting}
              />

              {/* RC2.8: the agent's commission rate, editable by an admin. */}
              <TextField
                {...register('commission_percentage')}
                label="Commission %"
                required
                fullWidth
                inputMode="decimal"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">%</InputAdornment>
                    ),
                  },
                }}
                error={Boolean(errors.commission_percentage)}
                helperText={errors.commission_percentage?.message ?? '0–100'}
                disabled={isSubmitting}
              />

              {/* Role is assigned by the backend, which hard-codes the
                  agent role on insert. Shown so the field the brief calls
                  for is visible and unambiguous, disabled because there
                  is no API to change it. */}
              <TextField
                label="Role"
                value="Agent"
                fullWidth
                disabled
                helperText="Every account created here is an agent."
              />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              {isCreate ? 'Password' : 'Reset password'}
            </Typography>

            <TextField
              {...register('password')}
              label={isCreate ? 'Password' : 'New password'}
              type="password"
              autoComplete="new-password"
              required={isCreate}
              fullWidth
              error={Boolean(errors.password)}
              helperText={
                errors.password?.message ??
                (isCreate
                  ? 'At least 8 characters.'
                  : 'Leave blank to keep the current password.')
              }
              disabled={isSubmitting}
            />

            {!isCreate ? (
              <FormControlLabel
                sx={{ mt: 1 }}
                control={
                  <Checkbox
                    {...register('is_active')}
                    defaultChecked={defaultValues.is_active}
                    disabled={isSubmitting}
                  />
                }
                label="Account is active"
              />
            ) : null}
          </CardContent>
        </Card>

        {submitError ? <Alert severity="error">{submitError}</Alert> : null}

        <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={18} color="inherit" />
              ) : null
            }
          >
            {isSubmitting ? 'Saving…' : submitLabel}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
