import { api } from '@/lib/axios';
import type { TraceExplorerRecordDto, TraceExplorerResponseDto, TraceExplorerSummaryDto } from '../types/traceExplorer.types';

function valueOf(row: Record<string, unknown>, pascal: string, camel: string): unknown {
  return row[pascal] ?? row[camel];
}

function normalizeSummary(raw: unknown): TraceExplorerSummaryDto {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    auditCount: Number(valueOf(row, 'AuditCount', 'auditCount') ?? 0),
    jobExecutionCount: Number(valueOf(row, 'JobExecutionCount', 'jobExecutionCount') ?? 0),
    jobFailureCount: Number(valueOf(row, 'JobFailureCount', 'jobFailureCount') ?? 0),
    notificationCount: Number(valueOf(row, 'NotificationCount', 'notificationCount') ?? 0),
    integrationCount: Number(valueOf(row, 'IntegrationCount', 'integrationCount') ?? 0),
    firstSeenAt: valueOf(row, 'FirstSeenAt', 'firstSeenAt') ? String(valueOf(row, 'FirstSeenAt', 'firstSeenAt')) : undefined,
    lastSeenAt: valueOf(row, 'LastSeenAt', 'lastSeenAt') ? String(valueOf(row, 'LastSeenAt', 'lastSeenAt')) : undefined,
  };
}

function normalizeRecords(items: unknown, titleKey: string, statusKey: string, timeKey: string, detailKey?: string): TraceExplorerRecordDto[] {
  if (!Array.isArray(items)) return [];
  return items.map((raw) => {
    const row = (raw ?? {}) as Record<string, unknown>;
    const title = String(row[titleKey] ?? row[titleKey.charAt(0).toLowerCase() + titleKey.slice(1)] ?? 'Kayıt');
    const status = row[statusKey] ?? row[statusKey.charAt(0).toLowerCase() + statusKey.slice(1)];
    const timestamp = row[timeKey] ?? row[timeKey.charAt(0).toLowerCase() + timeKey.slice(1)];
    const detail = detailKey ? row[detailKey] ?? row[detailKey.charAt(0).toLowerCase() + detailKey.slice(1)] : undefined;
    return {
      id: Number(valueOf(row, 'Id', 'id') ?? 0),
      title,
      subtitle: String(valueOf(row, 'BranchCode', 'branchCode') ?? '0'),
      status: status ? String(status) : undefined,
      timestamp: timestamp ? String(timestamp) : undefined,
      detail: detail ? String(detail) : undefined,
    };
  });
}

export const traceExplorerApi = {
  async getByTraceId(traceId: string): Promise<TraceExplorerResponseDto> {
    const response = await api.get<{ data?: Record<string, unknown>; Data?: Record<string, unknown> }>(`/api/trace-explorer/${encodeURIComponent(traceId)}`);
    const data = response.data ?? response.Data ?? {};
    return {
      traceId: String(valueOf(data, 'TraceId', 'traceId') ?? traceId),
      summary: normalizeSummary(valueOf(data, 'Summary', 'summary')),
      auditLogs: normalizeRecords(valueOf(data, 'AuditLogs', 'auditLogs'), 'EntityType', 'Result', 'CreatedDate', 'Reason'),
      jobExecutions: normalizeRecords(valueOf(data, 'JobExecutions', 'jobExecutions'), 'JobName', 'Status', 'StartedAt', 'ExceptionMessage'),
      jobFailures: normalizeRecords(valueOf(data, 'JobFailures', 'jobFailures'), 'JobName', 'ExceptionType', 'FailedAt', 'ExceptionMessage'),
      notifications: normalizeRecords(valueOf(data, 'Notifications', 'notifications'), 'Title', 'Severity', 'CreatedDate', 'Message'),
      integrations: normalizeRecords(valueOf(data, 'Integrations', 'integrations'), 'Operation', 'Status', 'StartedAt', 'ErrorMessage'),
    };
  },
};
