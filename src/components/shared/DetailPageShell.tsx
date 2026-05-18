import { type ReactElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageActionBar } from './PageActionBar';
import { PageState } from './PageState';

interface DetailPageShellProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  loadingTitle?: string;
  loadingDescription?: string;
  errorTitle?: string;
  errorDescription?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function DetailPageShell({
  title,
  description,
  actions,
  children,
  isLoading = false,
  isError = false,
  isEmpty = false,
  loadingTitle,
  loadingDescription,
  errorTitle,
  errorDescription,
  emptyTitle,
  emptyDescription,
  actionLabel,
  onAction,
  className,
}: DetailPageShellProps): ReactElement {
  const { t } = useTranslation();
  let content = children;

  if (isLoading) {
    content = (
      <PageState
        tone="loading"
        title={loadingTitle ?? t('detailPage.loadingTitle')}
        description={loadingDescription}
        compact
      />
    );
  } else if (isError) {
    content = (
      <PageState
        tone="error"
        title={errorTitle ?? t('detailPage.errorTitle')}
        description={errorDescription}
        actionLabel={actionLabel}
        onAction={onAction}
        compact
      />
    );
  } else if (isEmpty) {
    content = (
      <PageState
        tone="empty"
        title={emptyTitle ?? t('detailPage.emptyTitle')}
        description={emptyDescription}
        actionLabel={actionLabel}
        onAction={onAction}
        compact
      />
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <PageActionBar title={title} description={description} actions={actions} />
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
