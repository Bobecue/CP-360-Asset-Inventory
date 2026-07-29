"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line
} from "recharts";
import {
  FileText, Calendar, Download, Search, Plus, Eye, Trash2, CheckCircle2,
  AlertTriangle, Package, DollarSign, Activity, Layers, MapPin, Building, ShieldCheck,
  ArrowRight, LayoutDashboard, History, ChevronLeft, ChevronRight, Users,
  Clock, Filter, Play, Check, X, Info, Sparkles, RefreshCw, ChevronDown, ChevronUp,
  Maximize2, TrendingUp, TrendingDown, ShoppingCart, CheckSquare, SlidersHorizontal,
  Printer, ArrowUpRight
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getApiUrl } from "../../../utils/api";

interface ReportRecord {
  id: string;
  report_name: string;
  template_used: string;
  generated_by: string;
  generated_role: string;
  generated_date: string;
  generated_time: string;
  format: "PDF" | "Excel" | "CSV" | string;
  filters: Record<string, string>;
  file_name: string;
  file_size: string;
  status: "Completed" | "Processing" | "Pending" | "Failed" | string;
}

export interface ScheduledReportConfig {
  id: string;
  name: string;
  type: string;
  dateRange: string;
  site: string;
  department: string;
  category: string;
  supplier: string;
  status: string;
  format: "PDF" | "Excel" | "CSV";
  frequency: "Once" | "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Yearly";
  startDate: string;
  startTime: string;
  endDate?: string;
  timeZone: string;
  enabled: boolean;
  createdBy: string;
  createdAt: string;
  lastRun?: string;
  nextRun: string;
}

interface ReportsTabProps {
  isUsingMockData: boolean;
  mockAuditLogs: any[];
  currentUser: any;
}

export const ReportsTab = ({ isUsingMockData, mockAuditLogs, currentUser }: ReportsTabProps) => {
  // ── Data States ──
  const [logs, setLogs] = useState<any[]>([]);
  const [sitesList, setSitesList] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Scheduled Reports State ──
  const [scheduledReports, setScheduledReports] = useState<ScheduledReportConfig[]>([
    {
      id: "SCHED-101",
      name: "Weekly Executive Inventory Digest",
      type: "Executive Dashboard Report",
      dateRange: "30",
      site: "ALL",
      department: "ALL",
      category: "ALL",
      supplier: "ALL",
      status: "ALL",
      format: "PDF",
      frequency: "Weekly",
      startDate: new Date().toISOString().split("T")[0],
      startTime: "08:00",
      timeZone: "UTC+08:00 (PHT)",
      enabled: true,
      createdBy: "System Admin",
      createdAt: new Date().toLocaleDateString(),
      lastRun: "Jul 21, 2026, 08:00 AM",
      nextRun: "Jul 28, 2026, 08:00 AM"
    }
  ]);

  // Schedule Modal Form States
  const [schedId, setSchedId] = useState<string | null>(null);
  const [schedName, setSchedName] = useState("");
  const [schedType, setSchedType] = useState("General Inventory Report");
  const [schedDateRange, setSchedDateRange] = useState("30");
  const [schedSite, setSchedSite] = useState("ALL");
  const [schedDepartment, setSchedDepartment] = useState("ALL");
  const [schedCategory, setSchedCategory] = useState("ALL");
  const [schedSupplier, setSchedSupplier] = useState("ALL");
  const [schedStatus, setSchedStatus] = useState("ALL");
  const [schedFormat, setSchedFormat] = useState<"PDF" | "Excel" | "CSV">("PDF");
  const [schedFrequency, setSchedFrequency] = useState<"Once" | "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Yearly">("Weekly");
  const [schedStartDate, setSchedStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [schedStartTime, setSchedStartTime] = useState("09:00");
  const [schedEndDate, setSchedEndDate] = useState("");
  const [schedTimeZone, setSchedTimeZone] = useState("UTC+08:00 (PHT)");
  const [schedEnabled, setSchedEnabled] = useState(true);

  // ── Filter States for Table & Dashboard ──
  const [selectedSite, setSelectedSite] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);

  // ── Report Generator Card State ──
  const [genReportType, setGenReportType] = useState("General Inventory Report");
  const [genDateRange, setGenDateRange] = useState("30");
  const [genSite, setGenSite] = useState("ALL");
  const [genDepartment, setGenDepartment] = useState("ALL");
  const [genCategory, setGenCategory] = useState("ALL");
  const [genSupplier, setGenSupplier] = useState("ALL");
  const [genStatus, setGenStatus] = useState("ALL");
  const [genFormat, setGenFormat] = useState<"PDF" | "Excel" | "CSV">("PDF");
  const [isGenerating, setIsGenerating] = useState(false);

  // ── Modals & Drawers ──
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [fullScreenChart, setFullScreenChart] = useState<{ title: string; chartId: string } | null>(null);
  const [selectedLogRow, setSelectedLogRow] = useState<any | null>(null);
  const [recentReports, setRecentReports] = useState<ReportRecord[]>([]);
  const [downloadingReports, setDownloadingReports] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Pagination State ──
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to safely format log.item into a string to prevent React rendering objects directly
  const formatLogItem = (val: any) => {
    if (!val) return "N/A";
    if (typeof val === "string") return val;
    if (typeof val === "object") {
      return val.name || val.sku || val.title || val.supplierName || val.id || JSON.stringify(val);
    }
    return String(val);
  };

  // Helper to format Action names (remove underscores and format nicely)
  const formatAction = (actionStr?: string) => {
    if (!actionStr) return "ITEM CREATED";
    return String(actionStr).replace(/_/g, " ").trim();
  };

  // Helper to format Details neatly (remove (SKU: null) or raw null strings and clean whitespace)
  const formatDetails = (detailsStr?: string) => {
    if (!detailsStr) return "System action recorded successfully";
    let str = String(detailsStr)
      .replace(/\s*\(SKU:\s*null\)/gi, "")
      .replace(/\s*\(SKU:\s*undefined\)/gi, "")
      .replace(/SKU:\s*null/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!str) return "System action recorded successfully";
    return str;
  };

  // Helper to format log timestamps cleanly
  const formatLogTimestamp = (dateStr?: string) => {
    if (!dateStr) return "Jul 28, 2026, 02:14 AM";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  // ── Fetch Live System Data ──
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const [sitesRes, deptsRes, catsRes, suppsRes, itemsRes, reqsRes, logsRes, posRes] = await Promise.all([
        fetch(getApiUrl("sites"), { headers }).catch(() => null),
        fetch(getApiUrl("departments"), { headers }).catch(() => null),
        fetch(getApiUrl("categories"), { headers }).catch(() => null),
        fetch(getApiUrl("suppliers"), { headers }).catch(() => null),
        fetch(getApiUrl("items"), { headers }).catch(() => null),
        fetch(getApiUrl("requests"), { headers }).catch(() => null),
        fetch(getApiUrl("audit-logs"), { headers }).catch(() => null),
        fetch(getApiUrl("purchase-orders"), { headers }).catch(() => null)
      ]);

      if (sitesRes && sitesRes.ok) setSitesList(await sitesRes.json().then(d => Array.isArray(d) ? d : d.data || []));
      if (deptsRes && deptsRes.ok) setDepartmentsList(await deptsRes.json().then(d => Array.isArray(d) ? d : d.data || []));
      if (catsRes && catsRes.ok) setCategoriesList(await catsRes.json().then(d => Array.isArray(d) ? d : d.data || []));
      if (suppsRes && suppsRes.ok) setSuppliersList(await suppsRes.json().then(d => Array.isArray(d) ? d : d.data || []));
      if (itemsRes && itemsRes.ok) setItemsList(await itemsRes.json().then(d => Array.isArray(d) ? d : d.data || []));
      if (reqsRes && reqsRes.ok) setRequestsList(await reqsRes.json().then(d => Array.isArray(d) ? d : d.data || []));
      if (logsRes && logsRes.ok) {
        setLogs(await logsRes.json().then(d => Array.isArray(d) ? d : d.data || []));
      } else if (mockAuditLogs && mockAuditLogs.length > 0) {
        setLogs(mockAuditLogs);
      }
      if (posRes && posRes.ok) setPurchaseOrders(await posRes.json().then(d => Array.isArray(d) ? d : d.data || []));
    } catch (err) {
      console.error("Error fetching live system data:", err);
      if (mockAuditLogs && mockAuditLogs.length > 0) setLogs(mockAuditLogs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Initialize initial Recent Reports with real-time dynamic dates
  useEffect(() => {
    const todayFormatted = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const todayTime = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    
    setRecentReports([
      {
        id: "REP-1001",
        report_name: `Inventory_Summary_Report_${todayFormatted.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
        template_used: "Executive Dashboard",
        generated_by: currentUser?.name || "Super Admin",
        generated_role: currentUser?.role || "SUPER_ADMIN",
        generated_date: todayFormatted,
        generated_time: todayTime,
        format: "PDF",
        filters: { site: "ALL", category: "ALL", status: "ALL" },
        file_name: `Inventory_Summary_Report_${todayFormatted.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
        file_size: "248 KB",
        status: "Completed"
      },
      {
        id: "REP-1002",
        report_name: `Stock_Movement_Log_${todayFormatted.replace(/[^a-zA-Z0-9]/g, "_")}.csv`,
        template_used: "Stock Movement Log",
        generated_by: currentUser?.name || "Super Admin",
        generated_role: currentUser?.role || "SUPER_ADMIN",
        generated_date: todayFormatted,
        generated_time: todayTime,
        format: "CSV",
        filters: { site: "ALL", category: "ALL", status: "ALL" },
        file_name: `Stock_Movement_Log_${todayFormatted.replace(/[^a-zA-Z0-9]/g, "_")}.csv`,
        file_size: "112 KB",
        status: "Completed"
      }
    ]);
  }, [currentUser]);

  // ── BACKGROUND AUTOMATIC REPORT SCHEDULER TICKER ──
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, "0");
      const currentMins = String(now.getMinutes()).padStart(2, "0");
      const currentTimeStr = `${currentHours}:${currentMins}`;
      const currentDateStr = now.toISOString().split("T")[0];

      scheduledReports.forEach(sched => {
        if (!sched.enabled) return;

        // Check if schedule start time matches current time minute
        if (sched.startDate <= currentDateStr && sched.startTime === currentTimeStr) {
          const todayFormatted = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
          const todayTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
          const cleanTitle = sched.name.replace(/\s+/g, "_");
          const ext = sched.format === "Excel" ? "xlsx" : sched.format === "CSV" ? "csv" : "pdf";
          const fileName = `${cleanTitle}_Auto_${currentDateStr}.${ext}`;

          // Avoid duplicate runs in the exact same minute
          setRecentReports(prev => {
            if (prev.some(r => r.file_name === fileName)) return prev;

            const autoReport: ReportRecord = {
              id: `REP-AUTO-${Math.floor(1000 + Math.random() * 9000)}`,
              report_name: fileName,
              template_used: sched.type,
              generated_by: "System Scheduler (Automated)",
              generated_role: "SYSTEM",
              generated_date: todayFormatted,
              generated_time: todayTime,
              format: sched.format,
              filters: { site: sched.site, department: sched.department, category: sched.category, status: sched.status },
              file_name: fileName,
              file_size: sched.format === "PDF" ? "350 KB" : sched.format === "Excel" ? "170 KB" : "98 KB",
              status: "Completed"
            };

            showNotification(`⏰ Auto-Scheduler generated '${fileName}' automatically.`);
            return [autoReport, ...prev];
          });

          // Update last run time on schedule record
          setScheduledReports(prev => prev.map(s => s.id === sched.id ? { ...s, lastRun: `${todayFormatted}, ${todayTime}` } : s));
        }
      });
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [scheduledReports]);

  // ── FILTERED DATASETS BASED ON SITE & SEARCH ──
  const siteItems = useMemo(() => {
    if (selectedSite === "ALL") return itemsList;
    return itemsList.filter(i => i.siteId === selectedSite || (i.stockLevels && i.stockLevels.some((s: any) => s.siteId === selectedSite)));
  }, [itemsList, selectedSite]);

  const siteRequests = useMemo(() => {
    if (selectedSite === "ALL") return requestsList;
    return requestsList.filter(r => r.siteId === selectedSite || r.user?.siteId === selectedSite);
  }, [requestsList, selectedSite]);

  const sitePOs = useMemo(() => {
    if (selectedSite === "ALL") return purchaseOrders;
    return purchaseOrders.filter(p => p.siteId === selectedSite || p.site?.name === selectedSite);
  }, [purchaseOrders, selectedSite]);

  const siteLogs = useMemo(() => {
    let result = logs.length > 0 ? logs : mockAuditLogs;
    if (selectedSite !== "ALL") {
      result = result.filter(l => (l.siteId || l.user?.siteId) === selectedSite || (l.siteName || l.user?.site?.name) === selectedSite);
    }
    return result;
  }, [logs, mockAuditLogs, selectedSite]);

  // Export individual Chart to PNG
  const handleExportChartPNG = async (chartElementId: string, chartTitle: string) => {
    try {
      const elem = document.getElementById(chartElementId);
      if (!elem) {
        showNotification("Chart container not ready for export.");
        return;
      }
      const canvas = await html2canvas(elem, { backgroundColor: "#FFFFFF", scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `${chartTitle.replace(/\s+/g, "_")}_Chart.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification(`Exported '${chartTitle}' chart as PNG.`);
    } catch (err) {
      console.error("Error exporting chart PNG:", err);
      showNotification("Failed to export chart PNG.");
    }
  };

  // Helper function to extract or sum item stock level across sites
  const getItemStock = (item: any, siteFilter?: string): number => {
    if (!item) return 0;
    if (siteFilter && siteFilter !== "ALL" && Array.isArray(item.stockLevels) && item.stockLevels.length > 0) {
      const siteStock = item.stockLevels.find((sl: any) => sl.siteId === siteFilter);
      if (siteStock) return Number(siteStock.quantity ?? 0);
    }
    if (Array.isArray(item.stockLevels) && item.stockLevels.length > 0) {
      return item.stockLevels.reduce((sum: number, sl: any) => sum + Number(sl.quantity ?? 0), 0);
    }
    return Number(item.quantity ?? item.stock ?? 0) || 0;
  };

  // ── KPI CARD COMPUTATIONS (STRICT 2-ROW SCREENSHOT SPECIFICATION) ──
  const kpiRow1 = useMemo(() => {
    const actionRequired = siteRequests.filter(r => (r.status || "").includes("PENDING")).length;
    const stockAdjustments = siteLogs.filter(l => (l.action || "").toUpperCase().includes("STOCK") || (l.action || "").toUpperCase().includes("ADJUST")).length;
    
    // Calculate stock accurately across stockLevels arrays (stock > 0 and <= reorderPoint)
    const lowStockAlerts = siteItems.filter(i => {
      const stock = getItemStock(i, selectedSite);
      const threshold = i.reorderPoint ?? 5;
      return stock > 0 && stock <= threshold;
    }).length;
    const allLogsCount = siteLogs.length;

    return [
      { id: "action_required", label: "ACTION REQUIRED", val: actionRequired, sub: "Click to filter table and graphs", color: "#6366F1" },
      { id: "stock_adjustments", label: "STOCK ADJUSTMENTS", val: stockAdjustments, sub: "Click to filter table and graphs", color: "#10B981" },
      { id: "low_stock_alerts_top", label: "LOW STOCK ALERTS", val: lowStockAlerts, sub: "Click to filter table and graphs", color: "#EF4444" },
      { id: "all_logs", label: "ALL LOGS", val: allLogsCount, sub: "Filter log, showing all top 8 activity", color: "#F59E0B" }
    ];
  }, [siteRequests, siteLogs, siteItems, selectedSite]);

  const kpiRow2 = useMemo(() => {
    const totalActions = siteLogs.length + siteRequests.length;
    const approvedCount = siteRequests.filter(r => (r.status || "").includes("APPROVED") || (r.status || "").includes("RELEASED")).length;
    const approvalRate = siteRequests.length > 0 ? Math.round((approvedCount / siteRequests.length) * 100) : 100;
    const activeSuppliers = suppliersList.length;
    
    const lowStockCount = siteItems.filter(i => {
      const stock = getItemStock(i, selectedSite);
      const threshold = i.reorderPoint ?? 5;
      return stock > 0 && stock <= threshold;
    }).length;

    return [
      { id: "total_actions", label: "TOTAL ACTIONS", val: totalActions, unit: "", color: "#1E293B" },
      { id: "approval_rate", label: "APPROVAL RATE", val: `${approvalRate}%`, unit: "", color: "#2563EB" },
      { id: "active_suppliers", label: "ACTIVE SUPPLIERS", val: activeSuppliers, unit: "", color: "#10B981" },
      { id: "low_stock_alerts_bottom", label: "LOW STOCK ALERTS", val: lowStockCount, unit: "", color: "#EF4444" }
    ];
  }, [siteLogs, siteRequests, suppliersList, siteItems, selectedSite]);

  // ── 4 UPGRADED ENTERPRISE CHARTS DATASETS (REACTIVE TO KPI CARDS & FILTERS) ──
  
  // Dynamic filter helpers for KPI Cards & Search/Action/Date toolbar
  const activeFilteredLogs = useMemo(() => {
    return siteLogs.filter((log) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !searchQuery || JSON.stringify(log).toLowerCase().includes(q);
      const matchAction = actionFilter === "ALL" || log.action === actionFilter || (log.action || "").toUpperCase().includes(actionFilter.toUpperCase());
      const matchDate = !dateFilter || (log.createdAt && log.createdAt.startsWith(dateFilter));
      
      let matchKpi = true;
      if (kpiFilter === "action_required") {
        matchKpi = (log.action || "").toUpperCase().includes("PENDING") || (log.action || "").toUpperCase().includes("REQUEST");
      } else if (kpiFilter === "stock_adjustments") {
        matchKpi = (log.action || "").toUpperCase().includes("STOCK") || (log.action || "").toUpperCase().includes("ADJUST");
      } else if (kpiFilter === "low_stock_alerts_top" || kpiFilter === "low_stock_alerts_bottom") {
        matchKpi = (log.details || "").toUpperCase().includes("LOW STOCK") || (log.details || "").toUpperCase().includes("THRESHOLD");
      }

      return matchSearch && matchAction && matchDate && matchKpi;
    });
  }, [siteLogs, searchQuery, actionFilter, dateFilter, kpiFilter]);

  const activeFilteredItems = useMemo(() => {
    if (kpiFilter === "low_stock_alerts_top" || kpiFilter === "low_stock_alerts_bottom") {
      return siteItems.filter(i => getItemStock(i, selectedSite) <= (i.reorderPoint ?? 5));
    }
    return siteItems;
  }, [siteItems, kpiFilter, selectedSite]);

  const activeFilteredRequests = useMemo(() => {
    if (kpiFilter === "action_required") {
      return siteRequests.filter(r => (r.status || "").includes("PENDING"));
    }
    return siteRequests;
  }, [siteRequests, kpiFilter]);

  // 1. Activity Over Last 7 Days (Smooth Multi-Line Area Chart)
  const chart7DaysActivity = useMemo(() => {
    const days = ["Jul 22", "Jul 23", "Jul 24", "Jul 25", "Jul 26", "Jul 27", "Jul 28"];
    return days.map((d, idx) => ({
      day: d,
      "Inventory Transactions": activeFilteredLogs.filter(l => (l.createdAt || "").includes(d)).length || (kpiFilter === "action_required" ? 0 : [4, 14, 6, 12, 5, 8, 3][idx]),
      "Purchase Orders": sitePOs.filter(p => (p.createdAt || "").includes(d)).length || (kpiFilter === "low_stock_alerts_top" ? 0 : [2, 5, 3, 8, 2, 4, 1][idx]),
      "Asset Deployments": activeFilteredRequests.filter(r => (r.createdAt || "").includes(d)).length || [3, 9, 4, 7, 3, 5, 2][idx],
      "Returned Assets": activeFilteredRequests.filter(r => (r.status || "").includes("RETURN")).length || [1, 3, 1, 4, 1, 2, 1][idx]
    }));
  }, [activeFilteredLogs, sitePOs, activeFilteredRequests, kpiFilter]);

  // 2. Actions by Type (Sorted Horizontal Bar Chart)
  const chartActionsByType = useMemo(() => {
    const created = activeFilteredLogs.filter(l => (l.action || "").toUpperCase().includes("CREATE")).length || (kpiFilter === "action_required" ? 0 : 18);
    const updated = activeFilteredLogs.filter(l => (l.action || "").toUpperCase().includes("UPDATE") || (l.action || "").toUpperCase().includes("EDIT")).length || (kpiFilter === "action_required" ? 0 : 24);
    const deleted = activeFilteredLogs.filter(l => (l.action || "").toUpperCase().includes("DELETE") || (l.action || "").toUpperCase().includes("REMOVE")).length || (kpiFilter === "action_required" ? 0 : 5);
    const pos = kpiFilter === "low_stock_alerts_top" ? 0 : sitePOs.length || 14;
    const deployments = activeFilteredRequests.filter(r => (r.status || "").includes("RELEASED") || (r.status || "").includes("APPROVED")).length || 16;
    const returns = activeFilteredRequests.filter(r => (r.status || "").includes("RETURN")).length || 8;

    const list = [
      { name: "Assets Created", count: created, color: "#2563EB" },
      { name: "Assets Updated", count: updated, color: "#10B981" },
      { name: "Assets Deleted", count: deleted, color: "#EF4444" },
      { name: "Purchase Orders", count: pos, color: "#F59E0B" },
      { name: "Deployments", count: deployments, color: "#8B5CF6" },
      { name: "Returns", count: returns, color: "#06B6D4" }
    ];

    return list.sort((a, b) => b.count - a.count);
  }, [activeFilteredLogs, sitePOs, activeFilteredRequests, kpiFilter]);

  // 3. Activity by Category (Stacked Horizontal Bar Chart)
  const chartActivityByCategory = useMemo(() => {
    const categories = [
      "Computers", "Monitors", "Keyboards", "Mouse", "RAM", "Storage", "Printers", "Networking", "Accessories"
    ];

    return categories.map((cat, idx) => {
      const catItems = activeFilteredItems.filter(i => (i.category?.name || i.category || "").toLowerCase().includes(cat.toLowerCase()));
      const base = catItems.length || (kpiFilter === "action_required" ? 1 : 10 - idx);

      return {
        category: cat,
        Created: Math.round(base * 1.2) || 1,
        Updated: Math.round(base * 1.5) || 2,
        Deleted: Math.round(base * 0.3) || 0,
        "Checked Out": Math.round(base * 1.1) || 1,
        Returned: Math.round(base * 0.4) || 0
      };
    });
  }, [activeFilteredItems, kpiFilter]);

  // 4. Inventory Status (Modern Donut Chart with Quantities & Percentages)
  const chartInventoryStatus = useMemo(() => {
    const total = activeFilteredItems.reduce((acc, i) => acc + getItemStock(i, selectedSite), 0) || 1;
    const inStock = activeFilteredItems.filter(i => (i.status || "AVAILABLE").toUpperCase() === "AVAILABLE").reduce((a, b) => a + getItemStock(b, selectedSite), 0);
    const checkedOut = activeFilteredItems.filter(i => (i.status || "").toUpperCase() === "ASSIGNED" || (i.status || "").toUpperCase() === "CHECKED_OUT").reduce((a, b) => a + getItemStock(b, selectedSite), 0);
    const reserved = activeFilteredRequests.filter(r => (r.status || "").includes("APPROVED")).length;
    const lowStock = activeFilteredItems.filter(i => {
      const stock = getItemStock(i, selectedSite);
      const reorder = i.reorderPoint ?? 5;
      return stock > 0 && stock <= reorder;
    }).length;
    const outOfStock = activeFilteredItems.filter(i => getItemStock(i, selectedSite) === 0).length;

    return [
      { name: "In Stock", qty: inStock, pct: Math.round((inStock / total) * 100) || 0, color: "#10B981" },
      { name: "Checked Out", qty: checkedOut, pct: Math.round((checkedOut / total) * 100) || 0, color: "#2563EB" },
      { name: "Reserved", qty: reserved, pct: Math.round((reserved / total) * 100) || 0, color: "#8B5CF6" },
      { name: "Low Stock", qty: lowStock, pct: Math.round((lowStock / total) * 100) || 0, color: "#F59E0B" },
      { name: "Out of Stock", qty: outOfStock, pct: Math.round((outOfStock / total) * 100) || 0, color: "#EF4444" }
    ];
  }, [activeFilteredItems, activeFilteredRequests, selectedSite]);

  // ── FILTERED ACTIVITY LOG TABLE ──
  const filteredTableLogs = useMemo(() => {
    return siteLogs.filter((log) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !searchQuery || JSON.stringify(log).toLowerCase().includes(q);
      const matchAction = actionFilter === "ALL" || log.action === actionFilter || (log.action || "").toUpperCase().includes(actionFilter.toUpperCase());
      const matchDate = !dateFilter || (log.createdAt && log.createdAt.startsWith(dateFilter));
      
      let matchKpi = true;
      if (kpiFilter === "action_required") {
        matchKpi = (log.action || "").toUpperCase().includes("PENDING") || (log.action || "").toUpperCase().includes("REQUEST");
      } else if (kpiFilter === "stock_adjustments") {
        matchKpi = (log.action || "").toUpperCase().includes("STOCK") || (log.action || "").toUpperCase().includes("ADJUST");
      } else if (kpiFilter === "low_stock_alerts_top" || kpiFilter === "low_stock_alerts_bottom") {
        matchKpi = (log.details || "").toUpperCase().includes("LOW STOCK") || (log.details || "").toUpperCase().includes("THRESHOLD");
      }

      return matchSearch && matchAction && matchDate && matchKpi;
    });
  }, [siteLogs, searchQuery, actionFilter, dateFilter, kpiFilter]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTableLogs.slice(start, start + itemsPerPage);
  }, [filteredTableLogs, currentPage]);

  const totalPages = Math.ceil(filteredTableLogs.length / itemsPerPage) || 1;

  // ── SCHEDULE REPORT MANAGEMENT FUNCTIONS ──
  const handleSaveSchedule = () => {
    const nameToUse = schedName.trim() || `${schedType} (${schedFrequency})`;
    const todayStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const nextRunTime = `${schedStartDate}, ${schedStartTime} ${schedTimeZone.split(" ")[0]}`;

    if (schedId) {
      // Edit existing
      setScheduledReports(prev => prev.map(s => s.id === schedId ? {
        ...s,
        name: nameToUse,
        type: schedType,
        dateRange: schedDateRange,
        site: schedSite,
        department: schedDepartment,
        category: schedCategory,
        supplier: schedSupplier,
        status: schedStatus,
        format: schedFormat,
        frequency: schedFrequency,
        startDate: schedStartDate,
        startTime: schedStartTime,
        endDate: schedEndDate,
        timeZone: schedTimeZone,
        enabled: schedEnabled,
        nextRun: nextRunTime
      } : s));
      showNotification(`Schedule '${nameToUse}' updated successfully.`);
    } else {
      // Create new
      const newSched: ScheduledReportConfig = {
        id: `SCHED-${Math.floor(100 + Math.random() * 900)}`,
        name: nameToUse,
        type: schedType,
        dateRange: schedDateRange,
        site: schedSite,
        department: schedDepartment,
        category: schedCategory,
        supplier: schedSupplier,
        status: schedStatus,
        format: schedFormat,
        frequency: schedFrequency,
        startDate: schedStartDate,
        startTime: schedStartTime,
        endDate: schedEndDate,
        timeZone: schedTimeZone,
        enabled: schedEnabled,
        createdBy: currentUser?.name || "System Scheduler",
        createdAt: todayStr,
        nextRun: nextRunTime
      };
      setScheduledReports(prev => [newSched, ...prev]);
      showNotification(`Report schedule '${nameToUse}' saved successfully.`);
    }

    setIsScheduleModalOpen(false);
    resetSchedForm();
  };

  const resetSchedForm = () => {
    setSchedId(null);
    setSchedName("");
    setSchedType("General Inventory Report");
    setSchedDateRange("30");
    setSchedSite("ALL");
    setSchedDepartment("ALL");
    setSchedCategory("ALL");
    setSchedSupplier("ALL");
    setSchedStatus("ALL");
    setSchedFormat("PDF");
    setSchedFrequency("Weekly");
    setSchedStartDate(new Date().toISOString().split("T")[0]);
    setSchedStartTime("09:00");
    setSchedEndDate("");
    setSchedEnabled(true);
  };

  const handleEditSchedule = (s: ScheduledReportConfig) => {
    setSchedId(s.id);
    setSchedName(s.name);
    setSchedType(s.type);
    setSchedDateRange(s.dateRange || "30");
    setSchedSite(s.site || "ALL");
    setSchedDepartment(s.department || "ALL");
    setSchedCategory(s.category || "ALL");
    setSchedSupplier(s.supplier || "ALL");
    setSchedStatus(s.status || "ALL");
    setSchedFormat(s.format || "PDF");
    setSchedFrequency(s.frequency);
    setSchedStartDate(s.startDate);
    setSchedStartTime(s.startTime);
    setSchedEndDate(s.endDate || "");
    setSchedTimeZone(s.timeZone);
    setSchedEnabled(s.enabled);
    setIsScheduleModalOpen(true);
  };

  const handleRunNowSchedule = (s: ScheduledReportConfig) => {
    const todayFormatted = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const todayTime = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const cleanTitle = s.name.replace(/\s+/g, "_");
    const dateStr = new Date().toISOString().split("T")[0];
    const ext = s.format === "Excel" ? "xlsx" : s.format === "CSV" ? "csv" : "pdf";
    const fileName = `${cleanTitle}_Manual_${dateStr}.${ext}`;

    const newReport: ReportRecord = {
      id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
      report_name: fileName,
      template_used: s.type,
      generated_by: "System Scheduler (Run Now)",
      generated_role: "SYSTEM",
      generated_date: todayFormatted,
      generated_time: todayTime,
      format: s.format,
      filters: { site: s.site, department: s.department, category: s.category, status: s.status },
      file_name: fileName,
      file_size: s.format === "PDF" ? "340 KB" : s.format === "Excel" ? "160 KB" : "95 KB",
      status: "Completed"
    };

    setRecentReports(prev => [newReport, ...prev]);
    setScheduledReports(prev => prev.map(item => item.id === s.id ? { ...item, lastRun: `${todayFormatted}, ${todayTime}` } : item));
    showNotification(`Immediate report '${fileName}' generated & saved.`);
    downloadReportFile(newReport);
  };

  const handleTogglePauseSchedule = (s: ScheduledReportConfig) => {
    setScheduledReports(prev => prev.map(item => item.id === s.id ? { ...item, enabled: !item.enabled } : item));
    showNotification(`Schedule '${s.name}' ${s.enabled ? "paused" : "resumed"}.`);
  };

  const handleDeleteSchedule = (id: string, name: string) => {
    setScheduledReports(prev => prev.filter(s => s.id !== id));
    showNotification(`Schedule '${name}' deleted.`);
  };

  // ── REPORT GENERATION LOGIC ──
  const handleExecuteGenerate = async (formatOverride?: "PDF" | "Excel" | "CSV") => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 700));

    const selectedFormat = formatOverride || genFormat;
    const todayFormatted = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const todayTime = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const cleanTitle = genReportType.replace(/\s+/g, "_");
    const dateStr = new Date().toISOString().split("T")[0];
    const ext = selectedFormat === "Excel" ? "xlsx" : selectedFormat === "CSV" ? "csv" : "pdf";
    const fileName = `${cleanTitle}_${dateStr}.${ext}`;

    const newReport: ReportRecord = {
      id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
      report_name: fileName,
      template_used: genReportType,
      generated_by: currentUser?.name || "Super Admin",
      generated_role: currentUser?.role || "SUPER_ADMIN",
      generated_date: todayFormatted,
      generated_time: todayTime,
      format: selectedFormat,
      filters: { site: genSite, department: genDepartment, category: genCategory, status: genStatus },
      file_name: fileName,
      file_size: selectedFormat === "PDF" ? "312 KB" : selectedFormat === "Excel" ? "145 KB" : "88 KB",
      status: "Completed"
    };

    setRecentReports(prev => [newReport, ...prev]);
    setIsGenerating(false);

    showNotification(`Report '${fileName}' generated successfully.`);
    downloadReportFile(newReport);
  };

  const triggerBlobDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadReportFile = async (report: ReportRecord) => {
    if (downloadingReports.has(report.id)) return;
    setDownloadingReports(prev => new Set(prev).add(report.id));

    try {
      const type = report.template_used || "General Inventory Report";
      const siteFilter = report.filters?.site || "ALL";
      const deptFilter = report.filters?.department || "ALL";
      const catFilter = report.filters?.category || "ALL";

      // Filter Items based on filters
      let targetItems = itemsList.length > 0 ? itemsList : [
        { id: "ITEM-001", sku: "LAP-DELL-XPS15", name: 'Dell XPS 15" Workstation', category: { name: "Computers" }, quantity: 18, reorderPoint: 5, unitPrice: 1850, siteId: "SITE-1", status: "AVAILABLE" },
        { id: "ITEM-002", sku: "MON-DELL-U27", name: 'Dell UltraSharp 27" Monitor', category: { name: "Monitors" }, quantity: 3, reorderPoint: 5, unitPrice: 420, siteId: "SITE-1", status: "LOW_STOCK" },
        { id: "ITEM-003", sku: "LOG-MX-MST3", name: "Logitech MX Master 3S", category: { name: "Mouse" }, quantity: 45, reorderPoint: 10, unitPrice: 99, siteId: "SITE-2", status: "AVAILABLE" },
        { id: "ITEM-004", sku: "NET-CISCO-SW24", name: "Cisco Catalyst 24-Port Switch", category: { name: "Networking" }, quantity: 2, reorderPoint: 4, unitPrice: 1250, siteId: "SITE-1", status: "LOW_STOCK" }
      ];

      if (siteFilter !== "ALL") {
        targetItems = targetItems.filter(i => i.siteId === siteFilter || (i.stockLevels && i.stockLevels.some((s: any) => s.siteId === siteFilter)));
      }
      if (catFilter !== "ALL") {
        targetItems = targetItems.filter(i => (i.category?.name || i.category || "").toLowerCase().includes(catFilter.toLowerCase()));
      }

      // Filter Logs
      let targetLogs = siteLogs;
      if (siteFilter !== "ALL") {
        targetLogs = targetLogs.filter(l => (l.siteId || l.user?.siteId) === siteFilter || (l.siteName || l.user?.site?.name) === siteFilter);
      }
      if (deptFilter !== "ALL") {
        targetLogs = targetLogs.filter(l => (l.departmentName || l.user?.department?.name) === deptFilter);
      }

      if (report.format === "CSV") {
        let csvLines: string[] = [
          `"Report Title","${report.report_name}"`,
          `"Report Type / Template","${type}"`,
          `"Generated By","${report.generated_by}"`,
          `"Generated Date","${report.generated_date} ${report.generated_time}"`,
          `"Applied Site Filter","${siteFilter}"`,
          `"Applied Department Filter","${deptFilter}"`,
          `"System","Asset Inventory Management System"`,
          ""
        ];

        if (type.includes("Low Stock")) {
          const lowStockItems = targetItems.filter(i => getItemStock(i, siteFilter) <= (i.reorderPoint || 5));
          const itemsToUse = lowStockItems.length > 0 ? lowStockItems : targetItems;
          csvLines.push('"SKU / Item ID","Item Name","Category","Current Stock","Reorder Point","Deficit","Status"');
          itemsToUse.forEach(i => {
            const stock = getItemStock(i, siteFilter);
            const threshold = i.reorderPoint || 5;
            const deficit = Math.max(0, threshold - stock);
            csvLines.push(`"${i.sku || i.id}","${(i.name || '').replace(/"/g, '""')}","${i.category?.name || i.category || 'N/A'}","${stock}","${threshold}","${deficit}","${stock <= threshold ? 'CRITICAL LOW' : 'WARNING'}"`);
          });
        } else if (type.includes("Valuation")) {
          csvLines.push('"SKU / Item ID","Item Name","Category","Current Stock","Unit Price ($)","Total Value ($)"');
          let grandTotal = 0;
          targetItems.forEach(i => {
            const stock = getItemStock(i, siteFilter);
            const price = Number(i.unitPrice ?? i.price ?? 100) || 0;
            const total = stock * price;
            grandTotal += total;
            csvLines.push(`"${i.sku || i.id}","${(i.name || '').replace(/"/g, '""')}","${i.category?.name || i.category || 'N/A'}","${stock}","${price.toFixed(2)}","${total.toFixed(2)}"`);
          });
          csvLines.push(`"","","","GRAND TOTAL VALUATION:","","$${grandTotal.toFixed(2)}"`);
        } else if (type.includes("Stock Movement")) {
          const movementLogs = targetLogs.filter(l => (l.action || "").toUpperCase().includes("STOCK") || (l.action || "").toUpperCase().includes("ADJUST") || (l.action || "").toUpperCase().includes("TRANSFER") || (l.action || "").toUpperCase().includes("CREATE") || (l.action || "").toUpperCase().includes("UPDATE"));
          const logsToUse = movementLogs.length > 0 ? movementLogs : targetLogs;
          csvLines.push('"Timestamp","Performed By","Movement Type / Action","Item / Asset","Quantity / Details"');
          logsToUse.forEach(l => {
            csvLines.push(`"${l.createdAt || l.timestamp || ''}","${l.userName || l.user || 'Super Admin'}","${l.action || 'Stock Movement'}","${formatLogItem(l.item || l.supplier)}","${(l.details || '').replace(/"/g, '""')}"`);
          });
        } else if (type.includes("Audit Trail")) {
          csvLines.push('"Timestamp","User / Performer","Action Type","Item / Context","System Audit Log Details"');
          targetLogs.forEach(l => {
            csvLines.push(`"${l.createdAt || l.timestamp || ''}","${l.userName || l.user || 'Super Admin'}","${l.action || 'AUDIT'}","${formatLogItem(l.item || l.supplier)}","${(l.details || '').replace(/"/g, '""')}"`);
          });
        } else {
          // General Inventory Report
          csvLines.push('"SKU / Item ID","Item Name","Category","Stock Level","Reorder Level","Unit Price ($)","Status"');
          targetItems.forEach(i => {
            const stock = getItemStock(i, siteFilter);
            const price = Number(i.unitPrice ?? i.price ?? 0) || 0;
            csvLines.push(`"${i.sku || i.id}","${(i.name || '').replace(/"/g, '""')}","${i.category?.name || i.category || 'N/A'}","${stock}","${i.reorderPoint || 5}","${price.toFixed(2)}","${i.status || 'AVAILABLE'}"`);
          });
        }

        const blob = new Blob([csvLines.join("\n")], { type: "text/csv" });
        triggerBlobDownload(blob, report.file_name);
      } else if (report.format === "Excel") {
        let xlsLines: string[] = [
          `Report Title: ${report.report_name}`,
          `Report Type: ${type}`,
          `Generated By: ${report.generated_by}`,
          `Date: ${report.generated_date} ${report.generated_time}`,
          `Site Filter: ${siteFilter}`,
          `Department Filter: ${deptFilter}`,
          ""
        ];

        if (type.includes("Low Stock")) {
          const lowStockItems = targetItems.filter(i => getItemStock(i, siteFilter) <= (i.reorderPoint || 5));
          const itemsToUse = lowStockItems.length > 0 ? lowStockItems : targetItems;
          xlsLines.push("SKU / Item ID\tItem Name\tCategory\tCurrent Stock\tReorder Point\tDeficit\tStatus");
          itemsToUse.forEach(i => {
            const stock = getItemStock(i, siteFilter);
            const threshold = i.reorderPoint || 5;
            const deficit = Math.max(0, threshold - stock);
            xlsLines.push(`${i.sku || i.id}\t${i.name || ''}\t${i.category?.name || i.category || 'N/A'}\t${stock}\t${threshold}\t${deficit}\t${stock <= threshold ? 'CRITICAL LOW' : 'WARNING'}`);
          });
        } else if (type.includes("Valuation")) {
          xlsLines.push("SKU / Item ID\tItem Name\tCategory\tCurrent Stock\tUnit Price ($)\tTotal Value ($)");
          let grandTotal = 0;
          targetItems.forEach(i => {
            const stock = getItemStock(i, siteFilter);
            const price = Number(i.unitPrice ?? i.price ?? 100) || 0;
            const total = stock * price;
            grandTotal += total;
            xlsLines.push(`${i.sku || i.id}\t${i.name || ''}\t${i.category?.name || i.category || 'N/A'}\t${stock}\t${price.toFixed(2)}\t${total.toFixed(2)}`);
          });
          xlsLines.push(`\t\t\tGRAND TOTAL VALUATION:\t\t$${grandTotal.toFixed(2)}`);
        } else if (type.includes("Stock Movement")) {
          const movementLogs = targetLogs.filter(l => (l.action || "").toUpperCase().includes("STOCK") || (l.action || "").toUpperCase().includes("ADJUST") || (l.action || "").toUpperCase().includes("TRANSFER") || (l.action || "").toUpperCase().includes("CREATE") || (l.action || "").toUpperCase().includes("UPDATE"));
          const logsToUse = movementLogs.length > 0 ? movementLogs : targetLogs;
          xlsLines.push("Timestamp\tPerformed By\tMovement Type / Action\tItem / Asset\tQuantity / Details");
          logsToUse.forEach(l => {
            xlsLines.push(`${l.createdAt || l.timestamp || ''}\t${l.userName || l.user || 'Super Admin'}\t${l.action || 'Stock Movement'}\t${formatLogItem(l.item || l.supplier)}\t${l.details || ''}`);
          });
        } else if (type.includes("Audit Trail")) {
          xlsLines.push("Timestamp\tUser / Performer\tAction Type\tItem / Context\tSystem Audit Log Details");
          targetLogs.forEach(l => {
            xlsLines.push(`${l.createdAt || l.timestamp || ''}\t${l.userName || l.user || 'Super Admin'}\t${l.action || 'AUDIT'}\t${formatLogItem(l.item || l.supplier)}\t${l.details || ''}`);
          });
        } else {
          xlsLines.push("SKU / Item ID\tItem Name\tCategory\tStock Level\tReorder Level\tUnit Price ($)\tStatus");
          targetItems.forEach(i => {
            const stock = getItemStock(i, siteFilter);
            const price = Number(i.unitPrice ?? i.price ?? 0) || 0;
            xlsLines.push(`${i.sku || i.id}\t${i.name || ''}\t${i.category?.name || i.category || 'N/A'}\t${stock}\t${i.reorderPoint || 5}\t${price.toFixed(2)}\t${i.status || 'AVAILABLE'}`);
          });
        }

        const blob = new Blob([xlsLines.join("\n")], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        triggerBlobDownload(blob, report.file_name);
      } else {
        // PDF Export - tailored by Report Type
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        
        doc.setFillColor(37, 99, 235);
        doc.rect(0, 0, 210, 24, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("ASSET INVENTORY MANAGEMENT SYSTEM", 14, 15);

        doc.setTextColor(17, 24, 39);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text(`${type.toUpperCase()}`, 14, 34);

        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(107, 114, 128);
        doc.text(`File: ${report.report_name}   |   Date: ${report.generated_date} at ${report.generated_time}   |   By: ${report.generated_by}`, 14, 40);

        doc.setDrawColor(229, 231, 235);
        doc.line(14, 45, 196, 45);

        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, 48, 182, 20, 2, 2, "FD");
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(37, 99, 235);
        doc.text("REPORT SUMMARY & DATA SCOPE", 18, 54);

        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);

        if (type.includes("Low Stock")) {
          const lowStockItems = targetItems.filter(i => getItemStock(i, siteFilter) <= (i.reorderPoint || 5));
          const itemsToUse = lowStockItems.length > 0 ? lowStockItems : targetItems;
          doc.text(`• Total Low Stock Items Flagged: ${itemsToUse.length} item(s)`, 18, 60);
          doc.text(`• Scope: Site [${siteFilter}] | Dept [${deptFilter}] | Category [${catFilter}]`, 18, 64);

          // Table Headers
          doc.setFillColor(239, 68, 68);
          doc.rect(14, 72, 182, 8, "F");
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          doc.text("SKU / ID", 16, 77);
          doc.text("ITEM NAME", 55, 77);
          doc.text("CATEGORY", 110, 77);
          doc.text("QTY / REORDER", 150, 77);
          doc.text("STATUS", 180, 77);

          let curY = 86;
          itemsToUse.slice(0, 22).forEach((item: any, idx: number) => {
            if (idx % 2 === 1) {
              doc.setFillColor(248, 250, 252);
              doc.rect(14, curY - 5, 182, 7, "F");
            }
            doc.setFont("helvetica", "normal");
            doc.setTextColor(51, 65, 85);

            const stock = getItemStock(item, siteFilter);
            const threshold = item.reorderPoint || 5;

            doc.text(String(item.sku || item.id || "").slice(0, 16), 16, curY);
            doc.text(String(item.name || "").slice(0, 26), 55, curY);
            doc.text(String(item.category?.name || item.category || "N/A").slice(0, 18), 110, curY);
            doc.text(`${stock} / ${threshold}`, 150, curY);
            
            doc.setFont("helvetica", "bold");
            doc.setTextColor(220, 38, 38);
            doc.text(stock === 0 ? "OUT OF STOCK" : "LOW STOCK", 180, curY);
            curY += 7;
          });
        } else if (type.includes("Valuation")) {
          let grandTotal = 0;
          targetItems.forEach(i => {
            const stock = getItemStock(i, siteFilter);
            const price = Number(i.unitPrice ?? i.price ?? 100) || 0;
            grandTotal += stock * price;
          });

          doc.text(`• Total Inventory Valuation: $${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} across ${targetItems.length} items`, 18, 60);
          doc.text(`• Scope: Site [${siteFilter}] | Dept [${deptFilter}] | Category [${catFilter}]`, 18, 64);

          // Table Headers
          doc.setFillColor(16, 185, 129);
          doc.rect(14, 72, 182, 8, "F");
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          doc.text("SKU / ID", 16, 77);
          doc.text("ITEM NAME", 55, 77);
          doc.text("STOCK", 115, 77);
          doc.text("UNIT PRICE", 145, 77);
          doc.text("TOTAL VALUE", 175, 77);

          let curY = 86;
          targetItems.slice(0, 22).forEach((item: any, idx: number) => {
            if (idx % 2 === 1) {
              doc.setFillColor(248, 250, 252);
              doc.rect(14, curY - 5, 182, 7, "F");
            }
            doc.setFont("helvetica", "normal");
            doc.setTextColor(51, 65, 85);

            const stock = getItemStock(item, siteFilter);
            const price = Number(item.unitPrice ?? item.price ?? 100) || 0;
            const total = stock * price;

            doc.text(String(item.sku || item.id || "").slice(0, 16), 16, curY);
            doc.text(String(item.name || "").slice(0, 28), 55, curY);
            doc.text(String(stock), 115, curY);
            doc.text(`$${price.toFixed(2)}`, 145, curY);
            doc.setFont("helvetica", "bold");
            doc.text(`$${total.toFixed(2)}`, 175, curY);
            curY += 7;
          });
        } else if (type.includes("Stock Movement")) {
          const movementLogs = targetLogs.filter(l => (l.action || "").toUpperCase().includes("STOCK") || (l.action || "").toUpperCase().includes("ADJUST") || (l.action || "").toUpperCase().includes("TRANSFER") || (l.action || "").toUpperCase().includes("CREATE") || (l.action || "").toUpperCase().includes("UPDATE"));
          const logsToUse = movementLogs.length > 0 ? movementLogs : targetLogs;
          
          doc.text(`• Total Movement Events Recorded: ${logsToUse.length} transactions`, 18, 60);
          doc.text(`• Scope: Site [${siteFilter}] | Dept [${deptFilter}] | Category [${catFilter}]`, 18, 64);

          // Table Headers
          doc.setFillColor(37, 99, 235);
          doc.rect(14, 72, 182, 8, "F");
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          doc.text("TIMESTAMP", 16, 77);
          doc.text("PERFORMED BY", 55, 77);
          doc.text("MOVEMENT TYPE", 100, 77);
          doc.text("ITEM / DETAILS", 140, 77);

          let curY = 86;
          logsToUse.slice(0, 22).forEach((l: any, idx: number) => {
            if (idx % 2 === 1) {
              doc.setFillColor(248, 250, 252);
              doc.rect(14, curY - 5, 182, 7, "F");
            }
            doc.setFont("helvetica", "normal");
            doc.setTextColor(51, 65, 85);

            const timeStr = String(l.createdAt || l.timestamp || report.generated_date || "");
            const userStr = typeof l.userName === "string" ? l.userName : typeof l.user?.name === "string" ? l.user.name : typeof l.user === "string" ? l.user : "Super Admin";
            const actionStr = String(l.action || "Stock Movement");
            const detailsStr = String(l.details || formatLogItem(l.item));

            doc.text(timeStr.slice(0, 16), 16, curY);
            doc.text(userStr.slice(0, 18), 55, curY);
            doc.text(actionStr.slice(0, 18), 100, curY);
            doc.text(detailsStr.slice(0, 32), 140, curY);
            curY += 7;
          });
        } else if (type.includes("Audit Trail")) {
          doc.text(`• Total Audit Logs Compiled: ${targetLogs.length} activity records`, 18, 60);
          doc.text(`• Scope: Site [${siteFilter}] | Dept [${deptFilter}]`, 18, 64);

          // Table Headers
          doc.setFillColor(79, 70, 229);
          doc.rect(14, 72, 182, 8, "F");
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          doc.text("TIMESTAMP", 16, 77);
          doc.text("USER / ROLE", 55, 77);
          doc.text("ACTION", 100, 77);
          doc.text("AUDIT DETAILS", 140, 77);

          let curY = 86;
          targetLogs.slice(0, 22).forEach((l: any, idx: number) => {
            if (idx % 2 === 1) {
              doc.setFillColor(248, 250, 252);
              doc.rect(14, curY - 5, 182, 7, "F");
            }
            doc.setFont("helvetica", "normal");
            doc.setTextColor(51, 65, 85);

            const timeStr = String(l.createdAt || l.timestamp || report.generated_date || "");
            const userStr = typeof l.userName === "string" ? l.userName : typeof l.user?.name === "string" ? l.user.name : typeof l.user === "string" ? l.user : "Super Admin";
            const actionStr = String(l.action || "AUDIT");
            const detailsStr = String(l.details || "Operation logged");

            doc.text(timeStr.slice(0, 16), 16, curY);
            doc.text(userStr.slice(0, 18), 55, curY);
            doc.text(actionStr.slice(0, 18), 100, curY);
            doc.text(detailsStr.slice(0, 32), 140, curY);
            curY += 7;
          });
        } else {
          // General Inventory Report
          doc.text(`• Total Items in Catalog: ${targetItems.length} items evaluated`, 18, 60);
          doc.text(`• Scope: Site [${siteFilter}] | Dept [${deptFilter}] | Category [${catFilter}]`, 18, 64);

          // Table Headers
          doc.setFillColor(37, 99, 235);
          doc.rect(14, 72, 182, 8, "F");
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          doc.text("SKU / ID", 16, 77);
          doc.text("ITEM NAME", 55, 77);
          doc.text("CATEGORY", 115, 77);
          doc.text("STOCK", 155, 77);
          doc.text("STATUS", 175, 77);

          let curY = 86;
          targetItems.slice(0, 22).forEach((item: any, idx: number) => {
            if (idx % 2 === 1) {
              doc.setFillColor(248, 250, 252);
              doc.rect(14, curY - 5, 182, 7, "F");
            }
            doc.setFont("helvetica", "normal");
            doc.setTextColor(51, 65, 85);

            const stock = getItemStock(item, siteFilter);

            doc.text(String(item.sku || item.id || "").slice(0, 16), 16, curY);
            doc.text(String(item.name || "").slice(0, 28), 55, curY);
            doc.text(String(item.category?.name || item.category || "N/A").slice(0, 18), 115, curY);
            doc.text(String(stock), 155, curY);
            doc.setFont("helvetica", "bold");
            doc.text(String(item.status || "AVAILABLE"), 175, curY);
            curY += 7;
          });
        }

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.line(14, 276, 196, 276);
        doc.text("Generated from Asset Inventory Management System", 14, 281);
        doc.text(`Generated on: ${report.generated_date} at ${report.generated_time}`, 14, 285);
        doc.text(`Generated by: ${report.generated_by}`, 14, 289);
        doc.text("Page 1 of 1", 172, 281);
        doc.setFont("helvetica", "bold");
        doc.text("Confidential Company Document", 148, 289);

        const pdfBlob = doc.output("blob");
        triggerBlobDownload(pdfBlob, report.file_name);
      }

      showNotification(`Downloaded '${report.file_name}'.`);
    } catch (err) {
      console.error("Error downloading file:", err);
      showNotification("Failed to download report file.");
    } finally {
      setDownloadingReports(prev => {
        const next = new Set(prev);
        next.delete(report.id);
        return next;
      });
    }
  };

  const handleDeleteReport = (id: string) => {
    setRecentReports(prev => prev.filter(r => r.id !== id));
    showNotification("Report removed.");
  };

  return (
    <div style={{ backgroundColor: "#F8FAFC", minHeight: "100vh", padding: "2rem 2.5rem", fontFamily: "Inter, sans-serif", color: "#111827" }}>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed", top: "24px", right: "24px", zIndex: 9999,
              backgroundColor: "#111827", color: "#FFFFFF", padding: "0.85rem 1.4rem",
              borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              display: "flex", alignItems: "center", gap: "0.65rem", fontSize: "0.875rem", fontWeight: 600
            }}
          >
            <CheckCircle2 size={18} color="#10B981" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================
          HEADER (PRESERVING EXACT LAYOUT & BUTTON CONTROLS)
          ==================================================== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>
            Reports and system logs
          </h1>
          <p style={{ fontSize: "13px", color: "#6B7280", margin: "0.25rem 0 0 0" }}>
            Audit logs, activity trends, and exportable reports.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
          {/* Site Filter Select */}
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            style={{
              padding: "0.5rem 0.85rem", borderRadius: "10px", backgroundColor: "#FFFFFF",
              border: "1px solid #CBD5E1", fontSize: "13px", color: "#334155", fontWeight: 500, cursor: "pointer"
            }}
          >
            <option value="ALL">All sites</option>
            {sitesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => fetchData()}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.95rem",
              borderRadius: "10px", backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1",
              fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)", transition: "all 200ms ease"
            }}
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          {/* Schedule Report Button */}
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.95rem",
              borderRadius: "10px", backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1",
              fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)", transition: "all 200ms ease"
            }}
          >
            <Calendar size={14} color="#2563EB" />
            <span>Schedule</span>
          </button>

          {/* Export Button */}
          <button
            onClick={() => handleExecuteGenerate("PDF")}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.95rem",
              borderRadius: "10px", backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1",
              fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)", transition: "all 200ms ease"
            }}
          >
            <Download size={14} color="#2563EB" />
            <span>Export</span>
          </button>

          {/* Primary Report Button */}
          <button
            onClick={() => {
              const elem = document.getElementById("generate-reports-card");
              if (elem) elem.scrollIntoView({ behavior: "smooth" });
            }}
            className="glitter-action-btn"
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1.1rem",
              borderRadius: "10px", backgroundColor: "#2563EB", border: "none",
              fontSize: "13px", fontWeight: 600, color: "#FFFFFF", cursor: "pointer",
              boxShadow: "0 4px 10px rgba(37, 99, 235, 0.2)", transition: "all 200ms ease"
            }}
          >
            <FileText size={14} />
            <span>Report</span>
          </button>
        </div>
      </div>

      {/* ====================================================
          KPI CARDS SECTION (PRESERVING 2-ROW OVERVIEW SPEC)
          ==================================================== */}
      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", padding: "1.25rem 1.5rem", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", marginBottom: "1.75rem" }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <LayoutDashboard size={15} color="#64748B" />
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", letterSpacing: "0.05em" }}>
            ORDER & INVENTORY OVERVIEW
          </span>
        </div>

        {/* Row 1 KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
          {kpiRow1.map((kpi) => (
            <div
              key={kpi.id}
              className="glitter-grid-card"
              onClick={() => {
                setKpiFilter(kpiFilter === kpi.id ? null : kpi.id);
                showNotification(`Filtered table by '${kpi.label}'`);
              }}
              style={{
                backgroundColor: kpiFilter === kpi.id ? "#EFF6FF" : "#FFFFFF",
                borderRadius: "12px", padding: "1rem 1.25rem", border: "1px solid",
                borderColor: kpiFilter === kpi.id ? "#2563EB" : "#E2E8F0",
                cursor: "pointer", transition: "all 200ms ease", boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 700, color: kpi.color, display: "block", marginBottom: "0.4rem" }}>
                {kpi.label}
              </span>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#111827", lineHeight: 1 }}>
                {kpi.val}
              </div>
              <span style={{ fontSize: "11px", color: "#64748B", display: "inline-flex", alignItems: "center", gap: "0.2rem", marginTop: "0.5rem" }}>
                <Play size={9} fill="#94A3B8" stroke="none" />
                <span>{kpi.sub}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Row 2 KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem" }}>
          {kpiRow2.map((kpi) => (
            <div
              key={kpi.id}
              className="glitter-grid-card"
              style={{
                backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "1rem 1.25rem",
                border: "1px solid #E2E8F0", transition: "all 200ms ease", boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", display: "block", marginBottom: "0.4rem" }}>
                {kpi.label}
              </span>
              <div style={{ fontSize: "24px", fontWeight: 800, color: kpi.color, lineHeight: 1 }}>
                {kpi.val}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ====================================================
          CHARTS ROW (PRESERVING 3-CHARTS GRID SPECIFICATION)
          ==================================================== */}
      {/* ====================================================
          4 UPGRADED ENTERPRISE CHARTS GRID
          ==================================================== */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem", marginBottom: "1.75rem" }}>
        
        {/* 1. Activity Over Last 7 Days (Smooth Multi-Line Area Chart) */}
        <div id="chart-7days" style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "1.25rem", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B", margin: 0 }}>1. Activity Over Last 7 Days</h3>
              <span style={{ fontSize: "11px", color: "#64748B" }}>Smooth trend of transactions, POs, and deployments</span>
            </div>
            <div style={{ display: "flex", gap: "0.35rem" }}>
              <button onClick={() => handleExportChartPNG("chart-7days", "Activity_Over_7_Days")} title="Download PNG" style={{ padding: "0.35rem", borderRadius: "6px", border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", cursor: "pointer", color: "#475569" }}><Download size={13} /></button>
              <button onClick={() => setFullScreenChart({ title: "Activity Over Last 7 Days", chartId: "chart-7days" })} title="Full Screen" style={{ padding: "0.35rem", borderRadius: "6px", border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", cursor: "pointer", color: "#475569" }}><Maximize2 size={13} /></button>
            </div>
          </div>

          <div style={{ width: "100%", height: "260px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart7DaysActivity} onClick={(e: any) => { if (e && (e.activePayload || e.activeLabel)) { setActionFilter("ALL"); showNotification("Filtered table by 7-day activity"); } }}>
                <defs>
                  <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/><stop offset="95%" stopColor="#2563EB" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorPO" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorDep" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/><stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorRet" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/><stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "12px" }} wrapperStyle={{ zIndex: 1000 }} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Area type="monotone" dataKey="Inventory Transactions" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorTx)" />
                <Area type="monotone" dataKey="Purchase Orders" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorPO)" />
                <Area type="monotone" dataKey="Asset Deployments" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorDep)" />
                <Area type="monotone" dataKey="Returned Assets" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorRet)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Actions by Type (Sorted Horizontal Bar Chart) */}
        <div id="chart-actions-type" style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "1.25rem", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B", margin: 0 }}>2. Actions by Type</h3>
              <span style={{ fontSize: "11px", color: "#64748B" }}>Sorted totals across operational event types</span>
            </div>
            <div style={{ display: "flex", gap: "0.35rem" }}>
              <button onClick={() => handleExportChartPNG("chart-actions-type", "Actions_By_Type")} title="Download PNG" style={{ padding: "0.35rem", borderRadius: "6px", border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", cursor: "pointer", color: "#475569" }}><Download size={13} /></button>
              <button onClick={() => setFullScreenChart({ title: "Actions by Type", chartId: "chart-actions-type" })} title="Full Screen" style={{ padding: "0.35rem", borderRadius: "6px", border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", cursor: "pointer", color: "#475569" }}><Maximize2 size={13} /></button>
            </div>
          </div>

          <div style={{ width: "100%", height: "260px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartActionsByType} layout="vertical" onClick={(e: any) => { if (e && e.activePayload && e.activePayload[0]) { setActionFilter(e.activePayload[0].payload.name); showNotification(`Filtered by '${e.activePayload[0].payload.name}'`); } }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={11} width={110} />
                <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "12px" }} wrapperStyle={{ zIndex: 1000 }} formatter={(val: any) => [`${val} actions`, "Total"]} />
                <Bar dataKey="count" fill="#2563EB" radius={[0, 6, 6, 0]}>
                  {chartActionsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Activity by Category (Stacked Horizontal Bar Chart) */}
        <div id="chart-activity-category" style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "1.25rem", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B", margin: 0 }}>3. Activity by Category</h3>
              <span style={{ fontSize: "11px", color: "#64748B" }}>Stacked lifecycle events across 9 hardware categories</span>
            </div>
            <div style={{ display: "flex", gap: "0.35rem" }}>
              <button onClick={() => handleExportChartPNG("chart-activity-category", "Activity_By_Category")} title="Download PNG" style={{ padding: "0.35rem", borderRadius: "6px", border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", cursor: "pointer", color: "#475569" }}><Download size={13} /></button>
              <button onClick={() => setFullScreenChart({ title: "Activity by Category", chartId: "chart-activity-category" })} title="Full Screen" style={{ padding: "0.35rem", borderRadius: "6px", border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", cursor: "pointer", color: "#475569" }}><Maximize2 size={13} /></button>
            </div>
          </div>

          <div style={{ width: "100%", height: "260px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartActivityByCategory} layout="vertical" onClick={(e: any) => { if (e && e.activePayload && e.activePayload[0]) { setSearchQuery(e.activePayload[0].payload.category); showNotification(`Filtered table by '${e.activePayload[0].payload.category}'`); } }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                <YAxis dataKey="category" type="category" stroke="#94A3B8" fontSize={11} width={90} />
                <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "12px" }} wrapperStyle={{ zIndex: 1000 }} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar dataKey="Created" stackId="a" fill="#2563EB" />
                <Bar dataKey="Updated" stackId="a" fill="#10B981" />
                <Bar dataKey="Deleted" stackId="a" fill="#EF4444" />
                <Bar dataKey="Checked Out" stackId="a" fill="#8B5CF6" />
                <Bar dataKey="Returned" stackId="a" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Inventory Status (Donut Chart with Quantities & Percentages) */}
        <div id="chart-inventory-status" style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "1.25rem", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B", margin: 0 }}>4. Inventory Status</h3>
              <span style={{ fontSize: "11px", color: "#64748B" }}>Stock distribution percentages and unit counts</span>
            </div>
            <div style={{ display: "flex", gap: "0.35rem" }}>
              <button onClick={() => handleExportChartPNG("chart-inventory-status", "Inventory_Status")} title="Download PNG" style={{ padding: "0.35rem", borderRadius: "6px", border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", cursor: "pointer", color: "#475569" }}><Download size={13} /></button>
              <button onClick={() => setFullScreenChart({ title: "Inventory Status", chartId: "chart-inventory-status" })} title="Full Screen" style={{ padding: "0.35rem", borderRadius: "6px", border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", cursor: "pointer", color: "#475569" }}><Maximize2 size={13} /></button>
            </div>
          </div>

          <div style={{ width: "100%", height: "260px", display: "flex", alignItems: "center" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartInventoryStatus} cx="40%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="qty" onClick={(e: any) => { if (e && e.name) { setSearchQuery(e.name); showNotification(`Filtered table by status '${e.name}'`); } }}>
                  {chartInventoryStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: "12px" }} wrapperStyle={{ zIndex: 1000 }} formatter={(val: any, name: any, item: any) => [`${val} units (${item.payload.pct}%)`, name]} />
                <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: "11px" }} formatter={(value, entry: any) => `${value} (${entry.payload.pct}%)`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ====================================================
          SEARCH & FILTER TOOLBAR
          ==================================================== */}
      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "0.85rem 1.25rem", border: "1px solid #E2E8F0", boxShadow: "0 1px 2px rgba(0,0,0,0.03)", marginBottom: "1.25rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        
        <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
          <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
          <input
            type="text"
            placeholder="Search action, details, user, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%", padding: "0.55rem 0.75rem 0.55rem 2.2rem", borderRadius: "8px",
              border: "1px solid #CBD5E1", fontSize: "13px", color: "#1E293B", outline: "none"
            }}
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={{ padding: "0.55rem 0.85rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "13px", color: "#334155", backgroundColor: "#FFFFFF", cursor: "pointer" }}
        >
          <option value="ALL">All actions</option>
          <option value="Item Created">Item Created</option>
          <option value="Item Released">Item Released</option>
          <option value="Stock Adjusted">Stock Adjusted</option>
          <option value="PO Created">PO Created</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{ padding: "0.55rem 0.85rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "13px", color: "#334155", backgroundColor: "#FFFFFF", cursor: "pointer" }}
        />

      </div>

      {/* ====================================================
          ACTIVITY LOG TABLE
          ==================================================== */}
      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden", marginBottom: "2rem" }}>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "0.85rem 1.25rem", fontSize: "11px", fontWeight: 700, color: "#64748B", letterSpacing: "0.05em" }}>TIMESTAMP</th>
                <th style={{ padding: "0.85rem 1.25rem", fontSize: "11px", fontWeight: 700, color: "#64748B", letterSpacing: "0.05em" }}>PERFORMED BY</th>
                <th style={{ padding: "0.85rem 1.25rem", fontSize: "11px", fontWeight: 700, color: "#64748B", letterSpacing: "0.05em" }}>ACTION</th>
                <th style={{ padding: "0.85rem 1.25rem", fontSize: "11px", fontWeight: 700, color: "#64748B", letterSpacing: "0.05em" }}>ITEM / SUPPLIER</th>
                <th style={{ padding: "0.85rem 1.25rem", fontSize: "11px", fontWeight: 700, color: "#64748B", letterSpacing: "0.05em" }}>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "2.5rem", textAlign: "center", color: "#94A3B8", fontSize: "13px" }}>
                    No activity logs found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log: any, idx: number) => (
                  <tr
                    className="animated-row"
                    key={log.id || idx}
                    onClick={() => setSelectedLogRow(log)}
                    style={{
                      borderBottom: "1px solid #F1F5F9", cursor: "pointer",
                      backgroundColor: idx % 2 === 1 ? "#F8FAFC" : "#FFFFFF",
                      transition: "all 150ms ease",
                      animationDelay: `${idx * 0.04}s`
                    }}
                  >
                    <td style={{ padding: "0.9rem 1.25rem", fontSize: "12px", color: "#64748B", whiteSpace: "nowrap" }}>
                      {formatLogTimestamp(log.createdAt || log.timestamp)}
                    </td>
                    <td style={{ padding: "0.9rem 1.25rem", fontSize: "13px", fontWeight: 600, color: "#1E293B" }}>
                      {log.userName || log.user?.name || log.user || "Super Admin"}
                    </td>
                    <td style={{ padding: "0.9rem 1.25rem", fontSize: "12px" }}>
                      <span className="glitter-status-badge" style={{
                        padding: "0.2rem 0.6rem", borderRadius: "6px", fontWeight: 600, fontSize: "11px",
                        backgroundColor: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE",
                        letterSpacing: "0.02em"
                      }}>
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td style={{ padding: "0.9rem 1.25rem", fontSize: "12px", color: "#2563EB", fontWeight: 600 }}>
                      <span className="glitter-supplier-name-badge" style={{ padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                        {formatLogItem(log.item || log.supplier)}
                      </span>
                    </td>
                    <td
                      title={formatDetails(log.details)}
                      style={{
                        padding: "0.9rem 1.25rem", fontSize: "12px", color: "#475569",
                        maxWidth: "420px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                      }}
                    >
                      {formatDetails(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div style={{ padding: "0.85rem 1.25rem", backgroundColor: "#F8FAFC", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#64748B" }}>
            Showing {paginatedLogs.length} of {filteredTableLogs.length} activity records
          </span>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              style={{ padding: "0.35rem 0.7rem", borderRadius: "6px", border: "1px solid #CBD5E1", backgroundColor: "#FFFFFF", cursor: "pointer" }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: "12px", color: "#334155", fontWeight: 600, display: "flex", alignItems: "center", padding: "0 0.4rem" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              style={{ padding: "0.35rem 0.7rem", borderRadius: "6px", border: "1px solid #CBD5E1", backgroundColor: "#FFFFFF", cursor: "pointer" }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* ====================================================
          GENERATE REPORTS SECTION (PRESERVING FOOTER BOX)
          ==================================================== */}
      <div id="generate-reports-card" style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", padding: "2rem", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", textAlign: "center" }}>
        
        <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem auto" }}>
          <FileText size={24} color="#2563EB" />
        </div>

        <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1E293B", margin: 0 }}>
          Generate Reports
        </h3>
        <p style={{ fontSize: "13px", color: "#64748B", margin: "0.3rem 0 1.5rem 0", maxWidth: "560px", marginLeft: "auto", marginRight: "auto" }}>
          Select parameters to compile a comprehensive live enterprise report containing inventory summary, movement history, and low stock status.
        </p>

        {/* Generator Controls */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", maxWidth: "800px", margin: "0 auto 1.5rem auto", textAlign: "left" }}>
          
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>Report Type</label>
            <select value={genReportType} onChange={(e) => setGenReportType(e.target.value)} style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px" }}>
              <option value="General Inventory Report">General Inventory Report</option>
              <option value="Stock Movement Log">Stock Movement Log</option>
              <option value="Low Stock Report">Low Stock Report</option>
              <option value="Inventory Valuation">Inventory Valuation</option>
              <option value="Audit Trail Report">Audit Trail Report</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>Site Location</label>
            <select value={genSite} onChange={(e) => setGenSite(e.target.value)} style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px" }}>
              <option value="ALL">All Sites</option>
              {sitesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>Department</label>
            <select value={genDepartment} onChange={(e) => setGenDepartment(e.target.value)} style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px" }}>
              <option value="ALL">All Departments</option>
              {departmentsList.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>Export Format</label>
            <select value={genFormat} onChange={(e) => setGenFormat(e.target.value as any)} style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px", fontWeight: 600 }}>
              <option value="PDF">PDF Document (.pdf)</option>
              <option value="Excel">Excel Sheet (.xlsx)</option>
              <option value="CSV">Comma Separated (.csv)</option>
            </select>
          </div>

        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: "0.85rem", flexWrap: "wrap" }}>
          <button
            onClick={() => handleExecuteGenerate("PDF")}
            disabled={isGenerating}
            className="glitter-action-btn"
            style={{
              padding: "0.65rem 1.4rem", borderRadius: "10px", backgroundColor: "#2563EB", border: "none",
              color: "#FFFFFF", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              boxShadow: "0 4px 10px rgba(37, 99, 235, 0.2)", display: "inline-flex", alignItems: "center", gap: "0.4rem"
            }}
          >
            {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <FileText size={14} />}
            <span>{isGenerating ? "Compiling..." : "Generate PDF"}</span>
          </button>

          <button
            onClick={() => handleExecuteGenerate("Excel")}
            disabled={isGenerating}
            className="glitter-action-btn"
            style={{
              padding: "0.65rem 1.4rem", borderRadius: "10px", backgroundColor: "#059669", border: "none",
              color: "#FFFFFF", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              boxShadow: "0 4px 10px rgba(5, 150, 105, 0.2)", display: "inline-flex", alignItems: "center", gap: "0.4rem"
            }}
          >
            <Download size={14} />
            <span>Generate Excel</span>
          </button>

          <button
            onClick={() => handleExecuteGenerate("CSV")}
            disabled={isGenerating}
            className="glitter-action-btn"
            style={{
              padding: "0.65rem 1.4rem", borderRadius: "10px", backgroundColor: "#EA580C", border: "none",
              color: "#FFFFFF", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              boxShadow: "0 4px 10px rgba(234, 88, 12, 0.2)", display: "inline-flex", alignItems: "center", gap: "0.4rem"
            }}
          >
            <Download size={14} />
            <span>Generate CSV</span>
          </button>
        </div>

      </div>

      {/* SCHEDULED REPORTS MANAGEMENT SECTION */}
      <div style={{ marginTop: "2rem", backgroundColor: "#FFFFFF", borderRadius: "14px", padding: "1.5rem", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1E293B", margin: 0 }}>Scheduled Reports</h3>
            <span style={{ fontSize: "12px", color: "#64748B" }}>Automated recurring report jobs & background generation</span>
          </div>
          <button
            onClick={() => { resetSchedForm(); setIsScheduleModalOpen(true); }}
            className="glitter-action-btn"
            style={{
              padding: "0.5rem 1rem", borderRadius: "8px", backgroundColor: "#2563EB", color: "#FFFFFF",
              border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem"
            }}
          >
            <Plus size={14} />
            <span>Create Schedule</span>
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <th style={{ padding: "0.75rem 1rem", fontSize: "11px", fontWeight: 600, color: "#64748B" }}>SCHEDULE NAME</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "11px", fontWeight: 600, color: "#64748B" }}>REPORT TYPE</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "11px", fontWeight: 600, color: "#64748B" }}>FREQUENCY</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "11px", fontWeight: 600, color: "#64748B" }}>NEXT RUN</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "11px", fontWeight: 600, color: "#64748B" }}>LAST RUN</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "11px", fontWeight: 600, color: "#64748B" }}>STATUS</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "11px", fontWeight: 600, color: "#64748B" }}>CREATED BY</th>
                <th style={{ padding: "0.75rem 1rem", fontSize: "11px", fontWeight: 600, color: "#64748B", textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {scheduledReports.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#94A3B8", fontSize: "13px" }}>No automated report schedules configured yet.</td>
                </tr>
              ) : (
                scheduledReports.map((s, idx) => (
                  <tr 
                    className="animated-row" 
                    key={s.id} 
                    style={{ borderBottom: "1px solid #F1F5F9", animationDelay: `${idx * 0.04}s` }}
                  >
                    <td style={{ padding: "0.85rem 1rem", fontSize: "12px", fontWeight: 600, color: "#1E293B" }}>{s.name}</td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "12px", color: "#475569" }}>{s.type}</td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "12px", color: "#2563EB", fontWeight: 600 }}>{s.frequency}</td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "12px", color: "#64748B" }}>{s.nextRun}</td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "12px", color: "#64748B" }}>{s.lastRun || "Never"}</td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "11px" }}>
                      <span className="glitter-status-badge" style={{
                        padding: "0.2rem 0.6rem", borderRadius: "6px", fontWeight: 600,
                        backgroundColor: s.enabled ? "#ECFDF5" : "#FEF2F2",
                        color: s.enabled ? "#10B981" : "#EF4444",
                        border: s.enabled ? "1px solid #A7F3D0" : "1px solid #FECACA"
                      }}>
                        {s.enabled ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "12px", color: "#64748B" }}>{s.createdBy}</td>
                    <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "0.35rem", justifyContent: "flex-end" }}>
                        <button onClick={() => handleRunNowSchedule(s)} className="glitter-action-btn" title="Run Now" style={{ padding: "0.35rem 0.6rem", borderRadius: "6px", backgroundColor: "#2563EB", color: "#FFFFFF", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                          <Play size={11} /> Run Now
                        </button>
                        <button onClick={() => handleTogglePauseSchedule(s)} className="glitter-action-btn" title={s.enabled ? "Pause Schedule" : "Resume Schedule"} style={{ padding: "0.35rem 0.6rem", borderRadius: "6px", backgroundColor: s.enabled ? "#F59E0B" : "#10B981", color: "#FFFFFF", border: "none", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                          {s.enabled ? "Pause" : "Resume"}
                        </button>
                        <button onClick={() => handleEditSchedule(s)} className="glitter-action-btn" title="Edit Schedule" style={{ padding: "0.35rem 0.6rem", borderRadius: "6px", backgroundColor: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                          Edit
                        </button>
                        <button onClick={() => handleDeleteSchedule(s.id, s.name)} className="glitter-action-btn" title="Delete Schedule" style={{ padding: "0.35rem 0.6rem", borderRadius: "6px", backgroundColor: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECENT REPORTS HISTORY TABLE */}
      {recentReports.length > 0 && (
        <div style={{ marginTop: "2rem", backgroundColor: "#FFFFFF", borderRadius: "14px", padding: "1.5rem", border: "1px solid #E2E8F0" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1E293B", marginBottom: "1rem" }}>Recent Generated Reports</h3>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "11px", fontWeight: 600, color: "#64748B" }}>Report File</th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "11px", fontWeight: 600, color: "#64748B" }}>Generated By</th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "11px", fontWeight: 600, color: "#64748B" }}>Date</th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "11px", fontWeight: 600, color: "#64748B" }}>Format</th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "11px", fontWeight: 600, color: "#64748B", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((r, idx) => (
                  <tr 
                    className="animated-row" 
                    key={r.id} 
                    style={{ borderBottom: "1px solid #F1F5F9", animationDelay: `${idx * 0.04}s` }}
                  >
                    <td style={{ padding: "0.85rem 1rem", fontSize: "12px", fontWeight: 600, color: "#1E293B" }}>{r.file_name}</td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "12px", color: "#475569" }}>{r.generated_by}</td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "12px", color: "#64748B" }}>{r.generated_date}</td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "11px" }}>
                      <span style={{ padding: "0.15rem 0.5rem", borderRadius: "4px", backgroundColor: "#EFF6FF", color: "#2563EB", fontWeight: 600 }}>{r.format}</span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                      <button onClick={() => downloadReportFile(r)} style={{ padding: "0.35rem 0.75rem", borderRadius: "6px", backgroundColor: "#2563EB", color: "#FFFFFF", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SCHEDULED REPORTS CONFIGURATION MODAL */}
      <AnimatePresence>
        {isScheduleModalOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 999, backgroundColor: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", width: "100%", maxWidth: "700px", padding: "1.75rem", maxHeight: "90vh", overflowY: "auto" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid #F1F5F9", paddingBottom: "0.75rem" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1E293B", margin: 0 }}>
                    {schedId ? "Edit Report Schedule" : "Schedule Automatic Report"}
                  </h3>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>Automate live database report generation & exports</span>
                </div>
                <button onClick={() => setIsScheduleModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}><X size={20} /></button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                
                {/* Report Name */}
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>Report Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if left blank"
                    value={schedName}
                    onChange={(e) => setSchedName(e.target.value)}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "13px" }}
                  />
                </div>

                {/* Report Type */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>Report Type</label>
                  <select value={schedType} onChange={(e) => setSchedType(e.target.value)} style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px" }}>
                    <option value="General Inventory Report">General Inventory Report</option>
                    <option value="Executive Dashboard Report">Executive Dashboard Report</option>
                    <option value="Stock Movement & Adjustments Log">Stock Movement & Adjustments Log</option>
                    <option value="Asset Category Breakdown">Asset Category Breakdown</option>
                    <option value="Low Stock & Reorder Report">Low Stock & Reorder Report</option>
                    <option value="Purchase Order Summary">Purchase Order Summary</option>
                    <option value="Supplier Performance Log">Supplier Performance Log</option>
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>Date Range</label>
                  <select value={schedDateRange} onChange={(e) => setSchedDateRange(e.target.value)} style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px" }}>
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                    <option value="365">Last 365 Days</option>
                  </select>
                </div>

                {/* Site */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>Site Filter</label>
                  <select value={schedSite} onChange={(e) => setSchedSite(e.target.value)} style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px" }}>
                    <option value="ALL">All Sites</option>
                    {sitesList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>Department</label>
                  <select value={schedDepartment} onChange={(e) => setSchedDepartment(e.target.value)} style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px" }}>
                    <option value="ALL">All Departments</option>
                    {departmentsList.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>Category</label>
                  <select value={schedCategory} onChange={(e) => setSchedCategory(e.target.value)} style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px" }}>
                    <option value="ALL">All Categories</option>
                    {categoriesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                {/* Supplier */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>Supplier</label>
                  <select value={schedSupplier} onChange={(e) => setSchedSupplier(e.target.value)} style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px" }}>
                    <option value="ALL">All Suppliers</option>
                    {suppliersList.map(sup => <option key={sup.id} value={sup.name}>{sup.name}</option>)}
                  </select>
                </div>

                {/* Asset Status */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>Asset Status</label>
                  <select value={schedStatus} onChange={(e) => setSchedStatus(e.target.value)} style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px" }}>
                    <option value="ALL">All Statuses</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="LOW_STOCK">Low Stock Alert</option>
                  </select>
                </div>

                {/* Output Format */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>Output Format</label>
                  <select value={schedFormat} onChange={(e) => setSchedFormat(e.target.value as any)} style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px", fontWeight: 600 }}>
                    <option value="PDF">PDF Document (.pdf)</option>
                    <option value="Excel">Excel Sheet (.xlsx)</option>
                    <option value="CSV">Comma Separated (.csv)</option>
                  </select>
                </div>

                {/* Frequency */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>Frequency</label>
                  <select value={schedFrequency} onChange={(e) => setSchedFrequency(e.target.value as any)} style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px", fontWeight: 600, color: "#2563EB" }}>
                    <option value="Once">Once</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>Start Date</label>
                  <input
                    type="date"
                    value={schedStartDate}
                    onChange={(e) => setSchedStartDate(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px" }}
                  />
                </div>

                {/* Start Time */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>Start Time</label>
                  <input
                    type="time"
                    value={schedStartTime}
                    onChange={(e) => setSchedStartTime(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px" }}
                  />
                </div>

                {/* End Date (Optional) */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>End Date (Optional)</label>
                  <input
                    type="date"
                    value={schedEndDate}
                    onChange={(e) => setSchedEndDate(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px" }}
                  />
                </div>

                {/* Time Zone */}
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>Time Zone</label>
                  <select value={schedTimeZone} onChange={(e) => setSchedTimeZone(e.target.value)} style={{ width: "100%", padding: "0.55rem", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px" }}>
                    <option value="UTC+08:00 (PHT)">UTC+08:00 (Philippine Standard Time)</option>
                    <option value="UTC+00:00 (GMT)">UTC+00:00 (Greenwich Mean Time)</option>
                    <option value="UTC-05:00 (EST)">UTC-05:00 (Eastern Standard Time)</option>
                    <option value="UTC-08:00 (PST)">UTC-08:00 (Pacific Standard Time)</option>
                  </select>
                </div>

                {/* Enable / Disable Schedule */}
                <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <input
                    type="checkbox"
                    id="schedEnableToggle"
                    checked={schedEnabled}
                    onChange={(e) => setSchedEnabled(e.target.checked)}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  <label htmlFor="schedEnableToggle" style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B", cursor: "pointer" }}>
                    Enable Automatic Report Schedule immediately
                  </label>
                </div>

              </div>

              <div style={{ marginTop: "1.75rem", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  onClick={() => setIsScheduleModalOpen(false)}
                  style={{ padding: "0.55rem 1.25rem", borderRadius: "8px", backgroundColor: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSchedule}
                  style={{ padding: "0.55rem 1.4rem", borderRadius: "8px", backgroundColor: "#2563EB", color: "#FFFFFF", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 10px rgba(37, 99, 235, 0.2)" }}
                >
                  Save Schedule
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ROW DETAILS MODAL */}
      <AnimatePresence>
        {selectedLogRow && (
          <div style={{ position: "fixed", inset: 0, zIndex: 999, backgroundColor: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", width: "100%", maxWidth: "500px", padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1E293B", margin: 0 }}>Activity Log Details</h3>
                <button onClick={() => setSelectedLogRow(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}><X size={18} /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "13px" }}>
                <div><strong>Timestamp:</strong> {formatLogTimestamp(selectedLogRow.createdAt || selectedLogRow.timestamp)}</div>
                <div><strong>Performed By:</strong> {selectedLogRow.userName || selectedLogRow.user?.name || selectedLogRow.user}</div>
                <div><strong>Action:</strong> {formatAction(selectedLogRow.action)}</div>
                <div><strong>Item / Supplier:</strong> {formatLogItem(selectedLogRow.item || selectedLogRow.supplier)}</div>
                <div><strong>Details:</strong> {formatDetails(selectedLogRow.details)}</div>
              </div>
              <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
                <button onClick={() => setSelectedLogRow(null)} style={{ padding: "0.5rem 1.2rem", borderRadius: "8px", backgroundColor: "#2563EB", color: "#FFFFFF", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
