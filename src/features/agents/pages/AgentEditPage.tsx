import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';

import { EmptyState } from '../../../components/feedback/EmptyState';
import { PageError } from '../../../components/feedback/PageError';
import { appRoutes } from '../../../app/router/routes';
import { AgentForm } from '../components/AgentForm';
import { useAgents } from '../hooks/useAgents';
import { useUpdateAgent } from '../hooks/useAgentMutations';
import {
  agentToFormValues,
  toUpdateAgentInput,
} from '../schemas/agentSchema';
import type { AgentFormOutput } from '../schemas/agentSchema';

function EditSkeleton() {
  return (
    <Stack spacing={3}>
      <Skeleton variant="text" width={240} height={44} />
      {Array.from({ length: 2 }, (_, index) => (
        <Card key={index}>
          <CardContent>
            <Stack spacing={2}>
              <Skeleton variant="text" width={160} height={28} />
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

export function AgentEditPage() {
  const { agentId = '' } = useParams<{ agentId: string }>();
  const navigate = useNavigate();

  // There is no `GET /agents/:id` endpoint, so the agent is taken from
  // the cached collection the list already loaded. Reusing the same query
  // key means arriving here directly (a refresh, a pasted URL) fetches it
  // once and every later visit is instant.
  const { data: agents, isPending, isError, error, refetch } = useAgents();
  const updateMutation = useUpdateAgent(agentId);

  const backToList = (): void => {
    void navigate(appRoutes.agents);
  };

  if (isPending) return <EditSkeleton />;

  if (isError) {
    return (
      <PageError
        error={error}
        onRetry={() => {
          void refetch();
        }}
        secondaryAction={
          <Button startIcon={<ArrowBackIcon />} onClick={backToList}>
            Back to agents
          </Button>
        }
      />
    );
  }

  const agent = agents.find((candidate) => candidate.id === agentId);

  if (!agent) {
    return (
      <Card>
        <CardContent sx={{ py: 6 }}>
          <EmptyState
            title="Agent not found"
            description="This agent may have been deleted."
            action={
              <Button
                variant="contained"
                startIcon={<ArrowBackIcon />}
                onClick={backToList}
              >
                Back to agents
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (values: AgentFormOutput): Promise<void> => {
    try {
      await updateMutation.mutateAsync(toUpdateAgentInput(values));
      backToList();
    } catch {
      // Handled — see AgentCreatePage's matching note.
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
          Edit Agent
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {agent.email}
        </Typography>
      </Box>

      {/* The very same component the Create page renders — only the
          starting values, the mode and the submit handler differ. */}
      <AgentForm
        defaultValues={agentToFormValues(agent)}
        onSubmit={handleSubmit}
        onCancel={backToList}
        submitLabel="Save Changes"
        submitError={updateMutation.error?.message ?? null}
      />
    </Stack>
  );
}
