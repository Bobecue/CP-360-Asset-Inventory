"use client";

import React, { useState, useEffect, useRef } from "react";
import { CatalogItem } from "@/types/dashboard";
import { Barcode } from "./Barcode";
import { ScanModal } from "./modals/ScanModal";
import { getApiUrl } from "../../../utils/api";

interface ScanOperationsTabProps {
  isUsingMockData: boolean;
  catalogItems: CatalogItem[];
  setCatalogItems: React.Dispatch<React.SetStateAction<CatalogItem[]>>;
  users: any[];
  sites: any[];
  currentUser: any;
  onUpdateCatalog: () => Promise<void>;
  mockAuditLogs: any[];
  setMockAuditLogs: React.Dispatch<React.SetStateAction<any[]>>;
}

export const ScanOperationsTab = ({
  isUsingMockData,
  catalogItems,
  setCatalogItems,
  users,
  sites,
  currentUser,
  onUpdateCatalog,
  mockAuditLogs,
  setMockAuditLogs,
}: ScanOperationsTabProps) => {
  const [scanCode, setScanCode] = useState("");
  const [matchedItem, setMatchedItem] = useState<CatalogItem | null>(null);
  const [matchedAsset, setMatchedAsset] = useState<any | null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form states
  const [checkoutUserId, setCheckoutUserId] = useState("");
  const [checkoutSiteId, setCheckoutSiteId] = useState("");
  const [maintenanceCondition, setMaintenanceCondition] = useState("GOOD");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSearchCode = (codeToSearch: string) => {
    setActionError(null);
    setActionSuccess(null);
    const code = codeToSearch.trim().toUpperCase();

    if (!code) return;

    let foundItem: CatalogItem | null = null;
    let foundAsset: any | null = null;

    // Search catalog items for matching assets
    for (const item of catalogItems) {
      if (item.assets) {
        const asset = item.assets.find((a: any) => a.tagCode.toUpperCase() === code);
        if (asset) {
          foundItem = item;
          foundAsset = asset;
          break;
        }
      }
    }

    if (foundItem && foundAsset) {
      setMatchedItem(foundItem);
      setMatchedAsset(foundAsset);
      setCheckoutSiteId(foundAsset.siteId || "");
      setCheckoutUserId(foundAsset.assignedToId || "");
    } else {
      setMatchedItem(null);
      setMatchedAsset(null);
      setActionError(`No registered physical asset found matching tag code "${code}"`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchCode(scanCode);
    }
  };

  const handleQuickStatusUpdate = async (nextStatus: string, assignedToId?: string) => {
    if (!matchedItem || !matchedAsset) return;
    setActionError(null);
    setActionSuccess(null);
    setIsSubmitting(true);

    const site = sites.find((s) => s.id === (checkoutSiteId || matchedAsset.siteId));
    const targetUser = users.find((u) => u.id === assignedToId);

    if (isUsingMockData) {
      // Offline mode: Update state locally
      setCatalogItems((prev) =>
        prev.map((item) => {
          if (item.id === matchedItem.id) {
            const updatedAssets = item.assets?.map((a: any) => {
              if (a.id === matchedAsset.id) {
                return {
                  ...a,
                  status: nextStatus,
                  assignedToId: nextStatus === "ASSIGNED" ? (assignedToId || null) : null,
                  assignedTo: nextStatus === "ASSIGNED" ? targetUser : null,
                  siteId: checkoutSiteId || a.siteId,
                };
              }
              return a;
            });
            return { ...item, assets: updatedAssets };
          }
          return item;
        })
      );

      // Add to mock audit logs
      let logDetails = `Asset tag "${matchedAsset.tagCode}" status changed: ${matchedAsset.status} -> ${nextStatus}`;
      if (nextStatus === "ASSIGNED" && targetUser) {
        logDetails += ` (Assigned to: ${targetUser.name})`;
      }

      const newLog = {
        id: `mock-log-${Date.now()}`,
        action: "STOCK_ADJUSTED",
        details: logDetails,
        userId: currentUser?.id || "user-1",
        user: currentUser || { name: "Super Admin" },
        itemId: matchedItem.id,
        ipAddress: "127.0.0.1",
        createdAt: new Date().toISOString(),
      };

      setMockAuditLogs((prev) => [newLog, ...prev]);

      // Update matched asset preview state
      const updatedAsset = {
        ...matchedAsset,
        status: nextStatus,
        assignedToId: nextStatus === "ASSIGNED" ? (assignedToId || null) : null,
        assignedTo: nextStatus === "ASSIGNED" ? targetUser : null,
      };
      setMatchedAsset(updatedAsset);

      setActionSuccess(`Asset ${matchedAsset.tagCode} successfully marked as ${nextStatus}!`);
      setIsSubmitting(false);
    } else {
      try {
        const res = await fetch(getApiUrl(`items/${matchedItem.id}/assets/${matchedAsset.id}/status`), {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": currentUser?.id || "",
          },
          body: JSON.stringify({
            status: nextStatus,
            assignedToId: nextStatus === "ASSIGNED" ? assignedToId : undefined,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to update asset status.");
        }

        const data = await res.json();
        await onUpdateCatalog();

        // Refresh details
        setMatchedAsset(data);
        setActionSuccess(`Asset ${matchedAsset.tagCode} successfully marked as ${nextStatus}!`);
      } catch (err: any) {
        console.error(err);
        setActionError(err.message || "Something went wrong.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return { bg: "#ecfdf5", text: "#047857", dot: "#10b981", label: "Available" };
      case "ASSIGNED":
        return { bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6", label: "Assigned" };
      case "UNDER_MAINTENANCE":
        return { bg: "#fffbeb", text: "#b45309", dot: "#f59e0b", label: "Maintenance" };
      case "RETIRED":
        return { bg: "#fef2f2", text: "#b91c1c", dot: "#ef4444", label: "Retired" };
      default:
        return { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8", label: status };
    }
  };

  const activeBadge = matchedAsset ? getStatusBadgeStyles(matchedAsset.status) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Title block */}
      <div>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.25rem 0" }}>
          Quick Scan Operations
        </h2>
        <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0 }}>
          Directly scan or enter asset barcodes to quickly update allocations, dispatch statuses, and audit checks.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>
        
        {/* Left card: Scan code input and simulator */}
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: 12,
          padding: "1.5rem",
          boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}>
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.25rem 0" }}>
              Scanner Receiver
            </h3>
            <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>
              Ensure hardware keyboard scanners are set to append an 'Enter' suffix.
            </p>
          </div>

          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Scan Barcode or Enter Tag Code..."
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
              onKeyDown={handleKeyPress}
              style={{
                width: "100%",
                padding: "0.65rem 3rem 0.65rem 1rem",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: "0.88rem",
                color: "#1e293b",
                outline: "none",
                fontWeight: 600,
                fontFamily: "monospace",
                letterSpacing: "0.05em",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
              }}
            />
            <div style={{ position: "absolute", right: 8, display: "flex", gap: "0.25rem" }}>
              <button
                type="button"
                onClick={() => setIsScanModalOpen(true)}
                title="Camera scan"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#210cae", padding: "6px", borderRadius: "6px",
                  display: "flex", alignItems: "center"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(33,12,174,0.06)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </button>
              <button
                type="button"
                onClick={() => handleSearchCode(scanCode)}
                title="Submit Search"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#475569", padding: "6px", borderRadius: "6px",
                  display: "flex", alignItems: "center"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </div>

          {actionError && (
            <div style={{
              padding: "0.6rem 0.85rem",
              backgroundColor: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: "6px",
              fontSize: "0.75rem",
              color: "#991b1b",
              fontWeight: 500,
            }}>
              {actionError}
            </div>
          )}

          {actionSuccess && (
            <div style={{
              padding: "0.6rem 0.85rem",
              backgroundColor: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: "6px",
              fontSize: "0.75rem",
              color: "#166534",
              fontWeight: 500,
            }}>
              {actionSuccess}
            </div>
          )}

          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Simulation / Mock Selection
            </span>
            <p style={{ fontSize: "0.72rem", color: "#94a3b8", margin: "0 0 0.5rem 0" }}>
              Quickly simulate reading one of the generated tags in the database:
            </p>
            <select
              value={scanCode}
              onChange={(e) => {
                setScanCode(e.target.value);
                handleSearchCode(e.target.value);
              }}
              style={{
                width: "100%",
                padding: "0.45rem 0.65rem",
                borderRadius: 6,
                border: "1px solid #e2e8f0",
                fontSize: "0.8rem",
                color: "#475569",
                outline: "none",
                backgroundColor: "#ffffff"
              }}
            >
              <option value="" disabled>Choose tag to load details...</option>
              {(() => {
                const list: string[] = [];
                catalogItems.forEach((item) => {
                  if (item.assets) {
                    item.assets.forEach((asset: any) => {
                      list.push(asset.tagCode);
                    });
                  }
                });
                return list.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ));
              })()}
            </select>
          </div>
        </div>

        {/* Right card: Digital Twin Asset Details and Fast-action updates */}
        {matchedAsset && matchedItem ? (
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            padding: "1.5rem",
            boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            animation: "scaleIn 0.2s ease-out",
          }}>
            {/* Asset twin header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#210cae", backgroundColor: "rgba(33, 12, 174, 0.05)", padding: "0.15rem 0.45rem", borderRadius: 4, textTransform: "uppercase" }}>
                  Digital Twin Active
                </span>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: "0.25rem 0 0.15rem 0" }}>
                  {matchedItem.name}
                </h3>
                <span style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: "monospace" }}>
                  SKU: {matchedItem.sku} | Tag: {matchedAsset.tagCode}
                </span>
              </div>
              
              {/* Status Badge */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.25rem 0.65rem",
                borderRadius: "20px",
                backgroundColor: activeBadge?.bg,
                color: activeBadge?.text,
                fontSize: "0.72rem",
                fontWeight: 600,
                alignSelf: "flex-start",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: activeBadge?.dot }} />
                {activeBadge?.label}
              </div>
            </div>

            {/* Render mini barcode graphic */}
            <div style={{
              backgroundColor: "#f8fafc",
              border: "1px dashed #cbd5e1",
              borderRadius: 8,
              padding: "0.75rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}>
              <Barcode text={matchedAsset.tagCode} height={40} showText={true} />
            </div>

            {/* Fast-action forms tab layout */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Fast Actions
              </span>

              {matchedAsset.status === "AVAILABLE" ? (
                /* Checkout assign action */
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <p style={{ fontSize: "0.75rem", color: "#475569", margin: 0 }}>
                    This asset is currently in stock. Assign it to an employee to dispatch it.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.7rem", fontWeight: 600, color: "#475569" }}>Assign to Employee *</label>
                    <select
                      value={checkoutUserId}
                      onChange={(e) => setCheckoutUserId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.45rem 0.65rem",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        fontSize: "0.8rem",
                        color: "#1e293b",
                        outline: "none"
                      }}
                    >
                      <option value="">Select Employee...</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.employeeId || "No ID"})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting || !checkoutUserId}
                    onClick={() => handleQuickStatusUpdate("ASSIGNED", checkoutUserId)}
                    style={{
                      padding: "0.55rem 1rem",
                      borderRadius: 6,
                      border: "none",
                      backgroundColor: "#210cae",
                      color: "#ffffff",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: checkoutUserId ? "pointer" : "not-allowed",
                      opacity: checkoutUserId ? 1 : 0.6,
                      boxShadow: "0 1px 2px rgba(33,12,174,0.15)"
                    }}
                    onMouseEnter={(e) => { if (checkoutUserId) e.currentTarget.style.backgroundColor = "#1b0a8f"; }}
                    onMouseLeave={(e) => { if (checkoutUserId) e.currentTarget.style.backgroundColor = "#210cae"; }}
                  >
                    {isSubmitting ? "Assigning..." : "Assign / Dispatch Asset"}
                  </button>
                </div>
              ) : (
                /* Check-in return action */
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{
                    padding: "0.6rem 0.85rem",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                    fontSize: "0.75rem",
                    color: "#475569",
                  }}>
                    {matchedAsset.status === "ASSIGNED" && (
                      <span>Currently assigned to <strong>{matchedAsset.assignedTo?.name || "Employee"}</strong>.</span>
                    )}
                    {matchedAsset.status === "UNDER_MAINTENANCE" && (
                      <span>Asset is currently marked in <strong>Maintenance</strong>.</span>
                    )}
                    {matchedAsset.status === "RETIRED" && (
                      <span>Asset is currently <strong>Decommissioned / Retired</strong>.</span>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleQuickStatusUpdate("AVAILABLE")}
                    style={{
                      padding: "0.55rem 1rem",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      color: "#475569",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ffffff"}
                  >
                    {isSubmitting ? "Returning..." : "Check-in / Return to Stock"}
                  </button>
                </div>
              )}

              {/* Maintenance & Decommission toggles */}
              <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem" }}>
                {matchedAsset.status === "UNDER_MAINTENANCE" ? (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleQuickStatusUpdate("AVAILABLE")}
                    style={{
                      flex: 1,
                      padding: "0.45rem",
                      borderRadius: 6,
                      border: "none",
                      backgroundColor: "#ecfdf5",
                      color: "#047857",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#d1fae5"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ecfdf5"}
                  >
                    ✅ Confirm Repaired / Set Available
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleQuickStatusUpdate("UNDER_MAINTENANCE")}
                    style={{
                      flex: 1,
                      padding: "0.45rem",
                      borderRadius: 6,
                      border: "none",
                      backgroundColor: "#fffbeb",
                      color: "#b45309",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fef3c7"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fffbeb"}
                  >
                    Mark Maintenance
                  </button>
                )}
                {matchedAsset.status !== "RETIRED" && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleQuickStatusUpdate("RETIRED")}
                    style={{
                      flex: 1,
                      padding: "0.45rem",
                      borderRadius: 6,
                      border: "none",
                      backgroundColor: "#fef2f2",
                      color: "#b91c1c",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fee2e2"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fef2f2"}
                  >
                    Decommission Asset
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Empty detail card placeholder */
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            padding: "3rem 1.5rem",
            boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            color: "#94a3b8",
            height: "100%",
            minHeight: "300px"
          }}>
            <span style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</span>
            <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#64748b", margin: "0 0 0.25rem 0" }}>No Asset Loaded</h4>
            <p style={{ fontSize: "0.75rem", color: "#94a3b8", maxWidth: "240px", margin: 0 }}>
              Scan an item barcode to load its digital twin and perform quick actions.
            </p>
          </div>
        )}
      </div>

      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onScan={(code) => {
          setIsScanModalOpen(false);
          setScanCode(code);
          handleSearchCode(code);
        }}
        catalogItems={catalogItems}
      />
    </div>
  );
};
