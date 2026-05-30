import type { ReactElement } from 'react';

export interface NavItem {
  title: string;
  titleFallback?: string;
  href?: string;
  icon?: ReactElement;
  children?: NavItem[];
}

const dashboardIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
);

const masterDataIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" />
    <path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3" />
  </svg>
);

const b2bIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const accessControlIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const B2B_NAV_ITEMS: NavItem[] = [
  {
    title: 'sidebar.dashboard',
    titleFallback: 'Dashboard',
    href: '/dashboard',
    icon: dashboardIcon,
  },
  {
    title: 'sidebar.b2b',
    titleFallback: 'B2B',
    icon: b2bIcon,
    children: [
      {
        title: 'sidebar.b2bOperationsGroup',
        titleFallback: 'Operasyon',
        children: [
          { title: 'sidebar.b2bInsights', titleFallback: 'Hazırlık Paneli', href: '/b2b/insights' },
          { title: 'sidebar.b2bCompanies', titleFallback: 'Şirket Hesapları', href: '/b2b/companies' },
          { title: 'sidebar.b2bBuyers', titleFallback: 'Alıcılar', href: '/b2b/buyers' },
          { title: 'sidebar.b2bShoppingLists', titleFallback: 'Alışveriş Listeleri', href: '/b2b/shopping-lists' },
          { title: 'sidebar.b2bApprovalRules', titleFallback: 'Satın Alma Onayları', href: '/b2b/approval-rules' },
        ],
      },
      {
        title: 'sidebar.b2bCatalogGroup',
        titleFallback: 'Katalog ve Ticari Kurallar',
        children: [
          { title: 'sidebar.b2bCatalog', titleFallback: 'Katalog', href: '/b2b/catalog' },
          { title: 'sidebar.b2bProductMatches', titleFallback: 'Ürün Eşleştirme', href: '/b2b/product-matches' },
          { title: 'sidebar.b2bCatalogVisibility', titleFallback: 'Katalog Görünürlüğü', href: '/b2b/catalog-visibility' },
          { title: 'sidebar.b2bPricing', titleFallback: 'Müşteri Fiyatları', href: '/b2b/pricing' },
          { title: 'sidebar.b2bInventory', titleFallback: 'Stok Görünürlüğü', href: '/b2b/inventory' },
        ],
      },
      {
        title: 'sidebar.b2bCommercialGroup',
        titleFallback: 'Satış Süreci',
        children: [
          { title: 'sidebar.b2bQuotes', titleFallback: 'Teklif Talepleri', href: '/b2b/quotes' },
          { title: 'sidebar.b2bOrders', titleFallback: 'Siparişler', href: '/b2b/orders' },
          { title: 'sidebar.b2bPayments', titleFallback: 'Ödeme', href: '/b2b/payments' },
          { title: 'sidebar.b2bPaymentOperations', titleFallback: 'Ödeme Operasyonları', href: '/b2b/payment-operations' },
          { title: 'sidebar.b2bMarketplaceChannels', titleFallback: 'Pazar Yeri Kanalları', href: '/b2b/marketplace-channels' },
          { title: 'sidebar.b2bMarketplaceListings', titleFallback: 'Pazar Yeri Ürünleri', href: '/b2b/marketplace-listings' },
          { title: 'sidebar.b2bMarketplaceEvents', titleFallback: 'Pazar Yeri Aktarımları', href: '/b2b/marketplace-events' },
          { title: 'sidebar.b2bMarketplaceSettings', titleFallback: 'Pazar Yeri Ayarları', href: '/b2b/marketplace-settings' },
          { title: 'sidebar.b2bIntegrations', titleFallback: 'ERP Entegrasyon', href: '/b2b/integrations' },
        ],
      },
    ],
  },
  {
    title: 'sidebar.masterDataGroup',
    titleFallback: 'ERP ve Eşleme',
    icon: masterDataIcon,
    children: [
      {
        title: 'sidebar.erp',
        titleFallback: 'ERP',
        children: [
          { title: 'sidebar.erpCustomers', titleFallback: 'Cariler', href: '/erp/customers' },
          { title: 'sidebar.erpStocks', titleFallback: 'Stoklar', href: '/erp/stocks' },
          { title: 'sidebar.erpWarehouses', titleFallback: 'Depolar', href: '/erp/warehouses' },
          { title: 'sidebar.erpYapKodlar', titleFallback: 'YapKodlar', href: '/erp/yapkodlar' },
        ],
      },
    ],
  },
  {
    title: 'sidebar.accessControl',
    titleFallback: 'Yetki ve Sistem',
    icon: accessControlIcon,
    children: [
      {
        title: 'sidebar.accessControlManagementGroup',
        titleFallback: 'Yetki ve Kullanıcı Yönetimi',
        children: [
          { title: 'sidebar.userManagement', titleFallback: 'Kullanıcı Yönetimi', href: '/access-control/users' },
          { title: 'sidebar.permissionDefinitions', titleFallback: 'Yetki Tanımları', href: '/access-control/permission-definitions' },
          { title: 'sidebar.permissionGroups', titleFallback: 'Yetki Grupları', href: '/access-control/permission-groups' },
          { title: 'sidebar.userGroupAssignments', titleFallback: 'Kullanıcı Grup Atamaları', href: '/access-control/user-group-assignments' },
          { title: 'sidebar.b2bScopePolicies', titleFallback: 'B2B Kapsam Politikaları', href: '/access-control/wms-scope-policies' },
          { title: 'sidebar.b2bScopeAssignments', titleFallback: 'B2B Kapsam Atamaları', href: '/access-control/wms-scope-assignments' },
        ],
      },
      {
        title: 'sidebar.accessControlSystemGroup',
        titleFallback: 'Sistem Araçları',
        children: [
          { title: 'sidebar.mailSettings', titleFallback: 'SMTP / Mail Ayarları', href: '/users/mail-settings' },
          { title: 'sidebar.hangfireMonitoring', titleFallback: 'Hangfire İzleme', href: '/hangfire-monitoring' },
          { title: 'sidebar.traceExplorer', titleFallback: 'İz Takibi', href: '/trace-explorer' },
        ],
      },
    ],
  },
];

export const WMS_NAV_ITEMS = B2B_NAV_ITEMS;
