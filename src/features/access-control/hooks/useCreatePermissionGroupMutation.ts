import { useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionGroupApi } from '../api/permissionGroupApi';
import type { CreatePermissionGroupDto } from '../types/access-control.types';
import { ACCESS_CONTROL_QUERY_KEYS } from '../utils/query-keys';

export const useCreatePermissionGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePermissionGroupDto) => permissionGroupApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', 'groups'] });
      queryClient.invalidateQueries({ queryKey: ACCESS_CONTROL_QUERY_KEYS.ME_PERMISSIONS_BASE });
    },
  });
};
