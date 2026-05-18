import { useMemo, useState } from 'react';
import { rowsToBackendFilters } from '@/lib/advanced-filter-types';
import type { FilterRow } from '@/lib/advanced-filter-types';
import type { PagedFilter, PagedParams, PagedResponse } from '@/types/api';
import { usePageSizePreference } from './usePageSizePreference';

type SortDirection = 'asc' | 'desc';
type FilterLogic = 'and' | 'or';

interface UsePagedDataGridOptions<TSortKey extends string> {
  pageKey: string;
  defaultSortBy: TSortKey;
  defaultSortDirection?: SortDirection;
  defaultPageSize?: number;
  defaultPageNumber?: number;
  pageSizeOptions?: number[];
  defaultFilterLogic?: FilterLogic;
  pageNumberBase?: 0 | 1;
  mapSortBy?: (value: TSortKey) => string;
}

interface SearchConfig {
  value: string;
  onValueChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}

export function usePagedDataGrid<TSortKey extends string>({
  pageKey,
  defaultSortBy,
  defaultSortDirection = 'desc',
  defaultPageSize = 10,
  defaultPageNumber = 0,
  pageSizeOptions,
  defaultFilterLogic = 'and',
  pageNumberBase = 0,
  mapSortBy,
}: UsePagedDataGridOptions<TSortKey>) {
  const [pageNumber, setPageNumber] = useState(defaultPageNumber);
  const [sortBy, setSortBy] = useState<TSortKey>(defaultSortBy);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [draftFilterRows, setDraftFilterRows] = useState<FilterRow[]>([]);
  const [appliedAdvancedFilters, setAppliedAdvancedFilters] = useState<PagedFilter[]>([]);
  const [filterLogic, setFilterLogic] = useState<FilterLogic>(defaultFilterLogic);
  const [appliedFilterLogic, setAppliedFilterLogic] = useState<FilterLogic>(defaultFilterLogic);
  const { pageSize, pageSizeOptions: resolvedPageSizeOptions, setPageSize } = usePageSizePreference({
    pageKey,
    defaultPageSize,
    options: pageSizeOptions,
  });

  const resetToFirstPage = (): void => {
    setPageNumber(defaultPageNumber);
  };

  const queryParams = useMemo<PagedParams>(
    () => ({
      pageNumber,
      pageSize,
      sortBy: mapSortBy ? mapSortBy(sortBy) : sortBy,
      sortDirection,
      search: searchTerm,
      filters: appliedAdvancedFilters,
      filterLogic: appliedFilterLogic,
    }),
    [appliedAdvancedFilters, appliedFilterLogic, mapSortBy, pageNumber, pageSize, searchTerm, sortBy, sortDirection],
  );

  const handleSort = (columnKey: TSortKey): void => {
    if (sortBy === columnKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(columnKey);
      setSortDirection('asc');
    }
    resetToFirstPage();
  };

  const applyAdvancedFilters = (): void => {
    setAppliedAdvancedFilters(rowsToBackendFilters(draftFilterRows));
    setAppliedFilterLogic(filterLogic);
    resetToFirstPage();
  };

  const clearAdvancedFilters = (): void => {
    setDraftFilterRows([]);
    setAppliedAdvancedFilters([]);
    setFilterLogic(defaultFilterLogic);
    setAppliedFilterLogic(defaultFilterLogic);
    resetToFirstPage();
  };

  const handleSearchChange = (value: string): void => {
    setSearchTerm(value);
    resetToFirstPage();
  };

  const handleVoiceSearch = (value: string): void => {
    setSearchInput(value);
    handleSearchChange(value);
  };

  const handlePageSizeChange = (value: number): void => {
    setPageSize(value);
    resetToFirstPage();
  };

  const goToPreviousPage = (): void => {
    setPageNumber((prev) => Math.max(defaultPageNumber, prev - 1));
  };

  const goToNextPage = (): void => {
    setPageNumber((prev) => prev + 1);
  };

  const getDisplayPageNumber = <TRow,>(response?: PagedResponse<TRow> | null): number => {
    if (!response) return pageNumberBase === 1 ? 1 : 0;
    return pageNumberBase === 1 ? response.pageNumber : response.pageNumber + 1;
  };

  const searchConfig: SearchConfig = {
    value: searchInput,
    onValueChange: setSearchInput,
    onSearchChange: handleSearchChange,
  };

  return {
    pageNumber,
    setPageNumber,
    pageSize,
    pageSizeOptions: resolvedPageSizeOptions,
    sortBy,
    sortDirection,
    searchInput,
    searchTerm,
    draftFilterRows,
    appliedAdvancedFilters,
    filterLogic,
    setDraftFilterRows,
    setFilterLogic,
    queryParams,
    searchConfig,
    handleSort,
    applyAdvancedFilters,
    clearAdvancedFilters,
    handleVoiceSearch,
    handlePageSizeChange,
    goToPreviousPage,
    goToNextPage,
    getDisplayPageNumber,
  };
}
