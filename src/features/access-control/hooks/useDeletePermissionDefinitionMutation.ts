import { useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionDefinitionApi } from '../api/permissionDefinitionApi';

export const useDeletePermissionDefinitionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => permissionDefinitionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', 'definitions'] });
    },
  });
};
