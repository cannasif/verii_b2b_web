import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Plus, ShieldCheck, Sparkles, Trash2, UserRound, Warehouse } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { lookupApi } from '@/services/lookup-api';
import { useUIStore } from '@/stores/ui-store';
import { useActiveUsers } from '@/features/auth/hooks/useActiveUsers';
import { usePermissionAccess } from '../hooks/usePermissionAccess';
import { useAllWmsScopePoliciesQuery } from '../hooks/useAllWmsScopePoliciesQuery';
import { useUserWmsScopePoliciesQuery } from '../hooks/useUserWmsScopePoliciesQuery';
import { useSetUserWmsScopePoliciesMutation } from '../hooks/useSetUserWmsScopePoliciesMutation';
import { useWmsScopePolicyResolutionQuery } from '../hooks/useWmsScopePolicyResolutionQuery';

type AssignmentRow = {
  localId: string;
  wmsScopePolicyId: number | null;
  branchCode: string;
  warehouseId: number | null;
};

const scopeTypeLabels: Record<string, string> = {
  unrestricted: 'Tam Erişim',
  branch: 'Şube Bazlı',
  warehouse: 'Depo Bazlı',
  'assigned-only': 'Sadece Atanan',
};

export function WmsScopeAssignmentsPage(): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const { setPageTitle } = useUIStore();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [assignmentRows, setAssignmentRows] = useState<AssignmentRow[]>([]);
  const [selectedEntityType, setSelectedEntityType] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const permissionAccess = usePermissionAccess();
  const canUpdateAssignments = permissionAccess.can('access-control.wms-scope-assignments.update');

  const { data: users = [], isLoading: usersLoading } = useActiveUsers();
  const warehousesQuery = useQuery({
    queryKey: ['access-control', 'wms-scope-assignments', 'warehouses'],
    queryFn: ({ signal }) => lookupApi.getWarehouses(undefined, { signal }),
    staleTime: 5 * 60 * 1000,
  });
  const warehouses = warehousesQuery.data ?? [];
  const { data: policies = [] } = useAllWmsScopePoliciesQuery();
  const { data: userAssignments, isLoading: assignmentsLoading } = useUserWmsScopePoliciesQuery(selectedUserId);
  const setAssignments = useSetUserWmsScopePoliciesMutation(selectedUserId);
  const resolutionQuery = useWmsScopePolicyResolutionQuery(selectedUserId, selectedEntityType);

  useEffect(() => {
    setPageTitle(t('wmsScopeAssignments.title'));
    return () => setPageTitle(null);
  }, [setPageTitle, t]);

  useEffect(() => {
    const nextRows = (userAssignments ?? []).map((item, index) => ({
      localId: `${item.id}-${index}`,
      wmsScopePolicyId: item.wmsScopePolicyId,
      branchCode: item.branchCode ?? '',
      warehouseId: item.warehouseId ?? null,
    }));
    setAssignmentRows(nextRows);
    setHasChanges(false);

    if (!selectedEntityType && userAssignments && userAssignments.length > 0) {
      setSelectedEntityType(userAssignments[0].entityType);
    }
  }, [selectedEntityType, userAssignments]);

  const userOptions = useMemo(() => users.map((u) => ({
    value: u.id.toString(),
    label: u.fullName || u.username || u.email || `User ${u.id}`,
  })), [users]);

  const policyOptions = useMemo(() => policies
    .filter((item) => item.isActive)
    .map((item) => ({
      value: item.id.toString(),
      label: `${item.name} (${item.entityType} / ${scopeTypeLabels[item.scopeType] ?? item.scopeType})`,
    })), [policies]);

  const entityTypeOptions = useMemo(() => Array.from(new Set(policies.map((item) => item.entityType))).map((entityType) => ({
    value: entityType,
    label: entityType,
  })), [policies]);

  const warehouseOptions = useMemo(() => warehouses.map((item) => ({
    value: item.id.toString(),
    label: item.depoIsmi ? `${item.depoKodu} - ${item.depoIsmi}` : `${item.depoKodu}`,
  })), [warehouses]);

  const selectedUserLabel = useMemo(() => {
    if (selectedUserId == null) return t('wmsScopeAssignments.noUserSelected');
    return userOptions.find((option) => option.value === selectedUserId.toString())?.label ?? `#${selectedUserId}`;
  }, [selectedUserId, t, userOptions]);

  const handleAddRow = (): void => {
    setAssignmentRows((current) => [...current, {
      localId: crypto.randomUUID(),
      wmsScopePolicyId: null,
      branchCode: '',
      warehouseId: null,
    }]);
    setHasChanges(true);
  };

  const handleRowChange = (localId: string, patch: Partial<AssignmentRow>): void => {
    setAssignmentRows((current) => current.map((row) => row.localId === localId ? { ...row, ...patch } : row));
    setHasChanges(true);
  };

  const handleRemoveRow = (localId: string): void => {
    setAssignmentRows((current) => current.filter((row) => row.localId !== localId));
    setHasChanges(true);
  };

  const handleSave = async (): Promise<void> => {
    if (selectedUserId == null) return;
    const items = assignmentRows
      .filter((row) => row.wmsScopePolicyId != null)
      .map((row) => ({
        wmsScopePolicyId: row.wmsScopePolicyId!,
        branchCode: row.branchCode.trim() || undefined,
        warehouseId: row.warehouseId,
      }));

    await setAssignments.mutateAsync({ items });
    setHasChanges(false);
  };

  const selectedAssignments = useMemo(() => (userAssignments ?? []).filter((item) => !selectedEntityType || item.entityType === selectedEntityType), [selectedEntityType, userAssignments]);

  return (
    <div className="w-full space-y-6 crm-page">
      <Breadcrumb items={[{ label: t('sidebar.accessControl') }, { label: t('sidebar.wmsScopeAssignments'), isActive: true }]} />

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-linear-to-br from-white via-cyan-50/70 to-pink-50/70 p-5 shadow-sm dark:border-cyan-800/30 dark:from-blue-950/70 dark:via-blue-950/90 dark:to-cyan-950/40 sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-white/80 px-3 py-1.5 text-xs font-black text-cyan-700 shadow-sm dark:border-cyan-800/40 dark:bg-blue-950/60 dark:text-cyan-300">
          <Sparkles className="size-4" />
          {t('sidebar.wmsScopeAssignments')}
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white">{t('wmsScopeAssignments.title')}</h1>
        <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">{t('wmsScopeAssignments.description')}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/50">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-100 p-2.5 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"><UserRound className="size-4" /></div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('wmsScopeAssignments.selectUser')}</p>
                <p className="mt-1 line-clamp-2 text-sm font-black text-slate-900 dark:text-white">{selectedUserLabel}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/50">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"><ShieldCheck className="size-4" /></div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('wmsScopeAssignments.assignedPolicies')}</p>
                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{assignmentRows.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/50">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-fuchsia-100 p-2.5 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300"><Warehouse className="size-4" /></div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('wmsScopeAssignments.resolutionScope')}</p>
                <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{selectedEntityType ?? '-'}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/50">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-pink-100 p-2.5 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"><CheckCircle2 className="size-4" /></div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('wmsScopeAssignments.statusLabel')}</p>
                <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">{hasChanges ? t('wmsScopeAssignments.statusPending') : t('wmsScopeAssignments.statusCurrent')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-[28px] border border-slate-200/70 bg-white/85 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/3 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-4">
            <div>
              <label className="mb-3 inline-flex text-sm font-medium">{t('wmsScopeAssignments.selectUser')}</label>
              <Combobox
                options={userOptions}
                value={selectedUserId?.toString() ?? ''}
                onValueChange={(value) => setSelectedUserId(value ? parseInt(value, 10) : null)}
                placeholder={t('wmsScopeAssignments.selectUserPlaceholder')}
                searchPlaceholder={t('common.search')}
                emptyText={t('wmsScopeAssignments.noUsers')}
                disabled={usersLoading}
              />
            </div>

            {selectedUserId != null ? (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">{t('wmsScopeAssignments.editorTitle')}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('wmsScopeAssignments.editorDescription')}</p>
                  </div>
                  {canUpdateAssignments ? (
                    <Button type="button" variant="outline" className="rounded-2xl" onClick={handleAddRow}>
                      <Plus className="mr-2 size-4" />
                      {t('wmsScopeAssignments.addAssignment')}
                    </Button>
                  ) : null}
                </div>

                {assignmentsLoading ? (
                  <div className="py-8 text-center text-slate-500">{t('common.loading')}</div>
                ) : assignmentRows.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                    {t('wmsScopeAssignments.empty')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assignmentRows.map((row) => (
                      <div key={row.localId} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/20 lg:grid-cols-[minmax(0,1.4fr)_140px_180px_auto]">
                        <Combobox
                          options={policyOptions}
                          value={row.wmsScopePolicyId?.toString() ?? ''}
                          onValueChange={(value) => handleRowChange(row.localId, { wmsScopePolicyId: value ? parseInt(value, 10) : null })}
                          placeholder={t('wmsScopeAssignments.policyPlaceholder')}
                          searchPlaceholder={t('common.search')}
                          emptyText={t('common.noData')}
                          disabled={!canUpdateAssignments}
                        />
                        <Input
                          value={row.branchCode}
                          onChange={(event) => handleRowChange(row.localId, { branchCode: event.target.value })}
                          placeholder={t('wmsScopeAssignments.branchCodePlaceholder')}
                          disabled={!canUpdateAssignments}
                        />
                        <Combobox
                          options={warehouseOptions}
                          value={row.warehouseId?.toString() ?? ''}
                          onValueChange={(value) => handleRowChange(row.localId, { warehouseId: value ? parseInt(value, 10) : null })}
                          placeholder={t('wmsScopeAssignments.warehousePlaceholder')}
                          searchPlaceholder={t('common.search')}
                          emptyText={t('common.noData')}
                          disabled={!canUpdateAssignments}
                        />
                        {canUpdateAssignments ? (
                          <Button type="button" variant="outline" className="rounded-2xl text-rose-600" onClick={() => handleRemoveRow(row.localId)}>
                            <Trash2 className="mr-2 size-4" />
                            {t('common.delete')}
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}

                {hasChanges && canUpdateAssignments ? (
                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={setAssignments.isPending} className="rounded-2xl bg-linear-to-r from-pink-600 to-orange-600 text-white shadow-lg shadow-pink-500/20 hover:text-white">
                      {setAssignments.isPending ? t('common.saving') : t('common.save')}
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                {t('wmsScopeAssignments.selectUserHint')}
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">{t('wmsScopeAssignments.previewTitle')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('wmsScopeAssignments.previewDescription')}</p>
            </div>

            <Combobox
              options={entityTypeOptions}
              value={selectedEntityType ?? ''}
              onValueChange={(value) => setSelectedEntityType(value || null)}
              placeholder={t('wmsScopeAssignments.entityTypePlaceholder')}
              searchPlaceholder={t('common.search')}
              emptyText={t('common.noData')}
            />

            {selectedEntityType && selectedUserId != null ? (
              resolutionQuery.isLoading ? (
                <div className="py-8 text-center text-slate-500">{t('common.loading')}</div>
              ) : resolutionQuery.data ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/30">
                    <div className="flex flex-wrap gap-2">
                      {(resolutionQuery.data.scopeTypes ?? []).length === 0 ? (
                        <Badge variant="secondary">{t('wmsScopeAssignments.noExplicitPolicy')}</Badge>
                      ) : (
                        resolutionQuery.data.scopeTypes.map((scopeType) => (
                          <Badge key={scopeType} variant="outline">{scopeTypeLabels[scopeType] ?? scopeType}</Badge>
                        ))
                      )}
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <p>{t('wmsScopeAssignments.previewUnrestricted')}: <span className="font-semibold">{resolutionQuery.data.isUnrestricted ? t('common.yes') : t('common.no')}</span></p>
                      <p>{t('wmsScopeAssignments.previewIncludeSelf')}: <span className="font-semibold">{resolutionQuery.data.includeSelf ? t('common.yes') : t('common.no')}</span></p>
                      <p>{t('wmsScopeAssignments.previewAssignedOnly')}: <span className="font-semibold">{resolutionQuery.data.requiresAssignedRecords ? t('common.yes') : t('common.no')}</span></p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/30">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('wmsScopeAssignments.previewBranches')}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(resolutionQuery.data.branchCodes ?? []).length === 0
                        ? <Badge variant="secondary">-</Badge>
                        : resolutionQuery.data.branchCodes.map((code) => <Badge key={code}>{code}</Badge>)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/30">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('wmsScopeAssignments.previewWarehouses')}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(resolutionQuery.data.warehouseIds ?? []).length === 0
                        ? <Badge variant="secondary">-</Badge>
                        : resolutionQuery.data.warehouseIds.map((id) => <Badge key={id}>#{id}</Badge>)}
                    </div>
                  </div>

                  {selectedAssignments.length > 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/30">
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('wmsScopeAssignments.previewAssignments')}</p>
                      <div className="mt-3 space-y-2">
                        {selectedAssignments.map((item) => (
                          <div key={item.id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-white/10">
                            <div className="font-semibold text-slate-900 dark:text-white">{item.policyName}</div>
                            <div className="text-slate-500 dark:text-slate-400">
                              {item.branchCode || '-'} / {item.warehouseId ? `#${item.warehouseId}` : '-'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                {t('wmsScopeAssignments.previewEmpty')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
