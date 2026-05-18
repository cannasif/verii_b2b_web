import type { DataTableGridColumn } from '../DataTableGrid';

export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest('button, a, input, select, textarea, label, [role="button"], [data-no-drag-scroll="true"]')
  );
}

export function findColumn<TKey extends string>(
  columns: DataTableGridColumn<TKey>[],
  key: TKey,
): DataTableGridColumn<TKey> | undefined {
  return columns.find((item) => item.key === key);
}
