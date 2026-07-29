import React, { useState, useEffect, useRef, useMemo } from "react";
import { CatalogItem, getCategoryIcon, RoleBadge, SiteBadge, EidBadge, AssetTagBadge, AssetTypeBadge } from "@/types/dashboard";
import jsPDF from "jspdf";
import { RequestTimeline } from "./RequestTimeline";
import { getApiUrl } from "../../../utils/api";

// ── Count-Up Animation Hook for Premium Stats Numbers (matching Reports & Logs) ──
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
      const ease = 1 - Math.pow(1 - progress, 3);
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

function AnimatedNumber({ value }: { value: number }) {
  const animatedValue = useCountUp(value);
  return <>{animatedValue}</>;
}

interface CatalogTabProps {
  isUsingMockData: boolean;
  catalogItems: CatalogItem[];
  sites: any[];
  categories: any[];
  selectedSiteId: string;
  setSelectedSiteId: (s: string) => void;
  catalogSearch: string;
  setCatalogSearch: (s: string) => void;
  catalogCategoryFilter: string;
  setCatalogCategoryFilter: (s: string) => void;
  catalogStockFilter: string;
  setCatalogStockFilter: (s: string) => void;
  catalogViewMode: "list" | "grid";
  setCatalogViewMode: (m: "list" | "grid") => void;
  catalogSortKey: string;
  setCatalogSortKey: (s: string) => void;
  selectedItemIds: string[];
  filteredItems: CatalogItem[];
  isLoadingItems: boolean;
  onToggleSelectItem: (id: string, isMultiSelectMode?: boolean) => void;
  onToggleSelectAll: () => void;
  onClearSelection?: () => void;
  onExportCSV: () => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (item: CatalogItem) => void;
  onOpenStockModal: (item: CatalogItem) => void;
  onOpenViewTags: (item: CatalogItem) => void;
  onDeleteTarget: (type: "item" | "bulk_items", id: string, name: string) => void;
  onOpenHistoryModal: (item: CatalogItem) => void;
  onOpenScanModal?: () => void;
  currentUser: any;
  onOpenBulkRequestModal: (mode: 'deploy' | 'request') => void;
  setCatalogItems?: React.Dispatch<React.SetStateAction<CatalogItem[]>>;
  activeSubTab?: "inventory" | "deployments";
  onUpdateCatalog?: () => void;
}

export const CatalogTab = ({
  isUsingMockData,
  catalogItems,
  setCatalogItems,
  sites,
  categories,
  selectedSiteId,
  setSelectedSiteId,
  catalogSearch,
  setCatalogSearch,
  catalogCategoryFilter,
  setCatalogCategoryFilter,
  catalogStockFilter,
  setCatalogStockFilter,
  catalogViewMode,
  setCatalogViewMode,
  catalogSortKey,
  setCatalogSortKey,
  selectedItemIds,
  filteredItems,
  isLoadingItems,
  onToggleSelectItem,
  onToggleSelectAll,
  onClearSelection,
  onExportCSV,
  onOpenAddModal,
  onOpenEditModal,
  onOpenStockModal,
  onOpenViewTags,
  onDeleteTarget,
  onOpenHistoryModal,
  onOpenScanModal,
  currentUser,
  onOpenBulkRequestModal,
  activeSubTab = "inventory",
  onUpdateCatalog,
}: CatalogTabProps) => {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Asset Deployments Sub-module states
  const [catalogSubTab, setCatalogSubTab] = useState<"inventory" | "deployments">(activeSubTab);

  useEffect(() => {
    if (activeSubTab) {
      setCatalogSubTab(activeSubTab);
    }
  }, [activeSubTab]);
  const [deploymentsList, setDeploymentsList] = useState<any[]>([]);
  const [selectedDeployment, setSelectedDeployment] = useState<any | null>(null);
  const [isDeploymentDrawerOpen, setIsDeploymentDrawerOpen] = useState(false);
  const [deploymentSearch, setDeploymentSearch] = useState("");
  const [deploymentSiteFilter, setDeploymentSiteFilter] = useState("ALL");
  const [deploymentStatusFilter, setDeploymentStatusFilter] = useState("ALL");
  const [deploymentCategoryTypeFilter, setDeploymentCategoryTypeFilter] = useState("ALL");
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<Record<string, boolean>>({});

  const filteredIds = filteredItems.map((it) => it.id);
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedItemIds.includes(id));
  const normalizedRole = (currentUser?.role || "").toUpperCase().replace(/[\s\-]/g, "_");
  const canEditAddRemove = ["SUPER_ADMIN", "ADMIN", "OPS_MANAGER", "OPERATIONS_MANAGER", "INVENTORY_STAFF"].includes(normalizedRole);
  const canAdjustStock = canEditAddRemove;
  const canAccessDeployments = ["SUPER_ADMIN", "ADMIN", "OPS_MANAGER", "OPERATIONS_MANAGER", "INVENTORY_STAFF"].includes(normalizedRole);

  useEffect(() => {
    if (!canAccessDeployments && catalogSubTab === "deployments") {
      setCatalogSubTab("inventory");
    }
  }, [canAccessDeployments, catalogSubTab]);

  const [returnModalDeployment, setReturnModalDeployment] = useState<any | null>(null);
  const [returnCondition, setReturnCondition] = useState<"GOOD" | "DAMAGED" | "MISSING">("GOOD");
  const [missingCount, setMissingCount] = useState<number>(1);
  const [returnNotes, setReturnNotes] = useState<string>("");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState<boolean>(false);

  // Bulk deployed asset return state
  const [selectedDeploymentIds, setSelectedDeploymentIds] = useState<string[]>([]);
  const [isBulkDeploymentReturnModalOpen, setIsBulkDeploymentReturnModalOpen] = useState(false);
  const [bulkReturnCondition, setBulkReturnCondition] = useState<"GOOD" | "DAMAGED" | "MISSING">("GOOD");
  const [bulkReturnNotes, setBulkReturnNotes] = useState("");
  const [isSubmittingBulkReturn, setIsSubmittingBulkReturn] = useState(false);

  // Show selection circles ONLY when explicit multi-select mode is active
  const showCircles = isMultiSelectMode;

  const mockDeployments = [
    {
      id: "REQ-2026-008",
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      requestedByName: "Inventory Staff",
      itemName: "Dell UltraSharp 27\" Monitor",
      assetTag: "TAG-MON-8801",
      siteId: "site-1",
      siteName: "Cebu IT Park",
      reason: "[ASSET DEPLOYMENT] Deploy to: Alex Mercer | Account: Support | EID: EID-9901 | Notes: Standard setup",
      employeeName: "Alex Mercer",
      employeeAccount: "Support",
      employeeEid: "EID-9901",
      status: "ACTIVE",
      returnCondition: "GOOD",
      missingCount: 0,
    },
    {
      id: "REQ-2026-009",
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      requestedByName: "Ops Manager",
      itemName: "Logitech MX Master 3S",
      assetTag: "TAG-ACC-4412",
      siteId: "site-2",
      siteName: "Davao HQ",
      reason: "[ASSET DEPLOYMENT] Deploy to: Sarah Jenkins | Account: Executive | EID: EID-78103",
      employeeName: "Sarah Jenkins",
      employeeAccount: "Executive",
      employeeEid: "EID-78103",
    }
  ];

  const fetchDeployments = async () => {
    let savedReturns: Record<string, any> = {};
    try {
      savedReturns = JSON.parse(localStorage.getItem("cp_returned_deployments") || "{}");
    } catch (e) {
      console.error("Error reading saved returns from localStorage:", e);
    }

    try {
      const res = await fetch("http://localhost:3001/requests");
      if (res.ok) {
        const envelope = await res.json();
        const raw = envelope.data || envelope;
        if (Array.isArray(raw)) {
          const filtered = raw.filter((req: any) =>
            req.reason && req.reason.includes("[ASSET DEPLOYMENT]")
          ).map((req: any) => {
            const saved = savedReturns[req.id];
            return {
              id: req.id,
              createdAt: req.createdAt || new Date().toISOString(),
              requestedByName: req.requestedByName || "Inventory Staff",
              itemName: req.itemName || "Assigned Asset",
              assetTag: req.assetTag || req.asset?.tagCode || req.asset?.assetTag || (req.reason ? req.reason.match(/Asset Tag:\s*([^|]+)/)?.[1]?.trim() : undefined) || undefined,
              siteId: req.siteId || req.requestedBySiteId || "site-1",
              siteName: req.siteName || "Cebu IT Park",
              reason: req.reason || `Deployed ${req.quantity || 1} x ${req.itemName || 'Asset'} to employee`,
              employeeName: req.reason ? (req.reason.match(/Deploy to:\s*([^|]+)/)?.[1]?.trim() || "N/A") : "N/A",
              employeeAccount: req.reason ? (req.reason.match(/Account:\s*([^|]+)/)?.[1]?.trim() || "N/A") : "N/A",
              employeeEid: req.reason ? (req.reason.match(/EID:\s*([^|]+)/)?.[1]?.trim() || "N/A") : "N/A",
              status: req.status || saved?.status || "ACTIVE",
              returnCondition: req.condition || saved?.returnCondition || "GOOD",
              missingCount: saved?.missingCount || req.missingCount || 0,
              returnNotes: req.returnComment || saved?.returnNotes || req.comment,
              returnedAt: req.returnedAt || saved?.returnedAt,
              rawRequest: req
            };
          });
          setDeploymentsList(filtered);
          return;
        }
      }
    } catch (err) {
      console.error("Error fetching deployments for CatalogTab:", err);
    }

    // Fallback merge for mockDeployments (offline mode only)
    const mergedMocks = mockDeployments.map(dep => {
      const saved = savedReturns[dep.id];
      return saved ? { ...dep, ...saved } : dep;
    });
    setDeploymentsList(mergedMocks);
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  const filteredDeployments = deploymentsList.filter(dep => {
    const matchesSite = deploymentSiteFilter === "ALL" || dep.siteId === deploymentSiteFilter;
    const isReturned = dep.status === "RETURNED";
    const matchesStatus =
      deploymentStatusFilter === "ALL" ? true :
        deploymentStatusFilter === "ACTIVE" ? !isReturned :
          deploymentStatusFilter === "RETURNED" ? isReturned : true;

    const itemObj = catalogItems.find(it => it.id === dep.rawRequest?.itemId || it.name === dep.itemName);
    const categoryType = itemObj?.category?.type || dep.rawRequest?.item?.category?.type || (dep.itemName?.toLowerCase().includes("battery") || dep.itemName?.toLowerCase().includes("cable") || dep.itemName?.toLowerCase().includes("pen") ? "CONSUMABLE" : "NON_CONSUMABLE");
    const matchesCategoryType =
      deploymentCategoryTypeFilter === "ALL" ? true : categoryType === deploymentCategoryTypeFilter;

    const q = deploymentSearch.toLowerCase();
    const matchesSearch =
      !q ||
      (dep.employeeName || "").toLowerCase().includes(q) ||
      (dep.employeeEid || "").toLowerCase().includes(q) ||
      (dep.employeeAccount || "").toLowerCase().includes(q) ||
      (dep.itemName || "").toLowerCase().includes(q) ||
      (dep.assetTag || "").toLowerCase().includes(q) ||
      (dep.id || "").toLowerCase().includes(q);
    return matchesSite && matchesStatus && matchesCategoryType && matchesSearch;
  });

  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroupKeys(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const groupedDeployments = useMemo(() => {
    const map = new Map<string, {
      key: string;
      employeeName: string;
      employeeAccount: string;
      employeeEid: string;
      siteName: string;
      requestedByName: string;
      requestedByRole: string;
      latestCreatedAt: string;
      items: any[];
      activeCount: number;
      returnedCount: number;
    }>();

    filteredDeployments.forEach((dep: any) => {
      const eidKey = (dep.employeeEid || "N/A").trim().toUpperCase();
      const nameKey = (dep.employeeName || "N/A").trim().toLowerCase();
      const acctKey = (dep.employeeAccount || "N/A").trim().toLowerCase();
      const key = `${eidKey}___${nameKey}___${acctKey}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          employeeName: dep.employeeName || "N/A",
          employeeAccount: dep.employeeAccount || "N/A",
          employeeEid: dep.employeeEid || "N/A",
          siteName: dep.siteName || "Cebu IT Park",
          requestedByName: dep.requestedByName || "Inventory Staff",
          requestedByRole: dep.requestedByRole || "INVENTORY_STAFF",
          latestCreatedAt: dep.createdAt,
          items: [],
          activeCount: 0,
          returnedCount: 0,
        });
      }

      const group = map.get(key)!;
      group.items.push(dep);
      if (dep.status === "RETURNED") {
        group.returnedCount++;
      } else {
        group.activeCount++;
      }
      if (new Date(dep.createdAt) > new Date(group.latestCreatedAt)) {
        group.latestCreatedAt = dep.createdAt;
        group.requestedByName = dep.requestedByName;
        group.requestedByRole = dep.requestedByRole;
        group.siteName = dep.siteName;
      }
    });

    return Array.from(map.values());
  }, [filteredDeployments]);

  const handleToggleExpandAll = () => {
    const hasUnexpanded = groupedDeployments.some(g => g.items.length > 1 && !expandedGroupKeys[g.key]);
    const newMap: Record<string, boolean> = {};
    groupedDeployments.forEach(g => {
      if (g.items.length > 1) {
        newMap[g.key] = hasUnexpanded;
      }
    });
    setExpandedGroupKeys(newMap);
  };

  const handleDownloadGroupReceipt = async (group: any) => {
    const items = group.items || [];
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Header Banner
    doc.setFillColor(33, 12, 174);
    doc.rect(0, 0, 210, 24, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text("GROUP HARDWARE ASSET DEPLOYMENT RECEIPT", 14, 15);

    // Logo
    try {
      const loadLogo = (): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = "/logo.png";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        });
      };

      const logoImg = await loadLogo();
      if (logoImg && logoImg.width > 0 && logoImg.height > 0) {
        const canvas = document.createElement("canvas");
        canvas.width = logoImg.width;
        canvas.height = logoImg.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(logoImg, 0, 0);
          const logoDataUrl = canvas.toDataURL("image/png");

          const badgeX = 155;
          const badgeY = 3;
          const badgeW = 44;
          const badgeH = 18;
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3, 3, 'F');

          const maxW = 38;
          const maxH = 14;
          const aspect = logoImg.width / logoImg.height;
          let renderW = maxW;
          let renderH = maxW / aspect;

          if (renderH > maxH) {
            renderH = maxH;
            renderW = maxH * aspect;
          }

          const renderX = badgeX + (badgeW - renderW) / 2;
          const renderY = badgeY + (badgeH - renderH) / 2;

          doc.addImage(logoDataUrl, "PNG", renderX, renderY, renderW, renderH);
        }
      }
    } catch (e) {
      console.error("Error drawing logo in group receipt PDF:", e);
    }

    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");
    doc.text(`Receipt Ref: GRP-${group.employeeEid || '0000'}-${Date.now().toString().slice(-6)}`, 14, 33);
    doc.text(`Issuance Date: ${new Date(group.latestCreatedAt).toLocaleDateString()}`, 14, 39);
    doc.text(`Total Assigned Assets: ${items.length}`, 110, 39);

    // Employee Custodian Information
    doc.setFillColor(245, 247, 250);
    doc.rect(14, 45, 182, 36, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("EMPLOYEE CUSTODIAN INFORMATION", 18, 53);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`Employee Name: ${group.employeeName}`, 18, 60);
    doc.text(`Employee ID (EID): ${group.employeeEid}`, 18, 66);
    doc.text(`Department / Account: ${group.employeeAccount}`, 18, 72);
    doc.text(`Site Location: ${group.siteName || 'Cebu IT Park'}`, 110, 60);
    doc.text(`Issuing Staff: ${group.requestedByName || 'Inventory Staff'}`, 110, 66);

    // Table of Deployed Assets
    const tableY = 88;
    doc.setFillColor(33, 12, 174);
    doc.rect(14, tableY, 182, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("#", 18, tableY + 5.5);
    doc.text("Item Name / Specification", 28, tableY + 5.5);
    doc.text("Asset Tag Code", 118, tableY + 5.5);
    doc.text("Status", 168, tableY + 5.5);

    let curY = tableY + 8;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(8.5);

    items.forEach((dep: any, index: number) => {
      const itemObj = catalogItems.find(it => it.id === dep.rawRequest?.itemId || it.name === dep.itemName);
      const catType = itemObj?.category?.type || dep.rawRequest?.item?.category?.type || (dep.itemName?.toLowerCase().includes("battery") || dep.itemName?.toLowerCase().includes("cable") || dep.itemName?.toLowerCase().includes("pen") ? "CONSUMABLE" : "NON_CONSUMABLE");
      const isConsumable = catType === "CONSUMABLE";
      const fallbackId = (dep.id || "").substring((dep.id || "").length - 4).toUpperCase() || "0000";
      const tag = isConsumable ? "N/A (Bulk Consumable)" : (dep.assetTag || dep.rawRequest?.assetTag || dep.rawRequest?.asset?.tagCode || `AST-${fallbackId}`);

      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, curY, 182, 7.5, 'F');
      }

      doc.text(`${index + 1}`, 18, curY + 5);
      doc.text(`${dep.itemName || 'Hardware Asset'}`, 28, curY + 5);
      doc.text(`${tag}`, 118, curY + 5);
      doc.text(`${dep.status || 'ACTIVE'}`, 168, curY + 5);

      curY += 7.5;
    });

    // Outer table border
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, tableY, 182, curY - tableY);

    // Signatures
    const sigY = Math.max(curY + 16, 180);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text("ACKNOWLEDGEMENT & SIGNATURE", 14, sigY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(
      "I acknowledge receipt of all the hardware equipment listed above in good working condition for official company use.",
      14,
      sigY + 6
    );

    // Signatures lines
    doc.setDrawColor(150, 150, 150);
    doc.line(14, sigY + 28, 90, sigY + 28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${group.employeeName}`, 14, sigY + 33);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Employee Custodian (${group.employeeEid})`, 14, sigY + 37);

    doc.line(110, sigY + 28, 186, sigY + 28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${group.requestedByName || 'Inventory Staff'}`, 110, sigY + 33);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Authorized Inventory Issuer", 110, sigY + 37);

    doc.save(`Group_Deployment_Receipt_${group.employeeEid || 'Record'}_${Date.now()}.pdf`);
  };

  const handleDownloadDeploymentReceipt = async (dep: any) => {
    const isReturned = dep.status === "RETURNED";
    const cond = dep.returnCondition || "GOOD";
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Header Banner: Contact Point 360 Brand Theme Color (#210cae)
    doc.setFillColor(33, 12, 174);
    doc.rect(0, 0, 210, 24, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(isReturned ? "HARDWARE ASSET RETURN RECEIPT" : "HARDWARE ASSET DEPLOYMENT RECEIPT", 14, 15);

    // Add Contact Point 360 Logo to top right of header banner
    try {
      const loadLogo = (): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = "/logo.png";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        });
      };

      const logoImg = await loadLogo();
      if (logoImg && logoImg.width > 0 && logoImg.height > 0) {
        const canvas = document.createElement("canvas");
        canvas.width = logoImg.width;
        canvas.height = logoImg.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(logoImg, 0, 0);
          const logoDataUrl = canvas.toDataURL("image/png");

          // White rounded background container pill for logo
          const badgeX = 155;
          const badgeY = 3;
          const badgeW = 44;
          const badgeH = 18;
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3, 3, 'F');

          // Preserve exact original aspect ratio without stretching
          const maxW = 38;
          const maxH = 14;
          const aspect = logoImg.width / logoImg.height;
          let renderW = maxW;
          let renderH = maxW / aspect;

          if (renderH > maxH) {
            renderH = maxH;
            renderW = maxH * aspect;
          }

          const renderX = badgeX + (badgeW - renderW) / 2;
          const renderY = badgeY + (badgeH - renderH) / 2;

          doc.addImage(logoDataUrl, "PNG", renderX, renderY, renderW, renderH);
        }
      }
    } catch (e) {
      console.error("Error drawing logo in receipt PDF:", e);
    }

    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`Receipt Ref: ${dep.id}`, 14, 34);
    doc.text(`Issuance Date: ${new Date(dep.createdAt).toLocaleDateString()}`, 14, 40);
    if (isReturned) {
      doc.text(`Return Date: ${dep.returnedAt ? new Date(dep.returnedAt).toLocaleDateString() : new Date().toLocaleDateString()}`, 110, 40);
    }

    // Employee Custodian Information
    doc.setFillColor(245, 247, 250);
    doc.rect(14, 46, 182, 38, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("EMPLOYEE CUSTODIAN INFORMATION", 18, 54);
    doc.setFont("helvetica", "normal");
    doc.text(`Employee Name: ${dep.employeeName}`, 18, 62);
    doc.text(`Employee ID (EID): ${dep.employeeEid}`, 18, 68);
    doc.text(`Department / Account: ${dep.employeeAccount}`, 18, 74);
    doc.text(`Site Location: ${dep.siteName || 'Cebu IT Park'}`, 18, 80);

    // Equipment & Condition Details Box
    doc.setFillColor(245, 247, 250);
    const boxHeight = isReturned ? 50 : 38;
    doc.rect(14, 90, 182, boxHeight, 'F');
    doc.setFont("helvetica", "bold");
    doc.text(isReturned ? "RETURNED EQUIPMENT & CONDITION DETAILS" : "ASSIGNED EQUIPMENT DETAILS", 18, 98);
    doc.setFont("helvetica", "normal");
    doc.text(`Item Description: ${dep.itemName}`, 18, 106);
    doc.text(`Asset Tag Code: ${dep.assetTag}`, 18, 112);

    if (isReturned) {
      const condLabel = cond === "DAMAGED"
        ? "DAMAGED (Requires Maintenance/Repair)"
        : cond === "MISSING"
          ? `MISSING ITEMS (${dep.missingCount || 1} item(s) missing)`
          : "GOOD WORKING CONDITION";

      doc.text(`Return Status: RETURNED TO SITE INVENTORY`, 18, 118);
      doc.text(`Condition on Return: ${condLabel}`, 18, 124);
      if (dep.returnNotes) {
        doc.setFontSize(8.5);
        doc.text(`Return Remarks & Notes: ${dep.returnNotes}`, 18, 130);
        doc.setFontSize(10);
      }
    } else {
      doc.text(`Issuing Staff: ${dep.requestedByName || 'Inventory Staff'}`, 18, 118);
    }

    // Signatures
    const sigY = isReturned ? 152 : 140;
    doc.setFont("helvetica", "bold");
    doc.text("ACKNOWLEDGEMENT & SIGNATURE", 14, sigY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(
      isReturned
        ? "I acknowledge the return of the hardware equipment specified above back into site inventory in the noted condition."
        : "I acknowledge receipt of the hardware equipment listed above in good working condition.",
      14,
      sigY + 7
    );

    const lineY = sigY + 35;
    doc.line(14, lineY, 90, lineY);
    doc.text(isReturned ? "Returning Employee Signature" : "Employee Signature", 14, lineY + 5);

    doc.line(120, lineY, 196, lineY);
    doc.text(isReturned ? "Receiving Inventory Staff Signature" : "Authorized Inventory Issuer Signature", 120, lineY + 5);

    const fileName = isReturned ? `Asset_Return_Receipt_${dep.employeeEid || dep.id}.pdf` : `Deployment_Receipt_${dep.employeeEid || dep.id}.pdf`;
    doc.save(fileName);
  };

  const handleOpenReturnModal = (dep: any) => {
    setReturnModalDeployment(dep);
    setReturnCondition("GOOD");
    setMissingCount(1);
    setReturnNotes("Returned in good working condition");
  };

  const handleConditionChange = (cond: "GOOD" | "DAMAGED" | "MISSING") => {
    setReturnCondition(cond);
    if (cond === "GOOD") {
      setReturnNotes("Returned in good working condition");
    } else if (cond === "DAMAGED") {
      setReturnNotes("Returned damaged - requires maintenance/repair");
    } else if (cond === "MISSING") {
      setReturnNotes(`Returned incomplete - ${missingCount} item(s) missing`);
    }
  };

  const handleMissingCountChange = (cnt: number) => {
    const val = Math.max(1, cnt);
    setMissingCount(val);
    if (returnCondition === "MISSING") {
      setReturnNotes(`Returned incomplete - ${val} item(s) missing`);
    }
  };

  const handleConfirmReturnAsset = async () => {
    if (!returnModalDeployment) return;
    setIsSubmittingReturn(true);
    const dep = returnModalDeployment;

    const finalComment = returnCondition === "MISSING"
      ? `[MISSING: ${missingCount}] ${returnNotes}`
      : returnCondition === "DAMAGED"
        ? `[DAMAGED] ${returnNotes}`
        : `[GOOD] ${returnNotes}`;

    const returnedAtStr = new Date().toISOString();

    try {
      if (!isUsingMockData && dep.id) {
        await fetch(getApiUrl(`/requests/${dep.id}/returned`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comment: finalComment,
            returnerEmail: currentUser?.email
          })
        });
      }
    } catch (err) {
      console.warn("Backend return status update error:", err);
    }

    const updatedDep = {
      ...dep,
      status: "RETURNED",
      returnCondition,
      missingCount: returnCondition === "MISSING" ? missingCount : 0,
      returnNotes: finalComment,
      returnedAt: returnedAtStr
    };

    // 1. Save returned state into localStorage so it persists across module switches
    try {
      const savedReturns = JSON.parse(localStorage.getItem("cp_returned_deployments") || "{}");
      savedReturns[dep.id] = updatedDep;
      localStorage.setItem("cp_returned_deployments", JSON.stringify(savedReturns));
    } catch (e) {
      console.error("Failed to save return state to localStorage:", e);
    }

    setDeploymentsList((prev: any[]) => prev.map((d: any) => d.id === dep.id ? updatedDep : d));

    if (selectedDeployment?.id === dep.id) {
      setSelectedDeployment(updatedDep);
    }

    // 2. Add returned items back into stock count in catalogItems & localStorage
    const totalQtyDeployed = dep.rawRequest?.quantity || 1;
    const itemsMissing = returnCondition === "MISSING" ? missingCount : 0;
    const qtyReturnedToStock = Math.max(0, totalQtyDeployed - itemsMissing);

    if (qtyReturnedToStock > 0 && setCatalogItems) {
      setCatalogItems((prevItems: CatalogItem[]) => {
        const updatedItems = prevItems.map((item) => {
          const isTargetItem =
            item.id === dep.rawRequest?.itemId ||
            (item.name || "").toLowerCase() === (dep.itemName || "").toLowerCase() ||
            (item.sku ? item.sku.toUpperCase() === (dep.assetTag || "").toUpperCase() : false);

          if (isTargetItem) {
            const currentQty = item.quantity ?? 0;
            const newQty = currentQty + qtyReturnedToStock;

            const targetSite = sites.find((s: any) => s.id === dep.siteId || s.name === dep.siteId || s.name === dep.siteLocation);
            const targetSiteId = targetSite ? targetSite.id : (dep.siteId || selectedSiteId);

            const updatedStockLevels = item.stockLevels?.map((sl) => {
              if (sl.siteId === targetSiteId || (targetSite && sl.siteId === targetSite.id)) {
                return { ...sl, quantity: sl.quantity + qtyReturnedToStock };
              }
              return sl;
            });

            // For non-consumable assets: retrieve and restore asset tag & record back into available assets
            const catType = item.category?.type || dep.rawRequest?.item?.category?.type || (item.category?.name?.toLowerCase().includes("consumable") ? "CONSUMABLE" : "NON_CONSUMABLE");
            const isNonConsumable = catType === "NON_CONSUMABLE";

            let updatedAssets = item.assets || [];
            if (isNonConsumable) {
              const returnedTag = dep.assetTag || dep.rawRequest?.assetTag || dep.rawRequest?.asset?.tagCode || dep.rawRequest?.asset?.assetTag;
              if (returnedTag) {
                const existingAssetIdx = updatedAssets.findIndex(
                  a => a.tagCode === returnedTag || a.assetTag === returnedTag
                );
                const restoredStatus = returnCondition === "DAMAGED" ? "UNDER_MAINTENANCE" : "AVAILABLE";

                if (existingAssetIdx >= 0) {
                  updatedAssets = updatedAssets.map((a, idx) =>
                    idx === existingAssetIdx
                      ? { ...a, status: restoredStatus, siteId: dep.siteId || selectedSiteId }
                      : a
                  );
                } else {
                  updatedAssets = [
                    ...updatedAssets,
                    {
                      id: dep.rawRequest?.assetId || `ast-${Date.now().toString(36)}`,
                      tagCode: returnedTag,
                      assetTag: returnedTag,
                      status: restoredStatus,
                      itemId: item.id,
                      siteId: dep.siteId || selectedSiteId,
                      condition: returnCondition
                    }
                  ];
                }
              }
            }

            return {
              ...item,
              quantity: newQty,
              stockLevels: updatedStockLevels || item.stockLevels,
              assets: updatedAssets
            };
          }
          return item;
        });

        // Persist updated catalog items into localStorage cache
        try {
          localStorage.setItem("cp_inventory_catalog", JSON.stringify(updatedItems));
        } catch (e) {
          console.error("Failed to persist updated catalog items to localStorage:", e);
        }

        return updatedItems;
      });
    }

    setIsSubmittingReturn(false);
    setReturnModalDeployment(null);
    if (onUpdateCatalog) onUpdateCatalog();
    fetchDeployments();
  };

  const toggleMultiSelectMode = () => {
    if (isMultiSelectMode) {
      // Exit multi select mode and clear selections if active
      setIsMultiSelectMode(false);
      if (onClearSelection) {
        onClearSelection();
      } else if (allSelected) {
        onToggleSelectAll();
      }
    } else {
      // Enter multi select mode
      setIsMultiSelectMode(true);
    }
  };

  const handleBulkDeploymentReturn = async () => {
    if (selectedDeploymentIds.length === 0) return;
    setIsSubmittingBulkReturn(true);
    const returnedAtStr = new Date().toISOString();
    const finalComment = bulkReturnCondition === "MISSING"
      ? `[MISSING] ${bulkReturnNotes || 'Bulk return - items missing'}`
      : bulkReturnCondition === "DAMAGED"
        ? `[DAMAGED] ${bulkReturnNotes || 'Bulk return - damaged condition'}`
        : `[GOOD] ${bulkReturnNotes || 'Bulk return - good condition'}`;

    const deploymentsToReturn = deploymentsList.filter((d: any) => selectedDeploymentIds.includes(d.id));

    for (const dep of deploymentsToReturn) {
      try {
        if (!isUsingMockData && dep.id) {
          await fetch(getApiUrl(`/requests/${dep.id}/returned`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comment: finalComment, returnerEmail: currentUser?.email })
          });
        }
      } catch (err) {
        console.warn(`Bulk return backend error for ${dep.id}:`, err);
      }

      const updatedDep = {
        ...dep,
        status: "RETURNED",
        returnCondition: bulkReturnCondition,
        returnNotes: finalComment,
        returnedAt: returnedAtStr
      };

      // Persist to localStorage
      try {
        const savedReturns = JSON.parse(localStorage.getItem("cp_returned_deployments") || "{}");
        savedReturns[dep.id] = updatedDep;
        localStorage.setItem("cp_returned_deployments", JSON.stringify(savedReturns));
      } catch (e) {
        console.error("Failed to save bulk return state:", e);
      }

      setDeploymentsList((prev: any[]) => prev.map((d: any) => d.id === dep.id ? updatedDep : d));

      // Restore stock
      const totalQtyDeployed = dep.rawRequest?.quantity || 1;
      const qtyReturnedToStock = totalQtyDeployed;
      if (qtyReturnedToStock > 0 && setCatalogItems) {
        setCatalogItems((prevItems: CatalogItem[]) => {
          const updatedItems = prevItems.map((item) => {
            const isTargetItem =
              item.id === dep.rawRequest?.itemId ||
              (item.name || "").toLowerCase() === (dep.itemName || "").toLowerCase();
            if (!isTargetItem) return item;

            const newQty = (item.quantity ?? 0) + qtyReturnedToStock;
            const targetSite = sites.find((s: any) => s.id === dep.siteId || s.name === dep.siteLocation);
            const targetSiteId = targetSite ? targetSite.id : dep.siteId;
            const updatedStockLevels = item.stockLevels?.map((sl) =>
              sl.siteId === targetSiteId ? { ...sl, quantity: sl.quantity + qtyReturnedToStock } : sl
            );

            const catType = item.category?.type || "NON_CONSUMABLE";
            let updatedAssets = item.assets || [];
            if (catType === "NON_CONSUMABLE") {
              const returnedTag = dep.assetTag || dep.rawRequest?.assetTag || dep.rawRequest?.asset?.tagCode;
              if (returnedTag) {
                const restoredStatus = bulkReturnCondition === "DAMAGED" ? "UNDER_MAINTENANCE" : "AVAILABLE";
                const existingIdx = updatedAssets.findIndex((a: any) => a.tagCode === returnedTag || a.assetTag === returnedTag);
                if (existingIdx >= 0) {
                  updatedAssets = updatedAssets.map((a: any, idx: number) =>
                    idx === existingIdx ? { ...a, status: restoredStatus } : a
                  );
                }
              }
            }

            return { ...item, quantity: newQty, stockLevels: updatedStockLevels || item.stockLevels, assets: updatedAssets };
          });
          try { localStorage.setItem("cp_inventory_catalog", JSON.stringify(updatedItems)); } catch {}
          return updatedItems;
        });
      }
    }

    setIsSubmittingBulkReturn(false);
    setIsBulkDeploymentReturnModalOpen(false);
    setSelectedDeploymentIds([]);
    setBulkReturnNotes("");
    setBulkReturnCondition("GOOD");
    if (onUpdateCatalog) onUpdateCatalog();
    fetchDeployments();
  };

  return (
    <div className="animate-module-flip" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Warnings & Notices */}
      {isUsingMockData && (
        <div style={{
          padding: "0.85rem 1.25rem",
          backgroundColor: "#fffbeb",
          borderLeft: "4px solid #f59e0b",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          boxShadow: "0 2px 4px rgba(245,158,11,0.05)",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div style={{ fontSize: "0.82rem", color: "#b45309", fontWeight: 500 }}>
            <strong>Offline Simulation Mode:</strong> The NestJS backend database connection is unreachable. The application is running using safe client-side data. New items will be created in temporary local storage.
          </div>
        </div>
      )}

      {catalogSubTab === "inventory" && (
        <div className="table-container-fade" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Items Summary Cards */}
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
            {[
              {
                title: "Total Catalog Items",
                value: catalogItems.length,
                desc: "Configured catalog SKUs",
                trend: "↑ 12% from last month",
                trendPositive: true,
                bgColor: "#EFF6FF",
                accentColor: "#2563EB",
                iconColor: "#1D4ED8",
                iconBg: "#DBEAFE",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 20.73 7 12 12 3.27 7" />
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                )
              },
              {
                title: "Consumables",
                value: catalogItems.filter(it => it.category?.type === "CONSUMABLE").length,
                desc: "Non-serialized items",
                trend: "↑ 5% from last month",
                trendPositive: true,
                bgColor: "#ECFDF5",
                accentColor: "#059669",
                iconColor: "#047857",
                iconBg: "#D1FAE5",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                  </svg>
                )
              },
              {
                title: "Non-Consumables",
                value: catalogItems.filter(it => it.category?.type === "NON_CONSUMABLE").length,
                desc: "Serialized assets",
                trend: "↑ 8% from last month",
                trendPositive: true,
                bgColor: "#F5F3FF",
                accentColor: "#7C3AED",
                iconColor: "#6D28D9",
                iconBg: "#DDD6FE",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                )
              },
              {
                title: "Low Stock",
                filterStock: "LOW_STOCK",
                value: catalogItems.filter(it => {
                  const siteStock = (selectedSiteId && selectedSiteId !== "ALL") ? it.stockLevels?.find(sl => sl.siteId === selectedSiteId) : null;
                  const qty = (selectedSiteId && selectedSiteId !== "ALL")
                    ? (siteStock ? siteStock.quantity : 0)
                    : (it.stockLevels && it.stockLevels.length > 0 ? it.stockLevels.reduce((acc, sl) => acc + (sl.quantity || 0), 0) : (it.quantity || 0));
                  const min = siteStock ? siteStock.reorderPoint : (it.reorderPoint || 5);
                  return qty <= min;
                }).length,
                desc: catalogStockFilter === "LOW_STOCK" ? "Filtering low stock SKUs" : "Requires reorder attention",
                trend: "↓ 3% from yesterday",
                trendPositive: true,
                bgColor: "#FEF2F2",
                accentColor: "#DC2626",
                iconColor: "#B91C1C",
                iconBg: "#FEE2E2",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )
              },
            ].map((item: any, idx) => (
              <div key={idx}
                className="metric-card"
                onClick={() => {
                  if (item.filterStock) {
                    setCatalogStockFilter(catalogStockFilter === item.filterStock ? "ALL" : item.filterStock);
                  }
                }}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: "0 4px 12px rgba(0,0,0,.05)",
                  border: item.filterStock && catalogStockFilter === item.filterStock ? "2px solid #DC2626" : "1px solid #E5E7EB",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  cursor: item.filterStock ? "pointer" : "default",
                  transition: "all 0.2s ease-in-out",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.05)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    {item.title}
                  </span>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    backgroundColor: item.iconBg,
                    color: item.iconColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {item.icon}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "34px", fontWeight: 700, color: "#111827", lineHeight: 1.1 }}>
                    <AnimatedNumber value={item.value} />
                  </span>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
                    <span style={{ fontSize: "12px", color: "#6B7280" }}>
                      {item.desc}
                    </span>
                    <span style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: item.trendPositive ? (item.title === "Low Stock" ? "#059669" : "#059669") : "#DC2626",
                      backgroundColor: item.bgColor,
                      padding: "2px 8px",
                      borderRadius: "12px",
                    }}>
                      {item.trend}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Filter and Action Bar */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "20px 24px",
              boxShadow: "0 4px 12px rgba(0,0,0,.05)",
              border: "1px solid #E5E7EB",
            }}
          >
            <div style={{ display: "flex", flex: 1, flexWrap: "wrap", gap: "1rem", minWidth: "280px" }}>
              {/* Search */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "240px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280" }}>Search Assets</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  <input
                    type="text"
                    placeholder="Search Asset Tag, Name, SKU, Description..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 40px 10px 42px",
                      borderRadius: "10px",
                      border: "1px solid #E5E7EB",
                      fontSize: "14px",
                      color: "#111827",
                      backgroundColor: "#F9FAFB",
                      outline: "none",
                      transition: "all 0.15s ease-in-out",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.border = "2px solid #DC2626";
                      e.currentTarget.style.backgroundColor = "#FFFFFF";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.border = "1px solid #E5E7EB";
                      e.currentTarget.style.backgroundColor = "#F9FAFB";
                    }}
                  />
                  {onOpenScanModal && (
                    <button
                      type="button"
                      onClick={onOpenScanModal}
                      title="Scan Barcode / Tag Code"
                      style={{
                        position: "absolute",
                        right: 8,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#6B7280",
                        padding: "6px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F3F4F6"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Site Scope Selector */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "160px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280" }}>Viewing Site</label>
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  style={{
                    height: "42px",
                    padding: "0 12px",
                    borderRadius: "10px",
                    border: "1px solid #E5E7EB",
                    fontSize: "14px",
                    color: "#111827",
                    backgroundColor: "#F9FAFB",
                    outline: "none",
                    cursor: "pointer",
                  }}
                  onFocus={(e) => e.currentTarget.style.border = "2px solid #DC2626"}
                  onBlur={(e) => e.currentTarget.style.border = "1px solid #E5E7EB"}
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.prefix})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "160px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280" }}>Category</label>
                <select
                  value={catalogCategoryFilter}
                  onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                  style={{
                    height: "42px",
                    padding: "0 12px",
                    borderRadius: "10px",
                    border: "1px solid #E5E7EB",
                    fontSize: "14px",
                    color: "#111827",
                    backgroundColor: "#F9FAFB",
                    outline: "none",
                    cursor: "pointer",
                  }}
                  onFocus={(e) => e.currentTarget.style.border = "2px solid #DC2626"}
                  onBlur={(e) => e.currentTarget.style.border = "1px solid #E5E7EB"}
                >
                  <option value="ALL">All Categories</option>
                  <option value="NON_CONSUMABLE">All Non-Consumables</option>
                  <option value="CONSUMABLE">All Consumables</option>
                  {categories.filter(c => c.type === "NON_CONSUMABLE" || (c.type !== "CONSUMABLE" && !c.name.toLowerCase().includes("consumable"))).length > 0 && (
                    <optgroup label="Non-Consumable">
                      {categories.filter(c => c.type === "NON_CONSUMABLE" || (c.type !== "CONSUMABLE" && !c.name.toLowerCase().includes("consumable"))).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {categories.filter(c => c.type === "CONSUMABLE" || c.name.toLowerCase().includes("consumable")).length > 0 && (
                    <optgroup label="Consumable">
                      {categories.filter(c => c.type === "CONSUMABLE" || c.name.toLowerCase().includes("consumable")).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Stock Status Filter */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "140px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280" }}>Stock Status</label>
                <select
                  value={catalogStockFilter}
                  onChange={(e) => setCatalogStockFilter(e.target.value)}
                  style={{
                    height: "42px",
                    padding: "0 12px",
                    borderRadius: "10px",
                    border: "1px solid #E5E7EB",
                    fontSize: "14px",
                    color: "#111827",
                    backgroundColor: "#F9FAFB",
                    outline: "none",
                    cursor: "pointer",
                  }}
                  onFocus={(e) => e.currentTarget.style.border = "2px solid #DC2626"}
                  onBlur={(e) => e.currentTarget.style.border = "1px solid #E5E7EB"}
                >
                  <option value="ALL">All Levels</option>
                  <option value="LOW_STOCK">Low Stock Warning</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
              </div>

              {/* Sort Order Selector */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "150px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280" }}>Sort By</label>
                <select
                  value={catalogSortKey}
                  onChange={(e) => setCatalogSortKey(e.target.value)}
                  style={{
                    height: "42px",
                    padding: "0 12px",
                    borderRadius: "10px",
                    border: "1px solid #E5E7EB",
                    fontSize: "14px",
                    color: "#111827",
                    backgroundColor: "#F9FAFB",
                    outline: "none",
                    cursor: "pointer",
                  }}
                  onFocus={(e) => e.currentTarget.style.border = "2px solid #DC2626"}
                  onBlur={(e) => e.currentTarget.style.border = "1px solid #E5E7EB"}
                >
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                  <option value="price_asc">Price (Low to High)</option>
                  <option value="price_desc">Price (High to Low)</option>
                  <option value="stock_asc">Stock Level (Low to High)</option>
                  <option value="stock_desc">Stock Level (High to Low)</option>
                </select>
              </div>
            </div>

            {/* Action buttons (Add, CSV Export, Toggle View Mode) */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "auto" }}>
              {/* List/Grid view toggle */}
              <div style={{
                display: "inline-flex",
                backgroundColor: "#F3F4F6",
                padding: "3px",
                borderRadius: "10px",
                border: "1px solid #E5E7EB",
              }}>
                <button
                  onClick={() => setCatalogViewMode("list")}
                  style={{
                    height: "36px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    border: "none",
                    background: catalogViewMode === "list" ? "#FFFFFF" : "transparent",
                    color: catalogViewMode === "list" ? "#111827" : "#6B7280",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: catalogViewMode === "list" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                  List
                </button>
                <button
                  onClick={() => setCatalogViewMode("grid")}
                  style={{
                    height: "36px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    border: "none",
                    background: catalogViewMode === "grid" ? "#FFFFFF" : "transparent",
                    color: catalogViewMode === "grid" ? "#111827" : "#6B7280",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: catalogViewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                  Grid
                </button>
              </div>

              <button
                onClick={onExportCSV}
                style={{
                  height: "42px",
                  padding: "0 16px",
                  borderRadius: "10px",
                  border: "1px solid #E5E7EB",
                  background: "#FFFFFF",
                  color: "#374151",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F9FAFB"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#FFFFFF"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Export CSV
              </button>

              {canEditAddRemove && (
                <button
                  onClick={onOpenAddModal}
                  style={{
                    height: "42px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "#6366F1",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "10px",
                    padding: "0 18px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(99, 102, 241, 0.25)",
                    transition: "all 0.2s ease-in-out",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#4F46E5";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 14px rgba(99, 102, 241, 0.35)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#6366F1";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(99, 102, 241, 0.25)";
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  + Add Asset
                </button>
              )}
            </div>
          </div>

          {/* Catalog Listing Card */}
          <div
            className="animated-mesh-background"
            style={{
              borderRadius: 12,
              boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(77,201,230,0.3)",
              padding: "1.25rem 1.5rem 1.5rem",
              overflow: "hidden"
            }}
          >
            {/* Upper Left Multi-Select Trigger Button Header (Exact Red Dot Position) */}
            {!isLoadingItems && filteredItems.length > 0 && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}>
                <button
                  type="button"
                  onClick={toggleMultiSelectMode}
                  title={showCircles ? "Exit Multi-Select Mode" : "Enable Multi-Select Mode"}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.45rem 0.85rem",
                    borderRadius: 8,
                    border: showCircles ? "2px solid #210cae" : "1px solid #cbd5e1",
                    backgroundColor: showCircles ? "#f0f4fe" : "#ffffff",
                    color: showCircles ? "#210cae" : "#475569",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: showCircles ? "0 2px 6px rgba(33,12,174,0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!showCircles) {
                      e.currentTarget.style.borderColor = "#210cae";
                      e.currentTarget.style.backgroundColor = "#f8fafc";
                      e.currentTarget.style.color = "#210cae";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!showCircles) {
                      e.currentTarget.style.borderColor = "#cbd5e1";
                      e.currentTarget.style.backgroundColor = "#ffffff";
                      e.currentTarget.style.color = "#475569";
                    }
                  }}
                >
                  <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: showCircles ? "2px solid #210cae" : "2px solid #94a3b8",
                    backgroundColor: showCircles ? "#210cae" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}>
                    {showCircles && (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span>{showCircles ? `Multi-Select Active (${selectedItemIds.length})` : "Select Multiple"}</span>
                </button>
              </div>
            )}

            {isLoadingItems ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 0", gap: "1rem" }}>
                <div style={{
                  width: 28, height: 28,
                  borderRadius: "50%",
                  border: "3px solid #e2e8f0",
                  borderTopColor: "#210cae",
                  animation: "spin 1s linear infinite",
                }} />
                <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 500 }}>Fetching catalog records...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 1rem", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", marginBottom: "0.75rem" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
                </div>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#3f3f46", margin: "0 0 0.25rem 0" }}>No Assets Found</h4>
                <p style={{ fontSize: "0.78rem", color: "#71717a", maxWidth: 280, margin: 0 }}>
                  {catalogItems.length === 0 ? "No inventory assets created. Click 'Add Asset' to start cataloging product stock." : "No records match your active category, stock status, or search filters."}
                </p>
              </div>
            ) : catalogViewMode === "list" ? (
              /* List table layout */
              <div style={{ overflowX: "auto" }}>
                {/* Bulk select action banner bar - Enabled ONLY when explicit multi-select mode is active */}
                {isMultiSelectMode && selectedItemIds.length > 0 && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#f0f4fe",
                    borderRadius: "10px",
                    padding: "0.75rem 1rem",
                    marginBottom: "1.25rem",
                    border: "1px solid #c7d2fe",
                    boxShadow: "0 2px 8px rgba(33, 12, 174, 0.06)",
                    animation: "fadeIn 0.2s ease-in-out",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        backgroundColor: "#210cae",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                      }}>
                        {selectedItemIds.length}
                      </div>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e1b4b" }}>
                        {selectedItemIds.length} {selectedItemIds.length === 1 ? "Asset" : "Assets"} Selected
                      </span>
                      {selectedItemIds.length < filteredItems.length && (
                        <button
                          onClick={onToggleSelectAll}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            backgroundColor: "#ffffff",
                            border: "1px solid #c7d2fe",
                            borderRadius: "7px",
                            color: "#210cae",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            padding: "0.35rem 0.65rem",
                            cursor: "pointer",
                            boxShadow: "0 1px 2px rgba(33,12,174,0.05)",
                            transition: "all 0.15s ease",
                            marginLeft: "0.5rem",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e0e7ff"; e.currentTarget.style.borderColor = "#818cf8"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; e.currentTarget.style.borderColor = "#c7d2fe"; }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 11 12 14 22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                          </svg>
                          Select All Visible ({filteredItems.length})
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (onClearSelection) {
                            onClearSelection();
                          } else if (allSelected) {
                            onToggleSelectAll();
                          }
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          backgroundColor: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "7px",
                          color: "#64748b",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          padding: "0.35rem 0.65rem",
                          cursor: "pointer",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                          transition: "all 0.15s ease",
                          marginLeft: "0.35rem",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; e.currentTarget.style.color = "#0f172a"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; e.currentTarget.style.color = "#64748b"; }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Clear Selection
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "0.65rem", alignItems: "center" }}>
                      {/* Request Asset button — always visible */}
                      <button
                        onClick={() => onOpenBulkRequestModal('request')}
                        className="btn-hover-effect"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.45rem",
                          background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                          border: "none",
                          borderRadius: "8px",
                          color: "#ffffff",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          padding: "0.45rem 1rem",
                          cursor: "pointer",
                          boxShadow: "0 2px 6px rgba(124, 58, 237, 0.25)",
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(124, 58, 237, 0.35)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 6px rgba(124, 58, 237, 0.25)";
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                          <line x1="3" y1="6" x2="21" y2="6"></line>
                          <path d="M16 10a4 4 0 0 1-8 0"></path>
                        </svg>
                        Request Asset
                      </button>

                      {/* Deploy Asset button — only for privileged roles */}
                      {(currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "INVENTORY_STAFF" || currentUser?.role === "OPS_MANAGER" || currentUser?.role === "ADMIN") && (
                        <button
                          onClick={() => onOpenBulkRequestModal('deploy')}
                          className="btn-hover-effect"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.45rem",
                            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                            border: "none",
                            borderRadius: "8px",
                            color: "#ffffff",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            padding: "0.45rem 1rem",
                            cursor: "pointer",
                            boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.35)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 6px rgba(37, 99, 235, 0.25)";
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="20" y1="8" x2="20" y2="14"></line>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                          </svg>
                          Deploy Asset
                        </button>
                      )}

                      {canEditAddRemove && (
                        <button
                          onClick={() => onDeleteTarget("bulk_items", "bulk", "Selected Items")}
                          className="btn-hover-effect"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.45rem",
                            backgroundColor: "#ffffff",
                            border: "1px solid #fecaca",
                            borderRadius: "8px",
                            color: "#dc2626",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            padding: "0.45rem 1rem",
                            cursor: "pointer",
                            boxShadow: "0 1px 3px rgba(220, 38, 38, 0.08)",
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#fef2f2";
                            e.currentTarget.style.borderColor = "#f87171";
                            e.currentTarget.style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#ffffff";
                            e.currentTarget.style.borderColor = "#fecaca";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          Delete Selected ({selectedItemIds.length})
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, textAlign: "left", fontSize: "14px" }}>
                  <thead style={{ position: "sticky", top: 0, backgroundColor: "#F9FAFB", zIndex: 10 }}>
                    <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                      <th style={{ padding: "12px 16px", width: "48px", textAlign: "center", borderBottom: "1px solid #E5E7EB", position: "sticky", left: 0, backgroundColor: "#F9FAFB", zIndex: 11 }}>
                        <button
                          type="button"
                          onClick={onToggleSelectAll}
                          title={allSelected ? "Deselect All" : "Select All"}
                          aria-label="Select All Items"
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: allSelected ? "2px solid #DC2626" : "2px solid #D1D5DB",
                            backgroundColor: allSelected ? "#DC2626" : "transparent",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            transition: "all 0.2s ease",
                            outline: "none",
                          }}
                        >
                          {allSelected && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      </th>
                      <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600, fontSize: "12px", borderBottom: "1px solid #E5E7EB", position: "sticky", left: "48px", backgroundColor: "#F9FAFB", zIndex: 11 }}>Asset / SKU</th>
                      <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600, fontSize: "12px", borderBottom: "1px solid #E5E7EB" }}>Category</th>
                      <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600, fontSize: "12px", borderBottom: "1px solid #E5E7EB" }}>Category Type</th>
                      <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600, fontSize: "12px", borderBottom: "1px solid #E5E7EB" }}>Unit Price</th>
                      <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600, fontSize: "12px", borderBottom: "1px solid #E5E7EB" }}>Stock Level</th>
                      <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600, fontSize: "12px", borderBottom: "1px solid #E5E7EB", textAlign: "right" }}>Lead Time</th>
                      <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600, fontSize: "12px", borderBottom: "1px solid #E5E7EB", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((it, index) => {
                      const siteStock = (selectedSiteId && selectedSiteId !== "ALL") ? it.stockLevels?.find(sl => sl.siteId === selectedSiteId) : null;
                      const quantity = (selectedSiteId && selectedSiteId !== "ALL")
                        ? (siteStock ? siteStock.quantity : 0)
                        : (it.stockLevels && it.stockLevels.length > 0 ? it.stockLevels.reduce((acc, sl) => acc + (sl.quantity || 0), 0) : (it.quantity || 0));
                      const reorderPt = siteStock ? siteStock.reorderPoint : (it.reorderPoint || 5);
                      const isSelected = selectedItemIds.includes(it.id);

                      let stockColor = "#047857", bg = "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)", stockBorder = "#6EE7B7", stockLabel = "In Stock";
                      if (quantity === 0) {
                        stockColor = "#BE123C"; bg = "linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)"; stockBorder = "#FDA4AF"; stockLabel = "Out of Stock";
                      } else if (quantity <= reorderPt) {
                        stockColor = "#B45309"; bg = "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)"; stockBorder = "#FCD34D"; stockLabel = "Low Stock";
                      }

                      const isConsumable = it.category?.type === "CONSUMABLE";

                      return (
                        <tr key={it.id}
                          className="animated-row"
                          style={{
                            borderBottom: "1px solid #F3F4F6",
                            backgroundColor: isSelected ? "#FEF2F2" : undefined,
                            transition: "background-color 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = "#F9FAFB";
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <td style={{ padding: "14px 16px", textAlign: "center", borderBottom: "1px solid #F3F4F6", position: "sticky", left: 0, backgroundColor: isSelected ? "#FEF2F2" : "#FFFFFF", zIndex: 1 }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleSelectItem(it.id, showCircles);
                              }}
                              aria-label={`Select ${it.name}`}
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                border: isSelected ? "2px solid #DC2626" : "2px solid #D1D5DB",
                                backgroundColor: isSelected ? "#DC2626" : "#FFFFFF",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0,
                                transition: "all 0.2s ease",
                                outline: "none",
                              }}
                            >
                              {isSelected && (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </button>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#111827", borderBottom: "1px solid #F3F4F6", position: "sticky", left: "48px", backgroundColor: isSelected ? "#FEF2F2" : "#FFFFFF", zIndex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                backgroundColor: isConsumable ? "#EFF6FF" : "#F5F3FF",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                color: isConsumable ? "#1D4ED8" : "#6D28D9",
                              }}>
                                {getCategoryIcon(it.category?.name || "", it.name, 18)}
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                <span style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>{it.name}</span>
                                <span style={{ fontSize: "12px", color: "#6B7280" }}>SKU: {it.sku}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#6B7280", borderBottom: "1px solid #F3F4F6" }}>{it.category?.name || "Uncategorized"}</td>
                          <td style={{ padding: "14px 16px", borderBottom: "1px solid #F3F4F6" }}>
                            <AssetTypeBadge type={it.category?.type} categoryName={it.category?.name} size="sm" />
                          </td>
                          <td style={{ padding: "14px 16px", fontWeight: 600, color: "#111827", borderBottom: "1px solid #F3F4F6" }}>
                            ₱{(it.unitPrice || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "14px 16px", borderBottom: "1px solid #F3F4F6" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{
                                display: "inline-block",
                                padding: "3px 10px",
                                borderRadius: "9999px",
                                fontSize: "12px",
                                fontWeight: 700,
                                background: bg,
                                color: stockColor,
                                border: `1px solid ${stockBorder}`,
                                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                              }}>
                                {quantity} ({stockLabel})
                              </span>
                              <span style={{ fontSize: "12px", color: "#9CA3AF" }}>min {reorderPt}</span>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#6B7280", textAlign: "right", borderBottom: "1px solid #F3F4F6" }}>{it.leadTimeDays} {it.leadTimeDays === 1 ? "day" : "days"}</td>
                          <td style={{ padding: "14px 16px", textAlign: "right", borderBottom: "1px solid #F3F4F6" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              {canAdjustStock && (
                                <button
                                  onClick={() => onOpenStockModal(it)}
                                  style={{
                                    height: "32px",
                                    padding: "0 10px",
                                    borderRadius: "6px",
                                    backgroundColor: "#6366F1",
                                    color: "#FFFFFF",
                                    border: "none",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#4F46E5"}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#6366F1"}
                                >
                                  Adjust Stock
                                </button>
                              )}
                              {it.category?.type === "NON_CONSUMABLE" && (
                                <button
                                  onClick={() => onOpenViewTags(it)}
                                  title="View Asset Tags"
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid #E5E7EB",
                                    cursor: "pointer",
                                    color: "#374151",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F3F4F6"}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#FFFFFF"}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><circle cx="7" cy="7" r="1" /></svg>
                                </button>
                              )}
                              {canEditAddRemove && (
                                <button
                                  onClick={() => onOpenEditModal(it)}
                                  title="Edit Item Info"
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid #E5E7EB",
                                    cursor: "pointer",
                                    color: "#374151",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F3F4F6"}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#FFFFFF"}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                </button>
                              )}
                              <button
                                onClick={() => onOpenHistoryModal(it)}
                                title="View Change History"
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "50%",
                                  backgroundColor: "#FFFFFF",
                                  border: "1px solid #E5E7EB",
                                  cursor: "pointer",
                                  color: "#374151",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F3F4F6"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#FFFFFF"}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                              </button>
                              {canEditAddRemove && (
                                <button
                                  onClick={() => onDeleteTarget("item", it.id, it.name)}
                                  title="Delete Item"
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid #FEE2E2",
                                    cursor: "pointer",
                                    color: "#DC2626",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#FEE2E2"}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#FFFFFF"}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Grid view layout */
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Bulk select action banner bar - Enabled ONLY when explicit multi-select mode is active */}
                {isMultiSelectMode && selectedItemIds.length > 0 && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#f0f4fe",
                    borderRadius: "10px",
                    padding: "0.75rem 1rem",
                    border: "1px solid #c7d2fe",
                    boxShadow: "0 2px 8px rgba(33, 12, 174, 0.06)",
                    animation: "fadeIn 0.2s ease-in-out",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        backgroundColor: "#210cae",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                      }}>
                        {selectedItemIds.length}
                      </div>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e1b4b" }}>
                        {selectedItemIds.length} {selectedItemIds.length === 1 ? "Asset" : "Assets"} Selected
                      </span>
                      {selectedItemIds.length < filteredItems.length && (
                        <button
                          onClick={onToggleSelectAll}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            backgroundColor: "#ffffff",
                            border: "1px solid #c7d2fe",
                            borderRadius: "7px",
                            color: "#210cae",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            padding: "0.35rem 0.65rem",
                            cursor: "pointer",
                            boxShadow: "0 1px 2px rgba(33,12,174,0.05)",
                            transition: "all 0.15s ease",
                            marginLeft: "0.5rem",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e0e7ff"; e.currentTarget.style.borderColor = "#818cf8"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; e.currentTarget.style.borderColor = "#c7d2fe"; }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 11 12 14 22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                          </svg>
                          Select All Visible ({filteredItems.length})
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (onClearSelection) {
                            onClearSelection();
                          } else if (allSelected) {
                            onToggleSelectAll();
                          }
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          backgroundColor: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "7px",
                          color: "#64748b",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          padding: "0.35rem 0.65rem",
                          cursor: "pointer",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                          transition: "all 0.15s ease",
                          marginLeft: "0.35rem",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; e.currentTarget.style.color = "#0f172a"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; e.currentTarget.style.color = "#64748b"; }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Clear Selection
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                      {/* Request Asset button — always visible */}
                      <button
                        onClick={() => onOpenBulkRequestModal('request')}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          backgroundColor: "#7c3aed",
                          border: "none",
                          borderRadius: "7px",
                          color: "#ffffff",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          padding: "0.45rem 0.9rem",
                          cursor: "pointer",
                          boxShadow: "0 2px 5px rgba(124,58,237,0.2)",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#6d28d9"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#7c3aed"}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                        Request Asset
                      </button>

                      {/* Deploy Asset button — only for privileged roles */}
                      {(currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "INVENTORY_STAFF" || currentUser?.role === "OPS_MANAGER" || currentUser?.role === "ADMIN") && (
                        <button
                          onClick={() => onOpenBulkRequestModal('deploy')}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            backgroundColor: "#210cae",
                            border: "none",
                            borderRadius: "7px",
                            color: "#ffffff",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            padding: "0.45rem 0.9rem",
                            cursor: "pointer",
                            boxShadow: "0 2px 5px rgba(33,12,174,0.2)",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1a098c"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#210cae"}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                          Deploy Asset
                        </button>
                      )}

                      {canEditAddRemove && (
                        <button
                          onClick={() => onDeleteTarget("bulk_items", "bulk", "Selected Items")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            backgroundColor: "#fef2f2",
                            border: "1px solid #fca5a5",
                            borderRadius: "7px",
                            color: "#dc2626",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            padding: "0.45rem 0.9rem",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fee2e2"; e.currentTarget.style.borderColor = "#f87171"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fef2f2"; e.currentTarget.style.borderColor = "#fca5a5"; }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                          Delete Selected ({selectedItemIds.length})
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Grid cards */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
                  gap: "24px",
                }}>
                  {filteredItems.map((it) => {
                    const siteStock = (selectedSiteId && selectedSiteId !== "ALL") ? it.stockLevels?.find(sl => sl.siteId === selectedSiteId) : null;
                    const quantity = (selectedSiteId && selectedSiteId !== "ALL")
                      ? (siteStock ? siteStock.quantity : 0)
                      : (it.stockLevels && it.stockLevels.length > 0 ? it.stockLevels.reduce((acc, sl) => acc + (sl.quantity || 0), 0) : (it.quantity || 0));
                    const reorderPt = siteStock ? siteStock.reorderPoint : (it.reorderPoint || 5);
                    const isSelected = selectedItemIds.includes(it.id);
                    const fillPct = quantity === 0 ? 0 : Math.min((quantity / Math.max(reorderPt * 2, 10)) * 100, 100);

                    let stockBadgeColor = "#047857";
                    let stockBg = "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)";
                    let stockBorder = "#6EE7B7";
                    let stockLabel = "In Stock";
                    let progressBarColor = "linear-gradient(90deg, #10B981 0%, #059669 100%)";

                    if (quantity === 0) {
                      stockBadgeColor = "#BE123C";
                      stockBg = "linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)";
                      stockBorder = "#FDA4AF";
                      stockLabel = "Out of Stock";
                      progressBarColor = "#EF4444";
                    } else if (quantity <= reorderPt) {
                      stockBadgeColor = "#B45309";
                      stockBg = "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)";
                      stockBorder = "#FCD34D";
                      stockLabel = "Low Stock";
                      progressBarColor = "linear-gradient(90deg, #F59E0B 0%, #D97706 100%)";
                    }

                    const isConsumable = it.category?.type === "CONSUMABLE";

                    return (
                      <div
                        key={it.id}
                        className="catalog-card glitter-grid-card"
                        onClick={() => onToggleSelectItem(it.id, showCircles)}
                        style={{
                          backgroundColor: "#FFFFFF",
                          borderRadius: "16px",
                          border: isSelected ? "2px solid #6366F1" : "1px solid #E5E7EB",
                          display: "flex",
                          flexDirection: "column",
                          position: "relative",
                          overflow: "hidden",
                          transition: "all 0.2s ease-in-out",
                          boxShadow: isSelected
                            ? "0 0 0 3px rgba(220, 38, 38, 0.15), 0 8px 24px rgba(0,0,0,.08)"
                            : "0 4px 12px rgba(0,0,0,.05)",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.transform = "translateY(-3px)";
                            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.08)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.05)";
                          }
                        }}
                      >
                        {/* Card Header with circular selection button + icon + filled badges */}
                        <div style={{
                          padding: "20px 24px 16px",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "14px",
                          borderBottom: "1px solid #F3F4F6",
                        }}>
                          {/* Circular selection button to left of card - displayed ONLY when showCircles is true */}
                          {showCircles && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleSelectItem(it.id, showCircles);
                              }}
                              aria-label={`Select ${it.name}`}
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                border: isSelected ? "2px solid #DC2626" : "2px solid #D1D5DB",
                                backgroundColor: isSelected ? "#DC2626" : "#FFFFFF",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                marginTop: "2px",
                                padding: 0,
                                transition: "all 0.2s ease",
                                outline: "none",
                              }}
                            >
                              {isSelected && (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </button>
                          )}

                          {/* Large Lucide Product Icon in soft circular background */}
                          <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: "50%",
                            backgroundColor: isConsumable ? "#EFF6FF" : "#F5F3FF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            color: isConsumable ? "#1D4ED8" : "#6D28D9",
                          }}>
                            {getCategoryIcon(it.category?.name || "", it.name, 24)}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "6px" }}>
                              {/* Category Type Badge */}
                              <AssetTypeBadge type={it.category?.type} categoryName={it.category?.name} size="sm" />

                              {/* Stock Status Badge */}
                              <span className="glitter-status-badge" style={{
                                padding: "3px 10px",
                                borderRadius: "9999px",
                                fontSize: "11px",
                                fontWeight: 700,
                                background: stockBg,
                                color: stockBadgeColor,
                                border: `1px solid ${stockBorder}`,
                                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                              }}>
                                {stockLabel}
                              </span>
                            </div>
                            <h4 style={{
                              fontSize: "18px",
                              fontWeight: 600,
                              color: "#111827",
                              margin: 0,
                              lineHeight: 1.3,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              minHeight: "46px",
                            }}>
                              {it.name}
                            </h4>
                            <span className="glitter-category-badge" style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px", display: "inline-block", padding: "1px 6px", borderRadius: "4px" }}>
                              {it.category?.name || "Uncategorized"}
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px", flex: 1, justifyContent: "space-between" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* SKU / Asset Tag */}
                          <div style={{ minHeight: "26px", display: "flex", alignItems: "center" }}>
                            {it.sku ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: 500 }}>SKU:</span>
                                <code style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: "#374151",
                                  fontFamily: "'Inter', monospace",
                                  backgroundColor: "#F3F4F6",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  border: "1px solid #E5E7EB",
                                }}>
                                  {it.sku}
                                </code>
                              </div>
                            ) : null}
                          </div>

                          {/* Dedicated Supplier Section */}
                          {it.supplier && (
                            <div style={{
                              backgroundColor: "#F9FAFB",
                              borderRadius: "12px",
                              padding: "12px 14px",
                              border: "1px solid #E5E7EB",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: "6px",
                                  backgroundColor: "#EEF2FF",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#6366F1",
                                  flexShrink: 0,
                                }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                                    <path d="M9 22v-4h6v4" />
                                    <path d="M8 6h.01" />
                                    <path d="M16 6h.01" />
                                    <path d="M12 6h.01" />
                                    <path d="M12 10h.01" />
                                    <path d="M12 14h.01" />
                                    <path d="M16 10h.01" />
                                    <path d="M16 14h.01" />
                                    <path d="M8 10h.01" />
                                    <path d="M8 14h.01" />
                                  </svg>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                  <span className="glitter-supplier-name-badge" style={{ fontSize: "13px", fontWeight: 600, color: "#111827", padding: "1px 6px", borderRadius: "4px" }}>
                                    {it.supplier.name}
                                  </span>
                                  {it.supplier.supplierId && (
                                    <span className="glitter-supplier-id-badge" style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      padding: "2px 8px 2px 3px",
                                      borderRadius: "999px",
                                      border: "1px solid #C7D2FE",
                                      backgroundColor: "#EEF2FF",
                                      width: "fit-content",
                                    }}>
                                      <span style={{
                                        width: "18px",
                                        height: "18px",
                                        borderRadius: "50%",
                                        border: "1.5px solid #818CF8",
                                        backgroundColor: "#FFFFFF",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "9px",
                                        fontWeight: 700,
                                        color: "#4338CA",
                                        flexShrink: 0,
                                      }}>S</span>
                                      <span style={{ fontSize: "11px", fontWeight: 600, color: "#4338CA" }}>
                                        {it.supplier.supplierId}
                                      </span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Description */}
                          <div style={{ minHeight: "42px", display: "flex", alignItems: "center" }}>
                            {it.description ? (
                              <p style={{
                                fontSize: "14px",
                                color: "#6B7280",
                                margin: 0,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                lineHeight: 1.5,
                              }}>
                                {it.description}
                              </p>
                            ) : null}
                          </div>

                          {/* Price + Lead Time Grid */}
                          <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "12px",
                          }}>
                            <div style={{
                              backgroundColor: "#F8FAFC",
                              borderRadius: "10px",
                              padding: "10px 12px",
                              border: "1px solid #E2E8F0",
                              boxShadow: "inset 0 1px 1px rgba(255,255,255,0.95), 0 2px 6px rgba(15,23,42,0.03)"
                            }}>
                              <span style={{ fontSize: "11px", color: "#6B7280", fontWeight: 500, textTransform: "uppercase", display: "block" }}>Unit Price</span>
                              <span style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>
                                ₱{(it.unitPrice || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div style={{
                              backgroundColor: "#F8FAFC",
                              borderRadius: "10px",
                              padding: "10px 12px",
                              border: "1px solid #E2E8F0",
                              boxShadow: "inset 0 1px 1px rgba(255,255,255,0.95), 0 2px 6px rgba(15,23,42,0.03)"
                            }}>
                              <span style={{ fontSize: "11px", color: "#6B7280", fontWeight: 500, textTransform: "uppercase", display: "block" }}>Lead Time</span>
                              <span style={{ fontSize: "14px", fontWeight: 600, color: "#374151" }}>
                                {it.leadTimeDays} {it.leadTimeDays === 1 ? "day" : "days"}
                              </span>
                            </div>
                          </div>

                          {/* 8px Animated Capacity Progress Bar */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>{quantity}</span>
                                <span style={{ fontSize: "12px", color: "#6B7280" }}>/ min {reorderPt}</span>
                              </div>
                              <span style={{ fontSize: "12px", fontWeight: 600, color: stockBadgeColor }}>{Math.round(fillPct)}% capacity</span>
                            </div>
                            <div style={{ width: "100%", height: "8px", backgroundColor: "#E5E7EB", borderRadius: "4px", overflow: "hidden" }}>
                              <div style={{
                                width: `${fillPct}%`,
                                height: "100%",
                                background: progressBarColor,
                                borderRadius: "4px",
                                transition: "width 0.4s ease-in-out",
                              }} />
                            </div>
                          </div>
                        </div>

                        {/* Card Footer action bar */}
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "16px 24px",
                          borderTop: "1px solid #F3F4F6",
                          backgroundColor: "#F9FAFB",
                        }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Primary Action Button: Adjust Stock */}
                          {canAdjustStock && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenStockModal(it);
                              }}
                              className="glitter-action-btn"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "5px",
                                backgroundColor: "#6366F1",
                                color: "#FFFFFF",
                                border: "none",
                                borderRadius: "8px",
                                padding: "7px 11px",
                                fontSize: "12px",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                                flexShrink: 0,
                                cursor: "pointer",
                                boxShadow: "0 1px 3px rgba(99, 102, 241, 0.25)",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#4F46E5";
                                e.currentTarget.style.transform = "translateY(-1px)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#6366F1";
                                e.currentTarget.style.transform = "translateY(0)";
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                              Adjust Stock
                            </button>
                          )}

                          {/* Secondary action icon buttons with soft circular hovers */}
                          <div style={{ display: "flex", gap: "5px", marginLeft: "auto", flexShrink: 0, flexWrap: "nowrap" }}>
                            {it.category?.type === "NON_CONSUMABLE" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenViewTags(it);
                                }}
                                title="View Asset Tags"
                                className="glitter-action-btn"
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "50%",
                                  backgroundColor: "#FFFFFF",
                                  border: "1px solid #E5E7EB",
                                  cursor: "pointer",
                                  color: "#374151",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F3F4F6"; e.currentTarget.style.color = "#111827"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#FFFFFF"; e.currentTarget.style.color = "#374151"; }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><circle cx="7" cy="7" r="1" /></svg>
                              </button>
                            )}
                            {canEditAddRemove && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenEditModal(it);
                                }}
                                title="Edit Item"
                                className="glitter-action-btn"
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "50%",
                                  backgroundColor: "#FFFFFF",
                                  border: "1px solid #E5E7EB",
                                  cursor: "pointer",
                                  color: "#374151",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F3F4F6"; e.currentTarget.style.color = "#111827"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#FFFFFF"; e.currentTarget.style.color = "#374151"; }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                              </button>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenHistoryModal(it);
                              }}
                              title="View Change History"
                              className="glitter-action-btn"
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                backgroundColor: "#FFFFFF",
                                border: "1px solid #E5E7EB",
                                cursor: "pointer",
                                color: "#374151",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F3F4F6"; e.currentTarget.style.color = "#111827"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#FFFFFF"; e.currentTarget.style.color = "#374151"; }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            </button>
                            {canEditAddRemove && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteTarget("item", it.id, it.name);
                                }}
                                title="Delete Item"
                                className="glitter-action-btn"
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "50%",
                                  backgroundColor: "#FFFFFF",
                                  border: "1px solid #E5E7EB",
                                  cursor: "pointer",
                                  color: "#64748B",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#FEF2F2"; e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.borderColor = "#FCA5A5"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#FFFFFF"; e.currentTarget.style.color = "#64748B"; e.currentTarget.style.borderColor = "#E5E7EB"; }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {catalogSubTab === "deployments" && canAccessDeployments && (
        <div className="table-container-fade" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Asset Deployments Sub-Module View */}
          {/* Summary Cards */}
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div style={{
              backgroundColor: "#ffffff", borderRadius: 12, padding: "1.25rem",
              boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Total Deployments</span>
                <span style={{ fontSize: "1.65rem", fontWeight: 800, color: "#210cae" }}><AnimatedNumber value={filteredDeployments.length} /></span>
                <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Hardware assigned to personnel</span>
              </div>
              <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
              </div>
            </div>

            <div style={{
              backgroundColor: "#ffffff", borderRadius: 12, padding: "1.25rem",
              boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Unique Employees</span>
                <span style={{ fontSize: "1.65rem", fontWeight: 800, color: "#059669" }}><AnimatedNumber value={new Set(filteredDeployments.map(d => d.employeeEid || d.employeeName)).size} /></span>
                <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Active hardware custodians</span>
              </div>
              <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </div>
            </div>

            <div style={{
              backgroundColor: "#ffffff", borderRadius: 12, padding: "1.25rem",
              boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Active Locations</span>
                <span style={{ fontSize: "1.65rem", fontWeight: 800, color: "#d97706" }}><AnimatedNumber value={new Set(filteredDeployments.map(d => d.siteId)).size} /></span>
                <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Sites with deployed assets</span>
              </div>
              <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              </div>
            </div>
          </section>

          {/* Filter & Action Toolbar */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            backgroundColor: "#ffffff",
            borderRadius: 12,
            padding: "1rem 1.25rem",
            boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
          }}>
            <div style={{ display: "flex", flex: 1, flexWrap: "wrap", gap: "0.75rem", minWidth: "280px" }}>
              {/* Search Bar */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: "220px" }}>
                <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Search Deployments</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  <input
                    type="text"
                    placeholder="Search Employee Name, EID, Account, Asset..."
                    value={deploymentSearch}
                    onChange={(e) => setDeploymentSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.75rem 0.45rem 1.85rem",
                      borderRadius: 6,
                      border: "1px solid #e2e8f0",
                      fontSize: "0.8rem",
                      color: "#1e293b",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Site Selector */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "160px" }}>
                <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Filter Site</label>
                <select
                  value={deploymentSiteFilter}
                  onChange={(e) => setDeploymentSiteFilter(e.target.value)}
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
                  <option value="ALL">All Deployment Sites</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.prefix})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Selector */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "160px" }}>
                <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Filter Status</label>
                <select
                  value={deploymentStatusFilter}
                  onChange={(e) => setDeploymentStatusFilter(e.target.value)}
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
                  <option value="ALL">All Statuses (Active & Returned)</option>
                  <option value="ACTIVE">Active Deployments</option>
                  <option value="RETURNED">Returned Assets</option>
                </select>
              </div>

              {/* Category Selector */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "160px" }}>
                <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Filter Category</label>
                <select
                  value={deploymentCategoryTypeFilter}
                  onChange={(e) => setDeploymentCategoryTypeFilter(e.target.value)}
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
                  <option value="ALL">All Categories</option>
                  <option value="CONSUMABLE">Consumables</option>
                  <option value="NON_CONSUMABLE">Non-Consumables</option>
                </select>
              </div>
            </div>
          </div>

          {/* Asset Deployments Table */}
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 1px 2px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.8)",
            overflow: "visible",
          }}>
            {filteredDeployments.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 1rem", textAlign: "center" }}>
                <div style={{ padding: "1.25rem", backgroundColor: "#f1f5f9", borderRadius: "50%", marginBottom: "1rem" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <span style={{ fontSize: "0.9rem", color: "#0f172a", fontWeight: 700, marginBottom: "0.25rem" }}>No asset deployments found</span>
                <span style={{ fontSize: "0.8rem", color: "#64748b", maxWidth: "320px" }}>
                  No hardware deployment records matched your site or search filter.
                </span>
              </div>
            ) : (
              <>
              {/* Bulk action bar for deployed assets */}
              {selectedDeploymentIds.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#eff6ff', color: '#1e293b', padding: '0.85rem 1.25rem', borderRadius: 12, border: '1px solid #bfdbfe', boxShadow: '0 4px 14px rgba(37,99,235,0.08)', animation: 'slideFadeIn 0.3s ease-out', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, backgroundColor: '#ea580c', color: '#ffffff', padding: '0.3rem 0.65rem', borderRadius: '6px' }}>
                      🚀 {selectedDeploymentIds.length} Deployment{selectedDeploymentIds.length > 1 ? 's' : ''} Selected
                    </span>
                    <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 500 }}>Ready to return to stock</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setIsBulkDeploymentReturnModalOpen(true)}
                      style={{ backgroundColor: '#ea580c', color: '#ffffff', border: 'none', borderRadius: 8, padding: '0.45rem 0.95rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', boxShadow: '0 2px 6px rgba(234,88,12,0.3)', transition: 'all 0.2s ease' }}
                    >
                      🔄 Bulk Return Assets
                    </button>
                    <button
                      onClick={() => setSelectedDeploymentIds([])}
                      style={{ backgroundColor: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 8, padding: '0.45rem 0.75rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease' }}
                    >
                      ✕ Deselect All
                    </button>
                  </div>
                </div>
              )}

              <div style={{ overflowX: "auto", borderRadius: "12px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                  <thead style={{ position: "sticky", top: 0, backgroundColor: "#f8fafc", zIndex: 10, boxShadow: "0 1px 0 #e2e8f0" }}>
                    <tr>
                      <th style={{ padding: "0.85rem 0.5rem", width: 40, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          title="Select all active deployments"
                          checked={selectedDeploymentIds.length > 0 && filteredDeployments.filter((d: any) => d.status !== 'RETURNED').every((d: any) => selectedDeploymentIds.includes(d.id))}
                          onChange={(e) => {
                            const activeIds = filteredDeployments.filter((d: any) => d.status !== 'RETURNED').map((d: any) => d.id);
                            setSelectedDeploymentIds(e.target.checked ? activeIds : []);
                          }}
                          style={{ cursor: 'pointer', accentColor: '#3b82f6', width: '16px', height: '16px' }}
                        />
                      </th>
                      <th style={{ padding: "0.85rem 1rem", fontSize: "0.68rem", fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>Deploy ID</th>
                      <th style={{ padding: "0.85rem 1rem", fontSize: "0.68rem", fontWeight: 700, color: "#64748b", whiteSpace: "nowrap", width: 140 }}>Group</th>
                      <th style={{ padding: "0.85rem 1rem", fontSize: "0.68rem", fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>Employee</th>
                      <th style={{ padding: "0.85rem 1rem", fontSize: "0.68rem", fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>Account / Dept</th>
                      <th style={{ padding: "0.85rem 1rem", fontSize: "0.68rem", fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>EID</th>
                      <th style={{ padding: "0.85rem 1rem", fontSize: "0.68rem", fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>Asset / Tag</th>
                      <th style={{ padding: "0.85rem 1rem", fontSize: "0.68rem", fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>Status</th>
                      <th style={{ padding: "0.85rem 1rem", fontSize: "0.68rem", fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>Site</th>
                      <th style={{ padding: "0.85rem 1rem", fontSize: "0.68rem", fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>Deployed</th>
                      <th style={{ padding: "0.85rem 1rem", fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textAlign: "center", whiteSpace: "nowrap" }}>PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedDeployments.map((group: any, gIdx: number) => {
                      const isGroup = group.items.length > 1;
                      const dep = group.items[0];
                      const groupDeployId = (dep.id || "").toUpperCase().slice(-8);
                      const allGroupIds = group.items.filter((d: any) => d.status !== 'RETURNED').map((d: any) => d.id);
                      const isAllGroupSelected = allGroupIds.length > 0 && allGroupIds.every((id: string) => selectedDeploymentIds.includes(id));

                      const itemObj = catalogItems.find((it: any) => it.id === dep.rawRequest?.itemId || it.name === dep.itemName);
                      const catType = itemObj?.category?.type || dep.rawRequest?.item?.category?.type || "NON_CONSUMABLE";
                      const fallbackId = (dep.id || "").substring((dep.id || "").length - 4).toUpperCase() || "0000";
                      const displayTag = dep.assetTag || dep.rawRequest?.assetTag || dep.rawRequest?.asset?.tagCode || `AST-${fallbackId}`;
                      const isConsumable = catType === "CONSUMABLE";

                      const formatRelDep = (d: string) => {
                        const diff = Date.now() - new Date(d).getTime();
                        const hrs = Math.floor(diff / 3600000);
                        const days = Math.floor(diff / 86400000);
                        if (hrs < 24) return `${hrs}h ago`;
                        if (days < 30) return `${days}d ago`;
                        return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      };

                      const depStatus = isGroup
                        ? (group.items.every((d: any) => d.status === "RETURNED") ? "ALL_RETURNED" : group.items.some((d: any) => d.status === "RETURNED") ? "PARTIAL_RETURNED" : "ACTIVE")
                        : dep.status;

                      const openDrawer = () => {
                        setSelectedDeployment(isGroup
                          ? { ...dep, groupItems: group.items, isGroupDep: true, groupEmployeeName: group.employeeName, groupDeployId }
                          : dep
                        );
                        setIsDeploymentDrawerOpen(true);
                      };

                      return (
                        <tr
                          key={group.key}
                          className="animated-row"
                          onClick={openDrawer}
                          style={{
                            borderBottom: "1px solid #e2e8f0",
                            backgroundColor: selectedDeploymentIds.some(id => group.items.map((d: any) => d.id).includes(id))
                              ? "#f0f9ff" : (gIdx % 2 === 1 ? "#fcfdfe" : "#ffffff"),
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedDeploymentIds.some(id => group.items.map((d: any) => d.id).includes(id)) ? "#f0f9ff" : (gIdx % 2 === 1 ? "#fcfdfe" : "#ffffff")}
                        >
                          {/* Checkbox */}
                          <td onClick={(e) => e.stopPropagation()} style={{ padding: "0.85rem 0.5rem", textAlign: "center", width: 40 }}>
                            {allGroupIds.length > 0 && (
                              <input
                                type="checkbox"
                                checked={isGroup ? isAllGroupSelected : selectedDeploymentIds.includes(dep.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  if (isGroup) {
                                    if (e.target.checked) {
                                      setSelectedDeploymentIds(prev => Array.from(new Set([...prev, ...allGroupIds])));
                                    } else {
                                      setSelectedDeploymentIds(prev => prev.filter(id => !allGroupIds.includes(id)));
                                    }
                                  } else {
                                    if (e.target.checked) {
                                      setSelectedDeploymentIds(prev => [...prev, dep.id]);
                                    } else {
                                      setSelectedDeploymentIds(prev => prev.filter(id => id !== dep.id));
                                    }
                                  }
                                }}
                                style={{ cursor: "pointer", accentColor: "#3b82f6", width: "16px", height: "16px" }}
                              />
                            )}
                          </td>

                          {/* Deploy ID */}
                          <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                            <span style={{
                              fontFamily: "monospace", fontSize: "0.75rem", fontWeight: isGroup ? 700 : 600,
                              color: isGroup ? "#3730a3" : "#334155",
                              backgroundColor: isGroup ? "#eef2ff" : "#f1f5f9",
                              padding: "0.25rem 0.5rem", borderRadius: "6px",
                              border: `1px solid ${isGroup ? "#c7d2fe" : "#e2e8f0"}`,
                              letterSpacing: "0.5px", whiteSpace: "nowrap"
                            }}>
                              {groupDeployId}
                            </span>
                          </td>

                          {/* Group Badge */}
                          <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                            <span style={{
                              fontSize: "0.68rem", fontWeight: isGroup ? 800 : 600,
                              color: isGroup ? "#3730a3" : "#64748b",
                              backgroundColor: isGroup ? "#eef2ff" : "#f8fafc",
                              padding: "0.15rem 0.55rem", borderRadius: "9999px",
                              border: `1px solid ${isGroup ? "#c7d2fe" : "#e2e8f0"}`,
                              whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "4px"
                            }}>
                              {isGroup ? `📦 Grouped (${group.items.length} Assets)` : "Single Asset"}
                            </span>
                          </td>

                          {/* Employee Name */}
                          <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.85rem" }}>{dep.employeeName}</div>
                          </td>

                          {/* Account */}
                          <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "#475569", whiteSpace: "nowrap" }}>
                            {dep.employeeAccount}
                          </td>

                          {/* EID */}
                          <td style={{ padding: "0.85rem 1rem" }}>
                            <EidBadge employeeId={dep.employeeEid} size="sm" />
                          </td>

                          {/* Asset / Tag */}
                          <td style={{ padding: "0.85rem 1rem" }}>
                            {isGroup ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                                <span style={{ color: "#0f172a", fontWeight: 700, fontSize: "0.82rem" }}>
                                  {group.items.slice(0, 2).map((i: any) => i.itemName).join(", ")}
                                  {group.items.length > 2 ? ` +${group.items.length - 2} more` : ""}
                                </span>
                                <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                                  Combined Deployment ({group.items.length} Assets)
                                </span>
                              </div>
                            ) : (
                              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                                <div>
                                  <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.82rem" }}>{dep.itemName}</div>
                                  {!isConsumable && (
                                    <div style={{ marginTop: "0.2rem" }}>
                                      <AssetTagBadge tag={displayTag} size="sm" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                            {isGroup ? (
                              <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                                {group.items.filter((d: any) => d.status !== "RETURNED").length > 0 && (
                                  <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "0.15rem 0.45rem", borderRadius: "9999px", backgroundColor: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }}>
                                    {group.items.filter((d: any) => d.status !== "RETURNED").length} ACTIVE
                                  </span>
                                )}
                                {group.items.filter((d: any) => d.status === "RETURNED").length > 0 && (
                                  <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "0.15rem 0.45rem", borderRadius: "9999px", backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>
                                    {group.items.filter((d: any) => d.status === "RETURNED").length} RETURNED
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="glitter-status-badge" style={{
                                padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 800,
                                background: dep.status === "RETURNED"
                                  ? (dep.returnCondition === "DAMAGED" ? "linear-gradient(135deg,#fff1f2,#ffe4e6)" : dep.returnCondition === "MISSING" ? "linear-gradient(135deg,#fffbeb,#fef3c7)" : "linear-gradient(135deg,#ecfdf5,#d1fae5)")
                                  : "linear-gradient(135deg,#eff6ff,#dbeafe)",
                                color: dep.status === "RETURNED"
                                  ? (dep.returnCondition === "DAMAGED" ? "#991b1b" : dep.returnCondition === "MISSING" ? "#92400e" : "#065f46")
                                  : "#1e40af",
                                border: dep.status === "RETURNED"
                                  ? (dep.returnCondition === "DAMAGED" ? "1px solid #fca5a5" : dep.returnCondition === "MISSING" ? "1px solid #fcd34d" : "1px solid #6ee7b7")
                                  : "1px solid #93c5fd",
                              }}>
                                {dep.status === "RETURNED"
                                  ? (dep.returnCondition === "DAMAGED" ? "⚠ DAMAGED" : dep.returnCondition === "MISSING" ? `✕ MISSING` : "RETURNED")
                                  : "ACTIVE"}
                              </span>
                            )}
                          </td>

                          {/* Site */}
                          <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                            <SiteBadge siteName={dep.siteName} size="sm" />
                          </td>

                          {/* Deployed Date */}
                          <td style={{ padding: "0.85rem 1rem", fontSize: "0.78rem", color: "#64748b", whiteSpace: "nowrap" }} title={new Date(dep.createdAt).toLocaleString()}>
                            {formatRelDep(dep.createdAt)}
                          </td>

                          {/* PDF */}
                          <td style={{ padding: "0.85rem 1rem", textAlign: "center", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => { e.stopPropagation(); isGroup ? handleDownloadGroupReceipt(group) : handleDownloadDeploymentReceipt(dep); }}
                              title="Download PDF Receipt"
                              style={{
                                padding: "0.3rem 0.6rem", borderRadius: "6px",
                                border: "1px solid rgba(148,163,184,0.45)",
                                background: "linear-gradient(135deg,#ffffff,#f1f5f9)",
                                color: "#334155", fontSize: "0.74rem", fontWeight: 700,
                                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.2rem",
                                boxShadow: "0 1px 2px rgba(15,23,42,0.05)"
                              }}
                            >
                              📄 PDF
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </div>

          {/* Bulk Deployed Asset Return Modal */}
          {isBulkDeploymentReturnModalOpen && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}>
              <div style={{ backgroundColor: '#ffffff', borderRadius: 18, padding: '2rem', minWidth: 460, maxWidth: 560, boxShadow: '0 20px 60px rgba(15,23,42,0.18)', animation: 'slideFadeIn 0.25s ease-out' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🔄</div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Bulk Return Deployed Assets</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{selectedDeploymentIds.length} asset{selectedDeploymentIds.length > 1 ? 's' : ''} will be returned to inventory stock</p>
                  </div>
                </div>

                <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#92400e', lineHeight: 1.5 }}>
                  ⚠️ <strong>{selectedDeploymentIds.length} deployed asset{selectedDeploymentIds.length > 1 ? 's' : ''}</strong> will be marked as <strong>RETURNED</strong> and their stock counts will be restored. This action updates localStorage and syncs with the backend.
                </div>

                <div style={{ marginBottom: '1.1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem' }}>Return Condition</label>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    {(['GOOD', 'DAMAGED', 'MISSING'] as const).map((cond) => (
                      <button
                        key={cond}
                        onClick={() => setBulkReturnCondition(cond)}
                        style={{
                          flex: 1, padding: '0.55rem 0.5rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', border: '2px solid',
                          backgroundColor: bulkReturnCondition === cond ? (cond === 'GOOD' ? '#d1fae5' : cond === 'DAMAGED' ? '#fee2e2' : '#fef3c7') : '#f8fafc',
                          borderColor: bulkReturnCondition === cond ? (cond === 'GOOD' ? '#6ee7b7' : cond === 'DAMAGED' ? '#fca5a5' : '#fcd34d') : '#e2e8f0',
                          color: bulkReturnCondition === cond ? (cond === 'GOOD' ? '#065f46' : cond === 'DAMAGED' ? '#991b1b' : '#92400e') : '#64748b',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {cond === 'GOOD' ? '✅ Good' : cond === 'DAMAGED' ? '⚠️ Damaged' : '❌ Missing'}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>Return Notes (optional)</label>
                  <textarea
                    value={bulkReturnNotes}
                    onChange={(e) => setBulkReturnNotes(e.target.value)}
                    placeholder="e.g. Employee resigned, contract ended, batch equipment refresh..."
                    rows={3}
                    style={{ width: '100%', borderRadius: 8, border: '1px solid #d1d5db', padding: '0.65rem 0.85rem', fontSize: '0.85rem', color: '#1e293b', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => { setIsBulkDeploymentReturnModalOpen(false); setBulkReturnNotes(''); setBulkReturnCondition('GOOD'); }}
                    disabled={isSubmittingBulkReturn}
                    style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.55rem 1.1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkDeploymentReturn}
                    disabled={isSubmittingBulkReturn}
                    style={{ backgroundColor: '#ea580c', color: '#ffffff', border: 'none', borderRadius: 8, padding: '0.55rem 1.4rem', fontSize: '0.85rem', fontWeight: 700, cursor: isSubmittingBulkReturn ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 8px rgba(234,88,12,0.3)' }}
                  >
                    {isSubmittingBulkReturn ? (
                      <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Processing...</>
                    ) : `🔄 Confirm Return (${selectedDeploymentIds.length} Asset${selectedDeploymentIds.length > 1 ? 's' : ''})`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Deployment Details Slide-Over Drawer */}
      {isDeploymentDrawerOpen && selectedDeployment && (
        <div
          onClick={() => setIsDeploymentDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '540px',
              height: '100%',
              backgroundColor: '#ffffff',
              boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.72rem', color: '#3730a3', fontFamily: 'monospace', fontWeight: 700, backgroundColor: '#eef2ff', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid #c7d2fe', width: 'fit-content' }}>
                  {selectedDeployment.groupDeployId || (selectedDeployment.id ? selectedDeployment.id.toUpperCase().slice(-8) : 'DEPLOYMENT')}
                </span>
                <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  Deployment Details
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => selectedDeployment.isGroupDep && selectedDeployment.groupItems ? handleDownloadGroupReceipt({ items: selectedDeployment.groupItems, employeeName: selectedDeployment.employeeName }) : handleDownloadDeploymentReceipt(selectedDeployment)}
                  style={{
                    background: '#ffffff', border: '1px solid #e2e8f0', padding: '6px 10px',
                    borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', color: '#475569',
                    fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Export PDF
                </button>
                <button
                  onClick={() => setIsDeploymentDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.5rem', padding: '4px' }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Status Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '0.85rem 1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Deployment Status</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.6rem',
                    borderRadius: '12px',
                    backgroundColor: selectedDeployment.isGroupDep
                      ? (selectedDeployment.groupItems?.every((d: any) => d.status === 'RETURNED') ? '#d1fae5' : '#dbeafe')
                      : (selectedDeployment.status === 'RETURNED' ? (selectedDeployment.returnCondition === 'DAMAGED' ? '#fffbeb' : selectedDeployment.returnCondition === 'MISSING' ? '#fef2f2' : '#d1fae5') : '#dbeafe'),
                    color: selectedDeployment.isGroupDep
                      ? (selectedDeployment.groupItems?.every((d: any) => d.status === 'RETURNED') ? '#065f46' : '#2563eb')
                      : (selectedDeployment.status === 'RETURNED' ? (selectedDeployment.returnCondition === 'DAMAGED' ? '#b45309' : selectedDeployment.returnCondition === 'MISSING' ? '#b91c1c' : '#065f46') : '#2563eb')
                  }}>
                    {selectedDeployment.isGroupDep
                      ? (selectedDeployment.groupItems?.every((d: any) => d.status === 'RETURNED') ? 'ALL RETURNED' : `${selectedDeployment.groupItems?.filter((d: any) => d.status !== 'RETURNED').length} ACTIVE ASSETS`)
                      : (selectedDeployment.status === 'RETURNED' ? (selectedDeployment.returnCondition === 'DAMAGED' ? 'RETURNED (DAMAGED)' : selectedDeployment.returnCondition === 'MISSING' ? `RETURNED (${selectedDeployment.missingCount || 1} MISSING)` : 'RETURNED (GOOD)') : 'ACTIVE DEPLOYMENT')}
                  </span>
                  {!selectedDeployment.isGroupDep && selectedDeployment.status !== 'RETURNED' && (
                    <button
                      onClick={() => handleOpenReturnModal(selectedDeployment)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        border: '1px solid #10b981',
                        backgroundColor: '#ecfdf5',
                        color: '#047857',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      ↩️ Return Asset
                    </button>
                  )}
                </div>
              </div>

              {/* Employee Recipient Info */}
              <div style={{ backgroundColor: '#f8fafc', borderRadius: 8, padding: '1rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Employee Recipient</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Name</label>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{selectedDeployment.employeeName}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Employee ID</label>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#210cae', fontFamily: 'monospace' }}>{selectedDeployment.employeeEid}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Account / Dept</label>
                    <div style={{ fontSize: '0.85rem', color: '#334155' }}>{selectedDeployment.employeeAccount}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Deployment Site</label>
                    <div style={{ fontSize: '0.85rem', color: '#334155' }}>{selectedDeployment.siteName || 'Cebu IT Park'}</div>
                  </div>
                </div>
              </div>

              {/* Group or Single Asset Info */}
              {selectedDeployment.isGroupDep && selectedDeployment.groupItems ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Deployed Assets ({selectedDeployment.groupItems.length} Items)
                  </label>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                      <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                          <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#475569' }}>Asset Name</th>
                          <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#475569' }}>Tag</th>
                          <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#475569' }}>Status</th>
                          <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDeployment.groupItems.map((gItem: any, idx: number) => {
                          const fallbackId = (gItem.id || "").substring((gItem.id || "").length - 4).toUpperCase() || "0000";
                          const tag = gItem.assetTag || gItem.rawRequest?.assetTag || `AST-${fallbackId}`;
                          return (
                            <tr key={idx} style={{ borderBottom: idx < selectedDeployment.groupItems.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                              <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: '#0f172a' }}>{gItem.itemName}</td>
                              <td style={{ padding: '0.65rem 0.75rem' }}><AssetTagBadge tag={tag} size="sm" /></td>
                              <td style={{ padding: '0.65rem 0.75rem' }}>
                                <span style={{
                                  fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '9999px',
                                  backgroundColor: gItem.status === 'RETURNED' ? '#ecfdf5' : '#eff6ff',
                                  color: gItem.status === 'RETURNED' ? '#065f46' : '#1d4ed8',
                                  border: gItem.status === 'RETURNED' ? '1px solid #6ee7b7' : '1px solid #bfdbfe'
                                }}>
                                  {gItem.status === 'RETURNED' ? 'RETURNED' : 'ACTIVE'}
                                </span>
                              </td>
                              <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>
                                {gItem.status !== 'RETURNED' && (
                                  <button
                                    onClick={() => handleOpenReturnModal(gItem)}
                                    style={{
                                      padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #10b981',
                                      backgroundColor: '#ecfdf5', color: '#047857', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer'
                                    }}
                                  >
                                    Return
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Assigned Hardware Item</label>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>{selectedDeployment.itemName || 'Assigned Asset'}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Asset Tag Code</label>
                      <div style={{ marginTop: '0.15rem' }}>
                        <span style={{
                          fontSize: '0.78rem',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: '#210cae',
                          backgroundColor: '#eef2ff',
                          border: '1px solid #c7d2fe',
                          borderRadius: '4px',
                          padding: '0.15rem 0.45rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          🏷️ {selectedDeployment.assetTag || 'AST-DEP'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Issued By</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                          {selectedDeployment.requestedByName || 'Inventory Staff'}
                        </span>
                        <RoleBadge
                          role={selectedDeployment.requestedByRole || selectedDeployment.issuerRole || selectedDeployment.rawRequest?.requestedByRole || (selectedDeployment.requestedByName?.toLowerCase().includes("ops") || selectedDeployment.requestedByName?.toLowerCase().includes("admin") ? "ADMIN" : "INVENTORY_STAFF")}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Deployment Reason & Notes</label>
                    <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, marginTop: '0.25rem', padding: '0.75rem', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                      {selectedDeployment.reason || 'N/A'}
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline / History Log */}
              {selectedDeployment.rawRequest?.id && (
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.85rem' }}>
                    Deployment Timeline
                  </label>
                  <RequestTimeline
                    requestId={selectedDeployment.rawRequest.id}
                    status={selectedDeployment.rawRequest.status || 'RELEASED'}
                    requestedById={selectedDeployment.rawRequest.requestedById || ''}
                    requestedByName={selectedDeployment.employeeName}
                    currentUserEmail={currentUser.email}
                    currentUserId={currentUser.id}
                    currentUserRole={currentUser.role}
                    history={selectedDeployment.rawRequest.history}
                    onConfirmSuccess={() => {}}
                    assetTag={selectedDeployment.assetTag}
                    itemName={selectedDeployment.itemName}
                  />
                </div>
              )}

              {/* Download PDF Receipt Action */}
              <div style={{ paddingTop: '0.5rem' }}>
                <button
                  onClick={() => selectedDeployment.isGroupDep && selectedDeployment.groupItems ? handleDownloadGroupReceipt({ items: selectedDeployment.groupItems, employeeName: selectedDeployment.employeeName }) : handleDownloadDeploymentReceipt(selectedDeployment)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    borderRadius: 8,
                    border: '1px solid #2563eb',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 2px 6px rgba(37,99,235,0.2)'
                  }}
                >
                  📄 Download Deployment PDF Receipt
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Return Asset Confirmation Modal */}
      {returnModalDeployment && (
        <div
          onClick={() => setReturnModalDeployment(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '10px',
                  backgroundColor: '#d1fae5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem'
                }}>
                  ↩️
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                    Confirm Asset Return
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Return hardware back to site inventory
                  </span>
                </div>
              </div>
              <button
                onClick={() => setReturnModalDeployment(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.5rem', padding: '4px' }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Employee Custodian</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{returnModalDeployment.employeeName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Employee ID</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#210cae', fontFamily: 'monospace' }}>{returnModalDeployment.employeeEid}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Deployed Hardware</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{returnModalDeployment.itemName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Asset Tag</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#210cae', fontFamily: 'monospace', backgroundColor: '#eef2ff', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid #c7d2fe' }}>
                    🏷️ {returnModalDeployment.assetTag}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Return Location</span>
                  <span style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>{returnModalDeployment.siteName || 'Site Inventory'}</span>
                </div>
              </div>

              {/* Asset Condition Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                  Returned Asset Condition & Status <span style={{ color: '#ef4444' }}>*</span>
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  {/* Good Option */}
                  <button
                    type="button"
                    onClick={() => handleConditionChange("GOOD")}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: '10px',
                      border: returnCondition === "GOOD" ? '2px solid #10b981' : '1px solid #e2e8f0',
                      backgroundColor: returnCondition === "GOOD" ? '#ecfdf5' : '#ffffff',
                      color: returnCondition === "GOOD" ? '#047857' : '#475569',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>✓</span>
                    <span>Good Condition</span>
                  </button>

                  {/* Damaged Option */}
                  <button
                    type="button"
                    onClick={() => handleConditionChange("DAMAGED")}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: '10px',
                      border: returnCondition === "DAMAGED" ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                      backgroundColor: returnCondition === "DAMAGED" ? '#fffbeb' : '#ffffff',
                      color: returnCondition === "DAMAGED" ? '#b45309' : '#475569',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                    <span>Damaged</span>
                  </button>

                  {/* Missing Option */}
                  <button
                    type="button"
                    onClick={() => handleConditionChange("MISSING")}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: '10px',
                      border: returnCondition === "MISSING" ? '2px solid #ef4444' : '1px solid #e2e8f0',
                      backgroundColor: returnCondition === "MISSING" ? '#fef2f2' : '#ffffff',
                      color: returnCondition === "MISSING" ? '#b91c1c' : '#475569',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>❌</span>
                    <span>Missing Item(s)</span>
                  </button>
                </div>
              </div>

              {/* Specified Number of Missing Items Input */}
              {returnCondition === "MISSING" && (
                <div style={{
                  backgroundColor: '#fff1f2',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  border: '1px solid #fecdd3',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  animation: 'fadeIn 0.15s ease-out'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9f1239' }}>
                      Specified Number of Missing Items:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={missingCount}
                      onChange={(e) => handleMissingCountChange(parseInt(e.target.value) || 1)}
                      style={{
                        width: '70px',
                        padding: '0.35rem 0.5rem',
                        borderRadius: '6px',
                        border: '1px solid #fda4af',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: '#9f1239',
                        textAlign: 'center',
                        outline: 'none',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#be123c' }}>
                    ⚠️ {missingCount} item(s) will be logged as missing/lost from inventory during this return transaction.
                  </span>
                </div>
              )}

              {/* Notes Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                  Return Notes & Condition Details
                </label>
                <textarea
                  rows={2}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="e.g. Returned in good working condition..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    color: '#0f172a',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #f1f5f9',
              backgroundColor: '#f8fafc',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}>
              <button
                type="button"
                onClick={() => setReturnModalDeployment(null)}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingReturn}
                onClick={handleConfirmReturnAsset}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: isSubmittingReturn ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 6px rgba(16,185,129,0.3)'
                }}
              >
                {isSubmittingReturn ? 'Processing...' : 'Confirm Return to Inventory'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Keyframes & Transition Animations Matching Reports & Logs */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* 3D Folding Unfolding Entrance animation for table container & views */
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

        /* Premium sliding lift row hover effect matching Reports & Logs */
        .table-row-hover {
          transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1),
                      box-shadow 0.2s cubic-bezier(0.25, 1, 0.5, 1),
                      background-color 0.2s ease !important;
          position: relative;
        }
        .table-row-hover:hover {
          background-color: #f8fafc !important;
          background: #f8fafc !important;
          transform: translateY(-2px) scale(1.002);
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05), 0 0 0 1px rgba(77, 201, 230, 0.18) !important;
          z-index: 5;
        }

        /* Grid card entrance & lift animation */
        .grid-card-hover {
          transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1),
                      box-shadow 0.2s cubic-bezier(0.25, 1, 0.5, 1) !important;
        }
        .grid-card-hover:hover {
          transform: translateY(-3px) scale(1.01);
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(33, 12, 174, 0.15) !important;
        }

        /* Interactive action button hover effects */
        .btn-hover-effect {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .btn-hover-effect:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 4px 12px rgba(33, 12, 174, 0.18);
        }
        .btn-hover-effect:active {
          transform: translateY(0);
        }

        /* Sub-tab pill animation */
        .subtab-pill {
          transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1) !important;
        }
        .subtab-pill:hover {
          transform: translateY(-1px);
        }
      ` }} />
    </div>
  );
};
