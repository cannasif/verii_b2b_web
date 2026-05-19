import { type ReactElement, useState } from 'react';
import { Edit, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { PagedLookupDialog } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { lookupApi } from '@/services/lookup-api';
import type { StockLookup } from '@/services/lookup-types';
import { b2bApi } from '../api/b2b.api';
import type { CatalogProductDto } from '../types/b2b.types';

export type QuoteLineFormState = {
  clientId: string;
  requestedSku: string;
  requestedName: string;
  erpStockId: string;
  erpStockLabel: string;
  catalogProductId: string;
  catalogProductLabel: string;
  quantity: string;
  targetUnitPrice: string;
  discountRate1: string;
  discountAmount1: string;
  vatRate: string;
  description: string;
};

export function createEmptyQuoteLine(): QuoteLineFormState {
  return {
    clientId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    requestedSku: '',
    requestedName: '',
    erpStockId: '',
    erpStockLabel: '',
    catalogProductId: '',
    catalogProductLabel: '',
    quantity: '1',
    targetUnitPrice: '',
    discountRate1: '0',
    discountAmount1: '0',
    vatRate: '20',
    description: '',
  };
}

interface B2bQuoteLineEditorProps {
  lines: QuoteLineFormState[];
  onLinesChange: (lines: QuoteLineFormState[] | ((current: QuoteLineFormState[]) => QuoteLineFormState[])) => void;
  onError: (message: string | null) => void;
}

function hasVisibleProduct(line: QuoteLineFormState): boolean {
  return Boolean(line.erpStockId || line.catalogProductId || line.requestedSku.trim() || line.requestedName.trim());
}

export function B2bQuoteLineEditor({ lines, onLinesChange, onError }: B2bQuoteLineEditorProps): ReactElement {
  const [draft, setDraft] = useState<QuoteLineFormState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeLookupField, setActiveLookupField] = useState<string | null>(null);
  const visibleLines = lines.filter(hasVisibleProduct);
  const draftStockLookupKey = draft ? `quote-line-stock-${draft.clientId}` : 'quote-line-stock';
  const draftCatalogLookupKey = draft ? `quote-line-catalog-${draft.clientId}` : 'quote-line-catalog';

  function updateDraft(patch: Partial<QuoteLineFormState>): void {
    onError(null);
    setDraft((current) => current ? { ...current, ...patch } : current);
  }

  function openLineDialog(line?: QuoteLineFormState): void {
    onError(null);
    setDraft(line ? { ...line } : createEmptyQuoteLine());
    setDialogOpen(true);
  }

  function removeLine(clientId: string): void {
    onError(null);
    onLinesChange((current) => {
      const next = current.filter((line) => line.clientId !== clientId);
      return next.length > 0 ? next : [createEmptyQuoteLine()];
    });
  }

  function saveDraft(): void {
    if (!draft) return;
    if (!hasVisibleProduct(draft)) {
      onError('Kalem için ERP stok, katalog ürünü veya ürün bilgisi seçin.');
      return;
    }
    if ((Number(draft.quantity) || 0) <= 0) {
      onError('Kalem miktarı sıfırdan büyük olmalı.');
      return;
    }
    onLinesChange((current) => {
      const exists = current.some((line) => line.clientId === draft.clientId);
      if (exists) {
        return current.map((line) => line.clientId === draft.clientId ? draft : line);
      }
      return [...current, draft];
    });
    setDialogOpen(false);
    setDraft(null);
  }

  return (
    <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-white/85 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-white/10 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">Teklif kalemleri</h3>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {visibleLines.length > 0 ? `${visibleLines.length} kalem eklendi.` : 'Henüz kalem yok. Kalemi ayrı pencerede stok veya katalogdan seçin.'}
          </p>
        </div>
        <Button type="button" onClick={() => openLineDialog()} className="bg-linear-to-r from-pink-600 to-orange-600 text-white hover:from-pink-700 hover:to-orange-700">
          <Plus className="mr-2 h-4 w-4" />
          Kalem Ekle
        </Button>
      </div>
      <div className="p-0">
        {visibleLines.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 ring-1 ring-slate-100 dark:bg-white/5 dark:ring-white/10">
              <ShoppingCart className="h-7 w-7 text-slate-300 dark:text-slate-500" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Kalem eklenmedi</h4>
            <p className="mt-2 max-w-sm text-sm font-medium text-slate-500 dark:text-slate-400">Talep/teklif satırları ürün seçme penceresiyle eklenir; kullanıcı ID yazmaz, stok veya katalogdan seçer.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                  <th className="px-4 py-3">Ürün</th>
                  <th className="px-4 py-3 text-right">Miktar</th>
                  <th className="px-4 py-3 text-right">Hedef Fiyat</th>
                  <th className="px-4 py-3 text-right">İskonto</th>
                  <th className="px-4 py-3 text-right">KDV</th>
                  <th className="px-4 py-3">Not</th>
                  <th className="px-4 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {visibleLines.map((line) => (
                  <tr key={line.clientId} className="border-b border-slate-100 last:border-0 dark:border-white/10">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">{line.requestedSku || '-'}</div>
                      <div className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">{line.requestedName || line.erpStockLabel || line.catalogProductLabel || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold">{line.quantity || '0'}</td>
                    <td className="px-4 py-3 text-right">{line.targetUnitPrice || '-'}</td>
                    <td className="px-4 py-3 text-right">%{line.discountRate1 || 0}</td>
                    <td className="px-4 py-3 text-right">%{line.vatRate || 0}</td>
                    <td className="px-4 py-3 text-slate-500">{line.description || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => openLineDialog(line)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Düzenle
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(line.clientId)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Sil
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-pink-500 to-orange-500 text-white">
                <Plus className="h-5 w-5" />
              </span>
              Teklif kalemi
            </DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="grid gap-4 md:grid-cols-12">
              <div className="space-y-2 md:col-span-6">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">ERP Stok</span>
                <PagedLookupDialog<StockLookup>
                  open={activeLookupField === draftStockLookupKey}
                  onOpenChange={(open) => setActiveLookupField(open ? draftStockLookupKey : null)}
                  value={draft.erpStockLabel || null}
                  placeholder="ERP stok seç"
                  searchPlaceholder="Stok kodu, adı veya üretici kodu ara"
                  queryKey={['b2b-quote-line-stock', draft.clientId]}
                  title="Teklif Kalemi İçin ERP Stok Seç"
                  description="Satıra ERP stok kartı bağlayın."
                  emptyText="Stok bulunamadı."
                  fetchPage={({ pageNumber, pageSize, search, signal }) => lookupApi.getProductsPaged({ pageNumber, pageSize, search }, { signal })}
                  getKey={(item) => String(item.id)}
                  getLabel={(item) => `${item.stokKodu} - ${item.stokAdi}`}
                  onSelect={(item) => updateDraft({
                    erpStockId: String(item.id),
                    erpStockLabel: `${item.stokKodu} - ${item.stokAdi}`,
                    requestedSku: item.stokKodu,
                    requestedName: item.stokAdi,
                  })}
                />
              </div>
              <div className="space-y-2 md:col-span-6">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Katalog Ürün</span>
                <PagedLookupDialog<CatalogProductDto>
                  open={activeLookupField === draftCatalogLookupKey}
                  onOpenChange={(open) => setActiveLookupField(open ? draftCatalogLookupKey : null)}
                  value={draft.catalogProductLabel || null}
                  placeholder="Katalog ürünü seç"
                  searchPlaceholder="SKU, ürün adı, marka ara"
                  queryKey={['b2b-quote-line-catalog', draft.clientId]}
                  title="Teklif Kalemi İçin Katalog Ürünü Seç"
                  description="Portal kataloğundaki ürün kartlarından seçim yapın."
                  emptyText="Katalog ürünü bulunamadı."
                  fetchPage={({ pageNumber, pageSize, search }) => b2bApi.getCatalogProducts({ pageNumber, pageSize, search })}
                  getKey={(item) => String(item.id)}
                  getLabel={(item) => `${item.sku} - ${item.name}`}
                  onSelect={(item) => updateDraft({
                    catalogProductId: String(item.id),
                    catalogProductLabel: `${item.sku} - ${item.name}`,
                    requestedSku: item.sku,
                    requestedName: item.name,
                  })}
                />
              </div>
              <label className="space-y-2 md:col-span-3">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Talep SKU</span>
                <Input value={draft.requestedSku} onChange={(event) => updateDraft({ requestedSku: event.target.value })} />
              </label>
              <label className="space-y-2 md:col-span-5">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ürün Adı</span>
                <Input value={draft.requestedName} onChange={(event) => updateDraft({ requestedName: event.target.value })} />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Miktar</span>
                <Input type="number" min="0" value={draft.quantity} onChange={(event) => updateDraft({ quantity: event.target.value })} />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">KDV %</span>
                <Input type="number" value={draft.vatRate} onChange={(event) => updateDraft({ vatRate: event.target.value })} />
              </label>
              <label className="space-y-2 md:col-span-3">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Hedef Fiyat</span>
                <Input type="number" value={draft.targetUnitPrice} onChange={(event) => updateDraft({ targetUnitPrice: event.target.value })} />
              </label>
              <label className="space-y-2 md:col-span-3">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">İskonto %</span>
                <Input type="number" value={draft.discountRate1} onChange={(event) => updateDraft({ discountRate1: event.target.value })} />
              </label>
              <label className="space-y-2 md:col-span-3">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">İskonto Tutar</span>
                <Input type="number" value={draft.discountAmount1} onChange={(event) => updateDraft({ discountAmount1: event.target.value })} />
              </label>
              <label className="space-y-2 md:col-span-3">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Satır Notu</span>
                <Input value={draft.description} onChange={(event) => updateDraft({ description: event.target.value })} />
              </label>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Vazgeç
            </Button>
            <Button type="button" onClick={saveDraft}>
              Kalemi Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
