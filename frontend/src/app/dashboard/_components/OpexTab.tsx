"use client";

import React, { useState, useEffect } from "react";

interface OpexEntry {
  id: string;
  itemDescription: string;
  brand?: string;
  unitPrice: number;
  qty: number;
  unit: string;
  category: string;
  total: number;
  status: "PENDING" | "OK" | "FOR_REVIEW" | "REJECTED";
  sourceDocumentUrl?: string;
  transactionDate: string;
  rejectionReason?: string;
  isCapex: boolean;
  supplierName?: string;
  destinationName?: string;
  supplier?: { id: string; name: string };
  department?: { id: string; name: string };
  site?: { id: string; name: string };
  enteredByUser?: { id: string; name: string; email: string };
  approvedByUser?: { id: string; name: string; email: string };
}

interface MonthlyArchive {
  id: string;
  yearMonth: string;
  lockedAt: string;
  summarySnapshot: any;
  lockedByUser?: { name: string; email: string };
}

export default function OpexTab({ currentUser }: { currentUser: any }) {
  const [activeSubTab, setActiveSubTab] = useState<"tracker" | "reports" | "archives">("tracker");
  const [entries, setEntries] = useState<OpexEntry[]>([]);
  const [archives, setArchives] = useState<MonthlyArchive[]>([]);
  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [capexFilter, setCapexFilter] = useState<string>("ALL");

  // Modal states
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<OpexEntry | null>(null);

  // Form states
  const [itemDescription, setItemDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [unitPrice, setUnitPrice] = useState<number | "">("");
  const [qty, setQty] = useState<number | "">("");
  const [unit, setUnit] = useState("PC");
  const [category, setCategory] = useState("OFFICE_SUPPLIES");
  const [supplierName, setSupplierName] = useState("");
  const [destinationName, setDestinationName] = useState("");
  const [sourceDocumentUrl, setSourceDocumentUrl] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split("T")[0]);
  const [isCapex, setIsCapex] = useState(false);

  // Approval Modal form
  const [approveStatus, setApproveStatus] = useState<"OK" | "FOR_REVIEW" | "REJECTED">("OK");
  const [approveDocUrl, setApproveDocUrl] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      let query = `year=${selectedYear}&month=${selectedMonth}`;
      if (statusFilter !== "ALL") query += `&status=${statusFilter}`;
      if (capexFilter !== "ALL") query += `&isCapex=${capexFilter === "CAPEX"}`;

      const res = await fetch(`${backendUrl}/opex/entries?${query}`);
      const json = await res.json();
      setEntries(json.data || []);
    } catch (err) {
      console.error("Failed to fetch OPEX entries:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      const res = await fetch(`${backendUrl}/opex/report?year=${selectedYear}&month=${selectedMonth}`);
      const json = await res.json();
      setReportData(json.data || null);
    } catch (err) {
      console.error("Failed to fetch OPEX report:", err);
    }
  };

  const fetchArchives = async () => {
    try {
      const res = await fetch(`${backendUrl}/opex/archives`);
      const json = await res.json();
      setArchives(json.data || []);
    } catch (err) {
      console.error("Failed to fetch OPEX archives:", err);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchReport();
    fetchArchives();
  }, [selectedYear, selectedMonth, statusFilter, capexFilter]);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemDescription || !unitPrice || !qty) return;

    try {
      const res = await fetch(`${backendUrl}/opex/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": currentUser?.email || "superadmin@contactpoint360.com",
        },
        body: JSON.stringify({
          itemDescription,
          brand: brand || undefined,
          unitPrice: Number(unitPrice),
          qty: Number(qty),
          unit,
          category,
          supplierName: supplierName || undefined,
          destinationName: destinationName || undefined,
          sourceDocumentUrl: sourceDocumentUrl || undefined,
          transactionDate,
          isCapex,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.message}`);
        return;
      }

      setIsNewEntryOpen(false);
      resetForm();
      fetchEntries();
      fetchReport();
    } catch (err: any) {
      alert(`Failed to create entry: ${err.message}`);
    }
  };

  const handleApproveEntry = async () => {
    if (!selectedEntry) return;

    try {
      const res = await fetch(`${backendUrl}/opex/entries/${selectedEntry.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": currentUser?.email || "superadmin@contactpoint360.com",
        },
        body: JSON.stringify({
          status: approveStatus,
          sourceDocumentUrl: approveDocUrl || selectedEntry.sourceDocumentUrl,
          rejectionReason: approveStatus === "REJECTED" ? rejectionReason : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(`Approval Error: ${json.message}`);
        return;
      }

      setIsApproveModalOpen(false);
      setSelectedEntry(null);
      fetchEntries();
      fetchReport();
    } catch (err: any) {
      alert(`Approval process failed: ${err.message}`);
    }
  };

  const handleLockMonth = async () => {
    if (!confirm(`Are you sure you want to LOCK month ${selectedYear}-${String(selectedMonth).padStart(2, "0")}? Once locked, entries cannot be added or modified.`)) {
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/opex/lock-month`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": currentUser?.email || "superadmin@contactpoint360.com",
        },
        body: JSON.stringify({ year: selectedYear, month: selectedMonth }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(`Lock Error: ${json.message}`);
        return;
      }

      alert(`Success! Month ${selectedYear}-${String(selectedMonth).padStart(2, "0")} has been locked and archived.`);
      fetchEntries();
      fetchReport();
      fetchArchives();
    } catch (err: any) {
      alert(`Failed to lock month: ${err.message}`);
    }
  };

  const resetForm = () => {
    setItemDescription("");
    setBrand("");
    setUnitPrice("");
    setQty("");
    setUnit("PC");
    setCategory("OFFICE_SUPPLIES");
    setSupplierName("");
    setDestinationName("");
    setSourceDocumentUrl("");
    setIsCapex(false);
  };

  const formatMoney = (val: number) => `₱${Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ padding: "24px", color: "#1E293B" }}>
      {/* Module Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "#0F172A" }}>Monthly OPEX & CAPEX Reporting</h1>
          <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: "14px" }}>
            Track continuous expenses, enforce approval controls, and lock monthly financial archives.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => setIsNewEntryOpen(true)}
            style={{
              padding: "10px 18px",
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              borderRadius: "8px",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            + Log Expense Entry
          </button>
          <button
            onClick={handleLockMonth}
            style={{
              padding: "10px 18px",
              backgroundColor: "#059669",
              color: "#FFFFFF",
              borderRadius: "8px",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            🔒 Lock Month ({selectedYear}-{String(selectedMonth).padStart(2, "0")})
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid #E2E8F0", marginBottom: "24px" }}>
        <button
          onClick={() => setActiveSubTab("tracker")}
          style={{
            padding: "12px 20px",
            background: "none",
            border: "none",
            borderBottom: activeSubTab === "tracker" ? "2px solid #2563EB" : "2px solid transparent",
            color: activeSubTab === "tracker" ? "#2563EB" : "#64748B",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Transaction Tracker
        </button>
        <button
          onClick={() => setActiveSubTab("reports")}
          style={{
            padding: "12px 20px",
            background: "none",
            border: "none",
            borderBottom: activeSubTab === "reports" ? "2px solid #2563EB" : "2px solid transparent",
            color: activeSubTab === "reports" ? "#2563EB" : "#64748B",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Executive Rollups & MoM
        </button>
        <button
          onClick={() => setActiveSubTab("archives")}
          style={{
            padding: "12px 20px",
            background: "none",
            border: "none",
            borderBottom: activeSubTab === "archives" ? "2px solid #2563EB" : "2px solid transparent",
            color: activeSubTab === "archives" ? "#2563EB" : "#64748B",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Locked Archives ({archives.length})
        </button>
      </div>

      {/* Date & Filter Bar */}
      <div style={{ backgroundColor: "#F8FAFC", padding: "16px", borderRadius: "12px", border: "1px solid #E2E8F0", display: "flex", gap: "16px", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "4px" }}>Year</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1" }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "4px" }}>Month</label>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1" }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{new Date(2026, m - 1, 1).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        </div>

        {activeSubTab === "tracker" && (
          <>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "4px" }}>Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1" }}>
                <option value="ALL">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="OK">OK</option>
                <option value="FOR_REVIEW">FOR REVIEW</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#64748B", display: "block", marginBottom: "4px" }}>Asset Class</label>
              <select value={capexFilter} onChange={(e) => setCapexFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1" }}>
                <option value="ALL">OPEX & CAPEX</option>
                <option value="OPEX">OPEX Only</option>
                <option value="CAPEX">CAPEX Only</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* SubTab 1: Transaction Tracker Table */}
      {activeSubTab === "tracker" && (
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: "#F1F5F9", color: "#475569", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "14px 16px" }}>Date</th>
                <th style={{ padding: "14px 16px" }}>Item Description</th>
                <th style={{ padding: "14px 16px" }}>Category</th>
                <th style={{ padding: "14px 16px" }}>Supplier</th>
                <th style={{ padding: "14px 16px" }}>Destination</th>
                <th style={{ padding: "14px 16px" }}>Qty / Unit</th>
                <th style={{ padding: "14px 16px" }}>Unit Price</th>
                <th style={{ padding: "14px 16px" }}>Total</th>
                <th style={{ padding: "14px 16px" }}>Status</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} style={{ padding: "24px", textAlign: "center", color: "#64748B" }}>Loading transactions...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: "24px", textAlign: "center", color: "#64748B" }}>No entries found for this period.</td></tr>
              ) : (
                entries.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "14px 16px" }}>{new Date(item.transactionDate).toLocaleDateString()}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                      {item.itemDescription}
                      {item.isCapex && <span style={{ marginLeft: "6px", fontSize: "10px", backgroundColor: "#7C3AED", color: "#FFF", padding: "2px 6px", borderRadius: "4px" }}>CAPEX</span>}
                    </td>
                    <td style={{ padding: "14px 16px" }}>{item.category}</td>
                    <td style={{ padding: "14px 16px" }}>{item.supplier?.name || item.supplierName || "—"}</td>
                    <td style={{ padding: "14px 16px" }}>{item.department?.name || item.destinationName || "—"}</td>
                    <td style={{ padding: "14px 16px" }}>{Number(item.qty)} {item.unit}</td>
                    <td style={{ padding: "14px 16px" }}>{formatMoney(item.unitPrice)}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0F172A" }}>{formatMoney(item.total)}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: "9999px",
                        fontSize: "12px",
                        fontWeight: 700,
                        backgroundColor: item.status === "OK" ? "#D1FAE5" : item.status === "PENDING" ? "#FEF3C7" : item.status === "FOR_REVIEW" ? "#E0E7FF" : "#FEE2E2",
                        color: item.status === "OK" ? "#065F46" : item.status === "PENDING" ? "#92400E" : item.status === "FOR_REVIEW" ? "#3730A3" : "#991B1B",
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => {
                          setSelectedEntry(item);
                          setApproveStatus(item.status === "PENDING" ? "OK" : item.status as any);
                          setApproveDocUrl(item.sourceDocumentUrl || "");
                          setIsApproveModalOpen(true);
                        }}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#F1F5F9",
                          border: "1px solid #CBD5E1",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Review / Sign-Off
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* SubTab 2: Executive Rollups & MoM */}
      {activeSubTab === "reports" && reportData && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Executive Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
            <div style={{ backgroundColor: "#FFFFFF", padding: "20px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>Total Monthly OPEX</span>
              <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "8px 0 0", color: "#0F172A" }}>{formatMoney(reportData.executiveSummary.totalOpex)}</h2>
            </div>
            <div style={{ backgroundColor: "#FFFFFF", padding: "20px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>Capital Expenditures (CAPEX)</span>
              <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "8px 0 0", color: "#7C3AED" }}>{formatMoney(reportData.executiveSummary.totalCapex)}</h2>
            </div>
            <div style={{ backgroundColor: "#FFFFFF", padding: "20px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>Prior Month Comparison</span>
              <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "8px 0 0", color: "#475569" }}>{formatMoney(reportData.executiveSummary.priorMonthTotal)}</h2>
            </div>
            <div style={{ backgroundColor: "#FFFFFF", padding: "20px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
              <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>Month-over-Month Delta</span>
              <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "8px 0 0", color: reportData.executiveSummary.momDelta >= 0 ? "#DC2626" : "#059669" }}>
                {reportData.executiveSummary.momDelta >= 0 ? `+${formatMoney(reportData.executiveSummary.momDelta)}` : formatMoney(reportData.executiveSummary.momDelta)}
                <span style={{ fontSize: "14px", fontWeight: 500, marginLeft: "6px" }}>({reportData.executiveSummary.momDeltaPct}%)</span>
              </h2>
            </div>
          </div>

          {/* Rollup Breakdown Grids */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div style={{ backgroundColor: "#FFFFFF", padding: "20px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px", color: "#0F172A" }}>Spend by Destination</h3>
              {reportData.byDestination.map((d: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
                  <span>{d.name}</span>
                  <span style={{ fontWeight: 700 }}>{formatMoney(d.total)}</span>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: "#FFFFFF", padding: "20px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px", color: "#0F172A" }}>Spend by Supplier</h3>
              {reportData.bySupplier.map((s: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
                  <span>{s.name}</span>
                  <span style={{ fontWeight: 700 }}>{formatMoney(s.total)}</span>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: "#FFFFFF", padding: "20px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px", color: "#0F172A" }}>Spend by Category</h3>
              {reportData.byCategory.map((c: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
                  <span>{c.category}</span>
                  <span style={{ fontWeight: 700 }}>{formatMoney(c.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SubTab 3: Locked Archives */}
      {activeSubTab === "archives" && (
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>Historical Locked Financial Archives</h3>
          {archives.length === 0 ? (
            <p style={{ color: "#64748B" }}>No monthly archives have been locked yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {archives.map((a) => (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderRadius: "8px", border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>OPEX Archive — {a.yearMonth}</h4>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>Locked on {new Date(a.lockedAt).toLocaleString()} by {a.lockedByUser?.name || a.lockedByUser?.email || "Finance Admin"}</span>
                  </div>
                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "12px", color: "#64748B", display: "block" }}>Archived Total</span>
                      <span style={{ fontSize: "16px", fontWeight: 700, color: "#059669" }}>{formatMoney(a.summarySnapshot?.totalOpex || 0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: New Entry */}
      {isNewEntryOpen && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "1.5rem",
          zIndex: 10000,
        }}>
          <div style={{
            width: "100%",
            maxWidth: "600px",
            maxHeight: "85vh",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            border: "1px solid #e2e8f0",
          }}>
            {/* Header */}
            <div style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                <h3 style={{ fontSize: "0.98rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  Log Expense Entry
                </h3>
                <p style={{ fontSize: "0.72rem", color: "#64748b", margin: 0 }}>
                  Register a new operating or capital expenditure into the financial tracker.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewEntryOpen(false)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#94a3b8", padding: 4, display: "flex", borderRadius: 4,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateEntry} style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.5rem", overflowY: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>

                {/* Item Description */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Item Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Office Supplies, Medical Stock, Security Uniforms"
                    value={itemDescription}
                    onChange={e => setItemDescription(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.65rem",
                      borderRadius: 6,
                      border: "1px solid #e2e8f0",
                      fontSize: "0.8rem",
                      color: "#1e293b",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Unit Price & Qty */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Unit Price (₱) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 450.00"
                      value={unitPrice}
                      onChange={e => setUnitPrice(e.target.value ? Number(e.target.value) : "")}
                      style={{
                        width: "100%",
                        padding: "0.45rem 0.65rem",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.8rem",
                        color: "#1e293b",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Quantity *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 10"
                      value={qty}
                      onChange={e => setQty(e.target.value ? Number(e.target.value) : "")}
                      style={{
                        width: "100%",
                        padding: "0.45rem 0.65rem",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.8rem",
                        color: "#1e293b",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Unit & Category */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Unit</label>
                    <select
                      value={unit}
                      onChange={e => setUnit(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.45rem 0.65rem",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.8rem",
                        color: "#475569",
                        outline: "none",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      {["PC", "PACK", "BOX", "TAB", "SACH", "CAP", "NEB", "SET", "ROLL", "UNIT"].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Category *</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.45rem 0.65rem",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.8rem",
                        color: "#475569",
                        outline: "none",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <option value="MEDICAL_PHARMACY">Medical / Pharmacy</option>
                      <option value="SECURITY_UNIFORM">Security / Uniform</option>
                      <option value="OFFICE_SUPPLIES">Office Supplies</option>
                      <option value="IT_PERIPHERALS">IT Peripherals</option>
                      <option value="MAINTENANCE_REPAIRS">Maintenance & Repairs</option>
                      <option value="UTILITIES">Utilities</option>
                      <option value="FACILITIES">Facilities</option>
                      <option value="MISCELLANEOUS">Miscellaneous</option>
                    </select>
                  </div>
                </div>

                {/* Supplier & Destination */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Assigned Supplier (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., Office Essentials Trading"
                      value={supplierName}
                      onChange={e => setSupplierName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.45rem 0.65rem",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.8rem",
                        color: "#1e293b",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Destination / Department</label>
                    <input
                      type="text"
                      placeholder="e.g., IT Department, Skyrise 4B"
                      value={destinationName}
                      onChange={e => setDestinationName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.45rem 0.65rem",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.8rem",
                        color: "#1e293b",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Source Document */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Source Document URL / Receipt File</label>
                  <input
                    type="text"
                    placeholder="https://storage.contactpoint360.com/..."
                    value={sourceDocumentUrl}
                    onChange={e => setSourceDocumentUrl(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.65rem",
                      borderRadius: 6,
                      border: "1px solid #e2e8f0",
                      fontSize: "0.8rem",
                      color: "#1e293b",
                      outline: "none",
                    }}
                  />
                </div>

                {/* CAPEX Flag */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                  <input
                    type="checkbox"
                    id="capex"
                    checked={isCapex}
                    onChange={e => setIsCapex(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: "pointer" }}
                  />
                  <label htmlFor="capex" style={{ fontSize: "0.8rem", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                    Flag as Capital Expenditure (CAPEX)
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "0.75rem",
                paddingTop: "1rem",
                marginTop: "0.5rem",
                borderTop: "1px solid #e2e8f0",
              }}>
                <button
                  type="button"
                  onClick={() => setIsNewEntryOpen(false)}
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
                  Cancel
                </button>
                <button
                  type="submit"
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
                  }}
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Review & Sign-Off */}
      {isApproveModalOpen && selectedEntry && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "1.5rem",
          zIndex: 10000,
        }}>
          <div style={{
            width: "100%",
            maxWidth: "500px",
            maxHeight: "85vh",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            border: "1px solid #e2e8f0",
          }}>
            {/* Header */}
            <div style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                <h3 style={{ fontSize: "0.98rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  Review & Sign-Off Entry
                </h3>
                <p style={{ fontSize: "0.72rem", color: "#64748b", margin: 0 }}>
                  Approve or flag expense item: <strong style={{ color: "#0f172a" }}>{selectedEntry.itemDescription}</strong> ({formatMoney(selectedEntry.total)})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#94a3b8", padding: 4, display: "flex", borderRadius: 4,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Decision Status</label>
                  <select
                    value={approveStatus}
                    onChange={e => setApproveStatus(e.target.value as any)}
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.65rem",
                      borderRadius: 6,
                      border: "1px solid #e2e8f0",
                      fontSize: "0.8rem",
                      color: "#475569",
                      outline: "none",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <option value="OK">OK (Approved)</option>
                    <option value="FOR_REVIEW">FOR REVIEW</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Source Document URL (Required for OK)</label>
                  <input
                    type="text"
                    value={approveDocUrl}
                    onChange={e => setApproveDocUrl(e.target.value)}
                    placeholder="https://..."
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.65rem",
                      borderRadius: 6,
                      border: "1px solid #e2e8f0",
                      fontSize: "0.8rem",
                      color: "#1e293b",
                      outline: "none",
                    }}
                  />
                </div>

                {approveStatus === "REJECTED" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Rejection Reason</label>
                    <textarea
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      placeholder="Specify reason for rejection..."
                      style={{
                        width: "100%",
                        padding: "0.45rem 0.65rem",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.8rem",
                        color: "#1e293b",
                        outline: "none",
                        minHeight: 80,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "0.75rem",
                paddingTop: "1rem",
                borderTop: "1px solid #e2e8f0",
              }}>
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
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
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApproveEntry}
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
                  }}
                >
                  Confirm Decision
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
