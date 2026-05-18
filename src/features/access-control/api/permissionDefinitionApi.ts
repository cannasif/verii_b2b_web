import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import { extractData } from '../utils/extract-api-data';
import { getLocalizedText } from '@/lib/localized-error';
import type {
  ApiResponse,
  PagedRequest,
  PagedResponse,
  PermissionDefinitionDto,
  CreatePermissionDefinitionDto,
  UpdatePermissionDefinitionDto,
  SyncPermissionDefinitionsDto,
  PermissionDefinitionSyncResultDto,
} from '../types/access-control.types';

export const permissionDefinitionApi = {
  getList: async (params: PagedRequest): Promise<PagedResponse<PermissionDefinitionDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<PermissionDefinitionDto>>>(
      '/api/permission-definitions/paged',
      buildPagedRequest(params, {
        pageNumber: 0,
        pageSize: 20,
        sortBy: 'UpdatedDate',
        sortDirection: 'desc',
      }),
    );
    const data = extractData(response as ApiResponse<PagedResponse<PermissionDefinitionDto>>);
    const rawData = data as unknown as { items?: PermissionDefinitionDto[]; data?: PermissionDefinitionDto[] };
    if (rawData.items && !rawData.data) {
      return { ...data, data: rawData.items };
    }
    return data;
  },

  getById: async (id: number): Promise<PermissionDefinitionDto> => {
    const response = await api.get<ApiResponse<PermissionDefinitionDto>>(
      `/api/permission-definitions/${id}`
    );
    return extractData(response as ApiResponse<PermissionDefinitionDto>);
  },

  create: async (dto: CreatePermissionDefinitionDto): Promise<PermissionDefinitionDto> => {
    const response = await api.post<ApiResponse<PermissionDefinitionDto>>(
      '/api/permission-definitions',
      dto
    );
    return extractData(response as ApiResponse<PermissionDefinitionDto>);
  },

  update: async (
    id: number,
    dto: UpdatePermissionDefinitionDto
  ): Promise<PermissionDefinitionDto> => {
    const response = await api.put<ApiResponse<PermissionDefinitionDto>>(
      `/api/permission-definitions/${id}`,
      dto
    );
    return extractData(response as ApiResponse<PermissionDefinitionDto>);
  },



  sync: async (dto: SyncPermissionDefinitionsDto): Promise<PermissionDefinitionSyncResultDto> => {
    const response = await api.post<ApiResponse<PermissionDefinitionSyncResultDto>>(
      '/api/permission-definitions/sync',
      dto
    );
    return extractData(response as ApiResponse<PermissionDefinitionSyncResultDto>);
  },
  delete: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<object>>(`/api/permission-definitions/${id}`);
    if (!(response as ApiResponse<object>).success) {
      throw new Error((response as ApiResponse<object>).message || getLocalizedText('common.errors.deleteFailed'));
    }
  },
};
