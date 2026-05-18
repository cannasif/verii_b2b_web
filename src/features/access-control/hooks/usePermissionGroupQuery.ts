import { useQuery } from '@tanstack/react-query';
import { permissionGroupApi } from '../api/permissionGroupApi';
import { ACCESS_CONTROL_QUERY_KEYS } from '../utils/query-keys';

const STALE_TIME_MS = 60_000;

export const usePermissionGroupQuery = (id: number | null) =>
  useQuery({
    queryKey: ACCESS_CONTROL_QUERY_KEYS.PERMISSION_GROUP(id),
    queryFn: () => (id != null ? permissionGroupApi.getById(id) : Promise.reject(new Error('No id'))),
    enabled: id != null && id > 0,
    staleTime: STALE_TIME_MS,
  });
