function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  let s = String(value);
  const needsQuotes = s.includes(",") || s.includes("\n") || s.includes("\r") || s.includes("\"");
  if (s.includes("\"")) s = s.replace(/"/g, "\"\"");
  return needsQuotes ? `"${s}"` : s;
}

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: string[]): string {
  const header = columns.join(",");
  const body = rows.map((row) => columns.map((c) => escapeCsvValue((row as any)[c])).join(","));
  return [header, ...body].join("\n");
}

export function downloadTextFile(filename: string, mimeType: string, content: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

