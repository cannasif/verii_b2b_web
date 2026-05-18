import { useQuery } from '@tanstack/react-query';
import { wmsScopePolicyApi } from '../api/wmsScopePolicyApi';

export function useUserWmsScopePoliciesQuery(userId: number | null) {
  return useQuery({
    queryKey: ['access-control', 'wms-scope-policies', 'user-assignments', userId],
    queryFn: () => wmsScopePolicyApi.getUserAssignments(userId ?? 0),
    enabled: userId != null,
  });
}
