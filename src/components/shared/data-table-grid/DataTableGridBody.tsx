import { type ReactElement, type ReactNode } from 'react';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { DataTableGridColumn } from '../DataTableGrid';
import { findColumn } from './shared';

interface DataTableGridBodyProps<TRow, TKey extends string> {
  columns: DataTableGridColumn<TKey>[];
  visibleColumnKeys: TKey[];
  rows: TRow[];
  rowKey: (row: TRow) => string | number;
  renderCell: (row: TRow, columnKey: TKey) => ReactNode;
  isLoading: boolean;
  isError: boolean;
  errorText: string;
  emptyText: string;
  pageSize: number;
  colSpan: number;
  showActionsColumn: boolean;
  renderActionsCell?: (row: TRow) => ReactNode;
  actionsCellClassName: string;
  iconOnlyActions: boolean;
  rowClassName?: string | ((row: TRow) => string | undefined);
  onRowClick?: (row: TRow) => void;
  onRowDoubleClick?: (row: TRow) => void;
  handleRowClick: (row: TRow) => void;
  handleRowDoubleClick: (row: TRow) => void;
}

export function DataTableGridBody<TRow, TKey extends string>({
  columns,
  visibleColumnKeys,
  rows,
  rowKey,
  renderCell,
  isLoading,
  isError,
  errorText,
  emptyText,
  pageSize,
  colSpan,
  showActionsColumn,
  renderActionsCell,
  actionsCellClassName,
  iconOnlyActions,
  rowClassName,
  onRowClick,
  onRowDoubleClick,
  handleRowClick,
  handleRowDoubleClick,
}: DataTableGridBodyProps<TRow, TKey>): ReactElement {
  return (
    <TableBody>
      {isLoading &&
        Array.from({ length: Math.min(pageSize, 10) }).map((_, i) => (
          <TableRow key={`skeleton-${i}`}>
            {visibleColumnKeys.map((key) => (
              <TableCell key={key}>
                <div className="h-5 w-full max-w-[120px] animate-pulse rounded bg-slate-200/60 dark:bg-white/10" />
              </TableCell>
            ))}
            {showActionsColumn && (
              <TableCell className="sticky right-0 bg-white text-right shadow-[-10px_0_16px_-14px_rgba(15,23,42,0.28)] dark:bg-[#130822]">
                <div className="ml-auto h-8 w-32 animate-pulse rounded bg-slate-200/60 dark:bg-white/10" />
              </TableCell>
            )}
          </TableRow>
        ))}

      {!isLoading && isError && (
        <TableRow>
          <TableCell colSpan={colSpan} className="py-8 text-center text-red-600">
            {errorText}
          </TableCell>
        </TableRow>
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <TableRow>
          <TableCell colSpan={colSpan} className="py-8 text-center text-muted-foreground">
            {emptyText}
          </TableCell>
        </TableRow>
      )}

      {!isLoading && !isError && rows.map((row) => {
        const customRowClass = typeof rowClassName === 'function' ? rowClassName(row) : rowClassName;
        return (
          <TableRow
            key={rowKey(row)}
            className={customRowClass}
            onClick={onRowClick || onRowDoubleClick ? () => handleRowClick(row) : undefined}
            onDoubleClick={onRowDoubleClick ? () => handleRowDoubleClick(row) : undefined}
          >
            {visibleColumnKeys.map((key) => {
              const column = findColumn(columns, key);
              return (
                <TableCell key={`${rowKey(row)}-${key}`} className={column?.cellClassName}>
                  {renderCell(row, key)}
                </TableCell>
              );
            })}
            {showActionsColumn && (
              <TableCell
                className={cn(
                  'sticky right-0 bg-white shadow-[-10px_0_16px_-14px_rgba(15,23,42,0.28)] dark:bg-[#130822]',
                  actionsCellClassName,
                  iconOnlyActions &&
                    '[&_button]:h-8 [&_button]:w-8 [&_button]:min-w-8 [&_button]:p-0 [&_button]:text-[0px] [&_button]:leading-none [&_button_span]:hidden [&_button_svg]:mx-auto [&_button_svg]:h-4 [&_button_svg]:w-4 [&_button_svg]:shrink-0'
                )}
                onClick={(event) => event.stopPropagation()}
                data-no-drag-scroll="true"
              >
                {renderActionsCell?.(row)}
              </TableCell>
            )}
          </TableRow>
        );
      })}
    </TableBody>
  );
}
