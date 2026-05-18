import { type ReactElement } from 'react';
import { CircleHelp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FieldHelpTooltipProps {
  text: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function FieldHelpTooltip({ text, side = 'top', className }: FieldHelpTooltipProps): ReactElement {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="img"
            aria-label={text}
            tabIndex={0}
            data-no-drag-scroll="true"
            className={cn(
              'inline-flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 cursor-help ml-1 shrink-0',
              className,
            )}
          >
            <CircleHelp size={14} strokeWidth={2} />
          </span>
        </TooltipTrigger>
        <TooltipContent side={side} sideOffset={6} className="max-w-sm px-3 py-1.5 text-sm">
          <p className="leading-5">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
