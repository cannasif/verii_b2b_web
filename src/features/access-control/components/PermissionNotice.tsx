import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';

interface PermissionNoticeProps {
  message?: string;
}

export function PermissionNotice({ message }: PermissionNoticeProps): ReactElement {
  const { t } = useTranslation();

  return (
    <Card className="border-amber-200 bg-amber-50/80">
      <CardContent className="py-4 text-sm text-amber-900">
        {message || t('common.accessDeniedMessage')}
      </CardContent>
    </Card>
  );
}
