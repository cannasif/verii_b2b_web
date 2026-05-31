import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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

type ProviderGuideDefinition = {
  requiredCount: number;
  stepCount: number;
  requiredLabels?: string[];
  defaultSteps?: string[];
  links: Array<{ label: string; href: string }>;
  hasWarning?: boolean;
};

type ProviderDefinitionMap = Record<string, ProviderGuideDefinition>;

const providerGuides: ProviderDefinitionMap = {
  Trendyol: {
    requiredCount: 5,
    stepCount: 4,
    links: [
      { label: 'authorization', href: 'https://developers.trendyol.com/tr/docs/2-authorization' },
      { label: 'developer', href: 'https://developers.trendyol.com/' },
    ],
  },
  Hepsiburada: {
    requiredCount: 5,
    stepCount: 4,
    links: [
      { label: 'gettingStarted', href: 'https://developers.hepsiburada.com/hepsiburada/docs/getting-started' },
      { label: 'developer', href: 'https://developers.hepsiburada.com/' },
    ],
  },
  N11: {
    requiredCount: 3,
    stepCount: 4,
    links: [
      { label: 'priceStock', href: 'https://magazadestek.n11.com/satis-surecleri/restapi-urun-bilgileri-ve-fiyat-stok-guncelleme-servisi-10173' },
      { label: 'sellerSupport', href: 'https://magazadestek.n11.com/' },
    ],
  },
  Pazarama: {
    requiredCount: 3,
    stepCount: 4,
    links: [
      { label: 'apiPdf', href: 'https://cdn.pazarama.com/asset/entegrasyondokumani/APIEntegrasyonDokumani18.09.2023.pdf' },
      { label: 'sellerPanel', href: 'https://www.pazarama.com/satici-basvuru' },
    ],
  },
  PttAvm: {
    requiredCount: 3,
    stepCount: 4,
    links: [
      { label: 'productUpsert', href: 'https://developers.pttavm.com/tr/katalog-entegrasyonu/ueruen-ekleme-guncelleme' },
      { label: 'developer', href: 'https://developers.pttavm.com/' },
    ],
    hasWarning: true,
  },
  Idefix: {
    requiredCount: 3,
    stepCount: 4,
    links: [
      { label: 'productIntegration', href: 'https://developer.idefix.com/api/urun-entegrasyonu' },
      { label: 'priceStock', href: 'https://developer.idefix.com/api/urun-entegrasyonu/stok-ve-fiyat-gonderim' },
    ],
  },
  Ciceksepeti: {
    requiredCount: 3,
    stepCount: 4,
    links: [
      { label: 'sellerPanel', href: 'https://www.ciceksepeti.com/satici-basvuru' },
      { label: 'integration', href: 'https://www.ciceksepeti.com/' },
    ],
    hasWarning: true,
  },
  Ebay: {
    requiredCount: 3,
    stepCount: 5,
    links: [
      { label: 'inventoryApi', href: 'https://developer.ebay.com/api-docs/sell/inventory/overview.html' },
      { label: 'bulkPriceQuantity', href: 'https://developer.ebay.com/api-docs/sell/inventory/resources/methods' },
    ],
    hasWarning: true,
  },
  Shopify: {
    requiredCount: 4,
    stepCount: 5,
    links: [
      { label: 'adminApi', href: 'https://shopify.dev/docs/api/admin-rest' },
      { label: 'inventoryLevels', href: 'https://shopify.dev/docs/api/admin-rest/latest/resources/inventorylevel' },
    ],
    hasWarning: true,
  },
  WooCommerce: {
    requiredCount: 4,
    stepCount: 4,
    links: [
      { label: 'restApi', href: 'https://woocommerce.github.io/woocommerce-rest-api-docs/' },
      { label: 'authentication', href: 'https://woocommerce.github.io/woocommerce-rest-api-docs/#authentication' },
    ],
    hasWarning: true,
  },
  AdobeCommerce: {
    requiredCount: 4,
    stepCount: 5,
    links: [
      { label: 'restApi', href: 'https://developer.adobe.com/commerce/webapi/rest/' },
      { label: 'inventoryApi', href: 'https://developer.adobe.com/commerce/webapi/rest/inventory/' },
    ],
    hasWarning: true,
  },
  Amazon: {
    requiredCount: 7,
    stepCount: 5,
    links: [
      { label: 'registration', href: 'https://developer-docs.amazon.com/sp-api/docs/sp-api-registration-overview' },
      { label: 'marketplaceIds', href: 'https://developer-docs.amazon.com/sp-api/docs/marketplace-ids' },
      { label: 'endpoints', href: 'https://developer-docs.amazon.com/sp-api/docs/sp-api-endpoints' },
    ],
    hasWarning: true,
  },
  Etsy: {
    requiredCount: 5,
    stepCount: 4,
    links: [
      { label: 'openApi', href: 'https://developers.etsy.com/documentation/' },
      { label: 'oauth', href: 'https://developers.etsy.com/documentation/essentials/authentication/' },
    ],
  },
};

const fallbackStepLabels = [
  'Sağlayıcı hesabınızın API erişim ve yetki ayarlarını tamamlayın.',
  'API bilgilerini ve kanal kodlarını kimlik bilgileri alanına girin.',
  'Operasyon izinlerini (ürün, fiyat, stok, sipariş) gerekiyorsa aktif edin.',
  'Kanalı kaydedip test akışıyla bağlantıyı doğrulayın.',
];

const fallbackRequiredLabel = 'Zorunlu alan';

function createFallbackGuide(setting: MarketplaceProviderSettingDto): ProviderGuideDefinition {
  const requiredLabels = setting.credentialFields.filter((field) => field.required).map((field) => field.label);

  return {
    requiredCount: requiredLabels.length > 0 ? requiredLabels.length : 1,
    stepCount: 4,
    requiredLabels,
    defaultSteps: fallbackStepLabels,
    links: [{ label: 'documentation', href: setting.documentationUrl }],
  };
}

function createFallbackProviderSetting(providerKey: string): MarketplaceProviderSettingDto {
  return {
    providerKey,
    name: providerKey,
    defaultAuthType: 'ApiKey',
    documentationUrl: providerGuides[providerKey]?.links?.[0]?.href || '',
    setupSummary: 'Sağlayıcı API alanları backend’de tanımlı olduğunda otomatik gelir.',
    supportsProductCreate: true,
    supportsPriceUpdate: true,
    supportsStockUpdate: true,
    supportsOrderImport: true,
    credentialFields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'API_KEY',
        helpText: 'Sağlayıcı hesabınızdan aldığınız API anahtarını girin.',
      },
    ],
  };
}

function getGuideText(t: (key: string, options?: Record<string, unknown>) => string, key: string, fallback: string): string {
  return t(key, { defaultValue: fallback });
}

function humanizeLinkLabel(label: string): string {
  return label.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}

function createDefaultState(setting?: MarketplaceProviderSettingDto): ProviderFormState {
  const provider = setting?.providerKey || 'Trendyol';
  const channel = setting?.channel;
  const credentialValues = Object.fromEntries((setting?.credentialFields ?? []).map((field) => [field.key, '']));

  return {
    channelId: channel?.id,
    code: channel?.code || `${provider}-ANA-MAGAZA`.toUpperCase(),
    name: channel?.name || `${setting?.name || provider} Main Store`,
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

function buildDisplaySettings(settings: MarketplaceProviderSettingDto[]): MarketplaceProviderSettingDto[] {
  const settingMap = new Map(settings.map((item) => [item.providerKey.toLowerCase(), item] as const));
  const orderedProviders = Object.keys(providerGuides);
  const merged = orderedProviders.map((providerKey) => settingMap.get(providerKey.toLowerCase()) ?? createFallbackProviderSetting(providerKey));
  const unknownProviders = settings.filter((item) => !Object.prototype.hasOwnProperty.call(providerGuides, item.providerKey));
  return [...merged, ...unknownProviders];
}

export function B2bMarketplaceSettingsPage(): ReactElement {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState('Trendyol');
  const [form, setForm] = useState<ProviderFormState>(() => createDefaultState());

  const settingsQuery = useQuery({
    queryKey: ['b2b-marketplaces', 'settings'],
    queryFn: () => b2bApi.getMarketplaceSettings(),
  });

  const settings = settingsQuery.data ?? [];
  const displaySettings = useMemo(() => buildDisplaySettings(settings), [settings]);

  const selectedSetting = useMemo(
    () => displaySettings.find((item) => item.providerKey === selectedProvider) ?? displaySettings[0],
    [selectedProvider, displaySettings],
  );
  const selectedGuide = useMemo(() => {
    if (!selectedSetting) return undefined;
    return providerGuides[selectedSetting.providerKey] ?? createFallbackGuide(selectedSetting);
  }, [selectedSetting]);
  const selectedProviderKey = selectedSetting?.providerKey ?? selectedProvider;

  useEffect(() => {
    if (!selectedSetting) return;
    setSelectedProvider(selectedSetting.providerKey);
    setForm(createDefaultState(selectedSetting));
  }, [selectedSetting?.providerKey, selectedSetting?.channel?.id]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSetting) throw new Error(t('marketplaceSettings.errors.providerNotFound'));
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
      toast.success(t('marketplaceSettings.toasts.saved'));
      setForm((current) => ({
        ...current,
        credentialValues: Object.fromEntries(Object.keys(current.credentialValues).map((key) => [key, ''])),
        credentialsJson: '',
      }));
      await queryClient.invalidateQueries({ queryKey: ['b2b-marketplaces', 'settings'] });
    },
    onError: (error: Error) => toast.error(error.message || t('marketplaceSettings.toasts.saveFailed')),
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
    return <div className="rounded-3xl border bg-white p-6 text-sm dark:border-white/10 dark:bg-slate-950">{t('marketplaceSettings.loading')}</div>;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">{t('marketplaceSettings.badge')}</Badge>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-white">{t('marketplaceSettings.title')}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
            {t('marketplaceSettings.subtitle')}
          </p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !selectedSetting}>
          {saveMutation.isPending ? t('common.saving') : t('marketplaceSettings.saveButton')}
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-3">
          {displaySettings.map((setting) => {
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
                      <p className="text-xs text-slate-500 dark:text-slate-400">{setting.channel?.name || t('marketplaceSettings.channelNotCreated')}</p>
                    </div>
                  </div>
                  {setting.channel?.isActive ? <CheckCircle2 className="text-emerald-500" size={20} /> : <TriangleAlert className="text-amber-500" size={20} />}
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2 text-[11px] font-semibold">
                  <MiniFlag active={setting.supportsProductCreate} label={t('marketplaceSettings.flags.product')} />
                  <MiniFlag active={setting.supportsPriceUpdate} label={t('marketplaceSettings.flags.price')} />
                  <MiniFlag active={setting.supportsStockUpdate} label={t('marketplaceSettings.flags.stock')} />
                  <MiniFlag active={setting.supportsOrderImport} label={t('marketplaceSettings.flags.order')} />
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
                  {t('marketplaceSettings.providerSettingsTitle', { provider: selectedSetting.name })}
                </span>
                <a className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 dark:text-cyan-300" href={selectedSetting.documentationUrl} target="_blank" rel="noreferrer">
                  {t('marketplaceSettings.officialDocument')} <ExternalLink size={14} />
                </a>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-950 dark:border-cyan-500/30 dark:bg-cyan-950/30 dark:text-cyan-100">
                {t(`marketplaceSettings.guides.${selectedProviderKey}.setupSummary`, { defaultValue: selectedSetting.setupSummary })}
              </div>

              {selectedGuide ? (
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                        <BookOpenCheck size={18} />
                      </span>
                      <div>
                        <h2 className="font-bold text-slate-950 dark:text-white">{t(`marketplaceSettings.guides.${selectedProviderKey}.title`)}</h2>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t(`marketplaceSettings.guides.${selectedProviderKey}.summary`)}</p>
                      </div>
                    </div>
                    <ol className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                      {Array.from({ length: selectedGuide.stepCount }, (_, index) => (
                        <li key={`${selectedProviderKey}-step-${index + 1}`} className="flex gap-3">
                          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-cyan-100 text-xs font-black text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-200">{index + 1}</span>
                          <span>
                            {getGuideText(
                              t,
                              `marketplaceSettings.guides.${selectedProviderKey}.steps.${index}`,
                              selectedGuide?.defaultSteps?.[index] ?? `Adım ${index + 1}`,
                            )}
                          </span>
                        </li>
                      ))}
                    </ol>
                    {selectedGuide.hasWarning ? (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
                        {getGuideText(
                          t,
                          `marketplaceSettings.guides.${selectedProviderKey}.warning`,
                          'Ek ayar gereksinimleri nedeniyle üretim bağlantısı dikkatle doğrulanmalıdır.',
                        )}
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('marketplaceSettings.requiredInfo')}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Array.from({ length: selectedGuide.requiredCount }, (_, index) => {
                          const fallback = selectedSetting?.credentialFields[index]?.label ?? `${fallbackRequiredLabel} ${index + 1}`;
                          const label = getGuideText(
                            t,
                            `marketplaceSettings.guides.${selectedProviderKey}.required.${index}`,
                            selectedGuide.requiredLabels?.[index] ?? fallback,
                          );

                          return (
                            <Badge key={`${selectedProviderKey}-required-${index + 1}`} variant="secondary" className="rounded-full">
                              {label}
                            </Badge>
                          );
                        })}
                      </div>
                      {selectedGuide.requiredLabels && selectedGuide.requiredLabels.length > selectedGuide.requiredCount ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedGuide.requiredLabels.slice(selectedGuide.requiredCount).map((requiredLabel) => (
                            <Badge key={`${selectedProviderKey}-required-extra-${requiredLabel}`} variant="outline" className="rounded-full">
                              {requiredLabel}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('marketplaceSettings.officialLinks')}</p>
                      <div className="mt-3 grid gap-2">
                        {selectedGuide.links.map((link) => (
                          <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-center justify-between rounded-2xl border px-3 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 dark:border-white/10 dark:text-cyan-300 dark:hover:bg-cyan-500/10">
                            {getGuideText(
                              t,
                              `marketplaceSettings.guides.${selectedProviderKey}.links.${link.label}`,
                              humanizeLinkLabel(link.label),
                            )}
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
                  <TabsTrigger value="connection">{t('marketplaceSettings.tabs.connection')}</TabsTrigger>
                  <TabsTrigger value="credentials">{t('marketplaceSettings.tabs.credentials')}</TabsTrigger>
                  <TabsTrigger value="operations">{t('marketplaceSettings.tabs.operations')}</TabsTrigger>
                </TabsList>

                <TabsContent value="connection" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <LabeledInput label={t('marketplaceSettings.fields.channelCode')} value={form.code} onChange={(value) => update('code', value)} disabled={Boolean(form.channelId)} />
                    <LabeledInput label={t('marketplaceSettings.fields.channelName')} value={form.name} onChange={(value) => update('name', value)} />
                    <LabeledInput label={t('marketplaceSettings.fields.sellerNo')} value={form.sellerId} onChange={(value) => update('sellerId', value)} />
                    <LabeledInput label={t('marketplaceSettings.fields.apiBaseUrl')} value={form.apiBaseUrl} onChange={(value) => update('apiBaseUrl', value)} placeholder={t('marketplaceSettings.placeholders.defaultApiBaseUrl')} />
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('marketplaceSettings.fields.authType')}</label>
                      <Select value={form.authType} onValueChange={(value) => update('authType', value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Basic">Basic Auth</SelectItem>
                          <SelectItem value="ApiKey">API Key</SelectItem>
                          <SelectItem value="OAuth">OAuth</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <SwitchPanel label={t('marketplaceSettings.fields.channelStatus')} value={form.isActive} onChange={(value) => update('isActive', value)} activeLabel={t('marketplaceSettings.status.active')} inactiveLabel={t('marketplaceSettings.status.passive')} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('marketplaceSettings.fields.notes')}</label>
                    <Textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder={t('marketplaceSettings.placeholders.notes')} />
                  </div>
                </TabsContent>

                <TabsContent value="credentials" className="space-y-4">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
                    {t('marketplaceSettings.currentSecret', { secret: selectedSetting.channel?.credentialsMasked || '-' })}
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border p-4 dark:border-white/10">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{t('marketplaceSettings.advancedJson.title')}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t('marketplaceSettings.advancedJson.description')}</p>
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
                          helpText={getGuideText(
                            t,
                            `marketplaceSettings.guides.${selectedProviderKey}.credentialHelp.${field.key}`,
                            field.helpText ?? '',
                          )}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="operations" className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <OperationCard title={t('marketplaceSettings.operations.product.title')} description={t('marketplaceSettings.operations.product.description')} value={form.supportsProductCreate} onChange={(value) => update('supportsProductCreate', value)} />
                    <OperationCard title={t('marketplaceSettings.operations.price.title')} description={t('marketplaceSettings.operations.price.description')} value={form.supportsPriceUpdate} onChange={(value) => update('supportsPriceUpdate', value)} />
                    <OperationCard title={t('marketplaceSettings.operations.stock.title')} description={t('marketplaceSettings.operations.stock.description')} value={form.supportsStockUpdate} onChange={(value) => update('supportsStockUpdate', value)} />
                    <OperationCard title={t('marketplaceSettings.operations.order.title')} description={t('marketplaceSettings.operations.order.description')} value={form.supportsOrderImport} onChange={(value) => update('supportsOrderImport', value)} />
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

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  type = 'text',
  helpText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
  helpText?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</label>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} />
      {helpText ? <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{helpText}</p> : null}
    </div>
  );
}

function SwitchPanel({
  label,
  value,
  onChange,
  activeLabel,
  inactiveLabel,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  activeLabel: string;
  inactiveLabel: string;
}) {
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

function OperationCard({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
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
