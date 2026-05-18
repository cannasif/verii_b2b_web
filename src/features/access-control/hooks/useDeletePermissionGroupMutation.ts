import { useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionGroupApi } from '../api/permissionGroupApi';
import { ACCESS_CONTROL_QUERY_KEYS } from '../utils/query-keys';

export const useDeletePermissionGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => permissionGroupApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', 'groups'] });
      queryClient.invalidateQueries({ queryKey: ACCESS_CONTROL_QUERY_KEYS.ME_PERMISSIONS_BASE });
    },
  });
};
