import { api } from '@/lib/axios';
import { getLocalizedText } from '@/lib/localized-error';
import { extractData } from '../utils/extract-api-data';
import type {
  ApiResponse,
  UserPermissionGroupDto,
  SetUserPermissionGroupsDto,
} from '../types/access-control.types';

export const userPermissionGroupApi = {
  getByUserId: async (userId: number): Promise<UserPermissionGroupDto> => {
    const response = await api.get<ApiResponse<UserPermissionGroupDto>>(
      `/api/user-permission-groups/${userId}`
    );
    return extractData(response as ApiResponse<UserPermissionGroupDto>);
  },

  setByUserId: async (
    userId: number,
    dto: SetUserPermissionGroupsDto
  ): Promise<void> => {
    const response = await api.put<ApiResponse<object>>(
      `/api/user-permission-groups/${userId}`,
      dto
    );
    if (!(response as ApiResponse<object>).success) {
      throw new Error((response as ApiResponse<object>).message || getLocalizedText('common.errors.userGroupSetFailed'));
    }
  },
};
