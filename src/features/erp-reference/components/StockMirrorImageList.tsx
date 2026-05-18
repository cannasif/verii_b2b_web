import { type ReactElement, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { StockImageDto } from '../types/erpReference.types';
import { erpReferenceApi } from '../api/erpReference.api';
import { getStockImageUrl } from '../utils/image-url';

interface StockMirrorImageListProps {
  images: StockImageDto[];
  isBusy?: boolean;
  onChanged: () => Promise<void> | void;
}

export function StockMirrorImageList({ images, isBusy = false, onChanged }: StockMirrorImageListProps): ReactElement {
  const [imageToDelete, setImageToDelete] = useState<StockImageDto | null>(null);
  const [pendingAction, setPendingAction] = useState<'delete' | 'primary' | null>(null);

  const sortedImages = useMemo(
    () => [...images].sort((left, right) => (left.isPrimary === right.isPrimary ? left.sortOrder - right.sortOrder : left.isPrimary ? -1 : 1)),
    [images],
  );

  async function handleSetPrimary(id: number): Promise<void> {
    setPendingAction('primary');
    try {
      await erpReferenceApi.setPrimaryStockImage(id);
      await onChanged();
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!imageToDelete) return;
    setPendingAction('delete');
    try {
      await erpReferenceApi.deleteStockImage(imageToDelete.id);
      setImageToDelete(null);
      await onChanged();
    } finally {
      setPendingAction(null);
    }
  }

  if (sortedImages.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
        Bu stok için henüz görsel eklenmedi.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedImages.map((image) => (
          <div key={image.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
            <div className="relative aspect-square bg-slate-100 dark:bg-slate-900">
              <img src={getStockImageUrl(image.filePath) ?? ''} alt={image.altText || image.stockName} className="h-full w-full object-cover" />
              {image.isPrimary ? (
                <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Ana görsel
                </div>
              ) : null}
            </div>
            <div className="space-y-3 p-4">
              <div className="min-h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                {image.altText || 'Alt text girilmedi'}
              </div>
              <div className="flex items-center gap-2">
                {image.isPrimary ? (
                  <div className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                    Ana görsel seçili
                  </div>
                ) : (
                  <Button type="button" variant="outline" className="flex-1" disabled={isBusy || pendingAction !== null} onClick={() => void handleSetPrimary(image.id)}>
                    {pendingAction === 'primary' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
                    Ana görsel yap
                  </Button>
                )}
                <Button type="button" variant="ghost" size="icon" disabled={isBusy || pendingAction !== null} onClick={() => setImageToDelete(image)}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={Boolean(imageToDelete)} onOpenChange={(open) => !open && setImageToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Görsel sil</DialogTitle>
            <DialogDescription>Seçili stok görselini silmek istediğine emin misin?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setImageToDelete(null)} disabled={pendingAction === 'delete'}>
              Vazgeç
            </Button>
            <Button type="button" variant="destructive" onClick={() => void handleDelete()} disabled={pendingAction === 'delete'}>
              {pendingAction === 'delete' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
