import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpenCheck, CheckCircle2, ExternalLink, KeyRound, Settings2, Store, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { b2bApi } from '../api/b2b.api';
import type { MarketplaceProviderSettingDto } from '../types/b2b.types';

type ProviderFormState = {
  channelId?: number;
  code: string;
  name: string;
  sellerId: string;
  apiBaseUrl: string;
  authType: string;
  credentialValues: Record<string, string>;
  credentialsJson: string;
  useAdvancedJson: boolean;
  supportsProductCreate: boolean;
  supportsPriceUpdate: boolean;
  supportsStockUpdate: boolean;
  supportsOrderImport: boolean;
  isActive: boolean;
  notes: string;
};

type ProviderGuide = {
  title: string;
  summary: string;
  required: string[];
  steps: string[];
  links: Array<{ label: string; href: string }>;
  warning?: string;
};

const providerGuides: Record<string, ProviderGuide> = {
  Trendyol: {
    title: 'Trendyol bilgileri nereden alınır?',
    summary: 'Trendyol entegrasyonu Basic Auth ile çalışır. Ürün, fiyat, stok ve sipariş servislerinde Supplier ID ile API Key/API Secret birlikte kullanılır.',
    required: ['Supplier ID', 'API Key', 'API Secret', 'Varsa test/stage bilgileri', 'Mağaza operasyon yetkisi'],
    steps: [
      'Satıcı paneline master/yetkili kullanıcıyla girin.',
      'Hesap Bilgilerim > Entegrasyon Bilgileri ekranından Supplier ID, API Key ve API Secret bilgilerini alın.',
      'Bu ekranda Satıcı / Mağaza No alanına Supplier ID bilgisini, credential alanlarına API Key ve API Secret bilgisini girin.',
      'Ürün, fiyat, stok ve sipariş operasyonlarından kullanmak istediklerinizi aktif bırakın.',
    ],
    links: [
      { label: 'Yetkilendirme dokümanı', href: 'https://developers.trendyol.com/tr/docs/2-authorization' },
      { label: 'Trendyol Developer', href: 'https://developers.trendyol.com/' },
    ],
  },
  Hepsiburada: {
    title: 'Hepsiburada bilgileri nereden alınır?',
    summary: 'Hepsiburada tarafında merchant/mağaza bilgisi ve API anahtarları gerekir. İşlemler genelde batch/transaction takip mantığıyla ilerler.',
    required: ['Merchant ID', 'API Key veya Client ID', 'API Secret', 'Developer/merchant panel yetkisi', 'Yetkilendirilmiş entegratör izni'],
    steps: [
      'Hepsiburada developer hesabı ve merchant panel erişimini hazırlayın.',
      'Merchant/mağaza ID bilgisini merchant panelden doğrulayın.',
      'Developer portalda veya entegratör yetkilendirme ekranında API Key/API Secret bilgilerini oluşturun.',
      'Bu ekranda Merchant ID bilgisini Satıcı / Mağaza No alanına, anahtarları Kimlik Bilgileri sekmesine girin.',
    ],
    links: [
      { label: 'Başlangıç dokümanı', href: 'https://developers.hepsiburada.com/hepsiburada/docs/getting-started' },
      { label: 'Hepsiburada Developer', href: 'https://developers.hepsiburada.com/' },
    ],
  },
  Amazon: {
    title: 'Amazon SP-API bilgileri nereden alınır?',
    summary: 'Amazon en kapsamlı akıştır. Seller Central developer profile, app registration, LWA OAuth ve AWS SigV4 bilgileri birlikte gerekir.',
    required: ['Seller ID', 'Marketplace ID', 'LWA Client ID/Secret', 'Refresh Token', 'AWS Access Key/Secret', 'Region', 'Varsa Role ARN'],
    steps: [
      'Seller Central üzerinden developer profile ve SP-API uygulama kaydını tamamlayın.',
      'Uygulama için Login with Amazon client id/secret bilgilerini alın.',
      'Seller authorization akışından refresh token üretin.',
      'AWS IAM/SigV4 bilgilerini ve gerekiyorsa Role ARN bilgisini hazırlayın.',
      'Marketplace ID ve region bilgisini satış yapılan ülkeye göre seçin.',
    ],
    links: [
      { label: 'SP-API kayıt süreci', href: 'https://developer-docs.amazon.com/sp-api/docs/sp-api-registration-overview' },
      { label: 'Marketplace IDs', href: 'https://developer-docs.amazon.com/sp-api/docs/marketplace-ids' },
      { label: 'SP-API endpoints', href: 'https://developer-docs.amazon.com/sp-api/docs/sp-api-endpoints' },
    ],
    warning: 'Amazon bilgilerinde PROD/SANDBOX ve marketplace region ayrımı kritik. Yanlış region veya marketplace ID ile imza doğru olsa bile istekler başarısız olur.',
  },
  Etsy: {
    title: 'Etsy bilgileri nereden alınır?',
    summary: 'Etsy Open API v3 OAuth tabanlıdır. App registration ile keystring/shared secret alınır, shop erişimi OAuth scopes ile yetkilendirilir.',
    required: ['Shop ID', 'Client ID / API keystring', 'Client Secret / shared secret', 'Refresh Token', 'Gerekli OAuth scopes'],
    steps: [
      'Etsy Developer portalında uygulama oluşturun.',
      'API keystring ve shared secret bilgilerini alın.',
      'Shop adına OAuth authorization akışını tamamlayıp refresh token üretin.',
      'Shop ID ve token bilgilerini bu ekranda kaydedin.',
    ],
    links: [
      { label: 'Etsy Open API dokümanı', href: 'https://developers.etsy.com/documentation/' },
      { label: 'OAuth rehberi', href: 'https://developers.etsy.com/documentation/essentials/authentication/' },
    ],
  },
};

function createDefaultState(setting?: MarketplaceProviderSettingDto): ProviderFormState {
  const provider = setting?.providerKey || 'Trendyol';
  const channel = setting?.channel;
  const credentialValues = Object.fromEntries((setting?.credentialFields ?? []).map((field) => [field.key, '']));

  return {
    channelId: channel?.id,
    code: channel?.code || `${provider}-ANA-MAGAZA`.toUpperCase(),
    name: channel?.name || `${setting?.name || provider} Ana Mağaza`,
    sellerId: channel?.sellerId || '',
    apiBaseUrl: channel?.apiBaseUrl || '',
    authType: channel?.authType || setting?.defaultAuthType || 'Basic',
    credentialValues,
    credentialsJson: '',
    useAdvancedJson: false,
    supportsProductCreate: channel?.supportsProductCreate ?? setting?.supportsProductCreate ?? true,
    supportsPriceUpdate: channel?.supportsPriceUpdate ?? setting?.supportsPriceUpdate ?? true,
    supportsStockUpdate: channel?.supportsStockUpdate ?? setting?.supportsStockUpdate ?? true,
    supportsOrderImport: channel?.supportsOrderImport ?? setting?.supportsOrderImport ?? true,
    isActive: channel?.isActive ?? true,
    notes: channel?.notes || '',
  };
}

function buildCredentialJson(form: ProviderFormState): string | undefined {
  if (form.useAdvancedJson) {
    return form.credentialsJson.trim() || undefined;
  }

  const payload = Object.fromEntries(
    Object.entries(form.credentialValues)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value.length > 0),
  );

  return Object.keys(payload).length > 0 ? JSON.stringify(payload) : undefined;
}

export function B2bMarketplaceSettingsPage(): ReactElement {
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState('Trendyol');
  const [form, setForm] = useState<ProviderFormState>(() => createDefaultState());

  const settingsQuery = useQuery({
    queryKey: ['b2b-marketplaces', 'settings'],
    queryFn: () => b2bApi.getMarketplaceSettings(),
  });

  const settings = settingsQuery.data ?? [];
  const selectedSetting = useMemo(
    () => settings.find((item) => item.providerKey === selectedProvider) ?? settings[0],
    [selectedProvider, settings],
  );
  const selectedGuide = selectedSetting ? providerGuides[selectedSetting.providerKey] : undefined;

  useEffect(() => {
    if (!selectedSetting) return;
    setSelectedProvider(selectedSetting.providerKey);
    setForm(createDefaultState(selectedSetting));
  }, [selectedSetting?.providerKey, selectedSetting?.channel?.id]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSetting) throw new Error('Provider ayarı bulunamadı.');
      const credentialsJson = buildCredentialJson(form);
      const payload = {
        code: form.code,
        name: form.name,
        providerKey: selectedSetting.providerKey,
        sellerId: form.sellerId || undefined,
        apiBaseUrl: form.apiBaseUrl || undefined,
        authType: form.authType,
        credentialsJson,
        supportsProductCreate: form.supportsProductCreate,
        supportsPriceUpdate: form.supportsPriceUpdate,
        supportsStockUpdate: form.supportsStockUpdate,
        supportsOrderImport: form.supportsOrderImport,
        isActive: form.isActive,
        notes: form.notes || undefined,
      };

      return form.channelId
        ? b2bApi.updateMarketplaceChannel(form.channelId, payload)
        : b2bApi.createMarketplaceChannel(payload);
    },
    onSuccess: async () => {
      toast.success('Entegrasyon ayarları kaydedildi.');
      setForm((current) => ({
        ...current,
        credentialValues: Object.fromEntries(Object.keys(current.credentialValues).map((key) => [key, ''])),
        credentialsJson: '',
      }));
      await queryClient.invalidateQueries({ queryKey: ['b2b-marketplaces'] });
    },
    onError: (error: Error) => toast.error(error.message || 'Entegrasyon ayarları kaydedilemedi.'),
  });

  function update<K extends keyof ProviderFormState>(key: K, value: ProviderFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateCredential(key: string, value: string) {
    setForm((current) => ({
      ...current,
      credentialValues: { ...current.credentialValues, [key]: value },
    }));
  }

  if (settingsQuery.isLoading) {
    return <div className="rounded-3xl border bg-white p-6 text-sm dark:border-white/10 dark:bg-slate-950">Ayarlar yükleniyor...</div>;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">Ayarlar</Badge>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Pazar yeri entegrasyon ayarları</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
            Her pazar yerini kendi gerektirdiği alanlarla yönetin. Trendyol/Hepsiburada daha sade, Amazon ise SP-API nedeniyle ayrı OAuth/AWS bilgileri ister.
          </p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !selectedSetting}>
          Ayarları Kaydet
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-3">
          {settings.map((setting) => {
            const selected = setting.providerKey === selectedProvider;
            return (
              <button
                key={setting.providerKey}
                type="button"
                onClick={() => setSelectedProvider(setting.providerKey)}
                className={`w-full rounded-3xl border p-4 text-left transition ${selected ? 'border-cyan-400 bg-cyan-50 text-slate-950 dark:border-cyan-500 dark:bg-cyan-950/30 dark:text-white' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                      <Store size={18} />
                    </span>
                    <div>
                      <p className="font-semibold">{setting.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{setting.channel?.name || 'Kanal oluşturulmadı'}</p>
                    </div>
                  </div>
                  {setting.channel?.isActive ? <CheckCircle2 className="text-emerald-500" size={20} /> : <TriangleAlert className="text-amber-500" size={20} />}
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2 text-[11px] font-semibold">
                  <MiniFlag active={setting.supportsProductCreate} label="Ürün" />
                  <MiniFlag active={setting.supportsPriceUpdate} label="Fiyat" />
                  <MiniFlag active={setting.supportsStockUpdate} label="Stok" />
                  <MiniFlag active={setting.supportsOrderImport} label="Sipariş" />
                </div>
              </button>
            );
          })}
        </div>

        {selectedSetting ? (
          <Card className="border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-xl">
                <span className="flex items-center gap-2">
                  <KeyRound size={20} />
                  {selectedSetting.name} ayarları
                </span>
                <a className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 dark:text-cyan-300" href={selectedSetting.documentationUrl} target="_blank" rel="noreferrer">
                  Resmi doküman <ExternalLink size={14} />
                </a>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-950 dark:border-cyan-500/30 dark:bg-cyan-950/30 dark:text-cyan-100">
                {selectedSetting.setupSummary}
              </div>

              {selectedGuide ? (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                        <BookOpenCheck size={18} />
                      </span>
                      <div>
                        <h2 className="font-bold text-slate-950 dark:text-white">{selectedGuide.title}</h2>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selectedGuide.summary}</p>
                      </div>
                    </div>
                    <ol className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                      {selectedGuide.steps.map((step, index) => (
                        <li key={step} className="flex gap-3">
                          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-cyan-100 text-xs font-black text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-200">{index + 1}</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                    {selectedGuide.warning ? (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
                        {selectedGuide.warning}
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Gerekli bilgiler</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedGuide.required.map((item) => (
                          <Badge key={item} variant="secondary" className="rounded-full">{item}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Resmi bağlantılar</p>
                      <div className="mt-3 grid gap-2">
                        {selectedGuide.links.map((link) => (
                          <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-center justify-between rounded-2xl border px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 dark:border-white/10 dark:text-cyan-300 dark:hover:bg-cyan-500/10">
                            {link.label}
                            <ExternalLink size={14} />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <Tabs defaultValue="connection" className="space-y-5">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="connection">Bağlantı</TabsTrigger>
                  <TabsTrigger value="credentials">Kimlik Bilgileri</TabsTrigger>
                  <TabsTrigger value="operations">Operasyonlar</TabsTrigger>
                </TabsList>

                <TabsContent value="connection" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <LabeledInput label="Kanal Kodu" value={form.code} onChange={(value) => update('code', value)} disabled={Boolean(form.channelId)} />
                    <LabeledInput label="Kanal Adı" value={form.name} onChange={(value) => update('name', value)} />
                    <LabeledInput label="Satıcı / Mağaza No" value={form.sellerId} onChange={(value) => update('sellerId', value)} />
                    <LabeledInput label="API Adresi" value={form.apiBaseUrl} onChange={(value) => update('apiBaseUrl', value)} placeholder="Boşsa varsayılan kullanılır" />
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Kimlik Doğrulama</label>
                      <Select value={form.authType} onValueChange={(value) => update('authType', value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Basic">Basic Auth</SelectItem>
                          <SelectItem value="ApiKey">API Key</SelectItem>
                          <SelectItem value="OAuth">OAuth</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <SwitchPanel label="Kanal Durumu" value={form.isActive} onChange={(value) => update('isActive', value)} activeLabel="Aktif" inactiveLabel="Pasif" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Not</label>
                    <Textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Mağaza, kategori veya operasyon notları" />
                  </div>
                </TabsContent>

                <TabsContent value="credentials" className="space-y-4">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
                    Mevcut secret: {selectedSetting.channel?.credentialsMasked || '-'} Yeni değer girmezseniz mevcut credential korunur.
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border p-4 dark:border-white/10">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Gelişmiş JSON modu</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Provider dokümanındaki credential JSON’unu birebir yapıştırmak için kullanın.</p>
                    </div>
                    <Switch checked={form.useAdvancedJson} onCheckedChange={(value) => update('useAdvancedJson', value)} />
                  </div>

                  {form.useAdvancedJson ? (
                    <Textarea
                      value={form.credentialsJson}
                      onChange={(event) => update('credentialsJson', event.target.value)}
                      placeholder='{"apiKey":"...","apiSecret":"..."}'
                      className="min-h-40 font-mono text-xs"
                    />
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {selectedSetting.credentialFields.map((field) => (
                        <LabeledInput
                          key={field.key}
                          label={`${field.label}${field.required ? ' *' : ''}`}
                          value={form.credentialValues[field.key] || ''}
                          onChange={(value) => updateCredential(field.key, value)}
                          placeholder={field.placeholder}
                          type={field.type === 'password' ? 'password' : 'text'}
                          helpText={field.helpText}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="operations" className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <OperationCard title="Ürün ekleme" description="Katalog ürününü pazaryerine açar." value={form.supportsProductCreate} onChange={(value) => update('supportsProductCreate', value)} />
                    <OperationCard title="Fiyat güncelleme" description="ERP/B2B fiyat snapshotını gönderir." value={form.supportsPriceUpdate} onChange={(value) => update('supportsPriceUpdate', value)} />
                    <OperationCard title="Stok güncelleme" description="Satılabilir stok bilgisini aktarır." value={form.supportsStockUpdate} onChange={(value) => update('supportsStockUpdate', value)} />
                    <OperationCard title="Sipariş çekme" description="Pazaryeri siparişlerini içeri alır." value={form.supportsOrderImport} onChange={(value) => update('supportsOrderImport', value)} />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </section>
  );
}

function MiniFlag({ active, label }: { active: boolean; label: string }) {
  return <span className={`rounded-full px-2 py-1 text-center ${active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'}`}>{label}</span>;
}

function LabeledInput({ label, value, onChange, placeholder, disabled, type = 'text', helpText }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; disabled?: boolean; type?: string; helpText?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} />
      {helpText ? <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{helpText}</p> : null}
    </div>
  );
}

function SwitchPanel({ label, value, onChange, activeLabel, inactiveLabel }: { label: string; value: boolean; onChange: (value: boolean) => void; activeLabel: string; inactiveLabel: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</label>
      <div className="flex h-10 items-center justify-between rounded-xl border px-3 dark:border-white/10">
        <span className="text-sm">{value ? activeLabel : inactiveLabel}</span>
        <Switch checked={value} onCheckedChange={onChange} />
      </div>
    </div>
  );
}

function OperationCard({ title, description, value, onChange }: { title: string; description: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="rounded-3xl border p-4 dark:border-white/10">
      <div className="flex items-start justify-between gap-3">
        <Settings2 size={18} className="mt-1 text-cyan-600 dark:text-cyan-300" />
        <Switch checked={value} onCheckedChange={onChange} />
      </div>
      <h3 className="mt-4 font-semibold text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}
