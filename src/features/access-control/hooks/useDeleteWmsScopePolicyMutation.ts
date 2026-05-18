import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { wmsScopePolicyApi } from '../api/wmsScopePolicyApi';

export function useDeleteWmsScopePolicyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => wmsScopePolicyApi.delete(id),
    onSuccess: async () => {
      toast.success('WMS scope policy silindi.');
      await queryClient.invalidateQueries({ queryKey: ['access-control', 'wms-scope-policies'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'WMS scope policy silinemedi.');
    },
  });
}
