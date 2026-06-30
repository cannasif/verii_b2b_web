import { useQuery } from '@tanstack/react-query';
import { wmsScopePolicyApi } from '../api/wmsScopePolicyApi';

export function useAllWmsScopePoliciesQuery() {
  return useQuery({
    queryKey: ['access-control', 'wms-scope-policies', 'all'],
    queryFn: async () => {
      const response = await wmsScopePolicyApi.getList({
        pageNumber: 1,
        pageSize: 500,
        sortBy: 'Name',
        sortDirection: 'asc',
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
