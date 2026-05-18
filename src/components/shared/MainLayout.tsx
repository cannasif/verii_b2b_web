import { type ReactElement, useEffect } from 'react';
import { type NavItem } from './nav-items';
import { logPerfDebug } from '@/lib/perf-debug';
import { useResolvedNavItems } from './main-layout/useResolvedNavItems';
import { MainLayoutFrame } from './main-layout/MainLayoutFrame';

interface MainLayoutProps {
  navItems?: NavItem[];
}

export function MainLayout({ navItems }: MainLayoutProps): ReactElement {
  const { items, permissionsReady } = useResolvedNavItems({ navItems });

  useEffect(() => {
    logPerfDebug('main-layout:ready', {
      navItemCount: items.length,
      permissionsReady,
    });
  }, [items.length, permissionsReady]);

  return <MainLayoutFrame items={items} />;
}
