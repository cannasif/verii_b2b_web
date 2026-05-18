import { type ReactElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { useMyPermissionsQuery } from '../hooks/useMyPermissionsQuery';
import { canAccessPath } from '../utils/hasPermission';
import { UnauthorizedPage } from './UnauthorizedPage';
import { logPerfDebug } from '@/lib/perf-debug';

export function RoutePermissionGuard(): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const { data: permissions, isLoading, isError, error } = useMyPermissionsQuery();

  useEffect(() => {
    if (isLoading) {
      logPerfDebug('permissions:loading', { path: location.pathname });
      return;
    }

    if (permissions) {
      logPerfDebug('permissions:ready', { path: location.pathname });
    }
  }, [isLoading, location.pathname, permissions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-slate-500">{t('common.loading')}</div>
      </div>
    );
  }

  if (isError) {
    const statusCode = (error as AxiosError | null)?.response?.status;
    if (statusCode === 403) {
      return <UnauthorizedPage />;
    }
    return <Outlet />;
  }

  if (!permissions) {
    return <UnauthorizedPage />;
  }

  if (canAccessPath(permissions, location.pathname)) {
    return <Outlet />;
  }

  return <UnauthorizedPage />;
}
