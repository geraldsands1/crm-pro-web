import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/ConstructionOutlined';

interface ModulePlaceholderPageProps {
  title: string;
}

/**
 * Stand-in for a module that has a sidebar entry and a route but no
 * implementation yet.
 *
 * It exists so the navigation is honestly navigable: without it, clicking
 * Customers would land on a blank screen or a 404, which reads as a
 * broken portal rather than an unfinished one. Deliberately inert — it
 * makes no API call and holds no state, so nothing here has to be
 * unpicked when the real module replaces it.
 */
export function ModulePlaceholderPage({ title }: ModulePlaceholderPageProps) {
  return (
    <Stack spacing={3}>
      <Typography variant="h5" component="h1">
        {title}
      </Typography>

      <Card>
        <CardContent>
          <Stack
            spacing={1.5}
            sx={{ py: 6, textAlign: 'center', alignItems: 'center' }}
          >
            <Box sx={{ color: 'text.disabled' }}>
              <ConstructionIcon fontSize="large" />
            </Box>
            <Typography variant="h6" component="p">
              Not available yet
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 420 }}
            >
              The {title.toLowerCase()} module is not part of this release.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
