import type { RouteObject } from 'react-router-dom';
import { lazyNamed, withRoute } from '../route-utils';

const PermissionDefinitionsPage = lazyNamed(() => import('@/features/access-control'), 'PermissionDefinitionsPage');
const PermissionGroupsPage = lazyNamed(() => import('@/features/access-control'), 'PermissionGroupsPage');
const UserManagementPage = lazyNamed(() => import('@/features/access-control'), 'UserManagementPage');
const UserGroupAssignmentsPage = lazyNamed(() => import('@/features/access-control'), 'UserGroupAssignmentsPage');
const WmsScopePoliciesPage = lazyNamed(() => import('@/features/access-control'), 'WmsScopePoliciesPage');
const WmsScopeAssignmentsPage = lazyNamed(() => import('@/features/access-control'), 'WmsScopeAssignmentsPage');
const MailSettingsPage = lazyNamed(() => import('@/features/mail-settings'), 'MailSettingsPage');
const HangfireMonitoringPage = lazyNamed(() => import('@/features/hangfire-monitoring'), 'HangfireMonitoringPage');
const TraceExplorerPage = lazyNamed(() => import('@/features/trace-explorer'), 'TraceExplorerPage');

export const adminChildRoutes: RouteObject[] = [
  {
    path: 'users/mail-settings',
    element: withRoute(MailSettingsPage, {
      routeName: 'mail-settings',
    }),
  },
  {
    path: 'hangfire-monitoring',
    element: withRoute(HangfireMonitoringPage, {
      routeName: 'hangfire-monitoring',
    }),
  },
  {
    path: 'trace-explorer',
    element: withRoute(TraceExplorerPage, {
      routeName: 'trace-explorer',
    }),
  },
  {
    path: 'access-control',
    children: [
      {
        path: 'users',
        element: withRoute(UserManagementPage, {
          routeName: 'access-control-user-management',
          namespaces: ['access-control'],
        }),
      },
      {
        path: 'permission-definitions',
        element: withRoute(PermissionDefinitionsPage, {
          routeName: 'access-control-permission-definitions',
          namespaces: ['access-control'],
        }),
      },
      {
        path: 'permission-groups',
        element: withRoute(PermissionGroupsPage, {
          routeName: 'access-control-permission-groups',
          namespaces: ['access-control'],
        }),
      },
      {
        path: 'user-group-assignments',
        element: withRoute(UserGroupAssignmentsPage, {
          routeName: 'access-control-user-group-assignments',
          namespaces: ['access-control'],
        }),
      },
      {
        path: 'wms-scope-policies',
        element: withRoute(WmsScopePoliciesPage, {
          routeName: 'access-control-b2b-scope-policies',
          namespaces: ['access-control'],
        }),
      },
      {
        path: 'wms-scope-assignments',
        element: withRoute(WmsScopeAssignmentsPage, {
          routeName: 'access-control-b2b-scope-assignments',
          namespaces: ['access-control'],
        }),
      },
    ],
  },
];
