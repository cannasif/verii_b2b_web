import { useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionDefinitionApi } from '../api/permissionDefinitionApi';
import type { UpdatePermissionDefinitionDto } from '../types/access-control.types';
import { ACCESS_CONTROL_QUERY_KEYS } from '../utils/query-keys';

export const useUpdatePermissionDefinitionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdatePermissionDefinitionDto }) =>
      permissionDefinitionApi.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', 'definitions'] });
      queryClient.invalidateQueries({ queryKey: ACCESS_CONTROL_QUERY_KEYS.ME_PERMISSIONS_BASE });
    },
  });
};
