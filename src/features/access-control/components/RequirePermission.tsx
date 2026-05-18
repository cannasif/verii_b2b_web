import { type ReactElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useMyPermissionsQuery } from '../hooks/useMyPermissionsQuery';
import { hasPermission } from '../utils/hasPermission';

interface RequirePermissionProps {
  permissionCode: string;
  fallback?: ReactNode;
  children: ReactNode;
}

function DefaultForbiddenFallback(): ReactElement {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
        {t('common.accessDenied')}
      </h2>
      <p className="text-slate-500 dark:text-slate-400">
        {t('common.accessDeniedMessage')}
      </p>
    </div>
  );
}

export function RequirePermission({
  permissionCode,
  fallback,
  children,
}: RequirePermissionProps): ReactElement {
  const { t } = useTranslation();
  const { data: permissions, isLoading, isError } = useMyPermissionsQuery();
  const fallbackNode = fallback ?? <DefaultForbiddenFallback />;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-pulse text-slate-500">{t('common.loading')}</div>
      </div>
    );
  }

  if (isError || !permissions) {
    return <>{fallbackNode}</>;
  }

  if (hasPermission(permissions, permissionCode)) {
    return <>{children}</>;
  }

  return <>{fallbackNode}</>;
}
