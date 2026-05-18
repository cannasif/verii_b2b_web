import { useMemo } from 'react';
import { usePermissionAccess } from './usePermissionAccess';

export interface CrudPermissionAccess {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canEdit: boolean;
  canMutate: boolean;
  can: (action: 'view' | 'create' | 'update' | 'delete' | 'approve') => boolean;
}

export function useCrudPermission(scope: string): CrudPermissionAccess {
  const permissionAccess = usePermissionAccess();

  return useMemo(() => {
    const canView = permissionAccess.can(`${scope}.view`);
    const canCreate = permissionAccess.can(`${scope}.create`);
    const canUpdate = permissionAccess.can(`${scope}.update`);
    const canDelete = permissionAccess.can(`${scope}.delete`);
    const canApprove = permissionAccess.can(`${scope}.approve`) || canUpdate;

    return {
      canView,
      canCreate,
      canUpdate,
      canDelete,
      canApprove,
      canEdit: canUpdate,
      canMutate: canCreate || canUpdate || canDelete || canApprove,
      can: (action) => permissionAccess.can(`${scope}.${action}`),
    };
  }, [permissionAccess, scope]);
}
