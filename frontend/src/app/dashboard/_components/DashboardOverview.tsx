"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RequestItem, AlertItem, RoleBadge, SiteBadge, EidBadge, AssetTagBadge, getCategoryIcon, getDepartmentIcon } from "@/types/dashboard";
import { getApiUrl } from "@/utils/api";
import { MetricCardSkeleton } from "@/components/ui/Skeleton";

// ── Improvement #1: Count-Up Animation Hook ──────────────────────────
function useCountUp(target: number, duration = 1000, enabled = true) {
  const [count, setCount] = useState(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || target === 0) { setCount(target); return; }
    const startTime = performance.now();
    const startVal = count;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(startVal + ease * (target - startVal)));
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
  bgColor = "#FFFFFF",
  accentColor = "#6366F1",
  icon,
  showProgressBar = false,
  progressBarValue = 0,
}: {
  idx?: number;
  title: string;
  rawValue: number;
  desc: string;
  bgColor?: string;
  accentColor?: string;
  icon?: React.ReactNode;
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
      className="metric-card"
      style={{
        backgroundColor: bgColor,
        borderRadius: 14,
        padding: "1.25rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
        position: "relative",
        border: "1px solid #E2E8F0",
        boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#64748B" }}>
          {title}
        </span>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: "#F8FAFC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: accentColor,
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 2px rgba(15,23,42,0.04)"
        }}>
          {icon || (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          )}
        </div>
      </div>
      <span style={{ fontSize: "32px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em", marginTop: "0.25rem" }}>
        {animated.toLocaleString()}
      </span>
      <span style={{ fontSize: "0.78rem", color: "#64748B", fontWeight: 500 }}>
        {desc}
      </span>
      {showProgressBar && (
        <div style={{ height: 8, width: "100%", backgroundColor: "#F1F5F9", borderRadius: 9999, overflow: "hidden", marginTop: "0.5rem" }}>
          <div style={{
            height: "100%",
            width: `${fillWidth}%`,
            backgroundColor: accentColor,
            borderRadius: 9999,
            transition: "width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }} />
        </div>
      )}
    </div>
  );
}

interface DashboardOverviewProps {
  onViewRequests?: () => void;
  selectedSiteId?: string;
  setSelectedSiteId?: (siteId: string) => void;
  sites?: any[];
}

export const DashboardOverview = ({
  onViewRequests,
  selectedSiteId: propSelectedSiteId,
  setSelectedSiteId: propSetSelectedSiteId,
  sites: propSites,
}: DashboardOverviewProps) => {
  const [internalSites, setInternalSites] = useState<any[]>([]);
  const [internalSelectedSiteId, setInternalSelectedSiteId] = useState<string>("ALL");

  const sites = propSites && propSites.length > 0 ? propSites : internalSites;
  const selectedSiteId = propSelectedSiteId !== undefined ? propSelectedSiteId : internalSelectedSiteId;
  const handleSetSelectedSiteId = (id: string) => {
    if (propSetSelectedSiteId) {
      propSetSelectedSiteId(id);
    } else {
      setInternalSelectedSiteId(id);
    }
  };

  const [data, setData] = useState<any>(null);
  const [deploymentsList, setDeploymentsList] = useState<any[]>([]);
  const [rawRequestsList, setRawRequestsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>("");
  const [selectedTableSite, setSelectedTableSite] = useState<string>("");
  const [selectedTableStatus, setSelectedTableStatus] = useState<string>("");

  // Fetch all sites for dropdown if not provided via props
  useEffect(() => {
    if (propSites && propSites.length > 0) return;
    const fetchSites = async () => {
      try {
        const res = await fetch(getApiUrl("sites"));
        if (res.ok) {
          const sitesData = await res.json();
          setInternalSites(sitesData);
        }
      } catch (err) {
        console.error("Error fetching sites:", err);
      }
    };
    fetchSites();
  }, [propSites]);

  // Fetch dashboard summary and full requests list for detailed tables
  const fetchDashboardSummary = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const siteQuery = (selectedSiteId && selectedSiteId !== "ALL") ? `siteId=${selectedSiteId}` : "";
      const [sumRes, reqRes] = await Promise.all([
        fetch(getApiUrl(`requests/dashboard-summary?${siteQuery}&_t=${Date.now()}`)),
        fetch(getApiUrl(`requests?${siteQuery}&_t=${Date.now()}`))
      ]);

      if (sumRes.ok) {
        const envelope = await sumRes.json();
        const summaryData = envelope.data || envelope;
        setData(summaryData);
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

  // Loading fallback placeholder if initial fetch is ongoing
  const isInitialLoading = loading && !data;

  if (error) {
    return (
      <div style={{ padding: "2rem", backgroundColor: "#FEF2F2", borderRadius: 14, border: "1px solid #E5E7EB", color: "#DC2626", fontSize: "0.875rem", fontWeight: 500 }}>
        Failed to load dashboard data: {error}
      </div>
    );
  }

  const metrics = {
    totalAssets: data?.metrics?.totalAssets ?? data?.totalAssets ?? 0,
    assetsThisWeek: data?.metrics?.assetsThisWeek ?? data?.assetsThisWeek ?? 0,
    activeCheckouts: data?.metrics?.activeCheckouts ?? data?.activeCheckouts ?? 0,
    utilizationRate: data?.metrics?.utilizationRate ?? data?.utilizationRate ?? 0,
    pendingRequestsCount: data?.metrics?.pendingRequestsCount ?? data?.pendingRequestsCount ?? 0,
    awaitingStaffCount: data?.metrics?.awaitingStaffCount ?? data?.awaitingStaffCount ?? 0,
    awaitingOpsCount: data?.metrics?.awaitingOpsCount ?? data?.awaitingOpsCount ?? 0,
    lowStockAlertsCount: data?.metrics?.lowStockAlertsCount ?? data?.lowStockAlertsCount ?? 0,
  };

  const recentRequests = (rawRequestsList.length > 0
    ? rawRequestsList.filter((r: any) => !r.reason || !r.reason.includes("[ASSET DEPLOYMENT]"))
    : (data?.recentRequests || [])).filter((req: any) => {
      if (!selectedSiteId || selectedSiteId === "ALL") return true;
      const targetSiteObj = sites.find(s => s.id === selectedSiteId);
      const reqSiteId = req.siteId || req.requestedBySiteId || req.site?.id;
      const reqSiteName = req.siteName || req.site?.name || req.site;
      return reqSiteId === selectedSiteId || (targetSiteObj && reqSiteName === targetSiteObj.name);
    });

  const filteredRequests = recentRequests.filter((req: any) => {
    const q = searchText.toLowerCase();
    const reqId = req.id || "";
    const name = req.requestedByName || req.requester || "";
    const item = req.itemName || req.item || "";
    const site = req.siteName || req.site || "";
    const reqSiteId = req.siteId || req.requestedBySiteId || "";
    const status = req.status || "";

    const matchesSearch = !q || reqId.toLowerCase().includes(q) || name.toLowerCase().includes(q) || item.toLowerCase().includes(q);
    const matchesSite = !selectedTableSite || site === selectedTableSite || reqSiteId === selectedTableSite;
    const matchesStatus = !selectedTableStatus || status.toUpperCase() === selectedTableStatus.toUpperCase();
    return matchesSearch && matchesSite && matchesStatus;
  });

  // Filter deployments list by selected site
  const filteredDeployments = deploymentsList.filter((dep: any) => {
    if (!selectedSiteId || selectedSiteId === "ALL") return true;
    const targetSiteObj = sites.find(s => s.id === selectedSiteId);
    const depSiteId = dep.siteId || dep.requestedBySiteId;
    const depSiteName = dep.siteName || dep.site;
    return depSiteId === selectedSiteId || (targetSiteObj && depSiteName === targetSiteObj.name);
  });

  const displayDeployments = filteredDeployments;

  const lowStockAlerts = data?.lowStockAlerts || [];
  const sortedLowStockAlerts = [...lowStockAlerts].sort((a: any, b: any) => {
    if (a.stock === 0 && b.stock !== 0) return -1;
    if (b.stock === 0 && a.stock !== 0) return 1;
    if (a.stock === 0 && b.stock === 0) return 0;
    const ratioA = a.stock / Math.max(1, a.min);
    const ratioB = b.stock / Math.max(1, b.min);
    return ratioA - ratioB;
  });

  const renderStatusBadge = (statusStr: string) => {
    const s = (statusStr || "").toUpperCase();

    const conf: Record<string, { bg: string; color: string; border: string; label: string }> = {
      PENDING:              { bg: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", color: "#c2410c", border: "rgba(234,88,12,0.40)", label: "Pending" },
      PENDING_OPS_APPROVAL: { bg: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)", color: "#6b21a8", border: "rgba(147,51,234,0.35)", label: "Pending Ops" },
      APPROVED:             { bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", color: "#1d4ed8", border: "rgba(59,130,246,0.35)", label: "Approved" },
      READY_FOR_PICKUP:     { bg: "linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)", color: "#0e7490", border: "rgba(6,182,212,0.35)", label: "Ready for Pickup" },
      PROCESSING:           { bg: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", color: "#0369a1", border: "rgba(14,165,233,0.35)", label: "Processing" },
      RELEASED:             { bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", color: "#15803d", border: "rgba(34,197,94,0.35)", label: "Released" },
      ITEM_RECEIVED:        { bg: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)", color: "#047857", border: "rgba(16,185,129,0.35)", label: "Completed" },
      COMPLETED:            { bg: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)", color: "#047857", border: "rgba(16,185,129,0.35)", label: "Completed" },
      REJECTED:             { bg: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)", color: "#b91c1c", border: "rgba(239,68,68,0.40)", label: "Rejected" },
      CANCELLED:            { bg: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", color: "#475569", border: "rgba(148,163,184,0.45)", label: "Cancelled" },
      RETURNED:             { bg: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)", color: "#065f46", border: "#6ee7b7", label: "Returned" },
    };

    // Try exact match first, then partial
    const match = conf[s] ?? Object.entries(conf).find(([k]) => s.includes(k))?.[1] ?? conf["PENDING"];

    return (
      <span className="glitter-status-badge" style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.25rem 0.65rem",
        borderRadius: 9999,
        background: match.bg,
        color: match.color,
        border: `1px solid ${match.border}`,
        fontSize: "0.72rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}>
        {match.label}
      </span>
    );
  };

  return (
    <div className="animate-module-flip" style={{ padding: "0.5rem 0" }}>
      {/* Site Filter Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", margin: 0 }}>Dashboard Overview</h1>
          <span style={{ fontSize: "0.85rem", color: "#6B7280", fontWeight: 400 }}>
            Real-time stock and request metrics scoped by site location.
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label htmlFor="site-filter" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>Site Filter:</label>
          <select
            id="site-filter"
            value={selectedSiteId || "ALL"}
            onChange={(e) => handleSetSelectedSiteId(e.target.value)}
            style={{
              padding: "0.45rem 1.75rem 0.45rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid #D1D5DB",
              fontSize: "0.85rem",
              fontWeight: 500,
              backgroundColor: "#FFFFFF",
              color: "#111827",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="ALL">All Sites</option>
            {sites.map((site) => (
              <option key={site.id || site.name} value={site.id || site.name}>
                {site.name} ({site.prefix || "SITE"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Specified Enterprise KPI Cards Row 1 & 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
        {/* Pending Staff Review */}
        <AnimatedMetricCard
          idx={0}
          title="Pending Staff Review"
          rawValue={metrics.awaitingStaffCount}
          desc="Inventory staff to review"
          bgColor="#EFF6FF"
          accentColor="#2563EB"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />

        {/* Awaiting Manager Sign-off */}
        <AnimatedMetricCard
          idx={1}
          title="Awaiting Manager Sign-off"
          rawValue={metrics.awaitingOpsCount}
          desc="Final approval pending"
          bgColor="#FFF7ED"
          accentColor="#EA580C"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>}
        />

        {/* Total Cataloged Assets */}
        <AnimatedMetricCard
          idx={2}
          title="Total Cataloged Assets"
          rawValue={metrics.totalAssets}
          desc={`+${metrics.assetsThisWeek} registered this week`}
          bgColor="#ECFDF5"
          accentColor="#059669"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
        />

        {/* Active Workstations */}
        <AnimatedMetricCard
          idx={3}
          title="Active Workstations"
          rawValue={metrics.activeCheckouts}
          desc={`${metrics.utilizationRate}% total utilization rate`}
          bgColor="#F5F3FF"
          accentColor="#7C3AED"
          showProgressBar={true}
          progressBarValue={metrics.utilizationRate}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
        />

        {/* Low Stock Alerts */}
        <AnimatedMetricCard
          idx={4}
          title="Low Stock Alerts"
          rawValue={metrics.lowStockAlertsCount}
          desc="Items below threshold point"
          bgColor="#FEF2F2"
          accentColor="#DC2626"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><path d="M10.29 3.86L1.82 18C1.5 18.55 1.9 19.25 2.53 19.25H21.47C22.1 19.25 22.5 18.55 22.18 18L13.71 3.86C13.01 2.71 10.99 2.71 10.29 3.86Z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="16.5" r="0.8" fill="currentColor"/></svg>}
        />
      </div>      {/* Grid Layout: Recent Requests & Low Stock Alerts */}
      <div className="dashboard-layout-grid" style={{ display: "grid", gap: "1.5rem", alignItems: "start", marginBottom: "1.75rem" }}>
        {/* Recent Request Transactions */}
        <section
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            border: "1px solid #E5E7EB",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            padding: "1.5rem",
          }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#111827", margin: 0 }}>Recent Request Transactions</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                onClick={() => fetchDashboardSummary(false)}
                title="Refresh dashboard"
                style={{
                  padding: "0.4rem 0.75rem",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  backgroundColor: "#FFFFFF",
                  color: "#374151",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem"
                }}
              >
                ↻ Refresh
              </button>
              <span style={{ fontSize: "0.8rem", color: "#DC2626", cursor: "pointer", fontWeight: 600 }}
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
          <div className="table-scrollable-container" style={{ maxHeight: "380px", overflowY: "auto", overflowX: "auto", scrollbarWidth: "thin", scrollbarColor: "#2563eb #f1f5f9" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
              <thead style={{ position: "sticky", top: 0, backgroundColor: "#f8fafc", zIndex: 5, boxShadow: "0 1px 0 #e2e8f0" }}>
                <tr>
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
                  filteredRequests.map((req: any, index: number) => {
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
                        className="animated-row table-row-hover"
                        style={{ 
                          borderBottom: "1px solid #f8fafc", 
                          cursor: "pointer",
                          animationDelay: `${index * 0.04}s`,
                          transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
                        }}
                        onMouseEnter={(e) => {
                          const iconSpan = e.currentTarget.querySelector('.item-icon') as HTMLElement;
                          if (iconSpan) {
                            iconSpan.style.transform = 'scale(1.2) rotate(-5deg)';
                            iconSpan.style.color = '#3b82f6';
                          }
                        }}
                        onMouseLeave={(e) => {
                          const iconSpan = e.currentTarget.querySelector('.item-icon') as HTMLElement;
                          if (iconSpan) {
                            iconSpan.style.transform = 'scale(1) rotate(0deg)';
                            iconSpan.style.color = '#64748b';
                          }
                        }}
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
                            <span className="item-icon" style={{ color: "#64748b", display: "flex", alignItems: "center", marginTop: "0.1rem", transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
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
        <section
          className="animated-mesh-background"
          style={{
            borderRadius: 12,
            boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(77,201,230,0.3)",
            padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem",
          }}
        >
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
      <section
        className="animated-mesh-background"
        style={{
          borderRadius: 12,
          boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(77,201,230,0.3)",
          padding: "1.5rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.1rem" }}>🚀</span>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Recent Asset Deployments</h3>
          </div>
          <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
            Active & Returned Hardware Custodians
          </span>
        </div>

        <div className="table-scrollable-container" style={{ overflowX: "auto", maxHeight: "380px", overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "#2563eb #f1f5f9" }}>
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
    </div>
  );
};
