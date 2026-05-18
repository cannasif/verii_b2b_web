import { useMemo } from 'react';
import { useMyPermissionsQuery } from '@/features/access-control/hooks/useMyPermissionsQuery';
import { filterNavItemsByPermission } from '@/features/access-control/utils/filterNavItems';
import { B2B_NAV_ITEMS, type NavItem } from '../nav-items';

interface UseResolvedNavItemsOptions {
  navItems?: NavItem[];
}

interface UseResolvedNavItemsResult {
  items: NavItem[];
  permissionsReady: boolean;
}

export function useResolvedNavItems({ navItems }: UseResolvedNavItemsOptions): UseResolvedNavItemsResult {
  const { data: permissions, isLoading, isError } = useMyPermissionsQuery();
  const baseItems = navItems ?? B2B_NAV_ITEMS;

  const items = useMemo(() => {
    if (isLoading) return baseItems;
    if (permissions) return filterNavItemsByPermission(baseItems, permissions);
    if (isError) return baseItems;
    return baseItems;
  }, [baseItems, isError, isLoading, permissions]);

  return {
    items,
    permissionsReady: !isLoading,
  };
}
