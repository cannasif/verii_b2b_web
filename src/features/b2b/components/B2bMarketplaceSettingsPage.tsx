import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ExternalLink, KeyRound, Store, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { b2bApi } from '../api/b2b.api';
import type { MarketplaceCapabilityDto, MarketplaceChannelDto } from '../types/b2b.types';

type ProviderFormState = {
  channelId?: number;
  code: string;
  name: string;
  sellerId: string;
  apiBaseUrl: string;
  authType: string;
  credentialsJson: string;
  supportsProductCreate: boolean;
  supportsPriceUpdate: boolean;
  supportsStockUpdate: boolean;
  supportsOrderImport: boolean;
  isActive: boolean;
  notes: string;
};

const defaultProviders = ['Trendyol', 'Hepsiburada', 'Amazon', 'Etsy'];

function createDefaultState(provider: string, channel?: MarketplaceChannelDto, capability?: MarketplaceCapabilityDto): ProviderFormState {
  return {
    channelId: channel?.id,
    code: channel?.code || `${provider}-ANA-MAGAZA`.toUpperCase(),
    name: channel?.name || `${capability?.name || provider} Ana Mağaza`,
    sellerId: channel?.sellerId || '',
    apiBaseUrl: channel?.apiBaseUrl || '',
    authType: channel?.authType || (provider === 'Amazon' || provider === 'Etsy' ? 'OAuth' : 'Basic'),
    credentialsJson: '',
    supportsProductCreate: channel?.supportsProductCreate ?? capability?.supportsProductCreate ?? true,
    supportsPriceUpdate: channel?.supportsPriceUpdate ?? capability?.supportsPriceUpdate ?? true,
    supportsStockUpdate: channel?.supportsStockUpdate ?? capability?.supportsStockUpdate ?? true,
    supportsOrderImport: channel?.supportsOrderImport ?? capability?.supportsOrderImport ?? true,
    isActive: channel?.isActive ?? true,
    notes: channel?.notes || '',
  };
}

function providerHelp(provider: string): string {
  if (provider === 'Trendyol') return '{"supplierId":"...","apiKey":"...","apiSecret":"..."}';
  if (provider === 'Hepsiburada') return '{"merchantId":"...","apiKey":"...","apiSecret":"..."}';
  if (provider === 'Amazon') return '{"sellerId":"...","lwaClientId":"...","lwaClientSecret":"...","refreshToken":"...","awsAccessKey":"...","awsSecretKey":"...","roleArn":"..."}';
  return '{"shopId":"...","clientId":"...","clientSecret":"...","refreshToken":"..."}';
}

export function B2bMarketplaceSettingsPage(): ReactElement {
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState('Trendyol');
  const [form, setForm] = useState<ProviderFormState>(() => createDefaultState('Trendyol'));

  const capabilitiesQuery = useQuery({
    queryKey: ['b2b-marketplaces', 'capabilities'],
    queryFn: () => b2bApi.getMarketplaceCapabilities(),
  });

  const channelsQuery = useQuery({
    queryKey: ['b2b-marketplaces', 'channels', 'settings'],
    queryFn: () => b2bApi.getMarketplaceChannels({ pageNumber: 1, pageSize: 100 }),
  });

  const capabilities = capabilitiesQuery.data ?? [];
  const channels = channelsQuery.data?.data ?? [];
  const providers = useMemo(() => {
    const fromCapabilities = capabilities.map((item) => item.providerKey);
    return Array.from(new Set([...fromCapabilities, ...defaultProviders]));
  }, [capabilities]);

  const selectedCapability = capabilities.find((item) => item.providerKey === selectedProvider);
  const selectedChannel = channels.find((item) => item.providerKey === selectedProvider);

  useEffect(() => {
    setForm(createDefaultState(selectedProvider, selectedChannel, selectedCapability));
  }, [selectedProvider, selectedChannel?.id, selectedCapability?.providerKey]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code,
        name: form.name,
        providerKey: selectedProvider,
        sellerId: form.sellerId || undefined,
        apiBaseUrl: form.apiBaseUrl || undefined,
        authType: form.authType,
        credentialsJson: form.credentialsJson || undefined,
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
      setForm((current) => ({ ...current, credentialsJson: '' }));
      await queryClient.invalidateQueries({ queryKey: ['b2b-marketplaces'] });
    },
    onError: (error: Error) => toast.error(error.message || 'Entegrasyon ayarları kaydedilemedi.'),
  });

  function update<K extends keyof ProviderFormState>(key: K, value: ProviderFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="secondary" className="mb-3">Ayarlar</Badge>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Pazar yeri entegrasyon ayarları</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
            Trendyol, Hepsiburada, Amazon ve Etsy mağaza bağlantılarını CRM ayarlarındaki gibi tek ekrandan yönetin.
          </p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          Ayarları Kaydet
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-3">
          {providers.map((provider) => {
            const channel = channels.find((item) => item.providerKey === provider);
            const capability = capabilities.find((item) => item.providerKey === provider);
            const selected = provider === selectedProvider;
            return (
              <button
                key={provider}
                type="button"
                onClick={() => setSelectedProvider(provider)}
                className={`w-full rounded-3xl border p-4 text-left transition ${selected ? 'border-cyan-400 bg-cyan-50 text-slate-950 dark:border-cyan-500 dark:bg-cyan-950/30 dark:text-white' : 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                      <Store size={18} />
                    </span>
                    <div>
                      <p className="font-semibold">{capability?.name || provider}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{channel?.name || 'Kanal oluşturulmadı'}</p>
                    </div>
                  </div>
                  {channel?.isActive ? <CheckCircle2 className="text-emerald-500" size={20} /> : <TriangleAlert className="text-amber-500" size={20} />}
                </div>
              </button>
            );
          })}
        </div>

        <Card className="border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <KeyRound size={20} />
              {selectedCapability?.name || selectedProvider} ayarları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {selectedCapability?.documentationUrl ? (
              <a className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 dark:text-cyan-300" href={selectedCapability.documentationUrl} target="_blank" rel="noreferrer">
                Resmi dokümana git <ExternalLink size={14} />
              </a>
            ) : null}

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
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Durum</label>
                <div className="flex h-10 items-center justify-between rounded-xl border px-3 dark:border-white/10">
                  <span className="text-sm">{form.isActive ? 'Aktif' : 'Pasif'}</span>
                  <Switch checked={form.isActive} onCheckedChange={(value) => update('isActive', value)} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
              Mevcut secret: {selectedChannel?.credentialsMasked || '-'} Yeni değer girmezseniz mevcut credential korunur.
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Credential JSON</label>
              <Textarea
                value={form.credentialsJson}
                onChange={(event) => update('credentialsJson', event.target.value)}
                placeholder={providerHelp(selectedProvider)}
                className="min-h-28 font-mono text-xs"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <SwitchRow label="Ürün ekleme" value={form.supportsProductCreate} onChange={(value) => update('supportsProductCreate', value)} />
              <SwitchRow label="Fiyat güncelleme" value={form.supportsPriceUpdate} onChange={(value) => update('supportsPriceUpdate', value)} />
              <SwitchRow label="Stok güncelleme" value={form.supportsStockUpdate} onChange={(value) => update('supportsStockUpdate', value)} />
              <SwitchRow label="Sipariş çekme" value={form.supportsOrderImport} onChange={(value) => update('supportsOrderImport', value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Not</label>
              <Textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Mağaza, kategori veya operasyon notları" />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function LabeledInput({ label, value, onChange, placeholder, disabled }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; disabled?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} />
    </div>
  );
}

function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border p-3 dark:border-white/10">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
