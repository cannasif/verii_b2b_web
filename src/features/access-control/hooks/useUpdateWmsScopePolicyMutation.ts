import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { wmsScopePolicyApi } from '../api/wmsScopePolicyApi';
import type { UpdateWmsScopePolicyDto } from '../types/access-control.types';

export function useUpdateWmsScopePolicyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateWmsScopePolicyDto }) => wmsScopePolicyApi.update(id, dto),
    onSuccess: async () => {
      toast.success('WMS scope policy güncellendi.');
      await queryClient.invalidateQueries({ queryKey: ['access-control', 'wms-scope-policies'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'WMS scope policy güncellenemedi.');
    },
  });
}
