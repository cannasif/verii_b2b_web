import { type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useInfiniteQuery } from '@tanstack/react-query';
import { lookupApi } from '@/services/lookup-api';
import type { StockLookup, YapKodLookup } from '@/services/lookup-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PagedLookupDialog } from '@/components/shared/PagedLookupDialog';
import { cn } from '@/lib/utils';
import type { BaseSelectedStockItem } from '@/types/document-models';

export interface ProcessSelectedStockItem extends BaseSelectedStockItem {
  yapKodId?: number;
  transferQuantity: number;
  isSelected: boolean;
  serialNo?: string;
  serialNo2?: string;
  lotNo?: string;
  batchNo?: string;
  configCode?: string;
  sourceWarehouse?: number;
  sourceCellCode?: string;
  targetCellCode?: string;
}

export interface ProcessSelectionLabels {
  stocks: string;
  selectedItems: string;
  selectedItemsCount: string;
  searchStocks: string;
  searchItems: string;
  noSelectedItems: string;
  unit: string;
  serialNo: string;
  serialNoPlaceholder: string;
  serialNo2: string;
  serialNo2Placeholder: string;
  lotNo: string;
  lotNoPlaceholder: string;
  batchNo: string;
  batchNoPlaceholder: string;
  configCode: string;
  configCodePlaceholder: string;
}

interface ProcessStockSelectionProps<TItem extends ProcessSelectedStockItem> {
  selectedItems: TItem[];
  onToggleItem: (item: StockLookup) => void;
  onUpdateItem: (itemId: string, updates: Partial<TItem>) => void;
  onRemoveItem: (itemId: string) => void;
  labels: ProcessSelectionLabels;
}

export function ProcessStockSelection<TItem extends ProcessSelectedStockItem>({
  selectedItems,
  onToggleItem,
  onUpdateItem,
  onRemoveItem,
  labels,
}: ProcessStockSelectionProps<TItem>): ReactElement {
  const [searchStocks, setSearchStocks] = useState('');
  const [searchSelected, setSearchSelected] = useState('');
  const [activeTab, setActiveTab] = useState<'stocks' | 'selected'>('stocks');
  const stockListRefs = useRef<Array<HTMLDivElement | null>>([]);
  const productsQuery = useInfiniteQuery({
    queryKey: ['process-stock-selection', 'products', searchStocks],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      lookupApi.getProductsPaged(
        {
          pageNumber: pageParam,
          pageSize: 20,
          search: searchStocks.trim(),
        },
        { signal },
      ),
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.pageNumber + 1 : undefined),
    staleTime: 5 * 60 * 1000,
  });

  const products = useMemo(
    () => productsQuery.data?.pages.flatMap((page) => page.data ?? []) ?? [],
    [productsQuery.data?.pages],
  );

  const filteredSelectedItems = useMemo(() => {
    if (!searchSelected.trim()) return selectedItems;
    const term = searchSelected.toLowerCase();
    return selectedItems.filter(
      (item) =>
        item.stockCode.toLowerCase().includes(term) ||
        item.stockName.toLowerCase().includes(term),
    );
  }, [searchSelected, selectedItems]);

  const selectedCountsByStockCode = useMemo(() => {
    const counts = new Map<string, number>();
    selectedItems.forEach((item) => {
      counts.set(item.stockCode, (counts.get(item.stockCode) || 0) + 1);
    });
    return counts;
  }, [selectedItems]);

  const handleStockListScroll = (index: number): void => {
    const element = stockListRefs.current[index];
    if (!element || productsQuery.isFetchingNextPage || !productsQuery.hasNextPage) {
      return;
    }

    const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;
    if (remaining < 120) {
      void productsQuery.fetchNextPage();
    }
  };

  return (
    <Card className="flex flex-col">
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="lg:hidden">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'stocks' | 'selected')}
            className="flex h-full flex-col"
          >
            <div className="border-b px-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stocks" className="w-full">
                  {labels.stocks}
                </TabsTrigger>
                <TabsTrigger value="selected" className="w-full">
                  {labels.selectedItems}
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="stocks" className="m-0 min-h-0 flex-1 overflow-hidden">
              <StockListPane
                listRef={(element) => {
                  stockListRefs.current[0] = element;
                }}
                onScroll={() => handleStockListScroll(0)}
                searchStocks={searchStocks}
                setSearchStocks={setSearchStocks}
                isLoadingProducts={productsQuery.isLoading}
                filteredProducts={products}
                isFetchingNextPage={productsQuery.isFetchingNextPage}
                selectedCountsByStockCode={selectedCountsByStockCode}
                onToggleItem={onToggleItem}
                stocksLabel={labels.searchStocks}
              />
            </TabsContent>
            <TabsContent value="selected" className="m-0 min-h-0 flex-1 overflow-hidden">
              <SelectedListPane
                searchSelected={searchSelected}
                setSearchSelected={setSearchSelected}
                filteredSelectedItems={filteredSelectedItems}
                onToggleItem={onToggleItem}
                onUpdateItem={onUpdateItem}
                onRemoveItem={onRemoveItem}
                labels={labels}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="hidden min-h-[560px] lg:grid lg:grid-cols-[32%_1fr]">
          <div className="flex min-h-0 flex-col border-r">
            <StockListPane
              listRef={(element) => {
                stockListRefs.current[1] = element;
              }}
              onScroll={() => handleStockListScroll(1)}
              searchStocks={searchStocks}
              setSearchStocks={setSearchStocks}
              isLoadingProducts={productsQuery.isLoading}
              filteredProducts={products}
              isFetchingNextPage={productsQuery.isFetchingNextPage}
              selectedCountsByStockCode={selectedCountsByStockCode}
              onToggleItem={onToggleItem}
              stocksLabel={labels.searchStocks}
            />
          </div>

          <div className="flex min-h-0 flex-col">
            <SelectedListPane
              searchSelected={searchSelected}
              setSearchSelected={setSearchSelected}
              filteredSelectedItems={filteredSelectedItems}
              onToggleItem={onToggleItem}
              onUpdateItem={onUpdateItem}
              onRemoveItem={onRemoveItem}
              labels={labels}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StockListPane({
  listRef,
  onScroll,
  searchStocks,
  setSearchStocks,
  isLoadingProducts,
  filteredProducts,
  isFetchingNextPage,
  selectedCountsByStockCode,
  onToggleItem,
  stocksLabel,
}: {
  listRef: (element: HTMLDivElement | null) => void;
  onScroll: () => void;
  searchStocks: string;
  setSearchStocks: (value: string) => void;
  isLoadingProducts: boolean;
  filteredProducts: StockLookup[];
  isFetchingNextPage: boolean;
  selectedCountsByStockCode: Map<string, number>;
  onToggleItem: (item: StockLookup) => void;
  stocksLabel: string;
}): ReactElement {
  const { t } = useTranslation();

  return (
    <>
      <div className="border-b p-4">
        <div className="relative flex items-center">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={stocksLabel}
            value={searchStocks}
            onChange={(e) => setSearchStocks(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div ref={listRef} onScroll={onScroll} className="flex-1 space-y-1 overflow-y-auto p-2">
        {isLoadingProducts ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            <span className="inline-flex items-center">
              <Loader2 className="mr-2 size-4 animate-spin" />
              {t('common.loading')}
            </span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">{t('common.notFound')}</div>
        ) : (
          filteredProducts.map((product) => {
            const selectedCount = selectedCountsByStockCode.get(product.stokKodu) || 0;

            return (
              <div
                key={product.stokKodu}
                className={`rounded-md border p-3 transition-colors ${
                  selectedCount > 0 ? 'border-primary bg-primary/10' : 'hover:bg-accent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {product.stokKodu}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{product.olcuBr1}</span>
                    </div>
                    <p className="truncate text-sm font-medium">{product.stokAdi}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {selectedCount > 0 && <Badge variant="default">{selectedCount}</Badge>}
                    <Button type="button" size="sm" onClick={() => onToggleItem(product)}>
                      {t('common.add')}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {isFetchingNextPage ? (
          <div className="flex items-center justify-center py-3 text-xs text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            {t('common.loading')}
          </div>
        ) : null}
      </div>
    </>
  );
}

function SelectedListPane<TItem extends ProcessSelectedStockItem>({
  searchSelected,
  setSearchSelected,
  filteredSelectedItems,
  onToggleItem,
  onUpdateItem,
  onRemoveItem,
  labels,
}: {
  searchSelected: string;
  setSearchSelected: (value: string) => void;
  filteredSelectedItems: TItem[];
  onToggleItem: (item: StockLookup) => void;
  onUpdateItem: (itemId: string, updates: Partial<TItem>) => void;
  onRemoveItem: (itemId: string) => void;
  labels: ProcessSelectionLabels;
}): ReactElement {
  return (
    <>
      <div className="shrink-0 space-y-2 border-b px-2 pb-2">
        <div>
          <h3 className="text-sm font-semibold">{labels.selectedItems}</h3>
          <p className="text-xs text-muted-foreground">
            {labels.selectedItemsCount.replace('{{count}}', String(filteredSelectedItems.length))}
          </p>
        </div>
        <div className="relative flex items-center">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={labels.searchItems}
            value={searchSelected}
            onChange={(e) => setSearchSelected(e.target.value)}
            className="h-8 pl-7 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
        {filteredSelectedItems.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">{labels.noSelectedItems}</div>
        ) : (
          filteredSelectedItems.map((selectedItem) => {
            const product: StockLookup = {
              id: selectedItem.stockId ?? 0,
              subeKodu: 0,
              isletmeKodu: 0,
              stokKodu: selectedItem.stockCode,
              ureticiKodu: '',
              stokAdi: selectedItem.stockName,
              grupKodu: '',
              saticiKodu: '',
              olcuBr1: selectedItem.unit,
              olcuBr2: '',
              pay1: 0,
              kod1: '',
              kod2: '',
              kod3: '',
              kod4: '',
              kod5: '',
            };

            return (
              <ProcessStockItemRow<TItem>
                key={selectedItem.id}
                product={product}
                selectedItem={selectedItem}
                onUpdateItem={onUpdateItem}
                onToggleItem={onToggleItem}
                onRemoveItem={onRemoveItem}
                labels={labels}
              />
            );
          })
        )}
      </div>
    </>
  );
}

function ProcessStockItemRow<TItem extends ProcessSelectedStockItem>({
  product,
  selectedItem,
  onUpdateItem,
  onToggleItem,
  onRemoveItem,
  labels,
}: {
  product: StockLookup;
  selectedItem?: TItem;
  onUpdateItem: (itemId: string, updates: Partial<TItem>) => void;
  onToggleItem: (item: StockLookup) => void;
  onRemoveItem: (itemId: string) => void;
  labels: ProcessSelectionLabels;
}): ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const [yapKodLookupOpen, setYapKodLookupOpen] = useState(false);
  const itemId = selectedItem?.id || `stock-${product.stokKodu}`;
  const quantity = selectedItem?.transferQuantity || 0;

  useEffect(() => {
    if (!selectedItem) {
      setIsExpanded(false);
    }
  }, [selectedItem]);

  const handleQuantityChange = (newValue: string): void => {
    const qty = parseFloat(newValue);
    if (!Number.isNaN(qty) && qty > 0) {
      if (!selectedItem) {
        onToggleItem(product);
        setTimeout(() => {
          onUpdateItem(itemId, { transferQuantity: qty } as Partial<TItem>);
          setIsExpanded(true);
        }, 0);
      } else {
        onUpdateItem(itemId, { transferQuantity: qty } as Partial<TItem>);
      }
    } else if (newValue === '' || qty === 0) {
      if (selectedItem) {
        onRemoveItem(itemId);
        setIsExpanded(false);
      }
    }
  };

  const handleDetailChange = (field: keyof TItem, value: string | number): void => {
    if (!selectedItem) return;
    onUpdateItem(itemId, { [field]: value } as Partial<TItem>);
  };

  return (
    <div
      className={cn(
        'relative rounded-lg border p-2 transition-all sm:p-3',
        quantity > 0 && 'border-primary/50 bg-primary/5',
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-start gap-2">
            <h4 className="min-w-0 flex-1 text-sm font-semibold">{product.stokAdi}</h4>
          </div>
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground sm:flex-row sm:items-center">
            <Badge variant="outline" className="w-fit font-mono text-xs">
              {product.stokKodu}
            </Badge>
            <span className="hidden sm:inline">•</span>
            <span>
              {labels.unit}: <strong className="text-foreground">{product.olcuBr1}</strong>
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-stretch justify-between gap-2 border-t pt-2 sm:flex-row sm:items-center sm:justify-end sm:border-t-0 sm:pt-0">
          <div className="flex flex-1 items-center gap-1.5 sm:flex-initial">
            <Input
              type="number"
              min="0"
              value={quantity || ''}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="h-8 w-full text-right font-mono text-sm [appearance:textfield] sm:w-20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              placeholder="0"
            />
            <span className="whitespace-nowrap text-xs text-muted-foreground">{product.olcuBr1}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 shrink-0 p-0"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (selectedItem) {
                setIsExpanded(!isExpanded);
              }
            }}
            disabled={!selectedItem}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isExpanded && selectedItem ? (
        <div className="mt-3 border-t pt-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <Field
              id={`serial-${itemId}`}
              label={labels.serialNo}
              placeholder={labels.serialNoPlaceholder}
              value={selectedItem.serialNo || ''}
              onChange={(v) => handleDetailChange('serialNo' as keyof TItem, v)}
            />
            <Field
              id={`serial2-${itemId}`}
              label={labels.serialNo2}
              placeholder={labels.serialNo2Placeholder}
              value={selectedItem.serialNo2 || ''}
              onChange={(v) => handleDetailChange('serialNo2' as keyof TItem, v)}
            />
            <Field
              id={`lot-${itemId}`}
              label={labels.lotNo}
              placeholder={labels.lotNoPlaceholder}
              value={selectedItem.lotNo || ''}
              onChange={(v) => handleDetailChange('lotNo' as keyof TItem, v)}
            />
            <Field
              id={`batch-${itemId}`}
              label={labels.batchNo}
              placeholder={labels.batchNoPlaceholder}
              value={selectedItem.batchNo || ''}
              onChange={(v) => handleDetailChange('batchNo' as keyof TItem, v)}
            />
            <Field
              id={`config-${itemId}`}
              label={labels.configCode}
              placeholder={labels.configCodePlaceholder}
              value={selectedItem.configCode || ''}
              onChange={(v) => handleDetailChange('configCode' as keyof TItem, v)}
              stockId={selectedItem.stockId}
              stockCode={product.stokKodu}
              yapKodLookupOpen={yapKodLookupOpen}
              onYapKodLookupOpenChange={setYapKodLookupOpen}
              onYapKodSelect={(item) =>
                onUpdateItem(itemId, { configCode: item.yapKod, yapKodId: item.id } as Partial<TItem>)
              }
              onClear={() => onUpdateItem(itemId, { configCode: '', yapKodId: undefined } as Partial<TItem>)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  placeholder,
  onChange,
  stockId,
  stockCode,
  yapKodLookupOpen,
  onYapKodLookupOpenChange,
  onYapKodSelect,
  onClear,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  stockId?: number;
  stockCode?: string;
  yapKodLookupOpen?: boolean;
  onYapKodLookupOpenChange?: (open: boolean) => void;
  onYapKodSelect?: (item: YapKodLookup) => void;
  onClear?: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const isYapKodField = Boolean(stockCode && onYapKodLookupOpenChange && onYapKodSelect);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {isYapKodField ? (
        <>
          <div className="flex gap-2">
            <div className="flex-1">
              <PagedLookupDialog<YapKodLookup>
                open={Boolean(yapKodLookupOpen)}
                onOpenChange={onYapKodLookupOpenChange!}
                title={label}
                description={stockCode}
                value={value}
                placeholder={placeholder}
                searchPlaceholder={t('common.search')}
                emptyText={t('common.notFound')}
                queryKey={['process-stock-selection', 'yapkod', stockCode]}
                fetchPage={({ pageNumber, pageSize, search, signal }) =>
                  lookupApi.getYapKodlarPaged({ pageNumber, pageSize, search }, { stockId }, { signal })
                }
                getKey={(item) => item.id.toString()}
                getLabel={(item) => `${item.yapKod}${item.yapAcik ? ` - ${item.yapAcik}` : ''}`}
                onSelect={onYapKodSelect!}
              />
            </div>
            {value ? (
              <Button type="button" variant="outline" size="sm" className="h-9 shrink-0" onClick={onClear}>
                {t('common.clear')}
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">{value || placeholder}</p>
        </>
      ) : (
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 text-sm"
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
