import type { TFunction } from 'i18next';

export type StatusCategoryKey =
  | 'waiting'
  | 'approved'
  | 'rejected'
  | 'arrived'
  | 'placed'
  | 'completed'
  | 'cancelled'
  | 'draft'
  | 'processing';

const STATUS_MATCHERS: Array<{ key: StatusCategoryKey; terms: string[] }> = [
  { key: 'waiting', terms: ['waiting', 'pending'] },
  { key: 'approved', terms: ['approved'] },
  { key: 'rejected', terms: ['rejected', 'reject'] },
  { key: 'arrived', terms: ['arrived', 'arrival'] },
  { key: 'placed', terms: ['placed', 'placement'] },
  { key: 'completed', terms: ['completed', 'done', 'finished'] },
  { key: 'cancelled', terms: ['cancelled', 'canceled'] },
  { key: 'draft', terms: ['draft'] },
  { key: 'processing', terms: ['processing', 'inprogress', 'in progress'] },
];

export const STATUS_CATEGORY_ORDER: readonly StatusCategoryKey[] = STATUS_MATCHERS.map((item) => item.key);

export function resolveStatusCategory(status: string | null | undefined): StatusCategoryKey | null {
  const value = (status ?? '').trim();
  if (!value) return null;
  const normalized = value.toLowerCase();
  const match = STATUS_MATCHERS.find((item) => item.terms.some((term) => normalized.includes(term)));
  return match ? match.key : null;
}

export function localizeStatus(status: string | null | undefined, t: TFunction<'common'>): string {
  const value = (status ?? '').trim();
  if (!value) return '-';
  const category = resolveStatusCategory(value);
  if (!category) return value;
  return t(`common.statusLabels.${category}`);
}

export function statusCategoryLabel(category: StatusCategoryKey, t: TFunction<'common'>): string {
  return t(`common.statusLabels.${category}`);
}
