import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, BadgeCheck, Plus, Shield, Sparkles, Workflow } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { usePermissionAccess } from '../hooks/usePermissionAccess';
import { useWmsScopePoliciesQuery } from '../hooks/useWmsScopePoliciesQuery';
import { useCreateWmsScopePolicyMutation } from '../hooks/useCreateWmsScopePolicyMutation';
import { useUpdateWmsScopePolicyMutation } from '../hooks/useUpdateWmsScopePolicyMutation';
import { useDeleteWmsScopePolicyMutation } from '../hooks/useDeleteWmsScopePolicyMutation';
import { WmsScopePolicyForm } from './WmsScopePolicyForm';
import type { WmsScopePolicyDto } from '../types/access-control.types';
import type { CreateWmsScopePolicySchema } from '../schemas/wms-scope-policy-schema';

type PolicyColumnKey = 'code' | 'name' | 'entityType' | 'scopeType' | 'includeSelf' | 'isActive' | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'code', type: 'string', labelKey: 'wmsScopePolicies.table.code' },
  { value: 'name', type: 'string', labelKey: 'wmsScopePolicies.table.name' },
  { value: 'entityType', type: 'string', labelKey: 'wmsScopePolicies.table.entityType' },
  { value: 'scopeType', type: 'string', labelKey: 'wmsScopePolicies.table.scopeType' },
  { value: 'isActive', type: 'boolean', labelKey: 'wmsScopePolicies.table.isActive' },
];

const scopeTypeLabels: Record<string, string> = {
  unrestricted: 'Tam Erişim',
  branch: 'Şube Bazlı',
  warehouse: 'Depo Bazlı',
  'assigned-only': 'Sadece Atanan',
};

function mapSortBy(value: PolicyColumnKey): string {
  switch (value) {
    case 'code':
      return 'Code';
    case 'name':
      return 'Name';
    case 'entityType':
      return 'EntityType';
    case 'scopeType':
      return 'ScopeType';
    default:
      return 'UpdatedDate';
  }
}

export function WmsScopePoliciesPage(): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const { setPageTitle } = useUIStore();
  const queryClient = useQueryClient();
  const pageKey = 'access-control-wms-scope-policies';
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WmsScopePolicyDto | null>(null);
  const [deleteItem, setDeleteItem] = useState<WmsScopePolicyDto | null>(null);

  const pagedGrid = usePagedDataGrid<PolicyColumnKey>({
    pageKey,
    defaultSortBy: 'name',
    defaultSortDirection: 'asc',
    defaultPageSize: 20,
    mapSortBy,
  });

  const columns = useMemo<PagedDataGridColumn<PolicyColumnKey>[]>(() => [
    { key: 'code', label: t('wmsScopePolicies.table.code') },
    { key: 'name', label: t('wmsScopePolicies.table.name') },
    { key: 'entityType', label: t('wmsScopePolicies.table.entityType') },
    { key: 'scopeType', label: t('wmsScopePolicies.table.scopeType') },
    { key: 'includeSelf', label: t('wmsScopePolicies.table.includeSelf'), sortable: false },
    { key: 'isActive', label: t('wmsScopePolicies.table.isActive'), sortable: false },
    { key: 'actions', label: t('common.actions'), sortable: false },
  ], [t]);

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
  });

  const { data, isLoading, error } = useWmsScopePoliciesQuery(pagedGrid.queryParams);
  const createMutation = useCreateWmsScopePolicyMutation();
  const updateMutation = useUpdateWmsScopePolicyMutation();
  const deleteMutation = useDeleteWmsScopePolicyMutation();
  const permissionAccess = usePermissionAccess();
  const canCreate = permissionAccess.can('access-control.wms-scope-policies.create');
  const canUpdate = permissionAccess.can('access-control.wms-scope-policies.update');
  const canDelete = permissionAccess.can('access-control.wms-scope-policies.delete');

  useEffect(() => {
    setPageTitle(t('wmsScopePolicies.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const totalCount = data?.totalCount ?? data?.data?.length ?? 0;
  const activeCount = useMemo(() => (data?.data ?? []).filter((item) => item.isActive).length, [data?.data]);
  const entityTypeCount = useMemo(() => new Set((data?.data ?? []).map((item) => item.entityType)).size, [data?.data]);

  const exportColumns = useMemo(
    () => orderedVisibleColumns
      .filter((key) => key !== 'actions')
      .map((key) => ({ key, label: columns.find((column) => column.key === key)?.label ?? key })),
    [columns, orderedVisibleColumns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => (
    (data?.data ?? []).map((item) => ({
      code: item.code,
      name: item.name,
      entityType: item.entityType,
      scopeType: scopeTypeLabels[item.scopeType] ?? item.scopeType,
      includeSelf: item.includeSelf ? t('common.yes') : t('common.no'),
      isActive: item.isActive ? t('common.yes') : t('common.no'),
    }))
  ), [data?.data, t]);

  const handleRefresh = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['access-control', 'wms-scope-policies'] });
  };

  const handleSubmit = async (formData: CreateWmsScopePolicySchema): Promise<void> => {
    const dto = {
      ...formData,
      description: formData.description ?? undefined,
    };
    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, dto });
    } else {
      await createMutation.mutateAsync(dto);
    }
    setFormOpen(false);
    setEditingItem(null);
  };

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  const visibleColumnKeys = useMemo(
    () => orderedVisibleColumns.filter((key) => key !== 'actions') as PolicyColumnKey[],
    [orderedVisibleColumns],
  );

  const renderSortIcon = (columnKey: PolicyColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  const usedCodes = useMemo(() => (data?.data ?? []).map((item) => item.code), [data?.data]);

  return (
    <div className="w-full space-y-6 crm-page">
      <Breadcrumb items={[{ label: t('sidebar.accessControl') }, { label: t('sidebar.wmsScopePolicies'), isActive: true }]} />

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-linear-to-br from-white via-cyan-50/70 to-pink-50/70 p-5 shadow-sm dark:border-cyan-800/30 dark:from-blue-950/70 dark:via-blue-950/90 dark:to-cyan-950/40 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-cyan-200 bg-white/80 px-3 py-1.5 text-xs font-black text-cyan-700 shadow-sm dark:border-cyan-800/40 dark:bg-blue-950/60 dark:text-cyan-300">
              <Sparkles className="size-4" />
              {t('sidebar.wmsScopePolicies')}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{t('wmsScopePolicies.title')}</h1>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('wmsScopePolicies.description')}</p>
          </div>
          {canCreate ? (
            <Button onClick={() => { setEditingItem(null); setFormOpen(true); }} className="h-11 rounded-2xl border-0 bg-linear-to-r from-pink-600 to-orange-600 px-6 text-white shadow-lg shadow-pink-500/20 hover:text-white">
              <Plus size={18} className="mr-2" />
              {t('wmsScopePolicies.add')}
            </Button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/50">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-100 p-2.5 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"><Shield className="size-4" /></div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('wmsScopePolicies.stats.total')}</p>
                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{totalCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/50">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"><BadgeCheck className="size-4" /></div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('wmsScopePolicies.stats.active')}</p>
                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{activeCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/50">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-pink-100 p-2.5 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"><Workflow className="size-4" /></div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('wmsScopePolicies.stats.entities')}</p>
                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{entityTypeCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PagedDataGrid<WmsScopePolicyDto, PolicyColumnKey>
        columns={columns}
        visibleColumnKeys={visibleColumnKeys}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        renderCell={(item, columnKey) => {
          switch (columnKey) {
            case 'code':
              return <span className="font-mono text-xs">{item.code}</span>;
            case 'name':
              return <span className="font-semibold">{item.name}</span>;
            case 'entityType':
              return <Badge variant="secondary">{item.entityType}</Badge>;
            case 'scopeType':
              return <Badge variant="outline">{scopeTypeLabels[item.scopeType] ?? item.scopeType}</Badge>;
            case 'includeSelf':
              return item.includeSelf ? t('common.yes') : t('common.no');
            case 'isActive':
              return item.isActive
                ? <Badge className="rounded-xl border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{t('common.yes')}</Badge>
                : <Badge variant="secondary">{t('common.no')}</Badge>;
            case 'actions':
              return (
                <div className="flex items-center gap-2">
                  {canUpdate ? (
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => { setEditingItem(item); setFormOpen(true); }}>
                      {t('common.edit')}
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button size="sm" variant="outline" className="rounded-xl text-rose-600" onClick={() => setDeleteItem(item)}>
                      {t('common.delete')}
                    </Button>
                  ) : null}
                </div>
              );
            default:
              return null;
          }
        }}
        sortBy={pagedGrid.sortBy}
        sortDirection={pagedGrid.sortDirection}
        onSort={pagedGrid.handleSort}
        renderSortIcon={renderSortIcon}
        isLoading={isLoading}
        isError={!!error}
        errorText={error instanceof Error ? error.message : undefined}
        emptyText={t('common.noData')}
        pageSize={data?.pageSize ?? pagedGrid.pageSize}
        pageSizeOptions={pagedGrid.pageSizeOptions}
        onPageSizeChange={pagedGrid.handlePageSizeChange}
        pageNumber={pagedGrid.getDisplayPageNumber(data)}
        totalPages={Math.max(data?.totalPages ?? 1, 1)}
        hasPreviousPage={Boolean(data?.hasPreviousPage)}
        hasNextPage={Boolean(data?.hasNextPage)}
        onPreviousPage={pagedGrid.goToPreviousPage}
        onNextPage={pagedGrid.goToNextPage}
        previousLabel={t('common.previous')}
        nextLabel={t('common.next')}
        paginationInfoText={paginationInfoText}
        actionBar={{
          pageKey,
          userId,
          columns: columns.map(({ key, label }) => ({ key, label })),
          visibleColumns,
          columnOrder,
          onVisibleColumnsChange: setVisibleColumns,
          onColumnOrderChange: setColumnOrder,
          exportFileName: pageKey,
          exportColumns,
          exportRows,
          filterColumns: advancedFilterColumns,
          defaultFilterColumn: 'code',
          draftFilterRows: pagedGrid.draftFilterRows,
          onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
          filterLogic: pagedGrid.filterLogic,
          onFilterLogicChange: pagedGrid.setFilterLogic,
          onApplyFilters: pagedGrid.applyAdvancedFilters,
          onClearFilters: pagedGrid.clearAdvancedFilters,
          appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
          search: {
            value: pagedGrid.searchInput,
            onValueChange: pagedGrid.searchConfig.onValueChange,
            onSearchChange: pagedGrid.searchConfig.onSearchChange,
            placeholder: t('common.search'),
          },
          refresh: {
            onRefresh: handleRefresh,
            isLoading,
            label: t('common.refresh', { defaultValue: 'Yenile' }),
          },
          leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" />,
        }}
      />

      <WmsScopePolicyForm
        open={formOpen}
        onOpenChange={(next) => {
          setFormOpen(next);
          if (!next) setEditingItem(null);
        }}
        item={editingItem}
        isLoading={createMutation.isPending || updateMutation.isPending}
        usedCodes={usedCodes}
        onSubmit={handleSubmit}
      />

      <Dialog open={!!deleteItem} onOpenChange={(next) => !next && setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('wmsScopePolicies.delete.confirmTitle')}</DialogTitle>
            <DialogDescription>
              {t('wmsScopePolicies.delete.confirmMessage', { name: deleteItem?.name ?? deleteItem?.code ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>{t('common.cancel')}</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={async () => {
                if (!deleteItem) return;
                await deleteMutation.mutateAsync(deleteItem.id);
                setDeleteItem(null);
              }}
            >
              {deleteMutation.isPending ? t('common.processing') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
