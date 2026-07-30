"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

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

interface Site {
  id: string;
  name: string;
  prefix?: string;
  address?: string;
}

export default function OpexTab({ currentUser, sites = [], initialSubTab = "tracker" }: { currentUser: any; sites?: Site[]; initialSubTab?: "tracker" | "reports" }) {
  const [activeSubTab, setActiveSubTab] = useState<"tracker" | "reports">(initialSubTab);
  const [entries, setEntries] = useState<OpexEntry[]>([]);
  const [archives, setArchives] = useState<MonthlyArchive[]>([]);
  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Filters
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [capexFilter, setCapexFilter] = useState<string>("ALL");
  const [siteFilter, setSiteFilter] = useState<string>("ALL");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isPageLoading, setIsPageLoading] = useState(false);

  // Modal states
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<OpexEntry | null>(null);

  // Lock Month Password Modal states
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockPassword, setLockPassword] = useState("");
  const [lockError, setLockError] = useState<string | null>(null);
  const [isLocking, setIsLocking] = useState(false);

  // Unlock Month Password Modal states
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockTargetArchive, setUnlockTargetArchive] = useState<any | null>(null);
  const [unlockReason, setUnlockReason] = useState("");
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Form states
  const [itemDescription, setItemDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [unitPrice, setUnitPrice] = useState<number | "">("");
  const [qty, setQty] = useState<number | "">("");
  const [unit, setUnit] = useState("PC");
  const [category, setCategory] = useState("OFFICE_SUPPLIES");
  const [searchTerm, setSearchTerm] = useState("");
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [supplierName, setSupplierName] = useState("");
  const [destinationName, setDestinationName] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split("T")[0]);
  const [isCapex, setIsCapex] = useState(false);

  // Inline Document Viewer Modal states
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<any | null>(null);

  // Unit & Category Management states
  const DEFAULT_UNITS = ["PC", "PACK", "BOX", "TAB", "SACH", "CAP", "NEB", "SET", "ROLL", "UNIT"];
  const [unitsList, setUnitsList] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cp360_opex_custom_units");
      if (saved) {
        try { return JSON.parse(saved); } catch { }
      }
    }
    return DEFAULT_UNITS;
  });
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [newUnitInput, setNewUnitInput] = useState("");

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"OPEX" | "CAPEX">("OPEX");
  const [isManagingCategory, setIsManagingCategory] = useState(false);

  // File Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Approval Modal form
  const [approveStatus, setApproveStatus] = useState<"OK" | "FOR_REVIEW" | "REJECTED">("OK");
  const [approveDocUrl, setApproveDocUrl] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`${backendUrl}/suppliers`);
      const json = await res.json();
      setSuppliersList(Array.isArray(json) ? json : json.data || []);
    } catch (err) {
      console.error("Failed to fetch suppliers list:", err);
    }
  };

  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const fetchActiveCategories = async () => {
    try {
      const res = await fetch(`${backendUrl}/categories/active`);
      const json = await res.json();
      setCategoriesList(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error("Failed to fetch active categories:", err);
    }
  };

  const fetchEntries = async (page = currentPage, size = pageSize) => {
    setIsLoading(true);
    setIsPageLoading(true);
    try {
      let query = `year=${selectedYear}&month=${selectedMonth}`;
      if (statusFilter !== "ALL") query += `&status=${statusFilter}`;
      if (capexFilter !== "ALL") query += `&isCapex=${capexFilter === "CAPEX"}`;
      if (siteFilter !== "ALL") query += `&destinationName=${encodeURIComponent(siteFilter)}`;
      query += `&page=${page}&pageSize=${size}`;

      const res = await fetch(`${backendUrl}/opex/entries?${query}`);
      const json = await res.json();
      setEntries(json.data || []);
      setTotalCount(json.total ?? 0);
      setTotalPages(json.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch OPEX entries:", err);
    } finally {
      setIsLoading(false);
      setIsPageLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      let query = `year=${selectedYear}&month=${selectedMonth}`;
      if (siteFilter !== "ALL") query += `&destinationName=${encodeURIComponent(siteFilter)}`;

      const res = await fetch(`${backendUrl}/opex/report?${query}`);
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

  // When filters change — reset to page 1
  useEffect(() => {
    setCurrentPage(1);
    fetchEntries(1, pageSize);
    fetchReport();
    fetchArchives();
    fetchSuppliers();
    fetchActiveCategories();
  }, [selectedYear, selectedMonth, statusFilter, capexFilter, siteFilter]);

  // When page or pageSize changes (not caused by filter reset)
  useEffect(() => {
    fetchEntries(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemDescription || unitPrice === "" || qty === "" || !selectedSupplierId) return;

    setIsSubmitting(true);
    try {
      const matchedSite = sites.find(s => s.name === destinationName);
      const matchedSupplier = suppliersList.find(s => s.id === selectedSupplierId);
      const finalSupplierName = matchedSupplier ? matchedSupplier.name : supplierName;

      // Build transaction date matching selectedYear and selectedMonth filter
      const currentDay = new Date().getDate();
      const maxDays = new Date(selectedYear, selectedMonth, 0).getDate();
      const validDay = Math.min(currentDay, maxDays);
      const formattedDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(validDay).padStart(2, "0")}`;

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
          supplierId: selectedSupplierId || undefined,
          supplierName: finalSupplierName || undefined,
          destinationName: destinationName || undefined,
          siteId: matchedSite?.id || undefined,
          transactionDate: formattedDate,
          isCapex,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(`Error: ${json.message || "Failed to create entry"}`);
        return;
      }

      // Upload file attachment if selected
      if (selectedFile && json.data?.id) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        await fetch(`${backendUrl}/opex/entries/${json.data.id}/attachments`, {
          method: "POST",
          headers: {
            "x-user": currentUser?.email || "superadmin@contactpoint360.com",
          },
          body: formData,
        });
      }

      setIsNewEntryOpen(false);
      resetForm();
      setSelectedFile(null);
      await fetchEntries();
      await fetchReport();
    } catch (err: any) {
      alert(`Failed to create entry: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadFileForEntry = async (entryId: string, file: File) => {
    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${backendUrl}/opex/entries/${entryId}/attachments`, {
        method: "POST",
        headers: {
          "x-user": currentUser?.email || "superadmin@contactpoint360.com",
        },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        alert(`Upload Error: ${json.message}`);
        return;
      }
      fetchEntries();
    } catch (err: any) {
      alert(`Failed to upload attachment: ${err.message}`);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleRemoveAttachment = async (entry: OpexEntry, attachmentId: string) => {
    let reason = "";
    if (entry.status === "OK") {
      const inputReason = prompt("Justification Reason Required:\nA justification reason is required to remove an attachment from an approved expense entry.");
      if (inputReason === null) return;
      if (!inputReason.trim()) {
        alert("Removal cancelled: Reason is required.");
        return;
      }
      reason = inputReason.trim();
    } else {
      if (!confirm("Are you sure you want to remove this attachment?")) return;
    }

    try {
      const res = await fetch(`${backendUrl}/opex/entries/${entry.id}/attachments/${attachmentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user": currentUser?.email || "superadmin@contactpoint360.com",
        },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(`Error: ${json.message}`);
        return;
      }
      alert("Attachment removed.");
      fetchEntries();
    } catch (err: any) {
      alert(`Failed to remove attachment: ${err.message}`);
    }
  };

  const handleAddUnit = () => {
    if (!newUnitInput.trim()) return;
    const formatted = newUnitInput.trim().toUpperCase().replace(/\s+/g, "_");
    if (unitsList.includes(formatted)) {
      alert(`Unit "${formatted}" already exists.`);
      return;
    }
    const updated = [...unitsList, formatted];
    setUnitsList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("cp360_opex_custom_units", JSON.stringify(updated));
    }
    setUnit(formatted);
    setNewUnitInput("");
  };

  const handleRemoveUnit = (unitToRemove: string) => {
    if (unitsList.length <= 1) {
      alert("At least one unit option must remain.");
      return;
    }
    const updated = unitsList.filter(u => u !== unitToRemove);
    setUnitsList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("cp360_opex_custom_units", JSON.stringify(updated));
    }
    if (unit === unitToRemove) {
      setUnit(updated[0]);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsManagingCategory(true);
    try {
      const res = await fetch(`${backendUrl}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": currentUser?.email || "superadmin@contactpoint360.com",
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          type: newCategoryType,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(`Error: ${json.message}`);
        return;
      }
      setNewCategoryName("");
      await fetchActiveCategories();
      setCategory(json.data.name);
      alert(`Category "${json.data.name}" added successfully.`);
    } catch (err: any) {
      alert(`Failed to add category: ${err.message}`);
    } finally {
      setIsManagingCategory(false);
    }
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (!confirm(`Are you sure you want to remove the category "${catName}"?`)) return;
    setIsManagingCategory(true);
    try {
      const res = await fetch(`${backendUrl}/categories/${catId}`, {
        method: "DELETE",
        headers: {
          "x-user": currentUser?.email || "superadmin@contactpoint360.com",
        },
      });
      const json = await res.json();
      if (!res.ok) {
        alert(`Error: ${json.message}`);
        return;
      }
      await fetchActiveCategories();
      alert(`Category "${catName}" removed.`);
    } catch (err: any) {
      alert(`Failed to remove category: ${err.message}`);
    } finally {
      setIsManagingCategory(false);
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

  const handleOpenLockModal = () => {
    setLockPassword("");
    setLockError(null);
    setIsLockModalOpen(true);
  };

  const handleConfirmLockMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockPassword.trim()) {
      setLockError("Account password is required.");
      return;
    }

    setIsLocking(true);
    setLockError(null);

    try {
      const res = await fetch(`${backendUrl}/opex/lock-month`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": currentUser?.email || "superadmin@contactpoint360.com",
        },
        body: JSON.stringify({
          year: selectedYear,
          month: selectedMonth,
          password: lockPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setLockError(json.message || "Invalid account password.");
        return;
      }

      setIsLockModalOpen(false);
      setLockPassword("");
      alert(`Success! Financial period ${selectedYear}-${String(selectedMonth).padStart(2, "0")} has been locked and archived.`);
      fetchEntries();
      fetchReport();
      fetchArchives();
    } catch (err: any) {
      setLockError(`Failed to lock month: ${err.message}`);
    } finally {
      setIsLocking(false);
    }
  };

  const handleOpenUnlockModal = (archive: any) => {
    setUnlockTargetArchive(archive);
    setUnlockReason("");
    setUnlockPassword("");
    setUnlockError(null);
    setIsUnlockModalOpen(true);
  };

  const handleConfirmUnlockMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockTargetArchive) return;
    if (!unlockReason.trim()) {
      setUnlockError("Justification reason is required.");
      return;
    }
    if (!unlockPassword.trim()) {
      setUnlockError("Account password is required.");
      return;
    }

    setIsUnlocking(true);
    setUnlockError(null);

    try {
      const res = await fetch(`${backendUrl}/opex/unlock-month`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": currentUser?.email || "superadmin@contactpoint360.com",
        },
        body: JSON.stringify({
          year: unlockTargetArchive.year,
          month: unlockTargetArchive.month,
          reason: unlockReason.trim(),
          password: unlockPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setUnlockError(json.message || "Failed to unlock financial period.");
        return;
      }

      setIsUnlockModalOpen(false);
      setUnlockTargetArchive(null);
      setUnlockReason("");
      setUnlockPassword("");
      alert(`Financial period ${unlockTargetArchive.yearMonth} has been unlocked.`);
      fetchEntries();
      fetchReport();
      fetchArchives();
    } catch (err: any) {
      setUnlockError(`Failed to unlock month: ${err.message}`);
    } finally {
      setIsUnlocking(false);
    }
  };

  const role = currentUser?.role || "SUPER_ADMIN";
  const isEmployee = role === "EMPLOYEE";
  const isInventoryStaff = role === "INVENTORY_STAFF";
  const isTeamLeader = role === "TEAM_LEADER";
  const isOpsManager = role === "OPS_MANAGER" || role === "ADMIN";
  const isSuperAdmin = role === "SUPER_ADMIN";

  const canLockMonth = isOpsManager || isSuperAdmin;
  const canViewReports = isOpsManager || isSuperAdmin;
  const canApproveEntries = isTeamLeader || isOpsManager || isSuperAdmin;

  const handleUnlockMonth = async (archive: MonthlyArchive) => {
    if (!isSuperAdmin) return;

    const reason = prompt(`Super Admin Override: Enter reason to unlock period ${archive.yearMonth}:`);
    if (!reason || !reason.trim()) {
      alert("Unlock canceled. A justification reason is required.");
      return;
    }

    const [yStr, mStr] = archive.yearMonth.split("-");
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10);

    try {
      const res = await fetch(`${backendUrl}/opex/unlock-month`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": currentUser?.email || "superadmin@contactpoint360.com",
        },
        body: JSON.stringify({ year, month, reason: reason.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(`Unlock Error: ${json.message}`);
        return;
      }

      alert(`Success! Period ${archive.yearMonth} has been unlocked and recorded in audit trails.`);
      fetchEntries();
      fetchReport();
      fetchArchives();
    } catch (err: any) {
      alert(`Failed to unlock month: ${err.message}`);
    }
  };

  const resetForm = () => {
    setItemDescription("");
    setBrand("");
    setUnitPrice("");
    setQty("");
    setUnit("PC");
    setCategory("OFFICE_SUPPLIES");
    setSelectedSupplierId("");
    setSupplierName("");
    setDestinationName("");
    setIsCapex(false);
    setSelectedFile(null);
  };

  const formatMoney = (val: number) => `₱${Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const filteredEntries = entries.filter((item) => {
    if (siteFilter !== "ALL") {
      const matchSite = item.destinationName === siteFilter || item.site?.name === siteFilter || item.siteId === siteFilter;
      if (!matchSite) return false;
    }
    if (!searchTerm || !searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    return (
      (item.itemDescription || "").toLowerCase().includes(q) ||
      (item.category || "").toLowerCase().includes(q) ||
      (item.supplierName || item.supplier?.name || "").toLowerCase().includes(q) ||
      (item.destinationName || item.site?.name || "").toLowerCase().includes(q) ||
      (item.status || "").toLowerCase().includes(q)
    );
  });

  if (isEmployee) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", margin: "24px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#991B1B", marginBottom: "8px" }}>Access Denied</h2>
        <p style={{ color: "#64748B", fontSize: "14px", maxWidth: "480px", margin: "0 auto" }}>
          Employees do not have access to the Monthly OPEX & CAPEX Financial Reporting module. Please contact your administrator if you require access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-module-flip p-6 text-slate-800 w-full min-h-full flex flex-col flex-1">
      {/* Header & Actions Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animated-mesh-background p-6 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {activeSubTab === "tracker" ? "Transaction Tracker" : "Executive Rollups & Financial Archives"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {activeSubTab === "tracker"
              ? "Track continuous expenses, log OPEX/CAPEX entries, and manage approval sign-offs."
              : "Executive spend summaries, Month-over-Month deltas, and historical locked financial archives."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeSubTab === "tracker" && (
            <button
              onClick={() => setIsNewEntryOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-indigo-200 dark:shadow-none"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Log Expense Entry
            </button>
          )}
          {canLockMonth && activeSubTab === "reports" && (
            <button
              onClick={handleOpenLockModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-emerald-200 dark:shadow-none"
            >
              🔒 Lock Month ({selectedYear}-{String(selectedMonth).padStart(2, "0")})
            </button>
          )}
        </div>
      </div>

      {/* Search & Metrics Summary Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 animated-mesh-background p-4 rounded-xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex flex-wrap items-center gap-3">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search transactions by description, supplier, category, destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] text-sm bg-transparent border-none focus:outline-none text-gray-900 dark:text-white placeholder-gray-400"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-xs text-gray-400 hover:text-gray-600 mr-2">
              Clear
            </button>
          )}

          {/* Filters */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <select
              value={siteFilter}
              onChange={e => setSiteFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium focus:outline-none"
            >
              <option value="ALL">All Sites / Locations</option>
              {sites.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium focus:outline-none"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(parseInt(e.target.value, 10))}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium focus:outline-none"
            >
              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, idx) => (
                <option key={m} value={idx + 1}>{m}</option>
              ))}
            </select>
            {activeSubTab === "tracker" && (
              <>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="text-xs py-1.5 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="OK">OK (Approved)</option>
                  <option value="FOR_REVIEW">FOR REVIEW</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
                <select
                  value={capexFilter}
                  onChange={e => setCapexFilter(e.target.value)}
                  className="text-xs py-1.5 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium focus:outline-none"
                >
                  <option value="ALL">All Types</option>
                  <option value="OPEX">OPEX Only</option>
                  <option value="CAPEX">CAPEX Only</option>
                </select>
              </>
            )}
          </div>
        </div>

        <div className="animated-mesh-background p-4 rounded-xl border border-indigo-100 dark:border-gray-700/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">TOTAL TRANSACTIONS</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{totalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-gray-700 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold">
            {totalCount}
          </div>
        </div>
      </div>

      {/* SubTab 1: Transaction Tracker Table */}
      {activeSubTab === "tracker" && (
        <div className="animated-mesh-background rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm" style={{ display: "flex", flexDirection: "column", height: "min(500px, calc(100vh - 340px))", minHeight: 280 }}>
          <div style={{ overflowX: "auto", overflowY: "auto", flex: 1, minHeight: 0, position: "relative" }}>
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-700/90 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700" style={{ position: "sticky", top: 0, zIndex: 10 }}>
                <tr>
                  <th className="px-6 py-4 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>DATE</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>DESCRIPTION</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 12h10M7 17h10" />
                      </svg>
                      <span>CATEGORY</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>LOCATION</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V10m0 0V4" />
                      </svg>
                      <span>SUPPLIER NAME</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold text-right">
                    <span>QTY</span>
                  </th>
                  <th className="px-6 py-4 font-semibold text-right">
                    <span>UNIT PRICE</span>
                  </th>
                  <th className="px-6 py-4 font-semibold text-right">
                    <span>TOTAL</span>
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>STATUS</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold text-right">
                    {canApproveEntries ? "REVIEWED BY / ACTIONS" : "REVIEWED BY"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <div className="inline-block animate-spin rounded-full h-7 w-7 border-3 border-indigo-600 border-t-transparent mb-2"></div>
                      <p className="text-xs">Loading transaction entries...</p>
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <p className="text-sm font-medium">No transactions found</p>
                      <p className="text-xs mt-1">Try adjusting your search query or filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((item) => {
                    const supName = item.supplierName || item.supplier?.name || "Unassigned";
                    const initial = supName[0].toUpperCase();

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                          {new Date(item.transactionDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-white text-xs">
                              {item.itemDescription}
                            </span>
                            {item.isCapex && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded text-[10px] font-bold">
                                CAPEX
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-800 text-xs font-medium">
                            <svg className="w-3 h-3 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {item.destinationName || item.site?.name || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0">
                              {initial}
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-white text-xs">
                              {supName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                          {Number(item.qty)} {item.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs text-gray-600 dark:text-gray-300">
                          {formatMoney(Number(item.unitPrice))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-bold text-gray-900 dark:text-white">
                          {formatMoney(Number(item.total))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${item.status === "OK" ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800" :
                            item.status === "FOR_REVIEW" ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800" :
                              item.status === "REJECTED" ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800" :
                                "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
                            }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {item.approvedByUser ? (
                            <div className="flex flex-col items-end gap-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/80 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 text-xs font-semibold">
                                <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {item.approvedByUser.name || item.approvedByUser.email}
                              </span>
                              {canApproveEntries && (
                                <button
                                  onClick={() => {
                                    if (item.enteredByUserId === currentUser?.id || item.enteredByUser?.email === currentUser?.email) {
                                      alert("Segregation of Duties: You cannot approve or sign off on an expense entry created under your own account.");
                                      return;
                                    }
                                    setSelectedEntry(item);
                                    setApproveStatus(item.status as any);
                                    setApproveDocUrl(item.sourceDocumentUrl || "");
                                    setIsApproveModalOpen(true);
                                  }}
                                  className="text-[11px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-medium underline"
                                >
                                  Change Sign-Off
                                </button>
                              )}
                            </div>
                          ) : canApproveEntries ? (
                            <button
                              onClick={() => {
                                if (item.enteredByUserId === currentUser?.id || item.enteredByUser?.email === currentUser?.email) {
                                  alert("Segregation of Duties: You cannot approve or sign off on an expense entry created under your own account.");
                                  return;
                                }
                                setSelectedEntry(item);
                                setApproveStatus(item.status === "PENDING" ? "OK" : item.status as any);
                                setApproveDocUrl(item.sourceDocumentUrl || "");
                                setIsApproveModalOpen(true);
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${(item.enteredByUserId === currentUser?.id || item.enteredByUser?.email === currentUser?.email)
                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                : "bg-white hover:bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm"
                                }`}
                              title={(item.enteredByUserId === currentUser?.id || item.enteredByUser?.email === currentUser?.email) ? "Segregation of Duties: You cannot approve your own entry" : "Review or Sign-Off entry"}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              Review / Sign-Off
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium italic">Pending Review</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {/* Page-loading overlay: subtle opacity fade on the table while fetching */}
            {isPageLoading && (
              <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20, pointerEvents: "none" }}>
                <div className="inline-block animate-spin rounded-full h-7 w-7 border-[3px] border-indigo-600 border-t-transparent" />
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800 flex-shrink-0">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="ml-2">
                Showing <span className="font-semibold text-gray-700 dark:text-gray-200">{entries.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="font-semibold text-gray-700 dark:text-gray-200">{totalCount}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isPageLoading}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <span className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || isPageLoading}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Combined SubTab 2: Executive Rollups, MoM & Locked Archives */}
      {activeSubTab === "reports" && (
        <div className="space-y-6">
          {reportData && (
            <>
              {/* Executive Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Total OPEX */}
                <div className="animated-mesh-background p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Total Monthly OPEX</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatMoney(reportData.executiveSummary.totalOpex)}</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-gray-700 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                {/* Card 2: CAPEX */}
                <div className="animated-mesh-background p-5 rounded-2xl border border-purple-100 dark:border-gray-700/60 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">CAPEX Expenditures</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">{formatMoney(reportData.executiveSummary.totalCapex)}</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-300">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V10m0 0V4" />
                    </svg>
                  </div>
                </div>

                {/* Card 3: Prior Month */}
                <div className="animated-mesh-background p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prior Month Comparison</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-1">{formatMoney(reportData.executiveSummary.priorMonthTotal)}</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                {/* Card 4: MoM Delta */}
                <div className="animated-mesh-background p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Month-over-Month Delta</p>
                    <p className={`text-2xl font-bold mt-1 ${reportData.executiveSummary.momDelta >= 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {reportData.executiveSummary.momDelta >= 0 ? `+${formatMoney(reportData.executiveSummary.momDelta)}` : formatMoney(reportData.executiveSummary.momDelta)}
                    </p>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">({reportData.executiveSummary.momDeltaPct}%)</span>
                  </div>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${reportData.executiveSummary.momDelta >= 0
                    ? "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300"
                    : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300"
                    }`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={reportData.executiveSummary.momDelta >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Rollup Breakdown Grids */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Spend by Destination */}
                <div className="animated-mesh-background p-6 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                    <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">Spend by Destination</h3>
                  </div>
                  <div className="space-y-3">
                    {reportData.byDestination.length === 0 ? (
                      <p className="text-xs text-gray-400">No destination data recorded.</p>
                    ) : (
                      reportData.byDestination.map((d: any, i: number) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0 text-sm">
                          <span className="text-gray-700 dark:text-gray-300 font-medium text-xs">{d.name}</span>
                          <span className="font-bold text-gray-900 dark:text-white text-xs">{formatMoney(d.total)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Spend by Supplier */}
                <div className="animated-mesh-background p-6 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V10m0 0V4" />
                    </svg>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">Spend by Supplier</h3>
                  </div>
                  <div className="space-y-3">
                    {reportData.bySupplier.length === 0 ? (
                      <p className="text-xs text-gray-400">No supplier data recorded.</p>
                    ) : (
                      reportData.bySupplier.map((s: any, i: number) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                              {s.name[0].toUpperCase()}
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 font-medium text-xs">{s.name}</span>
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white text-xs">{formatMoney(s.total)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Spend by Category */}
                <div className="animated-mesh-background p-6 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 12h10M7 17h10" />
                    </svg>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">Spend by Category</h3>
                  </div>
                  <div className="space-y-3">
                    {reportData.byCategory.length === 0 ? (
                      <p className="text-xs text-gray-400">No category data recorded.</p>
                    ) : (
                      reportData.byCategory.map((c: any, i: number) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0 text-sm">
                          <span className="text-gray-700 dark:text-gray-300 font-medium text-xs">{c.category}</span>
                          <span className="font-bold text-gray-900 dark:text-white text-xs">{formatMoney(c.total)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Historical Locked Financial Archives Section */}
          <div className="animated-mesh-background p-6 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Historical Locked Financial Archives
              </h3>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 rounded-full text-xs font-bold">
                {archives.length} {archives.length === 1 ? "Archive" : "Archives"}
              </span>
            </div>

            {archives.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                No monthly financial archives have been locked yet.
              </div>
            ) : (
              <div className="space-y-3">
                {archives.map((a) => (
                  <div key={a.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-base">
                        OPEX Archive — {a.yearMonth}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Locked on {new Date(a.lockedAt).toLocaleString()} by {a.lockedByUser?.name || a.lockedByUser?.email || "Finance Admin"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 ml-auto md:ml-0">
                      <div className="text-right">
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block uppercase">Archived Total</span>
                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                          {formatMoney(a.summarySnapshot?.totalOpex || 0)}
                        </span>
                      </div>
                      {isSuperAdmin && (
                        <button
                          onClick={() => handleOpenUnlockModal(a)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold rounded-lg transition-colors shadow-sm"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                          </svg>
                          Unlock Month (Override)
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: New Entry */}
      {isNewEntryOpen && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "1rem",
          zIndex: 99999,
        }}>
          <div style={{
            width: "100%",
            maxWidth: "640px",
            maxHeight: "calc(100vh - 40px)",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            border: "1px solid #e2e8f0",
          }}>
            {/* Header */}
            <div style={{
              padding: "1rem 1.4rem",
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
            <form onSubmit={handleCreateEntry} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", padding: "1.1rem 1.4rem", overflowY: "auto", flex: 1 }}>

                {/* Item Description */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                  <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Item Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Office Supplies, Medical Stock, Security Uniforms"
                    value={itemDescription}
                    onChange={e => setItemDescription(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.4rem 0.6rem",
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
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
                        padding: "0.4rem 0.6rem",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.8rem",
                        color: "#1e293b",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
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
                        padding: "0.4rem 0.6rem",
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <div className="flex items-center justify-between">
                      <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Unit</label>
                      {(isSuperAdmin || isOpsManager) && (
                        <button
                          type="button"
                          onClick={() => setIsUnitModalOpen(true)}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline flex items-center gap-0.5"
                        >
                          ⚙️ Manage Units
                        </button>
                      )}
                    </div>
                    <select
                      value={unit}
                      onChange={e => setUnit(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.4rem 0.6rem",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.8rem",
                        color: "#475569",
                        outline: "none",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      {unitsList.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <div className="flex items-center justify-between">
                      <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Category *</label>
                      {(isSuperAdmin || isOpsManager) && (
                        <button
                          type="button"
                          onClick={() => {
                            fetchActiveCategories();
                            setIsCategoryModalOpen(true);
                          }}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline flex items-center gap-0.5"
                        >
                          ⚙️ Manage Categories
                        </button>
                      )}
                    </div>
                    <select
                      value={category}
                      onFocus={fetchActiveCategories}
                      onChange={e => setCategory(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.4rem 0.6rem",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.8rem",
                        color: "#475569",
                        outline: "none",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      {categoriesList.length > 0 ? (
                        categoriesList.map(c => (
                          <option key={c.id} value={c.name}>{c.name.replace(/_/g, " ")} ({c.type})</option>
                        ))
                      ) : (
                        <>
                          <option value="OFFICE_SUPPLIES">OFFICE SUPPLIES (OPEX)</option>
                          <option value="MEDICAL_PHARMACY">MEDICAL PHARMACY (OPEX)</option>
                          <option value="SECURITY_UNIFORM">SECURITY UNIFORM (OPEX)</option>
                          <option value="IT_PERIPHERALS">IT PERIPHERALS (CAPEX)</option>
                          <option value="MAINTENANCE_REPAIRS">MAINTENANCE REPAIRS (OPEX)</option>
                          <option value="UTILITIES">UTILITIES (OPEX)</option>
                          <option value="FACILITIES">FACILITIES (CAPEX)</option>
                          <option value="MISCELLANEOUS">MISCELLANEOUS (OPEX)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Supplier & Destination Site */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Assigned Supplier *</label>
                    <select
                      required
                      value={selectedSupplierId}
                      onFocus={fetchSuppliers}
                      onChange={e => {
                        const supId = e.target.value;
                        setSelectedSupplierId(supId);
                        const matched = suppliersList.find(s => s.id === supId);
                        setSupplierName(matched ? matched.name : "");
                      }}
                      style={{
                        width: "100%",
                        padding: "0.4rem 0.6rem",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.8rem",
                        color: "#475569",
                        outline: "none",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <option value="">Select Supplier...</option>
                      {suppliersList.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.supplierId ? `(${s.supplierId})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Destination Site *</label>
                    <select
                      value={destinationName}
                      onChange={e => setDestinationName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.4rem 0.6rem",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.8rem",
                        color: "#475569",
                        outline: "none",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <option value="">Select Site...</option>
                      {sites.map(s => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* CAPEX Flag */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.15rem" }}>
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

                {/* Direct Receipt / Document File Upload */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", marginTop: "0.5rem" }}>
                  <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>
                    Attach Receipt / Source Document (PDF, JPG, PNG, HEIC — Max 10MB)
                  </label>
                  <div className="p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center text-center gap-1.5 hover:border-indigo-400 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.heic"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          if (file.size > 10 * 1024 * 1024) {
                            alert("File size exceeds 10MB limit.");
                            return;
                          }
                          setSelectedFile(file);
                        }
                      }}
                      className="hidden"
                      id="new-entry-file-input"
                    />
                    <label htmlFor="new-entry-file-input" className="cursor-pointer flex flex-col items-center">
                      <svg className="w-6 h-6 text-indigo-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      {selectedFile ? (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          ✓ Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </span>
                      ) : (
                        <>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Click or drag file to attach receipt</span>
                          <span className="text-[10px] text-slate-400">PDF, JPG, PNG, or HEIC up to 10MB</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "0.75rem",
                padding: "0.85rem 1.4rem",
                borderTop: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
                flexShrink: 0,
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
                  disabled={isSubmitting}
                  style={{
                    padding: "0.45rem 1.25rem",
                    borderRadius: 6,
                    border: "none",
                    background: isSubmitting ? "#94a3b8" : "linear-gradient(135deg, #210cae 0%, #4dc9e6 100%)",
                    color: "#ffffff",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 4px rgba(33,12,174,0.1)",
                  }}
                >
                  {isSubmitting ? "Saving..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
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
          alignItems: "flex-start",
          padding: "1rem",
          zIndex: 10000,
        }}>
          <div style={{
            width: "100%",
            maxWidth: "500px",
            maxHeight: "calc(100% - 1rem)",
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

                {/* Active Document Attachments List & Direct File Upload */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.5rem" }}>
                  <div className="flex items-center justify-between">
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>
                      Source Document Attachments (Required for OK Status)
                    </label>
                    <label htmlFor="approve-modal-file-upload" className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer flex items-center gap-1">
                      + Upload File
                    </label>
                    <input
                      type="file"
                      id="approve-modal-file-upload"
                      accept=".pdf,.jpg,.jpeg,.png,.heic"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0] && selectedEntry) {
                          handleUploadFileForEntry(selectedEntry.id, e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </div>

                  {selectedEntry?.attachments && selectedEntry.attachments.length > 0 ? (
                    <div className="space-y-2">
                      {selectedEntry.attachments.map((att: any) => (
                        <div key={att.id} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold rounded text-[10px]">
                              {att.originalFilename?.toLowerCase().endsWith(".pdf") ? "PDF" : "FILE"}
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{att.originalFilename}</span>
                            <span className="text-[10px] text-slate-400">({(att.fileSizeBytes / 1024).toFixed(1)} KB)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setViewingAttachment(att);
                                setIsViewerModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-xs"
                            >
                              View Document
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(selectedEntry, att.id)}
                              className="p-1 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50"
                              title="Remove attachment"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : selectedEntry?.sourceDocumentUrl ? (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between">
                      <span className="text-amber-800">
                        <strong>Legacy URL:</strong> {selectedEntry.sourceDocumentUrl}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setViewingAttachment({
                            originalFilename: "Legacy Document Link",
                            fileUrl: selectedEntry.sourceDocumentUrl,
                            mimeType: selectedEntry.sourceDocumentUrl?.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
                          });
                          setIsViewerModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
                      >
                        View Link
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                      ⚠️ No source document attached. Please upload a receipt/document file before approving (status = OK).
                    </div>
                  )}
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

      {/* Modal: Lock Month Password Verification */}
      {isLockModalOpen && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 99999,
          padding: "1rem",
        }}>
          <div style={{
            width: "100%",
            maxWidth: "460px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}>
            <div style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Confirm Financial Period Close</h3>
                  <p className="text-xs text-gray-500">Period: {selectedYear}-{String(selectedMonth).padStart(2, "0")}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLockModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg ml-auto"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleConfirmLockMonth} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs leading-relaxed">
                <strong>Warning:</strong> Locking this period will generate an immutable financial rollup snapshot. Further expense entries or modifications for this month will be locked.
              </div>

              {lockError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                  {lockError}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  Enter Account Password *
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Enter your account password to confirm"
                  value={lockPassword}
                  onChange={(e) => setLockPassword(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLockModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLocking}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {isLocking ? "Verifying..." : "Confirm & Lock Period"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Unlock Month Password Verification */}
      {isUnlockModalOpen && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 99999,
          padding: "1rem",
        }}>
          <div style={{
            width: "100%",
            maxWidth: "480px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}>
            <div style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Unlock Financial Archive (Override)</h3>
                  <p className="text-xs text-gray-500">Period: {unlockTargetArchive?.yearMonth}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUnlockModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg ml-auto"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleConfirmUnlockMonth} className="p-6 space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs leading-relaxed">
                <strong>Super Admin Override:</strong> Unlocking period {unlockTargetArchive?.yearMonth} will reopen locked transactions for editing. An explicit justification and account password confirmation are required.
              </div>

              {unlockError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                  {unlockError}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  Justification Reason *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Provide explicit business justification for unlocking this period..."
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-500 text-gray-900 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  Enter Super Admin Password *
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Enter your account password to confirm"
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-500 text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUnlockModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUnlocking}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {isUnlocking ? "Verifying..." : "Confirm & Unlock Month"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Inline Document / Receipt Viewer (PDF Embed & Direct Image Render) */}
      {isViewerModalOpen && viewingAttachment && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 999999,
          padding: "1rem",
        }}>
          <div style={{
            width: "100%",
            maxWidth: "850px",
            height: "85vh",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}>
            <div style={{
              padding: "1rem 1.5rem",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#f8fafc",
            }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  {viewingAttachment.originalFilename?.toLowerCase().endsWith(".pdf") ? "PDF" : "IMG"}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{viewingAttachment.originalFilename}</h3>
                  <p className="text-[11px] text-gray-500">
                    Uploaded by {viewingAttachment.uploadedByUser?.name || viewingAttachment.uploadedByUser?.email || "User"} • {new Date(viewingAttachment.uploadedAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={viewingAttachment.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-lg transition-colors border border-indigo-200 inline-flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Original
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setIsViewerModalOpen(false);
                    setViewingAttachment(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-900 overflow-hidden flex items-center justify-center p-2">
              {viewingAttachment.originalFilename?.toLowerCase().endsWith(".pdf") || viewingAttachment.mimeType?.includes("pdf") ? (
                <iframe
                  src={viewingAttachment.fileUrl}
                  title="PDF Source Document Viewer"
                  width="100%"
                  height="100%"
                  className="rounded-lg border-0 bg-white"
                />
              ) : (
                <img
                  src={viewingAttachment.fileUrl}
                  alt={viewingAttachment.originalFilename}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: SuperAdmin Unit Items Manager */}
      {isUnitModalOpen && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 999999,
          padding: "1rem",
        }}>
          <div style={{
            width: "100%",
            maxWidth: "460px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}>
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  ⚙️ Manage Expense Measurement Units
                </h3>
                <p className="text-xs text-slate-500">Add or remove custom unit types for expense entries.</p>
              </div>
              <button onClick={() => setIsUnitModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. LITER, KG, PAIR, BOTTLE"
                  value={newUnitInput}
                  onChange={(e) => setNewUnitInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddUnit(); } }}
                  className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-lg uppercase"
                />
                <button
                  type="button"
                  onClick={handleAddUnit}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  + Add Unit
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Available Units ({unitsList.length})</label>
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {unitsList.map((u) => (
                    <div key={u} className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200 font-mono">{u}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveUnit(u)}
                        className="text-rose-500 hover:text-rose-700 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-rose-50"
                        title="Remove unit"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: SuperAdmin Expense Category Manager */}
      {isCategoryModalOpen && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 999999,
          padding: "1rem",
        }}>
          <div style={{
            width: "100%",
            maxWidth: "520px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}>
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  ⚙️ Manage Expense Categories
                </h3>
                <p className="text-xs text-slate-500">Create or deactivate OPEX/CAPEX category options.</p>
              </div>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="p-4 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <span className="text-xs font-bold text-slate-700">Add New Category Option</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Category Name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="col-span-2 text-xs px-3 py-2 border border-slate-200 rounded-lg uppercase"
                  />
                  <select
                    value={newCategoryType}
                    onChange={(e) => setNewCategoryType(e.target.value as any)}
                    className="text-xs px-2 py-2 border border-slate-200 rounded-lg bg-white font-medium"
                  >
                    <option value="OPEX">OPEX</option>
                    <option value="CAPEX">CAPEX</option>
                  </select>
                </div>
                <button
                  type="button"
                  disabled={isManagingCategory}
                  onClick={handleCreateCategory}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  {isManagingCategory ? "Saving..." : "+ Save Category"}
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Active Categories ({categoriesList.length})</label>
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {categoriesList.map((c) => (
                    <div key={c.id} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${c.type === "CAPEX" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {c.type}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{c.name.replace(/_/g, " ")}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(c.id, c.name)}
                        className="text-rose-500 hover:text-rose-700 text-xs font-semibold px-2 py-1 rounded hover:bg-rose-50"
                        title="Remove category"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
