import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { exportGridToExcel, exportGridToPdf, type GridExportColumn } from '@/lib/grid-export';

interface GridExportMenuProps {
  fileName: string;
  columns: GridExportColumn[];
  rows: Record<string, unknown>[];
  getExportData?: () => Promise<{ columns: GridExportColumn[]; rows: Record<string, unknown>[] }>;
}

export function GridExportMenu({ fileName, columns, rows, getExportData }: GridExportMenuProps): ReactElement {
  const { t } = useTranslation('common');
  const [isExporting, setIsExporting] = useState(false);

  const resolveExportPayload = async (): Promise<{ columns: GridExportColumn[]; rows: Record<string, unknown>[] }> => {
    if (getExportData) {
      return getExportData();
    }

    return { columns, rows };
  };

  const handleExcelExport = async (): Promise<void> => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const payload = await resolveExportPayload();
      await exportGridToExcel({ fileName, columns: payload.columns, rows: payload.rows });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePdfExport = async (): Promise<void> => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const payload = await resolveExportPayload();
      await exportGridToPdf({ fileName, columns: payload.columns, rows: payload.rows });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-dashed border-slate-300 dark:border-white/20 bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 text-xs sm:text-sm"
        >
          <Download className="mr-2 h-4 w-4" />
          {t('export')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={handleExcelExport}
          disabled={isExporting || rows.length === 0}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          {t('exportExcel')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handlePdfExport}
          disabled={isExporting || rows.length === 0}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4" />
          {t('exportPdf')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
