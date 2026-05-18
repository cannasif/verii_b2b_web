import { type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactElement, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { DataTableActionBar, type DataTableActionBarProps } from './DataTableActionBar';
import { FieldHelpTooltip } from '@/features/access-control/components/FieldHelpTooltip';
import { DataTableGridBody } from './data-table-grid/DataTableGridBody';
import { DataTableGridPagination } from './data-table-grid/DataTableGridPagination';
import { findColumn, isInteractiveTarget } from './data-table-grid/shared';

export type DataTableSortDirection = 'asc' | 'desc';

export interface DataTableGridColumn<TKey extends string> {
  key: TKey;
  label: string;
  headerHelpText?: string;
  sortable?: boolean;
  headClassName?: string;
  cellClassName?: string;
}

interface DataTableGridProps<TRow, TKey extends string> {
  pageKey?: string;
  actionBar?: DataTableActionBarProps;
  toolbar?: ReactNode;
  columns: DataTableGridColumn<TKey>[];
  visibleColumnKeys: TKey[];
  rows: TRow[];
  rowKey: (row: TRow) => string | number;
  renderCell: (row: TRow, columnKey: TKey) => ReactNode;
  sortBy?: TKey;
  sortDirection?: DataTableSortDirection;
  onSort?: (columnKey: TKey) => void;
  renderSortIcon?: (columnKey: TKey) => ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  loadingText?: string;
  errorText?: string;
  emptyText?: string;
  minTableWidthClassName?: string;
  showActionsColumn?: boolean;
  actionsHeaderLabel?: string;
  renderActionsCell?: (row: TRow) => ReactNode;
  actionsCellClassName?: string;
  iconOnlyActions?: boolean;
  rowClassName?: string | ((row: TRow) => string | undefined);
  onRowClick?: (row: TRow) => void;
  onRowDoubleClick?: (row: TRow) => void;
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageSizeChange: (size: number) => void;
  pageNumber: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  previousLabel: string;
  nextLabel: string;
  paginationInfoText: string;
  disablePaginationButtons?: boolean;
}

const tableScrollPositions = new Map<string, number>();

export function DataTableGrid<TRow, TKey extends string>({
  pageKey,
  actionBar,
  toolbar,
  columns,
  visibleColumnKeys,
  rows,
  rowKey,
  renderCell,
  onSort,
  renderSortIcon,
  isLoading = false,
  isError = false,
  errorText = 'An error occurred while loading rows.',
  emptyText = 'No rows found.',
  minTableWidthClassName = 'min-w-[1200px]',
  showActionsColumn = false,
  actionsHeaderLabel = '',
  renderActionsCell,
  actionsCellClassName = 'text-right align-middle',
  iconOnlyActions = true,
  rowClassName,
  onRowClick,
  onRowDoubleClick,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  pageNumber,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPreviousPage,
  onNextPage,
  previousLabel,
  nextLabel,
  paginationInfoText,
  disablePaginationButtons = false,
}: DataTableGridProps<TRow, TKey>): ReactElement {
  const [isDragging, setIsDragging] = useState(false);
  const lastRowClickRef = useRef<{ key: string | number; timestamp: number } | null>(null);
  const suppressNativeDoubleClickUntilRef = useRef(0);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const resolvedScrollKey = pageKey ?? actionBar?.pageKey ?? null;
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
    pointerId: -1,
  });

  const handleDragStart = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (isInteractiveTarget(event.target)) return;
    const container = tableScrollRef.current;
    if (!container) return;
    dragStateRef.current = {
      isDragging: true,
      startX: event.clientX,
      startScrollLeft: container.scrollLeft,
      moved: false,
      pointerId: event.pointerId,
    };
    setIsDragging(true);
    tableScrollRef.current?.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const container = tableScrollRef.current;
    if (!container || !dragStateRef.current.isDragging || dragStateRef.current.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - dragStateRef.current.startX;
    if (Math.abs(deltaX) > 4) {
      dragStateRef.current.moved = true;
    }
    container.scrollLeft = dragStateRef.current.startScrollLeft - deltaX;
  };

  const handleDragEnd = (): void => {
    dragStateRef.current.isDragging = false;
    dragStateRef.current.pointerId = -1;
    setIsDragging(false);
  };

  const handleClickCapture = (event: ReactMouseEvent<HTMLDivElement>): void => {
    if (!dragStateRef.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
    dragStateRef.current.moved = false;
  };

  const handleRowClick = (row: TRow): void => {
    const key = rowKey(row);
    const now = Date.now();
    const lastClick = lastRowClickRef.current;
    const isFastSecondClick = lastClick != null && lastClick.key === key && now - lastClick.timestamp <= 320;

    onRowClick?.(row);

    if (isFastSecondClick && onRowDoubleClick) {
      suppressNativeDoubleClickUntilRef.current = now + 400;
      onRowDoubleClick(row);
      lastRowClickRef.current = null;
      return;
    }

    lastRowClickRef.current = { key, timestamp: now };
  };

  const handleRowDoubleClick = (row: TRow): void => {
    if (!onRowDoubleClick) return;
    if (Date.now() <= suppressNativeDoubleClickUntilRef.current) return;
    onRowDoubleClick(row);
  };

  const colSpan = visibleColumnKeys.length + (showActionsColumn ? 1 : 0) || 1;

  useLayoutEffect(() => {
    if (!resolvedScrollKey) return;
    const container = tableScrollRef.current;
    if (!container) return;
    const saved = tableScrollPositions.get(resolvedScrollKey);
    if (typeof saved === 'number' && Number.isFinite(saved)) {
      container.scrollLeft = saved;
    }
  }, [resolvedScrollKey, visibleColumnKeys.length, rows.length, isLoading, isError]);

  useEffect(() => {
    if (!resolvedScrollKey) return;
    const container = tableScrollRef.current;
    if (!container) return;
    const handleScroll = (): void => {
      tableScrollPositions.set(resolvedScrollKey, container.scrollLeft);
    };
    handleScroll();
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [resolvedScrollKey]);

  return (
    <div className="min-w-0 w-full space-y-4">
      {actionBar ? <DataTableActionBar {...actionBar} /> : toolbar}
      <div
        ref={tableScrollRef}
        className={cn(
          'w-full min-w-0 overflow-x-auto [scrollbar-gutter:stable] custom-scrollbar-lg rounded-2xl border border-slate-200/70 bg-white dark:border-white/10 dark:bg-[#130822]',
          isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
        )}
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        onClickCapture={handleClickCapture}
      >
        <Table className={minTableWidthClassName}>
          <TableHeader>
            <TableRow>
              {visibleColumnKeys.map((key) => {
                const column = findColumn(columns, key);
                const sortable = Boolean(onSort && column?.sortable !== false);
                return (
                  <TableHead key={key} className={column?.headClassName}>
                    {sortable ? (
                      <Button variant="ghost" size="sm" onClick={() => onSort?.(key)} className="h-7 -ml-1 gap-1 px-1 hover:bg-transparent">
                        <span>{column?.label ?? key}</span>
                        {column?.headerHelpText ? <FieldHelpTooltip text={column.headerHelpText} side="top" /> : null}
                        {renderSortIcon?.(key)}
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <span>{column?.label ?? key}</span>
                        {column?.headerHelpText ? <FieldHelpTooltip text={column.headerHelpText} side="top" /> : null}
                      </span>
                    )}
                  </TableHead>
                );
              })}
              {showActionsColumn && (
                <TableHead className="sticky right-0 z-10 w-[156px] min-w-[156px] bg-white text-right shadow-[-10px_0_16px_-14px_rgba(15,23,42,0.28)] dark:bg-[#130822]">
                  {actionsHeaderLabel}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <DataTableGridBody
            columns={columns}
            visibleColumnKeys={visibleColumnKeys}
            rows={rows}
            rowKey={rowKey}
            renderCell={renderCell}
            isLoading={isLoading}
            isError={isError}
            errorText={errorText}
            emptyText={emptyText}
            pageSize={pageSize}
            colSpan={colSpan}
            showActionsColumn={showActionsColumn}
            renderActionsCell={renderActionsCell}
            actionsCellClassName={actionsCellClassName}
            iconOnlyActions={iconOnlyActions}
            rowClassName={rowClassName}
            onRowClick={onRowClick}
            onRowDoubleClick={onRowDoubleClick}
            handleRowClick={handleRowClick}
            handleRowDoubleClick={handleRowDoubleClick}
          />
        </Table>
      </div>

      <DataTableGridPagination
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageSizeChange={onPageSizeChange}
        paginationInfoText={paginationInfoText}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
        hasPreviousPage={hasPreviousPage}
        hasNextPage={hasNextPage}
        disablePaginationButtons={disablePaginationButtons}
        previousLabel={previousLabel}
        nextLabel={nextLabel}
        pageNumber={pageNumber}
        totalPages={totalPages}
      />
    </div>
  );
}
