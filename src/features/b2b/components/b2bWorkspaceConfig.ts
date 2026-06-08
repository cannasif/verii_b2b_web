import type { B2bWorkspaceKind } from '../types/b2b.types';

export type B2bWorkspacePageKind = Exclude<B2bWorkspaceKind, 'payments' | 'payment-operations'>;

export interface WorkspaceConfig {
  title: string;
  description: string;
  breadcrumb: string;
  emptyState: string;
}

export const configs: Record<B2bWorkspacePageKind, WorkspaceConfig> = {
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
  'marketplace-channels': {
    title: 'Pazar Yeri Kanalları',
    description: 'Trendyol, Hepsiburada, Amazon ve Etsy mağaza bağlantılarını ayrı kanal olarak yönetin.',
    breadcrumb: 'Pazar Yerleri',
    emptyState: 'Henüz pazar yeri kanalı yok.',
  },
  'marketplace-listings': {
    title: 'Pazar Yeri Ürün Yayınları',
    description: 'B2B katalog ürünlerini pazar yeri SKU/listing kayıtlarıyla eşleştirip fiyat ve stok aktarımını hazırlayın.',
    breadcrumb: 'Ürün Yayınları',
    emptyState: 'Henüz pazar yeri ürün yayını yok.',
  },
  'marketplace-events': {
    title: 'Pazar Yeri Aktarım Kuyruğu',
    description: 'Ürün ekleme, fiyat güncelleme, stok güncelleme ve sipariş çekme operasyonlarını sağlayıcı bazında takip edin.',
    breadcrumb: 'Aktarım Kuyruğu',
    emptyState: 'Henüz pazar yeri aktarım kaydı yok.',
  },
  integrations: {
    title: 'ERP Entegrasyon Kuyruğu',
    description: 'Sipariş, teklif ve ödeme gibi kritik olayların ERP’ye aktarım durumunu izleyin.',
    breadcrumb: 'Entegrasyon',
    emptyState: 'Henüz entegrasyon olayı yok.',
  },
};

export const routeSlugByKind: Record<B2bWorkspacePageKind, string> = {
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
  'marketplace-channels': 'marketplace-channels',
  'marketplace-listings': 'marketplace-listings',
  'marketplace-events': 'marketplace-events',
  integrations: 'integrations',
};

export const kindByRouteSlug = Object.fromEntries(
  Object.entries(routeSlugByKind).map(([kind, slug]) => [slug, kind]),
) as Record<string, B2bWorkspacePageKind>;

export const editSupportedKinds = new Set<B2bWorkspacePageKind>(['catalog']);
