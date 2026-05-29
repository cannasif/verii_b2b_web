import type { RouteObject } from 'react-router-dom';
import { lazyNamed, withRoute } from '../route-utils';

const B2bCompaniesPage = lazyNamed(() => import('@/features/b2b'), 'B2bCompaniesPage');
const B2bBuyersPage = lazyNamed(() => import('@/features/b2b'), 'B2bBuyersPage');
const B2bCatalogPage = lazyNamed(() => import('@/features/b2b'), 'B2bCatalogPage');
const B2bProductMatchesPage = lazyNamed(() => import('@/features/b2b'), 'B2bProductMatchesPage');
const B2bCatalogVisibilityPage = lazyNamed(() => import('@/features/b2b'), 'B2bCatalogVisibilityPage');
const B2bPricingPage = lazyNamed(() => import('@/features/b2b'), 'B2bPricingPage');
const B2bInventoryPage = lazyNamed(() => import('@/features/b2b'), 'B2bInventoryPage');
const B2bShoppingListsPage = lazyNamed(() => import('@/features/b2b'), 'B2bShoppingListsPage');
const B2bApprovalRulesPage = lazyNamed(() => import('@/features/b2b'), 'B2bApprovalRulesPage');
const B2bQuotesPage = lazyNamed(() => import('@/features/b2b'), 'B2bQuotesPage');
const B2bOrdersPage = lazyNamed(() => import('@/features/b2b'), 'B2bOrdersPage');
const B2bPaymentsPage = lazyNamed(() => import('@/features/b2b'), 'B2bPaymentsPage');
const B2bPaymentOperationsPage = lazyNamed(() => import('@/features/b2b'), 'B2bPaymentOperationsPage');
const B2bIntegrationsPage = lazyNamed(() => import('@/features/b2b'), 'B2bIntegrationsPage');
const B2bInsightsPage = lazyNamed(() => import('@/features/b2b'), 'B2bInsightsPage');
const B2bRecordDetailPage = lazyNamed(() => import('@/features/b2b'), 'B2bRecordDetailPage');
const B2bRecordCreatePage = lazyNamed(() => import('@/features/b2b'), 'B2bRecordCreatePage');
const B2bRecordEditPage = lazyNamed(() => import('@/features/b2b'), 'B2bRecordEditPage');

export const b2bChildRoutes: RouteObject[] = [
  {
    path: 'b2b',
    children: [
      { path: 'insights', element: withRoute(B2bInsightsPage, { routeName: 'b2b-insights' }) },
      { path: 'companies', element: withRoute(B2bCompaniesPage, { routeName: 'b2b-companies' }) },
      { path: 'buyers', element: withRoute(B2bBuyersPage, { routeName: 'b2b-buyers' }) },
      { path: 'catalog', element: withRoute(B2bCatalogPage, { routeName: 'b2b-catalog' }) },
      { path: 'product-matches', element: withRoute(B2bProductMatchesPage, { routeName: 'b2b-product-matches' }) },
      { path: 'catalog-visibility', element: withRoute(B2bCatalogVisibilityPage, { routeName: 'b2b-catalog-visibility' }) },
      { path: 'pricing', element: withRoute(B2bPricingPage, { routeName: 'b2b-pricing' }) },
      { path: 'inventory', element: withRoute(B2bInventoryPage, { routeName: 'b2b-inventory' }) },
      { path: 'shopping-lists', element: withRoute(B2bShoppingListsPage, { routeName: 'b2b-shopping-lists' }) },
      { path: 'approval-rules', element: withRoute(B2bApprovalRulesPage, { routeName: 'b2b-approval-rules' }) },
      { path: 'quotes', element: withRoute(B2bQuotesPage, { routeName: 'b2b-quotes' }) },
      { path: 'orders', element: withRoute(B2bOrdersPage, { routeName: 'b2b-orders' }) },
      { path: 'payments', element: withRoute(B2bPaymentsPage, { routeName: 'b2b-payments' }) },
      { path: 'payment-operations', element: withRoute(B2bPaymentOperationsPage, { routeName: 'b2b-payment-operations' }) },
      { path: 'integrations', element: withRoute(B2bIntegrationsPage, { routeName: 'b2b-integrations' }) },
      { path: ':workspaceKind/create', element: withRoute(B2bRecordCreatePage, { routeName: 'b2b-record-create' }) },
      { path: 'catalog/:id/edit', element: withRoute(B2bRecordEditPage, { routeName: 'b2b-catalog-edit' }) },
      { path: 'catalog/:id', element: withRoute(B2bRecordDetailPage, { routeName: 'b2b-catalog-detail' }) },
      { path: ':workspaceKind/:id', element: withRoute(B2bRecordDetailPage, { routeName: 'b2b-record-detail' }) },
    ],
  },
];
