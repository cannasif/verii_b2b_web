import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, Plus, ReceiptText, ShieldCheck, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FormPageShell, PagedLookupDialog } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCurrencyOptions } from '@/services/hooks/useCurrencyOptions';
import { lookupApi } from '@/services/lookup-api';
import type { CustomerLookup } from '@/services/lookup-types';
import { b2bApi } from '@/features/b2b/api/b2b.api';
import type { OrderDto } from '@/features/b2b/types/b2b.types';
import { paymentApi } from '../api/payment.api';
import type { PaymentTransactionDto } from '../types/payment.types';

interface PaymentOrderFormState {
  customerId: string;
  customerLabel: string;
  orderId: string;
  orderLabel: string;
  amount: string;
  currencyCode: string;
  providerKey: string;
  paymentMethod: string;
  paymentTermDays: string;
  dueDate: string;
  installmentCount: string;
  notes: string;
  allocations: PaymentAllocationFormState[];
}

interface PaymentAllocationFormState {
  localId: string;
  allocationType: string;
  erpDocumentType: string;
  erpDocumentNumber: string;
  erpDocumentReference: string;
  documentDate: string;
  dueDate: string;
  documentAmount: string;
  openAmount: string;
  allocatedAmount: string;
  externalReference: string;
  notes: string;
}

interface PaymentOperationFormState {
  paymentTransactionId: string;
  paymentTransactionLabel: string;
  operationType: string;
  amount: string;
  currencyCode: string;
  idempotencyKey: string;
  reason: string;
}

type PaymentLookupField = 'customer' | 'order' | 'paymentTransaction';

const paymentProviderOptions = [
  { label: 'PayTR', value: 'PAYTR', maxInstallment: 12 },
  { label: 'iyzico', value: 'IYZICO', maxInstallment: 12 },
  { label: 'Açık Hesap', value: 'OPEN_ACCOUNT', maxInstallment: 1 },
] as const;

const paymentMethodOptions = [
  { label: 'Kredi/Banka Kartı', value: 'CARD' },
  { label: 'Açık Hesap', value: 'OPEN_ACCOUNT' },
  { label: 'Havale/EFT', value: 'BANK_TRANSFER' },
] as const;

const operationTypeOptions = [
  { label: 'İade', value: 'REFUND' },
  { label: 'İptal', value: 'CANCEL' },
  { label: 'Kısmi Ödeme', value: 'PARTIAL_PAYMENT' },
  { label: 'Mutabakat', value: 'RECONCILIATION' },
] as const;

function toRequiredNumber(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} geçerli bir değer olmalı.`);
  }
  return parsed;
}

function toOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function trimOptional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function createAllocationDraft(): PaymentAllocationFormState {
  return {
    localId: crypto.randomUUID(),
    allocationType: 'Invoice',
    erpDocumentType: '',
    erpDocumentNumber: '',
    erpDocumentReference: '',
    documentDate: '',
    dueDate: '',
    documentAmount: '',
    openAmount: '',
    allocatedAmount: '',
    externalReference: '',
    notes: '',
  };
}

function hasAllocationValue(item: PaymentAllocationFormState): boolean {
  return Boolean(
    item.erpDocumentNumber.trim()
    || item.erpDocumentReference.trim()
    || item.documentAmount.trim()
    || item.openAmount.trim()
    || item.allocatedAmount.trim()
  );
}

function formatMoney(amount?: number, currencyCode = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currencyCode || 'TRY',
    maximumFractionDigits: 2,
  }).format(amount ?? 0);
}

function getInstallmentOptions(providerKey: string): Array<{ label: string; value: string }> {
  const provider = paymentProviderOptions.find((item) => item.value === providerKey);
  const maxInstallment = provider?.maxInstallment ?? 1;
  return Array.from({ length: maxInstallment }, (_, index) => {
    const installment = index + 1;
    return {
      label: installment === 1 ? 'Tek çekim' : `${installment} taksit`,
      value: String(installment),
    };
  });
}

function addDays(date: Date, days: number): string {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString().slice(0, 10);
}

function defaultPaymentOrderState(): PaymentOrderFormState {
  return {
    customerId: '',
    customerLabel: '',
    orderId: '',
    orderLabel: '',
    amount: '',
    currencyCode: 'TRY',
    providerKey: 'PAYTR',
    paymentMethod: 'CARD',
    paymentTermDays: '',
    dueDate: '',
    installmentCount: '1',
    notes: '',
    allocations: [],
  };
}

function defaultPaymentOperationState(): PaymentOperationFormState {
  return {
    paymentTransactionId: '',
    paymentTransactionLabel: '',
    operationType: 'REFUND',
    amount: '',
    currencyCode: 'TRY',
    idempotencyKey: '',
    reason: '',
  };
}

export function B2bPaymentCreatePage(): ReactElement {
  const navigate = useNavigate();
  const { currencyOptions, isLoading: isCurrencyLoading } = useCurrencyOptions();
  const [lookupField, setLookupField] = useState<PaymentLookupField | null>(null);
  const [values, setValues] = useState<PaymentOrderFormState>(() => defaultPaymentOrderState());
  const installmentOptions = useMemo(() => getInstallmentOptions(values.providerKey), [values.providerKey]);

  useEffect(() => {
    if (installmentOptions.some((option) => option.value === values.installmentCount)) return;
    setValues((current) => ({ ...current, installmentCount: '1' }));
  }, [installmentOptions, values.installmentCount]);

  const createMutation = useMutation({
    mutationFn: () => {
      const customerId = toRequiredNumber(values.customerId, 'Cari');
      const amount = toRequiredNumber(values.amount, 'Tahsilat tutarı');
      const installmentCount = toRequiredNumber(values.installmentCount, 'Taksit sayısı');
      const allocations = values.allocations
        .filter(hasAllocationValue)
        .map((allocation) => {
          const documentAmount = toRequiredNumber(allocation.documentAmount || allocation.allocatedAmount, 'Fatura tutarı');
          const openAmount = toRequiredNumber(allocation.openAmount || allocation.allocatedAmount, 'Açık tutar');
          const allocatedAmount = toRequiredNumber(allocation.allocatedAmount, 'Tahsis tutarı');
          if (allocatedAmount > amount) {
            throw new Error('Tahsis tutarı ödeme emri tutarından büyük olamaz.');
          }
          return {
            allocationType: allocation.allocationType || 'Invoice',
            erpDocumentType: trimOptional(allocation.erpDocumentType),
            erpDocumentNumber: trimOptional(allocation.erpDocumentNumber),
            erpDocumentReference: trimOptional(allocation.erpDocumentReference),
            documentDate: trimOptional(allocation.documentDate),
            dueDate: trimOptional(allocation.dueDate),
            documentAmount,
            openAmount,
            allocatedAmount,
            currencyCode: values.currencyCode || 'TRY',
            externalReference: trimOptional(allocation.externalReference),
            notes: trimOptional(allocation.notes),
          };
        });
      return paymentApi.createPaymentOrder({
        customerId,
        orderId: toOptionalNumber(values.orderId),
        amount,
        currencyCode: values.currencyCode || 'TRY',
        paymentTermDays: toOptionalNumber(values.paymentTermDays),
        dueDate: trimOptional(values.dueDate),
        installmentCount,
        paymentMethod: trimOptional(values.paymentMethod),
        providerKey: trimOptional(values.providerKey),
        notes: trimOptional(values.notes),
        allocations,
      });
    },
    onSuccess: () => {
      toast.success('Ödeme emri oluşturuldu.');
      navigate('/b2b/payments');
    },
    onError: (error) => {
      toast.error((error as Error).message);
    },
  });

  function updateValue(name: keyof PaymentOrderFormState, value: string): void {
    setValues((current) => {
      if (name === 'providerKey') {
        const nextMethod = value === 'OPEN_ACCOUNT' ? 'OPEN_ACCOUNT' : current.paymentMethod === 'OPEN_ACCOUNT' ? 'CARD' : current.paymentMethod;
        return { ...current, providerKey: value, paymentMethod: nextMethod, installmentCount: '1' };
      }
      if (name === 'paymentTermDays') {
        const termDays = Number(value);
        return { ...current, paymentTermDays: value, dueDate: Number.isFinite(termDays) && termDays >= 0 ? addDays(new Date(), termDays) : current.dueDate };
      }
      return { ...current, [name]: value };
    });
  }

  function addAllocation(): void {
    setValues((current) => ({ ...current, allocations: [...current.allocations, createAllocationDraft()] }));
  }

  function updateAllocation(localId: string, patch: Partial<PaymentAllocationFormState>): void {
    setValues((current) => ({
      ...current,
      allocations: current.allocations.map((item) => {
        if (item.localId !== localId) return item;
        const next = { ...item, ...patch };
        if ('allocatedAmount' in patch && !item.documentAmount && !item.openAmount) {
          return { ...next, documentAmount: patch.allocatedAmount ?? next.documentAmount, openAmount: patch.allocatedAmount ?? next.openAmount };
        }
        return next;
      }),
    }));
  }

  function removeAllocation(localId: string): void {
    setValues((current) => ({ ...current, allocations: current.allocations.filter((item) => item.localId !== localId) }));
  }

  return (
    <FormPageShell
      title="Ödeme Emri Oluştur"
      description="Sipariş zorunlu olmadan doğrudan cariye tahsilat emri açın; sağlayıcı ve taksit seçenekleri kontrollü ilerler."
      actions={(
        <Button variant="outline" asChild>
          <Link to="/b2b/payments"><ArrowLeft className="mr-2 h-4 w-4" />Listeye Dön</Link>
        </Button>
      )}
    >
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          createMutation.mutate();
        }}
      >
        <div className="flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-950 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            <div className="text-sm font-bold">Kontrollü tahsilat akışı</div>
            <div className="text-sm font-medium">
              Cari seçimi zorunludur. Sipariş referansı sadece tahsilatı belirli bir siparişle ilişkilendirmek isterseniz kullanılır.
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Cari *</span>
            <PagedLookupDialog<CustomerLookup>
              open={lookupField === 'customer'}
              onOpenChange={(open) => setLookupField(open ? 'customer' : null)}
              title="Cari Seç"
              description="ERP mirror cari kartlarında kod veya unvan ile arama yapın."
              value={values.customerLabel || null}
              placeholder="Cari seç"
              searchPlaceholder="Cari ara"
              emptyText="Cari bulunamadı."
              queryKey={['b2b-payment-create', 'customer']}
              fetchPage={({ pageNumber, pageSize, search, signal }) => lookupApi.getCustomersPaged({ pageNumber, pageSize, search }, { signal })}
              getKey={(item) => String(item.id)}
              getLabel={(item) => `${item.cariKod} - ${item.cariIsim}`}
              onSelect={(item) => {
                setValues((current) => ({
                  ...current,
                  customerId: String(item.id),
                  customerLabel: `${item.cariKod} - ${item.cariIsim}`,
                  paymentTermDays: item.vadeGunu ? String(item.vadeGunu) : current.paymentTermDays,
                  dueDate: item.vadeGunu ? addDays(new Date(), item.vadeGunu) : current.dueDate,
                }));
                setLookupField(null);
              }}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sipariş Referansı</span>
            <PagedLookupDialog<OrderDto>
              open={lookupField === 'order'}
              onOpenChange={(open) => setLookupField(open ? 'order' : null)}
              title="Sipariş Seç"
              description="Opsiyonel olarak tahsilatı bir B2B siparişine bağlayın."
              value={values.orderLabel || null}
              placeholder="Sipariş seçmeden devam edilebilir"
              searchPlaceholder="Sipariş ara"
              emptyText="Sipariş bulunamadı."
              queryKey={['b2b-payment-create', 'order']}
              fetchPage={({ pageNumber, pageSize, search }) => b2bApi.getOrders({ pageNumber, pageSize, search })}
              getKey={(item) => String(item.id)}
              getLabel={(item) => `${item.orderNumber} - ${formatMoney(item.grandTotal, item.currencyCode)}`}
              onSelect={(item) => {
                setValues((current) => ({
                  ...current,
                  orderId: String(item.id),
                  orderLabel: `${item.orderNumber} - ${formatMoney(item.grandTotal, item.currencyCode)}`,
                  customerId: String(item.customerId),
                  amount: String(item.grandTotal),
                  currencyCode: item.currencyCode || 'TRY',
                }));
                setLookupField(null);
              }}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tahsilat Tutarı *</span>
            <Input type="number" min="0.01" step="0.01" value={values.amount} onChange={(event) => updateValue('amount', event.target.value)} required />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Para Birimi *</span>
            <Select value={values.currencyCode} onValueChange={(value) => updateValue('currencyCode', value)}>
              <SelectTrigger>
                <SelectValue placeholder={isCurrencyLoading ? 'Para birimleri yükleniyor' : 'Para birimi seç'} />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((option) => (
                  <SelectItem key={`${option.code}-${option.dovizTipi}`} value={option.code}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sağlayıcı</span>
            <Select value={values.providerKey} onValueChange={(value) => updateValue('providerKey', value)}>
              <SelectTrigger><SelectValue placeholder="Sağlayıcı seç" /></SelectTrigger>
              <SelectContent>
                {paymentProviderOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ödeme Yöntemi</span>
            <Select value={values.paymentMethod} onValueChange={(value) => updateValue('paymentMethod', value)}>
              <SelectTrigger><SelectValue placeholder="Ödeme yöntemi seç" /></SelectTrigger>
              <SelectContent>
                {paymentMethodOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Vade Günü</span>
            <Input type="number" min="0" step="1" value={values.paymentTermDays} onChange={(event) => updateValue('paymentTermDays', event.target.value)} />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Son Ödeme Tarihi</span>
            <Input type="date" value={values.dueDate} onChange={(event) => updateValue('dueDate', event.target.value)} />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Taksit Sayısı *</span>
            <Select value={values.installmentCount} onValueChange={(value) => updateValue('installmentCount', value)}>
              <SelectTrigger><SelectValue placeholder="Taksit seç" /></SelectTrigger>
              <SelectContent>
                {installmentOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Sağlayıcı limitleri dışında serbest taksit girilemez.</span>
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Not</span>
          <Textarea value={values.notes} onChange={(event) => updateValue('notes', event.target.value)} />
        </label>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">Fatura / Açık Kalem Tahsisi</h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                İsterseniz tahsilatı ERP fatura numarası veya açık kalem referansına bağlayın; ödeme geldiğinde tahsilat bu satırlara dağıtılır.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={addAllocation}>
              <Plus className="mr-2 h-4 w-4" />
              Satır Ekle
            </Button>
          </div>

          {values.allocations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm font-semibold text-slate-500 dark:border-white/15 dark:text-slate-400">
              Henüz tahsis satırı yok. Cari bazlı avans/tahsilat için boş bırakabilirsiniz.
            </div>
          ) : (
            <div className="space-y-3">
              {values.allocations.map((allocation, index) => (
                <div key={allocation.localId} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-black/10">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="text-sm font-black text-slate-900 dark:text-white">Tahsis Satırı {index + 1}</span>
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeAllocation(allocation.localId)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Kaldır
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Tip</span>
                      <Select value={allocation.allocationType} onValueChange={(value) => updateAllocation(allocation.localId, { allocationType: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Invoice">Fatura</SelectItem>
                          <SelectItem value="OpenItem">Açık Kalem</SelectItem>
                          <SelectItem value="Advance">Avans</SelectItem>
                        </SelectContent>
                      </Select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">ERP Belge No</span>
                      <Input value={allocation.erpDocumentNumber} onChange={(event) => updateAllocation(allocation.localId, { erpDocumentNumber: event.target.value })} />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Belge Referansı</span>
                      <Input value={allocation.erpDocumentReference} onChange={(event) => updateAllocation(allocation.localId, { erpDocumentReference: event.target.value })} />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Belge Tarihi</span>
                      <Input type="date" value={allocation.documentDate} onChange={(event) => updateAllocation(allocation.localId, { documentDate: event.target.value })} />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Vade Tarihi</span>
                      <Input type="date" value={allocation.dueDate} onChange={(event) => updateAllocation(allocation.localId, { dueDate: event.target.value })} />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Tahsis Tutarı</span>
                      <Input type="number" min="0.01" step="0.01" value={allocation.allocatedAmount} onChange={(event) => updateAllocation(allocation.localId, { allocatedAmount: event.target.value })} />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Fatura Tutarı</span>
                      <Input type="number" min="0.01" step="0.01" value={allocation.documentAmount} onChange={(event) => updateAllocation(allocation.localId, { documentAmount: event.target.value })} />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Açık Tutar</span>
                      <Input type="number" min="0.01" step="0.01" value={allocation.openAmount} onChange={(event) => updateAllocation(allocation.localId, { openAmount: event.target.value })} />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Dış Referans</span>
                      <Input value={allocation.externalReference} onChange={(event) => updateAllocation(allocation.localId, { externalReference: event.target.value })} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link to="/b2b/payments">Vazgeç</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            <CreditCard className="mr-2 h-4 w-4" />
            Kaydet
          </Button>
        </div>
      </form>
    </FormPageShell>
  );
}

export function B2bPaymentOperationCreatePage(): ReactElement {
  const navigate = useNavigate();
  const { currencyOptions, isLoading: isCurrencyLoading } = useCurrencyOptions();
  const [lookupField, setLookupField] = useState<PaymentLookupField | null>(null);
  const [values, setValues] = useState<PaymentOperationFormState>(() => defaultPaymentOperationState());

  const createMutation = useMutation({
    mutationFn: () => paymentApi.createPaymentProviderOperation({
      paymentTransactionId: toRequiredNumber(values.paymentTransactionId, 'Ödeme işlemi'),
      operationType: values.operationType,
      amount: toRequiredNumber(values.amount, 'Tutar'),
      currencyCode: values.currencyCode || 'TRY',
      idempotencyKey: trimOptional(values.idempotencyKey),
      reason: trimOptional(values.reason),
    }),
    onSuccess: () => {
      toast.success('Ödeme operasyonu oluşturuldu.');
      navigate('/b2b/payment-operations');
    },
    onError: (error) => {
      toast.error((error as Error).message);
    },
  });

  function updateValue(name: keyof PaymentOperationFormState, value: string): void {
    setValues((current) => ({ ...current, [name]: value }));
  }

  return (
    <FormPageShell
      title="Ödeme Operasyonu Oluştur"
      description="İade, iptal, kısmi ödeme ve mutabakat işlemleri ödeme hareketi üzerinden kontrollü kuyruğa alınır."
      actions={(
        <Button variant="outline" asChild>
          <Link to="/b2b/payment-operations"><ArrowLeft className="mr-2 h-4 w-4" />Listeye Dön</Link>
        </Button>
      )}
    >
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          createMutation.mutate();
        }}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ödeme İşlemi *</span>
            <PagedLookupDialog<PaymentTransactionDto>
              open={lookupField === 'paymentTransaction'}
              onOpenChange={(open) => setLookupField(open ? 'paymentTransaction' : null)}
              title="Ödeme İşlemi Seç"
              description="Sağlayıcı, işlem numarası veya tutara göre ödeme hareketi arayın."
              value={values.paymentTransactionLabel || null}
              placeholder="Ödeme işlemi seç"
              searchPlaceholder="Ödeme işlemi ara"
              emptyText="Ödeme işlemi bulunamadı."
              queryKey={['b2b-payment-operation-create', 'paymentTransaction']}
              fetchPage={({ pageNumber, pageSize, search }) => paymentApi.getPayments({ pageNumber, pageSize, search })}
              getKey={(item) => String(item.id)}
              getLabel={(item) => `${item.providerKey} - ${item.externalTransactionId || item.id} - ${formatMoney(item.amount, item.currencyCode)}`}
              onSelect={(item) => {
                setValues((current) => ({
                  ...current,
                  paymentTransactionId: String(item.id),
                  paymentTransactionLabel: `${item.providerKey} - ${item.externalTransactionId || item.id} - ${formatMoney(item.amount, item.currencyCode)}`,
                  amount: String(item.amount),
                  currencyCode: item.currencyCode || current.currencyCode,
                }));
                setLookupField(null);
              }}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Operasyon *</span>
            <Select value={values.operationType} onValueChange={(value) => updateValue('operationType', value)}>
              <SelectTrigger><SelectValue placeholder="Operasyon seç" /></SelectTrigger>
              <SelectContent>
                {operationTypeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tutar *</span>
            <Input type="number" min="0.01" step="0.01" value={values.amount} onChange={(event) => updateValue('amount', event.target.value)} required />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Para Birimi *</span>
            <Select value={values.currencyCode} onValueChange={(value) => updateValue('currencyCode', value)}>
              <SelectTrigger><SelectValue placeholder={isCurrencyLoading ? 'Para birimleri yükleniyor' : 'Para birimi seç'} /></SelectTrigger>
              <SelectContent>
                {currencyOptions.map((option) => (
                  <SelectItem key={`${option.code}-${option.dovizTipi}`} value={option.code}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tekrar Koruma Anahtarı</span>
            <Input value={values.idempotencyKey} onChange={(event) => updateValue('idempotencyKey', event.target.value)} placeholder="Boş bırakılırsa API tarafı yönetir" />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Açıklama</span>
          <Textarea value={values.reason} onChange={(event) => updateValue('reason', event.target.value)} />
        </label>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link to="/b2b/payment-operations">Vazgeç</Link>
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            <ReceiptText className="mr-2 h-4 w-4" />
            Kaydet
          </Button>
        </div>
      </form>
    </FormPageShell>
  );
}
