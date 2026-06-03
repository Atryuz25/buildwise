import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Mock Sentry Initialization for Production Error Tracking
if (import.meta.env.PROD) {
  // Sentry.init({
  //   dsn: import.meta.env.VITE_SENTRY_DSN,
  //   integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  //   tracesSampleRate: 1.0,
  // });
  console.log('[Sentry] Initialized with mocked DSN');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
