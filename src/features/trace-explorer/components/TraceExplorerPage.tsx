import { type ReactElement, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/stores/ui-store';
import { useTraceExplorerQuery } from '../hooks/useTraceExplorer';
import type { TraceExplorerRecordDto } from '../types/traceExplorer.types';

function formatDate(value?: string): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value));
}

function RecordGroup({ title, rows }: { title: string; rows: TraceExplorerRecordDto[] }): ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{rows.length} kayıt</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-muted-foreground dark:border-white/10">Bu grupta kayıt yok.</div>
          ) : rows.map((row) => (
            <div key={`${title}-${row.id}-${row.timestamp}`} className="rounded-xl border border-slate-200/70 bg-white/70 p-4 text-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">{row.title}</span>
                {row.status ? <Badge variant="secondary">{row.status}</Badge> : null}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Şube: {row.subtitle ?? '0'} · {formatDate(row.timestamp)}</div>
              {row.detail ? <div className="mt-2 text-xs text-slate-700 dark:text-slate-300">{row.detail}</div> : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TraceExplorerPage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const [traceId, setTraceId] = useState('');
  const [submittedTraceId, setSubmittedTraceId] = useState('');
  const query = useTraceExplorerQuery(submittedTraceId);
  const data = query.data;

  useEffect(() => {
    setPageTitle('Trace Explorer');
    return () => setPageTitle(null);
  }, [setPageTitle]);

  return (
    <div className="w-full space-y-6">
      <Breadcrumb items={[{ label: t('sidebar.erpMirror') }, { label: t('sidebar.traceExplorer'), isActive: true }]} />

      <Card className="bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,250,252,0.78))] dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.86))]">
        <CardHeader>
          <CardTitle>Trace Explorer</CardTitle>
          <CardDescription>İz anahtarı ile audit, job, entegrasyon ve bildirim kayıtlarını aynı zaman çizgisinde yakala.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3 md:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmittedTraceId(traceId.trim());
            }}
          >
            <Input value={traceId} onChange={(event) => setTraceId(event.target.value)} placeholder="İz anahtarı gir" />
            <Button type="submit" disabled={traceId.trim().length === 0 || query.isFetching}>Ara</Button>
          </form>
        </CardContent>
      </Card>

      {query.isError ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">Bu iz anahtarı için korele kayıt bulunamadı.</CardContent>
        </Card>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Audit</div><div className="text-3xl font-black">{data.summary.auditCount}</div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Job</div><div className="text-3xl font-black">{data.summary.jobExecutionCount}</div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Hata</div><div className="text-3xl font-black">{data.summary.jobFailureCount}</div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Bildirim</div><div className="text-3xl font-black">{data.summary.notificationCount}</div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Entegrasyon</div><div className="text-3xl font-black">{data.summary.integrationCount}</div></CardContent></Card>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <RecordGroup title="Integration logs" rows={data.integrations} />
            <RecordGroup title="Job executions" rows={data.jobExecutions} />
            <RecordGroup title="Job failures" rows={data.jobFailures} />
            <RecordGroup title="Audit logs" rows={data.auditLogs} />
            <RecordGroup title="Notifications" rows={data.notifications} />
          </div>
        </>
      ) : null}
    </div>
  );
}
