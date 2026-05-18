import { type ReactElement, Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, X, Mic } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import type { NavItem } from './nav-items';

const UserProfileModal = lazy(() =>
  import('@/features/user-detail/components/UserProfileModal').then((module) => ({
    default: module.UserProfileModal,
  })),
);

interface SearchTarget {
  title: string;
  subtitle: string;
  href: string;
}

interface NavbarProps {
  navItems?: NavItem[];
}

const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

const flattenSearchTargets = (items: NavItem[], resolveTitle: (item: NavItem) => string): SearchTarget[] => {
  const targets: SearchTarget[] = [];
  for (const item of items) {
    if (item.href) {
      const title = resolveTitle(item);
      targets.push({ title, subtitle: title, href: item.href });
    }
    if (item.children?.length) {
      for (const child of item.children) {
        if (!child.href) continue;
        const parentTitle = resolveTitle(item);
        const childTitle = resolveTitle(child);
        targets.push({
          title: childTitle,
          subtitle: `${parentTitle} / ${childTitle}`,
          href: child.href,
        });
      }
    }
  }
  return targets;
};

export function Navbar({ navItems = [] }: NavbarProps): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user, branch } = useAuthStore();
  const { toggleSidebar, searchQuery, setSearchQuery, setSidebarOpen } = useUIStore();
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);
  const [isSearchFocus, setIsSearchFocus] = useState(false);
  const resolveTitle = useMemo(
    () => (item: NavItem): string => t(item.title, { defaultValue: item.titleFallback ?? item.title }),
    [t],
  );

  const { isListening, isSupported, startListening } = useVoiceSearch({
    onResult: (text) => {
      setSearchQuery(text);
      if (text.trim().length > 0) {
        setSidebarOpen(true);
        setIsSearchFocus(true);
      }
    },
  });

  const searchTargets = useMemo(() => flattenSearchTargets(navItems, resolveTitle), [navItems, resolveTitle]);
  const quickResults = useMemo(() => {
    const q = normalizeText(searchQuery.trim());
    if (!q) return [] as SearchTarget[];
    return searchTargets
      .filter((item) => normalizeText(item.subtitle).includes(q))
      .slice(0, 5);
  }, [searchQuery, searchTargets]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSidebarOpen(true);
        requestAnimationFrame(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSidebarOpen]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 0) {
      setSidebarOpen(true);
    }
  };

  const handleSearchNavigate = (target: SearchTarget): void => {
    setSearchQuery(target.title);
    setSidebarOpen(true);
    setIsSearchFocus(false);
    navigate(target.href);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && quickResults.length > 0) {
      e.preventDefault();
      handleSearchNavigate(quickResults[0]);
    }
  };

  const displayName = user?.name || user?.email || t('common.user');
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-xl transition-all dark:border-white/5 dark:bg-[#0c0516]/80 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <Menu size={24} />
            </button>

            <div className="relative hidden w-full max-w-md md:block">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors focus-within:text-pink-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => setIsSearchFocus(true)}
                onBlur={() => setTimeout(() => setIsSearchFocus(false), 120)}
                placeholder={t('navbar.search_placeholder')}
                className={cn(
                  'w-full rounded-2xl border py-3 pl-12 pr-24 text-sm font-medium outline-none transition-all duration-300',
                  'border-slate-200 bg-slate-100/60 text-slate-900 placeholder:text-slate-500 focus:border-pink-500/30 focus:bg-white focus:ring-4 focus:ring-pink-500/10',
                  'dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-[#150a25]'
                )}
              />
              <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                {isSupported && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setIsSearchFocus(true);
                      startListening();
                    }}
                    className={cn(
                      'rounded-xl p-2 transition-all duration-300',
                      isListening
                        ? 'animate-pulse bg-pink-500/10 text-pink-500'
                        : 'text-slate-400 hover:bg-slate-200 hover:text-pink-500 dark:hover:bg-white/10'
                    )}
                    title={t('voiceSearch.start')}
                  >
                    <Mic size={18} />
                  </button>
                )}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-white/20 dark:hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {isSearchFocus && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#130822]/95">
                  {quickResults.length > 0 ? (
                    quickResults.map((item) => (
                      <button
                        key={item.href}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSearchNavigate(item)}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-slate-100 dark:hover:bg-white/10"
                      >
                        <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-100">{item.title}</span>
                        <span className="ml-3 truncate text-xs text-slate-400">{item.subtitle}</span>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                      {t('common.notFound')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {user && <div className="hidden h-6 w-px bg-slate-200 dark:bg-white/10 sm:block" />}

            {user && (
              <button
                type="button"
                onClick={() => setUserProfileModalOpen(true)}
                className="group flex items-center gap-3"
              >
                <div className="hidden text-right lg:block">
                  <p className="max-w-[170px] truncate text-sm font-semibold text-slate-700 transition-colors group-hover:text-pink-500 dark:text-slate-200">
                    {branch?.code ? `${branch.code} • ` : ''}
                    {displayName}
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    {branch?.name || t('roles.admin')}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-tr from-pink-500 via-orange-500 to-yellow-500 p-[2px]">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-xs font-bold text-orange-500 dark:bg-[#0c0516]">
                    {displayInitial}
                  </div>
                </div>
              </button>
            )}

          </div>
        </div>
        <div className="relative pb-3 md:hidden">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            onKeyDown={handleSearchKeyDown}
            placeholder={t('navbar.search_placeholder')}
            className="w-full rounded-xl border border-slate-200 bg-slate-100/70 py-2.5 pl-10 pr-20 text-sm text-slate-900 outline-none focus:border-pink-500/40 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
          <button
            type="button"
            onClick={() => startListening()}
            className={cn(
              'absolute right-9 top-1/2 -translate-y-1/2 rounded-lg p-1 transition-colors',
              isListening
                ? 'bg-pink-500/20 text-pink-500'
                : 'text-slate-400 hover:bg-slate-200 hover:text-pink-500 dark:hover:bg-white/20',
              !isSupported && 'cursor-not-allowed opacity-40'
            )}
            disabled={!isSupported}
          >
            <Mic size={14} />
          </button>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-white/20 dark:hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </header>

      <Suspense fallback={null}>
        {userProfileModalOpen ? (
          <UserProfileModal
            open={userProfileModalOpen}
            onOpenChange={setUserProfileModalOpen}
            onOpenProfileDetails={() => {
              setUserProfileModalOpen(false);
              navigate('/profile');
            }}
          />
        ) : null}
      </Suspense>
    </>
  );
}
