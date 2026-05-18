import { type ReactElement, useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { erpReferenceApi } from '../api/erpReference.api';

interface StockMirrorImageUploadProps {
  stockId: number;
  onUploaded: () => Promise<void> | void;
}

export function StockMirrorImageUpload({ stockId, onUploaded }: StockMirrorImageUploadProps): ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [altTexts, setAltTexts] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const nextPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews(nextPreviews);

    return () => {
      nextPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  function handleSelect(event: React.ChangeEvent<HTMLInputElement>): void {
    const selected = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/'));
    if (selected.length === 0) return;
    setFiles((current) => [...current, ...selected]);
    setAltTexts((current) => [...current, ...selected.map(() => '')]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleRemove(index: number): void {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
    setAltTexts((current) => current.filter((_, fileIndex) => fileIndex !== index));
  }

  async function handleUpload(): Promise<void> {
    if (files.length === 0 || isUploading) return;

    setIsUploading(true);
    try {
      await erpReferenceApi.uploadStockImages(stockId, files, altTexts);
      setFiles([]);
      setAltTexts([]);
      await onUploaded();
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-6 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="rounded-full bg-white p-3 shadow-sm dark:bg-slate-900">
            <ImagePlus className="h-6 w-6 text-slate-600 dark:text-slate-200" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Stok görseli ekle</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Bir veya birden fazla görsel seçip bu stoğa yükleyebilirsiniz.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Görsel seç
          </Button>
          <Input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleSelect} />
        </div>
      </div>

      {files.length > 0 ? (
        <div className="space-y-3">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950">
              <img src={previews[index]} alt={file.name} className="h-16 w-16 rounded-lg object-cover" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-medium text-slate-900 dark:text-white">{file.name}</div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemove(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`stock-image-alt-${index}`}>Alt text</Label>
                  <Input
                    id={`stock-image-alt-${index}`}
                    value={altTexts[index] ?? ''}
                    onChange={(event) => setAltTexts((current) => current.map((value, altIndex) => altIndex === index ? event.target.value : value))}
                    placeholder="Görsel açıklaması"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button type="button" onClick={() => void handleUpload()} disabled={isUploading}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Görselleri yükle
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
