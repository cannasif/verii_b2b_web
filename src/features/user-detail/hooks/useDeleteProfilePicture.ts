import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userDetailApi } from '../api/user-detail-api';
import { USER_DETAIL_QUERY_KEYS } from '../utils/query-keys';

export const useDeleteProfilePicture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => userDetailApi.deleteProfilePicture(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_DETAIL_QUERY_KEYS.CURRENT] });
    },
  });
};
