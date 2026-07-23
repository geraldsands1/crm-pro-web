import { NavLink } from 'react-router-dom';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';

import { useAuth } from '../../features/auth/hooks/useAuth';
import { visibleNavItems } from './navigation';

interface SidebarProps {
  /** Closes the temporary drawer after navigating on small screens. */
  onNavigate?: () => void;
}

/**
 * The navigation rail.
 *
 * Entries come from `navigation.ts` and are filtered by the signed-in
 * role, so an agent never sees the Agents link. That is presentation
 * only — RoleRoute enforces the same rule on the route, and the backend
 * enforces it again per request.
 *
 * `NavLink` supplies the active state, so the current section stays
 * highlighted without this component tracking the location itself.
 */
export function Sidebar({ onNavigate }: SidebarProps) {
  const { user } = useAuth();
  const items = visibleNavItems(user?.role);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ px: 3 }}>
        <Typography variant="h6" component="span" noWrap>
          CRM Pro
        </Typography>
      </Toolbar>

      <List component="nav" sx={{ px: 1.5, py: 1 }}>
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              onClick={onNavigate}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                color: 'text.secondary',
                '&.active': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': { color: 'inherit' },
                  '&:hover': { bgcolor: 'primary.dark' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                // slotProps, not the removed primaryTypographyProps —
                // MUI v8 moved per-slot overrides onto this one API.
                slotProps={{
                  primary: { sx: { fontSize: 14, fontWeight: 600 } },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
