"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RequestItem, AlertItem } from "@/types/dashboard";
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

// Sub-component so the hook is called at the top level, not inside map()
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
        borderRadius: 12,
        padding: "1.25rem 1.5rem",
        boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
        animationDelay: `${idx * 90}ms`,
      }}
    >
      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.02em" }}>
        {title}
      </span>
      <span style={{ fontSize: "1.75rem", fontWeight: 700, color }}>
        {animated.toLocaleString()}
      </span>
      <span style={{ fontSize: "0.76rem", color: "#94a3b8", fontWeight: 500 }}>
        {desc}
      </span>
      {showProgressBar && (
        <div style={{ height: 6, width: "100%", backgroundColor: "#f1f5f9", borderRadius: 3, overflow: "hidden", marginTop: "0.5rem" }}>
          <div style={{
            height: "100%",
            width: `${fillWidth}%`,
            background: "linear-gradient(90deg, #210cae 0%, #4dc9e6 100%)",
            borderRadius: 3,
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>("");
  const [selectedTableSite, setSelectedTableSite] = useState<string>("");
  const [selectedTableStatus, setSelectedTableStatus] = useState<string>("");

  // Fetch all sites for the dropdown
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

  // Fetch dashboard summary when selected site changes
  useEffect(() => {
    const fetchDashboardSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(getApiUrl(`requests/dashboard-summary?siteId=${selectedSiteId}`));
        if (res.ok) {
          const envelope = await res.json();
          setData(envelope.data);
        } else {
          throw new Error(`Server returned status ${res.status}`);
        }
      } catch (err: any) {
        console.error("Error fetching dashboard summary:", err);
        setError(err.message || "Failed to load dashboard summary");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardSummary();
  }, [selectedSiteId]);

  if (loading && !data) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Improvement #7: Skeleton shimmer loading placeholders */}
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

  const recentRequests = data?.recentRequests || [];

  const filteredRequests = recentRequests.filter((req: any) => {
    const matchesSearch =
      req.id.toLowerCase().includes(searchText.toLowerCase()) ||
      req.requester.toLowerCase().includes(searchText.toLowerCase());
    const matchesSite = !selectedTableSite || req.site === selectedTableSite;
    const matchesStatus = !selectedTableStatus || req.status === selectedTableStatus;
    return matchesSearch && matchesSite && matchesStatus;
  });
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

      {/* Metrics Row — #1 count-up, #2 stagger, #8 hover lift */}
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

      {/* Grid Layout */}
      <div className="dashboard-layout-grid" style={{ display: "grid", gap: "1.5rem", alignItems: "start" }}>
        {/* Recent Requests */}
        <section style={{
          backgroundColor: "#ffffff", borderRadius: 12,
          boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
          padding: "1.5rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Recent Request Transactions</h3>
            <span style={{ fontSize: "0.78rem", color: "#94a3b8", cursor: "pointer", fontWeight: 500 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1e293b")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
              onClick={onViewRequests}
            >
              View All Orders →
            </span>
          </div>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            {/* Improvement #12: search input with focus glow */}
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
              {Array.from(new Set(recentRequests.map((r: any) => r.site))).map((siteName: any) => (
                <option key={siteName} value={siteName}>{siteName}</option>
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
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Ready">Ready</option>
              <option value="Released">Released</option>
              <option value="Completed">Completed</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div style={{ maxHeight: "380px", overflowY: "auto", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Order ID</th>
                  <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Asset Item</th>
                  <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Requester</th>
                  <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Site</th>
                  <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600, textAlign: "right" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
                      No recent request transactions recorded.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req: any) => {
                    let statusBg = "#f1f5f9", statusColor = "#475569";
                    if (req.status === "Pending") { statusBg = "#fef9c3"; statusColor = "#a16207"; }
                    else if (req.status === "Processing") { statusBg = "#ffedd5"; statusColor = "#c2410c"; }
                    else if (req.status === "Ready") { statusBg = "#dbeafe"; statusColor = "#1d4ed8"; }
                    else if (req.status === "Released") { statusBg = "#e0e7ff"; statusColor = "#4338ca"; }
                    else if (req.status === "Completed") { statusBg = "#d1fae5"; statusColor = "#065f46"; }
                    else if (req.status === "Closed") { statusBg = "#f1f5f9"; statusColor = "#64748b"; }
                    return (
                        // Improvement #5: table row hover sweep
                       <tr key={req.id}
                        className="table-row-hover"
                        style={{ borderBottom: "1px solid #f8fafc", cursor: "pointer" }}
                        onClick={onViewRequests}
                       >
                        <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600, color: "#475569" }}>{req.id}</td>
                        <td style={{ padding: "0.75rem 0.5rem", fontWeight: 500 }}>{req.item}</td>
                        <td style={{ padding: "0.75rem 0.5rem", color: "#475569" }}>{req.requester}</td>
                        <td style={{ padding: "0.75rem 0.5rem", color: "#64748b" }}>{req.site}</td>
                        <td style={{ padding: "0.75rem 0.5rem" }}>
                          <span style={{ display: "inline-block", padding: "0.18rem 0.45rem", borderRadius: 6, fontSize: "0.72rem", fontWeight: 600, backgroundColor: statusBg, color: statusColor }}>
                            {req.status}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem", color: "#94a3b8", textAlign: "right" }}>{req.date}</td>
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
                    SKU: {alert.sku} · current stock {alert.stock} / min {alert.min}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
};
