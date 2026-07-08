"use client";

import React from "react";
import { CatalogItem } from "@/types/dashboard";

interface ItemHistoryModalProps {
  isOpen: boolean;
  item: CatalogItem | null;
  historyLogs: any[];
  isLoading: boolean;
  onClose: () => void;
}

export const ItemHistoryModal = ({
  isOpen,
  item,
  historyLogs,
  isLoading,
  onClose,
}: ItemHistoryModalProps) => {
  if (!isOpen || !item) return null;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getActionBadgeStyle = (action: string) => {
    switch (action) {
      case "ITEM_CREATED":
        return { backgroundColor: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" };
      case "ITEM_UPDATED":
        return { backgroundColor: "#fef3c7", color: "#d97706", border: "1px solid #fde68a" };
      case "ITEM_DELETED":
        return { backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca" };
      case "STOCK_ADJUSTED":
        return { backgroundColor: "#d1fae5", color: "#065f46", border: "1px solid #a7f3d0" };
      default:
        return { backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" };
    }
  };

  const formatActionName = (action: string) => {
    return action.replace(/_/g, " ");
  };

  const parseLogDetails = (details: string) => {
    if (!details) return { mainDetails: "", remarks: "" };
    
    const commentMarker = ". Comments: ";
    const commentIdx = details.indexOf(commentMarker);
    
    const reasonMarker = ". Reason: ";
    const reasonIdx = details.indexOf(reasonMarker);
    
    let mainDetails = details;
    let remarks = "";
    
    if (commentIdx > -1) {
      mainDetails = details.substring(0, commentIdx);
      remarks = details.substring(commentIdx + commentMarker.length);
      
      const subReasonIdx = mainDetails.indexOf(reasonMarker);
      if (subReasonIdx > -1) {
        mainDetails = mainDetails.substring(0, subReasonIdx);
      }
    } else if (reasonIdx > -1) {
      mainDetails = details.substring(0, reasonIdx);
      // Fallback: put the reason as the remark if there are no explicit comments
      const reasonStr = details.substring(reasonIdx + reasonMarker.length);
      remarks = reasonStr.replace(/_/g, " ");
    }
    
    return { mainDetails, remarks };
  };

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
      zIndex: 1100,
    }}>
      <div style={{
        width: "95%",
        maxWidth: "850px",
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        border: "1px solid #e2e8f0",
        animation: "scaleIn 0.2s ease-out",
        maxHeight: "85vh",
      }}>
        {/* Modal Header */}
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              backgroundColor: "rgba(33, 12, 174, 0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#210cae", flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Item Change History
              </h3>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                Audit logs for <strong>{item.name}</strong> ({item.sku})
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer", color: "#94a3b8",
              display: "flex", alignItems: "center", padding: "4px", borderRadius: "4px"
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column" }}>
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 1rem", flex: 1 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                border: "3px solid rgba(33,12,174,0.15)",
                borderTopColor: "#210cae",
                animation: "spin 0.8s linear infinite",
                marginBottom: "0.75rem"
              }} />
              <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 500 }}>Fetching modifications history...</span>
            </div>
          ) : historyLogs.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3.5rem 1rem", textAlign: "center", flex: 1 }}>
              <span style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📜</span>
              <span style={{ fontSize: "0.88rem", color: "#0f172a", fontWeight: 600, marginBottom: "0.25rem" }}>No Changes Found</span>
              <span style={{ fontSize: "0.78rem", color: "#64748b", maxWidth: "340px" }}>
                There are no documented edits or modifications logged for this catalog item in the database.
              </span>
            </div>
          ) : (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "#475569", width: "140px" }}>Date & Time</th>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "#475569", width: "110px" }}>User</th>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "#475569", width: "100px" }}>Action</th>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "#475569", width: "230px" }}>Details / Modifications</th>
                    <th style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "#475569", width: "200px" }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLogs.map((log, idx) => {
                    const parsed = parseLogDetails(log.details);
                    return (
                      <tr key={log.id || idx} style={{
                        borderBottom: idx < historyLogs.length - 1 ? "1px solid #f1f5f9" : "none",
                        backgroundColor: idx % 2 === 1 ? "#fafbfc" : "#ffffff",
                      }}>
                        <td style={{ padding: "0.85rem 1rem", color: "#0f172a", fontWeight: 500, whiteSpace: "nowrap" }}>
                          {formatDate(log.createdAt)}
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ color: "#0f172a", fontWeight: 600 }}>{log.user?.name || "System"}</span>
                            <span style={{ fontSize: "0.68rem", color: "#64748b" }}>{log.user?.email || "internal"}</span>
                          </div>
                        </td>
                        <td style={{ padding: "0.85rem 1rem" }}>
                          <span style={{
                            display: "inline-block",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "6px",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.02em",
                            ...getActionBadgeStyle(log.action),
                          }}>
                            {formatActionName(log.action)}
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem 1rem", color: "#334155", lineHeight: "1.35", wordBreak: "normal", overflowWrap: "break-word" }}>
                          {parsed.mainDetails}
                          {log.ipAddress && (
                            <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                              IP Address: {log.ipAddress}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "0.85rem 1rem", color: "#475569", lineHeight: "1.35", wordBreak: "normal", overflowWrap: "break-word", fontStyle: "italic" }}>
                          {parsed.remarks || <span style={{ color: "#cbd5e1" }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "1rem 1.5rem",
          borderTop: "1px solid #e2e8f0",
          backgroundColor: "#f8fafc",
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.45rem 1.25rem",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#475569",
              fontSize: "0.8rem",
              fontWeight: 500,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; e.currentTarget.style.color = "#0f172a"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; e.currentTarget.style.color = "#475569"; }}
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};
