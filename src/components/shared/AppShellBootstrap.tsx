import { type ReactElement, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useAppShellStore } from '@/stores/app-shell-store';
import { logPerfDebug } from '@/lib/perf-debug';

export function AppShellBootstrap(): ReactElement | null {
  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const bootstrapAppShell = useAppShellStore((state) => state.bootstrapAppShell);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof globalThis.setTimeout> | null = null;
    let idleId: number | null = null;
    const browserWindow =
      typeof window !== 'undefined'
        ? (window as Window & typeof globalThis & {
            requestIdleCallback?: (callback: IdleRequestCallback) => number;
            cancelIdleCallback?: (handle: number) => void;
          })
        : null;

    async function bootstrap(): Promise<void> {
      if (!token || !userId) {
        return;
      }

      try {
        logPerfDebug('app-shell:bootstrap-start', { userId });
        await bootstrapAppShell({ token, userId });
        if (cancelled) {
          return;
        }
        logPerfDebug('app-shell:bootstrap-ready', { userId });
      } catch {
        // App shell bootstrap should not block route rendering.
      }
    }

    const scheduleBootstrap = (): void => {
      if (browserWindow?.requestIdleCallback) {
        idleId = browserWindow.requestIdleCallback(() => {
          void bootstrap();
        });
        return;
      }

      timeoutId = globalThis.setTimeout(() => {
        void bootstrap();
      }, 250);
    };

    scheduleBootstrap();

    return () => {
      cancelled = true;
      if (browserWindow?.cancelIdleCallback && idleId != null) {
        browserWindow.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) {
        globalThis.clearTimeout(timeoutId);
      }
    };
  }, [bootstrapAppShell, token, userId]);

  return null;
}
