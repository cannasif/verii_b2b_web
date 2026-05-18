import { useQuery } from '@tanstack/react-query';
import { wmsScopePolicyApi } from '../api/wmsScopePolicyApi';

export function useWmsScopePolicyResolutionQuery(userId: number | null, entityType: string | null) {
  return useQuery({
    queryKey: ['access-control', 'wms-scope-policies', 'resolution', userId, entityType],
    queryFn: () => wmsScopePolicyApi.resolveUserScope(userId ?? 0, entityType ?? ''),
    enabled: userId != null && !!entityType,
  });
}
