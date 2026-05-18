import { useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionDefinitionApi } from '../api/permissionDefinitionApi';
import type { SyncPermissionDefinitionsDto } from '../types/access-control.types';
import { ACCESS_CONTROL_QUERY_KEYS } from '../utils/query-keys';

export const useSyncPermissionDefinitionsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: SyncPermissionDefinitionsDto) =>
      permissionDefinitionApi.sync(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', 'definitions'] });
      queryClient.invalidateQueries({ queryKey: ACCESS_CONTROL_QUERY_KEYS.ME_PERMISSIONS_BASE });
    },
  });
};
