import { useForm } from 'react-hook-form';
import type { Resolver, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';

import { PAYMENT_METHODS } from '../constants';
import { paymentSchema } from '../schemas/paymentSchema';
import type {
  PaymentFormOutput,
  PaymentFormValues,
} from '../schemas/paymentSchema';

interface PaymentFormProps {
  defaultValues: PaymentFormValues;
  onSubmit: (values: PaymentFormOutput) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  submitError?: string | null;
}

/**
 * The payment form.
 *
 * Presentational and self-contained: it validates, then hands the parsed
 * values up. It knows nothing about which customer the payment belongs to
 * or how it is sent, which is what keeps it usable from the details tab
 * today and from anywhere else later without change.
 *
 * There is currently one caller, because the backend exposes no update
 * route for payments — recording is the only write. The component is
 * still built to be reused rather than inlined, since an edit screen
 * would otherwise duplicate every field and rule.
 */
export function PaymentForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
  submitError,
}: PaymentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues, unknown, PaymentFormOutput>({
    resolver: zodResolver(paymentSchema) as Resolver<
      PaymentFormValues,
      unknown,
      PaymentFormOutput
    >,
    defaultValues,
  });

  const submit: SubmitHandler<PaymentFormOutput> = async (values) => {
    await onSubmit(values);
  };

  return (
    <Box
      component="form"
      noValidate
      id="payment-form"
      onSubmit={(event) => {
        void handleSubmit(submit)(event);
      }}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
          }}
        >
          <TextField
            {...register('amount')}
            label="Amount"
            required
            fullWidth
            autoFocus
            // `inputMode` rather than type="number": a number input
            // silently accepts "1e5" and strips trailing zeros, both of
            // which defeat the two-decimal-places rule.
            inputMode="decimal"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              },
            }}
            error={Boolean(errors.amount)}
            helperText={errors.amount?.message ?? ' '}
            disabled={isSubmitting}
          />

          <TextField
            {...register('method')}
            select
            label="Payment method"
            required
            fullWidth
            defaultValue={defaultValues.method}
            error={Boolean(errors.method)}
            helperText={errors.method?.message ?? ' '}
            disabled={isSubmitting}
          >
            {PAYMENT_METHODS.map((method) => (
              <MenuItem key={method} value={method}>
                {method}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            {...register('paid_at')}
            label="Payment date"
            type="date"
            required
            fullWidth
            // A date input renders its own placeholder, which would
            // otherwise collide with the floating label.
            slotProps={{ inputLabel: { shrink: true } }}
            error={Boolean(errors.paid_at)}
            helperText={errors.paid_at?.message ?? ' '}
            disabled={isSubmitting}
          />
        </Box>

        <TextField
          {...register('note')}
          label="Notes"
          fullWidth
          multiline
          minRows={3}
          error={Boolean(errors.note)}
          helperText={errors.note?.message ?? ' '}
          disabled={isSubmitting}
        />

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
