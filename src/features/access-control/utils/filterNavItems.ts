import { canAccessPath } from './hasPermission';
import type { MyPermissionsDto } from '../types/access-control.types';

export interface NavItemLike {
  title: string;
  href?: string;
  children?: NavItemLike[];
}

function collectHrefs(item: NavItemLike): string[] {
  const hrefs: string[] = [];
  if (item.href) hrefs.push(item.href);
  for (const child of item.children ?? []) {
    hrefs.push(...collectHrefs(child));
  }
  return hrefs;
}

export function filterNavItemsByPermission<T extends NavItemLike>(
  items: T[],
  permissions: MyPermissionsDto | null | undefined
): T[] {
  if (!permissions) return [];

  function filterOne(item: T): T | null {
    const hasHref = !!item.href;
    const hasChildren = item.children && item.children.length > 0;

    if (hasHref && !hasChildren) {
      const allowed = canAccessPath(permissions, item.href!);
      return allowed ? item : null;
    }

    if (hasChildren) {
      const filteredChildren = (item.children as T[])
        .map(filterOne)
        .filter((c): c is T => c !== null);
      if (filteredChildren.length === 0) return null;
      return { ...item, children: filteredChildren } as T;
    }

    return null;
  }

  return items.map(filterOne).filter((x): x is T => x !== null);
}

export function anyChildMatchesPath(item: NavItemLike, pathname: string): boolean {
  return collectHrefs(item).some((href) => {
    if (href === pathname) return true;
    if (pathname.startsWith(href) && href !== '#') return true;
    return false;
  });
}
