import { useState, useEffect } from "react";
import { CatalogItem } from "@/types/dashboard";

interface LowStockAlertsTabProps {
  isUsingMockData: boolean;
  currentUser: any;
  sites: any[];
  categories: any[];
  catalogItems: CatalogItem[];
  onRefreshCatalog?: () => void;
}

export const LowStockAlertsTab = ({
  isUsingMockData,
  currentUser,
  sites,
  categories,
  catalogItems,
  onRefreshCatalog,
}: LowStockAlertsTabProps) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalAlerts: 0,
    criticalAlerts: 0,
    warningAlerts: 0,
    totalItemsToReorder: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [siteFilter, setSiteFilter] = useState("ALL");

  // In-Page Modals
  const [reorderModalItem, setReorderModalItem] = useState<any | null>(null);
  const [reorderPointInput, setReorderPointInput] = useState<number>(5);
  const [reorderQtyInput, setReorderQtyInput] = useState<number>(10);
  const [isSubmittingReorder, setIsSubmittingReorder] = useState(false);

  const [requestModalItem, setRequestModalItem] = useState<any | null>(null);
  const [requestQtyInput, setRequestQtyInput] = useState<number>(10);
  const [requestReasonInput, setRequestReasonInput] = useState<string>("");
  const [requestTargetSiteId, setRequestTargetSiteId] = useState<string>("site-1");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSuccessNotice, setRequestSuccessNotice] = useState<string | null>(null);

  const canEditReorderPoint =
    currentUser?.role === "SUPER_ADMIN" ||
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "INVENTORY_STAFF";

  const fetchLowStockAlerts = async () => {
    setIsLoading(true);
    try {
      if (!isUsingMockData) {
        const queryParams = new URLSearchParams();
        if (siteFilter !== "ALL") queryParams.append("siteId", siteFilter);
        if (categoryFilter !== "ALL") queryParams.append("categoryId", categoryFilter);
        if (severityFilter !== "ALL") queryParams.append("severity", severityFilter);

        const res = await fetch(`http://localhost:3001/items/low-stock?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.alerts || []);
          setStats(data.stats || { totalAlerts: 0, criticalAlerts: 0, warningAlerts: 0, totalItemsToReorder: 0 });
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Backend low-stock alerts fetch error, computing from local catalogItems:", err);
    }

    // Fallback computation from catalogItems
    const computedAlerts: any[] = [];
    catalogItems.forEach((item) => {
      if (categoryFilter !== "ALL" && item.categoryId !== categoryFilter) return;

      let stockQty = 0;
      let relevantStocks = item.stockLevels || [];
      if (siteFilter !== "ALL") {
        relevantStocks = relevantStocks.filter((s) => s.siteId === siteFilter);
      }
      if (relevantStocks.length > 0) {
        stockQty = relevantStocks.reduce((sum, s) => sum + (s.quantity || 0), 0);
      }

      let assetQty = 0;
      let relevantAssets = (item.assets || []).filter((a: any) => a.status === "AVAILABLE" || a.status === "ASSIGNED");
      if (siteFilter !== "ALL") {
        relevantAssets = relevantAssets.filter((a: any) => a.siteId === siteFilter);
      }
      assetQty = relevantAssets.length;

      const totalQty = (item.stockLevels && item.stockLevels.length > 0)
        ? stockQty
        : (item.assets && item.assets.length > 0)
          ? assetQty
          : (item.quantity ?? 0);

      const threshold = item.reorderPoint || (item.stockLevels?.[0]?.reorderPoint ?? 5);

      if (totalQty <= threshold) {
        const isCritical = totalQty === 0 || totalQty <= Math.floor(threshold / 2);
        const severity = isCritical ? "CRITICAL" : "WARNING";

        if (severityFilter === "ALL" || severityFilter === severity) {
          computedAlerts.push({
            id: item.id,
            itemId: item.id,
            name: item.name,
            sku: item.sku,
            unitPrice: item.unitPrice,
            leadTimeDays: item.leadTimeDays,
            reorderPoint: threshold,
            reorderQuantity: item.reorderQuantity || 10,
            currentQuantity: totalQty,
            severity,
            category: item.category,
            stockLevels: item.stockLevels,
            daysBelowThreshold: 3,
          });
        }
      }
    });

    const tot = computedAlerts.length;
    const crit = computedAlerts.filter((a) => a.severity === "CRITICAL").length;
    const warn = computedAlerts.filter((a) => a.severity === "WARNING").length;
    const reorderTot = computedAlerts.reduce((sum, a) => sum + Math.max(1, a.reorderPoint - a.currentQuantity), 0);

    setAlerts(computedAlerts);
    setStats({
      totalAlerts: tot,
      criticalAlerts: crit,
      warningAlerts: warn,
      totalItemsToReorder: reorderTot,
    });
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLowStockAlerts();
  }, [isUsingMockData, catalogItems, siteFilter, categoryFilter, severityFilter]);

  const filteredAlerts = alerts.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      (item.category?.name || "").toLowerCase().includes(q)
    );
  });

  const handleOpenReorderModal = (item: any) => {
    setReorderModalItem(item);
    setReorderPointInput(item.reorderPoint || 5);
    setReorderQtyInput(item.reorderQuantity || 10);
  };

  const handleSaveReorderPoint = async () => {
    if (!reorderModalItem) return;
    setIsSubmittingReorder(true);
    try {
      if (!isUsingMockData) {
        await fetch(`http://localhost:3001/items/${reorderModalItem.id}/reorder-point`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reorderPoint: Number(reorderPointInput),
            reorderQuantity: Number(reorderQtyInput),
          }),
        });
      }
    } catch (err) {
      console.warn("Error updating reorder point:", err);
    }

    setIsSubmittingReorder(false);
    setReorderModalItem(null);
    if (onRefreshCatalog) onRefreshCatalog();
    fetchLowStockAlerts();
  };

  const handleOpenRequestModal = (item: any) => {
    setRequestModalItem(item);
    const needed = Math.max(1, (item.reorderPoint || 5) - item.currentQuantity + 5);
    setRequestQtyInput(needed);
    setRequestReasonInput(`Low-Stock Automatic Replenishment Order for ${item.name} (${item.sku})`);
    setRequestTargetSiteId(sites[0]?.id || "site-1");
  };

  const handleConfirmCreateRequest = async () => {
    if (!requestModalItem) return;
    setIsSubmittingRequest(true);

    const payload = {
      itemId: requestModalItem.id,
      itemName: requestModalItem.name,
      quantity: Number(requestQtyInput),
      reason: `[LOW-STOCK REORDER] ${requestReasonInput}`,
      siteId: requestTargetSiteId,
      requestedByUserId: currentUser?.id || "user-1",
      requestedByName: currentUser?.name || "Inventory Staff",
      status: "PENDING_APPROVAL",
    };

    try {
      if (!isUsingMockData) {
        await fetch("http://localhost:3001/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
    } catch (err) {
      console.warn("Backend request submission error:", err);
    }

    setIsSubmittingRequest(false);
    setRequestModalItem(null);
    setRequestSuccessNotice(`Reorder request order created successfully for ${requestModalItem.name}!`);
    setTimeout(() => setRequestSuccessNotice(null), 4000);
    fetchLowStockAlerts();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Toast Notice */}
      {requestSuccessNotice && (
        <div style={{
          padding: "0.85rem 1.25rem",
          borderRadius: 8,
          backgroundColor: "#ecfdf5",
          border: "1px solid #6ee7b7",
          color: "#065f46",
          fontSize: "0.85rem",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          ✅ {requestSuccessNotice}
        </div>
      )}

      {/* 4 Stat Cards Row */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        {/* Total Low-Stock Alerts */}
        <div
          onClick={() => setSeverityFilter("ALL")}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            padding: "1.25rem",
            boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total Low Stock</span>
            <span style={{ fontSize: "1.65rem", fontWeight: 800, color: "#0f172a" }}>{stats.totalAlerts}</span>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Items at or below reorder threshold</span>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
        </div>

        {/* Critical Stock Alerts */}
        <div
          onClick={() => setSeverityFilter("CRITICAL")}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            padding: "1.25rem",
            boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            borderLeft: "4px solid #e11d48",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#be123c", textTransform: "uppercase" }}>Critical Stock Alerts</span>
            <span style={{ fontSize: "1.65rem", fontWeight: 800, color: "#e11d48" }}>{stats.criticalAlerts}</span>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Out of stock or ≤ 50% threshold</span>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          </div>
        </div>

        {/* Warning Stock Alerts */}
        <div
          onClick={() => setSeverityFilter("WARNING")}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            padding: "1.25rem",
            boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            borderLeft: "4px solid #d97706",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#b45309", textTransform: "uppercase" }}>Warning Alerts</span>
            <span style={{ fontSize: "1.65rem", fontWeight: 800, color: "#d97706" }}>{stats.warningAlerts}</span>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Approaching reorder point</span>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          </div>
        </div>

        {/* Total Items to Reorder */}
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: 12,
          padding: "1.25rem",
          boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Items to Reorder</span>
            <span style={{ fontSize: "1.65rem", fontWeight: 800, color: "#210cae" }}>{stats.totalItemsToReorder}</span>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Units needed for safe buffer</span>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2.5"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
          </div>
        </div>
      </section>

      {/* Filter Toolbar */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: "1rem 1.25rem",
        boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)"
      }}>
        <div style={{ display: "flex", flex: 1, flexWrap: "wrap", gap: "0.75rem", minWidth: "280px" }}>
          {/* Search Bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: "220px" }}>
            <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Search Alerts</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                type="text"
                placeholder="Search Item Name, SKU, Category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.75rem 0.45rem 1.85rem",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  fontSize: "0.8rem",
                  color: "#1e293b",
                  outline: "none"
                }}
              />
            </div>
          </div>

          {/* Severity Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "150px" }}>
            <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={{
                padding: "0.45rem 0.65rem",
                borderRadius: 6,
                border: "1px solid #e2e8f0",
                fontSize: "0.8rem",
                color: "#475569",
                backgroundColor: "#ffffff",
                outline: "none"
              }}
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">🚨 Critical Only</option>
              <option value="WARNING">⚠️ Warning Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "160px" }}>
            <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: "0.45rem 0.65rem",
                borderRadius: 6,
                border: "1px solid #e2e8f0",
                fontSize: "0.8rem",
                color: "#475569",
                backgroundColor: "#ffffff",
                outline: "none"
              }}
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Site Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "160px" }}>
            <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Deployment Site</label>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              style={{
                padding: "0.45rem 0.65rem",
                borderRadius: 6,
                border: "1px solid #e2e8f0",
                fontSize: "0.8rem",
                color: "#475569",
                backgroundColor: "#ffffff",
                outline: "none"
              }}
            >
              <option value="ALL">All Sites</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: 12,
        boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
        overflow: "hidden"
      }}>
        {isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b", fontSize: "0.9rem" }}>
            Loading low-stock stock alerts...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div style={{ padding: "3.5rem 1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎉</div>
            <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.25rem 0" }}>No Low-Stock Alerts Triggered</h4>
            <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0 }}>All inventory items are currently above their minimum reorder thresholds.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.83rem" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: 700, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.03em" }}>
                  <th style={{ padding: "0.75rem 1rem" }}>Item & SKU</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Category</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Stock Status (Current / Reorder Point)</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Severity</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Est. Lead Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((item) => {
                  const isCritical = item.severity === "CRITICAL";
                  const percent = Math.min(100, Math.round((item.currentQuantity / Math.max(1, item.reorderPoint)) * 100));

                  return (
                    <tr key={item.id} style={{ transition: "background-color 0.15s ease" }}>
                      {/* Item Info */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.88rem" }}>{item.name}</div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: "monospace", marginTop: "0.1rem" }}>{item.sku}</div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span style={{
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          padding: "0.2rem 0.55rem",
                          borderRadius: 6,
                          backgroundColor: "#f1f5f9",
                          color: "#475569"
                        }}>
                          {item.category?.name || "General"}
                        </span>
                      </td>

                      {/* Stock Status Bar */}
                      <td style={{ padding: "0.85rem 1rem", minWidth: "210px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                          <span style={{ fontWeight: 700, color: isCritical ? "#e11d48" : "#d97706" }}>
                            {item.currentQuantity} units
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                            Reorder @ {item.reorderPoint}
                          </span>
                        </div>
                        <div style={{ width: "100%", height: 6, borderRadius: 3, backgroundColor: "#e2e8f0", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${percent}%`,
                              height: "100%",
                              backgroundColor: isCritical ? "#e11d48" : "#d97706",
                              borderRadius: 3,
                              transition: "width 0.3s ease"
                            }}
                          />
                        </div>
                      </td>

                      {/* Severity Pill */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span style={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          padding: "0.25rem 0.65rem",
                          borderRadius: 20,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          backgroundColor: isCritical ? "#fff1f2" : "#fffbeb",
                          color: isCritical ? "#be123c" : "#b45309",
                          border: `1px solid ${isCritical ? "#fda4af" : "#fde68a"}`
                        }}>
                          {isCritical ? "🚨 CRITICAL STOCK" : "⚠️ LOW STOCK WARNING"}
                        </span>
                      </td>

                      {/* Lead Time */}
                      <td style={{ padding: "0.85rem 1rem", color: "#475569" }}>
                        ⏱️ {item.leadTimeDays || 7} days
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
