import { type ReactElement } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface DataTableGridPaginationProps {
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageSizeChange: (size: number) => void;
  paginationInfoText: string;
  onPreviousPage: () => void;
  onNextPage: () => void;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  disablePaginationButtons: boolean;
  previousLabel: string;
  nextLabel: string;
  pageNumber: number;
  totalPages: number;
}

export function DataTableGridPagination({
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  paginationInfoText,
  onPreviousPage,
  onNextPage,
  hasPreviousPage,
  hasNextPage,
  disablePaginationButtons,
  previousLabel,
  nextLabel,
  pageNumber,
  totalPages,
}: DataTableGridPaginationProps): ReactElement {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 px-3">
              <span>{pageSize}</span>
              <ChevronDown className="ml-1 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-24">
            {pageSizeOptions.map((size) => (
              <DropdownMenuItem key={size} onClick={() => onPageSizeChange(size)}>
                {size}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="text-xs text-muted-foreground">{paginationInfoText}</div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPreviousPage} disabled={!hasPreviousPage || disablePaginationButtons}>
          {previousLabel}
        </Button>
        <span className="px-2 text-xs text-muted-foreground">
          {pageNumber} / {Math.max(totalPages, 1)}
        </span>
        <Button variant="outline" size="sm" onClick={onNextPage} disabled={!hasNextPage || disablePaginationButtons}>
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}
