import { type ReactElement, type ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageActionBar } from './PageActionBar';
import { DetailPageShell } from './DetailPageShell';

interface FormPageShellProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  loadingTitle?: string;
  loadingDescription?: string;
  errorTitle?: string;
  errorDescription?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function FormPageShell({
  title,
  description,
  actions,
  children,
  isLoading = false,
  isError = false,
  loadingTitle,
  loadingDescription,
  errorTitle,
  errorDescription,
  actionLabel,
  onAction,
  className,
}: FormPageShellProps): ReactElement {
  if (isLoading || isError) {
    return (
      <DetailPageShell
        title={title}
        description={description}
        actions={actions}
        isLoading={isLoading}
        isError={isError}
        loadingTitle={loadingTitle}
        loadingDescription={loadingDescription}
        errorTitle={errorTitle}
        errorDescription={errorDescription}
        actionLabel={actionLabel}
        onAction={onAction}
        className={className}
      />
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <PageActionBar title={title} description={description} actions={actions} />
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
