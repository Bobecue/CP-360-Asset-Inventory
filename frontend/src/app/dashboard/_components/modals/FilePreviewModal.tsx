"use client";

import { useEffect, useState } from "react";

interface FilePreviewModalProps {
  isOpen: boolean;
  filename: string;
  blob: Blob | null;
  onClose: () => void;
}

export const FilePreviewModal = ({
  isOpen,
  filename,
  blob,
  onClose,
}: FilePreviewModalProps) => {
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [previewRows, setPreviewRows] = useState<string[][]>([]);

  useEffect(() => {
    if (!isOpen || !blob) {
      setPdfUrl("");
      setPreviewRows([]);
      return;
    }

    const lowerName = filename.toLowerCase();
    if (lowerName.endsWith(".pdf") || blob.type === "application/pdf") {
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      return;
    }

    // Parse text-based files (CSV / TSV / Excel mock exports)
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string || "";
      const delimiter = lowerName.endsWith(".csv") ? "," : "\t";
      const lines = text.split("\n").filter((line) => line.trim().length > 0);
      const parsed = lines.map((line) =>
        line.split(delimiter).map((val) => val.replace(/^"|"$/g, "").trim())
      );
      setPreviewRows(parsed.slice(0, 15)); // Show up to first 15 rows
    };
    reader.readAsText(blob);

    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, blob, filename]);

  if (!isOpen || !blob) return null;

  const handleDownload = () => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    onClose();
  };

  const isPdf = filename.toLowerCase().endsWith(".pdf") || blob.type === "application/pdf";

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0,
      width: "100%", height: "100%",
      backgroundColor: "rgba(15, 23, 42, 0.4)",
      backdropFilter: "blur(4px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999999,
    }}>
      <div style={{
        width: "90%",
        maxWidth: "800px",
        height: "80vh",
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        border: "1px solid #e2e8f0",
      }}>
        {/* Modal Header */}
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#f8fafc",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
            <h3 style={{ fontSize: "0.98rem", fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              File Export Preview
            </h3>
            <p style={{ fontSize: "0.72rem", color: "#64748b", margin: 0, fontFamily: "monospace" }}>
              {filename}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#94a3b8", padding: 4, display: "flex", borderRadius: 4,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Modal Content / Preview Area */}
        <div style={{ flex: 1, overflow: "auto", padding: "1.5rem", backgroundColor: "#fdfdfd" }}>
          {isPdf ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", height: "100%" }}>
              <div style={{ padding: "0.75rem 1rem", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, fontSize: "0.76rem", color: "#1e3a8a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <span>Previewing generated PDF document. If the preview is blank, please click <strong>Export PDF</strong> to download and view it directly.</span>
              </div>
              {pdfUrl && (
                <iframe
                  src={pdfUrl}
                  style={{
                    width: "100%",
                    flex: 1,
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  }}
                  title="PDF File Preview"
                />
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ padding: "0.75rem 1rem", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, fontSize: "0.76rem", color: "#1e3a8a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <span>Showing a preview of the first few rows. Click <strong>Download Spreadsheet</strong> to save the complete spreadsheet.</span>
              </div>
              <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.74rem", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      {previewRows[0]?.map((col, cIdx) => (
                        <th key={cIdx} style={{ padding: "0.5rem 0.75rem", fontWeight: 700, color: "#475569" }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.slice(1).map((row, rIdx) => (
                      <tr key={rIdx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} style={{ padding: "0.5rem 0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: "1rem 1.5rem",
          borderTop: "1px solid #e2e8f0",
          backgroundColor: "#f8fafc",
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.5rem",
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              background: "transparent",
              color: "#475569",
              fontSize: "0.8rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            style={{
              padding: "0.45rem 1.25rem",
              borderRadius: 6,
              border: "none",
              background: "linear-gradient(135deg, #210cae 0%, #4dc9e6 100%)",
              color: "#ffffff",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(33,12,174,0.1)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {isPdf ? "Export PDF" : "Download Spreadsheet"}
          </button>
        </div>
      </div>
    </div>
  );
};
