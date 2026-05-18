import { type ReactElement, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { useActiveUsers } from '@/features/auth/hooks/useActiveUsers';
import { Combobox } from '@/components/ui/combobox';
import { CheckCircle2, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { useUserPermissionGroupsQuery } from '../hooks/useUserPermissionGroupsQuery';
import { useSetUserPermissionGroupsMutation } from '../hooks/useSetUserPermissionGroupsMutation';
import { usePermissionAccess } from '../hooks/usePermissionAccess';
import { PermissionGroupMultiSelect } from './PermissionGroupMultiSelect';
import { FieldHelpTooltip } from './FieldHelpTooltip';

export function UserGroupAssignmentsPage(): ReactElement {
  const { t } = useTranslation(['access-control', 'common']);
  const { setPageTitle } = useUIStore();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const permissionAccess = usePermissionAccess();
  const canUpdateAssignments = permissionAccess.can('access-control.user-group-assignments.update');

  const { data: users = [], isLoading: usersLoading } = useActiveUsers();
  const { data: userGroups, isLoading: userGroupsLoading } = useUserPermissionGroupsQuery(selectedUserId);
  const setUserGroups = useSetUserPermissionGroupsMutation(selectedUserId ?? 0);

  useEffect(() => {
    setPageTitle(t('userGroupAssignments.title'));
    return () => setPageTitle(null);
  }, [t, setPageTitle]);

  const serverGroupIdsKey = (userGroups?.permissionGroupIds ?? []).join(',');
  const parsedServerGroupIds = useMemo<number[]>(
    () => (serverGroupIdsKey ? serverGroupIdsKey.split(',').map((x) => parseInt(x, 10)) : []),
    [serverGroupIdsKey]
  );

  useEffect(() => {
    setSelectedGroupIds(parsedServerGroupIds.length > 0 ? [...parsedServerGroupIds] : []);
    setHasChanges(false);
  }, [parsedServerGroupIds]);

  const handleGroupIdsChange = (ids: number[]): void => {
    setSelectedGroupIds(ids);
    setHasChanges(true);
  };

  const handleSave = async (): Promise<void> => {
    if (selectedUserId == null) return;
    await setUserGroups.mutateAsync({ permissionGroupIds: selectedGroupIds });
    setHasChanges(false);
  };

  const userOptions = users.map((u) => ({
    value: u.id.toString(),
    label: u.fullName || u.username || u.email || `User ${u.id}`,
  }));

  const selectedUserLabel = useMemo(() => {
    if (selectedUserId == null) return t('userGroupAssignments.noUserSelected', { defaultValue: 'Missing translation' });
    return userOptions.find((option) => option.value === selectedUserId.toString())?.label ?? `#${selectedUserId}`;
  }, [selectedUserId, t, userOptions]);

  return (
    <div className="w-full space-y-6 crm-page">
      <Breadcrumb items={[{ label: t('sidebar.accessControl') }, { label: t('sidebar.userGroupAssignments'), isActive: true }]} />
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-linear-to-br from-white via-cyan-50/70 to-pink-50/70 p-5 shadow-sm dark:border-cyan-800/30 dark:from-blue-950/70 dark:via-blue-950/90 dark:to-cyan-950/40 sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-white/80 px-3 py-1.5 text-xs font-black text-cyan-700 shadow-sm dark:border-cyan-800/40 dark:bg-blue-950/60 dark:text-cyan-300">
          <Sparkles className="size-4" />
          {t('sidebar.userGroupAssignments')}
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white transition-colors">
          {t('userGroupAssignments.title')}
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors">
          {t('userGroupAssignments.description')}
        </p>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <FieldHelpTooltip text={t('help.userAssignment.systemAdminNote')} side="right" />
          <span className="italic">{t('help.userAssignment.systemAdminNote')}</span>
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/50">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-100 p-2.5 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                <UserRound className="size-4" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('userGroupAssignments.selectUser')}</p>
                <p className="mt-1 line-clamp-2 text-sm font-black text-slate-900 dark:text-white">{selectedUserLabel}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/50">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{t('userGroupAssignments.assignedGroups')}</p>
                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{selectedGroupIds.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/50">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-pink-100 p-2.5 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
                <CheckCircle2 className="size-4" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  {t('userGroupAssignments.statusLabel', { defaultValue: 'Missing translation' })}
                </p>
                <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                  {hasChanges
                    ? t('userGroupAssignments.statusPending', { defaultValue: 'Missing translation' })
                    : t('userGroupAssignments.statusCurrent', { defaultValue: 'Missing translation' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-[28px] border border-slate-200/70 bg-white/85 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/3 sm:p-6">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="text-sm font-medium flex items-center gap-1">
              {t('userGroupAssignments.selectUser')}
              <FieldHelpTooltip text={t('help.userAssignment.user')} />
            </label>
            {selectedUserId != null ? (
              <Badge className="rounded-xl border-0 bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                {t('userGroupAssignments.selectUser')}
              </Badge>
            ) : null}
          </div>
          <Combobox
            options={userOptions}
            value={selectedUserId?.toString() ?? ''}
            onValueChange={(v) => setSelectedUserId(v ? parseInt(v, 10) : null)}
            placeholder={t('userGroupAssignments.selectUserPlaceholder')}
            searchPlaceholder={t('common.search')}
            emptyText={t('userGroupAssignments.noUsers')}
            disabled={usersLoading}
          />
        </div>

        {selectedUserId != null && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/3">
            <label className="text-sm font-medium mb-3 flex items-center gap-1">
              {t('userGroupAssignments.assignedGroups')}
              <FieldHelpTooltip text={t('help.userAssignment.groups')} />
            </label>
            {!canUpdateAssignments ? (
              <div className="mb-3 rounded-2xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
                {t('userGroupAssignments.readOnlyInfo', {
                  defaultValue: 'Missing translation',
                })}
              </div>
            ) : null}
            {userGroupsLoading ? (
              <div className="py-8 text-center text-slate-500">{t('common.loading')}</div>
            ) : (
              <>
                <PermissionGroupMultiSelect
                  value={selectedGroupIds}
                  onChange={handleGroupIdsChange}
                  disabled={setUserGroups.isPending || !canUpdateAssignments}
                />
                {hasChanges && canUpdateAssignments && (
                  <div className="mt-4 flex justify-end items-center gap-1">
                    <FieldHelpTooltip text={t('help.userAssignment.save')} side="top" />
                    <Button onClick={handleSave} disabled={setUserGroups.isPending} className="rounded-2xl bg-linear-to-r from-pink-600 to-orange-600 text-white shadow-lg shadow-pink-500/20 hover:text-white">
                      {setUserGroups.isPending ? t('common.saving') : t('common.save')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {!selectedUserId && !usersLoading && (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            {t('userGroupAssignments.selectUserHint')}
          </div>
        )}
      </div>
    </div>
  );
}
