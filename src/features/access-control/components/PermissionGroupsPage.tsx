import { type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, KeyRound, Plus, RefreshCw, Settings, ShieldCheck, Sparkles, Users2 } from 'lucide-react';
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
import { usePermissionGroupsQuery } from '../hooks/usePermissionGroupsQuery';
import { useCreatePermissionGroupMutation } from '../hooks/useCreatePermissionGroupMutation';
import { useUpdatePermissionGroupMutation } from '../hooks/useUpdatePermissionGroupMutation';
import { useDeletePermissionGroupMutation } from '../hooks/useDeletePermissionGroupMutation';
import { usePermissionAccess } from '../hooks/usePermissionAccess';
import { PermissionGroupForm } from './PermissionGroupForm';
import { GroupPermissionsPanel } from './GroupPermissionsPanel';
import type { PermissionGroupDto } from '../types/access-control.types';
import type { CreatePermissionGroupSchema } from '../schemas/permission-group-schema';

type PermissionGroupColumnKey = 'name' | 'isSystemAdmin' | 'isActive' | 'permissionCount' | 'actions';

const advancedFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'name', type: 'string', labelKey: 'permissionGroups.table.name' },
  { value: 'description', type: 'string', labelKey: 'permissionGroups.form.description.label' },
  { value: 'isSystemAdmin', type: 'boolean', labelKey: 'permissionGroups.table.isSystemAdmin' },
  { value: 'isActive', type: 'boolean', labelKey: 'permissionGroups.table.isActive' },
];

function mapSortBy(value: PermissionGroupColumnKey): string {
  switch (value) {
    case 'name':
      return 'Name';
    case 'permissionCount':
      return 'Id';
    default:
      return 'UpdatedDate';
  }
}

export function PermissionGroupsPage(): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const { setPageTitle } = useUIStore();
  const pageKey = 'access-control-permission-groups';
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PermissionGroupDto | null>(null);
  const [permissionsPanelOpen, setPermissionsPanelOpen] = useState(false);
  const [permissionsPanelGroupId, setPermissionsPanelGroupId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PermissionGroupDto | null>(null);
  const mainScrollTopRef = useRef(0);

  const pagedGrid = usePagedDataGrid<PermissionGroupColumnKey>({
    pageKey,
    defaultSortBy: 'name',
    defaultSortDirection: 'asc',
    defaultPageSize: 20,
    mapSortBy,
  });

  const columns = useMemo<PagedDataGridColumn<PermissionGroupColumnKey>[]>(
    () => [
      { key: 'name', label: t('permissionGroups.table.name') },
      { key: 'isSystemAdmin', label: t('permissionGroups.table.isSystemAdmin'), sortable: false },
      { key: 'isActive', label: t('permissionGroups.table.isActive'), sortable: false },
      { key: 'permissionCount', label: t('permissionGroups.table.permissionCount'), sortable: false },
      { key: 'actions', label: t('common.actions'), sortable: false },
    ],
    [t],
  );

  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey,
    columns: columns.map(({ key, label }) => ({ key, label })),
  });

  const { data, isLoading, error } = usePermissionGroupsQuery(pagedGrid.queryParams);
  const createMutation = useCreatePermissionGroupMutation();
  const updateMutation = useUpdatePermissionGroupMutation();
  const deleteMutation = useDeletePermissionGroupMutation();
  const permissionAccess = usePermissionAccess();
  const canCreate = permissionAccess.can('access-control.permission-groups.create');
  const canUpdate = permissionAccess.can('access-control.permission-groups.update');
  const canDelete = permissionAccess.can('access-control.permission-groups.delete');
  const totalCount = data?.totalCount ?? data?.data?.length ?? 0;
  const activeCount = useMemo(() => (data?.data ?? []).filter((item) => item.isActive).length, [data?.data]);
  const systemAdminCount = useMemo(() => (data?.data ?? []).filter((item) => item.isSystemAdmin).length, [data?.data]);

  useEffect(() => {
    setPageTitle(t('permissionGroups.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  useEffect(() => {
    if (!formOpen) return;
    const main = document.querySelector('main');
    if (!main) return;
    const saved = mainScrollTopRef.current;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        main.scrollTop = saved;
      });
    });
    return () => cancelAnimationFrame(id);
  }, [formOpen]);

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
    return (data?.data ?? []).map((item) => ({
      name: item.name,
      isSystemAdmin: item.isSystemAdmin ? t('common.yes') : t('common.no'),
      isActive: item.isActive ? t('common.yes') : t('common.no'),
      permissionCount: item.permissionDefinitionIds?.length ?? item.permissionCodes?.length ?? 0,
    }));
  }, [data?.data, t]);

  const handleRefresh = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['permissions', 'groups'] });
  };

  const handleFormSubmit = async (formData: CreatePermissionGroupSchema): Promise<void> => {
    if (editingItem?.isSystemAdmin) return;
    if (editingItem) {
      const updateDto = {
        name: formData.name,
        description: formData.description ?? undefined,
        isSystemAdmin: editingItem.isSystemAdmin,
        isActive: formData.isActive,
      };
      await updateMutation.mutateAsync({ id: editingItem.id, dto: updateDto });
    } else {
      const createDto = { ...formData, isSystemAdmin: false, description: formData.description ?? undefined };
      await createMutation.mutateAsync(createDto);
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
    () => orderedVisibleColumns.filter((key) => key !== 'actions') as PermissionGroupColumnKey[],
    [orderedVisibleColumns],
  );

  const renderSortIcon = (columnKey: PermissionGroupColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

  return (
    <div className="w-full space-y-6 crm-page">
      <Breadcrumb items={[{ label: t('sidebar.accessControl') }, { label: t('sidebar.permissionGroups'), isActive: true }]} />

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-linear-to-br from-white via-cyan-50/70 to-pink-50/70 p-5 shadow-sm dark:border-cyan-800/30 dark:from-blue-950/70 dark:via-blue-950/90 dark:to-cyan-950/40 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-cyan-200 bg-white/80 px-3 py-1.5 text-xs font-black text-cyan-700 shadow-sm dark:border-cyan-800/40 dark:bg-blue-950/60 dark:text-cyan-300">
              <Sparkles className="size-4" />
              {t('sidebar.permissionGroups')}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 transition-colors dark:text-white">
              {t('permissionGroups.title')}
            </h1>
            <p className="text-sm font-medium text-slate-600 transition-colors dark:text-slate-300">
              {t('permissionGroups.description')}
            </p>
          </div>
          {canCreate ? (
            <Button onClick={() => {
              const main = document.querySelector('main');
              if (main) mainScrollTopRef.current = main.scrollTop;
              setEditingItem(null);
              setFormOpen(true);
            }} className="h-11 rounded-2xl border-0 bg-linear-to-r from-pink-600 to-orange-600 px-6 text-white shadow-lg shadow-pink-500/20 hover:text-white">
              <Plus size={18} className="mr-2" />
              {t('permissionGroups.add')}
            </Button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/50">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-100 p-2.5 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                <Users2 className="size-4" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('permissionGroups.title')}</p>
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
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('permissionGroups.table.isActive')}</p>
                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{activeCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/50">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-pink-100 p-2.5 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
                <KeyRound className="size-4" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('permissionGroups.table.isSystemAdmin')}</p>
                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{systemAdminCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/3">
        <PagedDataGrid<PermissionGroupDto, PermissionGroupColumnKey>
          columns={columns}
          visibleColumnKeys={visibleColumnKeys}
          rows={data?.data ?? []}
          rowKey={(row) => row.id}
          renderCell={(item, columnKey) => {
            switch (columnKey) {
              case 'name':
                return <span className="font-medium">{item.name}</span>;
              case 'isSystemAdmin':
                return (
                  <Badge variant={item.isSystemAdmin ? 'default' : 'secondary'}>
                    {item.isSystemAdmin ? t('common.yes') : t('common.no')}
                  </Badge>
                );
              case 'isActive':
                return (
                  <Badge variant={item.isActive ? 'default' : 'secondary'}>
                    {item.isActive ? t('common.yes') : t('common.no')}
                  </Badge>
                );
              case 'permissionCount':
                return item.permissionDefinitionIds?.length ?? item.permissionCodes?.length ?? 0;
              case 'actions':
              default:
                return null;
            }
          }}
          sortBy={pagedGrid.sortBy}
          sortDirection={pagedGrid.sortDirection}
          onSort={(columnKey) => {
            if (columnKey === 'isSystemAdmin' || columnKey === 'isActive' || columnKey === 'permissionCount' || columnKey === 'actions') return;
            pagedGrid.handleSort(columnKey);
          }}
          renderSortIcon={renderSortIcon}
          isLoading={isLoading}
          isError={Boolean(error)}
          errorText={t('common.errors.loadFailed', { defaultValue: 'Missing translation' })}
          emptyText={t('common.noData')}
          showActionsColumn={orderedVisibleColumns.includes('actions') && (canUpdate || canDelete)}
          actionsHeaderLabel={t('common.actions')}
          renderActionsCell={(item) => (
            canUpdate || canDelete ? (
              <>
                {canUpdate ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (item.isSystemAdmin) return;
                        setPermissionsPanelGroupId(item.id);
                        setPermissionsPanelOpen(true);
                      }}
                      title={item.isSystemAdmin ? t('permissionGroups.systemAdminLocked') : t('permissionGroups.managePermissions')}
                      disabled={item.isSystemAdmin}
                      className="rounded-xl text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-cyan-900/30 dark:hover:text-cyan-300"
                    >
                      <Settings className="size-4" />
                      <span>{t('permissionGroups.managePermissions')}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (item.isSystemAdmin) return;
                        const main = document.querySelector('main');
                        if (main) mainScrollTopRef.current = main.scrollTop;
                        setEditingItem(item);
                        setFormOpen(true);
                      }}
                      disabled={item.isSystemAdmin}
                      title={item.isSystemAdmin ? t('permissionGroups.systemAdminLocked') : undefined}
                      className="rounded-xl text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-cyan-900/30 dark:hover:text-cyan-300"
                    >
                      <span>{t('common.edit')}</span>
                    </Button>
                  </>
                ) : null}
                {canDelete ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    onClick={() => {
                      if (item.isSystemAdmin) return;
                      setItemToDelete(item);
                      setDeleteDialogOpen(true);
                    }}
                    disabled={item.isSystemAdmin}
                    title={item.isSystemAdmin ? t('permissionGroups.systemAdminLocked') : undefined}
                  >
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
            defaultFilterColumn: 'name',
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
                <Button variant="outline" size="sm" onClick={() => void handleRefresh()} disabled={isLoading}>
                  <RefreshCw size={16} className={isLoading ? 'mr-2 animate-spin' : 'mr-2'} />
                  {t('common.refresh')}
                </Button>
              </div>
            ),
          }}
        />
      </div>

      <PermissionGroupForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        item={editingItem}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <GroupPermissionsPanel groupId={permissionsPanelGroupId} open={permissionsPanelOpen} onOpenChange={setPermissionsPanelOpen} />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="overflow-hidden border-slate-200 bg-white p-0 shadow-2xl dark:border-cyan-800/30 dark:bg-blue-950">
          <DialogHeader className="border-b border-slate-100 bg-slate-50/80 px-6 py-5 dark:border-cyan-800/30 dark:bg-blue-900/20">
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">{t('permissionGroups.delete.confirmTitle')}</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              {t('permissionGroups.delete.confirmMessage', { name: itemToDelete?.name ?? '' })}
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
