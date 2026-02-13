export function formatUtcTimestamp(value: unknown): string | null {
  if (!value) return null;

  const d = new Date(value as any);
  if (Number.isNaN(d.getTime())) return null;

  return `${d.toISOString().replace('T', ' ').slice(0, 19)} UTC`;
}

export function formatFixed(value: unknown, digits = 2): string {
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : NaN;

  return Number.isFinite(n) ? n.toFixed(digits) : '--';
}

