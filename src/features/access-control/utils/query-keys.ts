export const ACCESS_CONTROL_QUERY_KEYS = {
  ME_PERMISSIONS_BASE: ['auth', 'me', 'permissions'] as const,
  ME_PERMISSIONS: (userId: number | null) =>
    ['auth', 'me', 'permissions', userId ?? 0] as const,
  PERMISSION_DEFINITIONS: (request: { pageNumber?: number; pageSize?: number; sortBy?: string; sortDirection?: string; search?: string; filters?: unknown; filterLogic?: 'and' | 'or' }) =>
    ['permissions', 'definitions', request] as const,
  PERMISSION_GROUP: (id: number | null) => ['permissions', 'groups', id] as const,
  PERMISSION_GROUPS: (request: { pageNumber?: number; pageSize?: number; sortBy?: string; sortDirection?: string; search?: string; filters?: unknown; filterLogic?: 'and' | 'or' }) =>
    ['permissions', 'groups', request] as const,
  USER_PERMISSION_GROUPS: (userId: number | null) => ['users', userId, 'permission-groups'] as const,
};
