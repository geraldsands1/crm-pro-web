import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Drawer, Toolbar } from '@mui/material';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const SIDEBAR_WIDTH = 256;

/**
 * The authenticated application shell: sidebar, top bar, and the routed
 * page in between.
 *
 * Used as a layout route inside ProtectedRoute, so it renders once and
 * only its `<Outlet />` swaps as the user navigates — the sidebar and top
 * bar never remount, which keeps navigation instant and avoids the menu
 * flickering on every route change.
 *
 * Desktop-first as specified: a permanent drawer from `md` up, and a
 * temporary one below it driven by the top bar's menu button. Both render
 * the same `Sidebar`, so there is one navigation implementation rather
 * than a desktop and a mobile copy that drift.
 */
export function MainLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const closeMobileSidebar = (): void => {
    setIsMobileOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <TopBar
        sidebarWidth={SIDEBAR_WIDTH}
        onOpenSidebar={() => {
          setIsMobileOpen(true);
        }}
      />

      <Box
        component="nav"
        sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={isMobileOpen}
          onClose={closeMobileSidebar}
          // Keeps the drawer mounted so opening it on a phone does not
          // re-run the nav render every time.
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: SIDEBAR_WIDTH,
            },
          }}
        >
          <Sidebar onNavigate={closeMobileSidebar} />
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: SIDEBAR_WIDTH,
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          <Sidebar />
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          bgcolor: 'background.default',
          p: { xs: 2, md: 3 },
        }}
      >
        {/* Spacer matching the fixed AppBar's height, so page content
            starts below it rather than underneath it. */}
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
