import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Banknote, CheckCircle2, CreditCard, ExternalLink, Landmark, RefreshCw, Settings2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useUIStore } from '@/stores/ui-store';
import { paymentApi } from '../api/payment.api';
import { paymentSettingsApi } from '../api/payment-settings.api';
import type { PaymentSettingDto, UpsertPaymentSettingDto } from '../types/payment-settings.types';
import type { PaymentProviderReadinessDto } from '../types/payment.types';

type PaymentSettingFormState = UpsertPaymentSettingDto;

const providerOrder = ['ACCOUNT', 'IYZICO', 'PAYTR'];
const installmentOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

function createFormState(setting?: PaymentSettingDto): PaymentSettingFormState {
  return {
    providerKey: setting?.providerKey ?? 'PAYTR',
    displayName: setting?.displayName ?? 'PayTR',
    isActive: setting?.isActive ?? true,
    isTestMode: setting?.isTestMode ?? true,
    postingMode: setting?.postingMode ?? 'ManualApproval',
    cariPostingMode: setting?.cariPostingMode ?? 'SingleReceipt',
    installmentPostingMode: setting?.installmentPostingMode ?? 'ProviderSummary',
    autoPostSuccessfulPaymentsToErp: setting?.autoPostSuccessfulPaymentsToErp ?? false,
    requireManualApprovalBeforeErpPosting: setting?.requireManualApprovalBeforeErpPosting ?? true,
    closeCustomerBalanceOnSuccessfulPayment: setting?.closeCustomerBalanceOnSuccessfulPayment ?? true,
    createInstallmentReceivableLines: setting?.createInstallmentReceivableLines ?? false,
    postCommissionToExpenseAccount: setting?.postCommissionToExpenseAccount ?? true,
    passInstallmentFeeToCustomer: setting?.passInstallmentFeeToCustomer ?? false,
    maxInstallmentCount: setting?.maxInstallmentCount ?? 1,
    allowedInstallmentsCsv: setting?.allowedInstallmentsCsv ?? '1',
    minInstallmentAmount: setting?.minInstallmentAmount,
    defaultCurrencyCode: setting?.defaultCurrencyCode ?? 'TRY',
    erpCashAccountCode: setting?.erpCashAccountCode ?? '',
    erpBankAccountCode: setting?.erpBankAccountCode ?? '',
    erpPosAccountCode: setting?.erpPosAccountCode ?? '',
    erpCommissionExpenseAccountCode: setting?.erpCommissionExpenseAccountCode ?? '',
    erpVadeFarkiIncomeAccountCode: setting?.erpVadeFarkiIncomeAccountCode ?? '',
    merchantIdMasked: setting?.merchantIdMasked ?? '',
    apiBaseUrl: setting?.apiBaseUrl ?? '',
    callbackUrl: setting?.callbackUrl ?? '',
    webhookSecretMasked: setting?.webhookSecretMasked ?? '',
    notes: setting?.notes ?? '',
  };
}

function normalizeForSave(form: PaymentSettingFormState): UpsertPaymentSettingDto {
  const maxInstallmentCount = Math.max(1, Math.min(12, Number(form.maxInstallmentCount || 1)));
  const allowedInstallments = form.allowedInstallmentsCsv
    .split(',')
    .map((item) => item.trim())
    .filter((item) => installmentOptions.includes(item) && Number(item) <= maxInstallmentCount);

  return {
    ...form,
    maxInstallmentCount,
    allowedInstallmentsCsv: Array.from(new Set(allowedInstallments.length > 0 ? allowedInstallments : ['1'])).join(','),
    minInstallmentAmount: form.minInstallmentAmount ? Number(form.minInstallmentAmount) : undefined,
  };
}

function providerIcon(providerKey: string): ReactElement {
  if (providerKey === 'ACCOUNT') return <Landmark className="size-5" />;
  if (providerKey === 'IYZICO') return <CreditCard className="size-5" />;
  return <Banknote className="size-5" />;
}

export function B2bPaymentSettingsPage(): ReactElement {
  const { setPageTitle } = useUIStore();
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState('PAYTR');
  const [form, setForm] = useState<PaymentSettingFormState>(() => createFormState());

  const settingsQuery = useQuery({
    queryKey: ['b2b-payment-settings'],
    queryFn: paymentSettingsApi.get,
  });

  const readinessQuery = useQuery({
    queryKey: ['b2b-payment-provider-readiness'],
    queryFn: paymentApi.getProviderReadiness,
  });

  const settings = useMemo(() => {
    const data = settingsQuery.data ?? [];
    return [...data].sort((a, b) => {
      const aIndex = providerOrder.indexOf(a.providerKey);
      const bIndex = providerOrder.indexOf(b.providerKey);
      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
    });
  }, [settingsQuery.data]);

  const selectedSetting = settings.find((item) => item.providerKey === selectedProvider) ?? settings[0];
  const readinessByProvider = useMemo(() => {
    return new Map((readinessQuery.data ?? []).map((item) => [item.providerKey, item]));
  }, [readinessQuery.data]);
  const selectedReadiness = readinessByProvider.get(selectedProvider);

  useEffect(() => {
    setPageTitle('Ödeme Ayarları');
    return () => setPageTitle(null);
  }, [setPageTitle]);

  useEffect(() => {
    if (!selectedSetting) return;
    setSelectedProvider(selectedSetting.providerKey);
    setForm(createFormState(selectedSetting));
  }, [selectedSetting]);

  const saveMutation = useMutation({
    mutationFn: async () => paymentSettingsApi.update(form.providerKey, normalizeForSave(form)),
    onSuccess: async () => {
      toast.success('Ödeme ayarları kaydedildi.');
      await queryClient.invalidateQueries({ queryKey: ['b2b-payment-settings'] });
    },
    onError: (error: Error) => toast.error(error.message || 'Ödeme ayarları kaydedilemedi.'),
  });

  function update<K extends keyof PaymentSettingFormState>(key: K, value: PaymentSettingFormState[K]): void {
    setForm((current) => {
      if (key === 'maxInstallmentCount') {
        const nextMax = Math.max(1, Math.min(12, Number(value || 1)));
        const nextAllowed = current.allowedInstallmentsCsv
          .split(',')
          .filter((item) => Number(item) <= nextMax)
          .join(',') || '1';
        return { ...current, [key]: nextMax, allowedInstallmentsCsv: nextAllowed };
      }

      return { ...current, [key]: value };
    });
  }

  function toggleInstallment(value: string): void {
    setForm((current) => {
      const currentValues = new Set(current.allowedInstallmentsCsv.split(',').filter(Boolean));
      if (currentValues.has(value)) currentValues.delete(value);
      else currentValues.add(value);
      currentValues.add('1');
      const normalized = Array.from(currentValues)
        .filter((item) => Number(item) <= Number(current.maxInstallmentCount || 1))
        .sort((a, b) => Number(a) - Number(b));
      return { ...current, allowedInstallmentsCsv: normalized.join(',') };
    });
  }

  if (settingsQuery.isLoading) {
    return <div className="rounded-2xl border bg-white p-6 text-sm dark:border-white/10 dark:bg-slate-950">Ödeme ayarları yükleniyor...</div>;
  }

  return (
    <div className="w-full space-y-6 crm-page">
      <Breadcrumb items={[{ label: 'Yetki ve Sistem' }, { label: 'Entegrasyon Ayarları' }, { label: 'Ödeme Ayarları', isActive: true }]} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">Finans entegrasyonu</Badge>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Ödeme Ayarları</h1>
          <p className="mt-2 max-w-4xl text-sm font-medium text-slate-500 dark:text-slate-400">
            Ödeme sağlayıcılarının cari tahsilata, taksit planına, komisyona ve ERP aktarımına nasıl yansıyacağını buradan yönetin.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => void settingsQuery.refetch()}>
            <RefreshCw className="mr-2 size-4" />
            Yenile
          </Button>
          <Button type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Kaydediliyor' : 'Kaydet'}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="border-slate-200/80 shadow-sm dark:border-white/10 dark:bg-white/3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="size-5" />
              Sağlayıcılar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {settings.map((setting) => (
              <button
                key={setting.providerKey}
                type="button"
                onClick={() => {
                  setSelectedProvider(setting.providerKey);
                  setForm(createFormState(setting));
                }}
                className={`w-full rounded-2xl border p-4 text-left transition ${selectedProvider === setting.providerKey ? 'border-cyan-400 bg-cyan-50 text-cyan-950 dark:border-cyan-300/60 dark:bg-cyan-400/10 dark:text-cyan-50' : 'border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-1 text-slate-600 dark:text-slate-300">{providerIcon(setting.providerKey)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{setting.displayName}</span>
                    <span className="mt-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                      {setting.isActive ? 'Aktif' : 'Pasif'} / {setting.isTestMode ? 'Test' : 'Canlı'}
                    </span>
                  </span>
                  {setting.lastConnectionSuccessful ? <CheckCircle2 className="size-4 text-emerald-500" /> : null}
                </div>
                {readinessByProvider.has(setting.providerKey) ? (
                  <div className="mt-3 flex items-center gap-2 text-xs font-bold">
                    {readinessByProvider.get(setting.providerKey)?.isConfigured ? (
                      <>
                        <CheckCircle2 className="size-4 text-emerald-500" />
                        Entegrasyon hazır
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="size-4 text-amber-500" />
                        Kurulum eksik
                      </>
                    )}
                  </div>
                ) : null}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm dark:border-white/10 dark:bg-white/3">
          <CardHeader className="border-b border-slate-100 dark:border-white/10">
            <CardTitle className="flex items-center justify-between gap-3">
              <span>{form.displayName}</span>
              <Badge variant={form.isActive ? 'default' : 'secondary'}>{form.isActive ? 'Aktif' : 'Pasif'}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="posting">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="posting">Aktarım</TabsTrigger>
                <TabsTrigger value="installments">Taksit</TabsTrigger>
                <TabsTrigger value="erp">ERP Hesapları</TabsTrigger>
              </TabsList>

              <TabsContent value="posting" className="mt-6 grid gap-4 md:grid-cols-2">
                <LabeledInput label="Sağlayıcı Adı" value={form.displayName} onChange={(value) => update('displayName', value)} />
                <LabeledInput label="Varsayılan Para Birimi" value={form.defaultCurrencyCode} onChange={(value) => update('defaultCurrencyCode', value.toUpperCase().slice(0, 3))} />
                <SelectField label="ERP Aktarım Şekli" value={form.postingMode} onChange={(value) => update('postingMode', value)} options={[
                  ['ManualApproval', 'Manuel onaydan sonra'],
                  ['AutoOnSuccess', 'Başarılı ödemede otomatik'],
                ]} />
                <SelectField label="Cari Tahsilat Şekli" value={form.cariPostingMode} onChange={(value) => update('cariPostingMode', value)} options={[
                  ['SingleReceipt', 'Tek tahsilat olarak kapat'],
                  ['InstallmentReceivable', 'Taksitli cari hareket oluştur'],
                  ['DoNotPost', 'ERP’ye otomatik yazma'],
                ]} />
                <SwitchPanel label="Sağlayıcı aktif" value={form.isActive} onChange={(value) => update('isActive', value)} />
                <SwitchPanel label="Test modu" value={form.isTestMode} onChange={(value) => update('isTestMode', value)} />
                <SwitchPanel label="Başarılı ödemeyi ERP kuyruğuna al" value={form.autoPostSuccessfulPaymentsToErp} onChange={(value) => update('autoPostSuccessfulPaymentsToErp', value)} />
                <SwitchPanel label="ERP aktarımı için manuel onay iste" value={form.requireManualApprovalBeforeErpPosting} onChange={(value) => update('requireManualApprovalBeforeErpPosting', value)} />
                <SwitchPanel label="Başarılı ödemede cari bakiyeyi kapat" value={form.closeCustomerBalanceOnSuccessfulPayment} onChange={(value) => update('closeCustomerBalanceOnSuccessfulPayment', value)} />
                <SwitchPanel label="Komisyonu gider hesabına ayır" value={form.postCommissionToExpenseAccount} onChange={(value) => update('postCommissionToExpenseAccount', value)} />
              </TabsContent>

              <TabsContent value="installments" className="mt-6 space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <LabeledInput label="Maksimum Taksit" type="number" value={String(form.maxInstallmentCount)} onChange={(value) => update('maxInstallmentCount', Number(value))} />
                  <LabeledInput label="Minimum Taksit Tutarı" type="number" value={form.minInstallmentAmount ? String(form.minInstallmentAmount) : ''} onChange={(value) => update('minInstallmentAmount', value ? Number(value) : undefined)} />
                  <SelectField label="Taksit ERP Yazımı" value={form.installmentPostingMode} onChange={(value) => update('installmentPostingMode', value)} options={[
                    ['ProviderSummary', 'Sağlayıcı özeti'],
                    ['InstallmentLines', 'Taksit satırları'],
                    ['BankSettlementOnly', 'Sadece banka mutabakatı'],
                  ]} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">İzin Verilen Taksitler</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {installmentOptions.map((option) => {
                      const selected = form.allowedInstallmentsCsv.split(',').includes(option);
                      const disabled = Number(option) > Number(form.maxInstallmentCount || 1);
                      return (
                        <Button
                          key={option}
                          type="button"
                          variant={selected ? 'default' : 'outline'}
                          size="sm"
                          disabled={disabled || option === '1'}
                          onClick={() => toggleInstallment(option)}
                        >
                          {option === '1' ? 'Tek çekim' : `${option} taksit`}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <SwitchPanel label="Taksitli cari hareket satırları oluştur" value={form.createInstallmentReceivableLines} onChange={(value) => update('createInstallmentReceivableLines', value)} />
                  <SwitchPanel label="Taksit/vade farkını müşteriye yansıt" value={form.passInstallmentFeeToCustomer} onChange={(value) => update('passInstallmentFeeToCustomer', value)} />
                </div>
              </TabsContent>

              <TabsContent value="erp" className="mt-6 grid gap-4 md:grid-cols-2">
                <LabeledInput label="Nakit/Kasa Hesabı" value={form.erpCashAccountCode ?? ''} onChange={(value) => update('erpCashAccountCode', value)} />
                <LabeledInput label="Banka Hesabı" value={form.erpBankAccountCode ?? ''} onChange={(value) => update('erpBankAccountCode', value)} />
                <LabeledInput label="POS Hesabı" value={form.erpPosAccountCode ?? ''} onChange={(value) => update('erpPosAccountCode', value)} />
                <LabeledInput label="Komisyon Gider Hesabı" value={form.erpCommissionExpenseAccountCode ?? ''} onChange={(value) => update('erpCommissionExpenseAccountCode', value)} />
                <LabeledInput label="Vade Farkı Gelir Hesabı" value={form.erpVadeFarkiIncomeAccountCode ?? ''} onChange={(value) => update('erpVadeFarkiIncomeAccountCode', value)} />
                <LabeledInput label="Merchant / Üye İşyeri No" value={form.merchantIdMasked ?? ''} onChange={(value) => update('merchantIdMasked', value)} />
                <LabeledInput label="API Adresi" value={form.apiBaseUrl ?? ''} onChange={(value) => update('apiBaseUrl', value)} />
                <LabeledInput label="Callback Adresi" value={form.callbackUrl ?? ''} onChange={(value) => update('callbackUrl', value)} />
                <LabeledInput label="Webhook Secret Maskesi" value={form.webhookSecretMasked ?? ''} onChange={(value) => update('webhookSecretMasked', value)} />
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Not</span>
                  <Textarea value={form.notes ?? ''} onChange={(event) => update('notes', event.target.value)} />
                </label>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {selectedReadiness ? <ProviderReadinessPanel readiness={selectedReadiness} /> : null}

      <Card className="border-emerald-200/80 bg-emerald-50/70 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10">
        <CardContent className="flex gap-3 p-4 text-sm text-emerald-950 dark:text-emerald-50">
          <ShieldCheck className="mt-0.5 size-5 shrink-0" />
          <p>
            Bu ayarlar bir sonraki aşamada ödeme callback sonucu, cari tahsilat oluşturma, taksit satırı yazımı ve ERP aktarım kuyruğuna bağlanacak.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ProviderReadinessPanel({ readiness }: { readiness: PaymentProviderReadinessDto }): ReactElement {
  const capabilities = [
    readiness.supportsHostedPayment ? 'Hosted ödeme formu' : null,
    readiness.supports3ds ? '3DS doğrulama' : null,
    readiness.supportsBinLookup ? 'BIN sorgusu' : null,
    readiness.supportsInstallments ? 'Taksit sorgusu' : null,
    readiness.supportsRefund ? 'İade' : null,
    readiness.supportsCancel ? 'İptal' : null,
  ].filter(Boolean);

  return (
    <Card className={`${readiness.isConfigured ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-400/20 dark:bg-emerald-500/10' : 'border-amber-200 bg-amber-50/70 dark:border-amber-400/20 dark:bg-amber-500/10'} shadow-sm`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-col gap-3 text-base sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            {readiness.isConfigured ? <CheckCircle2 className="size-5 text-emerald-500" /> : <AlertTriangle className="size-5 text-amber-500" />}
            {readiness.displayName} Entegrasyon Hazırlığı
          </span>
          <a
            href={readiness.documentationUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-bold text-cyan-700 hover:text-cyan-900 dark:text-cyan-200"
          >
            Resmi doküman
            <ExternalLink className="size-4" />
          </a>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <ReadinessPill label="Credential" active={readiness.hasCredentials} />
            <ReadinessPill label="Callback" active={readiness.hasCallbackUrl} />
            <ReadinessPill label="Endpoint" active={readiness.hasRequiredEndpoints} />
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 p-4 text-sm dark:border-white/10 dark:bg-slate-950/40">
            <p className="font-bold text-slate-900 dark:text-white">Desteklenen Akışlar</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {capabilities.map((capability) => (
                <Badge key={capability} variant="secondary">{capability}</Badge>
              ))}
              <Badge variant="outline">Maks. {readiness.maxInstallmentCount} taksit</Badge>
              <Badge variant="outline">{readiness.environment}</Badge>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/60 bg-white/70 p-4 text-sm dark:border-white/10 dark:bg-slate-950/40">
            <p className="font-bold text-slate-900 dark:text-white">Eksik Alanlar</p>
            {readiness.missingItems.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {readiness.missingItems.map((item) => <Badge key={item} variant="destructive">{item}</Badge>)}
              </div>
            ) : (
              <p className="mt-2 font-medium text-emerald-700 dark:text-emerald-200">Zorunlu kurulum alanları tamam.</p>
            )}
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 p-4 text-sm dark:border-white/10 dark:bg-slate-950/40">
            <p className="font-bold text-slate-900 dark:text-white">Sonraki Doğru Test</p>
            <ul className="mt-2 space-y-2">
              {readiness.nextActions.map((action) => (
                <li key={action} className="font-medium text-slate-600 dark:text-slate-300">{action}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReadinessPill({ label, active }: { label: string; active: boolean }): ReactElement {
  return (
    <div className={`rounded-2xl border px-3 py-2 text-sm font-bold ${active ? 'border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-100' : 'border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-100'}`}>
      {active ? 'Hazır' : 'Eksik'} · {label}
    </div>
  );
}

function LabeledInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }): ReactElement {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }): ReactElement {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, labelText]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {labelText}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function SwitchPanel({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }): ReactElement {
  return (
    <label className="flex min-h-12 items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <Switch checked={value} onCheckedChange={onChange} />
    </label>
  );
}
