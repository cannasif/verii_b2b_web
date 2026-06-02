import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BarChart3, Building2, CalendarDays, CheckCircle2, ClipboardList, FileText, Heart, PackageSearch, Repeat2, ShieldCheck, ShoppingCart, Sparkles, Upload } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PagedLookupDialog } from '@/components/shared';
import { b2bApi } from '../api/b2b.api';
import type { B2bCompanyDto, B2bPortalSessionDto, B2bPriceAvailabilityDto, CartDto, CatalogProductDto, OrderDto, PaymentInstallmentOptionDto, PaymentMethodOptionDto, PaymentOrderDto } from '../types/b2b.types';

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
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
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
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrderDto | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOptionDto[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodOptionDto | null>(null);
  const [cardBin, setCardBin] = useState('');
  const [installmentOptions, setInstallmentOptions] = useState<PaymentInstallmentOptionDto[]>([]);
  const [selectedInstallment, setSelectedInstallment] = useState<PaymentInstallmentOptionDto | null>(null);
  const [checkoutForm, setCheckoutForm] = useState({
    email: '',
    fullName: '',
    phone: '',
    address: '',
    city: 'İstanbul',
    country: 'Türkiye',
    cardHolderName: '',
    cardNumber: '',
    expireMonth: '',
    expireYear: '',
    cvc: '',
  });

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
  const paymentLinkToken = searchParams.get('paymentLinkToken')?.trim() ?? '';

  const paymentLinkQuery = useQuery({
    queryKey: ['b2b-payment-link', paymentLinkToken],
    queryFn: () => b2bApi.getPaymentOrderByLinkToken(paymentLinkToken),
    enabled: paymentLinkToken.length > 0,
  });

  useEffect(() => {
    if (paymentLinkQuery.data) {
      setPaymentOrder(paymentLinkQuery.data);
      setMessage(`${paymentLinkQuery.data.paymentOrderNumber} ödeme emri linkten açıldı.`);
      void b2bApi.resolvePaymentMethodsByLinkToken(paymentLinkToken)
        .then((methods) => {
          const preferredMethod = methods.find((item) => item.isAvailable && item.providerKey === (paymentLinkQuery.data?.providerKey || 'PAYTR'))
            ?? methods.find((item) => item.isAvailable)
            ?? methods[0]
            ?? null;
          setPaymentMethods(methods);
          setSelectedPaymentMethod(preferredMethod);
        })
        .catch((error: Error) => setMessage(error.message));
    }
  }, [paymentLinkQuery.data, paymentLinkToken]);

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

  const favoritesQuery = useQuery({
    queryKey: ['b2b-public-catalog-favorites', selectedCompany?.id, selectedBuyer?.id, selectedBuyer?.userId, portalToken],
    queryFn: () => b2bApi.getPublicCatalogProductFavorites(
      selectedCompany!.id,
      portalToken,
      { pageNumber: 1, pageSize: 200 },
      selectedBuyer?.id,
      selectedBuyer?.userId,
    ),
    enabled: Boolean(selectedCompany?.id && portalToken),
  });

  const favoriteProductIds = useMemo(
    () => new Set((favoritesQuery.data?.data ?? []).map((item) => item.catalogProductId).filter((id): id is number => Boolean(id))),
    [favoritesQuery.data],
  );

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

  const favoriteMutation = useMutation({
    mutationFn: async (product: CatalogProductDto) => {
      if (!selectedCompany?.id || !portalToken) throw new Error('Favoriye eklemek için müşteri girişi yapın.');
      const isFavorite = favoriteProductIds.has(product.id);
      return b2bApi.togglePublicCatalogProductFavorite({
        companyId: selectedCompany.id,
        buyerId: selectedBuyer?.id,
        userId: selectedBuyer?.userId,
        catalogProductId: product.id,
        erpStockId: product.defaultStockId,
        sku: product.sku,
        isFavorite: !isFavorite,
      }, portalToken);
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['b2b-public-catalog-favorites'] });
      setMessage(result.isFavorite ? 'Ürün favorilere eklendi.' : 'Ürün favorilerden kaldırıldı.');
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

  const createPaymentOrderMutation = useMutation({
    mutationFn: async (order: OrderDto) => {
      const methods = await b2bApi.resolvePaymentMethods({
        customerId: order.customerId,
        companyId: selectedCompany?.id,
        customerGroupCode: selectedCompany?.customerGroupCode,
        amount: order.grandTotal,
        currencyCode: order.currencyCode || 'TRY',
      }, portalToken);
      const preferredMethod = methods.find((item) => item.isAvailable && item.providerKey === 'PAYTR' && item.paymentMethod === 'CARD') ?? methods.find((item) => item.isAvailable) ?? methods[0] ?? null;
      const createdPaymentOrder = await b2bApi.createPaymentOrder({
        orderId: order.id,
        installmentCount: 1,
        providerKey: preferredMethod?.providerKey,
        paymentMethod: preferredMethod?.paymentMethod,
        notes: customerNote,
      }, portalToken);
      return { methods, preferredMethod, paymentOrder: createdPaymentOrder };
    },
    onSuccess: ({ methods, preferredMethod, paymentOrder: createdPaymentOrder }) => {
      setPaymentMethods(methods);
      setSelectedPaymentMethod(preferredMethod);
      setPaymentOrder(createdPaymentOrder);
      setCardBin('');
      setInstallmentOptions([]);
      setSelectedInstallment(null);
      setMessage(`${createdPaymentOrder.paymentOrderNumber} ödeme emri hazırlandı. Kartın ilk 6/8 hanesiyle taksit seçebilirsiniz.`);
    },
    onError: (error) => setMessage((error as Error).message),
  });

  const installmentMutation = useMutation({
    mutationFn: async () => {
      if (!paymentOrder) throw new Error('Önce ödeme emri oluşmalı.');
      if (!selectedPaymentMethod?.isProviderHosted) throw new Error('Bu ödeme yöntemi kart taksiti gerektirmiyor.');
      const binNumber = cardBin.replace(/\D/g, '').slice(0, 8);
      if (binNumber.length < 6) throw new Error('Kartın ilk 6 veya 8 hanesini girin.');
      const payload = {
        providerKey: selectedPaymentMethod.providerKey,
        binNumber,
        amount: paymentOrder.remainingAmount || paymentOrder.amount,
        currencyCode: paymentOrder.currencyCode || 'TRY',
      };
      return paymentLinkToken
        ? b2bApi.getPaymentInstallmentOptionsByLinkToken(paymentLinkToken, payload)
        : b2bApi.getPaymentInstallmentOptions(payload, portalToken);
    },
    onSuccess: (data) => {
      const options = data.options.filter((item) => item.isAvailable);
      setInstallmentOptions(options);
      setSelectedInstallment(options[0] ?? null);
      setMessage(data.card?.bankName ? `${data.card.bankName} için taksit seçenekleri alındı.` : 'Taksit seçenekleri alındı.');
    },
    onError: (error) => setMessage((error as Error).message),
  });

  const selectInstallmentMutation = useMutation({
    mutationFn: async () => {
      if (!paymentOrder) throw new Error('Ödeme emri bulunamadı.');
      if (!selectedPaymentMethod) throw new Error('Ödeme yöntemi seçin.');
      if (!selectedInstallment) throw new Error('Taksit seçin.');
      const binNumber = cardBin.replace(/\D/g, '').slice(0, 8);
      const payload = {
        providerKey: selectedPaymentMethod.providerKey,
        binNumber,
        installmentNumber: selectedInstallment.installmentNumber,
        installmentPrice: selectedInstallment.installmentPrice,
        totalPrice: selectedInstallment.totalPrice,
        providerRate: selectedInstallment.providerRate,
        providerCommissionAmount: selectedInstallment.commissionAmount,
        providerInstallmentSnapshotJson: JSON.stringify(selectedInstallment),
      };
      return paymentLinkToken
        ? b2bApi.selectPaymentProviderInstallmentByLinkToken(paymentLinkToken, payload)
        : b2bApi.selectPaymentProviderInstallment(paymentOrder.id, payload, portalToken);
    },
    onSuccess: (updatedPaymentOrder) => {
      setPaymentOrder(updatedPaymentOrder);
      setMessage(`${updatedPaymentOrder.installmentCount} taksitli ödeme planı kaydedildi.`);
    },
    onError: (error) => setMessage((error as Error).message),
  });

  const paytrCheckoutMutation = useMutation({
    mutationFn: async () => {
      if (!paymentOrder) throw new Error('Ödeme emri bulunamadı.');
      if (!checkoutForm.email || !checkoutForm.fullName || !checkoutForm.phone || !checkoutForm.address) {
        throw new Error('PayTR için e-posta, ad soyad, telefon ve adres zorunlu.');
      }

      return b2bApi.createPaytrIframeToken({
        orderId: paymentOrder.orderId ?? 0,
        paymentOrderId: paymentOrder.id,
        paymentLinkToken: paymentLinkToken || undefined,
        email: checkoutForm.email,
        userName: checkoutForm.fullName,
        userAddress: checkoutForm.address,
        userPhone: checkoutForm.phone,
        okUrl: `${window.location.origin}/b2b-portal?paymentLinkToken=${encodeURIComponent(paymentLinkToken)}`,
        failUrl: `${window.location.origin}/b2b-portal?paymentLinkToken=${encodeURIComponent(paymentLinkToken)}`,
      }, portalToken);
    },
    onSuccess: (token) => {
      setMessage('PayTR ödeme ekranına yönlendiriliyorsunuz.');
      window.location.href = token.iframeUrl;
    },
    onError: (error) => setMessage((error as Error).message),
  });

  const iyzicoCheckoutMutation = useMutation({
    mutationFn: async () => {
      if (!paymentOrder) throw new Error('Ödeme emri bulunamadı.');
      if (!checkoutForm.email || !checkoutForm.fullName || !checkoutForm.phone || !checkoutForm.address || !checkoutForm.cardHolderName || !checkoutForm.cardNumber || !checkoutForm.expireMonth || !checkoutForm.expireYear || !checkoutForm.cvc) {
        throw new Error('iyzico 3DS için müşteri ve kart alanları zorunlu.');
      }

      const [buyerName, ...surnameParts] = checkoutForm.fullName.trim().split(/\s+/);
      return b2bApi.createIyzico3dsPayment({
        orderId: paymentOrder.orderId ?? 0,
        paymentOrderId: paymentOrder.id,
        paymentLinkToken: paymentLinkToken || undefined,
        email: checkoutForm.email,
        buyerName: buyerName || checkoutForm.fullName,
        buyerSurname: surnameParts.join(' ') || buyerName || 'B2B',
        buyerPhone: checkoutForm.phone,
        buyerAddress: checkoutForm.address,
        city: checkoutForm.city,
        country: checkoutForm.country,
        cardHolderName: checkoutForm.cardHolderName,
        cardNumber: checkoutForm.cardNumber,
        expireMonth: checkoutForm.expireMonth,
        expireYear: checkoutForm.expireYear,
        cvc: checkoutForm.cvc,
        installmentCount: selectedInstallment?.installmentNumber ?? paymentOrder.providerInstallmentNumber ?? paymentOrder.installmentCount ?? 1,
      }, portalToken);
    },
    onSuccess: (result) => {
      if (result.paymentPageUrl) {
        window.location.href = result.paymentPageUrl;
        return;
      }

      if (result.threeDSHtmlContent) {
        const popup = window.open('', '_blank');
        popup?.document.write(result.threeDSHtmlContent);
        popup?.document.close();
        setMessage('iyzico 3DS doğrulama ekranı açıldı.');
        return;
      }

      setMessage('iyzico 3DS başlatıldı.');
    },
    onError: (error) => setMessage((error as Error).message),
  });

  const activePaymentAmount = paymentOrder ? paymentOrder.remainingAmount || paymentOrder.amount : 0;
  const paymentDueDate = paymentOrder ? new Date(paymentOrder.dueDate) : null;
  const paymentDueDays = paymentDueDate ? Math.ceil((paymentDueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : null;
  const selectedPaymentWarnings = selectedPaymentMethod?.warnings ?? [];

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
    onSuccess: (order) => {
      setMessage(`${order.offerNo || order.orderNumber} numaralı sipariş oluşturuldu. Ödeme seçenekleri hazırlanıyor.`);
      createPaymentOrderMutation.mutate(order);
    },
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
                <p className="text-xs font-semibold text-emerald-900/60">Müşteri satın alma çalışma alanı</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="border-emerald-900/15 bg-white/70 text-emerald-950 hover:bg-white">
                <Link to="/auth/admin-login">Admin Girişi</Link>
              </Button>
              <Button asChild className="bg-emerald-900 text-white hover:bg-emerald-800">
                <Link to="/dashboard">Yönetim Paneli</Link>
              </Button>
            </div>
          </header>

          {paymentLinkQuery.data ? (
            <div className="mb-6 rounded-3xl border border-emerald-900/10 bg-white/80 p-5 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Ödeme emri</p>
                  <h2 className="mt-1 text-2xl font-black text-emerald-950">{paymentLinkQuery.data.paymentOrderNumber}</h2>
                  <p className="mt-1 text-sm font-semibold text-emerald-950/65">
                    Son ödeme: {new Date(paymentLinkQuery.data.dueDate).toLocaleDateString('tr-TR')} · Durum: {paymentLinkQuery.data.status}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-950 px-5 py-4 text-right text-white">
                  <p className="text-xs font-bold text-white/60">Kalan tutar</p>
                  <p className="text-2xl font-black">{formatMoney(paymentLinkQuery.data.remainingAmount || paymentLinkQuery.data.amount, paymentLinkQuery.data.currencyCode)}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[1fr_440px] lg:items-start">
            <div className="space-y-5">
              <Badge className="w-fit border-emerald-900/10 bg-emerald-800 text-white">Satın alma portalı</Badge>
              <div>
                <h1 className="max-w-4xl text-4xl font-black leading-[0.98] tracking-tight text-emerald-950 md:text-6xl">Katalogdan sepete, sepetten teklif veya siparişe.</h1>
                <p className="mt-4 max-w-2xl text-base font-semibold text-emerald-950/70">
                  Ürünü bulun, miktarı girin, sepete aktarın. Giriş yapan alıcı kendi fiyatını, satılabilir stoğu, geçmiş siparişlerini ve ödeme durumunu aynı ekranda görür.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-3xl border border-emerald-950/10 bg-white/70 p-4 shadow-sm backdrop-blur">
                  <PackageSearch className="mb-3 h-5 w-5 text-emerald-800" />
                  <p className="font-black text-emerald-950">1. Ürün ara</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-emerald-950/60">SKU, ürün adı, marka veya kategoriyle katalogdan bulun.</p>
                </div>
                <div className="rounded-3xl border border-emerald-950/10 bg-white/70 p-4 shadow-sm backdrop-blur">
                  <ShoppingCart className="mb-3 h-5 w-5 text-emerald-800" />
                  <p className="font-black text-emerald-950">2. Sepete ekle</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-emerald-950/60">Miktarı girin; fiyat ve satılabilir stok müşteri hesabına göre açılır.</p>
                </div>
                <div className="rounded-3xl border border-emerald-950/10 bg-white/70 p-4 shadow-sm backdrop-blur">
                  <FileText className="mb-3 h-5 w-5 text-emerald-800" />
                  <p className="font-black text-emerald-950">3. İşleme gönder</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-emerald-950/60">Sepeti teklif talebine veya sipariş onayına çevirin.</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                {portalCapabilities.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-2xl border border-emerald-950/10 bg-white/45 px-3 py-2 text-sm font-black text-emerald-950">
                      <Icon className="mr-2 inline h-4 w-4 text-emerald-800" />
                      {item.title}
                    </div>
                  );
                })}
              </div>
            </div>

            <Card className="w-full overflow-hidden border-emerald-900/10 bg-white/90 shadow-2xl shadow-emerald-950/15 backdrop-blur">
              <CardHeader className="border-b border-emerald-950/10 bg-emerald-950 text-white">
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Sepet ve müşteri girişi</span>
                  <Badge className="bg-white text-emerald-950 hover:bg-white">{cartLineCount} ürün</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                {!selectedCompany ? (
                  <form
                    className="space-y-3 rounded-3xl border border-stone-200 bg-stone-50 p-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      sessionMutation.mutate({ selectedCompanyCode: companyCode, selectedBuyerEmail: buyerEmail });
                    }}
                  >
                    <p className="flex items-center gap-2 text-sm font-black text-emerald-950"><Building2 className="h-4 w-4" /> Müşteri hesabıyla devam edin</p>
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
                ) : (
                  <div className="rounded-3xl border border-emerald-900/10 bg-emerald-50 p-4 text-sm font-semibold text-emerald-950">
                    <p className="text-xs text-emerald-900/60">Aktif hesap</p>
                    <p className="text-lg font-black">{selectedCompany.companyName}</p>
                    <p className="text-xs text-emerald-900/60">{selectedBuyer?.fullName || selectedCompany.companyCode}</p>
                    <button
                      type="button"
                      className="mt-3 text-xs font-black text-emerald-800 underline"
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
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-3xl bg-emerald-50 p-4">
                    <p className="text-xs font-bold text-emerald-700">Sepet miktarı</p>
                    <p className="text-3xl font-black text-emerald-950">{cartLineCount}</p>
                  </div>
                  <div className="rounded-3xl bg-amber-50 p-4">
                    <p className="text-xs font-bold text-amber-700">Ara toplam</p>
                    <p className="text-2xl font-black text-amber-950">{formatMoney(cartTotal, cart?.currencyCode)}</p>
                  </div>
                </div>
                <Textarea value={customerNote} onChange={(event) => setCustomerNote(event.target.value)} placeholder="Satın alma notu veya teklif açıklaması" />
                <div className="grid gap-2">
                  <Button type="button" variant="outline" disabled={!cart?.lines.length} onClick={() => quoteMutation.mutate()}>
                    Teklif Talebi Gönder
                  </Button>
                  <Button type="button" className="bg-slate-950 hover:bg-slate-800" disabled={!cart?.lines.length} onClick={() => orderMutation.mutate()}>
                    Siparişi Onaya Gönder <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                {paymentOrder && (
                  <div className="overflow-hidden rounded-[2rem] border border-emerald-950/10 bg-white shadow-2xl shadow-emerald-950/10">
                    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_15%_0%,rgba(255,255,255,0.35),transparent_34%),linear-gradient(135deg,#064e3b,#0f766e_62%,#134e4a)] p-5 text-white">
                      <div className="absolute right-[-3rem] top-[-4rem] h-36 w-36 rounded-full bg-white/15 blur-2xl" />
                      <div className="relative flex items-start justify-between gap-4">
                        <div>
                          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-100">
                            <ShieldCheck className="h-4 w-4" />
                            Güvenli ödeme linki
                          </p>
                          <h3 className="mt-3 text-3xl font-black tracking-tight">{formatMoney(activePaymentAmount, paymentOrder.currencyCode)}</h3>
                          <p className="mt-1 text-sm font-semibold text-white/70">
                            {paymentOrder.orderId ? `Sipariş #${paymentOrder.orderId}` : 'Cari tahsilat'} · {paymentOrder.paymentOrderNumber}
                          </p>
                        </div>
                        <Badge className="bg-white/15 text-white hover:bg-white/15">{paymentOrder.status}</Badge>
                      </div>
                      <div className="relative mt-5 grid gap-2 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white/12 p-3 backdrop-blur">
                          <p className="text-[10px] font-black uppercase tracking-wide text-white/55">Son ödeme</p>
                          <p className="mt-1 text-sm font-black">{paymentDueDate?.toLocaleDateString('tr-TR') ?? '-'}</p>
                        </div>
                        <div className="rounded-2xl bg-white/12 p-3 backdrop-blur">
                          <p className="text-[10px] font-black uppercase tracking-wide text-white/55">Vade</p>
                          <p className="mt-1 text-sm font-black">{paymentOrder.paymentTermDays ?? 0} gün</p>
                        </div>
                        <div className="rounded-2xl bg-white/12 p-3 backdrop-blur">
                          <p className="text-[10px] font-black uppercase tracking-wide text-white/55">Kalan süre</p>
                          <p className="mt-1 text-sm font-black">{paymentDueDays !== null ? paymentDueDays < 0 ? 'Vadesi geçti' : `${paymentDueDays} gün` : '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 p-4">
                      <div className="grid gap-2">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Ödeme yöntemi</p>
                        {paymentMethods.map((method) => {
                          const active = selectedPaymentMethod?.providerKey === method.providerKey && selectedPaymentMethod.paymentMethod === method.paymentMethod;
                          return (
                            <button
                              key={`${method.providerKey}-${method.paymentMethod}`}
                              type="button"
                              disabled={!method.isAvailable}
                              className={`group rounded-2xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${active ? 'border-emerald-700 bg-emerald-50 shadow-sm shadow-emerald-900/10' : 'border-stone-200 bg-stone-50 hover:border-emerald-300 hover:bg-white'}`}
                              onClick={() => {
                                if (!method.isAvailable) return;
                                setSelectedPaymentMethod(method);
                                setInstallmentOptions([]);
                                setSelectedInstallment(null);
                              }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-black text-slate-950">{method.displayName}</p>
                                  <p className="mt-1 text-xs font-semibold text-slate-500">
                                    {method.isProviderHosted ? 'Kart ve taksit seçenekleri sağlayıcı üzerinden tamamlanır.' : 'Finans onayı veya açık hesap akışı için uygundur.'}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  {active ? <CheckCircle2 className="h-5 w-5 text-emerald-700" /> : null}
                                  <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500">Risk: {method.riskLevel}</span>
                                </div>
                              </div>
                              {method.requiresApproval ? <p className="mt-2 text-xs font-bold text-amber-700">Finans onayı gerektirir.</p> : null}
                              {method.unavailableReason ? <p className="mt-2 text-xs font-bold text-rose-700">{method.unavailableReason}</p> : null}
                              {method.warnings?.length ? <p className="mt-2 text-xs font-bold text-amber-700">{method.warnings[0]}</p> : null}
                            </button>
                          );
                        })}
                      </div>

                      {paymentOrder.installments.length > 0 ? (
                        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                              <CalendarDays className="h-4 w-4" />
                              Vade planı
                            </p>
                            <Badge variant="secondary">{paymentOrder.installmentCount || 1} taksit</Badge>
                          </div>
                          <div className="space-y-2">
                            {paymentOrder.installments.slice(0, 3).map((installment) => (
                              <div key={installment.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600">
                                <span>{installment.installmentNumber}. vade · {new Date(installment.dueDate).toLocaleDateString('tr-TR')}</span>
                                <span>{formatMoney(installment.amount - installment.paidAmount, paymentOrder.currencyCode)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {selectedPaymentMethod?.isProviderHosted && (
                        <div className="space-y-3 rounded-2xl border border-emerald-900/10 bg-emerald-50/70 p-3">
                          <div className="flex gap-2">
                            <Input
                              value={cardBin}
                              onChange={(event) => setCardBin(event.target.value.replace(/\D/g, '').slice(0, 8))}
                              placeholder="Kart ilk 6/8 hane"
                              inputMode="numeric"
                              className="bg-white"
                            />
                            <Button type="button" variant="outline" onClick={() => installmentMutation.mutate()} disabled={installmentMutation.isPending || !paymentOrder}>
                              Taksit Bul
                            </Button>
                          </div>
                          {installmentOptions.length > 0 && (
                            <div className="grid gap-2">
                              {installmentOptions.map((option) => {
                                const active = selectedInstallment?.installmentNumber === option.installmentNumber;
                                return (
                                  <button
                                    key={option.installmentNumber}
                                    type="button"
                                    className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-sm font-black ${active ? 'border-emerald-700 bg-white text-emerald-950' : 'border-white bg-white/60 text-slate-600'}`}
                                    onClick={() => setSelectedInstallment(option)}
                                  >
                                    <span>{option.installmentNumber === 1 ? 'Tek çekim' : `${option.installmentNumber} taksit`}</span>
                                    <span>{formatMoney(option.totalPrice, paymentOrder.currencyCode)}</span>
                                  </button>
                                );
                              })}
                              <Button type="button" className="bg-emerald-800 hover:bg-emerald-700" disabled={!selectedInstallment || selectInstallmentMutation.isPending} onClick={() => selectInstallmentMutation.mutate()}>
                                Taksit Planını Kaydet
                              </Button>
                            </div>
                          )}

                          <div className="grid gap-2 rounded-2xl bg-white p-3">
                            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Ödeme bilgileri</p>
                            <div className="grid gap-2 md:grid-cols-2">
                              <Input placeholder="E-posta" value={checkoutForm.email} onChange={(event) => setCheckoutForm((current) => ({ ...current, email: event.target.value }))} />
                              <Input placeholder="Ad Soyad" value={checkoutForm.fullName} onChange={(event) => setCheckoutForm((current) => ({ ...current, fullName: event.target.value }))} />
                              <Input placeholder="Telefon" value={checkoutForm.phone} onChange={(event) => setCheckoutForm((current) => ({ ...current, phone: event.target.value }))} />
                              <Input placeholder="Şehir" value={checkoutForm.city} onChange={(event) => setCheckoutForm((current) => ({ ...current, city: event.target.value }))} />
                            </div>
                            <Input placeholder="Adres" value={checkoutForm.address} onChange={(event) => setCheckoutForm((current) => ({ ...current, address: event.target.value }))} />
                            {selectedPaymentMethod.providerKey === 'IYZICO' ? (
                              <div className="grid gap-2 md:grid-cols-2">
                                <Input placeholder="Kart üzerindeki ad" value={checkoutForm.cardHolderName} onChange={(event) => setCheckoutForm((current) => ({ ...current, cardHolderName: event.target.value }))} />
                                <Input placeholder="Kart numarası" inputMode="numeric" value={checkoutForm.cardNumber} onChange={(event) => setCheckoutForm((current) => ({ ...current, cardNumber: event.target.value.replace(/\D/g, '').slice(0, 19) }))} />
                                <Input placeholder="Ay" inputMode="numeric" value={checkoutForm.expireMonth} onChange={(event) => setCheckoutForm((current) => ({ ...current, expireMonth: event.target.value.replace(/\D/g, '').slice(0, 2) }))} />
                                <Input placeholder="Yıl" inputMode="numeric" value={checkoutForm.expireYear} onChange={(event) => setCheckoutForm((current) => ({ ...current, expireYear: event.target.value.replace(/\D/g, '').slice(0, 4) }))} />
                                <Input placeholder="CVC" inputMode="numeric" value={checkoutForm.cvc} onChange={(event) => setCheckoutForm((current) => ({ ...current, cvc: event.target.value.replace(/\D/g, '').slice(0, 4) }))} />
                              </div>
                            ) : null}
                            {selectedPaymentWarnings.length > 0 ? <p className="text-xs font-bold text-amber-700">{selectedPaymentWarnings[0]}</p> : null}
                            <Button
                              type="button"
                              className="h-12 bg-emerald-900 text-base font-black hover:bg-emerald-800"
                              disabled={paytrCheckoutMutation.isPending || iyzicoCheckoutMutation.isPending || !paymentOrder}
                              onClick={() => selectedPaymentMethod.providerKey === 'IYZICO' ? iyzicoCheckoutMutation.mutate() : paytrCheckoutMutation.mutate()}
                            >
                              {selectedPaymentMethod.providerKey === 'IYZICO' ? 'iyzico 3DS ile Öde' : 'PayTR ile Güvenli Öde'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
              <h2 className="text-2xl font-black text-slate-950">Ürün seç ve sepete ekle</h2>
              <p className="text-sm font-medium text-slate-500">Katalogdan ürün bulun, miktarı girin, müşteri girişinden sonra fiyat/stok kontrolüyle sepete aktarın.</p>
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
              <Card className="overflow-hidden border-stone-200 bg-white shadow-xl shadow-slate-900/10 md:col-span-2 xl:col-span-3">
                <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
                  <div className="p-8">
                    <Badge className="mb-4 bg-emerald-900 text-white">Katalog hazırlanıyor</Badge>
                    <p className="text-2xl font-black tracking-tight text-slate-950">Yayınlanmış B2B katalog ürünü bulunamadı.</p>
                    <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                      ERP stok kartları katalog ürününe bağlanıp yayına alındığında müşteriler burada ürünleri görür; giriş yapan alıcılar kendi cari fiyatını, satılabilir stoku ve sepet aksiyonlarını kullanır.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button asChild className="bg-emerald-900 hover:bg-emerald-800">
                        <Link to="/b2b/catalog">Katalog Yönetimine Git</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link to="/b2b/product-matches">ERP Stok Eşleştirme</Link>
                      </Button>
                    </div>
                  </div>
                  <div className="border-t border-stone-200 bg-stone-50 p-6 lg:border-l lg:border-t-0">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Yayın akışı</p>
                    <div className="mt-4 space-y-3 text-sm font-semibold text-slate-700">
                      <div className="rounded-2xl bg-white p-3 shadow-sm">1. ERP stok kartını seç</div>
                      <div className="rounded-2xl bg-white p-3 shadow-sm">2. Katalog adı, marka, görsel ve kategori bağla</div>
                      <div className="rounded-2xl bg-white p-3 shadow-sm">3. Yayına al, müşteri fiyatı otomatik çözülsün</div>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (catalogQuery.data?.data ?? []).map((product) => {
              const resolved = resolvedPrices[product.id];
              const quantity = quantities[product.id] || 1;
              const isCustomerSessionOpen = Boolean(selectedCompany);
              const isFavorite = favoriteProductIds.has(product.id);
              return (
                <Card key={product.id} className="group overflow-hidden border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
                  <div className="relative h-36 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_35%),linear-gradient(135deg,#102f25,#2f855a)] p-4 text-white">
                    <div className="flex flex-wrap gap-2 pr-12">
                      <Badge className="bg-white/15 text-white">{product.brand || 'Katalog'}</Badge>
                      {product.productType ? <Badge className="bg-cyan-300/20 text-cyan-50">{product.productType}</Badge> : null}
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute right-3 top-3 h-10 w-10 rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25 hover:text-white disabled:opacity-50"
                      disabled={!isCustomerSessionOpen || favoriteMutation.isPending}
                      onClick={() => favoriteMutation.mutate(product)}
                      title={isFavorite ? 'Favorilerden kaldır' : 'Favorilere ekle'}
                    >
                      <Heart className={`h-5 w-5 ${isFavorite ? 'fill-rose-400 text-rose-400' : ''}`} />
                    </Button>
                    <h3 className="mt-4 line-clamp-2 text-xl font-black">{product.name}</h3>
                  </div>
                  <CardContent className="space-y-4 p-4">
                    <div>
                      <p className="font-mono text-xs font-bold text-emerald-700">{productSku(product)}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{product.shortDescription || product.categoryPath || product.description || 'Yayınlanmış katalog ürünü'}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
                        {product.categoryPath ? <span className="rounded-full bg-stone-100 px-2 py-1">{product.categoryPath}</span> : null}
                        {product.manufacturerCode ? <span className="rounded-full bg-stone-100 px-2 py-1">Üretici: {product.manufacturerCode}</span> : null}
                        {product.unit ? <span className="rounded-full bg-stone-100 px-2 py-1">Birim: {product.unit}</span> : null}
                      </div>
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
              <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Sepet detayları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedCompany ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950">
                  Ürünleri inceleyebilirsiniz. Sepete eklemek, fiyat görmek ve siparişe çevirmek için müşteri hesabıyla giriş yapın.
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
              <div className="space-y-2">
                {(cart?.lines ?? []).slice(0, 6).map((line) => (
                  <div key={line.id} className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm">
                    <div>
                      <p className="font-black text-slate-950">Stok #{line.erpStockId || line.catalogProductId}</p>
                      <p className="text-xs font-semibold text-slate-500">{line.quantity} adet x {formatMoney(line.unitPrice, line.currencyCode)}</p>
                    </div>
                    <p className="font-black text-slate-950">{formatMoney(line.quantity * line.unitPrice, line.currencyCode)}</p>
                  </div>
                ))}
                {(cart?.lines ?? []).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 text-center text-sm font-semibold text-slate-500">
                    Sepet boş. Katalogdan ürün seçip “Sepete Ekle” ile başlayın.
                  </div>
                ) : null}
              </div>
              <Textarea value={customerNote} onChange={(event) => setCustomerNote(event.target.value)} placeholder="Satın alma notu, teslimat isteği veya teklif açıklaması" />
              <div className="grid gap-2">
                <Button type="button" variant="outline" disabled={!cart?.lines.length} onClick={() => quoteMutation.mutate()}>
                  Teklif Talebi Gönder
                </Button>
                <Button type="button" className="bg-slate-950 hover:bg-slate-800" disabled={!cart?.lines.length} onClick={() => orderMutation.mutate()}>
                  Siparişi Onaya Gönder <ArrowRight className="ml-2 h-4 w-4" />
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
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Toplu hızlı sipariş</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm font-semibold text-slate-500">Müşteri stok kodu veya SKU, miktar ve depo kodunu satır satır yapıştırın.</p>
              <Textarea
                className="min-h-32 font-mono"
                value={quickOrderText}
                onChange={(event) => setQuickOrderText(event.target.value)}
                placeholder={"STOK-KODU, 5, 1\nMUSTERI-SKU, 2, 1"}
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
