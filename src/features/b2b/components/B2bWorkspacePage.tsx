import { type ReactElement, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUIStore } from '@/stores/ui-store';
import { b2bApi } from '../api/b2b.api';
import { useB2bWorkspaceQuery } from '../hooks/useB2bWorkspaceQuery';
import type {
  B2bIntegrationEventDto,
  B2bInsightMetricDto,
  B2bInsightSummaryDto,
  B2bBuyerDto,
  B2bCompanyDto,
  B2bWorkspaceKind,
  CatalogProductDto,
  CatalogVisibilityRuleDto,
  CustomerPriceListDto,
  CustomerProductAliasDto,
  CustomerPortalSummaryDto,
  InventorySnapshotDto,
  OrderDto,
  PaymentTransactionDto,
  PurchaseApprovalRuleDto,
  QuoteRequestDto,
  ShoppingListDto,
} from '../types/b2b.types';

interface WorkspaceConfig {
  title: string;
  description: string;
  breadcrumb: string;
  emptyState: string;
}

const configs: Record<B2bWorkspaceKind, WorkspaceConfig> = {
  insights: {
    title: 'B2B Hazırlık Paneli',
    description: 'Katalog, fiyat, stok, eşleştirme, ödeme ve ERP kuyruğunu tek ekranda ölçen v1 canlıya hazırlık görünümü.',
    breadcrumb: 'Hazırlık',
    emptyState: 'Henüz insight verisi yok.',
  },
  companies: {
    title: 'B2B Şirket Hesapları',
    description: 'ERP carilerini B2B şirket hesabına, hiyerarşiye ve kredi limitine bağlayan kurumsal hesap katmanı.',
    breadcrumb: 'Şirketler',
    emptyState: 'Henüz B2B şirket hesabı yok.',
  },
  buyers: {
    title: 'B2B Alıcılar',
    description: 'Şirket içindeki kullanıcı rolleri, sipariş limitleri ve onay gereksinimleri burada yönetilir.',
    breadcrumb: 'Alıcılar',
    emptyState: 'Henüz B2B alıcısı yok.',
  },
  catalog: {
    title: 'B2B Katalog',
    description: 'ERP stoklarını bozmadan müşteriye gösterilecek dijital ürün kartlarını ve varyantlarını yönetin.',
    breadcrumb: 'Katalog',
    emptyState: 'Henüz katalog ürünü yok. İlk adım ERP stoklarından yayınlanacak ürün havuzunu oluşturmak.',
  },
  matches: {
    title: 'Ürün Eşleştirme',
    description: 'Müşteri SKU, ERP stok ve B2B katalog ürünlerini Trendyol/Amazon benzeri bir ön eşleştirme kuyruğunda takip edin.',
    breadcrumb: 'Eşleştirme',
    emptyState: 'Henüz eşleştirme bekleyen müşteri ürünü yok.',
  },
  visibility: {
    title: 'Katalog Görünürlüğü',
    description: 'Şirket, cari veya cari grubuna göre hangi ürün/kategorilerin görüneceğini belirleyen kural katmanı.',
    breadcrumb: 'Görünürlük',
    emptyState: 'Henüz katalog görünürlük kuralı yok.',
  },
  pricing: {
    title: 'Müşteri Fiyatları',
    description: 'Cari, cari grup ve miktar kırılımına göre fiyat listelerini ERP ile uyumlu ayrı bir ticari politika katmanında tutun.',
    breadcrumb: 'Fiyatlar',
    emptyState: 'Henüz müşteri fiyat listesi yok.',
  },
  inventory: {
    title: 'Stok Görünürlüğü',
    description: 'ERP stok/depo bakiyelerini B2B için okunabilir snapshot kayıtlarına dönüştürün.',
    breadcrumb: 'Stok Görünürlüğü',
    emptyState: 'Henüz stok snapshot kaydı yok.',
  },
  'shopping-lists': {
    title: 'Alışveriş Listeleri',
    description: 'Tekrar sipariş, favori ürün ve şirket içi ortak alışveriş listesi akışları için temel yapı.',
    breadcrumb: 'Listeler',
    emptyState: 'Henüz alışveriş listesi yok.',
  },
  'approval-rules': {
    title: 'Satın Alma Onayları',
    description: 'Sipariş tutarı ve rol bazlı onay limitleriyle kurumsal satın alma kontrolünü başlatır.',
    breadcrumb: 'Onay Kuralları',
    emptyState: 'Henüz satın alma onay kuralı yok.',
  },
  quotes: {
    title: 'Teklif Talepleri',
    description: 'B2B müşterileri fiyat pazarlığı veya onay gerektiren kalemleri teklif akışına gönderebilir.',
    breadcrumb: 'Teklifler',
    emptyState: 'Henüz teklif talebi yok.',
  },
  orders: {
    title: 'B2B Siparişler',
    description: 'Sepetten oluşan siparişleri, ERP aktarım numarasını ve ödeme bekleme durumunu izleyin.',
    breadcrumb: 'Siparişler',
    emptyState: 'Henüz B2B siparişi oluşmadı.',
  },
  payments: {
    title: 'Ödeme Altyapısı',
    description: 'V1 ödeme sağlayıcıdan bağımsız ilerler: siparişe bağlı işlem kaydı, dış API referansı ve durum güncellemesi tutulur.',
    breadcrumb: 'Ödemeler',
    emptyState: 'Ödeme sağlayıcısı seçildiğinde bu ekrana işlem listesi ve callback izleri eklenecek.',
  },
  integrations: {
    title: 'ERP Entegrasyon Kuyruğu',
    description: 'Sipariş, teklif ve ödeme gibi kritik olayların ERP’ye aktarım durumunu izleyin.',
    breadcrumb: 'Entegrasyon',
    emptyState: 'Henüz entegrasyon olayı yok.',
  },
};

function isCatalogProduct(row: unknown): row is CatalogProductDto {
  return typeof row === 'object' && row !== null && 'sku' in row && 'isPublished' in row;
}

function isCompany(row: unknown): row is B2bCompanyDto {
  return typeof row === 'object' && row !== null && 'companyCode' in row && 'companyName' in row;
}

function isBuyer(row: unknown): row is B2bBuyerDto {
  return typeof row === 'object' && row !== null && 'email' in row && 'roleCode' in row;
}

function isAlias(row: unknown): row is CustomerProductAliasDto {
  return typeof row === 'object' && row !== null && 'customerSku' in row && 'matchStatus' in row;
}

function isVisibilityRule(row: unknown): row is CatalogVisibilityRuleDto {
  return typeof row === 'object' && row !== null && 'ruleType' in row && 'isActive' in row && 'categoryPath' in row;
}

function isOrder(row: unknown): row is OrderDto {
  return typeof row === 'object' && row !== null && 'orderNumber' in row && 'grandTotal' in row;
}

function isPriceList(row: unknown): row is CustomerPriceListDto {
  return typeof row === 'object' && row !== null && 'code' in row && 'isActive' in row && 'currencyCode' in row;
}

function isInventory(row: unknown): row is InventorySnapshotDto {
  return typeof row === 'object' && row !== null && 'availableQuantity' in row && 'snapshotDate' in row;
}

function isQuote(row: unknown): row is QuoteRequestDto {
  return typeof row === 'object' && row !== null && 'quoteNumber' in row && 'estimatedTotal' in row;
}

function isPayment(row: unknown): row is PaymentTransactionDto {
  return typeof row === 'object' && row !== null && 'providerKey' in row && 'amount' in row;
}

function isIntegrationEvent(row: unknown): row is B2bIntegrationEventDto {
  return typeof row === 'object' && row !== null && 'eventType' in row && 'entityName' in row;
}

function isShoppingList(row: unknown): row is ShoppingListDto {
  return typeof row === 'object' && row !== null && 'listType' in row && 'isShared' in row;
}

function isApprovalRule(row: unknown): row is PurchaseApprovalRuleDto {
  return typeof row === 'object' && row !== null && 'ruleName' in row && 'approverRoleCode' in row;
}

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(value || 0);
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' {
  if (status === 'Critical') return 'destructive';
  if (status === 'Good') return 'default';
  return 'secondary';
}

function formatMetricValue(metric: B2bInsightMetricDto): string {
  const value = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(metric.value || 0);
  return metric.unit ? `${value} ${metric.unit}` : value;
}

function groupedMetrics(summary?: B2bInsightSummaryDto): Array<[string, B2bInsightMetricDto[]]> {
  const groups = new Map<string, B2bInsightMetricDto[]>();
  for (const metric of summary?.metrics ?? []) {
    groups.set(metric.group, [...(groups.get(metric.group) ?? []), metric]);
  }
  return Array.from(groups.entries());
}

function parseQuickOrderLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [skuOrId, quantityText, warehouseText] = line.split(/[,\t;]/).map((part) => part?.trim());
      const quantity = Number(quantityText || '1');
      const numericId = Number(skuOrId);
      return {
        customerSku: Number.isFinite(numericId) ? undefined : skuOrId,
        erpStockId: Number.isFinite(numericId) ? numericId : undefined,
        warehouseCode: warehouseText ? Number(warehouseText) : undefined,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      };
    });
}

export function B2bInsightsPage(): ReactElement {
  const { setPageTitle } = useUIStore();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['b2b-insights-summary'],
    queryFn: b2bApi.getInsightSummary,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    setPageTitle('B2B Hazırlık Paneli');
  }, [setPageTitle]);

  return (
    <div className="space-y-6 p-6">
      <Breadcrumb items={[{ label: 'B2B' }, { label: 'Hazırlık Paneli', isActive: true }]} />

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.20),_transparent_30%),linear-gradient(135deg,_#f8fafc,_#ecfeff)] p-8 shadow-sm dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_right,_rgba(20,184,166,0.16),_transparent_30%),linear-gradient(135deg,_#020617,_#0f172a)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge variant="secondary" className="w-fit">ERP-native B2B kontrol kulesi</Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">B2B Hazırlık Paneli</h1>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              Araştırmada öne çıkan B2B başarı başlıklarını tek yerde topluyoruz: katalog kalitesi, müşteri SKU eşleşmesi,
              fiyat/stok kapsamı, teklif-sipariş akışı, ödeme bekleyenleri ve ERP event kuyruğu.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Yenile
          </Button>
        </div>
      </section>

      {isLoading ? <p className="text-sm text-slate-500">Hazırlık göstergeleri yükleniyor...</p> : null}
      {error ? <p className="text-sm text-red-600">Insight alınamadı: {(error as Error).message}</p> : null}

      {data ? (
        <>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_2fr]">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Canlıya Hazırlık Skoru</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-end gap-3">
                  <span className="text-6xl font-black tracking-tight text-slate-950 dark:text-white">{data.readiness.score}</span>
                  <span className="pb-2 text-sm font-semibold text-slate-500">/ 100</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-cyan-500 via-emerald-500 to-lime-400"
                    style={{ width: `${Math.max(0, Math.min(100, data.readiness.score))}%` }}
                  />
                </div>
                <Badge variant={statusBadgeVariant(data.readiness.status)}>{data.readiness.status}</Badge>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{data.readiness.message}</p>
                <p className="text-xs text-slate-500">Son hesaplama: {new Date(data.generatedAt).toLocaleString('tr-TR')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Önerilen Sonraki Adımlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.actions.map((action) => (
                  <div key={`${action.severity}-${action.title}`} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/60 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <Badge variant={statusBadgeVariant(action.severity)}>{action.severity}</Badge>
                      <p className="font-semibold text-slate-950 dark:text-white">{action.title}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{action.description}</p>
                    </div>
                    {action.targetRoute ? (
                      <Button asChild variant="outline" size="sm">
                        <Link to={action.targetRoute}>Aç</Link>
                      </Button>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {groupedMetrics(data).map(([group, metrics]) => (
              <Card key={group}>
                <CardHeader>
                  <CardTitle>{group}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {metrics.map((metric) => (
                    <div key={metric.key} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{metric.label}</p>
                        <Badge variant={statusBadgeVariant(metric.status)}>{metric.status}</Badge>
                      </div>
                      <p className="mt-3 text-2xl font-black text-slate-950 dark:text-white">{formatMetricValue(metric)}</p>
                      {metric.secondaryValue !== undefined ? (
                        <p className="mt-1 text-xs font-medium text-slate-500">İkincil değer: {new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(metric.secondaryValue)}</p>
                      ) : null}
                      {metric.description ? <p className="mt-3 text-xs leading-5 text-slate-500">{metric.description}</p> : null}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function B2bWorkspacePage({ kind }: { kind: B2bWorkspaceKind }): ReactElement {
  const { setPageTitle } = useUIStore();
  const config = configs[kind];
  const { data, isLoading, error, refetch } = useB2bWorkspaceQuery(kind);
  const rows = data?.data ?? [];
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isActionBusy, setIsActionBusy] = useState(false);
  const [quickCustomerId, setQuickCustomerId] = useState('');
  const [quickOrderText, setQuickOrderText] = useState('');
  const [portalCustomerId, setPortalCustomerId] = useState('');
  const [portalSummary, setPortalSummary] = useState<CustomerPortalSummaryDto | null>(null);

  useEffect(() => {
    setPageTitle(config.title);
  }, [config.title, setPageTitle]);

  async function runAction(action: () => Promise<string>) {
    setIsActionBusy(true);
    setActionMessage(null);
    try {
      const message = await action();
      setActionMessage(message);
      await refetch();
    } catch (actionError) {
      setActionMessage((actionError as Error).message);
    } finally {
      setIsActionBusy(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <Breadcrumb
        items={[
          { label: 'B2B' },
          { label: config.breadcrumb, isActive: true },
        ]}
      />

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_30%),linear-gradient(135deg,_#f8fafc,_#eef6ff)] p-8 shadow-sm dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.14),_transparent_30%),linear-gradient(135deg,_#020617,_#0f172a)]">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge variant="secondary" className="w-fit">ERP uyumlu V1</Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{config.title}</h1>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{config.description}</p>
          </div>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Yenile
          </Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Katalog Mantığı</CardTitle></CardHeader>
          <CardContent className="text-sm text-slate-600">ERP stok referans, B2B katalog müşteri vitrini olarak ayrıldı.</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Eşleştirme</CardTitle></CardHeader>
          <CardContent className="text-sm text-slate-600">Müşteri SKU alias kayıtları manuel veya otomatik eşleşmeye hazır.</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Sipariş</CardTitle></CardHeader>
          <CardContent className="text-sm text-slate-600">Sepet siparişe dönüşür, ERP sipariş numarası sonradan bağlanır.</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Ödeme</CardTitle></CardHeader>
          <CardContent className="text-sm text-slate-600">Dış ödeme API’si için provider ve transaction kayıtları hazır.</CardContent>
        </Card>
      </div>

      {kind === 'orders' ? (
        <Card>
          <CardHeader>
            <CardTitle>Hızlı Sipariş ve Müşteri Portalı</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <div>
                <p className="font-semibold text-slate-950 dark:text-white">SKU / Stok ID yapıştır</p>
                <p className="text-xs text-slate-500">Her satır: SKU veya ERP stock id, miktar, depo kodu. Örn: ABC-001, 5, 1</p>
              </div>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                placeholder="Cari / müşteri id"
                value={quickCustomerId}
                onChange={(event) => setQuickCustomerId(event.target.value)}
              />
              <textarea
                className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                placeholder={"ABC-001, 5, 1\n10025, 2, 1"}
                value={quickOrderText}
                onChange={(event) => setQuickOrderText(event.target.value)}
              />
              <Button
                type="button"
                disabled={isActionBusy}
                onClick={() => void runAction(async () => {
                  const customerId = Number(quickCustomerId);
                  if (!Number.isFinite(customerId) || customerId <= 0) throw new Error('Geçerli müşteri id girin.');
                  const lines = parseQuickOrderLines(quickOrderText);
                  if (lines.length === 0) throw new Error('En az bir hızlı sipariş satırı girin.');
                  const result = await b2bApi.quickOrder({ customerId, currencyCode: 'TRY', lines });
                  return `${result.addedLineCount}/${result.requestedLineCount} satır sepete eklendi.`;
                })}
              >
                Sepete Ekle
              </Button>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <div>
                <p className="font-semibold text-slate-950 dark:text-white">Müşteri portal özeti</p>
                <p className="text-xs text-slate-500">Draft sepet, açık sipariş, bekleyen ödeme ve son siparişleri getirir.</p>
              </div>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                placeholder="Cari / müşteri id"
                value={portalCustomerId}
                onChange={(event) => setPortalCustomerId(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={isActionBusy}
                onClick={() => void runAction(async () => {
                  const customerId = Number(portalCustomerId);
                  if (!Number.isFinite(customerId) || customerId <= 0) throw new Error('Geçerli müşteri id girin.');
                  const summary = await b2bApi.getCustomerPortalSummary(customerId);
                  setPortalSummary(summary);
                  return 'Müşteri portal özeti yüklendi.';
                })}
              >
                Portalı Getir
              </Button>
              {portalSummary ? (
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <span>Açık sipariş: <strong>{portalSummary.openOrderCount}</strong></span>
                  <span>Bekleyen ödeme: <strong>{portalSummary.pendingPaymentCount}</strong></span>
                  <span>Açık tutar: <strong>{formatMoney(portalSummary.openOrderTotal, portalSummary.currencyCode)}</strong></span>
                  <span>Draft sepet: <strong>{portalSummary.draftCartCount}</strong></span>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {actionMessage ? (
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-200">
          {actionMessage}
        </div>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>V1 Kayıtları</CardTitle>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/b2b/insights">Hazırlık</Link></Button>
            <Button asChild variant={kind === 'companies' ? 'default' : 'outline'} size="sm"><Link to="/b2b/companies">Şirket</Link></Button>
            <Button asChild variant={kind === 'buyers' ? 'default' : 'outline'} size="sm"><Link to="/b2b/buyers">Alıcı</Link></Button>
            <Button asChild variant={kind === 'catalog' ? 'default' : 'outline'} size="sm"><Link to="/b2b/catalog">Katalog</Link></Button>
            <Button asChild variant={kind === 'matches' ? 'default' : 'outline'} size="sm"><Link to="/b2b/product-matches">Eşleştirme</Link></Button>
            <Button asChild variant={kind === 'visibility' ? 'default' : 'outline'} size="sm"><Link to="/b2b/catalog-visibility">Görünürlük</Link></Button>
            <Button asChild variant={kind === 'pricing' ? 'default' : 'outline'} size="sm"><Link to="/b2b/pricing">Fiyat</Link></Button>
            <Button asChild variant={kind === 'inventory' ? 'default' : 'outline'} size="sm"><Link to="/b2b/inventory">Stok</Link></Button>
            <Button asChild variant={kind === 'shopping-lists' ? 'default' : 'outline'} size="sm"><Link to="/b2b/shopping-lists">Liste</Link></Button>
            <Button asChild variant={kind === 'approval-rules' ? 'default' : 'outline'} size="sm"><Link to="/b2b/approval-rules">Onay</Link></Button>
            <Button asChild variant={kind === 'quotes' ? 'default' : 'outline'} size="sm"><Link to="/b2b/quotes">Teklif</Link></Button>
            <Button asChild variant={kind === 'orders' ? 'default' : 'outline'} size="sm"><Link to="/b2b/orders">Sipariş</Link></Button>
            <Button asChild variant={kind === 'payments' ? 'default' : 'outline'} size="sm"><Link to="/b2b/payments">Ödeme</Link></Button>
            <Button asChild variant={kind === 'integrations' ? 'default' : 'outline'} size="sm"><Link to="/b2b/integrations">ERP</Link></Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-slate-500">Yükleniyor...</p> : null}
          {error ? <p className="text-sm text-red-600">Veri alınamadı: {(error as Error).message}</p> : null}
          {!isLoading && rows.length === 0 ? <p className="text-sm text-slate-500">{config.emptyState}</p> : null}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row) => {
              if (isCompany(row)) {
                return (
                  <div key={`company-${row.id}`} className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{row.companyName}</p>
                      <p className="text-sm text-slate-500">{row.companyCode} - Cari #{row.customerId || '-'}</p>
                    </div>
                    <Badge variant="secondary">{row.status}</Badge>
                  </div>
                );
              }
              if (isBuyer(row)) {
                return (
                  <div key={`buyer-${row.id}`} className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{row.fullName}</p>
                      <p className="text-sm text-slate-500">{row.email} - Şirket #{row.companyId}</p>
                    </div>
                    <Badge variant={row.requiresApproval ? 'default' : 'secondary'}>{row.roleCode}</Badge>
                  </div>
                );
              }
              if (isCatalogProduct(row)) {
                return (
                  <div key={`catalog-${row.id}`} className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{row.name}</p>
                      <p className="text-sm text-slate-500">{row.sku} {row.brand ? `- ${row.brand}` : ''}</p>
                    </div>
                    <Badge variant={row.isPublished ? 'default' : 'secondary'}>{row.isPublished ? 'Yayında' : 'Taslak'}</Badge>
                  </div>
                );
              }
              if (isAlias(row)) {
                return (
                  <div key={`alias-${row.id}`} className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{row.customerSku}</p>
                      <p className="text-sm text-slate-500">{row.customerProductName || 'Müşteri ürün adı bekleniyor'}</p>
                    </div>
                    <Badge variant="secondary">{row.matchStatus}</Badge>
                  </div>
                );
              }
              if (isVisibilityRule(row)) {
                return (
                  <div key={`visibility-${row.id}`} className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{row.categoryPath || `Ürün #${row.catalogProductId || '-'}`}</p>
                      <p className="text-sm text-slate-500">Şirket #{row.companyId || '-'} - Cari grup {row.customerGroupCode || '-'}</p>
                    </div>
                    <Badge variant={row.ruleType === 'Include' ? 'default' : 'secondary'}>{row.ruleType}</Badge>
                  </div>
                );
              }
              if (isOrder(row)) {
                return (
                  <div key={`order-${row.id}`} className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{row.orderNumber}</p>
                      <p className="text-sm text-slate-500">Cari #{row.customerId} - {row.status}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatMoney(row.grandTotal, row.currencyCode)}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isActionBusy}
                        onClick={() => void runAction(async () => {
                          const result = await b2bApi.reorder({ orderId: row.id });
                          return `${row.orderNumber} tekrar sepete alındı: ${result.addedLineCount}/${result.requestedLineCount} satır.`;
                        })}
                      >
                        Tekrar Sipariş
                      </Button>
                    </div>
                  </div>
                );
              }
              if (isPriceList(row)) {
                return (
                  <div key={`price-${row.id}`} className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{row.name}</p>
                      <p className="text-sm text-slate-500">{row.code} - {row.customerGroupCode || `Cari #${row.customerId || 'genel'}`}</p>
                    </div>
                    <Badge variant={row.isActive ? 'default' : 'secondary'}>{row.currencyCode}</Badge>
                  </div>
                );
              }
              if (isInventory(row)) {
                return (
                  <div key={`inventory-${row.id}`} className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{row.erpStockCode || `Stok #${row.id}`}</p>
                      <p className="text-sm text-slate-500">{row.warehouseName || `Depo ${row.warehouseCode || '-'}`}</p>
                    </div>
                    <span className="font-semibold">{row.availableQuantity} {row.unit || ''}</span>
                  </div>
                );
              }
              if (isQuote(row)) {
                return (
                  <div key={`quote-${row.id}`} className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{row.quoteNumber}</p>
                      <p className="text-sm text-slate-500">Cari #{row.customerId} - {row.status}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatMoney(row.estimatedTotal, row.currencyCode)}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isActionBusy || row.status !== 'Approved'}
                        onClick={() => void runAction(async () => {
                          await b2bApi.convertQuoteToCart(row.id, {});
                          return `${row.quoteNumber} sepete çevrildi.`;
                        })}
                      >
                        Sepete Çevir
                      </Button>
                    </div>
                  </div>
                );
              }
              if (isShoppingList(row)) {
                return (
                  <div key={`shopping-list-${row.id}`} className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{row.name}</p>
                      <p className="text-sm text-slate-500">Şirket #{row.companyId} - {row.listType}</p>
                    </div>
                    <Badge variant={row.isShared ? 'default' : 'secondary'}>{row.isShared ? 'Ortak' : 'Kişisel'}</Badge>
                  </div>
                );
              }
              if (isApprovalRule(row)) {
                return (
                  <div key={`approval-${row.id}`} className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{row.ruleName}</p>
                      <p className="text-sm text-slate-500">Şirket #{row.companyId} - Onay rolü {row.approverRoleCode}</p>
                    </div>
                    <span className="font-semibold">{formatMoney(row.minOrderAmount || 0, row.currencyCode)}+</span>
                  </div>
                );
              }
              if (isPayment(row)) {
                return (
                  <div key={`payment-${row.id}`} className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{row.providerKey}</p>
                      <p className="text-sm text-slate-500">Sipariş #{row.orderId} - {row.status}</p>
                    </div>
                    <span className="font-semibold">{formatMoney(row.amount, row.currencyCode)}</span>
                  </div>
                );
              }
              if (isIntegrationEvent(row)) {
                return (
                  <div key={`integration-${row.id}`} className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{row.eventType}</p>
                      <p className="text-sm text-slate-500">{row.direction} - {row.entityName} #{row.entityId || '-'}</p>
                    </div>
                    <Badge variant="secondary">{row.status}</Badge>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function B2bCatalogPage(): ReactElement {
  return <B2bWorkspacePage kind="catalog" />;
}

export function B2bCompaniesPage(): ReactElement {
  return <B2bWorkspacePage kind="companies" />;
}

export function B2bBuyersPage(): ReactElement {
  return <B2bWorkspacePage kind="buyers" />;
}

export function B2bProductMatchesPage(): ReactElement {
  return <B2bWorkspacePage kind="matches" />;
}

export function B2bCatalogVisibilityPage(): ReactElement {
  return <B2bWorkspacePage kind="visibility" />;
}

export function B2bPricingPage(): ReactElement {
  return <B2bWorkspacePage kind="pricing" />;
}

export function B2bInventoryPage(): ReactElement {
  return <B2bWorkspacePage kind="inventory" />;
}

export function B2bQuotesPage(): ReactElement {
  return <B2bWorkspacePage kind="quotes" />;
}

export function B2bShoppingListsPage(): ReactElement {
  return <B2bWorkspacePage kind="shopping-lists" />;
}

export function B2bApprovalRulesPage(): ReactElement {
  return <B2bWorkspacePage kind="approval-rules" />;
}

export function B2bOrdersPage(): ReactElement {
  return <B2bWorkspacePage kind="orders" />;
}

export function B2bPaymentsPage(): ReactElement {
  return <B2bWorkspacePage kind="payments" />;
}

export function B2bIntegrationsPage(): ReactElement {
  return <B2bWorkspacePage kind="integrations" />;
}
