import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, CheckCircle2, Clock3, FileText, GitBranchPlus, Plus, RefreshCw, ShoppingCart, Trash2, TriangleAlert } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { DetailPageShell, FormPageShell, PagedDataGrid, PagedLookupDialog, type PagedDataGridColumn } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { getPagedRange } from '@/lib/paged';
import { useUIStore } from '@/stores/ui-store';
import { lookupApi } from '@/services/lookup-api';
import type { CustomerLookup, StockLookup, WarehouseLookup } from '@/services/lookup-types';
import { useCurrencyOptions } from '@/services/hooks/useCurrencyOptions';
import type { UserDto } from '@/features/auth/types/auth';
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

type WorkspaceRow =
  | B2bCompanyDto
  | B2bBuyerDto
  | CatalogProductDto
  | CustomerProductAliasDto
  | CatalogVisibilityRuleDto
  | CustomerPriceListDto
  | InventorySnapshotDto
  | ShoppingListDto
  | PurchaseApprovalRuleDto
  | QuoteRequestDto
  | OrderDto
  | PaymentTransactionDto
  | B2bIntegrationEventDto;

type WorkspaceColumnKey = 'primary' | 'secondary' | 'scope' | 'status' | 'amount' | 'date';
type B2bLookupKind = 'company' | 'buyer' | 'customer' | 'user' | 'stock' | 'catalogProduct' | 'warehouse' | 'order';

interface WorkspaceTableConfig {
  pageKey: string;
  defaultSortBy: WorkspaceColumnKey;
  mapSortBy: (columnKey: WorkspaceColumnKey) => string;
  columns: PagedDataGridColumn<WorkspaceColumnKey>[];
  filterColumns: readonly FilterColumnConfig[];
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
    description: 'ERP stok kartını seçin, müşteri portalında görünecek ürün bilgisini sadeleştirip yayınlayın.',
    breadcrumb: 'Katalog',
    emptyState: 'Henüz katalog ürünü yok. ERP stok kartı seçerek ilk ürünü yayınlayın.',
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
    title: 'Talep ve Teklifler',
    description: 'Müşteri talebinden teklif onayına, revizyondan sepete dönüşüme kadar B2B ticari süreci yönetin.',
    breadcrumb: 'Talep / Teklif',
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
    emptyState: 'Henüz ödeme işlem kaydı yok.',
  },
  integrations: {
    title: 'ERP Entegrasyon Kuyruğu',
    description: 'Sipariş, teklif ve ödeme gibi kritik olayların ERP’ye aktarım durumunu izleyin.',
    breadcrumb: 'Entegrasyon',
    emptyState: 'Henüz entegrasyon olayı yok.',
  },
};

const routeSlugByKind: Record<B2bWorkspaceKind, string> = {
  insights: 'insights',
  companies: 'companies',
  buyers: 'buyers',
  catalog: 'catalog',
  matches: 'product-matches',
  visibility: 'catalog-visibility',
  pricing: 'pricing',
  inventory: 'inventory',
  'shopping-lists': 'shopping-lists',
  'approval-rules': 'approval-rules',
  quotes: 'quotes',
  orders: 'orders',
  payments: 'payments',
  integrations: 'integrations',
};

const kindByRouteSlug = Object.fromEntries(
  Object.entries(routeSlugByKind).map(([kind, slug]) => [slug, kind]),
) as Record<string, B2bWorkspaceKind>;

const editSupportedKinds = new Set<B2bWorkspaceKind>(['catalog']);

type B2bFormField = {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'textarea' | 'switch' | 'date' | 'lookup' | 'currency' | 'select';
  lookupKind?: B2bLookupKind;
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  hidden?: boolean;
  colSpan?: 'full';
};

type B2bFormConfig = {
  fields: B2bFormField[];
  defaults: Record<string, string | boolean>;
  submit: (payload: Record<string, unknown>, id?: number) => Promise<unknown>;
  mapInitial?: (item: CatalogProductDto) => Record<string, string | boolean>;
  transform?: (values: Record<string, string | boolean>) => Record<string, unknown>;
};

type QuoteLineFormState = {
  clientId: string;
  requestedSku: string;
  requestedName: string;
  erpStockId: string;
  erpStockLabel: string;
  catalogProductId: string;
  catalogProductLabel: string;
  quantity: string;
  targetUnitPrice: string;
  discountRate1: string;
  discountAmount1: string;
  vatRate: string;
  description: string;
};

function createEmptyQuoteLine(): QuoteLineFormState {
  return {
    clientId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    requestedSku: '',
    requestedName: '',
    erpStockId: '',
    erpStockLabel: '',
    catalogProductId: '',
    catalogProductLabel: '',
    quantity: '1',
    targetUnitPrice: '',
    discountRate1: '0',
    discountAmount1: '0',
    vatRate: '20',
    description: '',
  };
}

function toOptionalNumber(value: string | boolean): number | undefined {
  if (typeof value === 'boolean' || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toRequiredNumber(value: string | boolean): number {
  return toOptionalNumber(value) ?? 0;
}

function trimOptional(value: string | boolean): string | undefined {
  if (typeof value === 'boolean') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function slugify(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function baseTransform(values: Record<string, string | boolean>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      if (typeof value === 'boolean') return [key, value];
      const trimmed = value.trim();
      return [key, trimmed.length > 0 ? trimmed : undefined];
    }),
  );
}

function buildQuotePayload(values: Record<string, string | boolean>, quoteLines: QuoteLineFormState[]): Record<string, unknown> {
  const lines = quoteLines
    .map((line) => ({
      requestedSku: trimOptional(line.requestedSku),
      requestedName: trimOptional(line.requestedName),
      erpStockId: toOptionalNumber(line.erpStockId),
      catalogProductId: toOptionalNumber(line.catalogProductId),
      quantity: toRequiredNumber(line.quantity),
      targetUnitPrice: toOptionalNumber(line.targetUnitPrice),
      discountRate1: toOptionalNumber(line.discountRate1) ?? 0,
      discountAmount1: toOptionalNumber(line.discountAmount1) ?? 0,
      discountRate2: 0,
      discountAmount2: 0,
      discountRate3: 0,
      discountAmount3: 0,
      vatRate: toOptionalNumber(line.vatRate) ?? 20,
      description: trimOptional(line.description),
      erpProjectCode: trimOptional(values.erpProjectCode),
    }))
    .filter((line) => line.quantity > 0 && (line.erpStockId || line.catalogProductId || line.requestedSku || line.requestedName));

  if (lines.length === 0) {
    throw new Error('En az bir teklif/talep kalemi ekleyin.');
  }

  return {
    customerId: toRequiredNumber(values.customerId),
    userId: toOptionalNumber(values.userId),
    currencyCode: trimOptional(values.currencyCode) ?? 'TRY',
    offerType: trimOptional(values.offerType),
    offerDate: trimOptional(values.offerDate),
    offerNo: trimOptional(values.offerNo),
    revisionNo: trimOptional(values.revisionNo),
    validUntil: trimOptional(values.validUntil),
    deliveryDate: trimOptional(values.deliveryDate),
    deliveryMethod: trimOptional(values.deliveryMethod),
    erpProjectCode: trimOptional(values.erpProjectCode),
    generalDiscountRate: toOptionalNumber(values.generalDiscountRate),
    generalDiscountAmount: toOptionalNumber(values.generalDiscountAmount),
    customerNote: trimOptional(values.customerNote),
    lines,
  };
}

const b2bFormConfigs: Partial<Record<B2bWorkspaceKind, B2bFormConfig>> = {
  companies: {
    defaults: { companyCode: '', companyName: '', customerId: '', parentCompanyId: '', customerGroupCode: '', creditLimit: '', currencyCode: 'TRY' },
    fields: [
      { name: 'customerId', label: 'ERP Cari / Şirket', type: 'lookup', lookupKind: 'customer', required: true },
      { name: 'parentCompanyId', label: 'Üst Şirket', type: 'lookup', lookupKind: 'company' },
      { name: 'customerGroupCode', label: 'Cari Grup Kodu' },
      { name: 'creditLimit', label: 'Kredi Limiti', type: 'number' },
      { name: 'currencyCode', label: 'Para Birimi', type: 'currency', required: true },
    ],
    transform: (values) => ({ ...baseTransform(values), customerId: toOptionalNumber(values.customerId), parentCompanyId: toOptionalNumber(values.parentCompanyId), creditLimit: toOptionalNumber(values.creditLimit) }),
    submit: b2bApi.createCompany,
  },
  buyers: {
    defaults: { companyId: '', userId: '', email: '', fullName: '', roleCode: 'Buyer', orderLimit: '', requiresApproval: false },
    fields: [
      { name: 'companyId', label: 'Şirket', type: 'lookup', lookupKind: 'company', required: true },
      { name: 'userId', label: 'Portal Kullanıcısı', type: 'lookup', lookupKind: 'user', required: true, helpText: 'Kullanıcı seçildiğinde e-posta ve ad soyad otomatik alınır; müşteri ID girilmez.' },
      { name: 'email', label: 'E-posta', required: true, helpText: 'Kullanıcıdan otomatik gelir, gerekirse düzeltilebilir.' },
      { name: 'fullName', label: 'Ad Soyad', required: true, helpText: 'Kullanıcıdan otomatik gelir, gerekirse düzeltilebilir.' },
      { name: 'roleCode', label: 'B2B Rolü', type: 'select', required: true, options: [
        { label: 'Buyer - kendi kayıtları', value: 'Buyer' },
        { label: 'Approver - onaycı', value: 'Approver' },
        { label: 'Manager - şirket geneli', value: 'Manager' },
        { label: 'Company Admin - şirket yöneticisi', value: 'CompanyAdmin' },
      ] },
      { name: 'orderLimit', label: 'Sipariş Limiti', type: 'number' },
      { name: 'requiresApproval', label: 'Onay Gerekli', type: 'switch' },
    ],
    transform: (values) => ({ ...baseTransform(values), companyId: toRequiredNumber(values.companyId), userId: toOptionalNumber(values.userId), orderLimit: toOptionalNumber(values.orderLimit) }),
    submit: b2bApi.createBuyer,
  },
  catalog: {
    defaults: {
      sku: '',
      name: '',
      slug: '',
      brand: '',
      productType: '',
      manufacturerCode: '',
      barcode: '',
      unit: '',
      categoryPath: '',
      shortDescription: '',
      description: '',
      primaryImageUrl: '',
      bulletPointsJson: '',
      attributesJson: '',
      mediaGalleryJson: '',
      documentsJson: '',
      metaTitle: '',
      metaDescription: '',
      searchKeywords: '',
      minOrderQuantity: '',
      packageQuantity: '',
      sortOrder: '',
      defaultStockId: '',
      isPublished: false,
    },
    fields: [
      { name: 'defaultStockId', label: 'ERP stok kartı', type: 'lookup', lookupKind: 'stock', required: true, colSpan: 'full', helpText: 'Ürünü buradan seçin; kod, ad, marka ve kategori bilgisi otomatik gelir.' },
      { name: 'sku', label: 'ERP Stok Kodu', hidden: true },
      { name: 'slug', label: 'Portal Adresi', hidden: true },
      { name: 'name', label: 'Müşteriye Görünecek Ürün Adı', required: true, placeholder: 'Örn. 40x60 Alüminyum Profil' },
      { name: 'brand', label: 'Marka', placeholder: 'ERP stoktan otomatik gelir, gerekirse düzeltin.' },
      { name: 'productType', label: 'Ürün Tipi', placeholder: 'Örn. Alüminyum profil, bağlantı elemanı, yedek parça' },
      { name: 'manufacturerCode', label: 'Üretici Kodu', placeholder: 'Üretici / OEM / tedarikçi ürün kodu' },
      { name: 'barcode', label: 'Barkod / GTIN', placeholder: 'EAN, UPC veya şirket içi barkod' },
      { name: 'unit', label: 'Satış Birimi', placeholder: 'Adet, mt, kg, koli' },
      { name: 'categoryPath', label: 'Portal Kategorisi', placeholder: 'Örn. Profil / Alüminyum / Aksesuar', colSpan: 'full' },
      { name: 'shortDescription', label: 'Kısa Tanıtım', type: 'textarea', placeholder: 'Liste ve ürün kartında görünecek net satış özeti.', colSpan: 'full' },
      { name: 'primaryImageUrl', label: 'Ana Görsel Bağlantısı', placeholder: 'https://...', colSpan: 'full', helpText: 'Boş bırakabilirsiniz; ürün yine taslak/yayında kaydedilir.' },
      { name: 'mediaGalleryJson', label: 'Medya Galerisi JSON', type: 'textarea', placeholder: '[{\"url\":\"https://...\",\"alt\":\"Ön görünüm\"}]', colSpan: 'full', helpText: 'Amazon/Sahibinden tarzı çoklu ürün görselleri için kullanılır.' },
      { name: 'bulletPointsJson', label: 'Öne Çıkan Maddeler JSON', type: 'textarea', placeholder: '[\"Hızlı montaj\", \"Korozyona dayanıklı\", \"ERP stokla eşleşir\"]', colSpan: 'full' },
      { name: 'attributesJson', label: 'Teknik Özellikler JSON', type: 'textarea', placeholder: '{\"Malzeme\":\"Alüminyum\", \"Ölçü\":\"40x60\", \"Renk\":\"Eloksal\"}', colSpan: 'full', helpText: 'Filtreleme ve ürün karşılaştırma için yapılandırılmış teknik özellikler.' },
      { name: 'documentsJson', label: 'Teknik Dokümanlar JSON', type: 'textarea', placeholder: '[{\"name\":\"Teknik föy\", \"url\":\"https://...\"}]', colSpan: 'full' },
      { name: 'description', label: 'Detaylı Açıklama', type: 'textarea', placeholder: 'Kullanım alanı, teknik notlar, uyumluluk ve satış açıklaması yazın.', colSpan: 'full' },
      { name: 'minOrderQuantity', label: 'Minimum Sipariş Miktarı', type: 'number' },
      { name: 'packageQuantity', label: 'Paket / Koli Miktarı', type: 'number' },
      { name: 'sortOrder', label: 'Sıralama Önceliği', type: 'number' },
      { name: 'metaTitle', label: 'SEO Başlık', placeholder: 'Portal ve arama sonucu başlığı' },
      { name: 'metaDescription', label: 'SEO Açıklama', placeholder: 'Kısa arama açıklaması', colSpan: 'full' },
      { name: 'searchKeywords', label: 'Arama Anahtar Kelimeleri', placeholder: 'muadil kodlar, müşteri kodları, yaygın aramalar', colSpan: 'full' },
      { name: 'isPublished', label: 'Müşteri portalında yayınla', type: 'switch', helpText: 'Kapalı kalırsa ürün taslak olarak kaydedilir, müşteriler görmez.' },
    ],
    mapInitial: (item) => ({
      sku: item.sku,
      name: item.name,
      slug: item.slug ?? '',
      brand: item.brand ?? '',
      productType: item.productType ?? '',
      manufacturerCode: item.manufacturerCode ?? '',
      barcode: item.barcode ?? '',
      unit: item.unit ?? '',
      categoryPath: item.categoryPath ?? '',
      shortDescription: item.shortDescription ?? '',
      description: item.description ?? '',
      primaryImageUrl: item.primaryImageUrl ?? '',
      bulletPointsJson: item.bulletPointsJson ?? '',
      attributesJson: item.attributesJson ?? '',
      mediaGalleryJson: item.mediaGalleryJson ?? '',
      documentsJson: item.documentsJson ?? '',
      metaTitle: item.metaTitle ?? '',
      metaDescription: item.metaDescription ?? '',
      searchKeywords: item.searchKeywords ?? '',
      minOrderQuantity: item.minOrderQuantity ? String(item.minOrderQuantity) : '',
      packageQuantity: item.packageQuantity ? String(item.packageQuantity) : '',
      sortOrder: typeof item.sortOrder === 'number' ? String(item.sortOrder) : '',
      defaultStockId: item.defaultStockId ? String(item.defaultStockId) : '',
      isPublished: item.isPublished,
    }),
    transform: (values) => {
      const payload = baseTransform(values);
      const name = trimOptional(values.name) ?? trimOptional(values.sku) ?? '';
      return {
        ...payload,
        sku: trimOptional(values.sku),
        slug: trimOptional(values.slug) ?? slugify(name),
        defaultStockId: toOptionalNumber(values.defaultStockId),
        minOrderQuantity: toOptionalNumber(values.minOrderQuantity),
        packageQuantity: toOptionalNumber(values.packageQuantity),
        sortOrder: toOptionalNumber(values.sortOrder) ?? 0,
      };
    },
    submit: (payload, id) => id ? b2bApi.updateCatalogProduct(id, payload) : b2bApi.createCatalogProduct(payload),
  },
  matches: {
    defaults: { customerId: '', erpStockId: '', catalogProductId: '', customerSku: '', customerProductName: '', matchStatus: 'Pending', confidenceScore: '', notes: '' },
    fields: [
      { name: 'customerId', label: 'Cari', type: 'lookup', lookupKind: 'customer', required: true },
      { name: 'customerSku', label: 'Müşteri SKU', required: true },
      { name: 'customerProductName', label: 'Müşteri Ürün Adı' },
      { name: 'erpStockId', label: 'ERP Stok', type: 'lookup', lookupKind: 'stock' },
      { name: 'catalogProductId', label: 'Katalog Ürün', type: 'lookup', lookupKind: 'catalogProduct' },
      { name: 'matchStatus', label: 'Eşleşme Durumu', required: true },
      { name: 'confidenceScore', label: 'Güven Skoru', type: 'number' },
      { name: 'notes', label: 'Not', type: 'textarea', colSpan: 'full' },
    ],
    transform: (values) => ({ ...baseTransform(values), customerId: toRequiredNumber(values.customerId), erpStockId: toOptionalNumber(values.erpStockId), catalogProductId: toOptionalNumber(values.catalogProductId), confidenceScore: toOptionalNumber(values.confidenceScore) }),
    submit: b2bApi.createProductMatch,
  },
  visibility: {
    defaults: { companyId: '', customerId: '', customerGroupCode: '', catalogProductId: '', categoryPath: '', ruleType: 'Include' },
    fields: [
      { name: 'companyId', label: 'Şirket', type: 'lookup', lookupKind: 'company' },
      { name: 'customerId', label: 'Cari', type: 'lookup', lookupKind: 'customer' },
      { name: 'customerGroupCode', label: 'Cari Grup Kodu' },
      { name: 'catalogProductId', label: 'Katalog Ürün', type: 'lookup', lookupKind: 'catalogProduct' },
      { name: 'categoryPath', label: 'Kategori Yolu' },
      { name: 'ruleType', label: 'Kural Tipi', required: true },
    ],
    transform: (values) => ({ ...baseTransform(values), companyId: toOptionalNumber(values.companyId), customerId: toOptionalNumber(values.customerId), catalogProductId: toOptionalNumber(values.catalogProductId) }),
    submit: b2bApi.createVisibilityRule,
  },
  pricing: {
    defaults: { code: '', name: '', customerId: '', customerGroupCode: '', currencyCode: 'TRY', validFrom: '', validTo: '', isActive: true },
    fields: [
      { name: 'code', label: 'Fiyat Liste Kodu', required: true },
      { name: 'name', label: 'Fiyat Liste Adı', required: true },
      { name: 'customerId', label: 'Cari', type: 'lookup', lookupKind: 'customer' },
      { name: 'customerGroupCode', label: 'Cari Grup Kodu' },
      { name: 'currencyCode', label: 'Para Birimi', type: 'currency', required: true },
      { name: 'validFrom', label: 'Geçerlilik Başlangıcı', type: 'date' },
      { name: 'validTo', label: 'Geçerlilik Bitişi', type: 'date' },
      { name: 'isActive', label: 'Aktif', type: 'switch' },
    ],
    transform: (values) => ({ ...baseTransform(values), customerId: toOptionalNumber(values.customerId), validFrom: trimOptional(values.validFrom), validTo: trimOptional(values.validTo) }),
    submit: b2bApi.createPriceList,
  },
  inventory: {
    defaults: { catalogProductId: '', catalogVariantId: '', erpStockId: '', erpStockCode: '', warehouseCode: '', warehouseName: '', availableQuantity: '', reservedQuantity: '0', unit: '', lastErpSyncDate: '' },
    fields: [
      { name: 'erpStockCode', label: 'ERP Stok Kodu' },
      { name: 'erpStockId', label: 'ERP Stok', type: 'lookup', lookupKind: 'stock' },
      { name: 'catalogProductId', label: 'Katalog Ürün', type: 'lookup', lookupKind: 'catalogProduct' },
      { name: 'warehouseCode', label: 'Depo', type: 'lookup', lookupKind: 'warehouse' },
      { name: 'warehouseName', label: 'Depo Adı' },
      { name: 'availableQuantity', label: 'Satılabilir Miktar', type: 'number', required: true },
      { name: 'reservedQuantity', label: 'Rezerve Miktar', type: 'number' },
      { name: 'unit', label: 'Birim' },
      { name: 'lastErpSyncDate', label: 'Son ERP Eşleme Tarihi', type: 'date' },
    ],
    transform: (values) => ({ ...baseTransform(values), catalogProductId: toOptionalNumber(values.catalogProductId), catalogVariantId: toOptionalNumber(values.catalogVariantId), erpStockId: toOptionalNumber(values.erpStockId), warehouseCode: toOptionalNumber(values.warehouseCode), availableQuantity: toRequiredNumber(values.availableQuantity), reservedQuantity: toRequiredNumber(values.reservedQuantity), lastErpSyncDate: trimOptional(values.lastErpSyncDate) }),
    submit: b2bApi.upsertInventory,
  },
  'shopping-lists': {
    defaults: { companyId: '', buyerId: '', name: '', isShared: false, listType: 'ShoppingList' },
    fields: [
      { name: 'companyId', label: 'Şirket', type: 'lookup', lookupKind: 'company', required: true },
      { name: 'buyerId', label: 'Alıcı', type: 'lookup', lookupKind: 'buyer' },
      { name: 'name', label: 'Liste Adı', required: true },
      { name: 'listType', label: 'Liste Tipi', required: true },
      { name: 'isShared', label: 'Ortak Liste', type: 'switch' },
    ],
    transform: (values) => ({ ...baseTransform(values), companyId: toRequiredNumber(values.companyId), buyerId: toOptionalNumber(values.buyerId) }),
    submit: b2bApi.createShoppingList,
  },
  'approval-rules': {
    defaults: { companyId: '', ruleName: '', minOrderAmount: '', maxOrderAmount: '', currencyCode: 'TRY', approverRoleCode: 'Approver' },
    fields: [
      { name: 'companyId', label: 'Şirket', type: 'lookup', lookupKind: 'company', required: true },
      { name: 'ruleName', label: 'Kural Adı', required: true },
      { name: 'minOrderAmount', label: 'Minimum Tutar', type: 'number' },
      { name: 'maxOrderAmount', label: 'Maksimum Tutar', type: 'number' },
      { name: 'currencyCode', label: 'Para Birimi', type: 'currency', required: true },
      { name: 'approverRoleCode', label: 'Onay Rolü', required: true },
    ],
    transform: (values) => ({ ...baseTransform(values), companyId: toRequiredNumber(values.companyId), minOrderAmount: toOptionalNumber(values.minOrderAmount), maxOrderAmount: toOptionalNumber(values.maxOrderAmount) }),
    submit: b2bApi.createApprovalRule,
  },
  quotes: {
    defaults: {
      customerId: '',
      userId: '',
      currencyCode: 'TRY',
      offerType: 'B2B',
      offerDate: '',
      offerNo: '',
      revisionNo: '',
      validUntil: '',
      deliveryDate: '',
      deliveryMethod: '',
      erpProjectCode: '',
      generalDiscountRate: '',
      generalDiscountAmount: '',
      customerNote: '',
    },
    fields: [
      { name: 'customerId', label: 'Cari', type: 'lookup', lookupKind: 'customer', required: true },
      { name: 'userId', label: 'Kullanıcı', type: 'lookup', lookupKind: 'user' },
      { name: 'currencyCode', label: 'Para Birimi', type: 'currency', required: true },
      { name: 'offerType', label: 'Teklif Tipi' },
      { name: 'offerDate', label: 'Teklif Tarihi', type: 'date' },
      { name: 'offerNo', label: 'Teklif No' },
      { name: 'revisionNo', label: 'Revizyon No' },
      { name: 'validUntil', label: 'Geçerlilik Tarihi', type: 'date' },
      { name: 'deliveryDate', label: 'Teslim Tarihi', type: 'date' },
      { name: 'deliveryMethod', label: 'Teslim Şekli' },
      { name: 'erpProjectCode', label: 'ERP Proje Kodu' },
      { name: 'generalDiscountRate', label: 'Genel İskonto %', type: 'number' },
      { name: 'generalDiscountAmount', label: 'Genel İskonto Tutarı', type: 'number' },
      { name: 'customerNote', label: 'Müşteri Notu', type: 'textarea', colSpan: 'full' },
    ],
    transform: (values) => ({
      customerId: toRequiredNumber(values.customerId),
      userId: toOptionalNumber(values.userId),
      currencyCode: trimOptional(values.currencyCode) ?? 'TRY',
      offerType: trimOptional(values.offerType),
      offerDate: trimOptional(values.offerDate),
      offerNo: trimOptional(values.offerNo),
      revisionNo: trimOptional(values.revisionNo),
      validUntil: trimOptional(values.validUntil),
      deliveryDate: trimOptional(values.deliveryDate),
      deliveryMethod: trimOptional(values.deliveryMethod),
      erpProjectCode: trimOptional(values.erpProjectCode),
      generalDiscountRate: toOptionalNumber(values.generalDiscountRate),
      generalDiscountAmount: toOptionalNumber(values.generalDiscountAmount),
      customerNote: trimOptional(values.customerNote),
    }),
    submit: b2bApi.createQuote,
  },
  payments: {
    defaults: { orderId: '', providerKey: '', externalTransactionId: '', amount: '', currencyCode: 'TRY', paymentMethod: '' },
    fields: [
      { name: 'orderId', label: 'Sipariş', type: 'lookup', lookupKind: 'order', required: true },
      { name: 'providerKey', label: 'Sağlayıcı Kodu', required: true },
      { name: 'externalTransactionId', label: 'Dış İşlem No' },
      { name: 'amount', label: 'Tutar', type: 'number', required: true },
      { name: 'currencyCode', label: 'Para Birimi', type: 'currency', required: true },
      { name: 'paymentMethod', label: 'Ödeme Yöntemi' },
    ],
    transform: (values) => ({ ...baseTransform(values), orderId: toRequiredNumber(values.orderId), amount: toRequiredNumber(values.amount) }),
    submit: b2bApi.createPayment,
  },
};

function resolveRouteKind(slug?: string): B2bWorkspaceKind {
  return slug ? kindByRouteSlug[slug] ?? 'companies' : 'companies';
}

function isCreateEnabled(kind: B2bWorkspaceKind): boolean {
  return Boolean(b2bFormConfigs[kind]);
}

function isOrder(row: unknown): row is OrderDto {
  return typeof row === 'object' && row !== null && 'orderNumber' in row && 'grandTotal' in row;
}

function isQuote(row: unknown): row is QuoteRequestDto {
  return typeof row === 'object' && row !== null && 'quoteNumber' in row && 'estimatedTotal' in row;
}

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(value || 0);
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('tr-TR');
}

function formatNumber(value?: number): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value ?? 0);
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' {
  if (status === 'Critical') return 'destructive';
  if (status === 'Good') return 'default';
  if (['Failed', 'Rejected', 'Cancelled', 'Blocked'].includes(status)) return 'destructive';
  if (['Approved', 'Completed', 'Paid', 'Active', 'Good'].includes(status)) return 'default';
  return 'secondary';
}

const workspaceColumns: PagedDataGridColumn<WorkspaceColumnKey>[] = [
  { key: 'primary', label: 'Kayıt' },
  { key: 'secondary', label: 'Detay' },
  { key: 'scope', label: 'Kapsam' },
  { key: 'status', label: 'Durum' },
  { key: 'amount', label: 'Tutar / Miktar' },
  { key: 'date', label: 'Tarih' },
];

const workspaceFilterColumns: readonly FilterColumnConfig[] = [
  { value: 'primary', type: 'string', labelKey: 'Kayıt', label: 'Kayıt' },
  { value: 'secondary', type: 'string', labelKey: 'Detay', label: 'Detay' },
  { value: 'scope', type: 'string', labelKey: 'Kapsam', label: 'Kapsam' },
  { value: 'status', type: 'string', labelKey: 'Durum', label: 'Durum' },
];

function getWorkspaceTableConfig(kind: B2bWorkspaceKind): WorkspaceTableConfig {
  const commercialColumns: Partial<Record<B2bWorkspaceKind, PagedDataGridColumn<WorkspaceColumnKey>[]>> = {
    quotes: [
      { key: 'primary', label: 'Talep / Teklif No' },
      { key: 'secondary', label: 'Revizyon / Tip' },
      { key: 'scope', label: 'Cari / Proje' },
      { key: 'status', label: 'Süreç Durumu' },
      { key: 'amount', label: 'Teklif Toplamı' },
      { key: 'date', label: 'Tarih / Geçerlilik' },
    ],
    orders: [
      { key: 'primary', label: 'Sipariş No' },
      { key: 'secondary', label: 'ERP / Netsis' },
      { key: 'scope', label: 'Cari / Proje' },
      { key: 'status', label: 'Sipariş Durumu' },
      { key: 'amount', label: 'Sipariş Toplamı' },
      { key: 'date', label: 'Tarih' },
    ],
  };

  const commercialFilterColumns: Partial<Record<B2bWorkspaceKind, readonly FilterColumnConfig[]>> = {
    quotes: [
      { value: 'primary', type: 'string', labelKey: 'Talep / Teklif No', label: 'Talep / Teklif No' },
      { value: 'secondary', type: 'string', labelKey: 'Revizyon / Tip', label: 'Revizyon / Tip' },
      { value: 'scope', type: 'string', labelKey: 'Cari / Proje', label: 'Cari / Proje' },
      { value: 'status', type: 'string', labelKey: 'Süreç Durumu', label: 'Süreç Durumu' },
    ],
    orders: [
      { value: 'primary', type: 'string', labelKey: 'Sipariş No', label: 'Sipariş No' },
      { value: 'secondary', type: 'string', labelKey: 'ERP / Netsis', label: 'ERP / Netsis' },
      { value: 'scope', type: 'string', labelKey: 'Cari / Proje', label: 'Cari / Proje' },
      { value: 'status', type: 'string', labelKey: 'Sipariş Durumu', label: 'Sipariş Durumu' },
    ],
  };

  const sortMaps: Record<B2bWorkspaceKind, Partial<Record<WorkspaceColumnKey, string>>> = {
    insights: {},
    companies: { primary: 'CompanyName', secondary: 'CompanyCode', scope: 'CustomerId', status: 'Status', amount: 'CreditLimit' },
    buyers: { primary: 'FullName', secondary: 'Email', scope: 'CompanyId', status: 'IsActive', amount: 'OrderLimit' },
    catalog: { primary: 'Name', secondary: 'Sku', scope: 'CategoryPath', status: 'IsPublished' },
    matches: { primary: 'CustomerSku', secondary: 'CustomerProductName', scope: 'CustomerId', status: 'MatchStatus', amount: 'ConfidenceScore' },
    visibility: { primary: 'CategoryPath', secondary: 'CatalogProductId', scope: 'CustomerGroupCode', status: 'IsActive' },
    pricing: { primary: 'Name', secondary: 'Code', scope: 'CustomerGroupCode', status: 'IsActive' },
    inventory: { primary: 'ErpStockCode', secondary: 'WarehouseName', scope: 'WarehouseCode', amount: 'AvailableQuantity', date: 'SnapshotDate' },
    'shopping-lists': { primary: 'Name', secondary: 'ListType', scope: 'CompanyId', status: 'IsShared' },
    'approval-rules': { primary: 'RuleName', secondary: 'ApproverRoleCode', scope: 'CompanyId', status: 'IsActive', amount: 'MinOrderAmount' },
    quotes: { primary: 'QuoteNumber', scope: 'CustomerId', status: 'Status', amount: 'EstimatedTotal', date: 'SubmittedDate' },
    orders: { primary: 'OrderNumber', scope: 'CustomerId', status: 'Status', amount: 'GrandTotal', date: 'SubmittedDate' },
    payments: { primary: 'ProviderKey', secondary: 'ExternalTransactionId', scope: 'OrderId', status: 'Status', amount: 'Amount', date: 'CompletedDate' },
    integrations: { primary: 'EventType', secondary: 'EntityName', scope: 'EntityId', status: 'Status', date: 'ProcessedDate' },
  };

  return {
    pageKey: `b2b-workspace-${kind}`,
    defaultSortBy: kind === 'catalog' ? 'primary' : 'date',
    mapSortBy: (columnKey) => sortMaps[kind][columnKey] ?? 'Id',
    columns: commercialColumns[kind] ?? workspaceColumns,
    filterColumns: commercialFilterColumns[kind] ?? workspaceFilterColumns,
  };
}

function renderStatusBadge(label: string, active?: boolean): ReactElement {
  if (typeof active === 'boolean') {
    return <Badge variant={active ? 'default' : 'secondary'}>{label}</Badge>;
  }
  return <Badge variant={statusBadgeVariant(label)}>{label || '-'}</Badge>;
}

function isCommercialWorkspace(kind: B2bWorkspaceKind): boolean {
  return kind === 'quotes' || kind === 'orders';
}

function normalizeCommercialStatus(status?: string): string {
  return (status || 'Draft').trim();
}

function isWaitingCommercialStatus(status?: string): boolean {
  return ['Draft', 'Submitted', 'Pending', 'WaitingApproval', 'WaitingOffer', 'Created'].includes(normalizeCommercialStatus(status));
}

function isApprovedCommercialStatus(status?: string): boolean {
  return ['Approved', 'Accepted', 'Completed', 'ConvertedToCart', 'ConvertedToOrder', 'Paid'].includes(normalizeCommercialStatus(status));
}

function isRiskCommercialStatus(status?: string): boolean {
  return ['Failed', 'Rejected', 'Cancelled', 'Blocked'].includes(normalizeCommercialStatus(status));
}

function getCommercialMetrics(kind: B2bWorkspaceKind, rows: WorkspaceRow[]) {
  const commercialRows = rows.filter((row) => kind === 'quotes' ? isQuote(row) : isOrder(row));
  const waitingCount = commercialRows.filter((row) => {
    const status = isQuote(row) ? row.status : isOrder(row) ? row.status : '';
    return isWaitingCommercialStatus(status);
  }).length;
  const approvedCount = commercialRows.filter((row) => {
    const status = isQuote(row) ? row.status : isOrder(row) ? row.status : '';
    return isApprovedCommercialStatus(status);
  }).length;
  const riskCount = commercialRows.filter((row) => {
    const status = isQuote(row) ? row.status : isOrder(row) ? row.status : '';
    return isRiskCommercialStatus(status);
  }).length;
  const total = commercialRows.reduce((sum, row) => {
    if (isQuote(row)) return sum + (row.estimatedTotal || 0);
    if (isOrder(row)) return sum + (row.grandTotal || 0);
    return sum;
  }, 0);

  return { count: commercialRows.length, waitingCount, approvedCount, riskCount, total };
}

function renderWorkspaceCell(kind: B2bWorkspaceKind, row: WorkspaceRow, columnKey: WorkspaceColumnKey): ReactElement | string {
  if (kind === 'companies') {
    const item = row as B2bCompanyDto;
    const values = {
      primary: <span className="font-medium text-slate-900 dark:text-white">{item.companyName}</span>,
      secondary: <span className="font-mono text-sm">{item.companyCode}</span>,
      scope: item.customerId ? 'ERP cari bağlı' : item.customerGroupCode || '-',
      status: renderStatusBadge(item.status),
      amount: item.creditLimit ? formatMoney(item.creditLimit, item.currencyCode) : '-',
      date: '-',
    };
    return values[columnKey];
  }
  if (kind === 'buyers') {
    const item = row as B2bBuyerDto;
    const values = {
      primary: <span className="font-medium text-slate-900 dark:text-white">{item.fullName}</span>,
      secondary: item.email,
      scope: 'Şirket hesabı bağlı',
      status: renderStatusBadge(item.isActive ? 'Aktif' : 'Pasif', item.isActive),
      amount: item.orderLimit ? formatNumber(item.orderLimit) : '-',
      date: item.requiresApproval ? 'Onay gerekli' : '-',
    };
    return values[columnKey];
  }
  if (kind === 'catalog') {
    const item = row as CatalogProductDto;
    const values = {
      primary: <span className="font-medium text-slate-900 dark:text-white">{item.name}</span>,
      secondary: <span className="font-mono text-sm">{item.sku}</span>,
      scope: item.categoryPath || item.productType || item.brand || '-',
      status: renderStatusBadge(item.isPublished ? 'Yayında' : 'Taslak', item.isPublished),
      amount: typeof item.completenessScore === 'number' ? `%${item.completenessScore} doluluk` : item.defaultStockId ? 'ERP stok bağlı' : '-',
      date: item.defaultStockId ? 'ERP stok bağlı' : '-',
    };
    return values[columnKey];
  }
  if (kind === 'matches') {
    const item = row as CustomerProductAliasDto;
    const values = {
      primary: <span className="font-mono text-sm">{item.customerSku}</span>,
      secondary: item.customerProductName || '-',
      scope: item.erpStockId ? 'ERP stok bağlı' : item.catalogProductId ? 'Katalog ürünü bağlı' : '-',
      status: renderStatusBadge(item.matchStatus),
      amount: item.confidenceScore ? `%${formatNumber(item.confidenceScore)}` : '-',
      date: 'ERP cari bağlı',
    };
    return values[columnKey];
  }
  if (kind === 'visibility') {
    const item = row as CatalogVisibilityRuleDto;
    const values = {
      primary: item.categoryPath || (item.catalogProductId ? 'Katalog ürünü' : '-'),
      secondary: item.ruleType,
      scope: item.companyId ? 'Şirket hesabı bağlı' : item.customerGroupCode || (item.customerId ? 'ERP cari bağlı' : '-'),
      status: renderStatusBadge(item.isActive ? 'Aktif' : 'Pasif', item.isActive),
      amount: '-',
      date: '-',
    };
    return values[columnKey];
  }
  if (kind === 'pricing') {
    const item = row as CustomerPriceListDto;
    const values = {
      primary: <span className="font-medium text-slate-900 dark:text-white">{item.name}</span>,
      secondary: <span className="font-mono text-sm">{item.code}</span>,
      scope: item.customerGroupCode || (item.customerId ? 'ERP cari bağlı' : 'Genel liste'),
      status: renderStatusBadge(item.isActive ? 'Aktif' : 'Pasif', item.isActive),
      amount: item.currencyCode,
      date: '-',
    };
    return values[columnKey];
  }
  if (kind === 'inventory') {
    const item = row as InventorySnapshotDto;
    const values = {
      primary: <span className="font-mono text-sm">{item.erpStockCode || 'Stok kaydı'}</span>,
      secondary: item.warehouseName || `Depo ${item.warehouseCode || '-'}`,
      scope: item.unit || '-',
      status: renderStatusBadge(item.availableQuantity > 0 ? 'Satılabilir' : 'Stok yok', item.availableQuantity > 0),
      amount: `${formatNumber(item.availableQuantity)} ${item.unit || ''}`.trim(),
      date: formatDate(item.snapshotDate),
    };
    return values[columnKey];
  }
  if (kind === 'shopping-lists') {
    const item = row as ShoppingListDto;
    const values = {
      primary: <span className="font-medium text-slate-900 dark:text-white">{item.name}</span>,
      secondary: item.listType,
      scope: 'Şirket hesabı bağlı',
      status: renderStatusBadge(item.isShared ? 'Ortak' : 'Kişisel', item.isShared),
      amount: item.buyerId ? 'Alıcı bağlı' : '-',
      date: '-',
    };
    return values[columnKey];
  }
  if (kind === 'approval-rules') {
    const item = row as PurchaseApprovalRuleDto;
    const values = {
      primary: <span className="font-medium text-slate-900 dark:text-white">{item.ruleName}</span>,
      secondary: `Onay rolü: ${item.approverRoleCode}`,
      scope: 'Şirket hesabı bağlı',
      status: renderStatusBadge(item.isActive ? 'Aktif' : 'Pasif', item.isActive),
      amount: `${formatMoney(item.minOrderAmount || 0, item.currencyCode)} - ${item.maxOrderAmount ? formatMoney(item.maxOrderAmount, item.currencyCode) : 'üst limit yok'}`,
      date: '-',
    };
    return values[columnKey];
  }
  if (kind === 'quotes') {
    const item = row as QuoteRequestDto;
    const values = {
      primary: <span className="font-mono text-sm">{item.offerNo || item.quoteNumber}</span>,
      secondary: item.revisionNo ? `Revizyon ${item.revisionNo}` : item.offerType || 'Talep',
      scope: item.erpProjectCode ? `Proje: ${item.erpProjectCode}` : item.deliveryDate ? `Teslim: ${formatDate(item.deliveryDate)}` : item.currencyCode,
      status: renderStatusBadge(item.status),
      amount: formatMoney(item.estimatedTotal, item.currencyCode),
      date: item.validUntil ? `Geçerli: ${formatDate(item.validUntil)}` : formatDate(item.offerDate || item.submittedDate),
    };
    return values[columnKey];
  }
  if (kind === 'orders') {
    const item = row as OrderDto;
    const values = {
      primary: <span className="font-mono text-sm">{item.offerNo || item.orderNumber}</span>,
      secondary: item.externalErpOrderNumber ? `ERP: ${item.externalErpOrderNumber}` : item.revisionNo ? `Revizyon ${item.revisionNo}` : 'ERP aktarımı bekliyor',
      scope: item.erpProjectCode ? `Proje: ${item.erpProjectCode}` : item.deliveryDate ? `Teslim: ${formatDate(item.deliveryDate)}` : 'ERP cari bağlı',
      status: renderStatusBadge(item.status),
      amount: formatMoney(item.grandTotal, item.currencyCode),
      date: formatDate(item.offerDate || item.submittedDate),
    };
    return values[columnKey];
  }
  if (kind === 'payments') {
    const item = row as PaymentTransactionDto;
    const values = {
      primary: item.providerKey,
      secondary: item.externalTransactionId || '-',
      scope: 'Sipariş bağlı',
      status: renderStatusBadge(item.status),
      amount: formatMoney(item.amount, item.currencyCode),
      date: formatDate(item.completedDate || item.requestedDate),
    };
    return values[columnKey];
  }
  if (kind === 'integrations') {
    const item = row as B2bIntegrationEventDto;
    const values = {
      primary: item.eventType,
      secondary: `${item.direction} / ${item.entityName}`,
      scope: item.entityId ? 'Kayıt bağlı' : item.externalReference || '-',
      status: renderStatusBadge(item.status),
      amount: '-',
      date: formatDate(item.processedDate),
    };
    return values[columnKey];
  }
  return '-';
}

function workspaceExportRow(kind: B2bWorkspaceKind, row: WorkspaceRow): Record<string, unknown> {
  if (kind === 'companies') {
    const item = row as B2bCompanyDto;
    return { primary: item.companyName, secondary: item.companyCode, scope: item.customerId, status: item.status, amount: item.creditLimit, date: '' };
  }
  if (kind === 'buyers') {
    const item = row as B2bBuyerDto;
    return { primary: item.fullName, secondary: item.email, scope: item.companyId, status: item.isActive ? 'Aktif' : 'Pasif', amount: item.orderLimit, date: item.requiresApproval ? 'Onay gerekli' : '' };
  }
  if (kind === 'catalog') {
    const item = row as CatalogProductDto;
    return { primary: item.name, secondary: item.sku, scope: item.categoryPath || item.brand, status: item.isPublished ? 'Yayında' : 'Taslak', amount: item.defaultStockId, date: '' };
  }
  if (kind === 'matches') {
    const item = row as CustomerProductAliasDto;
    return { primary: item.customerSku, secondary: item.customerProductName, scope: item.erpStockId || item.catalogProductId, status: item.matchStatus, amount: item.confidenceScore, date: item.customerId };
  }
  if (kind === 'visibility') {
    const item = row as CatalogVisibilityRuleDto;
    return { primary: item.categoryPath || item.catalogProductId, secondary: item.ruleType, scope: item.companyId || item.customerGroupCode || item.customerId, status: item.isActive ? 'Aktif' : 'Pasif', amount: '', date: '' };
  }
  if (kind === 'pricing') {
    const item = row as CustomerPriceListDto;
    return { primary: item.name, secondary: item.code, scope: item.customerGroupCode || item.customerId, status: item.isActive ? 'Aktif' : 'Pasif', amount: item.currencyCode, date: '' };
  }
  if (kind === 'inventory') {
    const item = row as InventorySnapshotDto;
    return { primary: item.erpStockCode, secondary: item.warehouseName, scope: item.warehouseCode, status: item.availableQuantity > 0 ? 'Satılabilir' : 'Stok yok', amount: item.availableQuantity, date: formatDate(item.snapshotDate) };
  }
  if (kind === 'shopping-lists') {
    const item = row as ShoppingListDto;
    return { primary: item.name, secondary: item.listType, scope: item.companyId, status: item.isShared ? 'Ortak' : 'Kişisel', amount: item.buyerId, date: '' };
  }
  if (kind === 'approval-rules') {
    const item = row as PurchaseApprovalRuleDto;
    return { primary: item.ruleName, secondary: item.approverRoleCode, scope: item.companyId, status: item.isActive ? 'Aktif' : 'Pasif', amount: item.minOrderAmount, date: '' };
  }
  if (kind === 'quotes') {
    const item = row as QuoteRequestDto;
    return { primary: item.offerNo || item.quoteNumber, secondary: item.revisionNo, scope: item.erpProjectCode || item.currencyCode, status: item.status, amount: item.estimatedTotal, date: item.validUntil ? formatDate(item.validUntil) : formatDate(item.offerDate || item.submittedDate) };
  }
  if (kind === 'orders') {
    const item = row as OrderDto;
    return { primary: item.offerNo || item.orderNumber, secondary: item.externalErpOrderNumber || item.revisionNo, scope: item.erpProjectCode || item.customerId, status: item.status, amount: item.grandTotal, date: formatDate(item.offerDate || item.submittedDate) };
  }
  if (kind === 'payments') {
    const item = row as PaymentTransactionDto;
    return { primary: item.providerKey, secondary: item.externalTransactionId, scope: item.orderId, status: item.status, amount: item.amount, date: formatDate(item.completedDate || item.requestedDate) };
  }
  if (kind === 'integrations') {
    const item = row as B2bIntegrationEventDto;
    return { primary: item.eventType, secondary: item.entityName, scope: item.entityId || item.externalReference, status: item.status, amount: '', date: formatDate(item.processedDate) };
  }
  return {
    primary: '',
    secondary: '',
    scope: '',
    status: '',
    amount: '',
    date: '',
  };
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
    <div className="w-full space-y-6 crm-page">
      <Breadcrumb items={[{ label: 'B2B' }, { label: 'Hazırlık Paneli', isActive: true }]} />

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.20),_transparent_30%),linear-gradient(135deg,_#f8fafc,_#ecfeff)] p-8 shadow-sm dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_right,_rgba(20,184,166,0.16),_transparent_30%),linear-gradient(135deg,_#020617,_#0f172a)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge variant="secondary" className="w-fit">ERP uyumlu B2B hazırlık</Badge>
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
  const navigate = useNavigate();
  const config = configs[kind];
  const routeSlug = routeSlugByKind[kind];
  const tableConfig = useMemo(() => getWorkspaceTableConfig(kind), [kind]);
  const pagedGrid = usePagedDataGrid<WorkspaceColumnKey>({
    pageKey: tableConfig.pageKey,
    defaultSortBy: tableConfig.defaultSortBy,
    defaultSortDirection: kind === 'catalog' ? 'asc' : 'desc',
    defaultPageSize: 20,
    mapSortBy: tableConfig.mapSortBy,
  });
  const { data, isLoading, error, refetch } = useB2bWorkspaceQuery(kind, pagedGrid.queryParams);
  const rows = useMemo<WorkspaceRow[]>(() => data?.data ?? [], [data?.data]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isActionBusy, setIsActionBusy] = useState(false);
  const [quickCustomerId, setQuickCustomerId] = useState('');
  const [quickCustomerLabel, setQuickCustomerLabel] = useState<string | null>(null);
  const [quickOrderText, setQuickOrderText] = useState('');
  const [portalCustomerId, setPortalCustomerId] = useState('');
  const [portalCustomerLabel, setPortalCustomerLabel] = useState<string | null>(null);
  const [portalSummary, setPortalSummary] = useState<CustomerPortalSummaryDto | null>(null);
  const [customerLookupTarget, setCustomerLookupTarget] = useState<'quick' | 'portal' | null>(null);
  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey: tableConfig.pageKey,
    columns: tableConfig.columns.map(({ key, label }) => ({ key, label })),
  });

  useEffect(() => {
    setPageTitle(config.title);
    return () => setPageTitle(null);
  }, [config.title, setPageTitle]);

  const range = getPagedRange(data);
  const visibleColumnKeys = orderedVisibleColumns as WorkspaceColumnKey[];
  const paginationInfoText = `${range.from}-${range.to} / ${range.total}`;
  const exportColumns = useMemo(
    () => orderedVisibleColumns.map((key) => ({ key, label: tableConfig.columns.find((column) => column.key === key)?.label ?? key })),
    [orderedVisibleColumns, tableConfig.columns],
  );
  const exportRows = useMemo(() => rows.map((row) => workspaceExportRow(kind, row)), [kind, rows]);
  const commercialMetrics = useMemo(() => getCommercialMetrics(kind, rows), [kind, rows]);
  const renderSortIcon = (columnKey: WorkspaceColumnKey): ReactElement | null => {
    if (columnKey !== pagedGrid.sortBy) return null;
    return pagedGrid.sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  };

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
    <div className="w-full space-y-6 crm-page">
      <Breadcrumb
        items={[
          { label: 'B2B' },
          { label: config.breadcrumb, isActive: true },
        ]}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Badge variant="secondary" className="w-fit">ERP uyumlu B2B</Badge>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{config.title}</h1>
            <p className="mt-1 max-w-4xl text-sm font-medium text-slate-500 dark:text-slate-400">{config.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isCreateEnabled(kind) ? (
            <Button asChild>
              <Link to={`/b2b/${routeSlug}/create`}>Oluştur</Link>
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Yenile
          </Button>
        </div>
      </div>

      {isCommercialWorkspace(kind) ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="overflow-hidden border-slate-200/80 shadow-sm dark:border-white/10 dark:bg-white/3">
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-950">
                {kind === 'quotes' ? <FileText className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Toplam kayıt</p>
                <p className="text-2xl font-black text-slate-950 dark:text-white">{commercialMetrics.count}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-amber-200/80 bg-amber-50/60 shadow-sm dark:border-amber-400/20 dark:bg-amber-500/10">
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600 text-white">
                <Clock3 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200">Aksiyon bekleyen</p>
                <p className="text-2xl font-black text-amber-950 dark:text-amber-50">{commercialMetrics.waitingCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-emerald-200/80 bg-emerald-50/60 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10">
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-200">Onaylı / tamam</p>
                <p className="text-2xl font-black text-emerald-950 dark:text-emerald-50">{commercialMetrics.approvedCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-rose-200/80 bg-rose-50/60 shadow-sm dark:border-rose-400/20 dark:bg-rose-500/10">
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-700 text-white">
                <TriangleAlert className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-700 dark:text-rose-200">Riskli kayıt</p>
                <p className="text-2xl font-black text-rose-950 dark:text-rose-50">{commercialMetrics.riskCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {kind === 'quotes' ? (
        <Card className="border-slate-200/80 shadow-sm dark:border-white/10 dark:bg-white/3">
          <CardHeader className="border-b border-slate-100 bg-slate-50/70 dark:border-white/10 dark:bg-white/5">
            <CardTitle className="flex items-center gap-2">
              <GitBranchPlus className="h-5 w-5" />
              Talep / Teklif İş Akışı
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 pt-6 md:grid-cols-4">
            {[
              ['1', 'Talep alınır', 'Portal, hızlı sipariş veya satış ekibi talebi oluşturur.'],
              ['2', 'Fiyat netleşir', 'Effective price, iskonto, termin ve müşteri notu aynı kayıtta izlenir.'],
              ['3', 'Onaylanır', 'Revizyon ve pazarlık geçmişi bozulmadan teklif onaya gider.'],
              ['4', 'Sepete / siparişe döner', 'Onaylı teklif tek aksiyonla sepete alınır ve siparişe çevrilir.'],
            ].map(([step, title, text]) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-600 text-sm font-black text-white">{step}</span>
                <p className="font-black text-slate-950 dark:text-white">{title}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {kind === 'orders' ? (
        <Card className="border-slate-200/80 shadow-sm dark:border-white/10 dark:bg-white/3">
          <CardHeader className="border-b border-slate-100 bg-slate-50/70 dark:border-white/10 dark:bg-white/5">
            <CardTitle>Hızlı Sipariş ve Müşteri Portalı</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 lg:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
              <div>
                <p className="font-semibold text-slate-950 dark:text-white">SKU / stok kodu yapıştır</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Her satır: SKU veya stok kodu, miktar, depo kodu. Örn: ABC-001, 5, 1</p>
              </div>
              <PagedLookupDialog<CustomerLookup>
                open={customerLookupTarget === 'quick'}
                onOpenChange={(open) => setCustomerLookupTarget(open ? 'quick' : null)}
                value={quickCustomerLabel}
                placeholder="Cari seç"
                searchPlaceholder="Cari kodu veya unvan ara"
                title="Hızlı Sipariş Carisi Seç"
                description="ERP cari kartlarında kod veya unvan ile arama yapın."
                emptyText="Cari bulunamadı."
                queryKey={['b2b-orders-quick-customer']}
                fetchPage={({ pageNumber, pageSize, search, signal }) => lookupApi.getCustomersPaged({ pageNumber, pageSize, search }, { signal })}
                getKey={(item) => String(item.id)}
                getLabel={(item) => `${item.cariKod} - ${item.cariIsim}`}
                onSelect={(item) => {
                  setQuickCustomerId(String(item.id));
                  setQuickCustomerLabel(`${item.cariKod} - ${item.cariIsim}`);
                }}
              />
              <textarea
                className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                placeholder={"ABC-001, 5, 1\nABC-002, 2, 1"}
                value={quickOrderText}
                onChange={(event) => setQuickOrderText(event.target.value)}
              />
              <Button
                type="button"
                disabled={isActionBusy}
                onClick={() => void runAction(async () => {
                  const customerId = Number(quickCustomerId);
                  if (!Number.isFinite(customerId) || customerId <= 0) throw new Error('Cari seçin.');
                  const lines = parseQuickOrderLines(quickOrderText);
                  if (lines.length === 0) throw new Error('En az bir hızlı sipariş satırı girin.');
                  const result = await b2bApi.quickOrder({ customerId, currencyCode: 'TRY', lines });
                  return `${result.addedLineCount}/${result.requestedLineCount} satır sepete eklendi.`;
                })}
              >
                Sepete Ekle
              </Button>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
              <div>
                <p className="font-semibold text-slate-950 dark:text-white">Müşteri portal özeti</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Draft sepet, açık sipariş, bekleyen ödeme ve son siparişleri getirir.</p>
              </div>
              <PagedLookupDialog<CustomerLookup>
                open={customerLookupTarget === 'portal'}
                onOpenChange={(open) => setCustomerLookupTarget(open ? 'portal' : null)}
                value={portalCustomerLabel}
                placeholder="Cari seç"
                searchPlaceholder="Cari kodu veya unvan ara"
                title="Portal Carisi Seç"
                description="ERP cari kartlarında kod veya unvan ile arama yapın."
                emptyText="Cari bulunamadı."
                queryKey={['b2b-orders-portal-customer']}
                fetchPage={({ pageNumber, pageSize, search, signal }) => lookupApi.getCustomersPaged({ pageNumber, pageSize, search }, { signal })}
                getKey={(item) => String(item.id)}
                getLabel={(item) => `${item.cariKod} - ${item.cariIsim}`}
                onSelect={(item) => {
                  setPortalCustomerId(String(item.id));
                  setPortalCustomerLabel(`${item.cariKod} - ${item.cariIsim}`);
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={isActionBusy}
                onClick={() => void runAction(async () => {
                  const customerId = Number(portalCustomerId);
                  if (!Number.isFinite(customerId) || customerId <= 0) throw new Error('Cari seçin.');
                  const summary = await b2bApi.getCustomerPortalSummary(customerId);
                  setPortalSummary(summary);
                  return 'Müşteri portal özeti yüklendi.';
                })}
              >
                Portalı Getir
              </Button>
              {portalSummary ? (
                <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
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

      <Card className="border-slate-200/80 shadow-sm dark:border-white/10 dark:bg-white/3">
        <CardHeader className="border-b border-slate-100 bg-slate-50/70 dark:border-white/10 dark:bg-white/5">
          <CardTitle className="flex items-center justify-between text-base">
            <span>{config.title}</span>
            <Badge variant="secondary">{range.total}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <PagedDataGrid<WorkspaceRow, WorkspaceColumnKey>
            pageKey={tableConfig.pageKey}
            columns={tableConfig.columns}
            visibleColumnKeys={visibleColumnKeys}
            rows={rows}
            rowKey={(row) => row.id}
            renderCell={(row, columnKey) => renderWorkspaceCell(kind, row, columnKey)}
            sortBy={pagedGrid.sortBy}
            sortDirection={pagedGrid.sortDirection}
            onSort={pagedGrid.handleSort}
            renderSortIcon={renderSortIcon}
            isLoading={isLoading}
            isError={Boolean(error)}
            errorText={error ? `Veri alınamadı: ${(error as Error).message}` : undefined}
            emptyText={config.emptyState}
            pageSize={data?.pageSize ?? pagedGrid.pageSize}
            pageSizeOptions={pagedGrid.pageSizeOptions}
            onPageSizeChange={pagedGrid.handlePageSizeChange}
            pageNumber={pagedGrid.getDisplayPageNumber(data)}
            totalPages={Math.max(data?.totalPages ?? 1, 1)}
            hasPreviousPage={Boolean(data?.hasPreviousPage)}
            hasNextPage={Boolean(data?.hasNextPage)}
            onPreviousPage={pagedGrid.goToPreviousPage}
            onNextPage={pagedGrid.goToNextPage}
            previousLabel="Önceki"
            nextLabel="Sonraki"
            paginationInfoText={paginationInfoText}
            onRowDoubleClick={['catalog', 'pricing', 'quotes', 'orders'].includes(kind) ? (row) => navigate(`/b2b/${routeSlug}/${row.id}`) : undefined}
            showActionsColumn
            actionsHeaderLabel="İşlem"
            renderActionsCell={(row) => {
              const detailAction = ['catalog', 'pricing', 'quotes', 'orders'].includes(kind) ? (
                <Button type="button" size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); navigate(`/b2b/${routeSlug}/${row.id}`); }}>
                  Detay
                </Button>
              ) : null;
              const editAction = editSupportedKinds.has(kind) ? (
                <Button type="button" size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); navigate(`/b2b/${routeSlug}/${row.id}/edit`); }}>
                  Düzenle
                </Button>
              ) : null;
              if (isOrder(row)) {
                return (
                  <div className="flex justify-end gap-1">
                    {detailAction}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={isActionBusy}
                      onClick={(event) => {
                        event.stopPropagation();
                        void runAction(async () => {
                          const result = await b2bApi.reorder({ orderId: row.id });
                          return `${row.orderNumber} tekrar sepete alındı: ${result.addedLineCount}/${result.requestedLineCount} satır.`;
                        });
                      }}
                    >
                      Tekrar Sipariş
                    </Button>
                  </div>
                );
              }
              if (isQuote(row)) {
                return (
                  <div className="flex justify-end gap-1">
                    {detailAction}
                    {editAction}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={isActionBusy || row.status !== 'Approved'}
                      onClick={(event) => {
                        event.stopPropagation();
                        void runAction(async () => {
                          await b2bApi.convertQuoteToCart(row.id, {});
                          return `${row.quoteNumber} sepete çevrildi.`;
                        });
                      }}
                    >
                      Sepete Çevir
                    </Button>
                  </div>
                );
              }
              return (
                <div className="flex justify-end gap-1">
                  {detailAction}
                  {editAction}
                </div>
              );
            }}
            minTableWidthClassName="min-w-[980px]"
            actionBar={{
              pageKey: tableConfig.pageKey,
              userId,
              columns: tableConfig.columns.map(({ key, label }) => ({ key, label })),
              visibleColumns,
              columnOrder,
              onVisibleColumnsChange: setVisibleColumns,
              onColumnOrderChange: setColumnOrder,
              exportFileName: tableConfig.pageKey,
              exportColumns,
              exportRows,
              filterColumns: tableConfig.filterColumns,
              defaultFilterColumn: 'primary',
              draftFilterRows: pagedGrid.draftFilterRows,
              onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
              filterLogic: pagedGrid.filterLogic,
              onFilterLogicChange: pagedGrid.setFilterLogic,
              onApplyFilters: pagedGrid.applyAdvancedFilters,
              onClearFilters: pagedGrid.clearAdvancedFilters,
              appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
              search: {
                value: pagedGrid.searchInput,
                onValueChange: pagedGrid.searchConfig.onValueChange,
                onSearchChange: pagedGrid.searchConfig.onSearchChange,
                placeholder: 'Hızlı arama yap...',
              },
              refresh: {
                onRefresh: () => void refetch(),
                isLoading,
                label: 'Yenile',
              },
              leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" />,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function B2bRecordFormPage({ mode }: { mode: 'create' | 'edit' }): ReactElement {
  const { workspaceKind, id } = useParams();
  const navigate = useNavigate();
  const kind = resolveRouteKind(workspaceKind);
  const config = configs[kind];
  const formConfig = b2bFormConfigs[kind];
  const isEdit = mode === 'edit';
  const recordId = id ? Number(id) : undefined;
  const [values, setValues] = useState<Record<string, string | boolean>>(() => formConfig?.defaults ?? {});
  const [quoteLines, setQuoteLines] = useState<QuoteLineFormState[]>(() => [createEmptyQuoteLine()]);
  const [lookupLabels, setLookupLabels] = useState<Record<string, string>>({});
  const [activeLookupField, setActiveLookupField] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { currencyOptions, isLoading: isCurrencyLoading } = useCurrencyOptions();

  const detailQuery = useQuery({
    queryKey: ['b2b-form-detail', kind, recordId],
    queryFn: async () => {
      if (kind !== 'catalog' || !recordId) return null;
      return b2bApi.getCatalogProduct(recordId);
    },
    enabled: isEdit && kind === 'catalog' && Boolean(recordId),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formConfig) throw new Error('Bu modülde manuel kayıt oluşturma kapalı.');
      const missingField = formConfig.fields.find((field) => {
        if (!field.required) return false;
        const value = values[field.name];
        return typeof value === 'boolean' ? false : !value?.trim();
      });
      if (missingField) throw new Error(`${missingField.label} zorunlu.`);
      const payload = kind === 'quotes'
        ? buildQuotePayload(values, quoteLines)
        : formConfig.transform ? formConfig.transform(values) : baseTransform(values);
      return formConfig.submit(payload, recordId);
    },
    onSuccess: () => {
      navigate(`/b2b/${routeSlugByKind[kind]}`);
    },
    onError: (error) => {
      setFormError((error as Error).message);
    },
  });

  useEffect(() => {
    const title = isEdit ? `${config.title} Düzenle` : `${config.title} Oluştur`;
    useUIStore.getState().setPageTitle(title);
    return () => useUIStore.getState().setPageTitle(null);
  }, [config.title, isEdit]);

  useEffect(() => {
    if (!formConfig) return;
    if (isEdit && detailQuery.data && formConfig.mapInitial) {
      setValues(formConfig.mapInitial(detailQuery.data));
      return;
    }
    if (!isEdit) {
      setValues(formConfig.defaults);
      setLookupLabels({});
      if (kind === 'quotes') setQuoteLines([createEmptyQuoteLine()]);
    }
  }, [detailQuery.data, formConfig, isEdit]);

  if (!formConfig) {
    return <Navigate to={`/b2b/${routeSlugByKind[kind]}`} replace />;
  }

  if (isEdit && kind !== 'catalog') {
    return <Navigate to={`/b2b/${routeSlugByKind[kind]}`} replace />;
  }

  function updateValue(name: string, value: string | boolean): void {
    setFormError(null);
    setValues((current) => ({ ...current, [name]: value }));
  }

  function setLookupValue(name: string, value: number | string, label: string, extraValues?: Record<string, string | boolean>): void {
    setFormError(null);
    setValues((current) => ({ ...current, [name]: String(value), ...extraValues }));
    setLookupLabels((current) => ({ ...current, [name]: label }));
  }

  function lookupValue(field: B2bFormField): string | null {
    if (lookupLabels[field.name]) return lookupLabels[field.name];
    return values[field.name] ? 'Seçili kayıt' : null;
  }

  function renderLookupField(field: B2bFormField): ReactElement | null {
    const commonProps = {
      open: activeLookupField === field.name,
      onOpenChange: (open: boolean) => setActiveLookupField(open ? field.name : null),
      value: lookupValue(field),
      placeholder: `${field.label} seç`,
      searchPlaceholder: `${field.label} ara`,
      queryKey: ['b2b-form-lookup', kind, field.name],
    };

    if (field.lookupKind === 'company') {
      return (
        <PagedLookupDialog<B2bCompanyDto>
          {...commonProps}
          title="Şirket Seç"
          description="B2B şirket hesaplarında arama yapın."
          emptyText="Şirket bulunamadı."
          fetchPage={({ pageNumber, pageSize, search }) => b2bApi.getCompanies({ pageNumber, pageSize, search })}
          getKey={(item) => String(item.id)}
          getLabel={(item) => `${item.companyCode} - ${item.companyName}`}
          onSelect={(item) => setLookupValue(field.name, item.id, `${item.companyCode} - ${item.companyName}`)}
        />
      );
    }

    if (field.lookupKind === 'buyer') {
      return (
        <PagedLookupDialog<B2bBuyerDto>
          {...commonProps}
          title="Alıcı Seç"
          description="Şirkete bağlı B2B alıcılarında arama yapın."
          emptyText="Alıcı bulunamadı."
          fetchPage={({ pageNumber, pageSize, search }) => b2bApi.getBuyers({ pageNumber, pageSize, search })}
          getKey={(item) => String(item.id)}
          getLabel={(item) => `${item.fullName} - ${item.email}`}
          onSelect={(item) => setLookupValue(field.name, item.id, `${item.fullName} - ${item.email}`)}
        />
      );
    }

    if (field.lookupKind === 'customer') {
      return (
        <PagedLookupDialog<CustomerLookup>
          {...commonProps}
          title="Cari Seç"
          description="ERP cari kartlarında kod veya unvan ile arama yapın."
          emptyText="Cari bulunamadı."
          fetchPage={({ pageNumber, pageSize, search, signal }) => lookupApi.getCustomersPaged({ pageNumber, pageSize, search }, { signal })}
          getKey={(item) => String(item.id)}
          getLabel={(item) => `${item.cariKod} - ${item.cariIsim}`}
          onSelect={(item) => {
            const extraValues = kind === 'companies' && field.name === 'customerId'
              ? {
                  companyCode: item.cariKod,
                  companyName: item.cariIsim,
                  customerGroupCode: item.grupKodu,
                  creditLimit: item.riskSiniri ? String(item.riskSiniri) : '',
                }
              : undefined;
            setLookupValue(field.name, item.id, `${item.cariKod} - ${item.cariIsim}`, extraValues);
          }}
        />
      );
    }

    if (field.lookupKind === 'user') {
      return (
        <PagedLookupDialog<UserDto>
          {...commonProps}
          title="Kullanıcı Seç"
          description="Sistem kullanıcılarında ad veya e-posta ile arama yapın."
          emptyText="Kullanıcı bulunamadı."
          fetchPage={({ pageNumber, pageSize, search }) => b2bApi.getUsers({ pageNumber, pageSize, search })}
          getKey={(item) => String(item.id)}
          getLabel={(item) => `${item.fullName || item.username} - ${item.email}`}
          onSelect={(item) => {
            const extraValues = kind === 'buyers'
              ? {
                  email: item.email,
                  fullName: item.fullName || item.username,
                }
              : undefined;
            setLookupValue(field.name, item.id, `${item.fullName || item.username} - ${item.email}`, extraValues);
          }}
        />
      );
    }

    if (field.lookupKind === 'stock') {
      return (
        <PagedLookupDialog<StockLookup>
          {...commonProps}
          title="ERP Stok Seç"
          description="ERP stok kartlarında kod, ad veya üretici kodu ile arama yapın."
          emptyText="Stok bulunamadı."
          fetchPage={({ pageNumber, pageSize, search, signal }) => lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })}
          getKey={(item) => String(item.id)}
          getLabel={(item) => `${item.stokKodu} - ${item.stokAdi}`}
          onSelect={(item) => {
            const categoryPath = [item.grupKodu, item.kod1, item.kod2, item.kod3]
              .filter((value) => Boolean(value?.trim()))
              .join(' / ');
            let extraValues: Record<string, string | boolean> | undefined;
            if (field.name === 'erpStockId') {
              extraValues = { erpStockCode: item.stokKodu, unit: item.olcuBr1 };
            } else if (field.name === 'defaultStockId') {
              extraValues = {
                sku: item.stokKodu,
                name: item.stokAdi,
                slug: slugify(`${item.stokKodu}-${item.stokAdi}`),
                brand: item.ureticiKodu || '',
                manufacturerCode: item.ureticiKodu || '',
                unit: item.olcuBr1 || '',
                productType: item.grupKodu || '',
                categoryPath,
              };
            }
            const lookupLabel = `${item.stokKodu} - ${item.stokAdi}`;
            setLookupValue(field.name, item.id, lookupLabel, extraValues);
          }}
        />
      );
    }
    if (field.lookupKind === 'catalogProduct') {
      return (
        <PagedLookupDialog<CatalogProductDto>
          {...commonProps}
          title="Katalog Ürünü Seç"
          description="B2B katalog ürünlerinde SKU veya ürün adı ile arama yapın."
          emptyText="Katalog ürünü bulunamadı."
          fetchPage={({ pageNumber, pageSize, search }) => b2bApi.getCatalogProducts({ pageNumber, pageSize, search })}
          getKey={(item) => String(item.id)}
          getLabel={(item) => `${item.sku} - ${item.name}`}
          onSelect={(item) => setLookupValue(field.name, item.id, `${item.sku} - ${item.name}`)}
        />
      );
    }

    if (field.lookupKind === 'warehouse') {
      return (
        <PagedLookupDialog<WarehouseLookup>
          {...commonProps}
          title="Depo Seç"
          description="ERP depo kartlarında kod veya ad ile arama yapın."
          emptyText="Depo bulunamadı."
          fetchPage={({ pageNumber, pageSize, search, signal }) => lookupApi.getWarehousesPaged({ pageNumber, pageSize, search }, undefined, { signal })}
          getKey={(item) => String(item.id)}
          getLabel={(item) => `${item.depoKodu} - ${item.depoIsmi}`}
          onSelect={(item) => setLookupValue(field.name, item.depoKodu, `${item.depoKodu} - ${item.depoIsmi}`, { warehouseName: item.depoIsmi })}
        />
      );
    }

    if (field.lookupKind === 'order') {
      return (
        <PagedLookupDialog<OrderDto>
          {...commonProps}
          title="Sipariş Seç"
          description="B2B siparişlerinde sipariş numarası veya cari bilgisi ile arama yapın."
          emptyText="Sipariş bulunamadı."
          fetchPage={({ pageNumber, pageSize, search }) => b2bApi.getOrders({ pageNumber, pageSize, search })}
          getKey={(item) => String(item.id)}
          getLabel={(item) => `${item.orderNumber} - ${formatMoney(item.grandTotal, item.currencyCode)}`}
          onSelect={(item) => setLookupValue(field.name, item.id, `${item.orderNumber} - ${formatMoney(item.grandTotal, item.currencyCode)}`)}
        />
      );
    }

    return null;
  }

  function updateQuoteLine(clientId: string, patch: Partial<QuoteLineFormState>): void {
    setFormError(null);
    setQuoteLines((current) => current.map((line) => line.clientId === clientId ? { ...line, ...patch } : line));
  }

  function removeQuoteLine(clientId: string): void {
    setFormError(null);
    setQuoteLines((current) => current.length > 1 ? current.filter((line) => line.clientId !== clientId) : current);
  }

  function renderQuoteLinesEditor(): ReactElement | null {
    if (kind !== 'quotes') return null;

    return (
      <div className="space-y-4 md:col-span-2">
        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Talep / teklif kalemleri</h3>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">CRM’deki gibi her ürün ayrı satırdır; stok seç, miktar ve hedef fiyat gir, gerekiyorsa yeni satır ekle.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setQuoteLines((current) => [...current, createEmptyQuoteLine()])}>
            <Plus className="mr-2 h-4 w-4" />
            Kalem Ekle
          </Button>
        </div>
        <div className="space-y-3">
          {quoteLines.map((line, index) => {
            const stockLookupKey = `quote-line-stock-${line.clientId}`;
            const catalogLookupKey = `quote-line-catalog-${line.clientId}`;
            return (
              <div key={line.clientId} className="rounded-3xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">Kalem {index + 1}</p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{line.erpStockLabel || line.catalogProductLabel || line.requestedName || 'Ürün seçilmedi'}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" disabled={quoteLines.length === 1} onClick={() => removeQuoteLine(line.clientId)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Sil
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-12">
                  <div className="space-y-2 md:col-span-6">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">ERP Stok</span>
                    <PagedLookupDialog<StockLookup>
                      open={activeLookupField === stockLookupKey}
                      onOpenChange={(open) => setActiveLookupField(open ? stockLookupKey : null)}
                      value={line.erpStockLabel || null}
                      placeholder="ERP stok seç"
                      searchPlaceholder="Stok kodu, adı veya üretici kodu ara"
                      queryKey={['b2b-quote-line-stock', line.clientId]}
                      title="Teklif Kalemi İçin ERP Stok Seç"
                      description="CRM teklif/sipariş mantığı gibi satıra ürün kartı bağlayın."
                      emptyText="Stok bulunamadı."
                      fetchPage={({ pageNumber, pageSize, search, signal }) => lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })}
                      getKey={(item) => String(item.id)}
                      getLabel={(item) => `${item.stokKodu} - ${item.stokAdi}`}
                      onSelect={(item) => updateQuoteLine(line.clientId, {
                        erpStockId: String(item.id),
                        erpStockLabel: `${item.stokKodu} - ${item.stokAdi}`,
                        requestedSku: item.stokKodu,
                        requestedName: item.stokAdi,
                      })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-6">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Katalog Ürün</span>
                    <PagedLookupDialog<CatalogProductDto>
                      open={activeLookupField === catalogLookupKey}
                      onOpenChange={(open) => setActiveLookupField(open ? catalogLookupKey : null)}
                      value={line.catalogProductLabel || null}
                      placeholder="Katalog ürünü seç"
                      searchPlaceholder="SKU, ürün adı, marka ara"
                      queryKey={['b2b-quote-line-catalog', line.clientId]}
                      title="Teklif Kalemi İçin Katalog Ürünü Seç"
                      description="Portal kataloğundaki ürün kartlarından seçim yapın."
                      emptyText="Katalog ürünü bulunamadı."
                      fetchPage={({ pageNumber, pageSize, search }) => b2bApi.getCatalogProducts({ pageNumber, pageSize, search })}
                      getKey={(item) => String(item.id)}
                      getLabel={(item) => `${item.sku} - ${item.name}`}
                      onSelect={(item) => updateQuoteLine(line.clientId, {
                        catalogProductId: String(item.id),
                        catalogProductLabel: `${item.sku} - ${item.name}`,
                        requestedSku: item.sku,
                        requestedName: item.name,
                      })}
                    />
                  </div>
                  <label className="space-y-2 md:col-span-3">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Talep SKU</span>
                    <Input value={line.requestedSku} onChange={(event) => updateQuoteLine(line.clientId, { requestedSku: event.target.value })} />
                  </label>
                  <label className="space-y-2 md:col-span-5">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ürün Adı</span>
                    <Input value={line.requestedName} onChange={(event) => updateQuoteLine(line.clientId, { requestedName: event.target.value })} />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Miktar</span>
                    <Input type="number" min="0" value={line.quantity} onChange={(event) => updateQuoteLine(line.clientId, { quantity: event.target.value })} />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">KDV %</span>
                    <Input type="number" value={line.vatRate} onChange={(event) => updateQuoteLine(line.clientId, { vatRate: event.target.value })} />
                  </label>
                  <label className="space-y-2 md:col-span-3">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Hedef Fiyat</span>
                    <Input type="number" value={line.targetUnitPrice} onChange={(event) => updateQuoteLine(line.clientId, { targetUnitPrice: event.target.value })} />
                  </label>
                  <label className="space-y-2 md:col-span-3">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">İskonto %</span>
                    <Input type="number" value={line.discountRate1} onChange={(event) => updateQuoteLine(line.clientId, { discountRate1: event.target.value })} />
                  </label>
                  <label className="space-y-2 md:col-span-3">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">İskonto Tutar</span>
                    <Input type="number" value={line.discountAmount1} onChange={(event) => updateQuoteLine(line.clientId, { discountAmount1: event.target.value })} />
                  </label>
                  <label className="space-y-2 md:col-span-3">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Satır Notu</span>
                    <Input value={line.description} onChange={(event) => updateQuoteLine(line.clientId, { description: event.target.value })} />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 crm-page">
      <Breadcrumb
        items={[
          { label: 'B2B' },
          { label: config.breadcrumb },
          { label: isEdit ? 'Düzenle' : 'Oluştur', isActive: true },
        ]}
      />
      <FormPageShell
        title={isEdit ? `${config.title} Düzenle` : `${config.title} Oluştur`}
        description={config.description}
        isLoading={detailQuery.isLoading}
        isError={Boolean(detailQuery.error)}
        errorTitle="Kayıt yüklenemedi"
        errorDescription={(detailQuery.error as Error | undefined)?.message}
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(`/b2b/${routeSlugByKind[kind]}`)}>
              Listeye Dön
            </Button>
            <Button type="button" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        )}
        className="border-slate-200/80 shadow-sm dark:border-white/10 dark:bg-white/3"
      >
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate();
          }}
        >
          {kind === 'catalog' ? (
            <div className="md:col-span-2 rounded-3xl border border-emerald-200/80 bg-emerald-50/80 p-4 text-sm text-emerald-950 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-50">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-white/80 p-3 dark:bg-white/5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">1. Ürünü seç</p>
                  <p className="mt-1 font-semibold">ERP stok kartını arayıp seçin.</p>
                </div>
                <div className="rounded-2xl bg-white/80 p-3 dark:bg-white/5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">2. Bilgiyi kontrol et</p>
                  <p className="mt-1 font-semibold">Ad, marka ve kategori otomatik dolar; sadece gerekirse düzeltin.</p>
                </div>
                <div className="rounded-2xl bg-white/80 p-3 dark:bg-white/5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">3. Yayınla</p>
                  <p className="mt-1 font-semibold">Portalda görünsün istiyorsanız yayın anahtarını açın.</p>
                </div>
              </div>
              {values.sku ? (
                <div className="mt-3 rounded-2xl border border-emerald-200/70 bg-white/75 px-4 py-3 dark:border-emerald-400/15 dark:bg-white/5">
                  <span className="font-semibold">Seçilen ERP stok:</span> {values.sku}
                  {lookupLabels.defaultStockId ? <span className="text-emerald-700 dark:text-emerald-200"> · {lookupLabels.defaultStockId}</span> : null}
                </div>
              ) : null}
            </div>
          ) : null}
          {formConfig.fields.map((field) => {
            if (field.hidden) return null;
            const value = values[field.name] ?? '';
            const fieldId = `b2b-${kind}-${field.name}`;
            const wrapperClass = field.colSpan === 'full' ? 'space-y-2 md:col-span-2' : 'space-y-2';
            if (field.type === 'switch') {
              return (
                <label key={field.name} htmlFor={fieldId} className={`${wrapperClass} flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-white/10 dark:bg-white/5`}>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{field.label}</span>
                  <Switch id={fieldId} checked={Boolean(value)} onCheckedChange={(checked) => updateValue(field.name, checked)} />
                </label>
              );
            }
            if (field.type === 'lookup') {
              return (
                <label key={field.name} htmlFor={fieldId} className={wrapperClass}>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {field.label}{field.required ? ' *' : ''}
                  </span>
                  {renderLookupField(field)}
                  {field.helpText ? <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">{field.helpText}</span> : null}
                </label>
              );
            }
            if (field.type === 'currency') {
              return (
                <label key={field.name} htmlFor={fieldId} className={wrapperClass}>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {field.label}{field.required ? ' *' : ''}
                  </span>
                  <Select value={String(value || 'TRY')} onValueChange={(selectedValue) => updateValue(field.name, selectedValue)}>
                    <SelectTrigger id={fieldId} className="h-12 w-full rounded-2xl border-slate-200 bg-white/85 px-4 text-sm font-semibold text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-100">
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
                  {field.helpText ? <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">{field.helpText}</span> : null}
                </label>
              );
            }
            if (field.type === 'select') {
              return (
                <label key={field.name} htmlFor={fieldId} className={wrapperClass}>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {field.label}{field.required ? ' *' : ''}
                  </span>
                  <Select value={String(value || '')} onValueChange={(selectedValue) => updateValue(field.name, selectedValue)}>
                    <SelectTrigger id={fieldId} className="h-12 w-full rounded-2xl border-slate-200 bg-white/85 px-4 text-sm font-semibold text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-100">
                      <SelectValue placeholder={`${field.label} seç`} />
                    </SelectTrigger>
                    <SelectContent>
                      {(field.options ?? []).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.helpText ? <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">{field.helpText}</span> : null}
                </label>
              );
            }
            return (
              <label key={field.name} htmlFor={fieldId} className={wrapperClass}>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {field.label}{field.required ? ' *' : ''}
                </span>
                {field.type === 'textarea' ? (
                  <Textarea
                    id={fieldId}
                    value={String(value)}
                    placeholder={field.placeholder}
                    onChange={(event) => updateValue(field.name, event.target.value)}
                  />
                ) : (
                  <Input
                    id={fieldId}
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'datetime-local' : 'text'}
                    value={String(value)}
                    placeholder={field.placeholder}
                    onChange={(event) => updateValue(field.name, event.target.value)}
                  />
                )}
                {field.helpText ? <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">{field.helpText}</span> : null}
              </label>
            );
          })}
          {renderQuoteLinesEditor()}
          {formError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200 md:col-span-2">
              {formError}
            </div>
          ) : null}
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </FormPageShell>
    </div>
  );
}

export function B2bRecordCreatePage(): ReactElement {
  return <B2bRecordFormPage mode="create" />;
}

export function B2bRecordEditPage(): ReactElement {
  return <B2bRecordFormPage mode="edit" />;
}

export function B2bRecordDetailPage(): ReactElement {
  const { workspaceKind, id } = useParams();
  const navigate = useNavigate();
  const kind = resolveRouteKind(workspaceKind);
  const config = configs[kind];
  const recordId = id ? Number(id) : undefined;
  const [priceItemValues, setPriceItemValues] = useState({ erpStockId: '', erpStockLabel: '', unitPrice: '', minQuantity: '1', discountRate: '', validFrom: '', validTo: '' });
  const [priceItemLookupOpen, setPriceItemLookupOpen] = useState(false);
  const detailQuery = useQuery({
    queryKey: ['b2b-record-detail', kind, recordId],
    queryFn: async () => {
      if (!recordId) return null;
      if (kind === 'catalog') return b2bApi.getCatalogProduct(recordId);
      if (kind === 'pricing') return b2bApi.getPriceList(recordId);
      if (kind === 'quotes') return b2bApi.getQuote(recordId);
      if (kind === 'orders') return b2bApi.getOrder(recordId);
      return null;
    },
    enabled: ['catalog', 'pricing', 'quotes', 'orders'].includes(kind) && Boolean(recordId),
  });
  const priceItemMutation = useMutation({
    mutationFn: async () => {
      if (!recordId) throw new Error('Fiyat listesi bulunamadı.');
      const erpStockId = Number(priceItemValues.erpStockId);
      const unitPrice = Number(priceItemValues.unitPrice);
      const minQuantity = Number(priceItemValues.minQuantity || '1');
      if (!Number.isFinite(erpStockId) || erpStockId <= 0) throw new Error('Ürün seçin.');
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) throw new Error('Geçerli fiyat girin.');
      await b2bApi.upsertPriceListItem(recordId, {
        erpStockId,
        unitPrice,
        minQuantity: Number.isFinite(minQuantity) && minQuantity > 0 ? minQuantity : 1,
        discountRate: priceItemValues.discountRate ? Number(priceItemValues.discountRate) : null,
        currencyCode: (detailQuery.data as CustomerPriceListDto | undefined)?.currencyCode ?? 'TRY',
        validFrom: priceItemValues.validFrom || null,
        validTo: priceItemValues.validTo || null,
      });
    },
    onSuccess: async () => {
      setPriceItemValues({ erpStockId: '', erpStockLabel: '', unitPrice: '', minQuantity: '1', discountRate: '', validFrom: '', validTo: '' });
      await detailQuery.refetch();
    },
  });

  useEffect(() => {
    useUIStore.getState().setPageTitle(`${config.title} Detay`);
    return () => useUIStore.getState().setPageTitle(null);
  }, [config.title]);

  if (!['catalog', 'pricing', 'quotes', 'orders'].includes(kind)) {
    return <Navigate to={`/b2b/${routeSlugByKind[kind]}`} replace />;
  }

  const item = detailQuery.data as CatalogProductDto | CustomerPriceListDto | QuoteRequestDto | OrderDto | null | undefined;
  const priceList = kind === 'pricing' ? item as CustomerPriceListDto | null | undefined : null;
  const quote = kind === 'quotes' ? item as QuoteRequestDto | null | undefined : null;
  const order = kind === 'orders' ? item as OrderDto | null | undefined : null;
  const catalog = kind === 'catalog' ? item as CatalogProductDto | null | undefined : null;

  return (
    <div className="w-full space-y-6 crm-page">
      <Breadcrumb
        items={[
          { label: 'B2B' },
          { label: config.breadcrumb },
          { label: 'Detay', isActive: true },
        ]}
      />
      <DetailPageShell
        title={`${config.title} Detay`}
        description={catalog ? `${catalog.sku} - ${catalog.name}` : priceList ? `${priceList.code} - ${priceList.name}` : quote ? `${quote.offerNo || quote.quoteNumber}` : order ? `${order.offerNo || order.orderNumber}` : config.description}
        isLoading={detailQuery.isLoading}
        isError={Boolean(detailQuery.error)}
        errorTitle="Kayıt yüklenemedi"
        errorDescription={(detailQuery.error as Error | undefined)?.message}
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(`/b2b/${routeSlugByKind[kind]}`)}>
              Listeye Dön
            </Button>
            {editSupportedKinds.has(kind) ? (
              <Button type="button" onClick={() => navigate(`/b2b/${routeSlugByKind[kind]}/${id}/edit`)}>
                Düzenle
              </Button>
            ) : null}
          </div>
        )}
        className="border-slate-200/80 shadow-sm dark:border-white/10 dark:bg-white/3"
      >
        {catalog ? <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">SKU</p>
            <p className="mt-2 font-mono text-slate-900 dark:text-white">{catalog.sku}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ürün Adı</p>
            <p className="mt-2 font-semibold text-slate-900 dark:text-white">{catalog.name}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Durum</p>
            <p className="mt-2 text-slate-900 dark:text-white">{catalog.isPublished ? 'Yayında' : 'Taslak'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Marka</p>
            <p className="mt-2 text-slate-900 dark:text-white">{catalog.brand || '-'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ürün Tipi</p>
            <p className="mt-2 text-slate-900 dark:text-white">{catalog.productType || '-'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Üretici Kodu</p>
            <p className="mt-2 text-slate-900 dark:text-white">{catalog.manufacturerCode || '-'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Barkod</p>
            <p className="mt-2 text-slate-900 dark:text-white">{catalog.barcode || '-'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Birim / Paket</p>
            <p className="mt-2 text-slate-900 dark:text-white">{[catalog.unit, catalog.packageQuantity ? `${formatNumber(catalog.packageQuantity)} paket` : null].filter(Boolean).join(' / ') || '-'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Katalog Doluluk</p>
            <p className="mt-2 text-slate-900 dark:text-white">%{catalog.completenessScore ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kategori</p>
            <p className="mt-2 text-slate-900 dark:text-white">{catalog.categoryPath || '-'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ERP Stok</p>
            <p className="mt-2 text-slate-900 dark:text-white">{catalog.defaultStockId ? 'ERP stok bağlı' : '-'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5 md:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kısa Tanıtım</p>
            <p className="mt-2 whitespace-pre-wrap text-slate-900 dark:text-white">{catalog.shortDescription || '-'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5 md:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Açıklama</p>
            <p className="mt-2 whitespace-pre-wrap text-slate-900 dark:text-white">{catalog.description || '-'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5 md:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Teknik Özellikler</p>
            <p className="mt-2 whitespace-pre-wrap font-mono text-xs text-slate-900 dark:text-white">{catalog.attributesJson || '-'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5 md:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Görseller ve Dokümanlar</p>
            <p className="mt-2 whitespace-pre-wrap font-mono text-xs text-slate-900 dark:text-white">{[catalog.mediaGalleryJson, catalog.documentsJson].filter(Boolean).join('\n') || '-'}</p>
          </div>
        </div> : null}
        {priceList ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <SummaryTile label="Liste" value={priceList.code} />
              <SummaryTile label="Para Birimi" value={priceList.currencyCode} />
              <SummaryTile label="Kapsam" value={priceList.customerId ? 'Cari özel' : priceList.customerGroupCode ? 'Cari grup' : 'Genel'} />
              <SummaryTile label="Durum" value={priceList.isActive ? 'Aktif' : 'Pasif'} />
            </div>
            <Card className="border-slate-200/80 shadow-sm dark:border-white/10 dark:bg-white/3">
              <CardHeader><CardTitle>Fiyat Satırı Ekle</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_120px_120px_120px_auto]">
                <PagedLookupDialog<StockLookup>
                  open={priceItemLookupOpen}
                  onOpenChange={setPriceItemLookupOpen}
                  value={priceItemValues.erpStockLabel || null}
                  placeholder="Ürün seç"
                  searchPlaceholder="Stok kodu, ürün adı veya üretici kodu ara"
                  title="Fiyat Verilecek Ürünü Seç"
                  description="Kullanıcı ID girmez; ERP stok kartından ürün seçer."
                  emptyText="Ürün bulunamadı."
                  queryKey={['b2b-price-item-stock']}
                  fetchPage={({ pageNumber, pageSize, search, signal }) => lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })}
                  getKey={(stock) => String(stock.id)}
                  getLabel={(stock) => `${stock.stokKodu} - ${stock.stokAdi}`}
                  onSelect={(stock) => setPriceItemValues((current) => ({ ...current, erpStockId: String(stock.id), erpStockLabel: `${stock.stokKodu} - ${stock.stokAdi}` }))}
                />
                <Input type="number" placeholder="Fiyat" value={priceItemValues.unitPrice} onChange={(event) => setPriceItemValues((current) => ({ ...current, unitPrice: event.target.value }))} />
                <Input type="number" placeholder="Min. miktar" value={priceItemValues.minQuantity} onChange={(event) => setPriceItemValues((current) => ({ ...current, minQuantity: event.target.value }))} />
                <Input type="number" placeholder="İskonto %" value={priceItemValues.discountRate} onChange={(event) => setPriceItemValues((current) => ({ ...current, discountRate: event.target.value }))} />
                <Button type="button" disabled={priceItemMutation.isPending} onClick={() => priceItemMutation.mutate()}>
                  Satır Ekle
                </Button>
                {priceItemMutation.error ? <div className="text-sm font-semibold text-red-600 md:col-span-5">{(priceItemMutation.error as Error).message}</div> : null}
              </CardContent>
            </Card>
            <LineTable
              title="Manuel Fiyat Satırları"
              headers={['Ürün', 'Min. miktar', 'Fiyat', 'İskonto', 'Geçerlilik']}
              rows={(priceList.items ?? []).map((line) => [
                line.erpStockId ? 'ERP stok kartı' : line.catalogProductId ? 'Katalog ürünü' : '-',
                line.minQuantity ?? 1,
                formatMoney(line.unitPrice, line.currencyCode),
                line.discountRate ? `%${line.discountRate}` : '-',
                [formatDate(line.validFrom), formatDate(line.validTo)].filter((value) => value !== '-').join(' / ') || '-',
              ])}
            />
          </div>
        ) : null}
        {quote ? <CommercialDetail kind="quote" record={quote} /> : null}
        {order ? <CommercialDetail kind="order" record={order} /> : null}
      </DetailPageShell>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string | number | null | undefined }): ReactElement {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 font-semibold text-slate-900 dark:text-white">{value ?? '-'}</p>
    </div>
  );
}

function LineTable({ title, headers, rows }: { title: string; headers: string[]; rows: Array<Array<string | number>> }): ReactElement {
  return (
    <Card className="border-slate-200/80 shadow-sm dark:border-white/10 dark:bg-white/3">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>{headers.map((header) => <th key={header} className="border-b border-slate-200 px-3 py-2 dark:border-white/10">{header}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row, index) => (
              <tr key={index} className="border-b border-slate-100 dark:border-white/5">
                {row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`} className="px-3 py-3 text-slate-700 dark:text-slate-200">{cell}</td>)}
              </tr>
            )) : (
              <tr><td colSpan={headers.length} className="px-3 py-8 text-center text-slate-500">Kayıt yok.</td></tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function CommercialDetail({ kind, record }: { kind: 'quote'; record: QuoteRequestDto } | { kind: 'order'; record: OrderDto }): ReactElement {
  const rows = kind === 'quote'
    ? (record.lines ?? []).map((line) => [
        line.requestedName || line.requestedSku || (line.erpStockId ? 'ERP stok kartı' : '-'),
        line.quantity,
        formatMoney(line.approvedUnitPrice ?? line.targetUnitPrice ?? 0, record.currencyCode),
        `%${line.vatRate ?? 0}`,
        line.priceSource || '-',
        formatMoney(line.lineGrandTotal ?? line.lineTotal ?? 0, record.currencyCode),
      ])
    : (record.lines ?? []).map((line) => [
        line.productName || line.productSku || (line.erpStockId ? 'ERP stok kartı' : '-'),
        line.quantity,
        formatMoney(line.unitPrice, record.currencyCode),
        `%${line.vatRate ?? 0}`,
        line.priceSource || '-',
        formatMoney(line.lineGrandTotal ?? line.lineTotal ?? 0, record.currencyCode),
      ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryTile label={kind === 'quote' ? 'Teklif No' : 'Sipariş No'} value={kind === 'quote' ? record.offerNo || record.quoteNumber : record.offerNo || record.orderNumber} />
        <SummaryTile label="Revizyon" value={record.revisionNo || '-'} />
        <SummaryTile label="Durum" value={record.status} />
        <SummaryTile label="Toplam" value={formatMoney(kind === 'quote' ? record.estimatedTotal : record.grandTotal, record.currencyCode)} />
      </div>
      <LineTable
        title={kind === 'quote' ? 'Teklif Satırları' : 'Sipariş Satırları'}
        headers={['Ürün', 'Miktar', 'Birim Fiyat', 'KDV', 'Kaynak', 'Satır Toplam']}
        rows={rows}
      />
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
