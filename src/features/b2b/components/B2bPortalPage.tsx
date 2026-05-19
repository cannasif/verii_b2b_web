import { type ReactElement, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight, BarChart3, Building2, CheckCircle2, ClipboardList, FileText, PackageSearch, Repeat2, ShoppingCart, Sparkles, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PagedLookupDialog } from '@/components/shared';
import { b2bApi } from '../api/b2b.api';
import type { B2bCompanyDto, B2bPortalSessionDto, B2bPriceAvailabilityDto, CartDto, CatalogProductDto } from '../types/b2b.types';

const PORTAL_SESSION_STORAGE_KEY = 'v3rii-b2b-portal-session';

function formatMoney(value?: number, currency = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(value ?? 0);
}

function resolveCustomerId(company: B2bCompanyDto | null): number {
  return Number(company?.customerId ?? 0);
}

function productSku(product: CatalogProductDto): string {
  return product.sku || `B2B-${product.id}`;
}

const portalCapabilities = [
  { title: 'Hızlı Sipariş', text: 'SKU yapıştır, miktar gir, sepete aktar.', icon: Upload },
  { title: 'Teklif / RFQ', text: 'Sepeti teklif talebine çevir.', icon: FileText },
  { title: 'Tekrar Sipariş', text: 'Geçmiş siparişlerden hızlı dönüş.', icon: Repeat2 },
  { title: 'Hesap Özeti', text: 'Açık sipariş, ödeme ve bakiye görünümü.', icon: BarChart3 },
];

export function B2bPortalPage(): ReactElement {
  const [companyCode, setCompanyCode] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [companyLookupOpen, setCompanyLookupOpen] = useState(false);
  const [companyLookupLabel, setCompanyLookupLabel] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [portalSession, setPortalSession] = useState<B2bPortalSessionDto | null>(() => {
    const raw = window.localStorage.getItem(PORTAL_SESSION_STORAGE_KEY);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw) as B2bPortalSessionDto;
      return new Date(session.expiresAt).getTime() > Date.now() ? session : null;
    } catch {
      return null;
    }
  });
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [resolvedPrices, setResolvedPrices] = useState<Record<number, B2bPriceAvailabilityDto>>({});
  const [cart, setCart] = useState<CartDto | null>(null);
  const [quickOrderText, setQuickOrderText] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const selectedCompany = portalSession?.company ?? null;
  const selectedBuyer = portalSession?.buyer ?? null;
  const portalToken = portalSession?.token ?? '';
  const customerId = resolveCustomerId(selectedCompany);
  const portalUserPayload = useMemo(
    () => ({
      buyerId: selectedBuyer?.id,
      userId: selectedBuyer?.userId,
    }),
    [selectedBuyer],
  );

  const sessionMutation = useMutation({
    mutationFn: (input: { selectedCompanyCode: string; selectedBuyerEmail: string }) => b2bApi.createPortalSession(input.selectedCompanyCode, input.selectedBuyerEmail),
    onSuccess: (session) => {
      setPortalSession(session);
      window.localStorage.setItem(PORTAL_SESSION_STORAGE_KEY, JSON.stringify(session));
      setMessage(`${session.buyer?.fullName || session.company.companyName} için portal oturumu açıldı.`);
      if (session.company.customerId) {
        void b2bApi.getPublicDraftCart(session.company.customerId, session.token).then(setCart).catch(() => undefined);
      }
    },
    onError: (error) => setMessage((error as Error).message),
  });

  const catalogQuery = useQuery({
    queryKey: ['b2b-public-catalog', catalogSearch, portalToken],
    queryFn: () => b2bApi.getPublicCatalogProducts({ pageNumber: 1, pageSize: 12, search: catalogSearch }, portalToken),
  });

  const portalQuery = useQuery({
    queryKey: ['b2b-public-portal-summary', customerId, selectedBuyer?.id, portalToken],
    queryFn: () => b2bApi.getPublicCustomerPortalSummary(customerId, portalToken),
    enabled: customerId > 0 && Boolean(portalToken),
  });

  const cartLineCount = useMemo(() => cart?.lines.reduce((total, line) => total + line.quantity, 0) ?? 0, [cart]);
  const cartTotal = useMemo(() => cart?.lines.reduce((total, line) => total + line.quantity * line.unitPrice, 0) ?? 0, [cart]);

  const resolveMutation = useMutation({
    mutationFn: async (product: CatalogProductDto) => {
      if (customerId <= 0) throw new Error('Önce şirket seçin.');
      const quantity = quantities[product.id] || 1;
      return b2bApi.publicResolvePriceAvailability({
        customerId,
        catalogProductId: product.id,
        erpStockId: product.defaultStockId,
        quantity,
        currencyCode: 'TRY',
      }, portalToken);
    },
    onSuccess: (data) => {
      if (data.catalogProductId) {
        setResolvedPrices((current) => ({ ...current, [data.catalogProductId!]: data }));
      }
      setMessage(data.warnings.length > 0 ? data.warnings.join(' ') : 'Fiyat ve stok çözümlendi.');
    },
    onError: (error) => setMessage((error as Error).message),
  });

  const addToCartMutation = useMutation({
    mutationFn: async (product: CatalogProductDto) => {
      if (customerId <= 0) throw new Error('Önce şirket seçin.');
      const quantity = quantities[product.id] || 1;
      return b2bApi.publicAddCartLine({
        customerId,
        ...portalUserPayload,
        customerGroupCode: selectedCompany?.customerGroupCode,
        catalogProductId: product.id,
        erpStockId: product.defaultStockId,
        quantity,
        currencyCode: 'TRY',
        allowBackorder: true,
      }, portalToken);
    },
    onSuccess: (data) => {
      setCart(data);
      setMessage('Ürün sepete eklendi.');
    },
    onError: (error) => setMessage((error as Error).message),
  });

  const quickOrderMutation = useMutation({
    mutationFn: async () => {
      if (customerId <= 0) throw new Error('Önce şirket seçin.');
      const lines = quickOrderText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [skuOrCode, quantityValue, warehouseValue] = line.split(/[,\t;]/).map((part) => part.trim());
          return {
            customerSku: skuOrCode,
            quantity: Number(quantityValue || 1),
            warehouseCode: warehouseValue ? Number(warehouseValue) : undefined,
          };
        });
      if (lines.length === 0) throw new Error('En az bir hızlı sipariş satırı girin.');
      return b2bApi.publicQuickOrder({
        customerId,
        ...portalUserPayload,
        customerGroupCode: selectedCompany?.customerGroupCode,
        currencyCode: 'TRY',
        allowBackorder: true,
        lines,
      }, portalToken);
    },
    onSuccess: (data) => {
      if (data.cart) setCart(data.cart);
      setMessage(`${data.addedLineCount}/${data.requestedLineCount} satır sepete eklendi.`);
    },
    onError: (error) => setMessage((error as Error).message),
  });

  const quoteMutation = useMutation({
    mutationFn: async () => {
      if (customerId <= 0) throw new Error('Önce şirket seçin.');
      if (!cart || cart.lines.length === 0) throw new Error('Teklif talebi için sepette ürün olmalı.');
      return b2bApi.createPublicQuote({
        customerId,
        ...portalUserPayload,
        currencyCode: cart.currencyCode || 'TRY',
        offerType: 'B2B Portal',
        customerNote,
        lines: cart.lines.map((line) => ({
          catalogProductId: line.catalogProductId,
          catalogVariantId: line.catalogVariantId,
          erpStockId: line.erpStockId,
          quantity: line.quantity,
          targetUnitPrice: line.unitPrice,
          vatRate: 20,
          description: customerNote,
        })),
      }, portalToken);
    },
    onSuccess: (quote) => setMessage(`${quote.offerNo || quote.quoteNumber} numaralı teklif talebi oluşturuldu.`),
    onError: (error) => setMessage((error as Error).message),
  });

  const orderMutation = useMutation({
    mutationFn: async () => {
      if (!cart) throw new Error('Sipariş için sepet bulunamadı.');
      return b2bApi.publicCreateOrderFromCart({
        cartId: cart.id,
        taxTotal: Math.round(cartTotal * 0.2 * 100) / 100,
        offerType: 'B2B Portal',
        deliveryMethod: 'Standart sevkiyat',
        description: customerNote,
      }, portalToken);
    },
    onSuccess: (order) => setMessage(`${order.offerNo || order.orderNumber} numaralı sipariş oluşturuldu.`),
    onError: (error) => setMessage((error as Error).message),
  });

  return (
    <main className="min-h-screen bg-[#f6f0e4] text-slate-950">
      <section className="relative overflow-hidden border-b border-emerald-950/10 bg-[radial-gradient(circle_at_10%_10%,#d6f5dd_0,#f6f0e4_34%,transparent_62%),radial-gradient(circle_at_82%_0%,#b7ead1_0,transparent_32%),linear-gradient(135deg,#f8f3e8,#eef8eb)]">
        <div className="absolute right-[-10rem] top-[-14rem] h-[30rem] w-[30rem] rounded-full bg-emerald-300/35 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-[-12rem] h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5 py-7">
          <header className="mb-10 flex flex-col gap-4 rounded-[2rem] border border-white/60 bg-white/45 p-3 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-900 text-sm font-black text-white shadow-lg shadow-emerald-900/20">V3</div>
              <div>
                <p className="text-sm font-black text-emerald-950">V3RII B2B Portal</p>
                <p className="text-xs font-semibold text-emerald-900/60">ERP uyumlu müşteri satın alma çalışma alanı</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="border-emerald-900/15 bg-white/70 text-emerald-950 hover:bg-white">
                <Link to="/auth/login">Admin Girişi</Link>
              </Button>
              <Button asChild className="bg-emerald-900 text-white hover:bg-emerald-800">
                <Link to="/dashboard">Yönetim Paneli</Link>
              </Button>
            </div>
          </header>

          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
          <div className="max-w-4xl space-y-6">
            <Badge className="w-fit border-emerald-900/10 bg-emerald-800 text-white">Müşteri Portalı</Badge>
            <div>
              <h1 className="max-w-4xl text-4xl font-black leading-[0.95] tracking-tight text-emerald-950 md:text-7xl">Satın alma ekibinin tüm B2B işi tek ekranda.</h1>
              <p className="mt-4 max-w-2xl text-base font-medium text-emerald-950/70">
                Şirket hesabına özel katalog, fiyat, stok, hızlı sipariş, teklif talebi ve açık hesap takibi aynı portal deneyiminde birleşir.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {portalCapabilities.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-3xl border border-emerald-950/10 bg-white/65 p-4 shadow-sm backdrop-blur">
                    <Icon className="mb-3 h-5 w-5 text-emerald-800" />
                    <p className="font-black text-emerald-950">{item.title}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-emerald-950/60">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <Card className="w-full border-emerald-900/10 bg-white/85 shadow-2xl shadow-emerald-950/15 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-950"><Building2 className="h-5 w-5" /> Müşteri girişi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  sessionMutation.mutate({ selectedCompanyCode: companyCode, selectedBuyerEmail: buyerEmail });
                }}
              >
                <PagedLookupDialog<B2bCompanyDto>
                  open={companyLookupOpen}
                  onOpenChange={setCompanyLookupOpen}
                  value={companyLookupLabel}
                  placeholder="Müşteri hesabı seç"
                  searchPlaceholder="Şirket adı veya ERP cari kodu ara"
                  title="Müşteri Hesabı Seç"
                  description="Fiyat, stok, sepet ve hesap özeti için bağlı müşteri hesabını seçin."
                  emptyText="Müşteri hesabı bulunamadı."
                  queryKey={['b2b-public-portal-companies']}
                  fetchPage={({ pageNumber, pageSize, search }) => b2bApi.getPublicCompanies({ pageNumber, pageSize, search })}
                  getKey={(item) => String(item.id)}
                  getLabel={(item) => `${item.companyName} - ${item.companyCode}`}
                  onSelect={(item) => {
                    setCompanyCode(item.companyCode);
                    setCompanyLookupLabel(`${item.companyName} - ${item.companyCode}`);
                  }}
                />
                <Input
                  type="email"
                  value={buyerEmail}
                  onChange={(event) => setBuyerEmail(event.target.value)}
                  placeholder="Size tanımlanan kullanıcı e-postası"
                  autoComplete="email"
                  className="h-11 bg-white"
                />
                <Button type="submit" className="h-11 w-full bg-emerald-800 font-black hover:bg-emerald-700" disabled={!companyCode.trim() || !buyerEmail.trim() || sessionMutation.isPending}>
                  Müşteri Olarak Devam Et
                </Button>
              </form>
              {selectedCompany ? (
                <div className="space-y-3 rounded-3xl bg-emerald-950 px-4 py-4 text-sm font-semibold text-white">
                  <div>
                    <p className="text-xs text-emerald-100/70">Aktif şirket</p>
                    <p className="text-lg font-black">{selectedCompany.companyName}</p>
                    <p className="text-xs text-emerald-100/70">{selectedCompany.companyCode}</p>
                  </div>
                  {selectedBuyer ? (
                    <div className="rounded-2xl bg-white/10 p-3">
                      <p className="text-xs text-emerald-100/70">Portal kullanıcısı</p>
                      <p className="font-black">{selectedBuyer.fullName}</p>
                      <p className="text-xs text-emerald-100/70">{selectedBuyer.email}</p>
                      <p className="mt-1 text-xs text-emerald-100/80">
                        {portalSession?.canViewCompanyHistory ? 'Şirket genel geçmişini görebilir.' : 'Yalnızca kendi sepet, teklif, sipariş ve ödeme geçmişini görür.'}
                      </p>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="text-xs font-black text-emerald-100 underline"
                    onClick={() => {
                      setPortalSession(null);
                      setCart(null);
                      window.localStorage.removeItem(PORTAL_SESSION_STORAGE_KEY);
                      setMessage('Portal oturumu kapatıldı.');
                    }}
                  >
                    Oturumu kapat
                  </button>
                </div>
              ) : null}
            </CardContent>
          </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[1fr_390px]">
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Açık sipariş</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{portalQuery.data?.openOrderCount ?? 0}</p>
            </div>
            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Bekleyen teklif</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{portalQuery.data?.pendingQuoteCount ?? 0}</p>
            </div>
            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Bekleyen ödeme</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{portalQuery.data?.pendingPaymentCount ?? 0}</p>
            </div>
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-amber-700">Açık tutar</p>
              <p className="mt-2 text-2xl font-black text-amber-950">{formatMoney(portalQuery.data?.openOrderTotal, portalQuery.data?.currencyCode)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Ürün kataloğu</h2>
              <p className="text-sm font-medium text-slate-500">Müşteriye özel fiyat, satılabilir stok ve sepet işlemleri aynı akışta çalışır.</p>
            </div>
            <div className="relative w-full md:w-80">
              <PackageSearch className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input className="pl-9" placeholder="SKU, ürün adı, marka ara" value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {catalogQuery.isLoading ? (
              <Card className="border-dashed border-stone-300 bg-white/75 p-8 shadow-sm md:col-span-2 xl:col-span-3">
                <p className="text-xl font-black text-slate-900">Katalog yükleniyor...</p>
              </Card>
            ) : (catalogQuery.data?.data ?? []).length === 0 ? (
              <Card className="border-dashed border-stone-300 bg-white/75 p-8 shadow-sm md:col-span-2 xl:col-span-3">
                <p className="text-xl font-black text-slate-900">Yayınlanmış katalog ürünü bulunamadı.</p>
                <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">Admin panelinden ERP stok kartlarını katalog ürünü olarak yayınladığınızda burada görünecek.</p>
              </Card>
            ) : (catalogQuery.data?.data ?? []).map((product) => {
              const resolved = resolvedPrices[product.id];
              const quantity = quantities[product.id] || 1;
              const isCustomerSessionOpen = Boolean(selectedCompany);
              return (
                <Card key={product.id} className="group overflow-hidden border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
                  <div className="h-36 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_35%),linear-gradient(135deg,#102f25,#2f855a)] p-4 text-white">
                    <Badge className="bg-white/15 text-white">{product.brand || 'B2B katalog'}</Badge>
                    <h3 className="mt-4 line-clamp-2 text-xl font-black">{product.name}</h3>
                  </div>
                  <CardContent className="space-y-4 p-4">
                    <div>
                      <p className="font-mono text-xs font-bold text-emerald-700">{productSku(product)}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{product.categoryPath || product.description || 'Yayınlanmış katalog ürünü'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-2xl bg-stone-50 p-3">
                        <p className="text-xs font-bold text-slate-400">Fiyat</p>
                        <p className="font-black">{!isCustomerSessionOpen ? 'Giriş sonrası' : resolved?.isPriceResolved ? formatMoney(resolved.unitPrice, resolved.currencyCode) : 'Kontrol et'}</p>
                      </div>
                      <div className="rounded-2xl bg-stone-50 p-3">
                        <p className="text-xs font-bold text-slate-400">Satılabilir</p>
                        <p className="font-black">{!isCustomerSessionOpen ? 'Giriş sonrası' : resolved ? `${resolved.availableToSell}` : '-'}</p>
                      </div>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(event) => setQuantities((current) => ({ ...current, [product.id]: Number(event.target.value || 1) }))}
                    />
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="flex-1" disabled={!isCustomerSessionOpen} onClick={() => resolveMutation.mutate(product)}>
                        Fiyatı Kontrol Et
                      </Button>
                      <Button type="button" className="flex-1 bg-emerald-800 hover:bg-emerald-700" disabled={!isCustomerSessionOpen} onClick={() => addToCartMutation.mutate(product)}>
                        {isCustomerSessionOpen ? 'Sepete Ekle' : 'Müşteri Girişi Gerekli'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <aside className="space-y-5">
          <Card className="sticky top-4 border-stone-200 bg-white shadow-2xl shadow-slate-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Sepet ve işlem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedCompany ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950">
                  Ürünleri görebilirsiniz. Fiyat, satılabilir stok, sepet ve teklif işlemleri için müşteri girişi yapın.
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs font-bold text-emerald-700">Satır/Miktar</p>
                  <p className="text-2xl font-black text-emerald-950">{cartLineCount}</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4">
                  <p className="text-xs font-bold text-amber-700">Ara toplam</p>
                  <p className="text-2xl font-black text-amber-950">{formatMoney(cartTotal, cart?.currencyCode)}</p>
                </div>
              </div>
              <Textarea value={customerNote} onChange={(event) => setCustomerNote(event.target.value)} placeholder="Teklif/sipariş notu" />
              <div className="grid gap-2">
                <Button type="button" variant="outline" disabled={!cart?.lines.length} onClick={() => quoteMutation.mutate()}>
                  Teklif Talebi Oluştur
                </Button>
                <Button type="button" className="bg-slate-950 hover:bg-slate-800" disabled={!cart?.lines.length} onClick={() => orderMutation.mutate()}>
                  Siparişe Çevir <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              {portalQuery.data ? (
                <div className="rounded-2xl border border-stone-200 p-4 text-sm">
                  <p className="mb-3 flex items-center gap-2 font-black"><ClipboardList className="h-4 w-4" /> Son hareketler</p>
                  <div className="space-y-2 text-slate-600">
                    {(portalQuery.data.recentOrders ?? []).slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2">
                        <span className="font-semibold">{order.offerNo || order.orderNumber}</span>
                        <span>{formatMoney(order.grandTotal, order.currencyCode)}</span>
                      </div>
                    ))}
                    {(portalQuery.data.recentOrders ?? []).length === 0 ? <span>Henüz sipariş hareketi yok.</span> : null}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-stone-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Hızlı sipariş</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                className="min-h-32 font-mono"
                value={quickOrderText}
                onChange={(event) => setQuickOrderText(event.target.value)}
                placeholder={"SKU-001, 5, 1\nABC-002, 2, 1"}
              />
              <Button type="button" className="w-full bg-emerald-800 hover:bg-emerald-700" disabled={!selectedCompany} onClick={() => quickOrderMutation.mutate()}>
                Satırları Sepete Aktar
              </Button>
            </CardContent>
          </Card>

          {message ? (
            <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              {message}
            </div>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
