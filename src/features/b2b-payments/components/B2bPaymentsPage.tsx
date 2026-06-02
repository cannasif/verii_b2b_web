import { type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock3, Copy, Link2, ReceiptText, RefreshCw, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { paymentApi } from '../api/payment.api';
import type { PaymentErpPostingDto, PaymentOrderDto, PaymentProviderOperationDto } from '../types/payment.types';

type PaymentColumnKey = 'primary' | 'secondary' | 'scope' | 'status' | 'amount' | 'date';
type OperationColumnKey = 'primary' | 'secondary' | 'scope' | 'status' | 'amount' | 'date';
type ErpPostingColumnKey = 'primary' | 'scope' | 'status' | 'amount' | 'attempt' | 'date';

type PaymentLinkDraft = {
  paymentOrder: PaymentOrderDto;
  providerKey: string;
  customerEmail: string;
  shareChannel: string;
  expiresAt: string;
  regenerateToken: boolean;
};

type PartialCollectionDraft = {
  paymentOrder: PaymentOrderDto;
  amount: string;
  providerKey: string;
  paymentMethod: string;
  paymentInstallmentId: string;
  paymentOrderAllocationId: string;
  collectionDate: string;
  externalReference: string;
  queueErpPosting: boolean;
  notes: string;
};

const paymentColumns: PagedDataGridColumn<PaymentColumnKey>[] = [
  { key: 'primary', label: 'Ödeme Emri' },
  { key: 'secondary', label: 'Sağlayıcı / Link' },
  { key: 'scope', label: 'Kapsam' },
  { key: 'status', label: 'Durum' },
  { key: 'amount', label: 'Tutar' },
  { key: 'date', label: 'Tarih' },
];

const operationColumns: PagedDataGridColumn<OperationColumnKey>[] = [
  { key: 'primary', label: 'Operasyon' },
  { key: 'secondary', label: 'Referans' },
  { key: 'scope', label: 'İşlem' },
  { key: 'status', label: 'Durum' },
  { key: 'amount', label: 'Tutar' },
  { key: 'date', label: 'Tarih' },
];

const erpPostingColumns: PagedDataGridColumn<ErpPostingColumnKey>[] = [
  { key: 'primary', label: 'ERP Kayıt' },
  { key: 'scope', label: 'Kapsam' },
  { key: 'status', label: 'Durum' },
  { key: 'amount', label: 'Tutar' },
  { key: 'attempt', label: 'Deneme' },
  { key: 'date', label: 'Tarih' },
];

function formatMoney(amount?: number, currencyCode = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currencyCode }).format(amount ?? 0);
}

function formatDate(value?: string): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('tr-TR');
}

function statusBadge(status?: string): ReactElement {
  const normalized = (status ?? '').toLowerCase();
  const isGood = ['paid', 'completed', 'success', 'approved'].some((item) => normalized.includes(item));
  const isBad = ['failed', 'cancelled', 'rejected', 'error'].some((item) => normalized.includes(item));
  return <Badge variant={isBad ? 'destructive' : isGood ? 'default' : 'secondary'}>{status || '-'}</Badge>;
}

function canGeneratePaymentLink(paymentOrder: PaymentOrderDto): boolean {
  const status = paymentOrder.status?.toLowerCase() ?? '';
  return !paymentOrder.paymentLinkUrl && !['paid', 'cancelled', 'canceled'].includes(status) && (paymentOrder.remainingAmount ?? paymentOrder.amount) > 0;
}

function defaultPaymentLinkDraft(paymentOrder: PaymentOrderDto): PaymentLinkDraft {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return {
    paymentOrder,
    providerKey: paymentOrder.paymentLinkProvider || paymentOrder.providerKey || 'PORTAL',
    customerEmail: paymentOrder.paymentLinkCustomerEmail || '',
    shareChannel: paymentOrder.paymentLinkShareChannel || 'COPY',
    expiresAt: expiresAt.toISOString().slice(0, 16),
    regenerateToken: false,
  };
}

function defaultPartialCollectionDraft(paymentOrder: PaymentOrderDto): PartialCollectionDraft {
  return {
    paymentOrder,
    amount: String(paymentOrder.remainingAmount || paymentOrder.amount),
    providerKey: paymentOrder.providerKey || 'MANUAL',
    paymentMethod: 'PARTIAL_COLLECTION',
    paymentInstallmentId: '',
    paymentOrderAllocationId: '',
    collectionDate: new Date().toISOString().slice(0, 16),
    externalReference: '',
    queueErpPosting: true,
    notes: '',
  };
}

export function B2bPaymentsPage(): ReactElement {
  const { setPageTitle } = useUIStore();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const appliedDrilldownRef = useRef('');
  const [paymentLinkDraft, setPaymentLinkDraft] = useState<PaymentLinkDraft | null>(null);
  const [partialDraft, setPartialDraft] = useState<PartialCollectionDraft | null>(null);
  const grid = usePagedDataGrid<PaymentColumnKey>({
    pageKey: 'b2b-payments',
    defaultSortBy: 'date',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy: (key) => ({ primary: 'PaymentOrderNumber', secondary: 'PaymentLinkStatus', scope: 'CustomerId', status: 'Status', amount: 'RemainingAmount', date: 'DueDate' })[key],
  });

  const query = useQuery({
    queryKey: ['b2b-payment-orders', grid.queryParams],
    queryFn: () => paymentApi.getPaymentOrders(grid.queryParams),
  });
  const dashboardQuery = useQuery({
    queryKey: ['b2b-payment-finance-dashboard'],
    queryFn: () => paymentApi.getFinanceDashboard(),
  });

  const rows = useMemo(() => query.data?.data ?? [], [query.data?.data]);
  const dashboard = dashboardQuery.data;
  const range = getPagedRange(query.data);

  const linkMutation = useMutation({
    mutationFn: async (draft: PaymentLinkDraft) => {
      const result = await paymentApi.generatePaymentOrderLink(draft.paymentOrder.id, {
        portalBaseUrl: window.location.origin,
        providerKey: draft.providerKey,
        customerEmail: draft.customerEmail || undefined,
        shareChannel: draft.shareChannel,
        expiresAt: new Date(draft.expiresAt).toISOString(),
        regenerateToken: draft.regenerateToken,
      });
      if (result.paymentLinkUrl && navigator.clipboard) {
        await navigator.clipboard.writeText(result.paymentLinkUrl);
      }
      return result;
    },
    onSuccess: async (result) => {
      setPaymentLinkDraft(null);
      toast.success(`${result.paymentOrderNumber} ödeme linki hazırlandı${result.paymentLinkUrl ? ' ve kopyalandı' : ''}.`);
      await queryClient.invalidateQueries({ queryKey: ['b2b-payment-orders'] });
      await queryClient.invalidateQueries({ queryKey: ['b2b-payment-finance-dashboard'] });
    },
    onError: (error: Error) => toast.error(error.message || 'Ödeme linki oluşturulamadı.'),
  });

  const partialCollectionMutation = useMutation({
    mutationFn: async (draft: PartialCollectionDraft) => {
      const amount = Number(draft.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Tahsilat tutarı geçerli olmalı.');
      }

      return paymentApi.applyPartialCollection(draft.paymentOrder.id, {
        amount,
        currencyCode: draft.paymentOrder.currencyCode,
        providerKey: draft.providerKey,
        paymentMethod: draft.paymentMethod,
        paymentInstallmentId: draft.paymentInstallmentId ? Number(draft.paymentInstallmentId) : undefined,
        paymentOrderAllocationId: draft.paymentOrderAllocationId ? Number(draft.paymentOrderAllocationId) : undefined,
        collectionDate: draft.collectionDate ? new Date(draft.collectionDate).toISOString() : undefined,
        externalReference: draft.externalReference || undefined,
        queueErpPosting: draft.queueErpPosting,
        notes: draft.notes || undefined,
      });
    },
    onSuccess: async () => {
      setPartialDraft(null);
      toast.success('Kısmi tahsilat işlendi ve mutabakat kuyruğu güncellendi.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['b2b-payment-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['b2b-payment-erp-postings'] }),
        queryClient.invalidateQueries({ queryKey: ['b2b-payment-finance-dashboard'] }),
      ]);
    },
    onError: (error: Error) => toast.error(error.message || 'Kısmi tahsilat işlenemedi.'),
  });

  useEffect(() => {
    setPageTitle('Ödemeler');
    return () => setPageTitle(null);
  }, [setPageTitle]);

  useEffect(() => {
    const drilldown = searchParams.get('drilldown');
    if (!drilldown || appliedDrilldownRef.current === drilldown) return;
    appliedDrilldownRef.current = drilldown;
    const search = drilldown === 'overdue' ? 'Pending' : drilldown;
    grid.searchConfig.onValueChange(search);
    grid.searchConfig.onSearchChange(search);
  }, [grid, searchParams]);

  function renderCell(row: PaymentOrderDto, columnKey: PaymentColumnKey): ReactElement | string {
    const values = {
      primary: <span className="font-mono text-sm font-semibold text-slate-950 dark:text-white">{row.paymentOrderNumber}</span>,
      secondary: row.paymentLinkUrl ? 'Link hazır' : row.providerKey || row.paymentMethod || '-',
      scope: row.orderId ? `Sipariş #${row.orderId}` : (row.allocations?.length ? `${row.allocations.length} açık kalem` : 'Cari tahsilat'),
      status: statusBadge(row.status),
      amount: formatMoney(row.remainingAmount || row.amount, row.currencyCode),
      date: row.paymentLinkExpiresAt ? `Link: ${formatDate(row.paymentLinkExpiresAt)}` : formatDate(row.dueDate),
    };
    return values[columnKey];
  }

  return (
    <div className="w-full space-y-6 crm-page">
      <Breadcrumb items={[{ label: 'B2B' }, { label: 'Ödemeler', isActive: true }]} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">Finans operasyonu</Badge>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Ödemeler</h1>
          <p className="mt-2 max-w-4xl text-sm font-medium text-slate-500 dark:text-slate-400">
            Cari bazlı ödeme emirlerini, ödeme linklerini, kalan tutarları ve sağlayıcı durumlarını yönetin.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/b2b/payments/create">Oluştur</Link>
          </Button>
          <Button type="button" variant="outline" onClick={() => void query.refetch()}>
            <RefreshCw className="mr-2 size-4" />
            Yenile
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Clock3 className="size-5" />}
          label="Bekleyen ödeme"
          value={`${dashboard?.pendingPaymentOrderCount ?? 0} · ${formatMoney(dashboard?.pendingPaymentAmount, dashboard?.currencyCode)}`}
          to="/b2b/payments?drilldown=pending"
        />
        <MetricCard
          icon={<TriangleAlert className="size-5" />}
          label="Vadesi geçen"
          value={`${dashboard?.overduePaymentOrderCount ?? 0} · ${formatMoney(dashboard?.overduePaymentAmount, dashboard?.currencyCode)}`}
          to="/b2b/payments?drilldown=overdue"
        />
        <MetricCard
          icon={<RefreshCw className="size-5" />}
          label="ERP aktarım hatası"
          value={dashboard?.failedErpPostingCount ?? 0}
          to="/b2b/payment-operations?target=erp&search=Failed"
        />
        <MetricCard
          icon={<ReceiptText className="size-5" />}
          label="Callback / iade takibi"
          value={`${dashboard?.failedCallbackCount ?? 0} / ${dashboard?.pendingRefundCount ?? 0}`}
          to="/b2b/payment-operations?target=operations&search=REFUND"
        />
      </div>

      {(dashboard?.currencyBreakdowns?.length ?? 0) > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {dashboard!.currencyBreakdowns.slice(0, 4).map((item) => (
            <Card key={item.key} className="border-slate-200/80 shadow-sm dark:border-white/10 dark:bg-white/3">
              <CardContent className="p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{item.displayName}</p>
                <p className="mt-2 text-xl font-black text-slate-950 dark:text-white">{formatMoney(item.pendingPaymentAmount, item.currencyCode)}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {item.pendingPaymentOrderCount} bekleyen · {item.overduePaymentOrderCount} vadesi geçen
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <PagedDataGrid<PaymentOrderDto, PaymentColumnKey>
        pageKey="b2b-payments"
        columns={paymentColumns}
        rows={rows}
        rowKey={(row) => row.id}
        renderCell={renderCell}
        sortBy={grid.sortBy}
        sortDirection={grid.sortDirection}
        onSort={grid.handleSort}
        isLoading={query.isLoading}
        isError={Boolean(query.error)}
        errorText={(query.error as Error | undefined)?.message}
        emptyText="Henüz ödeme emri yok."
        pageSize={grid.pageSize}
        pageSizeOptions={grid.pageSizeOptions}
        onPageSizeChange={grid.handlePageSizeChange}
        pageNumber={grid.getDisplayPageNumber(query.data)}
        totalPages={query.data?.totalPages ?? 0}
        hasPreviousPage={query.data?.hasPreviousPage ?? false}
        hasNextPage={query.data?.hasNextPage ?? false}
        onPreviousPage={grid.goToPreviousPage}
        onNextPage={grid.goToNextPage}
        previousLabel="Önceki"
        nextLabel="Sonraki"
        paginationInfoText={`${range.from}-${range.to} / ${range.total}`}
        search={{
          value: grid.searchInput,
          onValueChange: grid.searchConfig.onValueChange,
          onSearchChange: grid.searchConfig.onSearchChange,
          placeholder: 'Ödeme emri, sağlayıcı veya cari ara...',
        }}
        refresh={{ onRefresh: () => void query.refetch(), isLoading: query.isLoading, label: 'Yenile' }}
        showActionsColumn
        actionsHeaderLabel="İşlemler"
        renderActionsCell={(row) => (
          <div className="flex justify-end gap-2">
            {canGeneratePaymentLink(row) ? (
              <Button type="button" size="sm" variant="outline" onClick={() => setPaymentLinkDraft(defaultPaymentLinkDraft(row))}>
                <Link2 className="mr-2 size-4" />
                Link
              </Button>
            ) : null}
            {(row.remainingAmount ?? 0) > 0 ? (
              <Button type="button" size="sm" variant="outline" onClick={() => setPartialDraft(defaultPartialCollectionDraft(row))}>
                <ReceiptText className="mr-2 size-4" />
                Tahsilat
              </Button>
            ) : null}
            {row.paymentLinkUrl ? (
              <Button type="button" size="sm" variant="outline" onClick={() => void navigator.clipboard?.writeText(row.paymentLinkUrl || '')}>
                <Copy className="mr-2 size-4" />
                Kopyala
              </Button>
            ) : null}
          </div>
        )}
      />

      <Dialog open={Boolean(paymentLinkDraft)} onOpenChange={(open) => !open && setPaymentLinkDraft(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ödeme Linki Oluştur</DialogTitle>
          </DialogHeader>
          {paymentLinkDraft ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold">Sağlayıcı</span>
                  <Select value={paymentLinkDraft.providerKey} onValueChange={(value) => setPaymentLinkDraft((current) => current ? { ...current, providerKey: value } : current)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PORTAL">Portal</SelectItem>
                      <SelectItem value="PAYTR">PayTR</SelectItem>
                      <SelectItem value="IYZICO">iyzico</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold">Paylaşım Kanalı</span>
                  <Select value={paymentLinkDraft.shareChannel} onValueChange={(value) => setPaymentLinkDraft((current) => current ? { ...current, shareChannel: value } : current)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COPY">Kopyala</SelectItem>
                      <SelectItem value="EMAIL">E-posta</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold">Müşteri E-postası</span>
                  <Input value={paymentLinkDraft.customerEmail} onChange={(event) => setPaymentLinkDraft((current) => current ? { ...current, customerEmail: event.target.value } : current)} />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold">Geçerlilik</span>
                  <Input type="datetime-local" value={paymentLinkDraft.expiresAt} onChange={(event) => setPaymentLinkDraft((current) => current ? { ...current, expiresAt: event.target.value } : current)} />
                </label>
              </div>
              <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                <span className="text-sm font-semibold">Yeni token üret</span>
                <Switch checked={paymentLinkDraft.regenerateToken} onCheckedChange={(checked) => setPaymentLinkDraft((current) => current ? { ...current, regenerateToken: checked } : current)} />
              </label>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPaymentLinkDraft(null)}>Vazgeç</Button>
                <Button type="button" onClick={() => linkMutation.mutate(paymentLinkDraft)} disabled={linkMutation.isPending}>
                  {linkMutation.isPending ? 'Oluşturuluyor' : 'Link Oluştur'}
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(partialDraft)} onOpenChange={(open) => !open && setPartialDraft(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kısmi Tahsilat İşle</DialogTitle>
          </DialogHeader>
          {partialDraft ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                <div className="font-bold">{partialDraft.paymentOrder.paymentOrderNumber}</div>
                <div className="mt-1 text-slate-500 dark:text-slate-400">
                  Kalan tutar: {formatMoney(partialDraft.paymentOrder.remainingAmount, partialDraft.paymentOrder.currencyCode)}
                </div>
              </div>
              {(partialDraft.paymentOrder.allocations?.length ?? 0) > 0 ? (
                <div className="grid gap-3">
                  {partialDraft.paymentOrder.allocations.map((allocation) => {
                    const remainingAllocation = Math.max((allocation.allocatedAmount || allocation.openAmount || 0) - (allocation.paidAmount || 0), 0);
                    const active = partialDraft.paymentOrderAllocationId === String(allocation.id);
                    return (
                      <button
                        key={allocation.id}
                        type="button"
                        className={`rounded-2xl border p-4 text-left transition ${active ? 'border-emerald-500 bg-emerald-50 text-emerald-950 dark:border-emerald-400 dark:bg-emerald-500/10 dark:text-emerald-100' : 'border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/5'}`}
                        onClick={() => setPartialDraft((current) => current ? {
                          ...current,
                          paymentOrderAllocationId: active ? '' : String(allocation.id),
                          amount: active ? current.amount : String(remainingAllocation || allocation.allocatedAmount || current.amount),
                        } : current)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-black">
                              {allocation.erpDocumentNumber || allocation.erpDocumentReference || allocation.allocationType}
                            </div>
                            <div className="mt-1 text-xs font-semibold opacity-75">
                              {allocation.allocationType} · {allocation.status || 'Bekliyor'} · Vade {formatDate(allocation.dueDate)}
                            </div>
                          </div>
                          <Badge variant={active ? 'default' : 'secondary'}>{formatMoney(remainingAllocation, allocation.currencyCode)}</Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold">Tahsilat Tutarı</span>
                  <Input type="number" min="0.01" step="0.01" value={partialDraft.amount} onChange={(event) => setPartialDraft((current) => current ? { ...current, amount: event.target.value } : current)} />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold">Sağlayıcı</span>
                  <Select value={partialDraft.providerKey} onValueChange={(value) => setPartialDraft((current) => current ? { ...current, providerKey: value } : current)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUAL">Manuel / Banka</SelectItem>
                      <SelectItem value="ACCOUNT">Açık Hesap</SelectItem>
                      <SelectItem value="PAYTR">PayTR</SelectItem>
                      <SelectItem value="IYZICO">iyzico</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold">Taksit / Vade Satırı</span>
                  <Select value={partialDraft.paymentInstallmentId || 'AUTO'} onValueChange={(value) => setPartialDraft((current) => current ? { ...current, paymentInstallmentId: value === 'AUTO' ? '' : value } : current)}>
                    <SelectTrigger><SelectValue placeholder="Otomatik dağıt" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUTO">Otomatik dağıt</SelectItem>
                      {partialDraft.paymentOrder.installments.map((installment) => (
                        <SelectItem key={installment.id} value={String(installment.id)}>
                          {installment.installmentNumber}. vade · {formatMoney(installment.amount - installment.paidAmount, partialDraft.paymentOrder.currencyCode)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                {(partialDraft.paymentOrder.allocations?.length ?? 0) > 0 ? (
                  <label className="space-y-2">
                    <span className="text-sm font-semibold">Fatura / Açık Kalem</span>
                    <Select value={partialDraft.paymentOrderAllocationId || 'AUTO'} onValueChange={(value) => setPartialDraft((current) => current ? { ...current, paymentOrderAllocationId: value === 'AUTO' ? '' : value } : current)}>
                      <SelectTrigger><SelectValue placeholder="Otomatik dağıt" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUTO">Otomatik dağıt</SelectItem>
                        {partialDraft.paymentOrder.allocations.map((allocation) => {
                          const remainingAllocation = Math.max((allocation.allocatedAmount || allocation.openAmount || 0) - (allocation.paidAmount || 0), 0);
                          return (
                            <SelectItem key={allocation.id} value={String(allocation.id)}>
                              {allocation.erpDocumentNumber || allocation.erpDocumentReference || allocation.allocationType} · {formatMoney(remainingAllocation, allocation.currencyCode)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </label>
                ) : null}
                <label className="space-y-2">
                  <span className="text-sm font-semibold">Tahsilat Tarihi</span>
                  <Input type="datetime-local" value={partialDraft.collectionDate} onChange={(event) => setPartialDraft((current) => current ? { ...current, collectionDate: event.target.value } : current)} />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold">Banka / ERP Referansı</span>
                  <Input value={partialDraft.externalReference} onChange={(event) => setPartialDraft((current) => current ? { ...current, externalReference: event.target.value } : current)} />
                </label>
              </div>
              <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                <span className="text-sm font-semibold">ERP cari tahsilat kuyruğuna al</span>
                <Switch checked={partialDraft.queueErpPosting} onCheckedChange={(checked) => setPartialDraft((current) => current ? { ...current, queueErpPosting: checked } : current)} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold">Not</span>
                <Input value={partialDraft.notes} onChange={(event) => setPartialDraft((current) => current ? { ...current, notes: event.target.value } : current)} />
              </label>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPartialDraft(null)}>Vazgeç</Button>
                <Button type="button" onClick={() => partialCollectionMutation.mutate(partialDraft)} disabled={partialCollectionMutation.isPending}>
                  {partialCollectionMutation.isPending ? 'İşleniyor' : 'Tahsilatı İşle'}
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function B2bPaymentOperationsPage(): ReactElement {
  const { setPageTitle } = useUIStore();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const appliedOperationDrilldownRef = useRef('');
  const grid = usePagedDataGrid<OperationColumnKey>({
    pageKey: 'b2b-payment-operations',
    defaultSortBy: 'date',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy: (key) => ({ primary: 'OperationType', secondary: 'ExternalOperationId', scope: 'PaymentTransactionId', status: 'Status', amount: 'Amount', date: 'RequestedDate' })[key],
  });
  const erpGrid = usePagedDataGrid<ErpPostingColumnKey>({
    pageKey: 'b2b-payment-erp-postings',
    defaultSortBy: 'date',
    defaultSortDirection: 'desc',
    defaultPageSize: 20,
    mapSortBy: (key) => ({ primary: 'IdempotencyKey', scope: 'PaymentOrderId', status: 'Status', amount: 'Amount', attempt: 'AttemptCount', date: 'RequestedDate' })[key],
  });

  const query = useQuery({
    queryKey: ['b2b-payment-provider-operations', grid.queryParams],
    queryFn: () => paymentApi.getPaymentProviderOperations(grid.queryParams),
  });
  const erpQuery = useQuery({
    queryKey: ['b2b-payment-erp-postings', erpGrid.queryParams],
    queryFn: () => paymentApi.getPaymentErpPostings(erpGrid.queryParams),
  });
  const rows = useMemo(() => query.data?.data ?? [], [query.data?.data]);
  const range = getPagedRange(query.data);
  const erpRows = useMemo(() => erpQuery.data?.data ?? [], [erpQuery.data?.data]);
  const erpRange = getPagedRange(erpQuery.data);

  const executeMutation = useMutation({
    mutationFn: (operationId: number) => paymentApi.executePaymentProviderOperation(operationId),
    onSuccess: async () => {
      toast.success('Ödeme operasyonu sağlayıcıya gönderildi.');
      await queryClient.invalidateQueries({ queryKey: ['b2b-payment-provider-operations'] });
    },
    onError: (error: Error) => toast.error(error.message || 'Ödeme operasyonu gönderilemedi.'),
  });

  const executeErpMutation = useMutation({
    mutationFn: (postingId: number) => paymentApi.executePaymentErpPosting(postingId),
    onSuccess: async () => {
      toast.success('ERP tahsilat kaydı çalıştırıldı.');
      await queryClient.invalidateQueries({ queryKey: ['b2b-payment-erp-postings'] });
    },
    onError: (error: Error) => toast.error(error.message || 'ERP tahsilat kaydı çalıştırılamadı.'),
  });

  const executePendingErpMutation = useMutation({
    mutationFn: () => paymentApi.executePendingPaymentErpPostings(false),
    onSuccess: async (count) => {
      toast.success(`${count} ERP tahsilat kaydı işlendi.`);
      await queryClient.invalidateQueries({ queryKey: ['b2b-payment-erp-postings'] });
    },
    onError: (error: Error) => toast.error(error.message || 'ERP tahsilat kuyruğu çalıştırılamadı.'),
  });

  useEffect(() => {
    setPageTitle('Ödeme Operasyonları');
    return () => setPageTitle(null);
  }, [setPageTitle]);

  useEffect(() => {
    const search = searchParams.get('search');
    if (!search) return;
    const target = searchParams.get('target');
    const key = `${target ?? 'operations'}:${search}`;
    if (appliedOperationDrilldownRef.current === key) return;
    appliedOperationDrilldownRef.current = key;
    if (target === 'erp') {
      erpGrid.searchConfig.onValueChange(search);
      erpGrid.searchConfig.onSearchChange(search);
      return;
    }

    grid.searchConfig.onValueChange(search);
    grid.searchConfig.onSearchChange(search);
  }, [erpGrid, grid, searchParams]);

  function renderCell(row: PaymentProviderOperationDto, columnKey: OperationColumnKey): ReactElement | string {
    const values = {
      primary: row.operationType,
      secondary: row.externalOperationId || row.idempotencyKey || '-',
      scope: `İşlem #${row.paymentTransactionId}`,
      status: statusBadge(row.status),
      amount: formatMoney(row.amount, row.currencyCode),
      date: formatDate(row.processedDate || row.requestedDate),
    };
    return values[columnKey];
  }

  function renderErpCell(row: PaymentErpPostingDto, columnKey: ErpPostingColumnKey): ReactElement | string {
    const values = {
      primary: <span className="font-mono text-xs font-semibold">{row.idempotencyKey || `ERP-${row.id}`}</span>,
      scope: `Ödeme emri #${row.paymentOrderId}${row.erpCustomerCode ? ` · ${row.erpCustomerCode}` : ''}`,
      status: statusBadge(row.status),
      amount: formatMoney(row.amount, row.currencyCode),
      attempt: `${row.attemptCount || 0} deneme`,
      date: formatDate(row.postedDate || row.lastAttemptDate || row.requestedDate),
    };
    return values[columnKey];
  }

  return (
    <div className="w-full space-y-6 crm-page">
      <Breadcrumb items={[{ label: 'B2B' }, { label: 'Ödeme Operasyonları', isActive: true }]} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">Finans operasyonu</Badge>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Ödeme Operasyonları</h1>
          <p className="mt-2 max-w-4xl text-sm font-medium text-slate-500 dark:text-slate-400">
            İade, iptal, ERP cari tahsilat aktarımı ve mutabakat operasyonlarını sağlayıcı durumuyla yönetin.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/b2b/payment-operations/create">Oluştur</Link>
          </Button>
          <Button type="button" variant="outline" onClick={() => void query.refetch()}>
            <RefreshCw className="mr-2 size-4" />
            Yenile
          </Button>
          <Button type="button" variant="outline" onClick={() => executePendingErpMutation.mutate()} disabled={executePendingErpMutation.isPending}>
            <ReceiptText className="mr-2 size-4" />
            ERP Kuyruğunu Çalıştır
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={<Clock3 className="size-5" />} label="Bekleyen" value={rows.filter((row) => ['pending', 'failed'].includes(row.status?.toLowerCase())).length} />
        <MetricCard icon={<CheckCircle2 className="size-5" />} label="Tamamlanan" value={rows.filter((row) => row.status?.toLowerCase().includes('completed')).length} />
        <MetricCard icon={<TriangleAlert className="size-5" />} label="Hatalı" value={rows.filter((row) => row.status?.toLowerCase().includes('failed')).length} />
      </div>

      <PagedDataGrid<PaymentProviderOperationDto, OperationColumnKey>
        pageKey="b2b-payment-operations"
        columns={operationColumns}
        rows={rows}
        rowKey={(row) => row.id}
        renderCell={renderCell}
        sortBy={grid.sortBy}
        sortDirection={grid.sortDirection}
        onSort={grid.handleSort}
        isLoading={query.isLoading}
        isError={Boolean(query.error)}
        errorText={(query.error as Error | undefined)?.message}
        emptyText="Henüz ödeme operasyonu yok."
        pageSize={grid.pageSize}
        pageSizeOptions={grid.pageSizeOptions}
        onPageSizeChange={grid.handlePageSizeChange}
        pageNumber={grid.getDisplayPageNumber(query.data)}
        totalPages={query.data?.totalPages ?? 0}
        hasPreviousPage={query.data?.hasPreviousPage ?? false}
        hasNextPage={query.data?.hasNextPage ?? false}
        onPreviousPage={grid.goToPreviousPage}
        onNextPage={grid.goToNextPage}
        previousLabel="Önceki"
        nextLabel="Sonraki"
        paginationInfoText={`${range.from}-${range.to} / ${range.total}`}
        search={{
          value: grid.searchInput,
          onValueChange: grid.searchConfig.onValueChange,
          onSearchChange: grid.searchConfig.onSearchChange,
          placeholder: 'Operasyon, sağlayıcı veya referans ara...',
        }}
        refresh={{ onRefresh: () => void query.refetch(), isLoading: query.isLoading, label: 'Yenile' }}
        showActionsColumn
        actionsHeaderLabel="İşlemler"
        renderActionsCell={(row) => {
          const canExecute = ['pending', 'failed'].includes(row.status?.toLowerCase());
          return canExecute ? (
            <Button type="button" size="sm" variant="outline" onClick={() => executeMutation.mutate(row.id)} disabled={executeMutation.isPending}>
              Gönder
            </Button>
          ) : null;
        }}
      />

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">ERP / Cari Tahsilat Mutabakatı</h2>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Ödeme sağlayıcıdan tamamlanan tahsilatların Netsis cari hareketine aktarım durumunu ve hatalarını izleyin.
          </p>
        </div>
        <PagedDataGrid<PaymentErpPostingDto, ErpPostingColumnKey>
          pageKey="b2b-payment-erp-postings"
          columns={erpPostingColumns}
          rows={erpRows}
          rowKey={(row) => row.id}
          renderCell={renderErpCell}
          sortBy={erpGrid.sortBy}
          sortDirection={erpGrid.sortDirection}
          onSort={erpGrid.handleSort}
          isLoading={erpQuery.isLoading}
          isError={Boolean(erpQuery.error)}
          errorText={(erpQuery.error as Error | undefined)?.message}
          emptyText="Henüz ERP tahsilat kaydı yok."
          pageSize={erpGrid.pageSize}
          pageSizeOptions={erpGrid.pageSizeOptions}
          onPageSizeChange={erpGrid.handlePageSizeChange}
          pageNumber={erpGrid.getDisplayPageNumber(erpQuery.data)}
          totalPages={erpQuery.data?.totalPages ?? 0}
          hasPreviousPage={erpQuery.data?.hasPreviousPage ?? false}
          hasNextPage={erpQuery.data?.hasNextPage ?? false}
          onPreviousPage={erpGrid.goToPreviousPage}
          onNextPage={erpGrid.goToNextPage}
          previousLabel="Önceki"
          nextLabel="Sonraki"
          paginationInfoText={`${erpRange.from}-${erpRange.to} / ${erpRange.total}`}
          search={{
            value: erpGrid.searchInput,
            onValueChange: erpGrid.searchConfig.onValueChange,
            onSearchChange: erpGrid.searchConfig.onSearchChange,
            placeholder: 'ERP referansı, cari kodu veya durum ara...',
          }}
          refresh={{ onRefresh: () => void erpQuery.refetch(), isLoading: erpQuery.isLoading, label: 'Yenile' }}
          showActionsColumn
          actionsHeaderLabel="İşlemler"
          renderActionsCell={(row) => {
            const canExecute = ['pending', 'failed'].includes(row.status?.toLowerCase());
            return canExecute ? (
              <Button type="button" size="sm" variant="outline" onClick={() => executeErpMutation.mutate(row.id)} disabled={executeErpMutation.isPending}>
                ERP’ye Aktar
              </Button>
            ) : null;
          }}
        />
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, to }: { icon: ReactElement; label: string; value: number | string; to?: string }): ReactElement {
  const content = (
    <Card className="border-slate-200/80 shadow-sm dark:border-white/10 dark:bg-white/3">
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-950">{icon}</span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="text-2xl font-black text-slate-950 dark:text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );

  return to ? <Link to={to} className="block transition hover:-translate-y-0.5">{content}</Link> : content;
}
