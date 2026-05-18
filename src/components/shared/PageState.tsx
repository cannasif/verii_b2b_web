import { type ReactElement } from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type PageStateTone = 'loading' | 'error' | 'empty';

interface PageStateProps {
  tone: PageStateTone;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  compact?: boolean;
}

const stateConfig: Record<PageStateTone, { icon: typeof Loader2; iconClassName: string }> = {
  loading: { icon: Loader2, iconClassName: 'text-primary animate-spin' },
  error: { icon: AlertCircle, iconClassName: 'text-destructive' },
  empty: { icon: Inbox, iconClassName: 'text-muted-foreground' },
};

export function PageState({
  tone,
  title,
  description,
  actionLabel,
  onAction,
  className,
  compact = false,
}: PageStateProps): ReactElement {
  const { icon: Icon, iconClassName } = stateConfig[tone];

  return (
    <Card
      className={cn(
        'border-dashed bg-muted/20 shadow-none',
        compact ? 'rounded-lg' : 'rounded-xl',
        className
      )}
    >
      <CardContent
        className={cn(
          'flex flex-col items-center justify-center text-center',
          compact ? 'gap-3 px-6 py-8' : 'gap-4 px-8 py-12'
        )}
      >
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-background shadow-sm',
            compact ? 'h-10 w-10' : 'h-12 w-12'
          )}
        >
          <Icon className={cn(compact ? 'h-5 w-5' : 'h-6 w-6', iconClassName)} />
        </div>
        <div className="space-y-1.5">
          <p className={cn('font-semibold text-foreground', compact ? 'text-sm' : 'text-base')}>
            {title}
          </p>
          {description ? (
            <p className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>{description}</p>
          ) : null}
        </div>
        {actionLabel && onAction ? (
          <Button type="button" variant={tone === 'error' ? 'default' : 'outline'} onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
