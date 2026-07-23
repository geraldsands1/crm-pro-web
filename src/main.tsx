import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import './index.css';

const container = document.getElementById('root');

if (!container) {
  // Fails loudly rather than with a non-null assertion, which would hide
  // a missing #root behind a confusing React error.
  throw new Error('Root element #root was not found in the document.');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
