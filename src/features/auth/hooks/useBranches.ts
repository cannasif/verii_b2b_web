import { useQuery } from '@tanstack/react-query';
import { lookupApi } from '@/services/lookup-api';
import type { Branch } from '../types/auth';
import { AUTH_QUERY_KEYS } from '../utils/query-keys';

export const useBranches = () => {
  return useQuery<Branch[]>({
    queryKey: [AUTH_QUERY_KEYS.BRANCHES],
    queryFn: async ({ signal }): Promise<Branch[]> => {
      const data = await lookupApi.getBranches({ signal });
      return data.map((branch) => ({
        id: String(branch.subeKodu),
        name: branch.unvan && branch.unvan.trim().length > 0 ? branch.unvan : '-',
        code: String(branch.subeKodu),
      }));
    },
    staleTime: Infinity,
  });
};
