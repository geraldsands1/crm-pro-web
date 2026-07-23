import { useNavigate } from 'react-router-dom';
import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';

import { appRoutes } from '../../../app/router/routes';
import { AgentForm } from '../components/AgentForm';
import { useCreateAgent } from '../hooks/useAgentMutations';
import {
  emptyAgentFormValues,
  toCreateAgentInput,
} from '../schemas/agentSchema';
import type { AgentFormOutput } from '../schemas/agentSchema';

export function AgentCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateAgent();

  const backToList = (): void => {
    void navigate(appRoutes.agents);
  };

  const handleSubmit = async (values: AgentFormOutput): Promise<void> => {
    try {
      await createMutation.mutateAsync(toCreateAgentInput(values));
      backToList();
    } catch {
      // Handled: the mutation holds the error and the form renders it.
      // Rethrowing would log an unhandled rejection for a failure that is
      // already fully accounted for — a console error this release must
      // not produce.
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={backToList}
          sx={{ mb: 1, ml: -1 }}
        >
          Agents
        </Button>
        <Typography variant="h5" component="h1">
          Add Agent
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The agent can sign in with this email and password immediately.
        </Typography>
      </Box>

      <AgentForm
        defaultValues={emptyAgentFormValues()}
        onSubmit={handleSubmit}
        onCancel={backToList}
        submitLabel="Create Agent"
        submitError={createMutation.error?.message ?? null}
      />
    </Stack>
  );
}
