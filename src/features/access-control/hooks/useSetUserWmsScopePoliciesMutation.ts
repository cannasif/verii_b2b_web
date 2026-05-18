import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { wmsScopePolicyApi } from '../api/wmsScopePolicyApi';
import type { SetUserWmsScopePoliciesDto } from '../types/access-control.types';

export function useSetUserWmsScopePoliciesMutation(userId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: SetUserWmsScopePoliciesDto) => wmsScopePolicyApi.setUserAssignments(userId ?? 0, dto),
    onSuccess: async () => {
      toast.success('Kullanıcı scope atamaları güncellendi.');
      await queryClient.invalidateQueries({ queryKey: ['access-control', 'wms-scope-policies', 'user-assignments', userId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Kullanıcı scope atamaları güncellenemedi.');
    },
  });
}
