import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userPermissionGroupApi } from '../api/userPermissionGroupApi';
import type { SetUserPermissionGroupsDto } from '../types/access-control.types';
import { ACCESS_CONTROL_QUERY_KEYS } from '../utils/query-keys';

export const useSetUserPermissionGroupsMutation = (userId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: SetUserPermissionGroupsDto) =>
      userPermissionGroupApi.setByUserId(userId, dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users', userId, 'permission-groups'] });
      await queryClient.invalidateQueries({ queryKey: ACCESS_CONTROL_QUERY_KEYS.ME_PERMISSIONS_BASE });
      await queryClient.refetchQueries({
        queryKey: ACCESS_CONTROL_QUERY_KEYS.ME_PERMISSIONS_BASE,
        type: 'active',
      });
    },
  });
};
