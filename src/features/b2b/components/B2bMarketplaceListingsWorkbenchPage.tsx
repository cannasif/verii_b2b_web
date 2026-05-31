import { type ReactElement, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Boxes, ExternalLink, PackageSearch, RefreshCcw, Search, Send, Tag, Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { b2bApi } from '../api/b2b.api';
import type { MarketplaceListingDto } from '../types/b2b.types';

type MarketplaceAction = 'product-create' | 'price-update' | 'stock-update' | 'clone-to-channel';

type ActionState = {
  type: MarketplaceAction;
  listing: MarketplaceListingDto;
} | null;

function formatMoney(value?: number, currency = 'TRY'): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(value);
}

function normalize(value?: string | null): string {
  return (value ?? '').toLocaleLowerCase('tr-TR');
}

function statusTone(status?: string): string {
  const normalized = normalize(status);
  if (normalized.includes('fail') || normalized.includes('error') || normalized.includes('hata')) {
    return 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300';
  }
  if (normalized.includes('published') || normalized.includes('success') || normalized.includes('yay')) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
  }
  if (normalized.includes('ready') || normalized.includes('pending')) {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
  }
  return 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300';
}

export function B2bMarketplaceListingsPage(): ReactElement {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedChannelId, setSelectedChannelId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<ActionState>(null);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [currencyCode, setCurrencyCode] = useState('TRY');
  const [targetChannelId, setTargetChannelId] = useState('');

  const channelsQuery = useQuery({
    queryKey: ['b2b-marketplace-workbench', 'channels'],
    queryFn: () => b2bApi.getMarketplaceChannels({ pageNumber: 1, pageSize: 200, sortBy: 'Name', sortDirection: 'asc' }),
  });

  const listingsQuery = useQuery({
    queryKey: ['b2b-marketplace-workbench', 'listings'],
    queryFn: () => b2bApi.getMarketplaceListings({ pageNumber: 1, pageSize: 500, sortBy: 'Id', sortDirection: 'desc' }),
  });

  const eventsQuery = useQuery({
    queryKey: ['b2b-marketplace-workbench', 'events'],
    queryFn: () => b2bApi.getMarketplaceSyncEvents({ pageNumber: 1, pageSize: 20, sortBy: 'RequestedDate', sortDirection: 'desc' }),
  });

  const channels = channelsQuery.data?.data ?? [];
  const activeChannels = channels.filter((channel) => channel.isActive);
  const listings = listingsQuery.data?.data ?? [];
  const filteredListings = useMemo(() => {
    const term = normalize(search);
    return listings.filter((item) => {
      const channelMatches = selectedChannelId === 'all' || String(item.channelId) === selectedChannelId;
      const searchMatches = !term
        || normalize(item.sku).includes(term)
        || normalize(item.catalogProductName).includes(term)
        || normalize(item.channelName).includes(term)
        || normalize(item.marketplaceListingId).includes(term)
        || normalize(item.marketplaceProductId).includes(term);
      return channelMatches && searchMatches;
    });
  }, [listings, search, selectedChannelId]);

  const selectedChannel = selectedChannelId === 'all'
    ? null
    : channels.find((channel) => String(channel.id) === selectedChannelId) ?? null;

  const pendingEventCount = (eventsQuery.data?.data ?? []).filter((event) => normalize(event.status).includes('pending')).length;
  const failedListingCount = listings.filter((item) => normalize(item.status).includes('fail')).length;
  const missingPriceCount = listings.filter((item) => item.lastPushedPrice == null).length;

  const operationMutation = useMutation({
    mutationFn: async () => {
      if (!action) throw new Error(t('marketplaceWorkbench.errors.noAction'));
      const listing = action.listing;
      const provider = listing.providerKey || channels.find((channel) => channel.id === listing.channelId)?.providerKey;
      if (!provider) throw new Error(t('marketplaceWorkbench.errors.providerMissing'));

      if (action.type === 'clone-to-channel') {
        const target = channels.find((channel) => String(channel.id) === targetChannelId);
        if (!target) throw new Error(t('marketplaceWorkbench.errors.targetChannelRequired'));
        const created = await b2bApi.upsertMarketplaceListing({
          channelId: target.id,
          catalogProductId: listing.catalogProductId,
          erpStockId: listing.erpStockId,
          sku: listing.sku,
          barcode: listing.barcode,
          marketplaceProductId: listing.marketplaceProductId,
          marketplaceListingId: listing.marketplaceListingId,
          status: 'Draft',
          lastPushedPrice: listing.lastPushedPrice,
          lastPushedQuantity: listing.lastPushedQuantity,
          currencyCode: listing.currencyCode || currencyCode,
        });
        return b2bApi.queueMarketplaceProviderOperation(target.providerKey, 'product-create', {
          listingId: created.id,
          operationType: 'ProductCreate',
          price: listing.lastPushedPrice,
          quantity: listing.lastPushedQuantity,
          currencyCode: listing.currencyCode || currencyCode,
        });
      }

      const payload: Record<string, unknown> = {
        listingId: listing.id,
        operationType: action.type === 'product-create' ? 'ProductCreate' : action.type === 'price-update' ? 'PriceUpdate' : 'StockUpdate',
        currencyCode,
      };
      if (action.type === 'price-update') payload.price = Number(price);
      if (action.type === 'stock-update') payload.quantity = Number(quantity);

      return b2bApi.queueMarketplaceProviderOperation(provider, action.type, payload);
    },
    onSuccess: async () => {
      toast.success(t('marketplaceWorkbench.toasts.queued'));
      closeAction();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['b2b-marketplace-workbench'] }),
        queryClient.invalidateQueries({ queryKey: ['b2b-workspace', 'marketplace-listings'] }),
      ]);
    },
    onError: (error: Error) => toast.error(error.message || t('marketplaceWorkbench.toasts.queueFailed')),
  });

  function openAction(type: MarketplaceAction, listing: MarketplaceListingDto): void {
    setAction({ type, listing });
    setPrice(listing.lastPushedPrice != null ? String(listing.lastPushedPrice) : '');
    setQuantity(listing.lastPushedQuantity != null ? String(listing.lastPushedQuantity) : '');
    setCurrencyCode(listing.currencyCode || 'TRY');
    setTargetChannelId('');
  }

  function closeAction(): void {
    setAction(null);
    setPrice('');
    setQuantity('');
    setTargetChannelId('');
  }

  const targetChannels = action
    ? activeChannels.filter((channel) => channel.id !== action.listing.channelId)
    : [];

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_30%),linear-gradient(135deg,#f8fafc,#ecfeff)] p-6 dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.16),transparent_30%),linear-gradient(135deg,#020617,#0f172a)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Badge className="mb-3 rounded-full">{t('marketplaceWorkbench.badge')}</Badge>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">{t('marketplaceWorkbench.title')}</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-600 dark:text-slate-300">{t('marketplaceWorkbench.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void queryClient.invalidateQueries({ queryKey: ['b2b-marketplace-workbench'] })}>
              <RefreshCcw className="mr-2 size-4" />
              {t('common.refresh', { defaultValue: 'Yenile' })}
            </Button>
            <Button asChild>
              <a href="/b2b/marketplace-settings">
                {t('marketplaceWorkbench.configureIntegrations')}
                <ExternalLink className="ml-2 size-4" />
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <MetricCard icon={<Boxes className="size-4" />} label={t('marketplaceWorkbench.metrics.products')} value={listings.length} />
          <MetricCard icon={<StoreIcon />} label={t('marketplaceWorkbench.metrics.channels')} value={activeChannels.length} />
          <MetricCard icon={<PackageSearch className="size-4" />} label={t('marketplaceWorkbench.metrics.pending')} value={pendingEventCount} />
          <MetricCard icon={<Tag className="size-4" />} label={t('marketplaceWorkbench.metrics.missingPrice')} value={missingPriceCount + failedListingCount} />
        </div>
      </div>

      <Card className="border-slate-200 dark:border-white/10">
        <CardContent className="grid gap-3 p-4 xl:grid-cols-[280px_minmax(0,1fr)_220px]">
          <div className="space-y-2">
            <Label>{t('marketplaceWorkbench.filters.channel')}</Label>
            <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('marketplaceWorkbench.filters.allChannels')}</SelectItem>
                {channels.map((channel) => (
                  <SelectItem key={channel.id} value={String(channel.id)}>{channel.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('common.search')}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('marketplaceWorkbench.filters.searchPlaceholder')} className="pl-9" />
            </div>
          </div>
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-3 text-sm font-semibold text-cyan-950 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-100">
            {selectedChannel ? t('marketplaceWorkbench.filters.selectedChannel', { channel: selectedChannel.name }) : t('marketplaceWorkbench.filters.allChannelsHelp')}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <GuideCard title={t('marketplaceWorkbench.flow.view.title')} description={t('marketplaceWorkbench.flow.view.description')} icon={<PackageSearch className="size-5" />} />
        <GuideCard title={t('marketplaceWorkbench.flow.update.title')} description={t('marketplaceWorkbench.flow.update.description')} icon={<Tag className="size-5" />} />
        <GuideCard title={t('marketplaceWorkbench.flow.publish.title')} description={t('marketplaceWorkbench.flow.publish.description')} icon={<Send className="size-5" />} />
      </div>

      <div className="grid gap-4">
        {filteredListings.map((listing) => (
          <Card key={listing.id} className="overflow-hidden border-slate-200 dark:border-white/10">
            <CardContent className="p-0">
              <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_420px]">
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="rounded-full">{listing.channelName || listing.providerKey || '-'}</Badge>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusTone(listing.status)}`}>{listing.status || '-'}</span>
                      </div>
                      <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-white">{listing.catalogProductName || listing.sku}</h2>
                      <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                        {t('marketplaceWorkbench.card.sku')}: {listing.sku} · {t('marketplaceWorkbench.card.barcode')}: {listing.barcode || '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{t('marketplaceWorkbench.card.lastPrice')}</p>
                      <p className="text-2xl font-black text-slate-950 dark:text-white">{formatMoney(listing.lastPushedPrice, listing.currencyCode)}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <InfoTile label={t('marketplaceWorkbench.card.stock')} value={listing.lastPushedQuantity ?? '-'} />
                    <InfoTile label={t('marketplaceWorkbench.card.marketplaceProductId')} value={listing.marketplaceProductId || '-'} />
                    <InfoTile label={t('marketplaceWorkbench.card.marketplaceListingId')} value={listing.marketplaceListingId || '-'} />
                  </div>
                  {listing.errorMessage ? (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
                      {listing.errorMessage}
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.03] xl:border-l xl:border-t-0">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{t('marketplaceWorkbench.actions.title')}</p>
                  <div className="mt-3 grid gap-2">
                    <Button variant="outline" className="justify-between" onClick={() => openAction('price-update', listing)}>
                      {t('marketplaceWorkbench.actions.updatePrice')}
                      <ArrowRight className="size-4" />
                    </Button>
                    <Button variant="outline" className="justify-between" onClick={() => openAction('stock-update', listing)}>
                      {t('marketplaceWorkbench.actions.updateStock')}
                      <ArrowRight className="size-4" />
                    </Button>
                    <Button variant="outline" className="justify-between" onClick={() => openAction('product-create', listing)}>
                      {t('marketplaceWorkbench.actions.publishSameChannel')}
                      <ArrowRight className="size-4" />
                    </Button>
                    <Button className="justify-between" onClick={() => openAction('clone-to-channel', listing)}>
                      {t('marketplaceWorkbench.actions.publishAnotherChannel')}
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!listingsQuery.isLoading && filteredListings.length === 0 ? (
        <Card className="border-dashed border-slate-300 dark:border-white/15">
          <CardContent className="p-8 text-center">
            <PackageSearch className="mx-auto size-10 text-slate-400" />
            <h2 className="mt-4 text-xl font-black text-slate-950 dark:text-white">{t('marketplaceWorkbench.empty.title')}</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{t('marketplaceWorkbench.empty.description')}</p>
            <Button asChild className="mt-5">
              <a href="/b2b/marketplace-settings">{t('marketplaceWorkbench.configureIntegrations')}</a>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={Boolean(action)} onOpenChange={(open) => !open && closeAction()}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{action ? t(`marketplaceWorkbench.dialog.${action.type}.title`) : ''}</DialogTitle>
            <DialogDescription>{action?.listing.sku}</DialogDescription>
          </DialogHeader>
          {action?.type === 'price-update' ? (
            <div className="grid gap-4 md:grid-cols-2">
              <LabeledField label={t('marketplaceWorkbench.dialog.price')}>
                <Input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} />
              </LabeledField>
              <LabeledField label={t('marketplaceWorkbench.dialog.currency')}>
                <Input value={currencyCode} onChange={(event) => setCurrencyCode(event.target.value.toUpperCase())} maxLength={3} />
              </LabeledField>
            </div>
          ) : null}
          {action?.type === 'stock-update' ? (
            <LabeledField label={t('marketplaceWorkbench.dialog.quantity')}>
              <Input type="number" min="0" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </LabeledField>
          ) : null}
          {action?.type === 'clone-to-channel' ? (
            <LabeledField label={t('marketplaceWorkbench.dialog.targetChannel')}>
              <Select value={targetChannelId} onValueChange={setTargetChannelId}>
                <SelectTrigger><SelectValue placeholder={t('marketplaceWorkbench.dialog.targetChannelPlaceholder')} /></SelectTrigger>
                <SelectContent>
                  {targetChannels.map((channel) => (
                    <SelectItem key={channel.id} value={String(channel.id)}>{channel.name} ({channel.providerKey})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </LabeledField>
          ) : null}
          {action?.type === 'product-create' ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
              {t('marketplaceWorkbench.dialog.productCreateHelp')}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={closeAction}>{t('common.cancel')}</Button>
            <Button onClick={() => operationMutation.mutate()} disabled={operationMutation.isPending}>
              {operationMutation.isPending ? t('common.processing') : t('marketplaceWorkbench.dialog.queue')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function MetricCard({ icon, label, value }: { icon: ReactElement; label: string; value: number }): ReactElement {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-slate-950 text-white dark:bg-cyan-400 dark:text-slate-950">{icon}</span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-black text-slate-950 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function GuideCard({ title, description, icon }: { title: string; description: string; icon: ReactElement }): ReactElement {
  return (
    <Card className="border-slate-200 dark:border-white/10">
      <CardContent className="p-5">
        <span className="grid size-11 place-items-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-200">{icon}</span>
        <h3 className="mt-4 font-black text-slate-950 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{description}</p>
      </CardContent>
    </Card>
  );
}

function InfoTile({ label, value }: { label: string; value: string | number }): ReactElement {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function LabeledField({ label, children }: { label: string; children: ReactElement }): ReactElement {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function StoreIcon(): ReactElement {
  return <Warehouse className="size-4" />;
}
