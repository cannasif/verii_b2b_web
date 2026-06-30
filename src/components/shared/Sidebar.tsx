import { type ReactElement, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import v3logo from '@/assets/v3logo.png';
import type { NavItem } from './nav-items';
import { SidebarNavItem } from './sidebar/SidebarNavItem';
import { collectActiveAncestorKeys } from './sidebar/sidebar-utils';

interface SidebarProps {
  items: NavItem[];
}

export function Sidebar({ items }: SidebarProps): ReactElement {
  const { isSidebarOpen, searchQuery } = useUIStore();
  const { t } = useTranslation();
  const location = useLocation();
  const [expandedItemKeys, setExpandedItemKeys] = useState<string[]>([]);
  const resolveTitle = useCallback(
    (item: NavItem): string => t(item.title, { defaultValue: item.titleFallback ?? item.title }),
    [t],
  );

  useEffect(() => {
    if (!isSidebarOpen) {
      setExpandedItemKeys([]);
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    const activeAncestorKeys = collectActiveAncestorKeys(items, location.pathname);
    if (activeAncestorKeys.length === 0) {
      return;
    }

    setExpandedItemKeys((prev) => Array.from(new Set([...prev, ...activeAncestorKeys])));
  }, [items, location.pathname]);

  const handleToggle = useCallback((key: string): void => {
    setExpandedItemKeys((prev) => (
      prev.includes(key)
        ? prev.filter((itemKey) => itemKey !== key)
        : [...prev, key]
    ));
  }, []);

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px] lg:hidden"
          onClick={() => useUIStore.getState().setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'custom-scrollbar fixed left-0 top-0 bottom-0 z-50 flex w-[86vw] max-w-[320px] flex-col overflow-y-auto border-r border-slate-200/70 bg-white/80 backdrop-blur-xl transition-transform duration-300 ease-in-out dark:border-white/10 dark:bg-[#130822]/95 lg:w-72 lg:max-w-none lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:w-20',
        )}
      >
        <div className="h-24 shrink-0 border-b border-slate-200/70 dark:border-white/5">
          <div className={cn('relative flex h-full items-center px-4', isSidebarOpen ? 'justify-center' : 'justify-center')}>
            {isSidebarOpen ? (
              <>
                <div className="flex items-center">
                  <img
                    src={v3logo}
                    alt="V3RII B2B"
                    decoding="async"
                    fetchPriority="high"
                    width={200}
                    height={120}
                    className="h-24 max-w-[220px] object-contain"
                  />
                </div>
                <button
                  onClick={() => useUIStore.getState().setSidebarOpen(false)}
                  className="absolute right-4 rounded-lg p-2 text-slate-500 transition-colors hover:text-red-500 lg:hidden"
                >
                  <X size={20} />
                </button>
              </>
            ) : (
              <img
                src={v3logo}
                alt="V3"
                decoding="async"
                width={40}
                height={40}
                className="h-10 w-auto object-contain"
              />
            )}
          </div>
        </div>
        <nav className="flex h-full flex-col gap-1 p-4">
          {isSidebarOpen && searchQuery.trim().length > 0 ? (
            <div className="mb-1 rounded-xl border border-pink-200/40 bg-pink-50/70 px-3 py-2 text-xs text-pink-700 dark:border-pink-500/20 dark:bg-pink-500/10 dark:text-pink-300">
              {t('sidebar.filterLabel')}: {searchQuery}
            </div>
          ) : null}
          {items.map((item, index) => (
            <SidebarNavItem
              key={item.href || item.title || index}
              item={item}
              searchQuery={searchQuery}
              expandedItemKeys={expandedItemKeys}
              onToggle={handleToggle}
              resolveTitle={resolveTitle}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}
