import { useState } from 'react';
import type { MouseEvent } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';

import { useAuth } from '../../features/auth/hooks/useAuth';

function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';

  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';

  return (first + last).toUpperCase();
}

/**
 * The signed-in user's identity and the way out.
 *
 * The role is shown next to the name because it changes what the portal
 * offers (an admin sees Agents, an agent does not) — surfacing it means
 * a missing menu item reads as "this account cannot" rather than as a
 * bug.
 */
export function UserMenu() {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  if (!user) return null;

  const openMenu = (event: MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = (): void => {
    setAnchorEl(null);
  };

  const handleLogout = (): void => {
    closeMenu();
    // No navigate() call: clearing the session flips `isAuthenticated`,
    // and ProtectedRoute redirects to /login on the next render. One
    // source of truth for that decision instead of two.
    logout();
  };

  return (
    <>
      <Button
        onClick={openMenu}
        color="inherit"
        sx={{ textTransform: 'none', gap: 1.25, pl: 1, pr: 1.5 }}
        aria-haspopup="menu"
        aria-expanded={anchorEl !== null}
      >
        <Avatar sx={{ width: 32, height: 32, fontSize: 13 }}>
          {initialsOf(user.full_name)}
        </Avatar>
        <Box sx={{ textAlign: 'left', display: { xs: 'none', sm: 'block' } }}>
          {/* Style goes through sx: MUI v8 no longer accepts system
              props like fontWeight directly on Typography. */}
          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            {user.full_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.role === 'admin' ? 'Administrator' : 'Agent'}
          </Typography>
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={anchorEl !== null}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 240 } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2">{user.full_name}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {user.email}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Chip
              size="small"
              label={user.role === 'admin' ? 'Administrator' : 'Agent'}
              color={user.role === 'admin' ? 'primary' : 'default'}
            />
          </Box>
        </Box>

        <Divider />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}
