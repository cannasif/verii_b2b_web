import type { RouteObject } from 'react-router-dom';
import AuthLayout from '@/layouts/AuthLayout';
import { RouteErrorPage } from '../RouteErrorPage';
import { lazyNamed, withRoute } from '../route-utils';

const LoginPage = lazyNamed(() => import('@/features/auth'), 'LoginPage');
const ForgotPasswordPage = lazyNamed(() => import('@/features/auth'), 'ForgotPasswordPage');
const ResetPasswordPage = lazyNamed(() => import('@/features/auth'), 'ResetPasswordPage');

export const authRouteTrees: RouteObject[] = [
  {
    path: '/auth',
    errorElement: <RouteErrorPage />,
    element: <AuthLayout />,
    children: [
      { path: 'login', element: withRoute(LoginPage, { routeName: 'auth-login' }) },
      { path: 'forgot-password', element: withRoute(ForgotPasswordPage, { routeName: 'auth-forgot-password' }) },
      { path: 'reset-password', element: withRoute(ResetPasswordPage, { routeName: 'auth-reset-password' }) },
    ],
  },
  {
    path: '/',
    errorElement: <RouteErrorPage />,
    element: <AuthLayout />,
    children: [
      { path: 'forgot-password', element: withRoute(ForgotPasswordPage, { routeName: 'forgot-password-shortcut' }) },
      { path: 'reset-password', element: withRoute(ResetPasswordPage, { routeName: 'reset-password-shortcut' }) },
    ],
  },
];
