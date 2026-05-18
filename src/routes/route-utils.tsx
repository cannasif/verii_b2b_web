import { type ComponentType, type ReactElement, Suspense, lazy } from 'react';
import i18n from '@/lib/i18n';
import { RouteRuntimeBoundary } from './RouteRuntimeBoundary';

export interface RouteOptions {
  routeName: string;
  namespaces?: string[];
}

export function lazyNamed<TModule extends Record<string, unknown>, TExport extends keyof TModule>(
  importer: () => Promise<TModule>,
  exportName: TExport,
): ComponentType {
  return lazy(async () => {
    const module = await importer();
    return {
      default: module[exportName] as ComponentType,
    };
  });
}

export function RouteLoadingFallback(): ReactElement {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 py-10 text-sm text-slate-500 dark:text-slate-400">
      {i18n.t('pagePreparing', { ns: 'common', defaultValue: 'Preparing page...' })}
    </div>
  );
}

export function withRoute(Component: ComponentType, options: RouteOptions): ReactElement {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <RouteRuntimeBoundary routeName={options.routeName} namespaces={options.namespaces}>
        <Component />
      </RouteRuntimeBoundary>
    </Suspense>
  );
}
