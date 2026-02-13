import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type AnalyticsPdfArgs = {
  title: string;
  sensorLabel?: string;
  startDate: string;
  endDate: string;
  metric?: string;
  granularity?: string;
  unit?: string;
  summary: {
    avg: number;
    min: number;
    max: number;
    stdDev: number;
  };
  chartPngDataUrl?: string;
};

export function buildAnalyticsPdf(args: AnalyticsPdfArgs) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - margin * 2;
  let y = 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(args.title, margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Date range: ${args.startDate} → ${args.endDate}`, margin, y);
  y += 5;
  if (args.metric) {
    doc.text(`Metric: ${args.metric}`, margin, y);
    y += 5;
  }
  if (args.granularity) {
    doc.text(`Granularity: ${args.granularity}`, margin, y);
    y += 5;
  }

  y += 2;
  doc.setFont("helvetica", "bold");
  doc.text("Summary", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const u = args.unit ?? "";
  const lines = [
    `Average: ${args.summary.avg.toFixed(2)}${u}`,
    `Min: ${args.summary.min.toFixed(2)}${u}`,
    `Max: ${args.summary.max.toFixed(2)}${u}`,
    `Std Dev (σ): ${args.summary.stdDev.toFixed(2)}`,
  ];
  lines.forEach((t) => {
    doc.text(t, margin, y);
    y += 5;
  });

  y += 4;
  if (args.chartPngDataUrl) {
    // Keep a fixed height for predictability
    const imgX = margin;
    const imgY = y;
    const imgW = usableWidth;
    const imgH = 90;
    doc.addImage(args.chartPngDataUrl, "PNG", imgX, imgY, imgW, imgH);
    y += imgH + 6;
  }

  return doc;
}

type HistoryPdfArgs = {
  title: string;
  startDate: string;
  endDate: string;
  unit?: string;
  // NOTE: rows should be in the same order as the UI table (newest -> oldest).
  rows: Array<{ recordedAt: string; value: number; _id?: string }>;
};

export function buildHistoryPdf(args: HistoryPdfArgs) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const margin = 12;
  let y = 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(args.title, margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Date range: ${args.startDate} → ${args.endDate}`, margin, y);
  y += 6;
  if (args.unit) {
    doc.text(`Unit: ${args.unit}`, margin, y);
    y += 6;
  }

  const now = new Date();
  const elapsedLabel = (timestamp: string) => {
    const recorded = new Date(timestamp);
    const diffMs = now.getTime() - recorded.getTime();
    if (diffMs < 0) return "just now";
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec} sec${diffSec > 1 ? "s" : ""} ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? "s" : ""} ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
  };

  autoTable(doc, {
    startY: y,
    head: [["Timestamp (UTC)", "Value", "Δ (from previous)", "Elapsed"]],
    body: args.rows.map((r, idx) => {
      const delta =
        idx === args.rows.length - 1
          ? "-"
          : Number(r.value) - Number(args.rows[idx + 1].value);
      const deltaLabel =
        delta === "-"
          ? "-"
          : `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}${args.unit ?? ""}`;
      return [
        new Date(r.recordedAt).toISOString().replace("T", " ").slice(0, 19),
        `${Number(r.value).toFixed(2)}${args.unit ?? ""}`,
        deltaLabel,
        elapsedLabel(r.recordedAt),
      ];
    }),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [0, 104, 74] },
    theme: "striped",
    margin: { left: margin, right: margin },
  });

  return doc;
}

