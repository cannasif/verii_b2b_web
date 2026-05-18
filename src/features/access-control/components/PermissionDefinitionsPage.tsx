import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, KeyRound, Plus, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { usePermissionDefinitionsQuery } from '../hooks/usePermissionDefinitionsQuery';
import { useAllPermissionDefinitionCodesQuery } from '../hooks/useAllPermissionDefinitionCodesQuery';
import { useSyncPermissionDefinitionsMutation } from '../hooks/useSyncPermissionDefinitionsMutation';
import { useCreatePermissionDefinitionMutation } from '../hooks/useCreatePermissionDefinitionMutation';
import { useUpdatePermissionDefinitionMutation } from '../hooks/useUpdatePermissionDefinitionMutation';
import { useDeletePermissionDefinitionMutation } from '../hooks/useDeletePermissionDefinitionMutation';
import { usePermissionAccess } from '../hooks/usePermissionAccess';
import { PermissionDefinitionForm } from './PermissionDefinitionForm';
import type { PermissionDefinitionDto } from '../types/access-control.types';
import type { CreatePermissionDefinitionSchema } from '../schemas/permission-definition-schema';
import { getPermissionDisplayMeta, isPermissionCodeAvailableOnMobile, PERMISSION_CODE_CATALOG } from '../utils/permission-config';

type PermissionDefinitionColumnKey = 'code' | 'name' | 'platforms' | 'isActive' | 'updatedDate' | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'code', type: 'string', labelKey: 'permissionDefinitions.table.code' },
  { value: 'name', type: 'string', labelKey: 'permissionDefinitions.table.name' },
  { value: 'description', type: 'string', labelKey: 'permissionDefinitions.form.description.label' },
  { value: 'availableOnWeb', type: 'boolean', labelKey: 'permissionDefinitions.form.availableOnWeb' },
  { value: 'availableOnMobile', type: 'boolean', labelKey: 'permissionDefinitions.form.availableOnMobile' },
  { value: 'isActive', type: 'boolean', labelKey: 'permissionDefinitions.table.isActive' },
];

function mapSortBy(value: PermissionDefinitionColumnKey): string {
  switch (value) {
    case 'code':
      return 'Code';
    case 'name':
      return 'Name';
    case 'updatedDate':
    default:
      return 'UpdatedDate';
  }
}

export function PermissionDefinitionsPage(): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const { setPageTitle } = useUIStore();
  const pageKey = 'access-control-permission-definitions';
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PermissionDefinitionDto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PermissionDefinitionDto | null>(null);

  const pagedGrid = usePagedDataGrid<PermissionDefinitionColumnKey>({
    pageKey,
    defaultSortBy: 'updatedDate',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy,
  });

  const columns = useMemo<PagedDataGridColumn<PermissionDefinitionColumnKey>[]>(
    () => [
      { key: 'code', label: t('permissionDefinitions.table.code') },
      { key: 'name', label: t('permissionDefinitions.table.name') },
      { key: 'platforms', label: 'Platformlar', sortable: false },
      { key: 'isActive', label: t('permissionDefinitions.table.isActive'), sortable: false },
      { key: 'updatedDate', label: t('permissionDefinitions.table.updatedDate') },
      { key: 'actions', label: t('common.actions'), sortable: false },
    ],
    [t],
  );

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
  });

  const { data, isLoading, error } = usePermissionDefinitionsQuery(pagedGrid.queryParams);
  const createMutation = useCreatePermissionDefinitionMutation();
  const updateMutation = useUpdatePermissionDefinitionMutation();
  const deleteMutation = useDeletePermissionDefinitionMutation();
  const syncMutation = useSyncPermissionDefinitionsMutation();
  const permissionAccess = usePermissionAccess();
  const canCreate = permissionAccess.can('access-control.permission-definitions.create');
  const canUpdate = permissionAccess.can('access-control.permission-definitions.update');
  const canDelete = permissionAccess.can('access-control.permission-definitions.delete');
  const { data: allUsedCodes } = useAllPermissionDefinitionCodesQuery(formOpen);
  const totalCount = data?.totalCount ?? data?.data?.length ?? 0;
  const activeCount = useMemo(() => (data?.data ?? []).filter((item) => item.isActive).length, [data?.data]);

  useEffect(() => {
    setPageTitle(t('permissionDefinitions.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  const exportColumns = useMemo(
    () => orderedVisibleColumns
      .filter((key) => key !== 'actions')
      .map((key) => ({
        key,
        label: columns.find((column) => column.key === key)?.label ?? key,
      })),
    [columns, orderedVisibleColumns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => {
    return (data?.data ?? []).map((item) => {
      const meta = getPermissionDisplayMeta(item.code);
      const displayName = meta ? t(meta.key, meta.fallback) : item.name;
      return {
        code: item.code,
        name: displayName,
        platforms: [item.availableOnWeb ? 'Web' : null, item.availableOnMobile ? 'Mobile' : null].filter(Boolean).join(', '),
        isActive: item.isActive ? t('common.yes') : t('common.no'),
        updatedDate: item.updatedDate ? new Date(item.updatedDate).toLocaleDateString() : '-',
      };
    });
  }, [data?.data, t]);

  const handleRefresh = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['permissions', 'definitions'] });
  };

  const handleSyncFromRoutes = async (): Promise<void> => {
      const items = PERMISSION_CODE_CATALOG.map((code) => {
      const meta = getPermissionDisplayMeta(code);
      const name = meta ? t(meta.key, meta.fallback) : code;
      return { code, name, isActive: true, availableOnWeb: true, availableOnMobile: isPermissionCodeAvailableOnMobile(code) };
    });

    await syncMutation.mutateAsync({ items });
  };

  const handleFormSubmit = async (formData: CreatePermissionDefinitionSchema): Promise<void> => {
    const dto = {
      ...formData,
      isActive: editingItem?.isActive ?? true,
      description: formData.description ?? undefined,
      availableOnWeb: formData.availableOnWeb,
      availableOnMobile: formData.availableOnMobile,
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
    () => orderedVisibleColumns.filter((key) => key !== 'actions') as PermissionDefinitionColumnKey[],
    [orderedVisibleColumns],
  );

  const renderSortIcon = (columnKey: PermissionDefinitionColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  return (
    <div className="w-full space-y-6 crm-page">
      <Breadcrumb items={[{ label: t('sidebar.accessControl') }, { label: t('sidebar.permissionDefinitions'), isActive: true }]} />

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-linear-to-br from-white via-cyan-50/70 to-pink-50/70 p-5 shadow-sm dark:border-cyan-800/30 dark:from-blue-950/70 dark:via-blue-950/90 dark:to-cyan-950/40 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-cyan-200 bg-white/80 px-3 py-1.5 text-xs font-black text-cyan-700 shadow-sm dark:border-cyan-800/40 dark:bg-blue-950/60 dark:text-cyan-300">
              <Sparkles className="size-4" />
              {t('sidebar.permissionDefinitions')}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 transition-colors dark:text-white">
              {t('permissionDefinitions.title')}
            </h1>
            <p className="text-sm font-medium text-slate-600 transition-colors dark:text-slate-300">
              {t('permissionDefinitions.description')}
            </p>
          </div>
          {canCreate ? (
            <Button
              onClick={() => {
                setEditingItem(null);
                setFormOpen(true);
              }}
              className="h-11 rounded-2xl border-0 bg-linear-to-r from-pink-600 to-orange-600 px-6 text-white shadow-lg shadow-pink-500/20 hover:text-white"
            >
              <Plus size={18} className="mr-2" />
              {t('permissionDefinitions.add')}
            </Button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/50">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-100 p-2.5 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                <KeyRound className="size-4" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('permissionDefinitions.title')}</p>
                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{totalCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/50">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('permissionDefinitions.table.isActive')}</p>
                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{activeCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/50">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-pink-100 p-2.5 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
                <RefreshCw className="size-4" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Route Sync</p>
                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{PERMISSION_CODE_CATALOG.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/3">
        <PagedDataGrid<PermissionDefinitionDto, PermissionDefinitionColumnKey>
          columns={columns}
          visibleColumnKeys={visibleColumnKeys}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(item, columnKey) => {
            switch (columnKey) {
              case 'code':
                return <span className="font-mono text-sm">{item.code}</span>;
              case 'name': {
                const meta = getPermissionDisplayMeta(item.code);
                const displayName = meta ? t(meta.key, meta.fallback) : item.name;
                const showOriginal = Boolean(meta && item.name.trim().toLowerCase() !== displayName.trim().toLowerCase());
                return (
                  <div className="flex flex-col">
                    <span>{displayName}</span>
                    {showOriginal ? (
                      <span className="text-xs text-slate-500 dark:text-slate-400">{item.name}</span>
                    ) : null}
                  </div>
                );
              }
              case 'isActive':
                return (
                  <Badge variant={item.isActive ? 'default' : 'secondary'}>
                    {item.isActive ? t('common.yes') : t('common.no')}
                  </Badge>
                );
              case 'platforms':
                return (
                  <div className="flex flex-wrap gap-2">
                    {item.availableOnWeb ? <Badge variant="secondary">Web</Badge> : null}
                    {item.availableOnMobile ? <Badge variant="secondary">Mobile</Badge> : null}
                  </div>
                );
              case 'updatedDate':
                return <span className="text-sm text-slate-500">{item.updatedDate ? new Date(item.updatedDate).toLocaleDateString() : '-'}</span>;
              case 'actions':
              default:
                return null;
            }
          }}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(columnKey) => {
            if (columnKey === 'isActive' || columnKey === 'platforms' || columnKey === 'actions') return;
            pagedGrid.handleSort(columnKey);
          }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('common.errors.loadFailed', { defaultValue: t('common.errors.permissionDefinitionListLoadFailed', { defaultValue: 'Missing translation' }) })}
          emptyText={t('common.noData')}
          showActionsColumn={orderedVisibleColumns.includes('actions') && (canUpdate || canDelete)}
          actionsHeaderLabel={t('common.actions')}
          renderActionsCell={(item) => (
            canUpdate || canDelete ? (
              <>
                {canUpdate ? (
                  <Button variant="ghost" size="sm" className="rounded-xl text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 dark:text-slate-300 dark:hover:bg-cyan-900/30 dark:hover:text-cyan-300" onClick={() => {
                    setEditingItem(item);
                    setFormOpen(true);
                  }}>
                    <span>{t('common.edit')}</span>
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button variant="ghost" size="sm" className="rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30" onClick={() => {
                    setItemToDelete(item);
                    setDeleteDialogOpen(true);
                  }}>
                    <span>{t('common.delete')}</span>
                  </Button>
                ) : null}
              </>
            ) : null
          )}
          iconOnlyActions={false}
          pageSize={pagedGrid.pageSize}
          pageSizeOptions={pagedGrid.pageSizeOptions}
          onPageSizeChange={pagedGrid.handlePageSizeChange}
          pageNumber={pagedGrid.getDisplayPageNumber(data)}
          totalPages={data?.totalPages ?? 1}
          hasPreviousPage={data?.hasPreviousPage ?? false}
          hasNextPage={data?.hasNextPage ?? false}
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
            translationNamespace: 'common',
            appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
            search: {
              ...pagedGrid.searchConfig,
              placeholder: t('common.search'),
              className: 'h-9 w-full md:w-64',
            },
            leftSlot: (
              <div className="flex items-center gap-2">
                <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" />
                {canCreate ? (
                  <Button variant="outline" size="sm" onClick={() => void handleSyncFromRoutes()} disabled={isLoading || syncMutation.isPending}>
                    <RefreshCw size={16} className={syncMutation.isPending ? 'mr-2 animate-spin' : 'mr-2'} />
                    {t('permissionDefinitions.syncFromRoutes')}
                  </Button>
                ) : null}
                <Button variant="outline" size="sm" onClick={() => void handleRefresh()} disabled={isLoading}>
                  <RefreshCw size={16} className={isLoading ? 'mr-2 animate-spin' : 'mr-2'} />
                  {t('common.refresh')}
                </Button>
              </div>
            ),
          }}
        />
      </div>

      <PermissionDefinitionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        item={editingItem}
        usedCodes={allUsedCodes}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="overflow-hidden border-slate-200 bg-white p-0 shadow-2xl dark:border-cyan-800/30 dark:bg-blue-950">
          <DialogHeader className="border-b border-slate-100 bg-slate-50/80 px-6 py-5 dark:border-cyan-800/30 dark:bg-blue-900/20">
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">{t('permissionDefinitions.delete.confirmTitle')}</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              {t('permissionDefinitions.delete.confirmMessage', {
                name: itemToDelete?.name ?? '',
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t border-slate-100 bg-slate-50/80 px-6 py-5 dark:border-cyan-800/30 dark:bg-blue-900/20">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteMutation.isPending}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void (async () => {
                if (!itemToDelete) return;
                await deleteMutation.mutateAsync(itemToDelete.id);
                setDeleteDialogOpen(false);
                setItemToDelete(null);
              })()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t('common.processing') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
