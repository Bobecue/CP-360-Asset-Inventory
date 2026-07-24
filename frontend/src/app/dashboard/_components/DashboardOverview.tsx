"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RequestItem, AlertItem, RoleBadge, SiteBadge, EidBadge, AssetTagBadge, getCategoryIcon, getDepartmentIcon } from "@/types/dashboard";
import { getApiUrl } from "@/utils/api";
import { MetricCardSkeleton } from "@/components/ui/Skeleton";

// ── Improvement #1: Count-Up Animation Hook ──────────────────────────
function useCountUp(target: number, duration = 1000, enabled = true) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || target === 0) { setCount(target); return; }
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(ease * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration, enabled]);

  return count;
}

function AnimatedMetricCard({
  title,
  rawValue,
  desc,
  color,
  idx,
  showProgressBar = false,
  progressBarValue = 0,
}: {
  title: string;
  rawValue: number;
  desc: string;
  color: string;
  idx: number;
  showProgressBar?: boolean;
  progressBarValue?: number;
}) {
  const animated = useCountUp(rawValue, 1000);
  const [fillWidth, setFillWidth] = useState(0);

  useEffect(() => {
    if (showProgressBar) {
      const t = setTimeout(() => setFillWidth(progressBarValue), 150);
      return () => clearTimeout(t);
    }
  }, [showProgressBar, progressBarValue]);

  return (
    <div
      className="metric-card stagger-card card-shine-effect"
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 14,
        padding: "1.25rem 1.5rem",
        boxShadow: "0 4px 16px -2px rgba(33, 12, 174, 0.06), 0 0 0 1px rgba(77, 201, 230, 0.2)",
        borderTop: "3px solid transparent",
        borderImage: "linear-gradient(90deg, #4dc9e6 0%, #210cae 100%) 1",
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
        animationDelay: `${idx * 90}ms`,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {title}
        </span>
        <div className="brand-icon-badge" style={{ width: 28, height: 28 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="#210cae" />
          </svg>
        </div>
      </div>
      <span style={{ fontSize: "1.85rem", fontWeight: 800, color, letterSpacing: "-0.02em" }}>
        {animated.toLocaleString()}
      </span>
      <span style={{ fontSize: "0.76rem", color: "#64748b", fontWeight: 500 }}>
        {desc}
      </span>
      {showProgressBar && (
        <div style={{ height: 6, width: "100%", backgroundColor: "rgba(77,201,230,0.15)", borderRadius: 3, overflow: "hidden", marginTop: "0.5rem" }}>
          <div style={{
            height: "100%",
            width: `${fillWidth}%`,
            background: "linear-gradient(90deg, #4dc9e6 0%, #210cae 100%)",
            borderRadius: 3,
            boxShadow: "0 0 10px rgba(77, 201, 230, 0.5)",
            transition: "width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }} />
        </div>
      )}
    </div>
  );
}

interface DashboardOverviewProps {
  onViewRequests?: () => void;
}

export const DashboardOverview = ({ onViewRequests }: DashboardOverviewProps) => {
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const [deploymentsList, setDeploymentsList] = useState<any[]>([]);
  const [rawRequestsList, setRawRequestsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>("");
  const [selectedTableSite, setSelectedTableSite] = useState<string>("");
  const [selectedTableStatus, setSelectedTableStatus] = useState<string>("");

  // Fetch all sites for dropdown
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await fetch(getApiUrl("sites"));
        if (res.ok) {
          const sitesData = await res.json();
          setSites(sitesData);
        }
      } catch (err) {
        console.error("Error fetching sites:", err);
      }
    };
    fetchSites();
  }, []);

  // Fetch dashboard summary and full requests list for detailed tables
  const fetchDashboardSummary = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [sumRes, reqRes] = await Promise.all([
        fetch(getApiUrl(`requests/dashboard-summary?siteId=${selectedSiteId}&_t=${Date.now()}`)),
        fetch(getApiUrl(`requests?_t=${Date.now()}`))
      ]);

      if (sumRes.ok) {
        const envelope = await sumRes.json();
        setData(envelope.data);
      }

      if (reqRes.ok) {
        const envelope = await reqRes.json();
        const raw = envelope.data || envelope;
        if (Array.isArray(raw)) {
          setRawRequestsList(raw);

          // Build deployments list
          const deploys = raw.filter((req: any) =>
            req.reason && req.reason.includes("[ASSET DEPLOYMENT]")
          ).map((req: any) => ({
            id: req.id,
            createdAt: req.createdAt || new Date().toISOString(),
            requestedByName: req.requestedByName || "Christian Mangos",
            requestedByRole: req.requestedByRole || "INVENTORY_STAFF",
            itemName: req.itemName || "Assigned Asset",
            assetTag: req.assetTag || req.asset?.tagCode || req.asset?.assetTag || (req.reason ? req.reason.match(/Asset Tag:\s*([^|]+)/)?.[1]?.trim() : undefined) || "SK4-AST-0001",
            siteId: req.siteId || req.requestedBySiteId || "site-1",
            siteName: req.siteName || "Skyrise 4B",
            reason: req.reason,
            employeeName: req.reason ? (req.reason.match(/Deploy to:\s*([^|]+)/)?.[1]?.trim() || "Moses Andrew Salivio") : "Moses Andrew Salivio",
            employeeAccount: req.reason ? (req.reason.match(/Account:\s*([^|]+)/)?.[1]?.trim() || "IT Staff") : "IT Staff",
            employeeEid: req.reason ? (req.reason.match(/EID:\s*([^|]+)/)?.[1]?.trim() || "EID-00049") : "EID-00049",
            status: req.status || "ACTIVE",
            returnCondition: req.condition || "GOOD",
          }));
          setDeploymentsList(deploys);
        }
      }
    } catch (err: any) {
      console.error("Error fetching dashboard summary:", err);
      if (!silent) setError(err.message || "Failed to load dashboard summary");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedSiteId]);

  useEffect(() => {
    fetchDashboardSummary();
    const interval = setInterval(() => fetchDashboardSummary(true), 30_000);
    return () => clearInterval(interval);
  }, [fetchDashboardSummary]);

  if (loading && !data) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", backgroundColor: "#fee2e2", borderRadius: 12, border: "1px solid #fca5a5", color: "#b91c1c", fontSize: "0.875rem", fontWeight: 500 }}>
        Failed to load dashboard data: {error}
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalAssets: 0,
    assetsThisWeek: 0,
    activeCheckouts: 0,
    utilizationRate: 0,
    pendingRequestsCount: 0,
    awaitingStaffCount: 0,
    awaitingOpsCount: 0,
    lowStockAlertsCount: 0,
  };

  const recentRequests = rawRequestsList.length > 0
    ? rawRequestsList.filter((r: any) => !r.reason || !r.reason.includes("[ASSET DEPLOYMENT]"))
    : (data?.recentRequests || []);

  const filteredRequests = recentRequests.filter((req: any) => {
    const q = searchText.toLowerCase();
    const reqId = req.id || "";
    const name = req.requestedByName || req.requester || "";
    const item = req.itemName || req.item || "";
    const site = req.siteName || req.site || "";
    const status = req.status || "";

    const matchesSearch = !q || reqId.toLowerCase().includes(q) || name.toLowerCase().includes(q) || item.toLowerCase().includes(q);
    const matchesSite = !selectedTableSite || site === selectedTableSite;
    const matchesStatus = !selectedTableStatus || status.toUpperCase() === selectedTableStatus.toUpperCase();
    return matchesSearch && matchesSite && matchesStatus;
  });

  // Recent Deployments (fallback to mock if API returns empty)
  const displayDeployments = deploymentsList.length > 0 ? deploymentsList : [
    {
      id: "REQ-2026-008",
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      requestedByName: "Christian Mangos",
      requestedByRole: "INVENTORY_STAFF",
      itemName: "Ramsta S800 255GB",
      assetTag: "SK4-RAM-0002",
      siteId: "site-1",
      siteName: "Skyrise 4B",
      employeeName: "Moses Andrew Salivio",
      employeeAccount: "IT Staff",
      employeeEid: "EID-00049",
      categoryName: "RAM",
      categoryType: "NON_CONSUMABLE",
      status: "RETURNED"
    },
    {
      id: "REQ-2026-005",
      createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
      requestedByName: "Christian Mangos",
      requestedByRole: "INVENTORY_STAFF",
      itemName: "HP-CNK64705XY-112016-HP P222VA",
      assetTag: "SK4-MON-0002",
      siteId: "site-1",
      siteName: "Skyrise 4B",
      employeeName: "Moses Andrew Salivio",
      employeeAccount: "IT Staff",
      employeeEid: "EID-00049",
      categoryName: "Monitors",
      categoryType: "NON_CONSUMABLE",
      status: "RETURNED"
    },
    {
      id: "REQ-2026-002",
      createdAt: new Date(Date.now() - 3600000 * 50).toISOString(),
      requestedByName: "Christian Mangos",
      requestedByRole: "INVENTORY_STAFF",
      itemName: "DELL",
      assetTag: "SK4-SYS-0002",
      siteId: "site-1",
      siteName: "Skyrise 4B",
      employeeName: "Moses Andrew Salivio",
      employeeAccount: "IT Staff",
      employeeEid: "EID-00049",
      categoryName: "System Units",
      categoryType: "NON_CONSUMABLE",
      status: "RETURNED"
    }
  ];

  const lowStockAlerts = data?.lowStockAlerts || [];
  const sortedLowStockAlerts = [...lowStockAlerts].sort((a: any, b: any) => {
    if (a.stock === 0 && b.stock !== 0) return -1;
    if (b.stock === 0 && a.stock !== 0) return 1;
    if (a.stock === 0 && b.stock === 0) return 0;
    const ratioA = a.stock / Math.max(1, a.min);
    const ratioB = b.stock / Math.max(1, b.min);
    return ratioA - ratioB;
  });

  const metricCards = [
    {
      title: "Total Cataloged Assets",
      rawValue: metrics.totalAssets,
      desc: `+${metrics.assetsThisWeek} registered this week`,
      color: "#0f172a",
    },
    {
      title: "Active Workstation Checkouts",
      rawValue: metrics.activeCheckouts,
      desc: `${metrics.utilizationRate}% total utilization rate`,
      color: "#0f172a",
    },
    {
      title: "Triggered Low-Stock Alerts",
      rawValue: metrics.lowStockAlertsCount,
      desc: "Items below threshold point",
      color: "#ef4444",
    },
  ];

  const renderStatusBadge = (statusStr: string) => {
    const s = (statusStr || "").toUpperCase();
    let bg = "#f1f5f9", color = "#475569", label = statusStr;
    if (s.includes("PENDING")) { bg = "#fef9c3"; color = "#a16207"; label = "Pending"; }
    else if (s === "APPROVED") { bg = "#e0e7ff"; color = "#4338ca"; label = "Approved"; }
    else if (s === "READY_FOR_PICKUP") { bg = "#f0f9ff"; color = "#0369a1"; label = "Ready for Pickup"; }
    else if (s === "RELEASED" || s === "ITEM_RECEIVED" || s === "COMPLETED") { bg = "#ecfdf5"; color = "#047857"; label = "Completed"; }
    else if (s === "REJECTED" || s === "CANCELLED") { bg = "#fef2f2"; color = "#b91c1c"; label = s; }
    else if (s === "RETURNED") { bg = "#f1f5f9"; color = "#64748b"; label = "Returned"; }

    return (
      <span style={{
        display: "inline-block",
        padding: "0.2rem 0.55rem",
        borderRadius: 6,
        fontSize: "0.72rem",
        fontWeight: 700,
        backgroundColor: bg,
        color: color,
        whiteSpace: "nowrap"
      }}>
        {label}
      </span>
    );
  };

  return (
    <>
      {/* Site Filter Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>
            Real-time stock and request metrics scoped by site location.
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label htmlFor="site-filter" style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>Site Filter:</label>
          <select
            id="site-filter"
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            style={{
              padding: "0.4rem 1.75rem 0.4rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.82rem",
              fontWeight: 600,
              backgroundColor: "#ffffff",
              color: "#1e293b",
              outline: "none",
              cursor: "pointer",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            }}
          >
            <option value="">All Sites</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: "1.75rem" }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.75rem" }}>
          Pending approvals — split by stage
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
          <AnimatedMetricCard
            idx={0}
            title="Awaiting staff review"
            rawValue={metrics.awaitingStaffCount}
            desc="Inventory staff to act"
            color="#2563eb"
          />
          <AnimatedMetricCard
            idx={1}
            title="Awaiting ops manager sign-off"
            rawValue={metrics.awaitingOpsCount}
            desc="Final approval pending"
            color="#E85D00"
          />
        </div>
      </div>

      {/* Metrics Row */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "1.75rem" }}>
        {metricCards.map((metric, idx) => (
          <AnimatedMetricCard
            key={idx}
            idx={idx}
            title={metric.title}
            rawValue={metric.rawValue}
            desc={metric.desc}
            color={metric.color}
            showProgressBar={metric.title.includes("Active")}
            progressBarValue={metrics.utilizationRate}
          />
        ))}
      </section>

      {/* Grid Layout: Recent Requests & Low Stock Alerts */}
      <div className="dashboard-layout-grid" style={{ display: "grid", gap: "1.5rem", alignItems: "start", marginBottom: "1.75rem" }}>
        {/* Recent Request Transactions */}
        <section style={{
          backgroundColor: "#ffffff", borderRadius: 12,
          boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
          padding: "1.5rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Recent Request Transactions</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                onClick={() => fetchDashboardSummary(false)}
                title="Refresh dashboard"
                style={{
                  padding: "0.3rem 0.65rem",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  color: "#475569",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem"
                }}
              >
                ↻ Refresh
              </button>
              <span style={{ fontSize: "0.78rem", color: "#94a3b8", cursor: "pointer", fontWeight: 500 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1e293b")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                onClick={onViewRequests}
              >
                View All Orders →
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search order ID or requester"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="search-glow"
              style={{
                flex: 1,
                minWidth: "200px",
                padding: "0.4rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.82rem",
                outline: "none",
                color: "#1e293b",
                backgroundColor: "#ffffff",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              }}
            />
            <select
              value={selectedTableSite}
              onChange={(e) => setSelectedTableSite(e.target.value)}
              style={{
                padding: "0.4rem 1.75rem 0.4rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.82rem",
                fontWeight: 600,
                backgroundColor: "#ffffff",
                color: "#1e293b",
                outline: "none",
                cursor: "pointer",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              }}
            >
              <option value="">All Sites</option>
              {Array.from(new Set(recentRequests.map((r: any) => r.siteName || r.site))).map((siteName: any) => (
                siteName ? <option key={siteName} value={siteName}>{siteName}</option> : null
              ))}
            </select>
            <select
              value={selectedTableStatus}
              onChange={(e) => setSelectedTableStatus(e.target.value)}
              style={{
                padding: "0.4rem 1.75rem 0.4rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.82rem",
                fontWeight: 600,
                backgroundColor: "#ffffff",
                color: "#1e293b",
                outline: "none",
                cursor: "pointer",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              }}
            >
              <option value="">All Requests</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="READY_FOR_PICKUP">Ready for Pickup</option>
              <option value="RELEASED">Released</option>
              <option value="ITEM_RECEIVED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Table matching Request Orders structure */}
          <div style={{ maxHeight: "380px", overflowY: "auto", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
                  <th style={{ padding: "0.75rem 0.6rem", color: "#64748b", fontWeight: 700 }}>Request ID</th>
                  <th style={{ padding: "0.75rem 0.6rem", color: "#64748b", fontWeight: 700 }}>Item Catalog</th>
                  <th style={{ padding: "0.75rem 0.6rem", color: "#64748b", fontWeight: 700 }}>Requested By</th>
                  <th style={{ padding: "0.75rem 0.6rem", color: "#64748b", fontWeight: 700, textAlign: "center" }}>Qty</th>
                  <th style={{ padding: "0.75rem 0.6rem", color: "#64748b", fontWeight: 700 }}>Status</th>
                  <th style={{ padding: "0.75rem 0.6rem", color: "#64748b", fontWeight: 700 }}>Site</th>
                  <th style={{ padding: "0.75rem 0.6rem", color: "#64748b", fontWeight: 700, textAlign: "right" }}>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#94a3b8" }}>
                      No recent request transactions recorded.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req: any) => {
                    const reqId = req.id ? (req.id.length > 12 ? req.id.substring(0, 10) : req.id) : "REQ";
                    const itemName = req.itemName || req.item || "Asset Item";
                    const itemCat = req.itemCategory || req.category;
                    const requesterName = req.requestedByName || req.requester || "Employee";
                    const role = req.requestedByRole || req.role || "EMPLOYEE";
                    const dept = req.requestedByDepartment || req.department;
                    const siteName = req.siteName || req.site || "Cebu IT Park";
                    const dateStr = req.createdAt || req.date;

                    return (
                      <tr key={req.id}
                        className="table-row-hover"
                        style={{ borderBottom: "1px solid #f8fafc", cursor: "pointer" }}
                        onClick={onViewRequests}
                      >
                        <td style={{ padding: "0.75rem 0.6rem" }}>
                          <span style={{
                            fontFamily: "monospace",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            color: "#334155",
                            backgroundColor: "#f1f5f9",
                            padding: "0.18rem 0.45rem",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            whiteSpace: "nowrap"
                          }}>
                            {reqId}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 0.6rem" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                            <span style={{ color: "#64748b", display: "flex", alignItems: "center", marginTop: "0.1rem" }}>
                              {getCategoryIcon(itemCat, itemName)}
                            </span>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: 600, color: "#0f172a" }}>{itemName}</span>
                              {req.assetTag && (
                                <div style={{ marginTop: "0.15rem" }}>
                                  <AssetTagBadge tag={req.assetTag} size="sm" />
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "0.75rem 0.6rem" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                            <span style={{ fontWeight: 600, color: "#0f172a" }}>{requesterName}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexWrap: "wrap" }}>
                              <RoleBadge role={role} size="sm" />
                              {dept && (
                                <span style={{
                                  display: "inline-flex", alignItems: "center", gap: "0.25rem",
                                  fontSize: "0.68rem", fontWeight: 600, color: "#475569",
                                  backgroundColor: "#f8fafc", padding: "0.1rem 0.45rem",
                                  borderRadius: "9999px", border: "1px solid #e2e8f0"
                                }}>
                                  {getDepartmentIcon(dept, 11)}
                                  <span>{dept}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "0.75rem 0.6rem", textAlign: "center", fontWeight: 700, color: "#0f172a" }}>
                          {req.quantity || 1}
                        </td>
                        <td style={{ padding: "0.75rem 0.6rem" }}>
                          {renderStatusBadge(req.status)}
                        </td>
                        <td style={{ padding: "0.75rem 0.6rem" }}>
                          <SiteBadge siteName={siteName} size="sm" />
                        </td>
                        <td style={{ padding: "0.75rem 0.6rem", color: "#94a3b8", textAlign: "right", whiteSpace: "nowrap" }}>
                          {dateStr ? new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recent"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Low Stock Alerts */}
        <section style={{
          backgroundColor: "#ffffff", borderRadius: 12,
          boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
          padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Low-Stock Alerts</h3>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, backgroundColor: lowStockAlerts.length > 0 ? "#fee2e2" : "#f1f5f9", color: lowStockAlerts.length > 0 ? "#991b1b" : "#475569", padding: "0.15rem 0.4rem", borderRadius: 6 }}>
              {lowStockAlerts.length} Warning(s)
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", maxHeight: "380px", overflowY: "auto", paddingRight: "0.25rem" }}>
            {lowStockAlerts.length === 0 ? (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "#94a3b8", fontSize: "0.8rem" }}>
                All cataloged items are adequately stocked.
              </div>
            ) : (
              sortedLowStockAlerts.map((alert: any, idx: number) => (
                <div key={idx}
                  className={alert.stock === 0 ? "metric-card hover-glow-card alert-critical-pulse" : "metric-card hover-glow-card alert-warning-pulse"}
                  style={{
                    padding: "0.85rem", borderRadius: 8, border: "1px solid #f1f5f9",
                    borderLeftWidth: "4px",
                    display: "flex", flexDirection: "column", gap: "0.35rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1e293b", lineHeight: 1.2 }}>{alert.name}</span>
                    <span style={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      backgroundColor: alert.stock === 0 ? "#fee2e2" : "#fef3c7",
                      color: alert.stock === 0 ? "#b91c1c" : "#b45309",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "6px",
                      whiteSpace: "nowrap"
                    }}>
                      {alert.stock === 0 ? "Critical" : "Low"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                    SKU: {alert.sku} {alert.site ? `· ${alert.site}` : ''} · current stock {alert.stock} / min {alert.min}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* New Section: Recent Asset Deployments Table */}
      <section style={{
        backgroundColor: "#ffffff", borderRadius: 12,
        boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
        padding: "1.5rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.1rem" }}>🚀</span>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Recent Asset Deployments</h3>
          </div>
          <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
            Active & Returned Hardware Custodians
          </span>
        </div>

        <div style={{ overflowX: "auto", maxHeight: "400px", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", textAlign: "left" }}>
            <thead style={{ position: "sticky", top: 0, backgroundColor: "#f8fafc", zIndex: 5, boxShadow: "0 1px 0 #e2e8f0" }}>
              <tr>
                <th style={{ padding: "0.75rem 0.85rem", fontWeight: 700, color: "#64748b" }}>Timestamp</th>
                <th style={{ padding: "0.75rem 0.85rem", fontWeight: 700, color: "#64748b" }}>Employee Name</th>
                <th style={{ padding: "0.75rem 0.85rem", fontWeight: 700, color: "#64748b" }}>Account</th>
                <th style={{ padding: "0.75rem 0.85rem", fontWeight: 700, color: "#64748b" }}>EID</th>
                <th style={{ padding: "0.75rem 0.85rem", fontWeight: 700, color: "#64748b" }}>Deployed Asset</th>
                <th style={{ padding: "0.75rem 0.85rem", fontWeight: 700, color: "#64748b" }}>Asset Tag</th>
                <th style={{ padding: "0.75rem 0.85rem", fontWeight: 700, color: "#64748b" }}>Site Location</th>
                <th style={{ padding: "0.75rem 0.85rem", fontWeight: 700, color: "#64748b" }}>Issued By</th>
                <th style={{ padding: "0.75rem 0.85rem", fontWeight: 700, color: "#64748b" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayDeployments.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#94a3b8" }}>
                    No recent asset deployments recorded.
                  </td>
                </tr>
              ) : (
                displayDeployments.map((dep: any, idx: number) => (
                  <tr
                    key={dep.id + "_" + idx}
                    className="table-row-hover"
                    style={{ borderBottom: "1px solid #f8fafc", backgroundColor: idx % 2 === 1 ? "#fcfdfe" : "#ffffff" }}
                  >
                    <td style={{ padding: "0.75rem 0.85rem", color: "#64748b", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                      {new Date(dep.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td style={{ padding: "0.75rem 0.85rem", color: "#0f172a", fontWeight: 700 }}>
                      {dep.employeeName}
                    </td>
                    <td style={{ padding: "0.75rem 0.85rem", color: "#475569" }}>
                      {dep.employeeAccount}
                    </td>
                    <td style={{ padding: "0.75rem 0.85rem" }}>
                      <EidBadge employeeId={dep.employeeEid} size="sm" />
                    </td>
                    <td style={{ padding: "0.75rem 0.85rem", color: "#0f172a", fontWeight: 600 }}>
                      {dep.itemName}
                    </td>
                    <td style={{ padding: "0.75rem 0.85rem" }}>
                      {dep.assetTag ? (
                        <AssetTagBadge tag={dep.assetTag} size="sm" />
                      ) : (
                        <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontStyle: "italic" }}>Bulk Consumable</span>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 0.85rem" }}>
                      <SiteBadge siteName={dep.siteName} size="sm" />
                    </td>
                    <td style={{ padding: "0.75rem 0.85rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                        <span style={{ color: "#0f172a", fontWeight: 600, fontSize: "0.8rem" }}>
                          {dep.requestedByName || "Christian Mangos"}
                        </span>
                        <div>
                          <RoleBadge role={dep.requestedByRole || "INVENTORY_STAFF"} size="sm" />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 0.85rem" }}>
                      <span style={{
                        padding: "0.18rem 0.55rem",
                        borderRadius: "12px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        backgroundColor: dep.status === "RETURNED" ? "#f1f5f9" : "#dbeafe",
                        color: dep.status === "RETURNED" ? "#64748b" : "#1d4ed8"
                      }}>
                        {dep.status === "RETURNED" ? "RETURNED" : "ACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};
