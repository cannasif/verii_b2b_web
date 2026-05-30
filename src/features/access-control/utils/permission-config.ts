export const ROUTE_PERMISSION_MAP: Record<string, string> = {
  '/': 'dashboard.view',
  '/dashboard': 'dashboard.view',

  '/b2b/insights': 'b2b.insights.view',
  '/b2b/companies': 'b2b.companies.view',
  '/b2b/buyers': 'b2b.buyers.view',
  '/b2b/catalog': 'b2b.catalog.view',
  '/b2b/product-matches': 'b2b.product-matches.view',
  '/b2b/catalog-visibility': 'b2b.catalog-visibility.view',
  '/b2b/pricing': 'b2b.pricing.view',
  '/b2b/inventory': 'b2b.inventory.view',
  '/b2b/shopping-lists': 'b2b.shopping-lists.view',
  '/b2b/approval-rules': 'b2b.approval-rules.view',
  '/b2b/quotes': 'b2b.quotes.view',
  '/b2b/orders': 'b2b.orders.view',
  '/b2b/payments': 'b2b.payments.view',
  '/b2b/marketplace-channels': 'b2b.marketplace-channels.view',
  '/b2b/marketplace-listings': 'b2b.marketplace-listings.view',
  '/b2b/marketplace-events': 'b2b.marketplace-events.view',
  '/b2b/marketplace-settings': 'b2b.marketplace-settings.view',
  '/b2b/integrations': 'b2b.integrations.view',

  '/erp/customers': 'erp.customers.view',
  '/erp/stocks': 'erp.stocks.view',
  '/erp/warehouses': 'erp.warehouses.view',
  '/erp/yapkodlar': 'erp.yapkodlar.view',

  '/access-control/permission-definitions': 'access-control.permission-definitions.view',
  '/access-control/permission-groups': 'access-control.permission-groups.view',
  '/access-control/user-group-assignments': 'access-control.user-group-assignments.view',
  '/access-control/wms-scope-policies': 'access-control.wms-scope-policies.view',
  '/access-control/wms-scope-assignments': 'access-control.wms-scope-assignments.view',
  '/users/mail-settings': 'access-control.mail-settings.view',
  '/hangfire-monitoring': 'access-control.hangfire-monitoring.view',
  '/trace-explorer': 'access-control.trace-explorer.view',
};

export const PATH_TO_PERMISSION_PATTERNS: Array<{ pattern: RegExp; permission: string }> = [
  { pattern: /^\/$/, permission: 'dashboard.view' },
  { pattern: /^\/dashboard(\/|$)/, permission: 'dashboard.view' },

  { pattern: /^\/b2b\/insights(\/|$)/, permission: 'b2b.insights.view' },
  { pattern: /^\/b2b\/companies(\/|$)/, permission: 'b2b.companies.view' },
  { pattern: /^\/b2b\/buyers(\/|$)/, permission: 'b2b.buyers.view' },
  { pattern: /^\/b2b\/catalog-visibility(\/|$)/, permission: 'b2b.catalog-visibility.view' },
  { pattern: /^\/b2b\/catalog(\/|$)/, permission: 'b2b.catalog.view' },
  { pattern: /^\/b2b\/product-matches(\/|$)/, permission: 'b2b.product-matches.view' },
  { pattern: /^\/b2b\/pricing(\/|$)/, permission: 'b2b.pricing.view' },
  { pattern: /^\/b2b\/inventory(\/|$)/, permission: 'b2b.inventory.view' },
  { pattern: /^\/b2b\/shopping-lists(\/|$)/, permission: 'b2b.shopping-lists.view' },
  { pattern: /^\/b2b\/approval-rules(\/|$)/, permission: 'b2b.approval-rules.view' },
  { pattern: /^\/b2b\/quotes(\/|$)/, permission: 'b2b.quotes.view' },
  { pattern: /^\/b2b\/orders(\/|$)/, permission: 'b2b.orders.view' },
  { pattern: /^\/b2b\/payments(\/|$)/, permission: 'b2b.payments.view' },
  { pattern: /^\/b2b\/marketplace-channels(\/|$)/, permission: 'b2b.marketplace-channels.view' },
  { pattern: /^\/b2b\/marketplace-listings(\/|$)/, permission: 'b2b.marketplace-listings.view' },
  { pattern: /^\/b2b\/marketplace-events(\/|$)/, permission: 'b2b.marketplace-events.view' },
  { pattern: /^\/b2b\/marketplace-settings(\/|$)/, permission: 'b2b.marketplace-settings.view' },
  { pattern: /^\/b2b\/integrations(\/|$)/, permission: 'b2b.integrations.view' },

  { pattern: /^\/erp\/customers(\/|$)/, permission: 'erp.customers.view' },
  { pattern: /^\/erp\/stocks(\/|$)/, permission: 'erp.stocks.view' },
  { pattern: /^\/erp\/warehouses(\/|$)/, permission: 'erp.warehouses.view' },
  { pattern: /^\/erp\/yapkodlar(\/|$)/, permission: 'erp.yapkodlar.view' },

  { pattern: /^\/access-control\/permission-definitions(\/|$)/, permission: 'access-control.permission-definitions.view' },
  { pattern: /^\/access-control\/permission-groups(\/|$)/, permission: 'access-control.permission-groups.view' },
  { pattern: /^\/access-control\/user-group-assignments(\/|$)/, permission: 'access-control.user-group-assignments.view' },
  { pattern: /^\/access-control\/wms-scope-policies(\/|$)/, permission: 'access-control.wms-scope-policies.view' },
  { pattern: /^\/access-control\/wms-scope-assignments(\/|$)/, permission: 'access-control.wms-scope-assignments.view' },
  { pattern: /^\/users\/mail-settings(\/|$)/, permission: 'access-control.mail-settings.view' },
  { pattern: /^\/hangfire-monitoring(\/|$)/, permission: 'access-control.hangfire-monitoring.view' },
  { pattern: /^\/trace-explorer(\/|$)/, permission: 'access-control.trace-explorer.view' },
];

const PERMISSION_ACTIONS = ['view', 'create', 'update', 'delete'] as const;

type PermissionAction = (typeof PERMISSION_ACTIONS)[number];
type PermissionScopeDisplay = { key: string; fallback: string };

export function isLeafPermissionCode(code: string): boolean {
  if (code === 'dashboard.view') return true;
  const parts = code.split('.').filter(Boolean);
  const last = parts[parts.length - 1];
  return !!last && PERMISSION_ACTIONS.includes(last as PermissionAction);
}

export const ACCESS_CONTROL_ADMIN_PERMISSIONS = [
  'access-control.permission-definitions.view',
  'access-control.permission-groups.view',
  'access-control.user-group-assignments.view',
  'access-control.wms-scope-policies.view',
  'access-control.wms-scope-assignments.view',
  'access-control.mail-settings.view',
  'access-control.hangfire-monitoring.view',
  'access-control.trace-explorer.view',
] as const;

export const RBAC_FALLBACK_PERMISSION = 'access-control.permission-definitions.view' as const;

export const ACCESS_CONTROL_ADMIN_FALLBACK_TO_SYSTEM_ADMIN = true as const;

export const ACCESS_CONTROL_ADMIN_ONLY_PATTERNS: RegExp[] = [];

export const PERMISSION_CODE_ALIASES: Record<string, string[]> = {
  'access-control.user-group-assignments.view': ['access-control.user-management.view'],
  'access-control.user-group-assignments.update': ['access-control.user-management.update'],
  'access-control.wms-scope-policies.view': ['access-control.b2b-scope-policies.view'],
  'access-control.wms-scope-assignments.view': [
    'access-control.b2b-scope-assignments.view',
    'access-control.wms-scope-policies.view',
  ],
};

export const PERMISSION_SCOPE_DISPLAY: Record<string, PermissionScopeDisplay> = {
  dashboard: { key: 'sidebar.dashboard', fallback: 'Dashboard' },

  'b2b.insights': { key: 'sidebar.b2bInsights', fallback: 'Hazırlık Paneli' },
  'b2b.companies': { key: 'sidebar.b2bCompanies', fallback: 'Şirket Hesapları' },
  'b2b.buyers': { key: 'sidebar.b2bBuyers', fallback: 'Alıcılar' },
  'b2b.catalog': { key: 'sidebar.b2bCatalog', fallback: 'Katalog' },
  'b2b.product-matches': { key: 'sidebar.b2bProductMatches', fallback: 'Ürün Eşleştirme' },
  'b2b.catalog-visibility': { key: 'sidebar.b2bCatalogVisibility', fallback: 'Katalog Görünürlüğü' },
  'b2b.pricing': { key: 'sidebar.b2bPricing', fallback: 'Müşteri Fiyatları' },
  'b2b.inventory': { key: 'sidebar.b2bInventory', fallback: 'Stok Görünürlüğü' },
  'b2b.shopping-lists': { key: 'sidebar.b2bShoppingLists', fallback: 'Alışveriş Listeleri' },
  'b2b.approval-rules': { key: 'sidebar.b2bApprovalRules', fallback: 'Satın Alma Onayları' },
  'b2b.quotes': { key: 'sidebar.b2bQuotes', fallback: 'Teklif Talepleri' },
  'b2b.orders': { key: 'sidebar.b2bOrders', fallback: 'Siparişler' },
  'b2b.payments': { key: 'sidebar.b2bPayments', fallback: 'Ödeme' },
  'b2b.marketplace-channels': { key: 'sidebar.b2bMarketplaceChannels', fallback: 'Pazar Yeri Kanalları' },
  'b2b.marketplace-listings': { key: 'sidebar.b2bMarketplaceListings', fallback: 'Pazar Yeri Ürünleri' },
  'b2b.marketplace-events': { key: 'sidebar.b2bMarketplaceEvents', fallback: 'Pazar Yeri Aktarımları' },
  'b2b.marketplace-settings': { key: 'sidebar.b2bMarketplaceSettings', fallback: 'Pazar Yeri Ayarları' },
  'b2b.integrations': { key: 'sidebar.b2bIntegrations', fallback: 'ERP Entegrasyon' },

  'erp.customers': { key: 'sidebar.erpCustomers', fallback: 'Cariler' },
  'erp.stocks': { key: 'sidebar.erpStocks', fallback: 'Stoklar' },
  'erp.warehouses': { key: 'sidebar.erpWarehouses', fallback: 'Depolar' },
  'erp.yapkodlar': { key: 'sidebar.erpYapKodlar', fallback: 'YapKodlar' },

  'access-control.permission-definitions': { key: 'sidebar.permissionDefinitions', fallback: 'Yetki Tanımları' },
  'access-control.permission-groups': { key: 'sidebar.permissionGroups', fallback: 'Yetki Grupları' },
  'access-control.user-group-assignments': { key: 'sidebar.userGroupAssignments', fallback: 'Kullanıcı Grup Atamaları' },
  'access-control.wms-scope-policies': { key: 'sidebar.b2bScopePolicies', fallback: 'B2B Kapsam Politikaları' },
  'access-control.wms-scope-assignments': { key: 'sidebar.b2bScopeAssignments', fallback: 'B2B Kapsam Atamaları' },
  'access-control.mail-settings': { key: 'sidebar.mailSettings', fallback: 'SMTP / Mail Ayarları' },
  'access-control.hangfire-monitoring': { key: 'sidebar.hangfireMonitoring', fallback: 'Hangfire İzleme' },
  'access-control.trace-explorer': { key: 'sidebar.traceExplorer', fallback: 'Trace Explorer' },
};

const ACTION_FALLBACKS: Record<PermissionAction, string> = {
  view: 'Görüntüle',
  create: 'Oluştur',
  update: 'Güncelle',
  delete: 'Sil',
};

function buildCrudPermissionDisplay(
  scope: string,
  meta: PermissionScopeDisplay,
): Record<string, PermissionScopeDisplay> {
  return Object.fromEntries(
    PERMISSION_ACTIONS.map((action) => [
      `${scope}.${action}`,
      {
        key: meta.key,
        fallback: `${meta.fallback} ${ACTION_FALLBACKS[action]}`,
      },
    ]),
  );
}

const CRUD_SCOPE_CODES = Object.keys(PERMISSION_SCOPE_DISPLAY).filter((scope) => scope !== 'dashboard');

export const PERMISSION_CODE_DISPLAY: Record<string, PermissionScopeDisplay> = {
  'dashboard.view': { key: 'sidebar.dashboard', fallback: 'Dashboard' },
  ...Object.fromEntries(
    CRUD_SCOPE_CODES.flatMap((scope) => Object.entries(buildCrudPermissionDisplay(scope, PERMISSION_SCOPE_DISPLAY[scope]))),
  ),
};

export function getPermissionDisplayMeta(code: string): { key: string; fallback: string } | null {
  return PERMISSION_CODE_DISPLAY[code] ?? null;
}

export function getPermissionScope(code: string): string {
  const parts = code.split('.').filter(Boolean);
  const last = parts[parts.length - 1];
  if (last && PERMISSION_ACTIONS.includes(last as PermissionAction)) {
    return parts.slice(0, -1).join('.');
  }
  return code;
}

export function getPermissionScopeDisplayMeta(scope: string): { key: string; fallback: string } | null {
  return PERMISSION_SCOPE_DISPLAY[scope] ?? null;
}

export function getPermissionModuleDisplayMeta(prefix: string): { key: string; fallback: string } | null {
  if (prefix === 'dashboard') {
    return { key: 'sidebar.dashboard', fallback: 'Dashboard' };
  }
  if (prefix === 'b2b') {
    return { key: 'sidebar.b2b', fallback: 'B2B' };
  }
  if (prefix === 'erp') {
    return { key: 'sidebar.masterDataGroup', fallback: 'ERP ve Mirror' };
  }
  if (prefix === 'access-control') {
    return { key: 'sidebar.accessControl', fallback: 'Erişim Kontrolü' };
  }
  return null;
}

export function getPermissionActionLabel(code: string): { key: string; fallback: string } {
  const parts = code.split('.').filter(Boolean);
  const action = parts[parts.length - 1];
  switch (action) {
    case 'create':
      return { key: 'common.create', fallback: 'Create' };
    case 'update':
      return { key: 'common.update', fallback: 'Update' };
    case 'delete':
      return { key: 'common.delete', fallback: 'Delete' };
    case 'view':
    default:
      return { key: 'common.view', fallback: 'View' };
  }
}

export const PERMISSION_CODE_CATALOG: string[] = Array.from(
  new Set(
    [...Object.values(ROUTE_PERMISSION_MAP), ...Object.keys(PERMISSION_CODE_DISPLAY)]
      .filter((code) => code && code !== 'admin-only')
      .map((code) => code.trim())
  )
).sort((a, b) => a.localeCompare(b));

export function isPermissionCodeAvailableOnMobile(code: string): boolean {
  return code === 'dashboard.view' || code.startsWith('b2b.');
}

export function getRoutesForPermissionCode(code: string): string[] {
  return Object.entries(ROUTE_PERMISSION_MAP)
    .filter(([, permission]) => permission === code)
    .map(([route]) => route)
    .sort((a, b) => a.localeCompare(b));
}
