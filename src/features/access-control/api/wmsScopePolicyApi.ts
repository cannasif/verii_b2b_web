import { api } from '@/lib/axios';
import { buildPagedRequest } from '@/lib/paged';
import { getLocalizedText } from '@/lib/localized-error';
import { extractData } from '../utils/extract-api-data';
import type {
  ApiResponse,
  CreateWmsScopePolicyDto,
  PagedRequest,
  PagedResponse,
  SetUserWmsScopePoliciesDto,
  UpdateWmsScopePolicyDto,
  UserWmsScopePolicyAssignmentDto,
  WmsScopePolicyDto,
  WmsScopePolicyResolutionDto,
} from '../types/access-control.types';

export const wmsScopePolicyApi = {
  getList: async (params: PagedRequest): Promise<PagedResponse<WmsScopePolicyDto>> => {
    const response = await api.post<ApiResponse<PagedResponse<WmsScopePolicyDto>>>(
      '/api/wms-scope-policies/paged',
      buildPagedRequest(params, {
        pageNumber: 0,
        pageSize: 20,
        sortBy: 'UpdatedDate',
        sortDirection: 'desc',
      }),
    );
    const data = extractData(response as ApiResponse<PagedResponse<WmsScopePolicyDto>>);
    const rawData = data as unknown as { items?: WmsScopePolicyDto[]; data?: WmsScopePolicyDto[] };
    if (rawData.items && !rawData.data) {
      return { ...data, data: rawData.items };
    }
    return data;
  },

  getById: async (id: number): Promise<WmsScopePolicyDto> => {
    const response = await api.get<ApiResponse<WmsScopePolicyDto>>(`/api/wms-scope-policies/${id}`);
    return extractData(response as ApiResponse<WmsScopePolicyDto>);
  },

  create: async (dto: CreateWmsScopePolicyDto): Promise<WmsScopePolicyDto> => {
    const response = await api.post<ApiResponse<WmsScopePolicyDto>>('/api/wms-scope-policies', dto);
    return extractData(response as ApiResponse<WmsScopePolicyDto>);
  },

  update: async (id: number, dto: UpdateWmsScopePolicyDto): Promise<WmsScopePolicyDto> => {
    const response = await api.put<ApiResponse<WmsScopePolicyDto>>(`/api/wms-scope-policies/${id}`, dto);
    return extractData(response as ApiResponse<WmsScopePolicyDto>);
  },

  delete: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<boolean>>(`/api/wms-scope-policies/${id}`);
    if (!(response as ApiResponse<boolean>).success) {
      throw new Error((response as ApiResponse<boolean>).message || getLocalizedText('common.errors.deleteFailed'));
    }
  },

  getUserAssignments: async (userId: number): Promise<UserWmsScopePolicyAssignmentDto[]> => {
    const response = await api.get<ApiResponse<UserWmsScopePolicyAssignmentDto[]>>(`/api/wms-scope-policies/users/${userId}/assignments`);
    return extractData(response as ApiResponse<UserWmsScopePolicyAssignmentDto[]>);
  },

  setUserAssignments: async (userId: number, dto: SetUserWmsScopePoliciesDto): Promise<UserWmsScopePolicyAssignmentDto[]> => {
    const response = await api.put<ApiResponse<UserWmsScopePolicyAssignmentDto[]>>(`/api/wms-scope-policies/users/${userId}/assignments`, dto);
    return extractData(response as ApiResponse<UserWmsScopePolicyAssignmentDto[]>);
  },

  resolveUserScope: async (userId: number, entityType: string): Promise<WmsScopePolicyResolutionDto> => {
    const response = await api.get<ApiResponse<WmsScopePolicyResolutionDto>>(`/api/wms-scope-policies/users/${userId}/resolve`, {
      params: { entityType },
    });
    return extractData(response as ApiResponse<WmsScopePolicyResolutionDto>);
  },
};
