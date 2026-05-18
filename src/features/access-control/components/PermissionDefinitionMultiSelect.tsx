import { type ReactElement, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { usePermissionDefinitionsQuery } from '../hooks/usePermissionDefinitionsQuery';
import {
  getPermissionActionLabel,
  getPermissionDisplayMeta,
  getPermissionModuleDisplayMeta,
  getPermissionScope,
  getPermissionScopeDisplayMeta,
  isLeafPermissionCode,
} from '../utils/permission-config';

interface PermissionDefinitionMultiSelectProps {
  value: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

export function PermissionDefinitionMultiSelect({
  value,
  onChange,
  disabled = false,
}: PermissionDefinitionMultiSelectProps): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const { data, isLoading } = usePermissionDefinitionsQuery({
    pageNumber: 1,
    pageSize: 1000,
    sortBy: 'code',
    sortDirection: 'asc',
  });

  const items = (data?.data ?? []).filter((d) => d.isActive && isLeafPermissionCode(d.code));
  const [search, setSearch] = useState('');

  const getDisplayLabel = useCallback(
    (code: string, name: string | null | undefined): string => {
      const trimmedName = (name ?? '').trim();
      if (trimmedName) return trimmedName;
      const meta = getPermissionDisplayMeta(code);
      if (meta) return t(meta.key, meta.fallback);
      return code;
    },
    [t]
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const display = getDisplayLabel(item.code, item.name);
      return (item.code ?? '').toLowerCase().includes(q) || (item.name ?? '').toLowerCase().includes(q) || display.toLowerCase().includes(q);
    });
  }, [items, search, getDisplayLabel]);

  const groupedItems = useMemo(() => {
    const buckets = new Map<string, typeof filteredItems>();
    for (const item of filteredItems) {
      const code = item.code ?? '';
      const scope = getPermissionScope(code);
      const scopeMeta = getPermissionScopeDisplayMeta(scope);
      const prefix = code.split('.').filter(Boolean)[0] ?? 'other';
      const moduleMeta = getPermissionModuleDisplayMeta(prefix);
      const groupLabel = scopeMeta
        ? t(scopeMeta.key, scopeMeta.fallback)
        : moduleMeta
          ? t(moduleMeta.key, moduleMeta.fallback)
          : scope;
      const existing = buckets.get(groupLabel);
      if (existing) {
        existing.push(item);
      } else {
        buckets.set(groupLabel, [item]);
      }
    }

    const actionOrder = ['view', 'create', 'update', 'delete'] as const;
    const sorted = Array.from(buckets.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return sorted.map(([groupLabel, groupItems]) => {
      const actionBuckets = new Map<string, typeof groupItems>();

      groupItems.forEach((item) => {
        const parts = item.code?.split('.').filter(Boolean) ?? [];
        const action = parts.length > 0 ? parts[parts.length - 1] : 'view';
        const current = actionBuckets.get(action) ?? [];
        current.push(item);
        actionBuckets.set(action, current);
      });

      const actions = actionOrder
        .filter((action) => actionBuckets.has(action))
        .map((action) => ({
          action,
          items: (actionBuckets.get(action) ?? []).sort((a, b) => (a.code ?? '').localeCompare(b.code ?? '')),
        }));

      return {
        groupLabel,
        actions,
      };
    });
  }, [filteredItems, t]);

  const selectionSummary = useMemo(() => {
    const selected = new Set<number>(value);
    const counts = {
      view: 0,
      create: 0,
      update: 0,
      delete: 0,
    };

    items.forEach((item) => {
      if (!selected.has(item.id)) return;
      const parts = item.code?.split('.').filter(Boolean) ?? [];
      const action = parts[parts.length - 1] as keyof typeof counts;
      if (action in counts) {
        counts[action] += 1;
      }
    });

    return counts;
  }, [items, value]);

  const handleToggle = (id: number): void => {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const handleSelectAll = (checked: boolean): void => {
    if (checked) {
      const ids = new Set<number>(value);
      for (const item of filteredItems) ids.add(item.id);
      onChange(Array.from(ids));
    } else {
      const filteredIds = new Set<number>(filteredItems.map((i) => i.id));
      onChange(value.filter((id) => !filteredIds.has(id)));
    }
  };

  const isActionFullySelected = useCallback((ids: number[]): boolean => {
    if (ids.length === 0) return false;
    const selected = new Set<number>(value);
    return ids.every((id) => selected.has(id));
  }, [value]);

  const handleActionToggle = useCallback((ids: number[], checked: boolean): void => {
    if (ids.length === 0) return;

    if (checked) {
      const merged = new Set<number>(value);
      ids.forEach((id) => merged.add(id));
      onChange(Array.from(merged));
      return;
    }

    const blocked = new Set<number>(ids);
    onChange(value.filter((id) => !blocked.has(id)));
  }, [onChange, value]);

  const allFilteredSelected = useMemo(() => {
    if (filteredItems.length === 0) return false;
    const selected = new Set<number>(value);
    return filteredItems.every((i) => selected.has(i.id));
  }, [filteredItems, value]);

  if (isLoading) {
    return <div className="text-sm text-slate-500 py-4">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-slate-200/70 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {t('permissionGroups.permissionsPanel.selectionSummaryTitle', { defaultValue: 'Missing translation' })}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="secondary">
            {t('common.view', { defaultValue: 'Missing translation' })}: {selectionSummary.view}
          </Badge>
          <Badge variant="secondary">
            {t('common.create', { defaultValue: 'Missing translation' })}: {selectionSummary.create}
          </Badge>
          <Badge variant="secondary">
            {t('common.update', { defaultValue: 'Missing translation' })}: {selectionSummary.update}
          </Badge>
          <Badge variant="secondary">
            {t('common.delete', { defaultValue: 'Missing translation' })}: {selectionSummary.delete}
          </Badge>
        </div>
        <div className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {t('permissionGroups.permissionsPanel.selectionSummaryBody', { defaultValue: 'Missing translation' })}
        </div>
      </div>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('permissionGroups.permissionsPanel.searchPlaceholder', { defaultValue: 'Missing translation' })}
        disabled={disabled}
      />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="select-all-permissions"
          className="h-4 w-4 rounded border border-input accent-primary"
          checked={allFilteredSelected}
          onChange={(e) => handleSelectAll(e.target.checked)}
          disabled={disabled || filteredItems.length === 0}
        />
        <label htmlFor="select-all-permissions" className="text-sm font-medium cursor-pointer">
          {t('permissionGroups.selectAll')}
        </label>
      </div>
      <div className="min-h-[160px] max-h-[240px] overflow-y-auto border rounded-lg p-2 space-y-2 custom-scrollbar">
        {filteredItems.length === 0 ? (
          <p className="text-sm text-slate-500 py-2">{t('permissionGroups.noDefinitions')}</p>
        ) : (
          groupedItems.map(({ groupLabel, actions }) => (
            <div key={groupLabel} className="space-y-2">
              <div className="rounded-lg border border-slate-200/70 bg-slate-50/70 px-2 py-1.5 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                {groupLabel}
              </div>
              {actions.map(({ action, items: actionItems }) => {
                const actionLabel = getPermissionActionLabel(`scope.${action}`);
                const actionIds = actionItems.map((item) => item.id);
                const actionSelected = isActionFullySelected(actionIds);
                const actionDescription = t(`accessControl.permissionActions.${action}.description`, {
                  defaultValue:
                    action === 'view'
                      ? 'Listeleme, detay ve izleme ekranlarini acar.'
                      : action === 'create'
                        ? 'Yeni kayit olusturma ve ilk kaydetme islemlerini acar.'
                        : action === 'update'
                          ? 'Duzenleme, process ve degisiklik kaydetme islemlerini acar.'
                          : 'Soft delete, pasife alma veya silme aksiyonlarini acar.',
                });
                return (
                  <div key={`${groupLabel}-${action}`} className="space-y-1 pl-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {t(actionLabel.key, actionLabel.fallback)}
                        </div>
                        <div className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                          {actionDescription}
                        </div>
                      </div>
                      <label className="flex shrink-0 items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border border-input accent-primary"
                          checked={actionSelected}
                          onChange={(e) => handleActionToggle(actionIds, e.target.checked)}
                          disabled={disabled}
                        />
                        <span>
                          {t('permissionGroups.permissionsPanel.selectActionGroup', {
                            defaultValue: 'Missing translation',
                            action: t(actionLabel.key, actionLabel.fallback),
                          })}
                        </span>
                      </label>
                    </div>
                    {actionItems.map((item) => {
                      const display = getDisplayLabel(item.code, item.name);
                      return (
                        <div key={item.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`perm-${item.id}`}
                            className="h-4 w-4 rounded border border-input accent-primary"
                            checked={value.includes(item.id)}
                            onChange={() => handleToggle(item.id)}
                            disabled={disabled}
                          />
                          <label htmlFor={`perm-${item.id}`} className="text-sm cursor-pointer flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <span className="truncate">{display}</span>
                              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{item.code}</span>
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
