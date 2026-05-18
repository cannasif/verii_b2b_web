import { useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionGroupApi } from '../api/permissionGroupApi';
import type { SetPermissionGroupPermissionsDto } from '../types/access-control.types';
import { ACCESS_CONTROL_QUERY_KEYS } from '../utils/query-keys';

export const useSetPermissionGroupPermissionsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: SetPermissionGroupPermissionsDto }) =>
      permissionGroupApi.setPermissions(id, dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['permissions', 'groups'] });
      await queryClient.invalidateQueries({ queryKey: ACCESS_CONTROL_QUERY_KEYS.ME_PERMISSIONS_BASE });
      await queryClient.refetchQueries({
        queryKey: ACCESS_CONTROL_QUERY_KEYS.ME_PERMISSIONS_BASE,
        type: 'active',
      });
    },
  });
};
