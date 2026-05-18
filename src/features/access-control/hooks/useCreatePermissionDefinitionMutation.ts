import { useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionDefinitionApi } from '../api/permissionDefinitionApi';
import type { CreatePermissionDefinitionDto } from '../types/access-control.types';
import { ACCESS_CONTROL_QUERY_KEYS } from '../utils/query-keys';

export const useCreatePermissionDefinitionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePermissionDefinitionDto) =>
      permissionDefinitionApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', 'definitions'] });
      queryClient.invalidateQueries({ queryKey: ACCESS_CONTROL_QUERY_KEYS.ME_PERMISSIONS_BASE });
    },
  });
};
