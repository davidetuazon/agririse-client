export type AnalyticsGranularity = "hourly" | "daily" | "weekly";

export type AnalyticsSeriesPoint = {
  timestamp: string;
  total?: number | null;
  avg: number | null;
  min: number | null;
  max: number | null;
  stdDev: number | null;
  count: number | null;
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

function parseUtcStart(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00.000Z`).getTime();
}

function parseUtcEnd(dateStr: string): number {
  return new Date(`${dateStr}T23:59:59.999Z`).getTime();
}

function stepMsForGranularity(granularity: string): number {
  if (granularity === "hourly") return HOUR_MS;
  if (granularity === "daily") return DAY_MS;
  return WEEK_MS;
}

function alignToUtcStep(timestampMs: number, granularity: string): number {
  const d = new Date(timestampMs);
  if (granularity === "hourly") {
    d.setUTCMinutes(0, 0, 0);
    return d.getTime();
  }
  if (granularity === "daily") {
    d.setUTCHours(0, 0, 0, 0);
    return d.getTime();
  }
  // Weekly buckets in backend use ISO week-like UTC truncation.
  // Align to Monday 00:00 UTC to match $dateTrunc week behavior.
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay(); // 0 Sun ... 6 Sat
  const daysFromMonday = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - daysFromMonday);
  return d.getTime();
}

export function normalizeAnalyticsSeries(
  series: AnalyticsSeriesPoint[],
  startDate: string,
  endDate: string,
  granularity: string
): AnalyticsSeriesPoint[] {
  const fromMs = parseUtcStart(startDate);
  const toMs = parseUtcEnd(endDate);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs < fromMs) {
    return [...series].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  const sorted = [...series].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const byBucket = new Map<number, AnalyticsSeriesPoint>();
  sorted.forEach((point) => {
    const pointMs = new Date(point.timestamp).getTime();
    if (!Number.isFinite(pointMs)) return;
    byBucket.set(alignToUtcStep(pointMs, granularity), point);
  });

  const step = stepMsForGranularity(granularity);
  const startBucketMs = alignToUtcStep(fromMs, granularity);
  const endBucketMs = alignToUtcStep(toMs, granularity);
  const normalized: AnalyticsSeriesPoint[] = [];

  for (let bucketMs = startBucketMs; bucketMs <= endBucketMs; bucketMs += step) {
    const existing = byBucket.get(bucketMs);
    if (existing) {
      normalized.push(existing);
      continue;
    }
    normalized.push({
      timestamp: new Date(bucketMs).toISOString(),
      total: null,
      avg: null,
      min: null,
      max: null,
      stdDev: null,
      count: null,
    });
  }

  return normalized;
}
