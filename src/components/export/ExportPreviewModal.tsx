import { useEffect } from "react";
import cssStyles from "./ExportPreviewModal.module.css";

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  onDownloadCsv?: () => Promise<void> | void;
  onDownloadJson?: () => Promise<void> | void;
  onDownloadPdf: () => Promise<void> | void;
  busy?: boolean;
};

export default function ExportPreviewModal({
  open,
  title,
  subtitle,
  children,
  onClose,
  onDownloadCsv,
  onDownloadJson,
  onDownloadPdf,
  busy,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cssStyles.modalOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={cssStyles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={cssStyles.modalHeader}>
          <div className={cssStyles.modalHeaderText}>
            <div className={cssStyles.modalTitle}>{title}</div>
            {subtitle && <div className={cssStyles.modalSubtitle}>{subtitle}</div>}
          </div>
          <button
            type="button"
            className={cssStyles.modalClose}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={cssStyles.modalBody}>{children}</div>

        <div className={cssStyles.modalFooter}>
          {onDownloadCsv != null && (
            <button
              type="button"
              className={cssStyles.secondaryButton}
              onClick={() => void onDownloadCsv()}
              disabled={Boolean(busy)}
            >
              Download CSV
            </button>
          )}
          {onDownloadJson != null && (
            <button
              type="button"
              className={cssStyles.secondaryButton}
              onClick={() => void onDownloadJson()}
              disabled={Boolean(busy)}
            >
              Download JSON
            </button>
          )}
          <button
            type="button"
            className={cssStyles.primaryButton}
            onClick={() => void onDownloadPdf()}
            disabled={Boolean(busy)}
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}

