import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';

const PAGE_SIZE_STORAGE_PREFIX = 'page-size';

interface UsePageSizePreferenceOptions {
  pageKey: string;
  defaultPageSize?: number;
  options?: number[];
}

interface UsePageSizePreferenceResult {
  pageSize: number;
  pageSizeOptions: number[];
  setPageSize: (value: number) => void;
}

function getStorageKey(pageKey: string, userId?: number): string {
  const uid = userId ?? 'anonymous';
  return `${PAGE_SIZE_STORAGE_PREFIX}:${pageKey}:${uid}`;
}

export function usePageSizePreference({
  pageKey,
  defaultPageSize = 10,
  options = [10, 20, 50, 100],
}: UsePageSizePreferenceOptions): UsePageSizePreferenceResult {
  const userId = useAuthStore((state) => state.user?.id);
  const optionsKey = options.join(',');
  const normalizedOptions = useMemo(() => {
    const parsed = optionsKey
      .split(',')
      .map((s) => Number.parseInt(s, 10))
      .filter((opt) => Number.isFinite(opt) && opt > 0);
    return parsed.length > 0 ? parsed : [defaultPageSize];
  }, [defaultPageSize, optionsKey]);
  const fallbackSize = normalizedOptions.includes(defaultPageSize)
    ? defaultPageSize
    : normalizedOptions[0];
  const [pageSize, setPageSizeState] = useState<number>(fallbackSize);
  const initStorageKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const key = getStorageKey(pageKey, userId);
    if (initStorageKeyRef.current !== key) {
      initStorageKeyRef.current = key;
      try {
        const raw = localStorage.getItem(key);
        let next = fallbackSize;
        if (raw) {
          const parsed = Number.parseInt(raw, 10);
          if (!Number.isNaN(parsed) && normalizedOptions.includes(parsed)) {
            next = parsed;
          }
        }
        setPageSizeState((prev) => (Object.is(prev, next) ? prev : next));
      } catch {
        setPageSizeState((prev) => (Object.is(prev, fallbackSize) ? prev : fallbackSize));
      }
      return;
    }

    setPageSizeState((prev) => (normalizedOptions.includes(prev) ? prev : fallbackSize));
  }, [fallbackSize, normalizedOptions, pageKey, userId]);

  const setPageSize = (value: number): void => {
    const next = normalizedOptions.includes(value) ? value : fallbackSize;
    setPageSizeState(next);

    const key = getStorageKey(pageKey, userId);
    try {
      localStorage.setItem(key, String(next));
    } catch {
      return;
    }
  };

  return {
    pageSize,
    pageSizeOptions: normalizedOptions,
    setPageSize,
  };
}
