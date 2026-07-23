import { createTheme } from '@mui/material/styles';

/**
 * The portal's Material UI theme.
 *
 * Desktop-first: the layout below assumes a persistent sidebar at `md`
 * and up and collapses it to a temporary drawer underneath. Type scale
 * and density are tuned for an information-dense admin tool rather than a
 * marketing page.
 */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1565c0' },
    secondary: { main: '#00897b' },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(','),
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          // A flat border reads better than a shadow when many cards sit
          // side by side in a grid.
          boxShadow: 'none',
          border: '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
  },
});
