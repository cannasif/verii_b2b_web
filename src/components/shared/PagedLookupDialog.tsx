import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PagedResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PagedLookupDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  value?: string | null;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  queryKey: readonly unknown[];
  fetchPage: (args: {
    pageNumber: number;
    pageSize: number;
    search: string;
    signal?: AbortSignal;
  }) => Promise<PagedResponse<T>>;
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  onSelect: (item: T) => void;
}

export function PagedLookupDialog<T>({
  open,
  onOpenChange,
  title,
  description,
  value,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled = false,
  queryKey,
  fetchPage,
  getKey,
  getLabel,
  onSelect,
}: PagedLookupDialogProps<T>): ReactElement {
  const { t } = useTranslation('common');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  const query = useInfiniteQuery({
    queryKey: [...queryKey, search],
    enabled: open,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      fetchPage({
        pageNumber: pageParam,
        pageSize: 20,
        search,
        signal,
      }),
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.pageNumber + 1 : undefined),
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [query.data?.pages],
  );

  useEffect(() => {
    if (!open) {
      setSearch('');
      setSearchInput('');
    }
  }, [open]);

  const handleScroll = (): void => {
    const element = listRef.current;
    if (!element || query.isFetchingNextPage || !query.hasNextPage) {
      return;
    }

    const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;
    if (remaining < 80) {
      void query.fetchNextPage();
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground')}
        onClick={() => onOpenChange(true)}
        disabled={disabled}
      >
        <span className="truncate">{value || placeholder}</span>
        <Search className="size-4 opacity-50" />
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setSearch(searchInput.trim());
                  }
                }}
                placeholder={searchPlaceholder ?? t('paged.searchPlaceholder')}
                className="min-w-0 flex-1"
                aria-label={searchPlaceholder ?? t('paged.searchPlaceholder')}
              />
              <Button
                type="button"
                variant="secondary"
                className="h-10 shrink-0 gap-1.5 px-4"
                onClick={() => setSearch(searchInput.trim())}
              >
                <Search className="size-4 opacity-80" aria-hidden />
                {t('paged.search')}
              </Button>
            </div>

            <div
              ref={listRef}
              onScroll={handleScroll}
              className="max-h-[min(360px,50vh)] space-y-2 overflow-y-auto rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/3"
            >
              {query.isLoading ? (
                <div className="flex items-center justify-center py-8 text-sm text-slate-500">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('common.loading')}
                </div>
              ) : items.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  {emptyText ?? t('common.noResults')}
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={getKey(item)}
                    type="button"
                    className="flex w-full items-start rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-left text-sm transition hover:border-sky-300 hover:bg-sky-50/70 dark:border-white/10 dark:bg-white/4 dark:hover:border-sky-400/50 dark:hover:bg-sky-500/10"
                    onClick={() => {
                      onSelect(item);
                      onOpenChange(false);
                    }}
                  >
                    <span className="font-medium text-slate-900 dark:text-white">{getLabel(item)}</span>
                  </button>
                ))
              )}

              {query.isFetchingNextPage ? (
                <div className="flex items-center justify-center py-3 text-xs text-slate-500">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t('common.loading')}
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
