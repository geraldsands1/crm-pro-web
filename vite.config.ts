import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        /**
         * Split the third-party dependencies out of the app bundle.
         *
         * Material UI plus its Emotion runtime is by far the largest
         * thing shipped, and it changes only when a dependency is
         * upgraded. Giving it its own chunk means a normal application
         * change invalidates a small file instead of forcing every
         * returning user to re-download the whole framework.
         *
         * Vite 8 bundles with Rolldown, so this is `rolldownOptions`
         * with `codeSplitting` — not Rollup's `manualChunks`, and not
         * the older `advancedChunks`, which Rolldown now warns is
         * deprecated.
         */
        codeSplitting: {
          groups: [
            { name: 'vendor-mui', test: /node_modules[\\/]@mui|@emotion/ },
            {
              name: 'vendor-react',
              test: /node_modules[\\/](react|react-dom|react-router)/,
            },
            {
              name: 'vendor',
              test: /node_modules/,
            },
          ],
        },
      },
    },
  },
});
