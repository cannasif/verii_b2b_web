import {
  createContext,
  type PropsWithChildren,
  type ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { ensureNamespaces } from '@/lib/i18n';
import { recordRouteTelemetry, recordScreenTelemetry } from './route-telemetry';

interface RouteRuntimeBoundaryProps extends PropsWithChildren {
  routeName: string;
  namespaces?: string[];
}

interface RoutePerfContextValue {
  reportScreenReady: (stage?: string) => void;
}

const RoutePerfContext = createContext<RoutePerfContextValue | null>(null);

function markPerformance(label: string): void {
  if (typeof performance === 'undefined' || typeof performance.mark !== 'function') {
    return;
  }

  performance.mark(label);
}

function measurePerformance(name: string, startMark: string, endMark: string): number | null {
  if (typeof performance === 'undefined' || typeof performance.measure !== 'function') {
    return null;
  }

  try {
    performance.measure(name, startMark, endMark);
    const measures = performance.getEntriesByName(name, 'measure');
    const lastMeasure = measures[measures.length - 1];
    return typeof lastMeasure?.duration === 'number' ? lastMeasure.duration : null;
  } catch {
    // Ignore duplicate or missing mark errors in unsupported browsers/devtools.
    return null;
  }
}

function shouldExposePerfInTitle(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('perf') === '1';
  } catch {
    return false;
  }
}

function sanitizeTitle(baseTitle: string): string {
  return baseTitle.replace(/\s+\[(?:screenperf|perf):[^\]]+\]$/, '');
}

export function useRouteScreenReady(): RoutePerfContextValue {
  return useContext(RoutePerfContext) ?? {
    reportScreenReady: () => undefined,
  };
}

export function RouteRuntimeBoundary({
  routeName,
  namespaces = [],
  children,
}: RouteRuntimeBoundaryProps): ReactElement {
  const { i18n, t } = useTranslation('common');
  const [ready, setReady] = useState(namespaces.length === 0);
  const startMark = useMemo(() => `route:${routeName}:start:${Date.now()}`, [routeName]);
  const baseTitleRef = useRef<string>('');

  useEffect(() => {
    markPerformance(startMark);
    baseTitleRef.current = sanitizeTitle(document.title);
  }, [startMark]);

  const reportMetric = useCallback(
    (metric: 'route' | 'screen', stage = 'ready') => {
      const endMark = `route:${routeName}:${metric}:${stage}:${Date.now()}`;
      markPerformance(endMark);
      const duration = measurePerformance(`route:${routeName}:${metric}:${stage}`, startMark, endMark);
      if (duration == null) {
        return;
      }

      if (metric === 'screen') {
        recordScreenTelemetry(routeName, duration, stage);
      } else {
        recordRouteTelemetry(routeName, duration);
      }

      if (shouldExposePerfInTitle()) {
        const baseTitle = baseTitleRef.current || sanitizeTitle(document.title);
        const tag =
          metric === 'screen'
            ? `[screenperf:${routeName}:${stage}:${Math.round(duration)}ms]`
            : `[perf:${routeName}:${Math.round(duration)}ms]`;
        document.title = `${baseTitle} ${tag}`;
      }
    },
    [routeName, startMark],
  );

  useEffect(() => {
    let active = true;

    if (namespaces.length === 0) {
      setReady(true);
      return undefined;
    }

    setReady(false);
    void ensureNamespaces(namespaces, i18n.resolvedLanguage ?? i18n.language)
      .then(() => {
        if (active) {
          setReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, [i18n.language, i18n.resolvedLanguage, namespaces]);

  useEffect(() => {
    if (!ready) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      reportMetric('route');
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [ready, reportMetric]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6 py-10 text-sm text-slate-500 dark:text-slate-400">
        {t('pagePreparing')}
      </div>
    );
  }

  return (
    <RoutePerfContext.Provider
      value={{
        reportScreenReady: (stage) => reportMetric('screen', stage),
      }}
    >
      {children}
    </RoutePerfContext.Provider>
  );
}
