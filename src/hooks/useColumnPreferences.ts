import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { loadColumnPreferences } from '@/lib/column-preferences';
import type { ColumnDef } from '@/components/shared';

interface UseColumnPreferencesOptions {
  pageKey: string;
  columns: ColumnDef[];
  idColumnKey?: string;
}

interface UseColumnPreferencesResult {
  userId?: number;
  columnOrder: string[];
  visibleColumns: string[];
  orderedVisibleColumns: string[];
  setColumnOrder: (order: string[]) => void;
  setVisibleColumns: (columns: string[]) => void;
}

function arraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function useColumnPreferences({
  pageKey,
  columns,
  idColumnKey = 'id',
}: UseColumnPreferencesOptions): UseColumnPreferencesResult {
  const userId = useAuthStore((state) => state.user?.id);
  const columnSignature = columns.map((column) => column.key).join('|');
  const defaultOrder = useMemo(() => (columnSignature ? columnSignature.split('|') : []), [columnSignature]);
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultOrder);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultOrder);

  useEffect(() => {
    const prefs = loadColumnPreferences(pageKey, userId, defaultOrder, idColumnKey);
    const validOrder = prefs.order.filter((key) => defaultOrder.includes(key));
    const normalizedOrder = validOrder.length > 0 ? validOrder : defaultOrder;
    const validVisible = prefs.visibleKeys.filter((key) => normalizedOrder.includes(key));
    const normalizedVisible = validVisible.length > 0 ? validVisible : normalizedOrder;

    setColumnOrder((current) => (arraysEqual(current, normalizedOrder) ? current : normalizedOrder));
    setVisibleColumns((current) => (arraysEqual(current, normalizedVisible) ? current : normalizedVisible));
  }, [columnSignature, defaultOrder, idColumnKey, pageKey, userId]);

  const orderedVisibleColumns = useMemo(
    () => columnOrder.filter((key) => visibleColumns.includes(key)),
    [columnOrder, visibleColumns]
  );

  return {
    userId,
    columnOrder,
    visibleColumns,
    orderedVisibleColumns,
    setColumnOrder,
    setVisibleColumns,
  };
}
