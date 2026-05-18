import { useQuery } from '@tanstack/react-query';
import { traceExplorerApi } from '../api/traceExplorer.api';

export function useTraceExplorerQuery(traceId: string) {
  return useQuery({
    queryKey: ['trace-explorer', traceId],
    queryFn: () => traceExplorerApi.getByTraceId(traceId),
    enabled: traceId.trim().length > 0,
    retry: false,
  });
}
