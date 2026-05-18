import { type ReactElement, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageActionBarProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function PageActionBar({
  title,
  description,
  actions,
  className,
  contentClassName,
}: PageActionBarProps): ReactElement {
  return (
    <div className={cn('crm-toolbar flex flex-col gap-4 md:flex-row md:items-start md:justify-between', className)}>
      <div className={cn('space-y-1', contentClassName)}>
        <div className="text-xl font-semibold tracking-tight text-foreground">{title}</div>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
