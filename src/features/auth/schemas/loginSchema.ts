import { z } from 'zod';

/**
 * Client-side validation for the login form.
 *
 * Catches empty and obviously malformed input before a pointless round
 * trip. It is not a security control — the backend validates
 * independently and is the only thing that decides whether credentials
 * are correct.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address.')
    .email('Enter a valid email address.'),
  password: z
    .string()
    // Length only — never a format rule. A password policy enforced here
    // would lock out existing accounts whose passwords predate it.
    .min(1, 'Enter your password.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
