import { AppBar, Box, IconButton, Toolbar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

import { UserMenu } from './UserMenu';

interface TopBarProps {
  /** Sidebar width to offset by on desktop, where the drawer is fixed. */
  sidebarWidth: number;
  onOpenSidebar: () => void;
}

/**
 * Top navigation bar: the small-screen menu trigger on the left, the user
 * profile and sign-out on the right.
 *
 * On `md` and up it is inset by the sidebar width so it never sits over
 * the permanent drawer; below that it spans the full width and the menu
 * button appears.
 */
export function TopBar({ sidebarWidth, onOpenSidebar }: TopBarProps) {
  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${sidebarWidth}px)` },
        ml: { md: `${sidebarWidth}px` },
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          onClick={onOpenSidebar}
          aria-label="Open navigation"
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        <UserMenu />
      </Toolbar>
    </AppBar>
  );
}
