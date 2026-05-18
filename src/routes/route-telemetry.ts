interface RouteTelemetryEntry {
  routeName: string;
  durationMs: number;
  recordedAt: string;
  metric: 'route' | 'screen';
  stage?: string;
}

const STORAGE_KEY = 'wms-route-telemetry:v2';
const MAX_ENTRIES = 120;
const SLOW_ROUTE_THRESHOLD_MS = 4000;

function readEntries(): RouteTelemetryEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as RouteTelemetryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEntries(entries: RouteTelemetryEntry[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    // Ignore storage failures in private browsing or restricted environments.
  }
}

function recordTelemetry(
  routeName: string,
  durationMs: number,
  metric: 'route' | 'screen',
  stage?: string,
): void {
  if (typeof window === 'undefined' || !Number.isFinite(durationMs)) {
    return;
  }

  const entry: RouteTelemetryEntry = {
    routeName,
    durationMs: Math.round(durationMs),
    recordedAt: new Date().toISOString(),
    metric,
    stage,
  };

  const nextEntries = [...readEntries(), entry];
  writeEntries(nextEntries);

  if (durationMs >= SLOW_ROUTE_THRESHOLD_MS) {
    console.warn(`[route-telemetry] Slow route detected`, entry);
  }
}

export function recordRouteTelemetry(routeName: string, durationMs: number): void {
  recordTelemetry(routeName, durationMs, 'route');
}

export function recordScreenTelemetry(routeName: string, durationMs: number, stage = 'ready'): void {
  recordTelemetry(routeName, durationMs, 'screen', stage);
}
