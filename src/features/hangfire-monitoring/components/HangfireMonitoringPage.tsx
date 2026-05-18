import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTableGrid, type DataTableGridColumn } from '@/components/shared';
import { useUIStore } from '@/stores/ui-store';
import {
  useHangfireDeadLetterQuery,
  useHangfireFailedJobsQuery,
  useHangfireManualSyncJobsQuery,
  useHangfireRecurringJobsQuery,
  useHangfireStatsQuery,
  useHangfireSuccessesQuery,
  useTriggerRecurringJobMutation,
  useTriggerManualSyncMutation,
} from '../hooks/useHangfireMonitoring';
import type { HangfireJobItemDto, HangfireRecurringJobItemDto } from '../types/hangfireMonitoring.types';

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
type RecurringColumnKey = 'id' | 'job' | 'cron' | 'nextExecution' | 'lastExecution' | 'queue';
type FailureColumnKey = 'jobId' | 'jobName' | 'state' | 'time' | 'reason';
type SuccessColumnKey = 'jobId' | 'jobName' | 'recurringJobId' | 'queue' | 'duration' | 'retryCount' | 'time';

function formatDate(value?: string): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(value));
}

function formatWorkName(value?: string): string {
  const normalized = (value ?? '').trim();
  if (!normalized) return '-';

  if (normalized.includes('CustomerSyncJob') || normalized.includes('ICustomerSyncJob')) return 'Cari senkronizasyon işi';
  if (normalized.includes('StockSyncJob') || normalized.includes('IStockSyncJob')) return 'Stok ve katalog senkronizasyon işi';
  if (normalized.includes('WarehouseSyncJob') || normalized.includes('IWarehouseSyncJob')) return 'Depo senkronizasyon işi';
  if (normalized.includes('YapKodSyncJob') || normalized.includes('IYapKodSyncJob')) return 'YapKod senkronizasyon işi';
  if (normalized.includes('HangfireDeadLetterJob') || normalized.includes('IHangfireDeadLetterJob')) return 'Hata kuyruğu işleyici';

  return normalized
    .replace(/\bmirror\b/gi, 'eşleme')
    .replace(/\bjob\b/gi, 'iş')
    .replace(/\bsync\b/gi, 'senkronizasyon');
}

function formatStatus(value?: string): string {
  const normalized = (value ?? '').toLowerCase();
  if (normalized === 'failed') return 'Başarısız';
  if (normalized === 'enqueued') return 'Kuyrukta';
  if (normalized === 'succeeded') return 'Başarılı';
  if (normalized === 'processing') return 'Çalışıyor';
  if (normalized === 'scheduled') return 'Zamanlandı';
  return value || '-';
}

function formatReason(value?: string): string | undefined {
  if (!value) return undefined;
  if (value.includes('IJobFailureLogWriter') && value.includes('Unable to resolve service')) {
    return 'İş hata kayıt servisi tanımlı olmadığı için çalışmadı. Servis kaydı düzeltildi; API yeniden başlatıldıktan sonra yeni tetiklemelerde bu hata alınmamalı.';
  }

  return value;
}

function MetricCard({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'danger' | 'success' }): ReactElement {
  const toneClass = tone === 'danger'
    ? 'from-rose-500/15 to-orange-500/10 text-rose-700 dark:text-rose-200'
    : tone === 'success'
      ? 'from-emerald-500/15 to-teal-500/10 text-emerald-700 dark:text-emerald-200'
      : 'from-slate-500/10 to-cyan-500/10 text-slate-900 dark:text-white';

  return (
    <Card className={`overflow-hidden bg-gradient-to-br ${toneClass}`}>
      <CardContent className="pt-1">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
        <div className="mt-3 text-4xl font-black tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

function normalizeCron(cron?: string): string {
  if (!cron) return '-';
  return cron.length > 24 ? `${cron.slice(0, 24)}...` : cron;
}

function formatDuration(durationMs?: number): string {
  if (!durationMs || durationMs <= 0) return '-';
  if (durationMs < 1000) return `${durationMs} ms`;
  return `${(durationMs / 1000).toFixed(durationMs >= 10_000 ? 0 : 1)} sn`;
}

export function HangfireMonitoringPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const statsQuery = useHangfireStatsQuery();
  const manualJobsQuery = useHangfireManualSyncJobsQuery();
  const recurringJobsQuery = useHangfireRecurringJobsQuery();
  const triggerMutation = useTriggerManualSyncMutation();
  const triggerRecurringMutation = useTriggerRecurringJobMutation();
  const [selectedRecurringJobId, setSelectedRecurringJobId] = useState('');
  const [recurringPage, setRecurringPage] = useState(1);
  const [recurringPageSize, setRecurringPageSize] = useState<number>(10);
  const [failedPage, setFailedPage] = useState(1);
  const [failedPageSize, setFailedPageSize] = useState<number>(10);
  const [deadLetterPage, setDeadLetterPage] = useState(1);
  const [deadLetterPageSize, setDeadLetterPageSize] = useState<number>(10);
  const [successPage, setSuccessPage] = useState(1);
  const [successPageSize, setSuccessPageSize] = useState<number>(10);

  const failedFrom = (failedPage - 1) * failedPageSize;
  const deadLetterFrom = (deadLetterPage - 1) * deadLetterPageSize;
  const successFrom = (successPage - 1) * successPageSize;
  const failedQuery = useHangfireFailedJobsQuery(failedFrom, failedPageSize);
  const deadLetterQuery = useHangfireDeadLetterQuery(deadLetterFrom, deadLetterPageSize);
  const successesQuery = useHangfireSuccessesQuery(successFrom, successPageSize);

  useEffect(() => {
    setPageTitle('B2B Operasyon İzleme');
    return () => setPageTitle(null);
  }, [setPageTitle]);

  const stats = statsQuery.data;
  const manualJobs = manualJobsQuery.data ?? stats?.manualSyncJobs ?? [];
  const recurringItems = recurringJobsQuery.data?.items ?? [];
  const recurringTotalPages = Math.max(1, Math.ceil(recurringItems.length / recurringPageSize));
  const recurringRows = recurringItems.slice((recurringPage - 1) * recurringPageSize, recurringPage * recurringPageSize);
  const failedTotalPages = Math.max(1, Math.ceil((failedQuery.data?.total ?? 0) / failedPageSize));
  const deadLetterTotalPages = Math.max(1, Math.ceil((deadLetterQuery.data?.total ?? 0) / deadLetterPageSize));
  const successTotalPages = Math.max(1, Math.ceil((successesQuery.data?.total ?? 0) / successPageSize));
  const selectedRecurringJob = useMemo(
    () => recurringItems.find((job) => job.id === selectedRecurringJobId) ?? recurringItems[0] ?? null,
    [recurringItems, selectedRecurringJobId],
  );
  const recurringHealth = useMemo(() => ({
    total: recurringItems.length,
    withErrors: recurringItems.filter((item) => Boolean(item.error)).length,
    withQueue: recurringItems.filter((item) => Boolean(item.queue)).length,
  }), [recurringItems]);

  useEffect(() => {
    const firstJobId = recurringItems[0]?.id;
    if (!selectedRecurringJobId && firstJobId) {
      setSelectedRecurringJobId(firstJobId);
    }
  }, [recurringItems, selectedRecurringJobId]);

  const recurringColumns: DataTableGridColumn<RecurringColumnKey>[] = [
    { key: 'id', label: 'İş kodu' },
    { key: 'job', label: 'İş' },
    { key: 'cron', label: 'Cron' },
    { key: 'nextExecution', label: 'Sonraki' },
    { key: 'lastExecution', label: 'Son çalışma' },
    { key: 'queue', label: 'Kuyruk' },
  ];
  const failureColumns: DataTableGridColumn<FailureColumnKey>[] = [
    { key: 'jobId', label: 'İş kodu' },
    { key: 'jobName', label: 'İş' },
    { key: 'state', label: 'Durum' },
    { key: 'time', label: 'Tarih' },
    { key: 'reason', label: 'Açıklama' },
  ];
  const successColumns: DataTableGridColumn<SuccessColumnKey>[] = [
    { key: 'jobId', label: 'İş kodu' },
    { key: 'jobName', label: 'İş' },
    { key: 'recurringJobId', label: 'Zamanlanmış iş' },
    { key: 'queue', label: 'Kuyruk' },
    { key: 'duration', label: 'Süre' },
    { key: 'retryCount', label: 'Deneme' },
    { key: 'time', label: 'Tarih' },
  ];

  const renderRecurringCell = (item: HangfireRecurringJobItemDto, key: RecurringColumnKey): ReactElement | string => {
    if (key === 'id') return <span className="font-mono text-xs">{item.id}</span>;
    if (key === 'job') {
      return (
        <div className="flex flex-col gap-1">
          <span className="font-bold text-slate-900 dark:text-white">{formatWorkName(item.jobName)}</span>
          {item.method ? <span className="max-w-[260px] truncate font-mono text-[10px] text-muted-foreground">{item.method}</span> : null}
          {item.error ? <span className="text-[10px] font-bold text-rose-600 dark:text-rose-300">{item.error}</span> : null}
        </div>
      );
    }
    if (key === 'cron') return <Badge variant="secondary" className="font-mono text-[10px]">{normalizeCron(item.cron)}</Badge>;
    if (key === 'nextExecution') return formatDate(item.nextExecution);
    if (key === 'lastExecution') return formatDate(item.lastExecution);
    if (key === 'queue') return <Badge variant="outline">{item.queue ?? '-'}</Badge>;
    return '-';
  };

  const renderFailureCell = (item: HangfireJobItemDto, key: FailureColumnKey): ReactElement | string => {
    if (key === 'jobId') return <span className="font-mono text-xs">{item.jobId || '-'}</span>;
    if (key === 'jobName') return <span className="font-bold text-slate-900 dark:text-white">{formatWorkName(item.jobName)}</span>;
    if (key === 'state') return <Badge variant={item.state === 'Failed' ? 'destructive' : 'secondary'}>{formatStatus(item.state)}</Badge>;
    if (key === 'time') return formatDate(item.failedAt ?? item.enqueuedAt);
    if (key === 'reason') return <span className="line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{formatReason(item.reason) ?? '-'}</span>;
    return '-';
  };

  const renderSuccessCell = (item: HangfireJobItemDto, key: SuccessColumnKey): ReactElement | string | number => {
    if (key === 'jobId') return <span className="font-mono text-xs">{item.jobId || '-'}</span>;
    if (key === 'jobName') return <span className="font-bold text-slate-900 dark:text-white">{formatWorkName(item.jobName)}</span>;
    if (key === 'recurringJobId') return <span className="text-xs text-muted-foreground">{item.recurringJobId || '-'}</span>;
    if (key === 'queue') return <Badge variant="outline">{item.queue || '-'}</Badge>;
    if (key === 'duration') return <Badge variant="secondary">{formatDuration(item.durationMs)}</Badge>;
    if (key === 'retryCount') return item.retryCount ?? 0;
    if (key === 'time') return formatDate(item.finishedAt);
    return '-';
  };

  return (
    <div className="w-full space-y-6">
      <Breadcrumb items={[{ label: t('sidebar.erpMirror') }, { label: t('sidebar.hangfireMonitoring'), isActive: true }]} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Kuyrukta" value={stats?.enqueued ?? 0} />
        <MetricCard label="Çalışıyor" value={stats?.processing ?? 0} />
        <MetricCard label="Başarılı" value={stats?.succeeded ?? 0} tone="success" />
        <MetricCard label="Hatalı" value={stats?.failed ?? 0} tone="danger" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.8fr]">
        <Card className="overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,253,250,0.84))] dark:bg-[linear-gradient(135deg,rgba(30,22,39,0.98),rgba(6,78,59,0.34))]">
          <CardHeader>
            <CardTitle>Zamanlanmış iş tetikleyici</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="space-y-2">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Zamanlanmış iş seç</div>
                <Select value={selectedRecurringJobId} onValueChange={setSelectedRecurringJobId}>
                  <SelectTrigger>
                    <SelectValue placeholder="İş seç" />
                  </SelectTrigger>
                  <SelectContent>
                    {recurringItems.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {formatWorkName(job.jobName)} ({job.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                disabled={!selectedRecurringJobId || triggerRecurringMutation.isPending}
                onClick={() => selectedRecurringJobId && triggerRecurringMutation.mutate(selectedRecurringJobId)}
              >
                Seçili işi çalıştır
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">İş kodu</div>
                <div className="mt-2 font-mono text-sm text-slate-900 dark:text-white">{selectedRecurringJob?.id ?? '-'}</div>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Sonraki çalışma</div>
                <div className="mt-2 text-sm text-slate-900 dark:text-white">{formatDate(selectedRecurringJob?.nextExecution)}</div>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Kuyruk</div>
                <div className="mt-2 text-sm text-slate-900 dark:text-white">{selectedRecurringJob?.queue ?? '-'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zamanlanmış iş özeti</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-2xl border border-slate-200/70 p-4 dark:border-white/10">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Toplam iş</div>
              <div className="mt-1 text-3xl font-black">{recurringHealth.total}</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                <div className="text-xs font-bold uppercase tracking-[0.2em]">Kuyruklu</div>
                <div className="mt-1 text-2xl font-black">{recurringHealth.withQueue}</div>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                <div className="text-xs font-bold uppercase tracking-[0.2em]">Hatalı</div>
                <div className="mt-1 text-2xl font-black">{recurringHealth.withErrors}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zamanlanmış işler</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableGrid<HangfireRecurringJobItemDto, RecurringColumnKey>
            columns={recurringColumns}
            visibleColumnKeys={['id', 'job', 'cron', 'nextExecution', 'lastExecution', 'queue']}
            rows={recurringRows}
            rowKey={(row) => row.id}
            renderCell={renderRecurringCell}
            isLoading={recurringJobsQuery.isLoading}
            isError={recurringJobsQuery.isError}
            loadingText="Yükleniyor"
            errorText="Zamanlanmış iş listesi alınamadı"
            emptyText="Zamanlanmış iş kaydı yok"
            minTableWidthClassName="min-w-[900px]"
            pageSize={recurringPageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={(size) => {
              setRecurringPageSize(size);
              setRecurringPage(1);
            }}
            pageNumber={recurringPage}
            totalPages={recurringTotalPages}
            hasPreviousPage={recurringPage > 1}
            hasNextPage={recurringPage < recurringTotalPages}
            onPreviousPage={() => setRecurringPage((page) => Math.max(1, page - 1))}
            onNextPage={() => setRecurringPage((page) => Math.min(recurringTotalPages, page + 1))}
            previousLabel="Önceki"
            nextLabel="Sonraki"
            paginationInfoText={`Toplam: ${recurringJobsQuery.data?.total ?? 0}`}
            rowClassName={(row) => (selectedRecurringJobId === row.id ? 'bg-emerald-50 dark:bg-emerald-500/10' : undefined)}
            onRowClick={(row) => setSelectedRecurringJobId(row.id)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>B2B manuel eşleme kısayolları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {manualJobs.map((job) => (
              <div key={job.jobKey} className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="font-semibold text-slate-900 dark:text-white">{formatWorkName(job.jobName)}</div>
                <div className="mt-1 text-xs text-muted-foreground">Son tetikleme: {formatDate(job.lastTriggeredAtUtc)}</div>
                <Button
                  className="mt-4 w-full"
                  size="sm"
                  disabled={job.isCoolingDown || triggerMutation.isPending}
                  onClick={() => triggerMutation.mutate(job.jobKey)}
                >
                  {job.isCoolingDown ? `${job.cooldownSecondsRemaining}s bekle` : 'Manuel çalıştır'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Başarısız işler</CardTitle>
          <CardDescription>Hata alan arka plan işleri sayfalı liste olarak izlenir.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTableGrid<HangfireJobItemDto, FailureColumnKey>
            columns={failureColumns}
            visibleColumnKeys={['jobId', 'jobName', 'state', 'time', 'reason']}
            rows={failedQuery.data?.items ?? []}
            rowKey={(row) => `failed-${row.jobId}-${row.failedAt ?? ''}`}
            renderCell={renderFailureCell}
            isLoading={failedQuery.isLoading}
            isError={failedQuery.isError}
            loadingText="Yükleniyor"
            errorText="Başarısız iş listesi alınamadı"
            emptyText="Şu an kayıtlı hata yok"
            minTableWidthClassName="min-w-[980px]"
            pageSize={failedPageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={(size) => {
              setFailedPageSize(size);
              setFailedPage(1);
            }}
            pageNumber={failedPage}
            totalPages={failedTotalPages}
            hasPreviousPage={failedPage > 1}
            hasNextPage={failedPage < failedTotalPages}
            onPreviousPage={() => setFailedPage((page) => Math.max(1, page - 1))}
            onNextPage={() => setFailedPage((page) => Math.min(failedTotalPages, page + 1))}
            previousLabel="Önceki"
            nextLabel="Sonraki"
            paginationInfoText={`Toplam: ${failedQuery.data?.total ?? 0}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Başarılı aktarımlar</CardTitle>
          <CardDescription>Tamamlanan arka plan işleri sayfalı liste olarak izlenir.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTableGrid<HangfireJobItemDto, SuccessColumnKey>
            columns={successColumns}
            visibleColumnKeys={['jobId', 'jobName', 'recurringJobId', 'queue', 'duration', 'retryCount', 'time']}
            rows={successesQuery.data?.items ?? []}
            rowKey={(row) => `success-${row.jobId}-${row.finishedAt ?? ''}`}
            renderCell={renderSuccessCell}
            isLoading={successesQuery.isLoading}
            isError={successesQuery.isError}
            loadingText="Yükleniyor"
            errorText="Başarılı aktarım listesi alınamadı"
            emptyText="Henüz başarılı iş kaydı yok"
            minTableWidthClassName="min-w-[1100px]"
            pageSize={successPageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={(size) => {
              setSuccessPageSize(size);
              setSuccessPage(1);
            }}
            pageNumber={successPage}
            totalPages={successTotalPages}
            hasPreviousPage={successPage > 1}
            hasNextPage={successPage < successTotalPages}
            onPreviousPage={() => setSuccessPage((page) => Math.max(1, page - 1))}
            onNextPage={() => setSuccessPage((page) => Math.min(successTotalPages, page + 1))}
            previousLabel="Önceki"
            nextLabel="Sonraki"
            paginationInfoText={`Toplam: ${successesQuery.data?.total ?? 0}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hata kuyruğu</CardTitle>
          <CardDescription>Tekrar denemelerden sonra ayrılan işler sayfalı liste olarak izlenir.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTableGrid<HangfireJobItemDto, FailureColumnKey>
            columns={failureColumns}
            visibleColumnKeys={['jobId', 'jobName', 'state', 'time', 'reason']}
            rows={deadLetterQuery.data?.items ?? []}
            rowKey={(row) => `dead-${row.jobId}-${row.enqueuedAt ?? ''}`}
            renderCell={renderFailureCell}
            isLoading={deadLetterQuery.isLoading}
            isError={deadLetterQuery.isError}
            loadingText="Yükleniyor"
            errorText="Hata kuyruğu listesi alınamadı"
            emptyText="Hata kuyruğu temiz"
            minTableWidthClassName="min-w-[980px]"
            pageSize={deadLetterPageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={(size) => {
              setDeadLetterPageSize(size);
              setDeadLetterPage(1);
            }}
            pageNumber={deadLetterPage}
            totalPages={deadLetterTotalPages}
            hasPreviousPage={deadLetterPage > 1}
            hasNextPage={deadLetterPage < deadLetterTotalPages}
            onPreviousPage={() => setDeadLetterPage((page) => Math.max(1, page - 1))}
            onNextPage={() => setDeadLetterPage((page) => Math.min(deadLetterTotalPages, page + 1))}
            previousLabel="Önceki"
            nextLabel="Sonraki"
            paginationInfoText={`Toplam: ${deadLetterQuery.data?.total ?? 0}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
