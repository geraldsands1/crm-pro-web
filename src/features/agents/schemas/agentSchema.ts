import { z } from 'zod';

import type { Agent, CreateAgentInput, UpdateAgentInput } from '../types';

/** Matches the backend's own minimum for a new account. */
const PASSWORD_MIN_LENGTH = 8;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer.`)
    .transform((value) => (value === '' ? null : value));

/**
 * Validation for the agent form.
 *
 * One schema for Create and Edit, with the mode-specific rules applied in
 * `superRefine` rather than by maintaining two near-identical schemas
 * that would drift the moment a field is added:
 *
 *   * password  — required when creating, optional when editing, where a
 *                 blank field means "leave the current password alone".
 *                 The backend only re-hashes when a password is sent.
 *   * email     — collected on create; read-only on edit, because
 *                 `PUT /agents/:id` does not touch the email column. An
 *                 editable field there would silently do nothing.
 *
 * There is deliberately no role field. The backend's INSERT hard-codes
 * the agent role, so a role selector would be a control with no effect.
 */
export const agentSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(1, 'Full name is required.')
      .max(120, 'Must be 120 characters or fewer.'),
    email: z
      .string()
      .trim()
      .min(1, 'Email is required.')
      .email('Enter a valid email address.')
      .max(150, 'Must be 150 characters or fewer.'),
    phone: optionalText(40),
    password: z.string(),
    is_active: z.boolean(),
    // RC2.8: commission rate. Held as text in the form (like the payment
    // amount) so the two-decimal rule is checked on the typed value, then
    // parsed to a number and range-checked.
    commission_percentage: z
      .string()
      .trim()
      .min(1, 'Commission % is required.')
      .refine(
        (value) => /^\d+(\.\d{1,2})?$/.test(value),
        'Enter a percentage with at most two decimals.',
      )
      .transform((value) => Number(value))
      .refine(
        (value) => value >= 0 && value <= 100,
        'Must be between 0 and 100.',
      ),
    /** Not sent anywhere — drives the conditional rules below. */
    mode: z.union([z.literal('create'), z.literal('edit')]),
  })
  .superRefine((values, ctx) => {
    const isCreate = values.mode === 'create';
    const password = values.password;

    if (isCreate && password.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['password'],
        message: 'Password is required.',
      });
      return;
    }

    // On edit an empty field is valid and means "unchanged"; anything
    // typed still has to clear the minimum.
    if (password.length > 0 && password.length < PASSWORD_MIN_LENGTH) {
      ctx.addIssue({
        code: 'custom',
        path: ['password'],
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      });
    }
  });

export type AgentFormValues = z.input<typeof agentSchema>;
export type AgentFormOutput = z.output<typeof agentSchema>;

export function emptyAgentFormValues(): AgentFormValues {
  return {
    full_name: '',
    email: '',
    phone: '',
    password: '',
    is_active: true,
    commission_percentage: '0',
    mode: 'create',
  };
}

/**
 * Existing agent to form values. Every null becomes '' — a controlled
 * MUI input handed `null` switches to uncontrolled and React logs a
 * warning, which this release is required not to produce.
 */
export function agentToFormValues(agent: Agent): AgentFormValues {
  return {
    full_name: agent.full_name,
    email: agent.email,
    phone: agent.phone ?? '',
    password: '',
    is_active: agent.is_active,
    commission_percentage: String(agent.commission_percentage),
    mode: 'edit',
  };
}

export function toCreateAgentInput(values: AgentFormOutput): CreateAgentInput {
  return {
    full_name: values.full_name,
    email: values.email,
    password: values.password,
    phone: values.phone,
    commission_percentage: values.commission_percentage,
  };
}

/**
 * Builds the update body, omitting the password unless one was typed.
 *
 * Sending an empty string would hash `""` into a real credential and lock
 * the agent out of their own account — the field has to be absent, not
 * blank.
 */
export function toUpdateAgentInput(values: AgentFormOutput): UpdateAgentInput {
  const input: UpdateAgentInput = {
    full_name: values.full_name,
    phone: values.phone,
    is_active: values.is_active,
    commission_percentage: values.commission_percentage,
  };

  if (values.password.length > 0) {
    input.password = values.password;
  }

  return input;
}
