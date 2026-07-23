import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { Resolver, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { useAuth } from '../../auth/hooks/useAuth';
import { AssignedAgentField } from './AssignedAgentField';
import { CUSTOMER_STATUSES } from '../constants';
import { customerSchema } from '../schemas/customerSchema';
import type {
  CustomerFormOutput,
  CustomerFormValues,
} from '../schemas/customerSchema';

interface CustomerFormProps {
  defaultValues: CustomerFormValues;
  onSubmit: (values: CustomerFormOutput) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  /** Server-side failure, shown above the actions. */
  submitError?: string | null;
}

/**
 * The single customer form, shared by Add and Edit.
 *
 * One component rather than two: the fields, the validation and the
 * layout are identical, and the only real differences — what the values
 * start as, what the button says, and what happens on submit — are
 * props. Duplicating it would guarantee the two drift the first time a
 * field is added.
 *
 * It owns no data fetching and no mutation. The parent page decides
 * whether submitting means create or update, which is what keeps this
 * reusable and testable in isolation.
 */
export function CustomerForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
  submitError,
}: CustomerFormProps) {
  // `GET /agents` is admin-only server-side, so only an admin can be
  // offered the picker — see AssignedAgentField for what an agent sees.
  const { user } = useAuth();
  const canAssignAgent = user?.role === 'admin';

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues, unknown, CustomerFormOutput>({
    resolver: zodResolver(customerSchema) as Resolver<
      CustomerFormValues,
      unknown,
      CustomerFormOutput
    >,
    defaultValues,
  });

  /**
   * The status column is free-form TEXT server-side, so an existing
   * customer may hold a value this portal does not list. Appending it
   * keeps the select from silently rewriting that customer's status to
   * whichever option happened to be first — and MUI throws outright if a
   * Select's value is absent from its options.
   */
  const statusOptions = useMemo(() => {
    const current = defaultValues.status.trim();
    const known: string[] = [...CUSTOMER_STATUSES];
    return known.includes(current) || current === ''
      ? known
      : [...known, current];
  }, [defaultValues.status]);

  const submit: SubmitHandler<CustomerFormOutput> = async (values) => {
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
      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Contact
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              }}
            >
              <TextField
                {...register('first_name')}
                label="First name"
                required
                fullWidth
                error={Boolean(errors.first_name)}
                helperText={errors.first_name?.message ?? ' '}
                disabled={isSubmitting}
              />
              <TextField
                {...register('last_name')}
                label="Last name"
                required
                fullWidth
                error={Boolean(errors.last_name)}
                helperText={errors.last_name?.message ?? ' '}
                disabled={isSubmitting}
              />
              <TextField
                {...register('email')}
                label="Email"
                type="email"
                fullWidth
                error={Boolean(errors.email)}
                helperText={errors.email?.message ?? ' '}
                disabled={isSubmitting}
              />
              <TextField
                {...register('phone')}
                label="Phone"
                fullWidth
                error={Boolean(errors.phone)}
                helperText={errors.phone?.message ?? ' '}
                disabled={isSubmitting}
              />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Company &amp; classification
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              }}
            >
              <TextField
                {...register('company_name')}
                label="Company"
                fullWidth
                error={Boolean(errors.company_name)}
                helperText={errors.company_name?.message ?? ' '}
                disabled={isSubmitting}
              />
              <TextField
                {...register('lead_source')}
                label="Lead source"
                fullWidth
                error={Boolean(errors.lead_source)}
                helperText={errors.lead_source?.message ?? ' '}
                disabled={isSubmitting}
              />

              {/* RC2.4C — the assigned agent, chosen from the live agent
                  list. Driven by a Controller rather than `register`
                  because Autocomplete reports a whole object, not a DOM
                  event, so RHF cannot wire it up by ref. */}
              <Controller
                control={control}
                name="assigned_agent_id"
                render={({ field }) => (
                  <AssignedAgentField
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    canLoadAgents={canAssignAgent}
                  />
                )}
              />
              <TextField
                {...register('status')}
                select
                label="Status"
                required
                fullWidth
                defaultValue={defaultValues.status}
                error={Boolean(errors.status)}
                helperText={errors.status?.message ?? ' '}
                disabled={isSubmitting}
                sx={{ textTransform: 'capitalize' }}
              >
                {statusOptions.map((option) => (
                  <MenuItem
                    key={option}
                    value={option}
                    sx={{ textTransform: 'capitalize' }}
                  >
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Address
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              }}
            >
              <TextField
                {...register('address')}
                label="Street address"
                fullWidth
                sx={{ gridColumn: { sm: '1 / -1' } }}
                error={Boolean(errors.address)}
                helperText={errors.address?.message ?? ' '}
                disabled={isSubmitting}
              />
              <TextField
                {...register('city')}
                label="City"
                fullWidth
                error={Boolean(errors.city)}
                helperText={errors.city?.message ?? ' '}
                disabled={isSubmitting}
              />
              <TextField
                {...register('state')}
                label="State / Province"
                fullWidth
                error={Boolean(errors.state)}
                helperText={errors.state?.message ?? ' '}
                disabled={isSubmitting}
              />
              <TextField
                {...register('postal_code')}
                label="Postal code"
                fullWidth
                error={Boolean(errors.postal_code)}
                helperText={errors.postal_code?.message ?? ' '}
                disabled={isSubmitting}
              />
              <TextField
                {...register('country')}
                label="Country"
                fullWidth
                error={Boolean(errors.country)}
                helperText={errors.country?.message ?? ' '}
                disabled={isSubmitting}
              />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Notes
            </Typography>
            <TextField
              {...register('notes')}
              label="Notes"
              fullWidth
              multiline
              minRows={4}
              error={Boolean(errors.notes)}
              helperText={errors.notes?.message ?? ' '}
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>

        {submitError ? <Alert severity="error">{submitError}</Alert> : null}

        <Stack
          direction="row"
          spacing={1.5}
          sx={{ justifyContent: 'flex-end' }}
        >
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
