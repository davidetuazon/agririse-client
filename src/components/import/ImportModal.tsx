import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import Text from "../commons/Text";
import Section from "../commons/Section";
import Button from "../commons/Button";
import { processImportData, saveImportData, type ImportRow } from "../../services/api";
import cssStyles from "./ImportModal.module.css";
import importPageStyles from "../../pages/Import/Import.module.css";

type ImportPreviewResponse = {
  meta: {
    importId: string;
    sensorType: string;
  };
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicates: number;
    readyToImport: number;
  };
  preview: {
    validRows: Array<Record<string, unknown>>;
    invalidRows: Array<{ row: number; error: string; data: Record<string, unknown> }>;
  };
};

function parseCsvRows(csvText: string): ImportRow[] {
  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });
  if (parsed.errors.length > 0) throw new Error(parsed.errors[0].message);
  return parsed.data as ImportRow[];
}

function normalizeJsonToImportRows(parsed: unknown): ImportRow[] {
  if (Array.isArray(parsed)) return parsed as ImportRow[];
  if (
    parsed &&
    typeof parsed === "object" &&
    "series" in parsed &&
    Array.isArray((parsed as { series: unknown[] }).series)
  ) {
    const series = (parsed as { series: Array<Record<string, unknown>> }).series;
    return series.map((s) => {
      const timestamp = s.timestamp ?? s.recordedAt;
      const val = s.avg ?? s.value;
      if (timestamp == null || val == null) {
        return { recordedAt: String(timestamp ?? ""), value: Number(val) || 0 };
      }
      return {
        recordedAt:
          typeof timestamp === "string" ? timestamp : new Date(timestamp as number).toISOString(),
        value: typeof val === "number" ? val : Number(val) || 0,
      };
    });
  }
  throw new Error("JSON must be an array of records or an Analytics export (object with 'series' array).");
}

function formatImportError(err: string): string {
  if (
    err.toLowerCase().includes("all valid rows are duplicates") ||
    err.toLowerCase().includes("all duplicate")
  ) {
    return "All rows in this file already exist for the selected sensor. The data is already in the system.";
  }
  return err;
}

type Props = {
  open: boolean;
  onClose: () => void;
  sensorType: string;
  sensorLabel: string;
};

export default function ImportModal({ open, onClose, sensorType, sensorLabel }: Props) {
  const [inputMode, setInputMode] = useState<"file" | "json">("file");
  const [jsonInput, setJsonInput] = useState("");
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [savingImport, setSavingImport] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const parsedCount = parsedRows.length;
  const canPreview = parsedCount > 0 && !loadingPreview;
  const canSave =
    Boolean(preview?.meta?.importId) &&
    (preview?.summary?.readyToImport ?? 0) > 0 &&
    !savingImport;

  const validPreviewRows = preview?.preview.validRows?.slice(0, 10) ?? [];
  const invalidPreviewRows = preview?.preview.invalidRows?.slice(0, 10) ?? [];
  const validPreviewColumns = useMemo(() => {
    const keys = new Set<string>();
    validPreviewRows.forEach((row) => Object.keys(row).forEach((k) => keys.add(k)));
    return Array.from(keys);
  }, [validPreviewRows]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const resetMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleFileImport = async (file: File | null) => {
    if (!file) return;
    resetMessages();
    setPreview(null);
    try {
      const text = await file.text();
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith(".csv")) {
        setParsedRows(parseCsvRows(text));
        return;
      }
      if (lowerName.endsWith(".json")) {
        const parsedJson = JSON.parse(text);
        setParsedRows(normalizeJsonToImportRows(parsedJson));
        return;
      }
      throw new Error("Unsupported file type. Use .csv or .json.");
    } catch (e: unknown) {
      setParsedRows([]);
      setErrorMessage(e instanceof Error ? e.message : "Failed to parse file.");
    }
  };

  const handleParseJsonInput = () => {
    resetMessages();
    setPreview(null);
    try {
      const parsed = JSON.parse(jsonInput);
      setParsedRows(normalizeJsonToImportRows(parsed));
    } catch {
      setParsedRows([]);
      setErrorMessage("Invalid JSON.");
    }
  };

  const handlePreviewImport = async () => {
    if (!canPreview) return;
    resetMessages();
    setLoadingPreview(true);
    try {
      const response = await processImportData({ data: parsedRows, sensorType });
      if (response?.error) {
        setPreview(null);
        const raw =
          typeof response.error === "string" ? response.error : JSON.stringify(response.error);
        setErrorMessage(formatImportError(raw));
        return;
      }
      setPreview(response as ImportPreviewResponse);
    } catch (e: unknown) {
      setPreview(null);
      setErrorMessage(e instanceof Error ? e.message : "Failed to process import preview.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSaveImport = async () => {
    const importId = preview?.meta?.importId;
    if (!importId) return;
    resetMessages();
    setSavingImport(true);
    try {
      const response = await saveImportData({ importId, sensorType });
      if (response?.error) {
        setErrorMessage(
          typeof response.error === "string" ? response.error : JSON.stringify(response.error)
        );
        return;
      }
      setSuccessMessage(response?.message ?? "Import completed successfully.");
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to save import.");
    } finally {
      setSavingImport(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className={cssStyles.modalOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Import data"
    >
      <div className={cssStyles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={cssStyles.modalHeader}>
          <div className={cssStyles.modalTitle}>Import data</div>
          <button
            type="button"
            className={cssStyles.modalClose}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={cssStyles.modalBody}>
          <Section>
            <div className={importPageStyles.controls}>
              <label className={importPageStyles.controlItem}>
                <span className={cssStyles.sensorReadOnlyLabel}>Sensor type</span>
                <div className={cssStyles.sensorReadOnly} aria-live="polite">
                  {sensorLabel}
                </div>
              </label>

              <div className={importPageStyles.modeToggle}>
                <Button
                  title="Upload File"
                  onButtonPress={() => setInputMode("file")}
                  style={inputMode === "file" ? undefined : { opacity: 0.75 }}
                />
                <Button
                  title="Paste JSON"
                  onButtonPress={() => setInputMode("json")}
                  style={inputMode === "json" ? undefined : { opacity: 0.75 }}
                />
              </div>
            </div>

            {inputMode === "file" ? (
              <div className={importPageStyles.inputPanel}>
                <Text variant="subtitle" style={{ margin: 0 }}>
                  Select a .csv or .json file
                </Text>
                <input
                  className={importPageStyles.fileInput}
                  type="file"
                  accept=".csv,.json,application/json,text/csv"
                  onChange={(e) => void handleFileImport(e.target.files?.[0] ?? null)}
                />
              </div>
            ) : (
              <div className={importPageStyles.inputPanel}>
                <Text variant="subtitle" style={{ margin: 0 }}>
                  Paste JSON array
                </Text>
                <textarea
                  className={importPageStyles.textArea}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='[{"recordedAt":"2026-02-06T10:30:00Z","value":42.1}]'
                />
                <Button title="Parse JSON" onButtonPress={handleParseJsonInput} />
              </div>
            )}

            <div className={importPageStyles.actionsRow}>
              <Text variant="caption" style={{ margin: 0 }}>
                Parsed rows: {parsedCount}
              </Text>
              <Button
                title={loadingPreview ? "Previewing..." : "Preview Import"}
                onButtonPress={() => void handlePreviewImport()}
                disabled={!canPreview}
              />
            </div>

            {errorMessage && (
              <Text variant="caption" style={{ color: "#D14343", margin: 0 }}>
                {errorMessage}
              </Text>
            )}
            {successMessage && (
              <Text variant="caption" style={{ color: "#0F766E", margin: 0 }}>
                {successMessage}
              </Text>
            )}
          </Section>

          {preview && (
            <Section>
              <div className={importPageStyles.previewHeader}>
                <Text variant="heading" style={{ margin: 0 }}>
                  Import Preview
                </Text>
                <Button
                  title={savingImport ? "Saving..." : "Confirm & Import"}
                  onButtonPress={() => void handleSaveImport()}
                  disabled={!canSave}
                />
              </div>

              <div className={importPageStyles.summaryGrid}>
                <div className={importPageStyles.summaryCard}>
                  <strong>Total rows:</strong> {preview.summary.totalRows}
                </div>
                <div className={importPageStyles.summaryCard}>
                  <strong>Valid rows:</strong> {preview.summary.validRows}
                </div>
                <div className={importPageStyles.summaryCard}>
                  <strong>Invalid rows:</strong> {preview.summary.invalidRows}
                </div>
                <div className={importPageStyles.summaryCard}>
                  <strong>Duplicates:</strong> {preview.summary.duplicates}
                </div>
                <div className={importPageStyles.summaryCard}>
                  <strong>Ready to import:</strong> {preview.summary.readyToImport}
                </div>
              </div>

              <Text variant="subtitle" style={{ marginBottom: 8 }}>
                Valid sample rows
              </Text>
              {validPreviewRows.length > 0 ? (
                <div className={importPageStyles.tableWrap}>
                  <table className={importPageStyles.table}>
                    <thead>
                      <tr>
                        {validPreviewColumns.map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {validPreviewRows.map((row, idx) => (
                        <tr key={`valid-${idx}`}>
                          {validPreviewColumns.map((col) => (
                            <td key={`${idx}-${col}`}>{String(row[col] ?? "—")}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Text variant="caption">No valid preview rows.</Text>
              )}

              {invalidPreviewRows.length > 0 && (
                <>
                  <Text variant="subtitle" style={{ marginBottom: 8 }}>
                    Invalid sample rows
                  </Text>
                  <div className={importPageStyles.tableWrap}>
                    <table className={importPageStyles.table}>
                      <thead>
                        <tr>
                          <th>Row</th>
                          <th>Error</th>
                          <th>Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invalidPreviewRows.map((row) => (
                          <tr key={`invalid-${row.row}`}>
                            <td>{row.row}</td>
                            <td className={importPageStyles.errorCell}>{row.error}</td>
                            <td>{JSON.stringify(row.data)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
