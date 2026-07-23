import { AppErrorBoundary } from './components/feedback/AppErrorBoundary';
import { AppProviders } from './app/providers/AppProviders';
import { AppRouter } from './app/router/AppRouter';

/**
 * The application root: providers on the outside, routes on the inside.
 * Everything else is reached through the router.
 */
export default function App() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </AppErrorBoundary>
  );
}
