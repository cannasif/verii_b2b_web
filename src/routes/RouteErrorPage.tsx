import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function RouteErrorPage() {
  const { t } = useTranslation();
  const error = useRouteError();

  let title = t('routeError.title');
  let description = t('routeError.description');

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    description = typeof error.data === 'string' && error.data.trim().length > 0
      ? error.data
      : description;
  } else if (error instanceof Error && error.message.trim().length > 0) {
    description = error.message;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            {t('routeError.refresh')}
          </button>
          <button
            type="button"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground"
            onClick={() => window.location.assign('/')}
          >
            {t('routeError.home')}
          </button>
        </div>
      </div>
    </div>
  );
}
