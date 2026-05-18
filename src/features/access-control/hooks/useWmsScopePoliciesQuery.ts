import { useQuery } from '@tanstack/react-query';
import { wmsScopePolicyApi } from '../api/wmsScopePolicyApi';
import type { PagedRequest } from '../types/access-control.types';

export function useWmsScopePoliciesQuery(params: PagedRequest) {
  return useQuery({
    queryKey: ['access-control', 'wms-scope-policies', params],
    queryFn: () => wmsScopePolicyApi.getList(params),
  });
}
