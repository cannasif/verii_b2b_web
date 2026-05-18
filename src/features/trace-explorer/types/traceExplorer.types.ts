export interface TraceExplorerSummaryDto {
  auditCount: number;
  jobExecutionCount: number;
  jobFailureCount: number;
  notificationCount: number;
  integrationCount: number;
  firstSeenAt?: string;
  lastSeenAt?: string;
}

export interface TraceExplorerRecordDto {
  id: number;
  title: string;
  subtitle?: string;
  status?: string;
  timestamp?: string;
  detail?: string;
}

export interface TraceExplorerResponseDto {
  traceId: string;
  summary: TraceExplorerSummaryDto;
  auditLogs: TraceExplorerRecordDto[];
  jobExecutions: TraceExplorerRecordDto[];
  jobFailures: TraceExplorerRecordDto[];
  notifications: TraceExplorerRecordDto[];
  integrations: TraceExplorerRecordDto[];
}
