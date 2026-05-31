import { type FormEvent, type ReactElement, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Building2, KeyRound, Pencil, Plus, ShieldCheck, Trash2, UserRoundCog, Users2 } from 'lucide-react';
import { toast } from 'sonner';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { b2bApi } from '@/features/b2b/api/b2b.api';
import { userManagementApi } from '../api/userManagementApi';
import { userPermissionGroupApi } from '../api/userPermissionGroupApi';
import { usePermissionAccess } from '../hooks/usePermissionAccess';
import { PermissionGroupMultiSelect } from './PermissionGroupMultiSelect';
import type { B2bCompanyDto } from '@/features/b2b/types/b2b.types';
import type { CreateUserManagementDto, UserManagementDto } from '../types/access-control.types';

type UserColumnKey = 'fullName' | 'email' | 'role' | 'accountType' | 'company' | 'status' | 'actions';

type UserFormState = {
  username: string;
  email: string;
  password: string;
  newPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roleId: string;
  isActive: boolean;
  accountType: 'Admin' | 'Buyer' | 'CompanyAdmin' | 'Approver';
  b2bCompanyId: string;
  b2bBuyerRoleCode: 'Buyer' | 'CompanyAdmin' | 'Approver';
  b2bOrderLimit: string;
  b2bRequiresApproval: boolean;
  permissionGroupIds: number[];
};

const emptyForm: UserFormState = {
  username: '',
  email: '',
  password: '',
  newPassword: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  roleId: '',
  isActive: true,
  accountType: 'Admin',
  b2bCompanyId: '',
  b2bBuyerRoleCode: 'Buyer',
  b2bOrderLimit: '',
  b2bRequiresApproval: false,
  permissionGroupIds: [],
};

function mapSortBy(value: UserColumnKey): string {
  switch (value) {
    case 'fullName':
      return 'FullName';
    case 'email':
      return 'Email';
    case 'role':
      return 'RoleId';
    case 'status':
      return 'IsActive';
    default:
      return 'UpdatedDate';
  }
}

function isB2bAccount(type: UserFormState['accountType']): boolean {
  return type === 'Buyer' || type === 'CompanyAdmin' || type === 'Approver';
}

function getBuyerRoleCode(type: UserFormState['accountType']): UserFormState['b2bBuyerRoleCode'] {
  return type === 'CompanyAdmin' || type === 'Approver' ? type : 'Buyer';
}

function roleLooksLikeBuyer(title?: string): boolean {
  const normalized = (title ?? '').toLocaleLowerCase('tr-TR');
  return normalized.includes('b2b') || normalized.includes('buyer') || normalized.includes('alıcı') || normalized.includes('musteri') || normalized.includes('müşteri');
}

function toNumberOrNull(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function userDisplayName(user: UserManagementDto): string {
  return user.fullName?.trim() || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username;
}

export function UserManagementPage(): ReactElement {
  const { setPageTitle } = useUIStore();
  const queryClient = useQueryClient();
  const permissionAccess = usePermissionAccess();
  const canCreate = permissionAccess.can('access-control.user-management.create');
  const canUpdate = permissionAccess.can('access-control.user-management.update');
  const canDelete = permissionAccess.can('access-control.user-management.delete');
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserManagementDto | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<UserManagementDto | null>(null);

  const grid = usePagedDataGrid<UserColumnKey>({
    pageKey: 'access-control-user-management',
    defaultSortBy: 'fullName',
    defaultSortDirection: 'asc',
    defaultPageSize: 20,
    mapSortBy,
  });

  const usersQuery = useQuery({
    queryKey: ['access-control', 'users', grid.queryParams],
    queryFn: () => userManagementApi.getList(grid.queryParams),
  });

  const rolesQuery = useQuery({
    queryKey: ['access-control', 'user-authorities'],
    queryFn: userManagementApi.getRoles,
  });

  const companiesQuery = useQuery({
    queryKey: ['b2b', 'companies', 'user-management-picker'],
    queryFn: () => b2bApi.getCompanies({ pageNumber: 1, pageSize: 500, sortBy: 'CompanyName', sortDirection: 'asc' }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserManagementDto) => userManagementApi.create(payload),
    onSuccess: async () => {
      toast.success('Kullanıcı oluşturuldu.');
      closeForm();
      await queryClient.invalidateQueries({ queryKey: ['access-control', 'users'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Kullanıcı oluşturulamadı.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CreateUserManagementDto }) => userManagementApi.update(id, payload),
    onSuccess: async () => {
      toast.success('Kullanıcı güncellendi.');
      closeForm();
      await queryClient.invalidateQueries({ queryKey: ['access-control', 'users'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Kullanıcı güncellenemedi.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userManagementApi.delete(id),
    onSuccess: async () => {
      toast.success('Kullanıcı silindi.');
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['access-control', 'users'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Kullanıcı silinemedi.'),
  });

  useEffect(() => {
    setPageTitle('Kullanıcı Yönetimi');
    return () => setPageTitle(null);
  }, [setPageTitle]);

  const rows = usersQuery.data?.data ?? [];
  const totalCount = usersQuery.data?.totalCount ?? 0;
  const buyerCount = rows.filter((item) => item.b2bCompanyId).length;
  const activeCount = rows.filter((item) => item.isActive).length;
  const companyOptions = useMemo(
    () => (companiesQuery.data?.data ?? []).map((company: B2bCompanyDto) => ({
      value: String(company.id),
      label: `${company.companyName} (${company.companyCode})`,
    })),
    [companiesQuery.data?.data],
  );

  const columns = useMemo<PagedDataGridColumn<UserColumnKey>[]>(() => [
    { key: 'fullName', label: 'Kullanıcı' },
    { key: 'email', label: 'E-posta' },
    { key: 'role', label: 'Sistem Rolü' },
    { key: 'accountType', label: 'B2B Tipi', sortable: false },
    { key: 'company', label: 'Şirket', sortable: false },
    { key: 'status', label: 'Durum' },
    { key: 'actions', label: 'İşlem', sortable: false },
  ], []);

  const range = getPagedRange(usersQuery.data);
  const roleOptions = rolesQuery.data ?? [];

  function closeForm(): void {
    setFormOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
  }

  function openCreate(): void {
    setEditingUser(null);
    setForm({
      ...emptyForm,
      roleId: String(roleOptions.find((role) => role.title.toLowerCase() === 'user')?.id ?? roleOptions[0]?.id ?? ''),
    });
    setFormOpen(true);
  }

  function handleRoleChange(value: string): void {
    const selectedRole = roleOptions.find((role) => String(role.id) === value);
    setForm((state) => {
      if (!roleLooksLikeBuyer(selectedRole?.title) || isB2bAccount(state.accountType)) {
        return { ...state, roleId: value };
      }

      return {
        ...state,
        roleId: value,
        accountType: 'Buyer',
        b2bBuyerRoleCode: 'Buyer',
      };
    });
  }

  function handleAccountTypeChange(value: UserFormState['accountType']): void {
    setForm((state) => ({
      ...state,
      accountType: value,
      b2bBuyerRoleCode: getBuyerRoleCode(value),
      b2bCompanyId: isB2bAccount(value) ? state.b2bCompanyId : '',
      b2bOrderLimit: isB2bAccount(value) ? state.b2bOrderLimit : '',
      b2bRequiresApproval: isB2bAccount(value) ? state.b2bRequiresApproval : false,
    }));
  }

  async function openEdit(user: UserManagementDto): Promise<void> {
    const [detail, groups] = await Promise.all([
      userManagementApi.getById(user.id),
      userPermissionGroupApi.getByUserId(user.id).catch(() => ({ userId: user.id, permissionGroupIds: [], permissionGroupNames: [] })),
    ]);
    const roleCode = (detail.b2bBuyerRoleCode as UserFormState['b2bBuyerRoleCode']) || 'Buyer';
    setEditingUser(detail);
    setForm({
      username: detail.username,
      email: detail.email,
      password: '',
      newPassword: '',
      firstName: detail.firstName ?? '',
      lastName: detail.lastName ?? '',
      phoneNumber: detail.phoneNumber ?? '',
      roleId: String(detail.roleId),
      isActive: detail.isActive,
      accountType: detail.b2bCompanyId ? roleCode : 'Admin',
      b2bCompanyId: detail.b2bCompanyId ? String(detail.b2bCompanyId) : '',
      b2bBuyerRoleCode: roleCode,
      b2bOrderLimit: detail.b2bOrderLimit != null ? String(detail.b2bOrderLimit) : '',
      b2bRequiresApproval: detail.b2bRequiresApproval,
      permissionGroupIds: groups.permissionGroupIds ?? [],
    });
    setFormOpen(true);
  }

  function buildPayload(): CreateUserManagementDto {
    const b2bEnabled = isB2bAccount(form.accountType);
    return {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password || undefined,
      newPassword: form.newPassword || undefined,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      roleId: Number(form.roleId),
      isActive: form.isActive,
      permissionGroupIds: form.permissionGroupIds,
      accountType: b2bEnabled ? form.b2bBuyerRoleCode : 'Admin',
      b2bCompanyId: b2bEnabled ? toNumberOrNull(form.b2bCompanyId) : null,
      b2bBuyerRoleCode: b2bEnabled ? form.b2bBuyerRoleCode : undefined,
      b2bOrderLimit: b2bEnabled ? toNumberOrNull(form.b2bOrderLimit) : null,
      b2bRequiresApproval: b2bEnabled ? form.b2bRequiresApproval : false,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const payload = buildPayload();
    if (!payload.roleId) {
      toast.error('Sistem rolü seçmelisiniz.');
      return;
    }
    if (isB2bAccount(form.accountType) && !payload.b2bCompanyId) {
      toast.error('B2B kullanıcısı için şirket seçmelisiniz.');
      return;
    }
    if (!payload.firstName?.trim() || !payload.lastName?.trim()) {
      toast.error('Ad ve soyad zorunludur.');
      return;
    }

    if (editingUser) {
      await updateMutation.mutateAsync({ id: editingUser.id, payload });
      return;
    }

    if (!payload.username || !payload.email || !payload.password) {
      toast.error('Kullanıcı adı, e-posta ve şifre zorunludur.');
      return;
    }

    await createMutation.mutateAsync(payload);
  }

  function renderSortIcon(columnKey: UserColumnKey): ReactElement | null {
    if (columnKey !== grid.sortBy) return null;
    return grid.sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  }

  function renderCell(row: UserManagementDto, columnKey: UserColumnKey): ReactNode {
    switch (columnKey) {
      case 'fullName':
        return (
          <div>
            <p className="font-black text-slate-900 dark:text-white">{userDisplayName(row)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{row.username}</p>
          </div>
        );
      case 'email':
        return row.email;
      case 'role':
        return <Badge className="rounded-xl bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200">{row.role || '-'}</Badge>;
      case 'accountType':
        return row.b2bCompanyId
          ? <Badge className="rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{row.b2bBuyerRoleCode || 'Buyer'}</Badge>
          : <Badge className="rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">Admin</Badge>;
      case 'company':
        return row.b2bCompanyName ? `${row.b2bCompanyName} (${row.b2bCompanyCode ?? '-'})` : '-';
      case 'status':
        return row.isActive ? 'Aktif' : 'Pasif';
      default:
        return null;
    }
  }

  return (
    <div className="w-full space-y-6 crm-page">
      <Breadcrumb items={[{ label: 'Erişim Kontrolü' }, { label: 'Kullanıcı Yönetimi', isActive: true }]} />

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-linear-to-br from-white via-cyan-50/70 to-pink-50/70 p-5 shadow-sm dark:border-cyan-800/30 dark:from-blue-950/70 dark:via-blue-950/90 dark:to-cyan-950/40 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-white/80 px-3 py-1.5 text-xs font-black text-cyan-700 shadow-sm dark:border-cyan-800/40 dark:bg-blue-950/60 dark:text-cyan-300">
              <UserRoundCog className="size-4" />
              Yetki ve Kullanıcı Yönetimi
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white">Kullanıcı Yönetimi</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-600 dark:text-slate-300">
              Admin, şirket yöneticisi, alıcı ve onaycı kullanıcılarını tek ekrandan oluşturun; şirket bağlantısı ve yetki gruplarını aynı işlemde yönetin.
            </p>
          </div>
          {canCreate ? (
            <Button onClick={openCreate} className="h-11 rounded-2xl border-0 bg-linear-to-r from-pink-600 to-orange-600 px-6 text-white shadow-lg shadow-pink-500/20 hover:text-white">
              <Plus className="mr-2 size-4" />
              Kullanıcı Oluştur
            </Button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <SummaryCard icon={<Users2 className="size-4" />} label="Toplam Kullanıcı" value={totalCount} tone="cyan" />
          <SummaryCard icon={<Building2 className="size-4" />} label="B2B Kullanıcısı" value={buyerCount} tone="emerald" />
          <SummaryCard icon={<ShieldCheck className="size-4" />} label="Aktif Kullanıcı" value={activeCount} tone="pink" />
        </div>
      </div>

      <PagedDataGrid<UserManagementDto, UserColumnKey>
        pageKey="access-control-user-management"
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        renderCell={renderCell}
        sortBy={grid.sortBy}
        sortDirection={grid.sortDirection}
        onSort={grid.handleSort}
        renderSortIcon={renderSortIcon}
        isLoading={usersQuery.isLoading}
        isError={usersQuery.isError}
        errorText="Kullanıcı listesi yüklenemedi."
        emptyText="Kayıtlı kullanıcı bulunamadı."
        pageSize={grid.pageSize}
        pageSizeOptions={grid.pageSizeOptions}
        onPageSizeChange={grid.handlePageSizeChange}
        pageNumber={grid.getDisplayPageNumber(usersQuery.data)}
        totalPages={usersQuery.data?.totalPages ?? 0}
        hasPreviousPage={usersQuery.data?.hasPreviousPage ?? false}
        hasNextPage={usersQuery.data?.hasNextPage ?? false}
        onPreviousPage={grid.goToPreviousPage}
        onNextPage={grid.goToNextPage}
        previousLabel="Önceki"
        nextLabel="Sonraki"
        paginationInfoText={`${range.from}-${range.to} / ${range.total}`}
        search={{
          value: grid.searchInput,
          onValueChange: grid.searchConfig.onValueChange,
          onSearchChange: grid.searchConfig.onSearchChange,
          placeholder: 'Ad, e-posta veya kullanıcı adı ara',
        }}
        refresh={{
          onRefresh: () => queryClient.invalidateQueries({ queryKey: ['access-control', 'users'] }),
          isLoading: usersQuery.isFetching,
          label: 'Yenile',
        }}
        showActionsColumn
        actionsHeaderLabel="İşlem"
        renderActionsCell={(row) => (
          <div className="flex justify-end gap-2">
            {canUpdate ? (
              <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => void openEdit(row)}>
                <Pencil className="mr-1 size-3.5" />
                Düzenle
              </Button>
            ) : null}
            {canDelete ? (
              <Button type="button" variant="outline" size="sm" className="rounded-xl border-red-200 text-red-600 hover:text-red-700" onClick={() => setDeleteTarget(row)}>
                <Trash2 className="mr-1 size-3.5" />
                Sil
              </Button>
            ) : null}
          </div>
        )}
      />

      <Dialog open={formOpen} onOpenChange={(open) => (open ? setFormOpen(true) : closeForm())}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Kullanıcı Güncelle' : 'Kullanıcı Oluştur'}</DialogTitle>
            <DialogDescription>
              Kullanıcı bilgisi, B2B şirket bağlantısı ve yetki grupları aynı kayıt akışında yönetilir.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-3">
              <button
                type="button"
                className={`rounded-3xl border p-4 text-left transition ${form.accountType === 'Admin' ? 'border-cyan-400 bg-cyan-50 text-cyan-950 shadow-sm dark:border-cyan-500/60 dark:bg-cyan-500/10 dark:text-cyan-100' : 'border-slate-200 bg-white/70 text-slate-700 hover:border-cyan-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'}`}
                onClick={() => handleAccountTypeChange('Admin')}
              >
                <ShieldCheck className="mb-3 size-5" />
                <p className="font-black">Satıcı / İç kullanıcı</p>
                <p className="mt-1 text-xs font-medium opacity-75">CRM’deki gibi panel kullanıcısı ve yetki grupları.</p>
              </button>
              <button
                type="button"
                className={`rounded-3xl border p-4 text-left transition ${form.accountType === 'Buyer' ? 'border-emerald-400 bg-emerald-50 text-emerald-950 shadow-sm dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-100' : 'border-slate-200 bg-white/70 text-slate-700 hover:border-emerald-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'}`}
                onClick={() => handleAccountTypeChange('Buyer')}
              >
                <Building2 className="mb-3 size-5" />
                <p className="font-black">B2B alıcı</p>
                <p className="mt-1 text-xs font-medium opacity-75">Firma ile eşleşir, portalda kendi sepet ve siparişlerini görür.</p>
              </button>
              <button
                type="button"
                className={`rounded-3xl border p-4 text-left transition ${form.accountType === 'CompanyAdmin' || form.accountType === 'Approver' ? 'border-pink-400 bg-pink-50 text-pink-950 shadow-sm dark:border-pink-500/60 dark:bg-pink-500/10 dark:text-pink-100' : 'border-slate-200 bg-white/70 text-slate-700 hover:border-pink-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'}`}
                onClick={() => handleAccountTypeChange('CompanyAdmin')}
              >
                <Users2 className="mb-3 size-5" />
                <p className="font-black">Firma yetkilisi</p>
                <p className="mt-1 text-xs font-medium opacity-75">Alıcı firma yöneticisi veya satın alma onaycısı.</p>
              </button>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex items-center gap-2">
                <UserRoundCog className="size-5 text-cyan-500" />
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">Kullanıcı kimliği</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">CRM kullanıcı formuyla aynı temel bilgiler.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Ad *">
                <Input value={form.firstName} onChange={(event) => setForm((state) => ({ ...state, firstName: event.target.value }))} required />
              </FormField>
              <FormField label="Soyad *">
                <Input value={form.lastName} onChange={(event) => setForm((state) => ({ ...state, lastName: event.target.value }))} required />
              </FormField>
              <FormField label="E-posta *">
                <Input type="email" value={form.email} onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))} required />
              </FormField>
              <FormField label="Kullanıcı adı *">
                <Input value={form.username} onChange={(event) => setForm((state) => ({ ...state, username: event.target.value }))} disabled={Boolean(editingUser)} required />
              </FormField>
              <FormField label="Telefon">
                <Input value={form.phoneNumber} onChange={(event) => setForm((state) => ({ ...state, phoneNumber: event.target.value }))} />
              </FormField>
              <FormField label={editingUser ? 'Yeni şifre' : 'Şifre *'}>
                <Input
                  type="password"
                  value={editingUser ? form.newPassword : form.password}
                  onChange={(event) => setForm((state) => editingUser ? { ...state, newPassword: event.target.value } : { ...state, password: event.target.value })}
                  placeholder={editingUser ? 'Boş bırakırsanız değişmez' : 'Geçici şifre girin'}
                  required={!editingUser}
                />
              </FormField>
              </div>
            </div>

            <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5 md:grid-cols-2">
              <FormField label="Sistem rolü">
                <Select value={form.roleId} onValueChange={handleRoleChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Rol seç" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.id} value={String(role.id)}>{role.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="B2B kullanıcı profili">
                <Select value={form.accountType} onValueChange={(value) => handleAccountTypeChange(value as UserFormState['accountType'])}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Profil seç" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin / İç kullanıcı</SelectItem>
                    <SelectItem value="CompanyAdmin">Şirket yöneticisi</SelectItem>
                    <SelectItem value="Buyer">Alıcı</SelectItem>
                    <SelectItem value="Approver">Onaycı</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              {isB2bAccount(form.accountType) ? (
                <>
                  <FormField label="Eşleşeceği firma *">
                    <Combobox
                      options={companyOptions}
                      value={form.b2bCompanyId}
                      onValueChange={(value) => setForm((state) => ({ ...state, b2bCompanyId: value }))}
                      placeholder="Firma seç"
                      searchPlaceholder="Şirket adı veya kodu ara"
                      emptyText="Şirket bulunamadı"
                      disabled={companiesQuery.isLoading}
                    />
                  </FormField>
                  <FormField label="Firma içi yetki">
                    <Select value={form.b2bBuyerRoleCode} onValueChange={(value) => setForm((state) => ({ ...state, b2bBuyerRoleCode: value as UserFormState['b2bBuyerRoleCode'], accountType: value as UserFormState['accountType'] }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Firma içi yetki seç" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Buyer">Alıcı</SelectItem>
                        <SelectItem value="CompanyAdmin">Firma yöneticisi</SelectItem>
                        <SelectItem value="Approver">Satın alma onaycısı</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Sipariş limiti">
                    <Input type="number" min="0" step="0.01" value={form.b2bOrderLimit} onChange={(event) => setForm((state) => ({ ...state, b2bOrderLimit: event.target.value }))} />
                  </FormField>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                    <KeyRound className="mb-2 size-4" />
                    Bu kullanıcı firma portalına kendi e-postası ve şifresiyle girer; sepet, teklif, sipariş ve ödeme geçmişi kendi firma hesabına bağlanır.
                  </div>
                </>
              ) : null}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">Aktif</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pasif kullanıcı giriş yapamaz.</p>
                </div>
                <Switch checked={form.isActive} onCheckedChange={(checked) => setForm((state) => ({ ...state, isActive: checked }))} />
              </div>
              {isB2bAccount(form.accountType) ? (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">Onay gerekli</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Limit üstü talepler onay akışına düşer.</p>
                  </div>
                  <Switch checked={form.b2bRequiresApproval} onCheckedChange={(checked) => setForm((state) => ({ ...state, b2bRequiresApproval: checked }))} />
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
              <Label className="mb-3 block text-sm font-black">Yetki grupları</Label>
              <PermissionGroupMultiSelect
                value={form.permissionGroupIds}
                onChange={(ids) => setForm((state) => ({ ...state, permissionGroupIds: ids }))}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForm}>Vazgeç</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcı silinsin mi?</DialogTitle>
            <DialogDescription>
              {deleteTarget ? `${userDisplayName(deleteTarget)} pasif silinecek ve varsa B2B alıcı bağlantısı kapatılacak.` : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>Vazgeç</Button>
            <Button type="button" variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: 'cyan' | 'emerald' | 'pink' }): ReactElement {
  const toneClass = {
    cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-cyan-800/30 dark:bg-blue-950/50">
      <div className="flex items-center gap-3">
        <div className={`rounded-2xl p-2.5 ${toneClass}`}>{icon}</div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }): ReactElement {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-black text-slate-700 dark:text-slate-200">{label}</Label>
      {children}
    </div>
  );
}
