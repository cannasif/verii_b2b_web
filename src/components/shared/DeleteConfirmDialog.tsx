import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type DeleteConfirmDialogProps = {
  open: boolean;
  title?: string;
  description?: string;
  itemLabel?: string | null;
  isPending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
};

export function DeleteConfirmDialog({
  open,
  title,
  description,
  itemLabel,
  isPending = false,
  onOpenChange,
  onConfirm,
}: DeleteConfirmDialogProps): ReactElement {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {title ?? t('common.deleteConfirmTitle', { defaultValue: 'Kaydı sil' })}
          </DialogTitle>
          <DialogDescription>
            {description
              ?? t('common.deleteConfirmMessage', {
                item: itemLabel ?? t('common.selected', { defaultValue: 'seçili' }),
                defaultValue: '{{item}} kaydını silmek istediğine emin misin? Bu işlem geri alınamaz.',
              })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? t('common.processing') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
