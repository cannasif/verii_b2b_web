import { type MouseEvent, type ReactElement } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import type { NavItem } from '../nav-items';
import {
  getToneByTitle,
  nodeHasActiveDescendant,
  nodeMatchesSearch,
  toneClassMap,
} from './sidebar-utils';

interface SidebarNavItemProps {
  item: NavItem;
  searchQuery: string;
  expandedItemKeys: string[];
  onToggle: (key: string) => void;
  resolveTitle: (item: NavItem) => string;
  level?: number;
}

export function SidebarNavItem({
  item,
  searchQuery,
  expandedItemKeys,
  onToggle,
  resolveTitle,
  level = 0,
}: SidebarNavItemProps): ReactElement {
  const location = useLocation();
  const { isSidebarOpen, setSidebarOpen } = useUIStore();
  const hasChildren = (item.children?.length ?? 0) > 0;
  const isActive = item.href ? location.pathname === item.href : false;
  const hasActiveChild = item.children?.some((child) => nodeHasActiveDescendant(child, location.pathname)) ?? false;
  const itemKey = item.href || `${level}:${item.title}`;
  const title = resolveTitle(item);
  const searchMatched = nodeMatchesSearch(item, searchQuery, resolveTitle);
  const isExpanded = expandedItemKeys.includes(itemKey) || (Boolean(searchQuery.trim()) && hasChildren && searchMatched);
  const iconTone = getToneByTitle(item.title);
  const toneClasses = toneClassMap[iconTone];

  if (!searchMatched) {
    return <></>;
  }

  const handleIconClick = (e: MouseEvent): void => {
    if (!isSidebarOpen) {
      e.preventDefault();
      e.stopPropagation();
      setSidebarOpen(true);
      if (hasChildren) {
        onToggle(itemKey);
      }
    }
  };

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          title={title}
          onClick={() => {
            if (!isSidebarOpen) {
              setSidebarOpen(true);
              setTimeout(() => onToggle(itemKey), 100);
            } else {
              onToggle(itemKey);
            }
          }}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200',
            'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white',
            (hasActiveChild || isActive)
              ? 'bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white'
              : 'text-slate-500 dark:text-slate-400',
            !isSidebarOpen && 'justify-center',
          )}
        >
          {item.icon && level === 0 ? (
            <span
              className={cn(
                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/60 shadow-xs transition-all [&>svg]:h-[21px] [&>svg]:w-[21px] dark:border-white/10',
                (hasActiveChild || isActive) ? toneClasses.active : toneClasses.idle,
                !isSidebarOpen && 'mx-auto',
              )}
              onClick={handleIconClick}
            >
              {item.icon}
            </span>
          ) : null}
          {level > 0 && isSidebarOpen ? (
            <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
          ) : null}
          <span className={cn('flex-1 text-left text-[13px] leading-5 transition-opacity', !isSidebarOpen && 'hidden')}>
            <span className="line-clamp-2 break-words">{title}</span>
          </span>
          {isSidebarOpen && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn('text-slate-400 transition-transform dark:text-slate-500', isExpanded && 'rotate-90')}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </button>
        {isExpanded && isSidebarOpen ? (
          <div className={cn('space-y-1 border-l border-slate-200 dark:border-white/10', level === 0 ? 'ml-4 pl-4' : 'ml-3 pl-3')}>
            {item.children?.map((child) => (
              <SidebarNavItem
                key={child.href || `${itemKey}:${child.title}`}
                item={child}
                searchQuery={searchQuery}
                expandedItemKeys={expandedItemKeys}
                onToggle={onToggle}
                resolveTitle={resolveTitle}
                level={level + 1}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (!item.href) {
    return <></>;
  }

  return (
    <Link
      to={item.href}
      title={title}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200',
        'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white',
        isActive
          ? 'bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white'
          : 'text-slate-500 dark:text-slate-400',
        !isSidebarOpen && 'justify-center',
      )}
      onClick={(e) => {
        if (!isSidebarOpen) {
          e.preventDefault();
          setSidebarOpen(true);
        } else if (window.innerWidth < 1024) {
          setSidebarOpen(false);
        }
      }}
    >
      {item.icon && level === 0 ? (
        <span
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/60 shadow-xs transition-all [&>svg]:h-[21px] [&>svg]:w-[21px] dark:border-white/10',
            isActive ? toneClasses.active : toneClasses.idle,
            !isSidebarOpen && 'mx-auto',
          )}
          onClick={handleIconClick}
        >
          {item.icon}
        </span>
      ) : null}
      {level > 0 && isSidebarOpen ? <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" /> : null}
      <span className={cn('text-[13px] leading-5 transition-opacity', !isSidebarOpen && 'hidden')}>
        <span className="line-clamp-2 break-words">{title}</span>
      </span>
    </Link>
  );
}
