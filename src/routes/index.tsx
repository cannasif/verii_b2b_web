import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { MainLayout } from '@/components/shared/MainLayout';
import { getAppBasePath } from '@/lib/api-config';
import { RouteErrorPage } from './RouteErrorPage';
import { authRouteTrees } from './modules/auth-routes';
import { adminChildRoutes } from './modules/admin-routes';
import { b2bChildRoutes } from './modules/b2b-routes';
import { erpChildRoutes } from './modules/erp-routes';
import { lazyNamed, withRoute } from './route-utils';

const DashboardPage = lazyNamed(() => import('@/features/dashboard'), 'DashboardPage');
const ProfilePage = lazyNamed(() => import('@/features/user-detail/components/ProfilePage'), 'ProfilePage');
const B2bPortalPage = lazyNamed(() => import('@/features/b2b'), 'B2bPortalPage');

export function createAppRouter() {
  return createBrowserRouter([
    {
      path: '/',
      errorElement: <RouteErrorPage />,
      element: withRoute(B2bPortalPage, { routeName: 'b2b-public-portal' }),
    },
    {
      path: '/b2b-portal',
      errorElement: <RouteErrorPage />,
      element: withRoute(B2bPortalPage, { routeName: 'b2b-public-portal-alias' }),
    },
    {
      path: '/auth/login',
      errorElement: <RouteErrorPage />,
      element: withRoute(B2bPortalPage, { routeName: 'b2b-public-portal-login-entry' }),
    },
    {
      path: '/',
      errorElement: <RouteErrorPage />,
      element: (
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      ),
      children: [
        { path: 'dashboard', element: withRoute(DashboardPage, { routeName: 'dashboard' }) },
        ...adminChildRoutes,
        ...b2bChildRoutes,
        ...erpChildRoutes,
        { path: 'profile', element: withRoute(ProfilePage, { routeName: 'profile' }) },
      ],
    },
    ...authRouteTrees,
  ], {
    basename: getAppBasePath(),
  });
}
