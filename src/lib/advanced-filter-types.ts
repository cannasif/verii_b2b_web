import type { PagedFilter } from '@/types/api';

export type FilterRow = {
  id: string;
  column: string;
  operator: string;
  value: string;
};

export type FilterColumnConfig = {
  value: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  labelKey: string;
  label?: string;
};

export function inferFilterColumnType(columnKey: string): FilterColumnConfig['type'] {
  if (columnKey === 'isActive') {
    return 'boolean';
  }
  return 'string';
}

export const STRING_OPERATORS = ['Contains', 'StartsWith', 'EndsWith', 'Equals'] as const;
export const NUMERIC_DATE_OPERATORS = ['Equals', '>', '>=', '<', '<='] as const;

export function getOperatorsForColumn(
  column: string,
  columns: readonly FilterColumnConfig[]
): readonly string[] {
  const config = columns.find((item) => item.value === column);
  if (!config) return STRING_OPERATORS;
  if (config.type === 'string') return STRING_OPERATORS;
  if (config.type === 'boolean') return ['Equals'] as const;
  return NUMERIC_DATE_OPERATORS;
}

export function getDefaultOperatorForColumn(
  column: string,
  columns: readonly FilterColumnConfig[]
): string {
  const config = columns.find((item) => item.value === column);
  if (!config) return 'Contains';
  if (config.type === 'string') return 'Contains';
  return 'Equals';
}

export function rowToBackendFilter(row: FilterRow): PagedFilter | null {
  const value = row.value.trim();
  if (!value) return null;
  return { column: row.column, operator: row.operator, value };
}

export function rowsToBackendFilters(rows: FilterRow[]): PagedFilter[] {
  const out: PagedFilter[] = [];
  for (const row of rows) {
    const filter = rowToBackendFilter(row);
    if (filter) out.push(filter);
  }
  return out;
}
