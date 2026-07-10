"use client";

import { useState, useEffect, useRef } from "react";
import { getApiUrl } from "../../../utils/api";
import { mockItems } from "@/types/dashboard";

interface ReportsTabProps {
  isUsingMockData: boolean;
  mockAuditLogs: any[];
  currentUser: any;
}

const DOUGHNUT_RADIUS = 35;
const DOUGHNUT_CIRCUMFERENCE = 2 * Math.PI * DOUGHNUT_RADIUS;

// ── count-up animation hook for premium stats numbers ──────────────────
function useCountUp(target: number, duration = 800, enabled = true) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || target === 0) {
      setCount(target);
      return;
    }
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
      setCount(Math.round(ease * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, enabled]);

  return count;
}

export const ReportsTab = ({ isUsingMockData, mockAuditLogs, currentUser }: ReportsTabProps) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [sitesList, setSitesList] = useState<any[]>([]);
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [siteFilter, setSiteFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  // Interactive Overview Panel states
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [activeMetricFilter, setActiveMetricFilter] = useState<"ALL" | "PO_ORDERS" | "STOCK_ADJUSTMENTS" | "LOW_STOCK_ALERTS">("ALL");

  // Floating chart interactive tooltip state
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    date: string;
    count: number;
    label: string;
    color: string;
  } | null>(null);

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

  const fetchSites = async () => {
    if (isUsingMockData) {
      setSitesList([
        { id: "site-1", name: "Cebu IT Park" },
        { id: "site-2", name: "Toronto HQ" }
      ]);
    } else {
      try {
        const res = await fetch(getApiUrl("sites"));
        if (res.ok) {
          const data = await res.json();
          setSitesList(data);
        } else {
          setSitesList([
            { id: "site-1", name: "Cebu IT Park" },
            { id: "site-2", name: "Toronto HQ" }
          ]);
        }
      } catch (err) {
        console.error("Error fetching sites for filter:", err);
        setSitesList([
          { id: "site-1", name: "Cebu IT Park" },
          { id: "site-2", name: "Toronto HQ" }
        ]);
      }
    }
  };

  const fetchItems = async () => {
    if (isUsingMockData) {
      setItemsList(mockItems);
    } else {
      try {
        const res = await fetch(getApiUrl("items"));
        if (res.ok) {
          const data = await res.json();
          setItemsList(data);
        } else {
          setItemsList(mockItems);
        }
      } catch (err) {
        console.error("Error fetching items for summary count:", err);
        setItemsList(mockItems);
      }
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch(getApiUrl("requests"));
      if (res.ok) {
        const envelope = await res.json();
        const data = envelope.data || envelope;
        setRequestsList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching requests for reports:", err);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const res = await fetch(getApiUrl("purchase-orders"));
      if (res.ok) {
        const data = await res.json();
        setPurchaseOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching POs for reports:", err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchSites();
    fetchItems();
    fetchRequests();
    fetchPurchaseOrders();
  }, [isUsingMockData, mockAuditLogs]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const datePart = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
      const timePart = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
      return `${datePart}, ${timePart}`;
    } catch (e) {
      return dateStr;
    }
  };

  const getActionBadgeStyle = (action: string) => {
    switch (action) {
      case "ITEM_CREATED":
        return { backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #dbeafe" };
      case "ITEM_UPDATED":
        return { backgroundColor: "#fef3c7", color: "#d97706", border: "1px solid #fde68a" };
      case "ITEM_DELETED":
        return { backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca" };
      case "STOCK_ADJUSTED":
        return { backgroundColor: "#e8f5e9", color: "#2e7d32", border: "1px solid #c8e6c9" };
      case "PO_ORDERS":
        return { backgroundColor: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" };
      case "LOW_STOCK_ALERT":
        return { backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca" };
      default:
        return { backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" };
    }
  };

  const formatActionName = (action: string) => {
    if (!action) return "Unknown";
    if (action === "LOW_STOCK_ALERT") return "Low Stock Alert";
    if (action === "STOCK_ADJUSTED") return "Stock adjusted";
    if (action === "ITEM_CREATED") return "Item created";
    if (action === "ITEM_UPDATED") return "Item modified";
    if (action === "ITEM_DELETED") return "Item deleted";
    if (action === "PO_ORDERS") return "Purchase Order";
    return action.replace(/_/g, " ");
  };

  // ── 1. Resolve Strict Local Scopes ─────────────────────────────────────
  // Context logs filtered by siteFilter + dateFilter
  const dashboardContextLogs = logs.filter((log) => {
    const logSiteId = log.siteId || log.user?.siteId;
    const matchesSite = siteFilter === "ALL" || logSiteId === siteFilter;

    let matchesDate = true;
    if (dateFilter) {
      const logDatePart = new Date(log.createdAt).toISOString().split("T")[0];
      matchesDate = logDatePart === dateFilter;
    }

    return matchesSite && matchesDate;
  });

  // Calculate real-time Low Stock Alerts from itemsList
  const lowStockAlerts = itemsList.flatMap(it =>
    (it.stockLevels || [])
      .filter((sl: any) => sl.quantity <= sl.reorderPoint)
      .map((sl: any) => ({
        itemId: it.id,
        sku: it.sku || "",
        name: it.name || "",
        category: it.category?.name || "Uncategorized",
        siteId: sl.siteId || "",
        quantity: sl.quantity || 0,
        reorderPoint: sl.reorderPoint || 0,
        status: (sl.quantity || 0) === 0 ? "OUT_OF_STOCK" : "LOW_STOCK"
      }))
  );

  // Filtered Low Stock Alerts (by siteFilter)
  const filteredLowStockAlerts = lowStockAlerts.filter(alert => {
    const matchesSite = siteFilter === "ALL" || alert.siteId === siteFilter;
    const matchesSearch =
      alert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSite && matchesSearch;
  });

  // Map Low Stock Alerts to virtual logs for All Records feed
  const virtualLowStockAlertLogs = lowStockAlerts.map(alert => {
    const siteLabel = alert.siteId === "site-1" ? "Cebu IT Park" : alert.siteId === "site-2" ? "Toronto HQ" : alert.siteId;
    return {
      id: `alert-${alert.itemId}-${alert.siteId}`,
      createdAt: new Date().toISOString(),
      user: { name: "System Monitor", email: "monitoring@company.com" },
      action: "LOW_STOCK_ALERT",
      itemName: alert.name,
      itemSku: alert.sku,
      itemCategory: alert.category,
      details: `[ALERT] Stock level for "${alert.name}" (${alert.sku}) at site "${siteLabel}" has dropped to ${alert.quantity} (Reorder point: ${alert.reorderPoint}). Status: ${alert.status === "OUT_OF_STOCK" ? "OUT OF STOCK" : "LOW STOCK"}.`,
      siteId: alert.siteId
    };
  });

  // Filter virtual alerts (by siteFilter)
  const filteredVirtualLowStockAlertLogs = virtualLowStockAlertLogs.filter(log => {
    const matchesSite = siteFilter === "ALL" || log.siteId === siteFilter;
    let matchesDate = true;
    if (dateFilter) {
      const logDatePart = new Date(log.createdAt).toISOString().split("T")[0];
      matchesDate = logDatePart === dateFilter;
    }
    return matchesSite && matchesDate;
  });

  const activeRequests = requestsList.length > 0 ? requestsList : [
    { id: "REQ-001", status: "APPROVED", createdAt: new Date().toISOString() },
    { id: "REQ-002", status: "RELEASED", createdAt: new Date().toISOString() },
    { id: "REQ-003", status: "COMPLETED", createdAt: new Date().toISOString() },
    { id: "REQ-004", status: "APPROVED", createdAt: new Date().toISOString() },
    { id: "REQ-005", status: "RELEASED", createdAt: new Date().toISOString() },
    { id: "REQ-006", status: "COMPLETED", createdAt: new Date().toISOString() },
    { id: "REQ-007", status: "REJECTED", createdAt: new Date().toISOString() },
    { id: "REQ-008", status: "APPROVED", createdAt: new Date().toISOString() },
    { id: "REQ-009", status: "APPROVED", createdAt: new Date().toISOString() },
    { id: "REQ-010", status: "PENDING", createdAt: new Date().toISOString() },
  ];

  const activePOsList = purchaseOrders.length > 0 ? purchaseOrders : [
    { id: "PO-2026-001", supplier: { name: "ContactPoint Tech" }, site: { name: "Cebu IT Park" }, supplierName: "ContactPoint Tech", siteName: "Cebu IT Park", status: "ORDERED", totalCost: 3500.00, createdAt: new Date().toISOString() },
    { id: "PO-2026-002", supplier: { name: "Global Office Corp" }, site: { name: "Toronto HQ" }, supplierName: "Global Office Corp", siteName: "Toronto HQ", status: "PARTIALLY_RECEIVED", totalCost: 1200.00, createdAt: new Date().toISOString() },
    { id: "PO-2026-003", supplier: { name: "Dell Retailer" }, site: { name: "Cebu IT Park" }, supplierName: "Dell Retailer", siteName: "Cebu IT Park", status: "RECEIVED", totalCost: 4500.00, createdAt: new Date().toISOString() },
    { id: "PO-2026-004", supplier: { name: "ContactPoint Tech" }, site: { name: "Cebu IT Park" }, supplierName: "ContactPoint Tech", siteName: "Cebu IT Park", status: "DRAFT", totalCost: 800.00, createdAt: new Date().toISOString() },
  ];

  // Map POs to virtual logs
  const virtualPOLogs = activePOsList.map(po => ({
    id: po.id,
    createdAt: po.createdAt || new Date().toISOString(),
    user: { name: "Procurement System", email: "procurement@company.com" },
    action: "PO_ORDERS",
    itemName: po.supplier?.name || po.supplierName || "Default Supplier",
    itemSku: "",
    details: `Purchase Order ${po.id} status is ${po.status}. Total Cost: $${Number(po.totalCost || 0).toFixed(2)}. Site Location: ${po.site?.name || po.siteName || "Cebu IT Park"}`,
    siteId: po.siteId || (po.site?.id) || "site-1"
  }));

  // Filter virtual PO logs (by siteFilter)
  const filteredVirtualPOLogs = virtualPOLogs.filter(log => {
    const matchesSite = siteFilter === "ALL" || log.siteId === siteFilter;
    let matchesDate = true;
    if (dateFilter) {
      const logDatePart = new Date(log.createdAt).toISOString().split("T")[0];
      matchesDate = logDatePart === dateFilter;
    }
    return matchesSite && matchesDate;
  });

  // Master logs list depending on overview filter
  const getActiveMetricFilteredLogs = () => {
    if (activeMetricFilter === "PO_ORDERS") {
      return filteredVirtualPOLogs;
    }
    if (activeMetricFilter === "STOCK_ADJUSTMENTS") {
      return dashboardContextLogs.filter(l => l.action === "STOCK_ADJUSTED");
    }
    if (activeMetricFilter === "LOW_STOCK_ALERTS") {
      return filteredVirtualLowStockAlertLogs;
    }
    return [...dashboardContextLogs, ...filteredVirtualPOLogs, ...filteredVirtualLowStockAlertLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const activeMetricFilteredLogs = getActiveMetricFilteredLogs();

  // Filter logs for the table list
  const filteredLogs = activeMetricFilteredLogs.filter((log) => {
    const matchesSearch =
      (log.details || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.action || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.user?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.user?.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.itemName || log.item?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.itemSku || log.item?.sku || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction =
      actionFilter === "ALL" ||
      log.action === actionFilter ||
      (actionFilter === "STOCK_ADJUSTED" && log.action === "STOCK_ADJUSTED");

    return matchesSearch && matchesAction;
  });

  // Filtered POs
  const filteredPOs = activePOsList.filter(po => {
    const poSiteId = po.siteId || (po.site?.id) || "site-1";
    const matchesSite = siteFilter === "ALL" || poSiteId === siteFilter;
    const matchesSearch =
      po.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (po.supplier?.name || po.supplierName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (po.site?.name || po.siteName || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSite && matchesSearch;
  });

  // ── 2. Dynamic Metric Cards (Morphed based on active filter button) ──
  let rawCard1 = 0, labelCard1 = "TOTAL ACTIONS", colorCard1 = "#0f172a";
  let rawCard2 = 0, labelCard2 = "APPROVAL RATE", colorCard2 = "#6366f1", suffixCard2 = "%";
  let rawCard3 = 0, labelCard3 = "ACTIVE PERFORMERS", colorCard3 = "#f59e0b";
  let rawCard4 = 0, labelCard4 = "LOW STOCK ALERTS", colorCard4 = "#ef4444";

  if (activeMetricFilter === "PO_ORDERS") {
    // Procurement Metrics
    rawCard1 = activePOsList.length;
    labelCard1 = "TOTAL POs";
    colorCard1 = "#3b82f6";

    const completed = activePOsList.filter(po => po.status === "RECEIVED").length;
    rawCard2 = completed;
    labelCard2 = "COMPLETED ORDERS";
    colorCard2 = "#10b981";
    suffixCard2 = "";

    const activePOsCount = activePOsList.filter(po => po.status === "ORDERED" || po.status === "PARTIALLY_RECEIVED").length;
    rawCard3 = activePOsCount;
    labelCard3 = "PENDING SHIPMENTS";
    colorCard3 = "#f59e0b";

    const drafts = activePOsList.filter(po => po.status === "DRAFT").length;
    rawCard4 = drafts;
    labelCard4 = "DRAFTS SAVES";
    colorCard4 = "#64748b";
  } else if (activeMetricFilter === "STOCK_ADJUSTMENTS") {
    // Adjustment Metrics
    rawCard1 = dashboardContextLogs.filter(l => l.action === "STOCK_ADJUSTED").length;
    labelCard1 = "TOTAL ADJUSTMENTS";
    colorCard1 = "#10b981";

    const uniqueAdjusted = new Set(dashboardContextLogs.filter(l => l.action === "STOCK_ADJUSTED").map(l => l.itemId)).size;
    rawCard2 = uniqueAdjusted;
    labelCard2 = "UNIQUE ITEMS ADJUSTED";
    colorCard2 = "#3b82f6";
    suffixCard2 = "";

    const performers = new Set(dashboardContextLogs.filter(l => l.action === "STOCK_ADJUSTED").map(l => l.user?.email || "System")).size;
    rawCard3 = performers;
    labelCard3 = "ACTIVE PERFORMERS";
    colorCard3 = "#f59e0b";

    const lowStock = filteredLowStockAlerts.length;
    rawCard4 = lowStock;
    labelCard4 = "LOW STOCK ALERTS";
    colorCard4 = "#ef4444";
  } else if (activeMetricFilter === "LOW_STOCK_ALERTS") {
    // Low Stock Alert Metrics
    rawCard1 = filteredLowStockAlerts.length;
    labelCard1 = "TOTAL ALERTS";
    colorCard1 = "#ef4444";

    const outOfStock = filteredLowStockAlerts.filter(a => a.quantity === 0).length;
    rawCard2 = outOfStock;
    labelCard2 = "OUT OF STOCK";
    colorCard2 = "#dc2626";
    suffixCard2 = "";

    const critical = filteredLowStockAlerts.filter(a => a.quantity <= a.reorderPoint / 2).length;
    rawCard3 = critical;
    labelCard3 = "CRITICAL ALERTS";
    colorCard3 = "#b91c1c";

    const uniqueSites = new Set(filteredLowStockAlerts.map(a => a.siteId)).size;
    rawCard4 = uniqueSites;
    labelCard4 = "AFFECTED SITES";
    colorCard4 = "#475569";
  } else {
    // General Metrics (ALL) - combines both
    rawCard1 = dashboardContextLogs.length + filteredVirtualPOLogs.length;
    labelCard1 = "TOTAL ACTIONS";
    colorCard1 = "#0f172a";

    const approved = activeRequests.filter((r: any) => r.status === "APPROVED" || r.status === "RELEASED" || r.status === "COMPLETED").length;
    rawCard2 = Math.round((approved / activeRequests.length) * 100);
    labelCard2 = "APPROVAL RATE";
    colorCard2 = "#6366f1";
    suffixCard2 = "%";

    const performers = new Set([...dashboardContextLogs.map(l => l.user?.email || "System"), "procurement@company.com"]).size;
    rawCard3 = performers;
    labelCard3 = "ACTIVE PERFORMERS";
    colorCard3 = "#f59e0b";

    const lowStock = filteredLowStockAlerts.length;
    rawCard4 = lowStock;
    labelCard4 = "LOW STOCK ALERTS";
    colorCard4 = "#ef4444";
  }

  // Animate grid cards
  const valCard1 = useCountUp(rawCard1);
  const valCard2 = useCountUp(rawCard2);
  const valCard3 = useCountUp(rawCard3);
  const valCard4 = useCountUp(rawCard4);

  // Overview Cards (Always fixed unfiltered counts)
  const rawStockAdjustmentsTotal = dashboardContextLogs.filter(l => l.action === "STOCK_ADJUSTED").length;
  const rawActivePOsTotal = activePOsList.filter((po: any) => {
    const poSiteId = po.siteId || (po.site?.id) || "site-1";
    const matchesSite = siteFilter === "ALL" || poSiteId === siteFilter;
    return (po.status === "ORDERED" || po.status === "PARTIALLY_RECEIVED") && matchesSite;
  }).length;
  const rawAllRecordsTotal = dashboardContextLogs.length + filteredVirtualPOLogs.length + filteredVirtualLowStockAlertLogs.length;
  const rawLowStockAlertsTotal = filteredLowStockAlerts.length;

  const stockAdjustmentsOverviewVal = useCountUp(rawStockAdjustmentsTotal);
  const activePOsOverviewVal = useCountUp(rawActivePOsTotal);
  const allRecordsOverviewVal = useCountUp(rawAllRecordsTotal);
  const lowStockAlertsOverviewVal = useCountUp(rawLowStockAlertsTotal);

  // Resolve Calendar limits
  const getEndDate = () => {
    if (!dateFilter) return new Date();
    const [year, month, day] = dateFilter.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = getEndDate();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const dayLabels = last7Days.map(d =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  );

  const isSameDay = (d1: Date, d2Str: string) => {
    const d2 = new Date(d2Str);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // ── 3. Dynamic Chart Telemetry (Tailored based on active filter button) ──
  let dayCounts: number[] = [];
  let doughnutData: any[] = [];
  let activeCategories: any[] = [];

  // Points arrays for multiple line support
  let pointsLogs: any[] = [];
  let pointsPOs: any[] = [];

  const svgWidth = 500;
  const svgHeight = 150;
  const paddingLeft = 30;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const logsDayCounts = last7Days.map(day => dashboardContextLogs.filter(log => isSameDay(day, log.createdAt)).length);
  const poDayCounts = last7Days.map(day => filteredVirtualPOLogs.filter(po => isSameDay(day, po.createdAt)).length);

  let maxLimit = 5;
  if (activeMetricFilter === "PO_ORDERS") {
    maxLimit = Math.max(...poDayCounts, 5);
  } else if (activeMetricFilter === "STOCK_ADJUSTMENTS") {
    maxLimit = Math.max(...logsDayCounts, 5);
  } else if (activeMetricFilter === "LOW_STOCK_ALERTS") {
    const topAlerts = filteredLowStockAlerts.slice(0, 7);
    maxLimit = Math.max(...topAlerts.flatMap(a => [a.quantity, a.reorderPoint]), 5);
  } else {
    maxLimit = Math.max(...logsDayCounts, ...poDayCounts, 5);
  }

  // Create standard vertices
  pointsLogs = logsDayCounts.map((count, i) => {
    const x = paddingLeft + (i / 6) * chartWidth;
    const y = paddingTop + chartHeight - (count / maxLimit) * chartHeight;
    return {
      x,
      y,
      count,
      label: activeMetricFilter === "STOCK_ADJUSTMENTS" ? "Stock Adjustments" : "Stock Activity",
      color: activeMetricFilter === "STOCK_ADJUSTMENTS" ? "#10b981" : "#3b82f6"
    };
  });

  pointsPOs = poDayCounts.map((count, i) => {
    const x = paddingLeft + (i / 6) * chartWidth;
    const y = paddingTop + chartHeight - (count / maxLimit) * chartHeight;
    return {
      x,
      y,
      count,
      label: "Purchase Orders",
      color: "#7c3aed"
    };
  });

  // Calculate paths
  const linePathLogs = pointsLogs.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPathLogs = pointsLogs.length > 0 && Math.max(...logsDayCounts) > 0
    ? `${linePathLogs} L ${pointsLogs[pointsLogs.length - 1].x} ${paddingTop + chartHeight} L ${pointsLogs[0].x} ${paddingTop + chartHeight} Z`
    : "";

  const linePathPOs = pointsPOs.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPathPOs = pointsPOs.length > 0 && Math.max(...poDayCounts) > 0
    ? `${linePathPOs} L ${pointsPOs[pointsPOs.length - 1].x} ${paddingTop + chartHeight} L ${pointsPOs[0].x} ${paddingTop + chartHeight} Z`
    : "";

  if (activeMetricFilter === "PO_ORDERS") {
    dayCounts = poDayCounts;

    // Doughnut Chart: PO Status breakdown
    const poStatusCategories = [
      { status: "RECEIVED", label: "Completed", color: "#10b981" },
      { status: "ORDERED", label: "Ordered", color: "#3b82f6" },
      { status: "PARTIALLY_RECEIVED", label: "Partially Received", color: "#f59e0b" },
      { status: "DRAFT", label: "Draft", color: "#64748b" },
    ];
    doughnutData = poStatusCategories.map(cat => {
      const count = activePOsList.filter(po => {
        const poSiteId = po.siteId || (po.site?.id) || "site-1";
        const matchesSite = siteFilter === "ALL" || poSiteId === siteFilter;
        return po.status === cat.status && matchesSite;
      }).length;
      return { ...cat, count };
    }).filter(c => c.count > 0);

    // Bar Chart: Active Suppliers
    const supplierCounts: { [key: string]: number } = {};
    activePOsList.forEach(po => {
      const poSiteId = po.siteId || (po.site?.id) || "site-1";
      const matchesSite = siteFilter === "ALL" || poSiteId === siteFilter;
      if (matchesSite) {
        const sName = po.supplier?.name || po.supplierName || "Default Supplier";
        supplierCounts[sName] = (supplierCounts[sName] || 0) + 1;
      }
    });
    activeCategories = Object.entries(supplierCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

  } else if (activeMetricFilter === "STOCK_ADJUSTMENTS") {
    dayCounts = logsDayCounts;

    // Doughnut Chart: Reason Breakdown (Increase vs Decrease vs Correction)
    const adjReasonCategories = [
      { key: "increase", label: "Increase", color: "#10b981" },
      { key: "decrease", label: "Decrease", color: "#ef4444" },
      { key: "correction", label: "Correction", color: "#f59e0b" },
    ];
    const getReasonKey = (details: string) => {
      const d = details.toLowerCase();
      if (d.includes("increase")) return "increase";
      if (d.includes("decrease")) return "decrease";
      return "correction";
    };
    const adjustments = dashboardContextLogs.filter(l => l.action === "STOCK_ADJUSTED");
    doughnutData = adjReasonCategories.map(cat => {
      const count = adjustments.filter(l => getReasonKey(l.details || "") === cat.key).length;
      return { ...cat, count };
    }).filter(c => c.count > 0);

    // Bar Chart: Adjusted Categories
    const categoryCounts: { [key: string]: number } = {};
    dashboardContextLogs.filter(l => l.action === "STOCK_ADJUSTED").forEach(log => {
      const catName = log.item?.category?.name || log.itemCategory || "Generic / Other";
      categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
    });
    activeCategories = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

  } else if (activeMetricFilter === "LOW_STOCK_ALERTS") {
    // Doughnut Chart: Low Stock Status breakdown
    const outOfStockCount = filteredLowStockAlerts.filter(a => a.quantity === 0).length;
    const lowStockCount = filteredLowStockAlerts.filter(a => a.quantity > 0).length;
    doughnutData = [
      { label: "Out of Stock", count: outOfStockCount, color: "#dc2626" },
      { label: "Low Stock Alert", count: lowStockCount, color: "#f59e0b" }
    ].filter(c => c.count > 0);

    // Bar Chart: Low stock alerts by Category
    const alertCategoryCounts: { [key: string]: number } = {};
    filteredLowStockAlerts.forEach(alert => {
      const catName = alert.category || "Uncategorized";
      alertCategoryCounts[catName] = (alertCategoryCounts[catName] || 0) + 1;
    });
    activeCategories = Object.entries(alertCategoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

  } else {
    // General Metrics (ALL) - combines both
    dayCounts = last7Days.map((_, i) => logsDayCounts[i] + poDayCounts[i]);

    // Doughnut Chart: Combined Action Types & Purchase Orders
    const segmentCategoriesGeneral = [
      { action: "STOCK_ADJUSTED", label: "Stock adjusted", color: "#10b981" },
      { action: "ITEM_CREATED", label: "Item created", color: "#3b82f6" },
      { action: "ITEM_UPDATED", label: "Item modified", color: "#f59e0b" },
      { action: "ITEM_DELETED", label: "Item deleted", color: "#ef4444" },
      { action: "PO_ORDERS", label: "Purchase orders", color: "#7c3aed" }, // Violet segment for POs
      { action: "LOW_STOCK_ALERT", label: "Low stock alerts", color: "#dc2626" }
    ];
    doughnutData = segmentCategoriesGeneral.map(cat => {
      const count = activeMetricFilteredLogs.filter(l => l.action === cat.action).length;
      return { ...cat, count };
    }).filter(c => c.count > 0);

    // Bar Chart: Categories including PO Suppliers
    const categoryCounts: { [key: string]: number } = {};
    activeMetricFilteredLogs.forEach(log => {
      if (log.action === "PO_ORDERS") {
        categoryCounts["PO Suppliers"] = (categoryCounts["PO Suppliers"] || 0) + 1;
      } else {
        const catName = log.item?.category?.name || log.itemCategory || "Generic / Other";
        categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
      }
    });
    activeCategories = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }

  const gridValues = Array.from({ length: 6 }, (_, i) => Math.round((maxLimit / 5) * i));
  const totalDoughnutCount = doughnutData.reduce((sum, d) => sum + d.count, 0);

  // Helper to generate and download CSV
  const downloadCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows.map(r => r.map(val => {
        const strVal = String(val === null || val === undefined ? "" : val);
        return `"${strVal.replace(/"/g, '""')}"`;
      }).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Header Export handler (exports currently filtered logs or POs)
  const handleExportFilteredLogs = () => {
    if (activeMetricFilter === "PO_ORDERS") {
      const headers = ["PO Number", "Supplier", "Site Location", "Total Cost", "Status"];
      const rows = filteredPOs.map(po => [
        po.id,
        po.supplier?.name || po.supplierName || "Default Supplier",
        po.site?.name || po.siteName || po.site || "Cebu IT Park",
        `$${Number(po.totalCost || 0).toFixed(2)}`,
        po.status
      ]);
      downloadCSV("purchase_orders_report.csv", headers, rows);
    } else if (activeMetricFilter === "LOW_STOCK_ALERTS") {
      const headers = ["SKU", "Item Name", "Category", "Site Location", "Current Stock", "Reorder Point", "Status"];
      const rows = filteredLowStockAlerts.map((alert: any) => [
        alert.sku,
        alert.name,
        alert.category,
        alert.siteId === "site-1" ? "Cebu IT Park" : alert.siteId === "site-2" ? "Toronto HQ" : alert.siteId,
        alert.quantity,
        alert.reorderPoint,
        alert.status === "OUT_OF_STOCK" ? "OUT OF STOCK" : "LOW STOCK"
      ]);
      downloadCSV("low_stock_alerts_report.csv", headers, rows);
    } else {
      const headers = ["Timestamp", "Performed By", "Email", "Action", "Item", "SKU", "Details", "IP Address"];
      const rows = filteredLogs.map(log => [
        formatDate(log.createdAt),
        log.user?.name || "System",
        log.user?.email || "internal",
        formatActionName(log.action),
        log.itemName || log.item?.name || "None / Generic",
        log.itemSku || log.item?.sku || "",
        log.details || "",
        log.ipAddress || ""
      ]);
      downloadCSV("reports_audit_logs.csv", headers, rows);
    }
  };

  // Generate Report: General Unified Report
  const handleGenerateGeneralReport = async () => {
    try {
      let itemsListFetched = [];
      if (isUsingMockData) {
        itemsListFetched = mockItems;
      } else {
        const res = await fetch(getApiUrl("items"));
        if (res.ok) {
          itemsListFetched = await res.json();
        } else {
          itemsListFetched = mockItems;
        }
      }

      const csvLines: string[] = [];

      // SECTION 1: INVENTORY SUMMARY
      csvLines.push('"=== SECTION 1: INVENTORY SUMMARY ==="');
      const invHeaders = ["SKU", "Item Name", "Category", "Category Type", "Unit Price", "Lead Time (Days)", "Total Stock"];
      csvLines.push(invHeaders.map(h => `"${h.replace(/"/g, '""')}"`).join(","));

      itemsListFetched.forEach((it: any) => {
        const totalStock = it.stockLevels?.reduce((sum: number, sl: any) => sum + sl.quantity, 0) ?? 0;
        const row = [
          it.sku || "",
          it.name || "",
          it.category?.name || "",
          it.category?.type || "",
          `$${Number(it.unitPrice || 0).toFixed(2)}`,
          String(it.leadTimeDays || 0),
          String(totalStock)
        ];
        csvLines.push(row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","));
      });

      csvLines.push("");
      csvLines.push("");

      // SECTION 2: MOVEMENT HISTORY
      csvLines.push('"=== SECTION 2: MOVEMENT HISTORY ==="');
      const moveHeaders = ["Timestamp", "Performed By", "Email", "ActionType", "Item Name", "SKU", "Movement Details", "IP Address"];
      csvLines.push(moveHeaders.map(h => `"${h.replace(/"/g, '""')}"`).join(","));

      const movementLogs = logs.filter(l => l.action === "STOCK_ADJUSTED" || l.action === "ITEM_CREATED" || l.action === "ITEM_DELETED");
      movementLogs.forEach(log => {
        const row = [
          formatDate(log.createdAt),
          log.user?.name || "System",
          log.user?.email || "internal",
          formatActionName(log.action),
          log.itemName || log.item?.name || "None",
          log.itemSku || log.item?.sku || "",
          log.details || "",
          log.ipAddress || ""
        ];
        csvLines.push(row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","));
      });

      csvLines.push("");
      csvLines.push("");

      // SECTION 3: ACTIVE LOW STOCK ALERTS
      csvLines.push('"=== SECTION 3: ACTIVE LOW STOCK ALERTS ==="');
      const alertHeaders = ["SKU", "Item Name", "Category", "Site Location ID", "Current Stock", "Reorder Point Alert Threshold", "Status"];
      csvLines.push(alertHeaders.map(h => `"${h.replace(/"/g, '""')}"`).join(","));

      itemsListFetched.forEach((it: any) => {
        it.stockLevels?.forEach((sl: any) => {
          if (sl.quantity <= sl.reorderPoint) {
            const siteLabel = sl.siteId === "site-1" ? "Cebu IT Park" : sl.siteId === "site-2" ? "Toronto HQ" : sl.siteId;
            const row = [
              it.sku || "",
              it.name || "",
              it.category?.name || "Uncategorized",
              siteLabel || "Global",
              String(sl.quantity),
              String(sl.reorderPoint),
              sl.quantity === 0 ? "OUT_OF_STOCK" : "LOW_STOCK"
            ];
            csvLines.push(row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","));
          }
        });
      });

      const csvContent = csvLines.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "general_inventory_report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to generate general inventory report:", err);
    }
  };

  return (
    <div key={siteFilter + "_" + dateFilter} className="animate-module-flip" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
      {/* Header Panel */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: "1.25rem 1.5rem",
        boxShadow: "0 1px 3px rgba(15,23,42,0.03), 0 0 0 1px rgba(226,232,240,0.8)",
      }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
            Reports and system logs
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
            Audit trail, activity trends, and exportable reports.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>

          {/* Site Filter — Overview & Charts */}
          <div style={{ position: "relative", minWidth: "160px" }}>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "0.45rem 2rem 0.45rem 0.65rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.8rem",
                color: "#334155",
                backgroundColor: "#f8fafc",
                outline: "none",
                cursor: "pointer",
                appearance: "none",
                fontWeight: 500,
              }}
            >
              <option value="ALL">All sites</option>
              {sitesList.map((site: any) => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
            <svg style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          <button
            onClick={fetchLogs}
            className="btn-hover-effect"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#334155",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            Refresh
          </button>
          <button
            onClick={handleExportFilteredLogs}
            className="btn-hover-effect"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#334155",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Collapsible Overview Top Panel (contains ACTIVE PO ORDERS, STOCK ADJUSTMENTS & ALL RECORDS cards) */}
      <div
        onMouseEnter={() => setIsOverviewExpanded(true)}
        onMouseLeave={() => setIsOverviewExpanded(false)}
        style={{
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(15,23,42,0.02)',
          padding: isOverviewExpanded ? '1.25rem' : '0.85rem 1.25rem',
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          maxHeight: isOverviewExpanded ? '200px' : '48px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          cursor: isOverviewExpanded ? 'default' : 'pointer',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isOverviewExpanded ? '1rem' : '0', transition: 'margin-bottom 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              Order & Inventory Overview
            </h3>
            {!isOverviewExpanded && <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>(Hover to expand)</span>}
          </div>
          {!isOverviewExpanded && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Active Filter:</span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: activeMetricFilter === "PO_ORDERS" ? '#3b82f6' : activeMetricFilter === "STOCK_ADJUSTMENTS" ? '#10b981' : activeMetricFilter === "LOW_STOCK_ALERTS" ? '#ef4444' : '#6366f1',
                backgroundColor: activeMetricFilter === "PO_ORDERS" ? 'rgba(59, 130, 246, 0.05)' : activeMetricFilter === "STOCK_ADJUSTMENTS" ? 'rgba(16, 185, 129, 0.05)' : activeMetricFilter === "LOW_STOCK_ALERTS" ? 'rgba(239, 68, 68, 0.05)' : 'rgba(99, 102, 241, 0.05)',
                padding: '0.2rem 0.5rem',
                borderRadius: 4
              }}>
                {activeMetricFilter === "PO_ORDERS" ? "Active PO Orders" : activeMetricFilter === "STOCK_ADJUSTMENTS" ? "Stock Adjustments" : activeMetricFilter === "LOW_STOCK_ALERTS" ? "Low Stock Alerts" : "All Records"}
              </span>
            </div>
          )}
        </div>

        {/* Expanded Content: The 4 clickable overview cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.25rem',
          opacity: isOverviewExpanded ? 1 : 0,
          transform: isOverviewExpanded ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'all 0.3s ease-in-out',
          pointerEvents: isOverviewExpanded ? 'auto' : 'none'
        }}>
          {/* Card 1: ACTIVE PO ORDERS */}
          <div
            onClick={() => setActiveMetricFilter(prev => prev === "PO_ORDERS" ? "ALL" : "PO_ORDERS")}
            className="btn-hover-effect"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "1rem 1.25rem",
              boxShadow: "0 1px 2px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.8)",
              border: activeMetricFilter === "PO_ORDERS" ? "2px solid #3b82f6" : "2px solid transparent",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              cursor: "pointer",
              userSelect: "none"
            }}
          >
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.05em" }}>
              ACTIVE PO ORDERS
            </span>
            <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "#3b82f6", lineHeight: 1 }}>
              {activePOsOverviewVal}
            </span>
            <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
              {activeMetricFilter === "PO_ORDERS" ? "⚡ Filtering: showing purchase order list" : "Click to filter table and graphs"}
            </span>
          </div>

          {/* Card 2: STOCK ADJUSTMENTS */}
          <div
            onClick={() => setActiveMetricFilter(prev => prev === "STOCK_ADJUSTMENTS" ? "ALL" : "STOCK_ADJUSTMENTS")}
            className="btn-hover-effect"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "1rem 1.25rem",
              boxShadow: "0 1px 2px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.8)",
              border: activeMetricFilter === "STOCK_ADJUSTMENTS" ? "2px solid #10b981" : "2px solid transparent",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              cursor: "pointer",
              userSelect: "none"
            }}
          >
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.05em" }}>
              STOCK ADJUSTMENTS
            </span>
            <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "#10b981", lineHeight: 1 }}>
              {stockAdjustmentsOverviewVal}
            </span>
            <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
              {activeMetricFilter === "STOCK_ADJUSTMENTS" ? "⚡ Filtering: showing stock adjustments" : "Click to filter table and graphs"}
            </span>
          </div>

          {/* Card 3: LOW STOCK ALERTS */}
          <div
            onClick={() => setActiveMetricFilter(prev => prev === "LOW_STOCK_ALERTS" ? "ALL" : "LOW_STOCK_ALERTS")}
            className="btn-hover-effect"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "1rem 1.25rem",
              boxShadow: "0 1px 2px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.8)",
              border: activeMetricFilter === "LOW_STOCK_ALERTS" ? "2px solid #ef4444" : "2px solid transparent",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              cursor: "pointer",
              userSelect: "none"
            }}
          >
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.05em" }}>
              LOW STOCK ALERTS
            </span>
            <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "#ef4444", lineHeight: 1 }}>
              {lowStockAlertsOverviewVal}
            </span>
            <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
              {activeMetricFilter === "LOW_STOCK_ALERTS" ? "⚡ Filtering: showing low stock alerts" : "Click to filter table and graphs"}
            </span>
          </div>

          {/* Card 4: ALL RECORDS */}
          <div
            onClick={() => setActiveMetricFilter("ALL")}
            className="btn-hover-effect"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "1rem 1.25rem",
              boxShadow: "0 1px 2px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.8)",
              border: activeMetricFilter === "ALL" ? "2px solid #6366f1" : "2px solid transparent",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              cursor: "pointer",
              userSelect: "none"
            }}
          >
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.05em" }}>
              ALL RECORDS
            </span>
            <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "#6366f1", lineHeight: 1 }}>
              {allRecordsOverviewVal}
            </span>
            <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
              {activeMetricFilter === "ALL" ? "⚡ Filtering: showing all logs & activity" : "Click to clear active filters"}
            </span>
          </div>
        </div>
      </div>

      {/* Remaining Four Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.25rem" }}>
        {[
          { title: labelCard1, value: String(valCard1), color: colorCard1 },
          { title: labelCard2, value: `${valCard2}${suffixCard2 || ""}`, color: colorCard2 },
          { title: labelCard3, value: String(valCard3), color: colorCard3 },
          { title: labelCard4, value: String(valCard4), color: colorCard4 },
        ].map((card, idx) => (
          <div
            key={idx}
            className="metric-card stagger-card"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "1.25rem 1.5rem",
              boxShadow: "0 1px 2px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.8)",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              animationDelay: `${idx * 0.05}s`
            }}
          >
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.05em" }}>
              {card.title}
            </span>
            <span style={{ fontSize: "2rem", fontWeight: 700, color: card.color, lineHeight: 1 }}>
              {card.value}
            </span>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "1.25rem",
        width: "100%"
      }}>
        {/* Line Chart Card */}
        <div
          className="stagger-card"
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 1px 2px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.8)",
            flex: "2 1 450px",
            display: "flex",
            flexDirection: "column",
            animationDelay: "0.25s"
          }}
        >
          {/* Chart Header & Legend pills */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              {activeMetricFilter === "LOW_STOCK_ALERTS"
                ? "Current Stock vs Reorder Points (Top 7 Alerts)"
                : `Activity over last 7 days ${dateFilter ? `(ending ${dayLabels[6]})` : ""}`
              }
            </h2>
            <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>
              {activeMetricFilter === "LOW_STOCK_ALERTS" ? (
                <>
                  {siteFilter === "ALL" ? (
                    // Per-site legend when All Sites selected
                    <>
                      {Array.from(new Set(filteredLowStockAlerts.slice(0, 7).map((a: any) => a.siteId))).map((sid: any) => {
                        const site = sitesList.find((s: any) => s.id === sid);
                        const label = site?.name || (sid || "");
                        const lc = label.toLowerCase();
                        const color =
                          lc.includes("skyrise") || lc.includes("4b") ? "#2563eb" :
                          lc.includes("alpha") ? "#16a34a" :
                          lc.includes("beta") ? "#9333ea" :
                          lc.includes("cebu") || lc.includes("it park") ? "#ea580c" :
                          lc.includes("toronto") || lc.includes("hq") ? "#0284c7" :
                          "#ef4444";
                        return (
                          <div key={sid} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "2px", backgroundColor: color }} />
                            <span>{label}</span>
                          </div>
                        );
                      })}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "2px", backgroundColor: "#64748b" }} />
                        <span>Reorder Point</span>
                      </div>
                    </>
                  ) : (
                    // Single site: keep original red / gray
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "2px", backgroundColor: "#ef4444" }} />
                        <span>Current Stock</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "2px", backgroundColor: "#64748b" }} />
                        <span>Reorder Point</span>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  {activeMetricFilter !== "PO_ORDERS" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", backgroundColor: activeMetricFilter === "STOCK_ADJUSTMENTS" ? "#10b981" : "#3b82f6" }} />
                      <span>{activeMetricFilter === "STOCK_ADJUSTMENTS" ? "Stock Adjustments" : "Stock Activity"}</span>
                    </div>
                  )}
                  {activeMetricFilter !== "STOCK_ADJUSTMENTS" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", backgroundColor: "#7c3aed" }} />
                      <span>Purchase Orders</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div style={{ width: "100%", height: "180px", position: "relative" }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="100%" style={{ overflow: "visible" }}>
              <defs>
                <linearGradient id="chartAreaGradientLogs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="chartAreaGradientPOs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {gridValues.map((val, idx) => {
                const y = paddingTop + chartHeight - (val / maxLimit) * chartHeight;
                return (
                  <g key={idx}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={paddingLeft + chartWidth}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1.5"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y}
                      textAnchor="end"
                      fontSize="9"
                      fill="#94a3b8"
                      alignmentBaseline="middle"
                      style={{ fontWeight: 500 }}
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* RENDER DUAL BAR CHART FOR LOW STOCK ALERTS */}
              {activeMetricFilter === "LOW_STOCK_ALERTS" ? (
                filteredLowStockAlerts.slice(0, 7).map((alert: any, idx: number) => {
                  const sectionWidth = chartWidth / 7;
                  const x = paddingLeft + sectionWidth * (idx + 0.5);
                  const currentBarHeight = (alert.quantity / maxLimit) * chartHeight;
                  const currentY = paddingTop + chartHeight - currentBarHeight;
                  const reorderBarHeight = (alert.reorderPoint / maxLimit) * chartHeight;
                  const reorderY = paddingTop + chartHeight - reorderBarHeight;

                  // Site-specific color
                  const matchedSite = sitesList.find((s: any) => s.id === alert.siteId);
                  const siteNameLc = (matchedSite?.name || alert.siteId || "").toLowerCase();
                  const siteColor =
                    siteNameLc.includes("skyrise") || siteNameLc.includes("4b") ? "#2563eb" :
                    siteNameLc.includes("alpha") ? "#16a34a" :
                    siteNameLc.includes("beta") ? "#9333ea" :
                    siteNameLc.includes("cebu") || siteNameLc.includes("it park") ? "#ea580c" :
                    siteNameLc.includes("toronto") || siteNameLc.includes("hq") ? "#0284c7" :
                    "#ef4444";

                  return (
                    <g key={`alert-bar-${idx}`}>
                      {/* Site dot indicator above bars when All Sites */}
                      {siteFilter === "ALL" && (
                        <circle
                          cx={x}
                          cy={Math.min(currentY, reorderY) - 8}
                          r="3"
                          fill={siteColor}
                          opacity="0.9"
                        />
                      )}
                      {/* Current Stock Bar */}
                      <rect
                        x={x - 8}
                        y={currentY}
                        width="6"
                        height={Math.max(currentBarHeight, 2)}
                        fill={siteColor}
                        rx="1.5"
                        className="chart-node"
                        style={{ cursor: "pointer", transition: "all 0.15s ease" }}
                        onMouseEnter={() => setHoveredPoint({
                          x: x - 5,
                          y: currentY,
                          date: alert.name,
                          count: alert.quantity,
                          label: `Current Stock (${alert.sku})${siteFilter === "ALL" ? " — " + (matchedSite?.name || alert.siteId) : ""}`,
                          color: siteColor
                        })}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      {/* Reorder Threshold Bar */}
                      <rect
                        x={x + 2}
                        y={reorderY}
                        width="6"
                        height={Math.max(reorderBarHeight, 2)}
                        fill="#64748b"
                        rx="1.5"
                        className="chart-node"
                        style={{ cursor: "pointer", transition: "all 0.15s ease" }}
                        onMouseEnter={() => setHoveredPoint({
                          x: x + 5,
                          y: reorderY,
                          date: alert.name,
                          count: alert.reorderPoint,
                          label: `Reorder Point (${alert.sku})${siteFilter === "ALL" ? " — " + (matchedSite?.name || alert.siteId) : ""}`,
                          color: "#64748b"
                        })}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    </g>
                  );
                })
              ) : (
                <>
                  {/* RENDER LOGS LINE */}
                  {activeMetricFilter !== "PO_ORDERS" && (
                    <>
                      {areaPathLogs && (
                        <path d={areaPathLogs} fill="url(#chartAreaGradientLogs)" />
                      )}
                      {linePathLogs && (
                        <path
                          d={linePathLogs}
                          fill="none"
                          stroke={activeMetricFilter === "STOCK_ADJUSTMENTS" ? "#10b981" : "#3b82f6"}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                      {pointsLogs.map((p, idx) => (
                        <g key={`log-${idx}`}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="4.5"
                            fill={activeMetricFilter === "STOCK_ADJUSTMENTS" ? "#10b981" : "#3b82f6"}
                            stroke="#ffffff"
                            strokeWidth="2.5"
                            className="chart-node"
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() => setHoveredPoint({
                              x: p.x,
                              y: p.y,
                              date: dayLabels[idx],
                              count: p.count,
                              label: p.label,
                              color: p.color
                            })}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                        </g>
                      ))}
                    </>
                  )}

                  {/* RENDER PO LINE */}
                  {activeMetricFilter !== "STOCK_ADJUSTMENTS" && (
                    <>
                      {areaPathPOs && (
                        <path d={areaPathPOs} fill="url(#chartAreaGradientPOs)" />
                      )}
                      {linePathPOs && (
                        <path
                          d={linePathPOs}
                          fill="none"
                          stroke="#7c3aed"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                      {pointsPOs.map((p, idx) => (
                        <g key={`po-${idx}`}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="4.5"
                            fill="#7c3aed"
                            stroke="#ffffff"
                            strokeWidth="2.5"
                            className="chart-node"
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() => setHoveredPoint({
                              x: p.x,
                              y: p.y,
                              date: dayLabels[idx],
                              count: p.count,
                              label: p.label,
                              color: p.color
                            })}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                        </g>
                      ))}
                    </>
                  )}
                </>
              )}

              {/* X Axis Labels */}
              {activeMetricFilter === "LOW_STOCK_ALERTS" ? (
                filteredLowStockAlerts.slice(0, 7).map((alert: any, idx: number) => {
                  const sectionWidth = chartWidth / 7;
                  const x = paddingLeft + sectionWidth * (idx + 0.5);
                  const matchedSite = sitesList.find((s: any) => s.id === alert.siteId);
                  const siteNameLc = (matchedSite?.name || alert.siteId || "").toLowerCase();
                  const siteColor =
                    siteNameLc.includes("skyrise") || siteNameLc.includes("4b") ? "#2563eb" :
                    siteNameLc.includes("alpha") ? "#16a34a" :
                    siteNameLc.includes("beta") ? "#9333ea" :
                    siteNameLc.includes("cebu") || siteNameLc.includes("it park") ? "#ea580c" :
                    siteNameLc.includes("toronto") || siteNameLc.includes("hq") ? "#0284c7" :
                    "#94a3b8";
                  const shortSiteName = matchedSite?.name
                    ? matchedSite.name.split(" ").slice(0, 2).join(" ")
                    : (alert.siteId || "").slice(0, 6);
                  return (
                    <g key={`sku-label-${idx}`}>
                      <text
                        x={x}
                        y={paddingTop + chartHeight + 14}
                        textAnchor="middle"
                        fontSize="8"
                        fill="#94a3b8"
                        style={{ fontWeight: 600 }}
                      >
                        {alert.sku}
                      </text>
                      {siteFilter === "ALL" && shortSiteName && (
                        <text
                          x={x}
                          y={paddingTop + chartHeight + 25}
                          textAnchor="middle"
                          fontSize="7"
                          fill={siteColor}
                          style={{ fontWeight: 700 }}
                        >
                          {shortSiteName}
                        </text>
                      )}
                    </g>
                  );
                })
              ) : (
                pointsLogs.map((p, idx) => (
                  <text
                    key={idx}
                    x={p.x}
                    y={paddingTop + chartHeight + 16}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill="#94a3b8"
                    style={{ fontWeight: 500 }}
                  >
                    {dayLabels[idx]}
                  </text>
                ))
              )}
            </svg>

            {/* Floating HTML Tooltip */}
            {hoveredPoint && (
              <div style={{
                position: "absolute",
                left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                top: `${(hoveredPoint.y / svgHeight) * 100 - 15}%`,
                transform: "translate(-50%, -100%)",
                backgroundColor: "#0f172a",
                color: "#ffffff",
                padding: "0.4rem 0.75rem",
                borderRadius: "8px",
                fontSize: "0.72rem",
                fontWeight: 600,
                boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.3), 0 8px 10px -6px rgba(15, 23, 42, 0.3)",
                pointerEvents: "none",
                zIndex: 50,
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                alignItems: "center",
                whiteSpace: "nowrap",
                transition: "left 0.12s cubic-bezier(0.23, 1, 0.32, 1), top 0.12s cubic-bezier(0.23, 1, 0.32, 1)"
              }}>
                <span style={{ fontSize: "0.62rem", color: "#94a3b8", fontWeight: 500 }}>{hoveredPoint.date}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: hoveredPoint.color }} />
                  <span>{hoveredPoint.label}: {hoveredPoint.count}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Doughnut Chart Card */}
        <div
          className="stagger-card"
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 1px 2px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.8)",
            flex: "1 1 250px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            animationDelay: "0.3s"
          }}
        >
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1.25rem 0", width: "100%", textAlign: "left" }}>
            {activeMetricFilter === "PO_ORDERS"
              ? "POs by status"
              : activeMetricFilter === "STOCK_ADJUSTMENTS"
                ? "Adjustments by type"
                : activeMetricFilter === "LOW_STOCK_ALERTS"
                  ? "Alerts by status"
                  : "Actions by type (incl. POs)"
            }
          </h2>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "1.5rem", width: "100%" }}>
            <div style={{ position: "relative", width: "110px", height: "110px" }}>
              <svg width="110" height="110" viewBox="0 0 120 120" style={{ transformOrigin: "center" }}>
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r={DOUGHNUT_RADIUS}
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="10"
                />

                {/* Colored Segments */}
                {totalDoughnutCount === 0 ? (
                  <circle
                    cx="60"
                    cy="60"
                    r={DOUGHNUT_RADIUS}
                    fill="transparent"
                    stroke="#e2e8f0"
                    strokeWidth="10"
                  />
                ) : (() => {
                  let cumulativePercent = 0;
                  return doughnutData.map((seg, idx) => {
                    const pct = seg.count / totalDoughnutCount;
                    const strokeDasharray = `${pct * DOUGHNUT_CIRCUMFERENCE} ${DOUGHNUT_CIRCUMFERENCE}`;
                    const strokeDashoffset = -cumulativePercent * DOUGHNUT_CIRCUMFERENCE;
                    cumulativePercent += pct;

                    return (
                      <circle
                        key={idx}
                        cx="60"
                        cy="60"
                        r={DOUGHNUT_RADIUS}
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="10"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        transform="rotate(-90 60 60)"
                        className="doughnut-segment"
                      >
                        <title>{seg.label || seg.status || seg.action}: {seg.count} ({Math.round(pct * 100)}%)</title>
                      </circle>
                    );
                  });
                })()}
              </svg>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", width: "100%" }}>
              {doughnutData.map((seg, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "#475569" }}>
                  <span style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: seg.color,
                    display: "inline-block"
                  }} />
                  <span>{seg.label || seg.status || seg.action} ({seg.count})</span>
                </div>
              ))}
              {doughnutData.length === 0 && (
                <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontStyle: "italic", textAlign: "center" }}>
                  {activeMetricFilter === "LOW_STOCK_ALERTS" ? "No active alerts" : "No actions logged"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Graph: Activity by Category */}
        <div
          className="stagger-card"
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "1.5rem",
            boxShadow: "0 1px 2px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.8)",
            flex: "1 1 250px",
            display: "flex",
            flexDirection: "column",
            animationDelay: "0.35s"
          }}
        >
          <h2 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: "0 0 1.25rem 0" }}>
            {activeMetricFilter === "PO_ORDERS"
              ? "Orders by supplier"
              : activeMetricFilter === "LOW_STOCK_ALERTS"
                ? "Alerts by category"
                : "Activity by category"
            }
          </h2>
          <div style={{ display: "flex", flexDirection: "column", justifySelf: "center", flex: 1, gap: "1rem", width: "100%", justifyContent: "center" }}>
            {activeCategories.map((cat, idx) => {
              const maxVal = Math.max(...activeCategories.map(c => c.count), 1);
              const percent = (cat.count / maxVal) * 100;
              return (
                <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#475569" }}>
                    <span style={{ fontWeight: 600 }}>{cat.name}</span>
                    <span style={{ fontWeight: 500 }}>
                      {cat.count} {activeMetricFilter === "PO_ORDERS" ? "orders" : activeMetricFilter === "LOW_STOCK_ALERTS" ? "alerts" : "actions"}
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "8px", backgroundColor: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{
                      width: `${percent}%`,
                      height: "100%",
                      backgroundColor: idx === 0 ? "#3b82f6" : idx === 1 ? "#10b981" : idx === 2 ? "#f59e0b" : "#6366f1",
                      borderRadius: "4px",
                      transition: "width 1s cubic-bezier(0.25, 1, 0.5, 1)"
                    }} />
                  </div>
                </div>
              );
            })}
            {activeCategories.length === 0 && (
              <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontStyle: "italic", textAlign: "center" }}>
                {activeMetricFilter === "PO_ORDERS"
                  ? "No supplier data"
                  : activeMetricFilter === "LOW_STOCK_ALERTS"
                    ? "No active alerts"
                    : "No category data logged"
                }
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{
        display: "flex",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: "1rem 1.25rem",
        boxShadow: "0 1px 2px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.8)",
        gap: "1rem",
        flexWrap: "wrap",
        width: "100%"
      }}>
        {/* Search bar */}
        <div style={{ position: "relative", flex: "2 1 250px" }}>
          <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder={
              activeMetricFilter === "PO_ORDERS"
                ? "Search supplier, site location..."
                : activeMetricFilter === "LOW_STOCK_ALERTS"
                  ? "Search SKU, item name, category..."
                  : "Search action, details, user, SKU..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-glow"
            style={{
              width: "100%",
              padding: "0.55rem 0.65rem 0.55rem 2.25rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.85rem",
              color: "#1e293b",
              outline: "none",
              backgroundColor: "#ffffff",
            }}
          />
        </div>

        {/* Action Filter (Disabled in PO Orders or Low Stock Alerts mode) */}
        <div style={{ position: "relative", flex: "1 1 140px" }}>
          <select
            value={actionFilter}
            disabled={activeMetricFilter === "PO_ORDERS" || activeMetricFilter === "LOW_STOCK_ALERTS"}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "0.55rem 2.25rem 0.55rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.85rem",
              color: (activeMetricFilter === "PO_ORDERS" || activeMetricFilter === "LOW_STOCK_ALERTS") ? "#94a3b8" : "#334155",
              backgroundColor: (activeMetricFilter === "PO_ORDERS" || activeMetricFilter === "LOW_STOCK_ALERTS") ? "#f8fafc" : "#ffffff",
              outline: "none",
              cursor: (activeMetricFilter === "PO_ORDERS" || activeMetricFilter === "LOW_STOCK_ALERTS") ? "not-allowed" : "pointer",
              appearance: "none",
            }}
          >
            <option value="ALL">All actions</option>
            <option value="ITEM_CREATED">Item created</option>
            <option value="STOCK_ADJUSTED">Stock adjusted</option>
            <option value="ITEM_UPDATED">Item modified</option>
            <option value="ITEM_DELETED">Item deleted</option>
            {activeMetricFilter === "ALL" && (
              <>
                <option value="PO_ORDERS">Purchase orders</option>
                <option value="LOW_STOCK_ALERT">Low stock alerts</option>
              </>
            )}
          </select>
          <svg style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        <div style={{ position: "relative", flex: "1 1 160px", display: "flex", gap: "0.25rem" }}>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "0.55rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.85rem",
              color: "#334155",
              backgroundColor: "#ffffff",
              outline: "none",
              cursor: "pointer",
            }}
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter("")}
              className="btn-hover-effect"
              style={{
                padding: "0.55rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#f1f5f9",
                color: "#475569",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
              title="Clear date filter"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Audit Logs / POs Table */}
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 1px 2px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.8)",
        overflow: "hidden",
      }}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 1rem" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              border: "3px solid rgba(59,130,246,0.15)",
              borderTopColor: "#3b82f6",
              animation: "spin 0.8s linear infinite",
              marginBottom: "1rem"
            }} />
            <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>Loading reports database...</span>
          </div>
        ) : (activeMetricFilter === "LOW_STOCK_ALERTS" ? filteredLowStockAlerts.length === 0 : activeMetricFilter === "PO_ORDERS" ? filteredPOs.length === 0 : filteredLogs.length === 0) ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4.5rem 1rem", textAlign: "center" }}>
            <span style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📜</span>
            <span style={{ fontSize: "0.9rem", color: "#0f172a", fontWeight: 700, marginBottom: "0.25rem" }}>No records found</span>
            <span style={{ fontSize: "0.8rem", color: "#64748b", maxWidth: "320px" }}>
              No items matched your current filters or query in this view.
            </span>
          </div>
        ) : (
          <div key={siteFilter + "_" + dateFilter + "_" + searchQuery + "_" + actionFilter + "_" + activeMetricFilter} className="table-container-fade" style={{ overflowX: "auto", maxHeight: "400px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead style={{ position: "sticky", top: 0, backgroundColor: "#f8fafc", zIndex: 10, boxShadow: "0 1px 0 #e2e8f0" }}>
                {activeMetricFilter === "LOW_STOCK_ALERTS" ? (
                  <tr style={{ backgroundColor: "#f8fafc" }}>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#475569" }}>SKU</th>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#475569" }}>Item Name</th>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#475569" }}>Category</th>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#475569" }}>Site Location</th>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#475569" }}>Current Stock</th>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#475569" }}>Reorder Point</th>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#475569" }}>Status</th>
                  </tr>
                ) : activeMetricFilter === "PO_ORDERS" ? (
                  <tr style={{ backgroundColor: "#f8fafc" }}>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#475569" }}>PO Number</th>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#475569" }}>Supplier</th>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#475569" }}>Site Location</th>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#475569" }}>Total Cost</th>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#475569" }}>Status</th>
                  </tr>
                ) : (
                  <tr style={{ backgroundColor: "#f8fafc" }}>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#475569", width: "150px" }}>Timestamp</th>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#475569", width: "180px" }}>Performed by</th>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#475569", width: "140px" }}>Action</th>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#475569", width: "160px" }}>Item/Supplier</th>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, color: "#475569" }}>Details</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {activeMetricFilter === "LOW_STOCK_ALERTS" ? (
                  filteredLowStockAlerts.map((alert: any, idx: number) => {
                    const matchedSiteObj = sitesList.find((s: any) => s.id === alert.siteId);
                    const siteLabel = matchedSiteObj?.name || alert.siteId || "Unknown";
                    return (
                      <tr key={alert.itemId + "_" + alert.siteId + "_" + idx}
                        className="table-row-hover"
                        style={{
                          borderBottom: idx < filteredLowStockAlerts.length - 1 ? "1px solid #f1f5f9" : "none",
                          backgroundColor: idx % 2 === 1 ? "#fcfdfe" : "#ffffff",
                        }}
                      >
                        <td style={{ padding: "0.9rem 1.25rem", color: "#2563eb", fontWeight: 600 }}>
                          {alert.sku}
                        </td>
                        <td style={{ padding: "0.9rem 1.25rem", color: "#0f172a", fontWeight: 500 }}>
                          {alert.name}
                        </td>
                        <td style={{ padding: "0.9rem 1.25rem", color: "#475569" }}>
                          {alert.category}
                        </td>
                        <td style={{ padding: "0.9rem 1.25rem", color: "#475569" }}>
                          {siteLabel}
                        </td>
                        <td style={{ padding: "0.9rem 1.25rem", color: alert.quantity === 0 ? "#dc2626" : "#d97706", fontWeight: 700 }}>
                          {alert.quantity}
                        </td>
                        <td style={{ padding: "0.9rem 1.25rem", color: "#475569", fontWeight: 500 }}>
                          {alert.reorderPoint}
                        </td>
                        <td style={{ padding: "0.9rem 1.25rem" }}>
                          <span style={{
                            display: "inline-block",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "8px",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            backgroundColor: alert.status === "OUT_OF_STOCK" ? "#fee2e2" : "#fffbeb",
                            color: alert.status === "OUT_OF_STOCK" ? "#dc2626" : "#d97706",
                          }}>
                            {alert.status === "OUT_OF_STOCK" ? "OUT OF STOCK" : "LOW STOCK"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : activeMetricFilter === "PO_ORDERS" ? (
                  filteredPOs.map((po, idx) => (
                    <tr key={po.id || idx}
                      className="table-row-hover"
                      style={{
                        borderBottom: idx < filteredPOs.length - 1 ? "1px solid #f1f5f9" : "none",
                        backgroundColor: idx % 2 === 1 ? "#fcfdfe" : "#ffffff",
                      }}
                    >
                      <td style={{ padding: "0.9rem 1.25rem", color: "#2563eb", fontWeight: 600 }}>
                        {po.id}
                      </td>
                      <td style={{ padding: "0.9rem 1.25rem", color: "#0f172a", fontWeight: 500 }}>
                        {po.supplier?.name || po.supplierName || "Default Supplier"}
                      </td>
                      <td style={{ padding: "0.9rem 1.25rem", color: "#475569" }}>
                        {po.site?.name || po.siteName || po.site || "Cebu IT Park"}
                      </td>
                      <td style={{ padding: "0.9rem 1.25rem", color: "#0f172a", fontWeight: 600 }}>
                        ${Number(po.totalCost || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: "0.9rem 1.25rem" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "8px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          backgroundColor: po.status === "RECEIVED" ? "#d1fae5" : po.status === "ORDERED" ? "#eff6ff" : po.status === "PARTIALLY_RECEIVED" ? "#fffbeb" : po.status === "DRAFT" ? "#f1f5f9" : "#eff6ff",
                          color: po.status === "RECEIVED" ? "#10b981" : po.status === "ORDERED" ? "#3b82f6" : po.status === "PARTIALLY_RECEIVED" ? "#f59e0b" : po.status === "DRAFT" ? "#64748b" : "#3b82f6",
                        }}>
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  filteredLogs.map((log, idx) => (
                    <tr key={log.id || idx}
                      className="table-row-hover"
                      style={{
                        borderBottom: idx < filteredLogs.length - 1 ? "1px solid #f1f5f9" : "none",
                        backgroundColor: idx % 2 === 1 ? "#fcfdfe" : "#ffffff",
                      }}
                    >
                      <td style={{ padding: "0.9rem 1.25rem", color: "#475569", whiteSpace: "nowrap" }}>
                        {formatDate(log.createdAt)}
                      </td>
                      <td style={{ padding: "0.9rem 1.25rem", color: "#0f172a", fontWeight: 600 }}>
                        {log.user?.name || "System"}
                      </td>
                      <td style={{ padding: "0.9rem 1.25rem" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "8px",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          ...getActionBadgeStyle(log.action),
                        }}>
                          {formatActionName(log.action)}
                        </span>
                      </td>
                      <td style={{ padding: "0.9rem 1.25rem" }}>
                        {(() => {
                          const name = log.itemName || log.item?.name;
                          if (name) {
                            return (
                              <span
                                style={{
                                  color: "#2563eb",
                                  fontWeight: 500,
                                  cursor: "pointer",
                                  textDecoration: "none"
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                              >
                                {name}
                              </span>
                            );
                          }
                          return <span style={{ color: "#94a3b8", fontStyle: "italic" }}>None / Generic</span>;
                        })()}
                      </td>
                      <td style={{ padding: "0.9rem 1.25rem", color: "#334155", lineHeight: "1.4", wordBreak: "break-word" }}>
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate General Report Section */}
      <div>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", margin: "1rem 0 1rem 0" }}>
          Generate reports
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.25rem" }}>
          <div
            className="metric-card stagger-card"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "1.75rem",
              boxShadow: "0 1px 2px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.8)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1.25rem",
              textAlign: "center",
              animationDelay: "0.4s"
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "#eff6ff",
              color: "#2563eb",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.35rem 0" }}>
                Generate General Report
              </h3>
              <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0, maxWidth: "480px" }}>
                Downloads a unified, comprehensive CSV report containing the current Inventory Summary, complete Movement History, and all active Low Stock Alerts.
              </p>
            </div>
            <button
              onClick={handleGenerateGeneralReport}
              className="btn-hover-effect"
              style={{
                padding: "0.65rem 2rem",
                borderRadius: "8px",
                border: "1px solid #2563eb",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontSize: "0.88rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.15)"
              }}
            >
              Generate General Report
            </button>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .chart-node {
          transition: transform 0.15s ease, fill 0.15s ease;
          transform-box: fill-box;
          transform-origin: center;
        }
        .chart-node:hover {
          transform: scale(1.35) !important;
        }

        .doughnut-segment {
          transition: stroke-width 0.2s ease, filter 0.2s ease;
          cursor: pointer;
        }
        .doughnut-segment:hover {
          stroke-width: 13.5px !important;
          filter: drop-shadow(0px 0px 4px rgba(16, 185, 129, 0.4));
        }

        /* 3D Folding Unfolding Entrance animation for the table container */
        @keyframes containerEntrance {
          from {
            opacity: 0;
            transform: perspective(1200px) rotateX(-5deg) translateY(12px);
          }
          to {
            opacity: 1;
            transform: perspective(1200px) rotateX(0deg) translateY(0);
          }
        }
        .table-container-fade {
          transform-origin: top center;
          animation: containerEntrance 0.48s cubic-bezier(0.23, 1, 0.32, 1) both;
        }

        /* Premium sliding lift row hover effect */
        .table-row-hover {
          transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1),
                      box-shadow 0.2s cubic-bezier(0.25, 1, 0.5, 1),
                      background-color 0.2s ease !important;
          position: relative;
        }
        .table-row-hover:hover {
          background-color: #f8fafc !important;
          background: #f8fafc !important;
          transform: translateY(-2px) scale(1.004);
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05), 0 0 0 1px rgba(77, 201, 230, 0.18) !important;
          z-index: 5;
        }

        /* Generate buttons effects */
        .btn-hover-effect {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-hover-effect:hover {
          background-color: #2563eb !important;
          color: #ffffff !important;
          border-color: #2563eb !important;
          transform: translateY(-1.5px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.22);
        }
        .btn-hover-effect:active {
          transform: translateY(0);
        }
      `}} />
    </div>
  );
};
