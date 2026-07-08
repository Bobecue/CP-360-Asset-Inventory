"use client";

import { useState, useEffect } from "react";
import { getApiUrl } from "../../../utils/api";

interface ReportsTabProps {
  isUsingMockData: boolean;
  mockAuditLogs: any[];
  currentUser: any;
}

export const ReportsTab = ({ isUsingMockData, mockAuditLogs, currentUser }: ReportsTabProps) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const fetchLogs = async () => {
    setIsLoading(true);
    if (isUsingMockData) {
      setLogs(mockAuditLogs);
      setIsLoading(false);
    } else {
      try {
        const res = await fetch(getApiUrl("audit-logs"));
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (err) {
        console.error("Error fetching global logs:", err);
        setLogs(mockAuditLogs);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [isUsingMockData, mockAuditLogs]);

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

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.details || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.action || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.user?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.user?.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.itemName || log.item?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.itemSku || log.item?.sku || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === "ALL" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Panel */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: "1.25rem 1.5rem",
        boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
      }}>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
            Reports & System Logs
          </h2>
          <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
            Detailed audit trail of all actions, inventory changes, and item updates.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            backgroundColor: "#ffffff",
            color: "#475569",
            fontSize: "0.8rem",
            fontWeight: 500,
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f8fafc"; e.currentTarget.style.color = "#0f172a"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; e.currentTarget.style.color = "#475569"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          Refresh Logs
        </button>
      </div>

      {/* Analytics Mini Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
        {[
          {
            title: "Total Actions Logged",
            value: logs.length,
            desc: "System activity logs",
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" fill="rgba(33, 12, 174, 0.15)" stroke="none" />
                <line x1="9" y1="9" x2="15" y2="9" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="15" y2="17" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
            )
          },
          {
            title: "Item Creations",
            value: logs.filter(l => l.action === "ITEM_CREATED").length,
            desc: "New catalog SKUs",
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" fill="rgba(33, 12, 174, 0.15)" stroke="none" />
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            )
          },
          {
            title: "Modifications",
            value: logs.filter(l => l.action === "ITEM_UPDATED").length,
            desc: "Edits & Updates",
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="rgba(33, 12, 174, 0.15)" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            )
          },
          {
            title: "Stock Adjustments",
            value: logs.filter(l => l.action === "STOCK_ADJUSTED").length,
            desc: "Inventory adjustments",
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" fill="rgba(33, 12, 174, 0.15)" stroke="none" />
                <circle cx="12" cy="12" r="10" />
                <path d="M16 12a4 4 0 1 1-4-4h4" />
                <polyline points="12 4 16 8 12 12" />
              </svg>
            )
          },
        ].map((c, idx) => (
          <div key={idx}
            className="metric-card card-shine-effect"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 12,
              padding: "1rem 1.25rem",
              boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                {c.title}
              </span>
              <span style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a" }}>
                {c.value}
              </span>
              <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                {c.desc}
              </span>
            </div>
            <span style={{ display: "flex", alignItems: "center" }}>{c.icon}</span>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: "1rem 1.25rem",
        boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
      }}>
        <div style={{ display: "flex", flex: 1, gap: "1rem", minWidth: "300px", flexWrap: "wrap" }}>
          {/* Search bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: "220px" }}>
            <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Search Logs</label>
            <div style={{ position: "relative" }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                type="text"
                placeholder="Search action, details, user, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-glow"
                style={{
                  width: "100%",
                  padding: "0.45rem 0.65rem 0.45rem 1.85rem",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  fontSize: "0.8rem",
                  color: "#1e293b",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Action Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "180px" }}>
            <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Action Type</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              style={{
                padding: "0.45rem 0.65rem",
                borderRadius: 6,
                border: "1px solid #e2e8f0",
                fontSize: "0.8rem",
                color: "#475569",
                backgroundColor: "#ffffff",
                outline: "none",
              }}
            >
              <option value="ALL">All Actions</option>
              <option value="ITEM_CREATED">Item Creations</option>
              <option value="ITEM_UPDATED">Item Updates</option>
              <option value="STOCK_ADJUSTED">Stock Adjustments</option>
              <option value="ITEM_DELETED">Item Deletions</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
        overflow: "hidden",
      }}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 1rem" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              border: "3px solid rgba(33,12,174,0.15)",
              borderTopColor: "#210cae",
              animation: "spin 0.8s linear infinite",
              marginBottom: "1rem"
            }} />
            <span style={{ fontSize: "0.84rem", color: "#64748b", fontWeight: 500 }}>Loading system logs...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4.5rem 1rem", textAlign: "center" }}>
            <span style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📜</span>
            <span style={{ fontSize: "0.9rem", color: "#0f172a", fontWeight: 700, marginBottom: "0.25rem" }}>No Logs Found</span>
            <span style={{ fontSize: "0.8rem", color: "#64748b", maxWidth: "320px" }}>
              No system activity logs matched your current filters or query.
            </span>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#475569", width: "170px" }}>Timestamp</th>
                  <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#475569", width: "140px" }}>Performed By</th>
                  <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#475569", width: "135px" }}>Action</th>
                  <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#475569", width: "140px" }}>Affected Item</th>
                  <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#475569" }}>Details / Logs</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => (
                  <tr key={log.id || idx} 
                    className="animated-row"
                    style={{
                      borderBottom: idx < filteredLogs.length - 1 ? "1px solid #f1f5f9" : "none",
                      backgroundColor: idx % 2 === 1 ? "#fafbfc" : "#ffffff",
                      transition: "background-color 0.1s ease",
                      animationDelay: `${idx * 0.04}s`,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = idx % 2 === 1 ? "#fafbfc" : "#ffffff"; }}
                  >
                    <td style={{ padding: "0.9rem 1.25rem", color: "#0f172a", fontWeight: 500, whiteSpace: "nowrap" }}>
                      {formatDate(log.createdAt)}
                    </td>
                    <td style={{ padding: "0.9rem 1.25rem" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ color: "#0f172a", fontWeight: 600 }}>{log.user?.name || "System"}</span>
                        <span style={{ fontSize: "0.68rem", color: "#64748b" }}>{log.user?.email || "internal"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "0.9rem 1.25rem" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "6px",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                        ...getActionBadgeStyle(log.action),
                      }}>
                        {formatActionName(log.action)}
                      </span>
                    </td>
                    <td style={{ padding: "0.9rem 1.25rem" }}>
                      {(() => {
                        const name = log.itemName || log.item?.name;
                        const sku = log.itemSku || log.item?.sku;
                        if (name) {
                          const isDeleted = !log.itemId;
                          return (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ 
                                color: isDeleted ? "#64748b" : "#210cae", 
                                fontWeight: 600,
                                fontStyle: isDeleted ? "italic" : "normal"
                              }}>
                                {name} {isDeleted && " (Deleted)"}
                              </span>
                              {sku && (
                                <code style={{ fontSize: "0.68rem", color: "#64748b", fontFamily: "monospace" }}>{sku}</code>
                              )}
                            </div>
                          );
                        }
                        return <span style={{ color: "#94a3b8", fontStyle: "italic" }}>None / Generic</span>;
                      })()}
                    </td>
                    <td style={{ padding: "0.9rem 1.25rem", color: "#334155", lineHeight: "1.4", wordBreak: "break-word" }}>
                      {log.details}
                      {log.ipAddress && (
                        <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: "0.2rem" }}>
                          Client IP: {["::1", "127.0.0.1", "::ffff:127.0.0.1"].includes(log.ipAddress) ? "127.0.0.1 (Localhost)" : log.ipAddress}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
