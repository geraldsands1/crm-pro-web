import { Autocomplete, TextField } from '@mui/material';

import { useAuth } from '../../auth/hooks/useAuth';
import { useAgents } from '../../agents/hooks/useAgents';
import type { Agent } from '../../agents/types';

interface AssignedAgentFieldProps {
  /** Currently selected agent id, or null when unassigned. */
  value: string | null;
  onChange: (agentId: string | null) => void;
  disabled?: boolean;
  /**
   * Only admins may call `GET /agents`. When false the field renders in a
   * read-only, explained state instead of firing a request that is
   * guaranteed to be rejected.
   */
  canLoadAgents: boolean;
  /** RC2.8.2: mark the picker required (admins must assign an agent). */
  required?: boolean;
  /** RC2.8.2: validation message from the form, shown under the field. */
  errorMessage?: string | null;
}

/**
 * Searchable agent picker for the customer form.
 *
 * An Autocomplete rather than a plain Select: the agent list is
 * unpaginated and unbounded, and scrolling a long menu to find one name
 * is far worse than typing three letters of it.
 *
 * The permission split is the interesting part. `GET /api/agents` is
 * admin-only, so an agent editing a customer would get a 403. Rather than
 * showing a broken control or an alarming error on an otherwise healthy
 * form, the field disables itself and says why — the customer's existing
 * assignment is untouched, because the form simply omits the field from
 * its payload and the backend leaves that column alone.
 */
export function AssignedAgentField({
  value,
  onChange,
  disabled = false,
  canLoadAgents,
  required = false,
  errorMessage = null,
}: AssignedAgentFieldProps) {
  const { user } = useAuth();
  const { data, isPending, isError } = useAgents({ enabled: canLoadAgents });

  // BUG 1 fix (RC2.8.2): an agent cannot load the agent list, and the
  // backend assigns the customer to them automatically. Rather than a
  // blank, disabled box, show who will own it — themselves — so the
  // ownership is explicit.
  if (!canLoadAgents) {
    return (
      <TextField
        label="Assigned agent"
        value={user?.full_name ?? 'You'}
        fullWidth
        disabled
        helperText="Automatically assigned to you."
      />
    );
  }

  const agents = data ?? [];
  // Resolving to `null` rather than `undefined` keeps the Autocomplete
  // controlled; `undefined` would flip it to uncontrolled and warn.
  const selected = agents.find((agent) => agent.id === value) ?? null;

  return (
    <Autocomplete<Agent>
      options={agents}
      value={selected}
      loading={isPending}
      disabled={disabled || isError}
      getOptionLabel={(agent) => agent.full_name}
      isOptionEqualToValue={(option, current) => option.id === current.id}
      onChange={(_event, agent) => {
        onChange(agent?.id ?? null);
      }}
      // Two agents can share a display name, so the key must be the id —
      // React would otherwise reuse the wrong row.
      renderOption={(props, agent) => {
        const { key, ...optionProps } = props;
        return (
          <li key={key} {...optionProps}>
            {agent.full_name}
            {agent.is_active ? '' : ' — inactive'}
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Assigned agent"
          required={required}
          helperText={
            errorMessage ??
            (isError
              ? 'Agents could not be loaded. The current assignment is unchanged.'
              : required
                ? 'Every customer must have an assigned agent.'
                : 'Leave empty to leave this customer unassigned.')
          }
          error={isError || Boolean(errorMessage)}
        />
      )}
    />
  );
}
