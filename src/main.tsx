import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/theme-provider';
import './index.css';
import i18n, { ensureI18nReady } from './lib/i18n';
import App from './App.tsx';
import { queryClient } from './lib/query-client';
import { ensureApiReady } from './lib/axios';
import { tryRecoverFromChunkError } from './lib/chunk-recovery';
import { endPerfDebug, logPerfDebug, startPerfDebug } from './lib/perf-debug';

window.addEventListener('vite:preloadError', (event) => {
  const customEvent = event as unknown as CustomEvent<{ payload?: unknown }>;
  const error = customEvent.detail?.payload;

  if (tryRecoverFromChunkError(error)) {
    customEvent.preventDefault();
  }
});

async function bootstrap(): Promise<void> {
  startPerfDebug();
  await Promise.all([ensureApiReady(), ensureI18nReady()]);
  logPerfDebug('bootstrap:dependencies-ready');

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <App />
          </ThemeProvider>
        </QueryClientProvider>
      </I18nextProvider>
    </StrictMode>,
  );
  endPerfDebug();
}

void bootstrap();
