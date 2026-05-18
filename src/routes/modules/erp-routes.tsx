import type { RouteObject } from 'react-router-dom';
import { lazyNamed, withRoute } from '../route-utils';

const CustomerReferencePage = lazyNamed(() => import('@/features/erp-reference'), 'CustomerReferencePage');
const StockReferencePage = lazyNamed(() => import('@/features/erp-reference'), 'StockReferencePage');
const WarehouseReferencePage = lazyNamed(() => import('@/features/erp-reference'), 'WarehouseReferencePage');
const YapKodReferencePage = lazyNamed(() => import('@/features/erp-reference'), 'YapKodReferencePage');

export const erpChildRoutes: RouteObject[] = [
  {
    path: 'erp',
    children: [
      { path: 'customers', element: withRoute(CustomerReferencePage, { routeName: 'erp-customers' }) },
      { path: 'stocks', element: withRoute(StockReferencePage, { routeName: 'erp-stocks' }) },
      { path: 'warehouses', element: withRoute(WarehouseReferencePage, { routeName: 'erp-warehouses' }) },
      { path: 'yapkodlar', element: withRoute(YapKodReferencePage, { routeName: 'erp-yapkodlar' }) },
    ],
  },
];
