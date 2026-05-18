import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { usePermissionGroupsQuery } from '../hooks/usePermissionGroupsQuery';

interface PermissionGroupMultiSelectProps {
  value: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

export function PermissionGroupMultiSelect({
  value,
  onChange,
  disabled = false,
}: PermissionGroupMultiSelectProps): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const { data, isLoading } = usePermissionGroupsQuery({
    pageNumber: 1,
    pageSize: 1000,
    sortBy: 'name',
    sortDirection: 'asc',
  });

  const items = (data?.data ?? []).filter((d) => d.isActive);

  const handleToggle = (id: number): void => {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const handleSelectAll = (checked: boolean): void => {
    if (checked) {
      onChange(items.map((i) => i.id));
    } else {
      onChange([]);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-slate-500 py-4">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="select-all-groups"
          className="h-4 w-4 rounded border border-input accent-primary"
          checked={items.length > 0 && value.length === items.length}
          onChange={(e) => handleSelectAll(e.target.checked)}
          disabled={disabled || items.length === 0}
        />
        <label htmlFor="select-all-groups" className="text-sm font-medium cursor-pointer">
          {t('userGroupAssignments.selectAll')}
        </label>
      </div>
      <div className="max-h-[200px] overflow-y-auto border rounded-lg p-2 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500 py-2">{t('userGroupAssignments.noGroups')}</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`group-${item.id}`}
                className="h-4 w-4 rounded border border-input accent-primary"
                checked={value.includes(item.id)}
                onChange={() => handleToggle(item.id)}
                disabled={disabled}
              />
              <label htmlFor={`group-${item.id}`} className="text-sm cursor-pointer flex-1">
                {item.name}
                {item.isSystemAdmin && (
                  <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">({t('common.systemAdmin')})</span>
                )}
              </label>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
