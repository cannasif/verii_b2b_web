import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { wmsScopePolicyApi } from '../api/wmsScopePolicyApi';
import type { CreateWmsScopePolicyDto } from '../types/access-control.types';

export function useCreateWmsScopePolicyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateWmsScopePolicyDto) => wmsScopePolicyApi.create(dto),
    onSuccess: async () => {
      toast.success('WMS scope policy kaydedildi.');
      await queryClient.invalidateQueries({ queryKey: ['access-control', 'wms-scope-policies'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'WMS scope policy kaydedilemedi.');
    },
  });
}
