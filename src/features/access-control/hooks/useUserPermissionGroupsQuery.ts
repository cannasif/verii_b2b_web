import { useQuery } from '@tanstack/react-query';
import { userPermissionGroupApi } from '../api/userPermissionGroupApi';
import { ACCESS_CONTROL_QUERY_KEYS } from '../utils/query-keys';

const STALE_TIME_MS = 60_000;

export const useUserPermissionGroupsQuery = (userId: number | null) =>
  useQuery({
    queryKey: ACCESS_CONTROL_QUERY_KEYS.USER_PERMISSION_GROUPS(userId),
    queryFn: () =>
      userId != null ? userPermissionGroupApi.getByUserId(userId) : Promise.reject(new Error('No userId')),
    enabled: userId != null && userId > 0,
    staleTime: STALE_TIME_MS,
  });
