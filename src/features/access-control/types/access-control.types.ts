export interface ApiResponse<T> {
  success: boolean;
  message: string;
  exceptionMessage: string;
  data: T;
  errors: string[];
  timestamp: string;
  statusCode: number;
  className: string;
}

export interface PagedFilter {
  column: string;
  operator: string;
  value: string;
}

export interface PagedRequest {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
  search?: string;
  filters?: PagedFilter[];
  filterLogic?: 'and' | 'or';
}

export interface PagedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface MyPermissionsDto {
  userId: number;
  roleTitle: string;
  isSystemAdmin: boolean;
  platform?: string | null;
  permissionGroups: string[];
  permissionCodes: string[];
}

export interface FullUserDto {
  id: number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
}

export interface PermissionDefinitionDto {
  id: number;
  createdDate: string;
  updatedDate?: string;
  deletedDate?: string;
  isDeleted: boolean;
  createdByFullUser?: FullUserDto;
  updatedByFullUser?: FullUserDto;
  deletedByFullUser?: FullUserDto;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  availableOnWeb: boolean;
  availableOnMobile: boolean;
}

export interface CreatePermissionDefinitionDto {
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  availableOnWeb: boolean;
  availableOnMobile: boolean;
}

export interface UpdatePermissionDefinitionDto {
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  availableOnWeb?: boolean;
  availableOnMobile?: boolean;
}

export interface SyncPermissionDefinitionItemDto {
  code: string;
  name?: string | null;
  description?: string | null;
  isActive: boolean;
  availableOnWeb: boolean;
  availableOnMobile: boolean;
}

export interface SyncPermissionDefinitionsDto {
  items: SyncPermissionDefinitionItemDto[];
  reactivateSoftDeleted?: boolean;
  updateExistingNames?: boolean;
  updateExistingDescriptions?: boolean;
  updateExistingIsActive?: boolean;
}

export interface PermissionDefinitionSyncResultDto {
  createdCount: number;
  updatedCount: number;
  reactivatedCount: number;
  totalProcessed: number;
}


export interface PermissionGroupDto {
  id: number;
  createdDate: string;
  updatedDate?: string;
  deletedDate?: string;
  isDeleted: boolean;
  createdByFullUser?: FullUserDto;
  updatedByFullUser?: FullUserDto;
  deletedByFullUser?: FullUserDto;
  name: string;
  description?: string;
  isSystemAdmin: boolean;
  isActive: boolean;
  permissionDefinitionIds: number[];
  permissionCodes: string[];
}

export interface UserAuthorityDto {
  id: number;
  title: string;
}

export interface UserManagementDto {
  id: number;
  createdDate?: string | null;
  updatedDate?: string | null;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  role: string;
  roleId: number;
  isEmailConfirmed: boolean;
  isActive: boolean;
  lastLoginDate?: string | null;
  fullName: string;
  accountType: string;
  b2bBuyerId?: number | null;
  b2bCompanyId?: number | null;
  b2bCompanyName?: string | null;
  b2bCompanyCode?: string | null;
  b2bBuyerRoleCode?: string | null;
  b2bOrderLimit?: number | null;
  b2bRequiresApproval: boolean;
}

export interface CreateUserManagementDto {
  username: string;
  email: string;
  password?: string;
  newPassword?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  roleId: number;
  isActive: boolean;
  permissionGroupIds: number[];
  accountType?: string;
  b2bCompanyId?: number | null;
  b2bBuyerRoleCode?: string;
  b2bOrderLimit?: number | null;
  b2bRequiresApproval?: boolean;
}

export interface UpdateUserManagementDto {
  email?: string;
  newPassword?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  roleId?: number;
  isActive?: boolean;
  permissionGroupIds?: number[];
  accountType?: string;
  b2bCompanyId?: number | null;
  b2bBuyerRoleCode?: string;
  b2bOrderLimit?: number | null;
  b2bRequiresApproval?: boolean;
}

export interface CreatePermissionGroupDto {
  name: string;
  description?: string;
  isSystemAdmin: boolean;
  isActive: boolean;
  permissionDefinitionIds: number[];
}

export interface UpdatePermissionGroupDto {
  name?: string;
  description?: string;
  isSystemAdmin?: boolean;
  isActive?: boolean;
}

export interface SetPermissionGroupPermissionsDto {
  permissionDefinitionIds: number[];
}

export interface UserPermissionGroupDto {
  userId: number;
  permissionGroupIds: number[];
  permissionGroupNames: string[];
}

export interface SetUserPermissionGroupsDto {
  permissionGroupIds: number[];
}

export interface WmsScopePolicyDto {
  id: number;
  createdDate: string;
  updatedDate?: string;
  deletedDate?: string;
  isDeleted: boolean;
  code: string;
  name: string;
  entityType: string;
  description?: string;
  scopeType: string;
  includeSelf: boolean;
  isActive: boolean;
}

export interface CreateWmsScopePolicyDto {
  code: string;
  name: string;
  entityType: string;
  description?: string;
  scopeType: string;
  includeSelf: boolean;
  isActive: boolean;
}

export interface UpdateWmsScopePolicyDto {
  code?: string;
  name?: string;
  entityType?: string;
  description?: string;
  scopeType?: string;
  includeSelf?: boolean;
  isActive?: boolean;
}

export interface UserWmsScopePolicyAssignmentDto {
  id: number;
  createdDate: string;
  updatedDate?: string;
  deletedDate?: string;
  isDeleted: boolean;
  userId: number;
  wmsScopePolicyId: number;
  policyCode: string;
  policyName: string;
  entityType: string;
  scopeType: string;
  branchCode?: string;
  warehouseId?: number | null;
}

export interface UserWmsScopePolicyAssignmentInputDto {
  wmsScopePolicyId: number;
  branchCode?: string;
  warehouseId?: number | null;
}

export interface SetUserWmsScopePoliciesDto {
  items: UserWmsScopePolicyAssignmentInputDto[];
}

export interface WmsScopePolicyResolutionDto {
  userId: number;
  entityType: string;
  hasExplicitPolicy: boolean;
  isUnrestricted: boolean;
  requiresAssignedRecords: boolean;
  includeSelf: boolean;
  branchCodes: string[];
  warehouseIds: number[];
  scopeTypes: string[];
}
