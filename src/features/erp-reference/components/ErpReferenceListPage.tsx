import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Database, Eye, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PagedDataGrid, type PagedDataGridColumn } from '@/components/shared';
import { VoiceSearchButton } from '@/components/ui/voice-search-button';
import { useColumnPreferences } from '@/hooks/useColumnPreferences';
import { usePagedDataGrid } from '@/hooks/usePagedDataGrid';
import { getPagedRange } from '@/lib/paged';
import type { FilterColumnConfig } from '@/lib/advanced-filter-types';
import { useUIStore } from '@/stores/ui-store';
import { useErpReferenceQuery } from '../hooks/useErpReferenceQuery';
import { StockMirrorDetailDialog } from './StockMirrorDetailDialog';
import type {
  CustomerReferenceDto,
  ErpReferenceKind,
  StockReferenceDto,
  WarehouseReferenceDto,
  YapKodReferenceDto,
} from '../types/erpReference.types';

type RawRow = CustomerReferenceDto | StockReferenceDto | WarehouseReferenceDto | YapKodReferenceDto;
type Row = {
  id: number;
  code: string | number;
  name: string;
  branchCode?: string;
  meta1?: string;
  meta2?: string;
  lastSyncDate?: string;
};
type ColumnKey = 'code' | 'name' | 'branchCode' | 'meta1' | 'meta2' | 'lastSyncDate';

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function getConfig(kind: ErpReferenceKind, t: (key: string, options?: Record<string, unknown>) => string) {
  switch (kind) {
    case 'customer':
      return {
        title: t('erpReference.customer.title', { defaultValue: 'Missing translation' }),
        description: t('erpReference.customer.description', { defaultValue: 'Missing translation' }),
        breadcrumb: t('sidebar.erpCustomers', { defaultValue: 'Missing translation' }),
        pageKey: 'erp-reference-customers',
        errorKey: t('common.errors.erpCustomersLoadFailed'),
        defaultSortBy: 'code' as ColumnKey,
        filterColumns: [
          { value: 'code', type: 'string', labelKey: 'erpReference.columns.code' },
          { value: 'name', type: 'string', labelKey: 'erpReference.columns.name' },
          { value: 'meta1', type: 'string', labelKey: 'erpReference.columns.city' },
          { value: 'meta2', type: 'string', labelKey: 'erpReference.columns.phone' },
        ] satisfies readonly FilterColumnConfig[],
        mapSortBy: (value: ColumnKey) => ({
          code: 'CustomerCode',
          name: 'CustomerName',
          branchCode: 'BranchCode',
          meta1: 'City',
          meta2: 'Phone1',
          lastSyncDate: 'LastSyncDate',
        }[value] ?? 'CustomerCode'),
        columns: [
          { key: 'code', label: t('erpReference.columns.code', { defaultValue: 'Missing translation' }) },
          { key: 'name', label: t('erpReference.columns.name', { defaultValue: 'Missing translation' }) },
          { key: 'branchCode', label: t('erpReference.columns.branch', { defaultValue: 'Missing translation' }) },
          { key: 'meta1', label: t('erpReference.columns.city', { defaultValue: 'Missing translation' }) },
          { key: 'meta2', label: t('erpReference.columns.phone', { defaultValue: 'Missing translation' }) },
          { key: 'lastSyncDate', label: t('erpReference.columns.lastSyncDate', { defaultValue: 'Missing translation' }) },
        ] satisfies PagedDataGridColumn<ColumnKey>[],
        renderCell: (item: Row, columnKey: ColumnKey) => {
          switch (columnKey) {
            case 'code': return <span className="font-mono text-sm">{item.code}</span>;
            case 'name': return <span className="font-medium text-slate-900 dark:text-white">{item.name}</span>;
            case 'branchCode': return <Badge variant="secondary">{item.branchCode || '-'}</Badge>;
            case 'meta1': return item.meta1 || '-';
            case 'meta2': return item.meta2 || '-';
            case 'lastSyncDate': return formatDate(item.lastSyncDate);
          }
        },
      };
    case 'stock':
      return {
        title: t('erpReference.stock.title', { defaultValue: 'Missing translation' }),
        description: t('erpReference.stock.description', { defaultValue: 'Missing translation' }),
        breadcrumb: t('sidebar.erpStocks', { defaultValue: 'Missing translation' }),
        pageKey: 'erp-reference-stocks',
        errorKey: t('common.errors.erpProductsLoadFailed'),
        defaultSortBy: 'code' as ColumnKey,
        filterColumns: [
          { value: 'code', type: 'string', labelKey: 'erpReference.columns.code' },
          { value: 'name', type: 'string', labelKey: 'erpReference.columns.name' },
          { value: 'meta1', type: 'string', labelKey: 'erpReference.columns.unit' },
          { value: 'meta2', type: 'string', labelKey: 'erpReference.columns.group' },
        ] satisfies readonly FilterColumnConfig[],
        mapSortBy: (value: ColumnKey) => ({
          code: 'ErpStockCode',
          name: 'StockName',
          branchCode: 'BranchCode',
          meta1: 'Unit',
          meta2: 'GrupKodu',
          lastSyncDate: 'LastSyncDate',
        }[value] ?? 'ErpStockCode'),
        columns: [
          { key: 'code', label: t('erpReference.columns.code', { defaultValue: 'Missing translation' }) },
          { key: 'name', label: t('erpReference.columns.name', { defaultValue: 'Missing translation' }) },
          { key: 'branchCode', label: t('erpReference.columns.branch', { defaultValue: 'Missing translation' }) },
          { key: 'meta1', label: t('erpReference.columns.unit', { defaultValue: 'Missing translation' }) },
          { key: 'meta2', label: t('erpReference.columns.group', { defaultValue: 'Missing translation' }) },
          { key: 'lastSyncDate', label: t('erpReference.columns.lastSyncDate', { defaultValue: 'Missing translation' }) },
        ] satisfies PagedDataGridColumn<ColumnKey>[],
        renderCell: (item: Row, columnKey: ColumnKey) => {
          switch (columnKey) {
            case 'code': return <span className="font-mono text-sm">{item.code}</span>;
            case 'name': return <span className="font-medium text-slate-900 dark:text-white">{item.name}</span>;
            case 'branchCode': return <Badge variant="secondary">{item.branchCode || '-'}</Badge>;
            case 'meta1': return item.meta1 || '-';
            case 'meta2': return item.meta2 || '-';
            case 'lastSyncDate': return formatDate(item.lastSyncDate);
          }
        },
      };
    case 'warehouse':
      return {
        title: t('erpReference.warehouse.title', { defaultValue: 'Missing translation' }),
        description: t('erpReference.warehouse.description', { defaultValue: 'Missing translation' }),
        breadcrumb: t('sidebar.erpWarehouses', { defaultValue: 'Missing translation' }),
        pageKey: 'erp-reference-warehouses',
        errorKey: t('common.errors.erpWarehousesLoadFailed'),
        defaultSortBy: 'code' as ColumnKey,
        filterColumns: [
          { value: 'code', type: 'string', labelKey: 'erpReference.columns.code' },
          { value: 'name', type: 'string', labelKey: 'erpReference.columns.name' },
          { value: 'branchCode', type: 'string', labelKey: 'erpReference.columns.branch' },
        ] satisfies readonly FilterColumnConfig[],
        mapSortBy: (value: ColumnKey) => {
          switch (value) {
            case 'name': return 'WarehouseName';
            case 'branchCode': return 'BranchCode';
            case 'code':
            default: return 'WarehouseCode';
          }
        },
        columns: [
          { key: 'code', label: t('erpReference.columns.code', { defaultValue: 'Missing translation' }) },
          { key: 'name', label: t('erpReference.columns.name', { defaultValue: 'Missing translation' }) },
          { key: 'branchCode', label: t('erpReference.columns.branch', { defaultValue: 'Missing translation' }) },
        ] satisfies PagedDataGridColumn<ColumnKey>[],
        renderCell: (item: Row, columnKey: ColumnKey) => {
          switch (columnKey) {
            case 'code': return <span className="font-mono text-sm">{item.code}</span>;
            case 'name': return <span className="font-medium text-slate-900 dark:text-white">{item.name}</span>;
            case 'branchCode': return <Badge variant="secondary">{item.branchCode || '-'}</Badge>;
            default: return null;
          }
        },
      };
    case 'yapkod':
      return {
        title: t('erpReference.yapkod.title', { defaultValue: 'Missing translation' }),
        description: t('erpReference.yapkod.description', { defaultValue: 'Missing translation' }),
        breadcrumb: t('sidebar.erpYapKodlar', { defaultValue: 'Missing translation' }),
        pageKey: 'erp-reference-yapkod',
        errorKey: t('common.errors.requestFailed'),
        defaultSortBy: 'code' as ColumnKey,
        filterColumns: [
          { value: 'code', type: 'string', labelKey: 'erpReference.columns.code' },
          { value: 'name', type: 'string', labelKey: 'erpReference.columns.name' },
          { value: 'meta1', type: 'string', labelKey: 'erpReference.columns.linkedStock' },
        ] satisfies readonly FilterColumnConfig[],
        mapSortBy: (value: ColumnKey) => {
          switch (value) {
            case 'name': return 'YapAcik';
            case 'branchCode': return 'BranchCode';
            case 'meta1': return 'YplndrStokKod';
            case 'lastSyncDate': return 'LastSyncDate';
            case 'code':
            default: return 'YapKod';
          }
        },
        columns: [
          { key: 'code', label: t('erpReference.columns.code', { defaultValue: 'Missing translation' }) },
          { key: 'name', label: t('erpReference.columns.name', { defaultValue: 'Missing translation' }) },
          { key: 'branchCode', label: t('erpReference.columns.branch', { defaultValue: 'Missing translation' }) },
          { key: 'meta1', label: t('erpReference.columns.linkedStock', { defaultValue: 'Missing translation' }) },
          { key: 'lastSyncDate', label: t('erpReference.columns.lastSyncDate', { defaultValue: 'Missing translation' }) },
        ] satisfies PagedDataGridColumn<ColumnKey>[],
        renderCell: (item: Row, columnKey: ColumnKey) => {
          switch (columnKey) {
            case 'code': return <span className="font-mono text-sm">{item.code}</span>;
            case 'name': return <span className="font-medium text-slate-900 dark:text-white">{item.name}</span>;
            case 'branchCode': return <Badge variant="secondary">{item.branchCode || '-'}</Badge>;
            case 'meta1': return item.meta1 || '-';
            case 'lastSyncDate': return formatDate(item.lastSyncDate);
            default: return null;
          }
        },
      };
  }
}

export function ErpReferenceListPage({ kind }: { kind: ErpReferenceKind }): ReactElement {
  const { t } = useTranslation('common');
  const { setPageTitle } = useUIStore();
  const config = useMemo(() => getConfig(kind, (key, options) => t(key, options)), [kind, t]);

  const pagedGrid = usePagedDataGrid<ColumnKey>({
    pageKey: config.pageKey,
    defaultSortBy: config.defaultSortBy,
    defaultSortDirection: 'asc',
    defaultPageSize: 20,
    mapSortBy: config.mapSortBy,
  });

  const { data, isLoading, error, refetch } = useErpReferenceQuery(kind, pagedGrid.queryParams);
  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);
  const { userId, columnOrder, visibleColumns, orderedVisibleColumns, setColumnOrder, setVisibleColumns } = useColumnPreferences({
    pageKey: config.pageKey,
    columns: config.columns.map(({ key, label }) => ({ key, label })),
  });

  useEffect(() => {
    setPageTitle(config.title);
    return () => setPageTitle(null);
  }, [config.title, setPageTitle]);

  const rows = useMemo<Row[]>(() => (data?.data ?? []).map((row: RawRow) => {
    switch (kind) {
      case 'customer': {
        const item = row as CustomerReferenceDto;
        return { id: item.id, code: item.customerCode, name: item.customerName, branchCode: item.branchCode, meta1: item.city, meta2: item.phone1, lastSyncDate: item.lastSyncDate };
      }
      case 'stock': {
        const item = row as StockReferenceDto;
        return { id: item.id, code: item.erpStockCode, name: item.stockName, branchCode: item.branchCode, meta1: item.unit, meta2: item.grupAdi || item.grupKodu, lastSyncDate: item.lastSyncDate };
      }
      case 'warehouse': {
        const item = row as WarehouseReferenceDto;
        return { id: item.id, code: item.warehouseCode, name: item.warehouseName, branchCode: item.branchCode };
      }
      case 'yapkod': {
        const item = row as YapKodReferenceDto;
        return { id: item.id, code: item.yapKod, name: item.yapAcik, branchCode: item.branchCode, meta1: item.yplndrStokKod, lastSyncDate: item.lastSyncDate };
      }
    }
  }), [data?.data, kind]);

  const exportColumns = useMemo(
    () => orderedVisibleColumns.map((key) => ({ key, label: config.columns.find((column) => column.key === key)?.label ?? key })),
    [config.columns, orderedVisibleColumns],
  );

  const exportRows = useMemo<Record<string, unknown>[]>(() => rows.map((item) => ({
    code: item.code,
    name: item.name,
    branchCode: item.branchCode,
    meta1: item.meta1,
    meta2: item.meta2,
    lastSyncDate: formatDate(item.lastSyncDate),
  })), [rows]);

  const range = getPagedRange(data);
  const paginationInfoText = t('common.paginationInfo', {
    current: range.from,
    total: range.to,
    totalCount: range.total,
    defaultValue: `${range.from}-${range.to} / ${range.total}`,
  });

  const visibleColumnKeys = orderedVisibleColumns as ColumnKey[];
  const renderSortIcon = (columnKey: ColumnKey): ReactElement | null => columnKey !== pagedGrid.sortBy ? null : pagedGrid.sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />;

  return (
    <div className="w-full space-y-6 crm-page">
      <Breadcrumb items={[{ label: t('sidebar.erp', { defaultValue: 'Missing translation' }) }, { label: config.breadcrumb, isActive: true }]} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            <Database className="h-3.5 w-3.5" />
            {t('erpReference.badge', { defaultValue: 'Missing translation' })}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{config.title}</h1>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{config.description}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => void refetch()}>
          <RefreshCw size={18} className="mr-2" />
          {t('common.refresh', { defaultValue: 'Missing translation' })}
        </Button>
      </div>

      <Card className="border-slate-200/80 shadow-sm dark:border-white/10 dark:bg-white/3">
        <CardHeader className="border-b border-slate-100 bg-slate-50/70 dark:border-white/10 dark:bg-white/5">
          <CardTitle className="flex items-center justify-between text-base">
            <span>{config.title}</span>
            <Badge variant="secondary">{range.total}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <PagedDataGrid<Row, ColumnKey>
            columns={config.columns}
            visibleColumnKeys={visibleColumnKeys}
            rows={rows}
            rowKey={(row) => row.id}
            renderCell={config.renderCell}
            onRowClick={kind === 'stock' ? (row) => setSelectedStockId(row.id) : undefined}
            renderActionsCell={kind === 'stock' ? (row) => (
              <div className="flex justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); setSelectedStockId(row.id); }}>
                  <Eye className="mr-2 h-4 w-4" />
                  Detay
                </Button>
              </div>
            ) : undefined}
            sortBy={pagedGrid.sortBy}
            sortDirection={pagedGrid.sortDirection}
            onSort={pagedGrid.handleSort}
            renderSortIcon={renderSortIcon}
            isLoading={isLoading}
            isError={Boolean(error)}
            errorText={config.errorKey}
            emptyText={t('common.noData')}
            pageSize={data?.pageSize ?? pagedGrid.pageSize}
            pageSizeOptions={pagedGrid.pageSizeOptions}
            onPageSizeChange={pagedGrid.handlePageSizeChange}
            pageNumber={pagedGrid.getDisplayPageNumber(data)}
            totalPages={Math.max(data?.totalPages ?? 1, 1)}
            hasPreviousPage={Boolean(data?.hasPreviousPage)}
            hasNextPage={Boolean(data?.hasNextPage)}
            onPreviousPage={pagedGrid.goToPreviousPage}
            onNextPage={pagedGrid.goToNextPage}
            previousLabel={t('common.previous')}
            nextLabel={t('common.next')}
            paginationInfoText={paginationInfoText}
            actionBar={{
              pageKey: config.pageKey,
              userId,
              columns: config.columns.map(({ key, label }) => ({ key, label })),
              visibleColumns,
              columnOrder,
              onVisibleColumnsChange: setVisibleColumns,
              onColumnOrderChange: setColumnOrder,
              exportFileName: config.pageKey,
              exportColumns,
              exportRows,
              filterColumns: config.filterColumns,
              defaultFilterColumn: 'code',
              draftFilterRows: pagedGrid.draftFilterRows,
              onDraftFilterRowsChange: pagedGrid.setDraftFilterRows,
              filterLogic: pagedGrid.filterLogic,
              onFilterLogicChange: pagedGrid.setFilterLogic,
              onApplyFilters: pagedGrid.applyAdvancedFilters,
              onClearFilters: pagedGrid.clearAdvancedFilters,
              appliedFilterCount: pagedGrid.appliedAdvancedFilters.length,
              search: {
                value: pagedGrid.searchInput,
                onValueChange: pagedGrid.searchConfig.onValueChange,
                onSearchChange: pagedGrid.searchConfig.onSearchChange,
                placeholder: t('common.search'),
              },
              refresh: {
                onRefresh: () => void refetch(),
                isLoading,
                label: t('common.refresh', { defaultValue: 'Missing translation' }),
              },
              leftSlot: <VoiceSearchButton onResult={pagedGrid.handleVoiceSearch} size="sm" variant="outline" />,
            }}
          />
        </CardContent>
      </Card>

      {kind === 'stock' ? (
        <StockMirrorDetailDialog
          stockId={selectedStockId}
          open={selectedStockId !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setSelectedStockId(null);
          }}
        />
      ) : null}
    </div>
  );
}

export function CustomerReferencePage(): ReactElement {
  return <ErpReferenceListPage kind="customer" />;
}

export function StockReferencePage(): ReactElement {
  return <ErpReferenceListPage kind="stock" />;
}

export function WarehouseReferencePage(): ReactElement {
  return <ErpReferenceListPage kind="warehouse" />;
}

export function YapKodReferencePage(): ReactElement {
  return <ErpReferenceListPage kind="yapkod" />;
}
