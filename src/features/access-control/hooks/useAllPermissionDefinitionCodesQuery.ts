import { useQuery } from '@tanstack/react-query';
import { permissionDefinitionApi } from '../api/permissionDefinitionApi';
import { ACCESS_CONTROL_QUERY_KEYS } from '../utils/query-keys';

const STALE_TIME_MS = 30_000;
const MAX_PAGE_SIZE = 10_000;

export function useAllPermissionDefinitionCodesQuery(enabled: boolean = true): {
  data: string[];
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ACCESS_CONTROL_QUERY_KEYS.PERMISSION_DEFINITIONS({
      pageNumber: 1,
      pageSize: MAX_PAGE_SIZE,
      sortBy: 'code',
    }),
    queryFn: async () => {
      const response = await permissionDefinitionApi.getList({
        pageNumber: 1,
        pageSize: MAX_PAGE_SIZE,
        sortBy: 'code',
        sortDirection: 'asc',
      });
      return response.data?.map((item) => item.code).filter((code): code is string => Boolean(code)) ?? [];
    },
    staleTime: STALE_TIME_MS,
    enabled,
  });

  return { data: data ?? [], isLoading };
}
