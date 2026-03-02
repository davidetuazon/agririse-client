import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { SelectedSolutionHistoryItem } from "../services/api";

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
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - margin * 2;
  let y = 14;
  const brand = [0, 104, 74] as const;
  const muted = [90, 110, 118] as const;

  const ensureSpace = (requiredHeight: number) => {
    if (y + requiredHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const drawSectionTitle = (title: string) => {
    ensureSpace(10);
    doc.setFillColor(246, 250, 248);
    doc.rect(margin, y - 4, usableWidth, 8, "F");
    doc.setDrawColor(224, 232, 228);
    doc.rect(margin, y - 4, usableWidth, 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(brand[0], brand[1], brand[2]);
    doc.text(title, margin + 3, y + 1.5);
    y += 10;
  };

  // Header band
  doc.setFillColor(brand[0], brand[1], brand[2]);
  doc.rect(0, 0, pageWidth, 26, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(args.title, margin, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    pageWidth - margin,
    12,
    { align: "right" }
  );
  y = 32;

  drawSectionTitle("Report details");

  const metaRows = [
    ["Sensor", args.sensorLabel ?? "-"],
    ["Date range", `${args.startDate} to ${args.endDate}`],
    ["Metric", args.metric ?? "-"],
    ["Granularity", args.granularity ?? "-"],
    ["Unit", args.unit ?? "-"],
  ];
  autoTable(doc, {
    startY: y - 1,
    head: [["Field", "Value"]],
    body: metaRows,
    styles: { fontSize: 9, cellPadding: 2.3, textColor: [30, 41, 59] },
    headStyles: { fillColor: [236, 244, 240], textColor: [0, 104, 74] },
    alternateRowStyles: { fillColor: [250, 252, 251] },
    theme: "grid",
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: "bold" },
      1: { cellWidth: usableWidth - 40 },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  drawSectionTitle("Aggregated summary");

  const u = args.unit ? ` ${args.unit}` : "";
  autoTable(doc, {
    startY: y - 1,
    head: [["Metric", "Value"]],
    body: [
      ["Average", `${args.summary.avg.toFixed(2)}${u}`],
      ["Minimum", `${args.summary.min.toFixed(2)}${u}`],
      ["Maximum", `${args.summary.max.toFixed(2)}${u}`],
      ["Variability (Std Dev, σ)", `${args.summary.stdDev.toFixed(2)}${u}`],
    ],
    styles: { fontSize: 10, cellPadding: 2.6, textColor: [17, 24, 39] },
    headStyles: { fillColor: [236, 244, 240], textColor: [0, 104, 74] },
    columnStyles: {
      0: { cellWidth: usableWidth * 0.62, fontStyle: "bold" },
      1: { cellWidth: usableWidth * 0.38, halign: "right" },
    },
    alternateRowStyles: { fillColor: [250, 252, 251] },
    theme: "grid",
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  if (args.chartPngDataUrl) {
    drawSectionTitle("Trend chart");
    ensureSpace(100);
    const imgX = margin;
    const imgY = y;
    const imgW = usableWidth;
    const imgH = 96;
    doc.addImage(args.chartPngDataUrl, "PNG", imgX, imgY, imgW, imgH);
    y += imgH + 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(muted[0], muted[1], muted[2]);
    doc.text(
      "Chart visualizes the selected date range and metric trend used in this export.",
      margin,
      y
    );
  }

  doc.setTextColor(0, 0, 0);
  return doc;
}

type HistoryPdfArgs = {
  title: string;
  startDate: string;
  endDate: string;
  unit?: string;
  chartPngDataUrl?: string;
  // NOTE: rows should be in the same order as the UI table (newest -> oldest).
  rows: Array<{ recordedAt: string; value: number; _id?: string }>;
};

export function buildHistoryPdf(args: HistoryPdfArgs) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const margin = 12;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - margin * 2;
  let y = 14;
  const brand = [0, 104, 74] as const;

  const ensureSpace = (requiredHeight: number) => {
    if (y + requiredHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const drawSectionTitle = (title: string) => {
    ensureSpace(10);
    doc.setFillColor(246, 250, 248);
    doc.rect(margin, y - 4, usableWidth, 8, "F");
    doc.setDrawColor(224, 232, 228);
    doc.rect(margin, y - 4, usableWidth, 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(brand[0], brand[1], brand[2]);
    doc.text(title, margin + 3, y + 1.5);
    y += 10;
  };

  // Header band
  doc.setFillColor(brand[0], brand[1], brand[2]);
  doc.rect(0, 0, pageWidth, 24, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(args.title, margin, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    pageWidth - margin,
    12,
    { align: "right" }
  );
  y = 30;

  drawSectionTitle("Report details");
  autoTable(doc, {
    startY: y - 1,
    head: [["Field", "Value"]],
    body: [
      ["Date range", `${args.startDate} to ${args.endDate}`],
      ["Unit", args.unit ?? "-"],
      ["Rows", `${args.rows.length}`],
    ],
    styles: { fontSize: 9, cellPadding: 2.3, textColor: [30, 41, 59] },
    headStyles: { fillColor: [236, 244, 240], textColor: [0, 104, 74] },
    alternateRowStyles: { fillColor: [250, 252, 251] },
    theme: "grid",
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: "bold" },
      1: { cellWidth: usableWidth - 38 },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  if (args.chartPngDataUrl) {
    drawSectionTitle("Trend chart");
    ensureSpace(78);
    const imgX = margin;
    const imgY = y;
    const imgW = usableWidth;
    const imgH = 70;
    doc.addImage(args.chartPngDataUrl, "PNG", imgX, imgY, imgW, imgH);
    y += imgH + 8;
  }

  drawSectionTitle("History table");

  autoTable(doc, {
    startY: y - 1,
    head: [["Timestamp (UTC)", "Value", "Delta (from previous)"]],
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
      ];
    }),
    styles: { fontSize: 8.6, cellPadding: 2.2, textColor: [17, 24, 39] },
    headStyles: { fillColor: [236, 244, 240], textColor: [0, 104, 74] },
    alternateRowStyles: { fillColor: [250, 252, 251] },
    theme: "grid",
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: usableWidth * 0.52 },
      1: { cellWidth: usableWidth * 0.2, halign: "right" },
      2: { cellWidth: usableWidth * 0.28, halign: "right" },
    },
  });

  doc.setTextColor(0, 0, 0);
  return doc;
}

type SelectedSolutionPdfArgs = {
  title: string;
  item: SelectedSolutionHistoryItem;
  chartPngDataUrl?: string;
};

export function buildSelectedSolutionPdf(args: SelectedSolutionPdfArgs) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const margin = 12;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - margin * 2;
  let y = 14;
  const brand = [0, 104, 74] as const;

  const ensureSpace = (requiredHeight: number) => {
    if (y + requiredHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const drawSectionTitle = (title: string) => {
    ensureSpace(10);
    doc.setFillColor(246, 250, 248);
    doc.rect(margin, y - 4, usableWidth, 8, "F");
    doc.setDrawColor(224, 232, 228);
    doc.rect(margin, y - 4, usableWidth, 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(brand[0], brand[1], brand[2]);
    doc.text(title, margin + 3, y + 1.5);
    y += 10;
  };

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const d = new Date(value);
    if (!Number.isFinite(d.getTime())) return "-";
    return d.toLocaleString();
  };

  const formatNum = (value: unknown, digits = 2) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return "-";
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
    });
  };

  const prettifyName = (value?: string | null) => {
    if (!value) return "-";
    return value.replace(/_/g, " ").trim();
  };

  const scenario = args.item.runSnapshot?.inputSnapshot?.scenario ?? "-";
  const supply = args.item.runSnapshot?.inputSnapshot?.totalSeasonalWaterSupplyM3;
  const selectedBy = args.item.selectedBy?.name ?? "-";
  const objectiveValues = args.item.solutionSnapshot?.objectiveValues ?? {};
  const allocationVector = args.item.solutionSnapshot?.allocationVector ?? [];

  // Header band
  doc.setFillColor(brand[0], brand[1], brand[2]);
  doc.rect(0, 0, pageWidth, 24, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(args.title, margin, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 12, { align: "right" });
  y = 30;

  drawSectionTitle("Selected solution details");
  autoTable(doc, {
    startY: y - 1,
    head: [["Field", "Value"]],
    body: [
      ["Run ID", args.item.runId ?? "-"],
      ["Solution ID", args.item.solutionId ?? "-"],
      ["Scenario", scenario],
      ["Selected at", formatDateTime(args.item.createdAt)],
      ["Selected by", selectedBy],
      ["Total seasonal water supply (m3)", supply != null ? formatNum(supply, 2) : "-"],
      ["Allocation rows", String(allocationVector.length)],
    ],
    styles: { fontSize: 9, cellPadding: 2.3, textColor: [30, 41, 59] },
    headStyles: { fillColor: [236, 244, 240], textColor: [0, 104, 74] },
    alternateRowStyles: { fillColor: [250, 252, 251] },
    theme: "grid",
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 56, fontStyle: "bold" },
      1: { cellWidth: usableWidth - 56 },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  drawSectionTitle("Objectives (View details)");
  const objectiveRows =
    Object.entries(objectiveValues).length > 0
      ? Object.entries(objectiveValues).map(([key, obj]) => [
          key,
          formatNum(obj?.value, 2),
          obj?.unit ?? "-",
          obj?.direction ?? "-",
        ])
      : [["-", "-", "-", "-"]];

  autoTable(doc, {
    startY: y - 1,
    head: [["Objective", "Value", "Unit", "Direction"]],
    body: objectiveRows,
    styles: { fontSize: 8.8, cellPadding: 2.2, textColor: [17, 24, 39] },
    headStyles: { fillColor: [236, 244, 240], textColor: [0, 104, 74] },
    alternateRowStyles: { fillColor: [250, 252, 251] },
    theme: "grid",
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  if (args.chartPngDataUrl) {
    drawSectionTitle("Allocation bar chart (View details)");
    ensureSpace(78);
    const imgX = margin;
    const imgY = y;
    const imgW = usableWidth;
    const imgH = 70;
    doc.addImage(args.chartPngDataUrl, "PNG", imgX, imgY, imgW, imgH);
    y += imgH + 8;
  }

  drawSectionTitle("Allocation table (View details)");
  autoTable(doc, {
    startY: y - 1,
    head: [["Lateral", "Allocated (m3)", "Effective (m3)", "Coverage %"]],
    body:
      allocationVector.length > 0
        ? allocationVector.map((alloc) => {
            const cov = alloc.coveragePercentage;
            const covDisplay =
              typeof cov === "number" && Number.isFinite(cov) ? `${cov.toFixed(1)}%` : "-";
            return [
              prettifyName(alloc.mainLateralId),
              formatNum(alloc.allocatedWaterM3, 2),
              alloc.effectiveWaterM3 != null ? formatNum(Number(alloc.effectiveWaterM3), 2) : "-",
              covDisplay,
            ];
          })
        : [["-", "-", "-", "-"]],
    styles: { fontSize: 8.6, cellPadding: 2.1, textColor: [17, 24, 39] },
    headStyles: { fillColor: [236, 244, 240], textColor: [0, 104, 74] },
    alternateRowStyles: { fillColor: [250, 252, 251] },
    theme: "grid",
    margin: { left: margin, right: margin },
  });

  doc.setTextColor(0, 0, 0);
  return doc;
}

