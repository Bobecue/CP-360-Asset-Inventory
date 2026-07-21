"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Types & Mock Data Fallbacks
import {
  User,
  CatalogItem,
  DbNotification,
  mockUsers,
  mockItems,
  getGeneratedPassword
} from "@/types/dashboard";

// Sub-components
import { Sidebar } from "./_components/Sidebar";
import { TopBar } from "./_components/TopBar";
import { DashboardOverview } from "./_components/DashboardOverview";
import { UsersTab } from "./_components/UsersTab";
import { SettingsTab } from "./_components/SettingsTab";
import { CatalogTab } from "./_components/CatalogTab";
import { ComingSoonPlaceholder } from "./_components/ComingSoonPlaceholder";
import { ItemHistoryModal } from "./_components/modals/ItemHistoryModal";
import { ReportsTab } from "./_components/ReportsTab";
import { ScanModal } from "./_components/modals/ScanModal";
import { ScanOperationsTab } from "./_components/ScanOperationsTab";
import { OfflineWarningScreen } from "./_components/OfflineWarningScreen";
import { ProcurementTab } from "./_components/ProcurementTab";
import { RequestsTab } from "./_components/RequestsTab";

// Modals
import { BulkRequestModal } from "./_components/modals/BulkRequestModal";
import { DeleteConfirmModal } from "./_components/modals/DeleteConfirmModal";
import { StockModal } from "./_components/modals/StockModal";
import { ViewTagsModal } from "./_components/modals/ViewTagsModal";
import { ItemModal } from "./_components/modals/ItemModal";
import { AddUserModal } from "./_components/modals/AddUserModal";
import { EditUserModal } from "./_components/modals/EditUserModal";
import { SiteModal } from "./_components/modals/SiteModal";
import { DeptModal } from "./_components/modals/DeptModal";
import { CategoryModal } from "./_components/modals/CategoryModal";

// Custom fetch monkey patch to dynamically route API calls to the correct hostname on port 3001
if (typeof window !== "undefined" && !(window as any).__fetch_patched__) {
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (typeof input === "string" && input.startsWith("http://localhost:3001")) {
      const hostname = window.location.hostname;
      input = input.replace("localhost", hostname);
    }
    return originalFetch(input, init);
  };
  (window as any).__fetch_patched__ = true;
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auto-close sidebar on mobile when tab changes or on initial load
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [activeTab]);

  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  // Form states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showAddConfirmation, setShowAddConfirmation] = useState(false);
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("EMPLOYEE");
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formSiteId, setFormSiteId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Edit form states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormName, setEditFormName] = useState("");
  const [editFormEmail, setEditFormEmail] = useState("");
  const [editFormRole, setEditFormRole] = useState("EMPLOYEE");
  const [editFormEmployeeId, setEditFormEmployeeId] = useState("");
  const [editFormDepartment, setEditFormDepartment] = useState("");
  const [editFormSiteId, setEditFormSiteId] = useState("");
  const [editFormIsActive, setEditFormIsActive] = useState(true);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [isSubmittingEditForm, setIsSubmittingEditForm] = useState(false);

  // Settings configuration states
  const [settingsSubTab, setSettingsSubTab] = useState<"sites" | "departments" | "categories">("sites");
  const [sites, setSites] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSubmittingSite, setIsSubmittingSite] = useState(false);
  const [isSubmittingDept, setIsSubmittingDept] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  // Settings Add/Edit Modal states
  const [siteModalOpen, setSiteModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<any | null>(null);
  const [siteName, setSiteName] = useState("");
  const [sitePrefix, setSitePrefix] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [siteError, setSiteError] = useState<string | null>(null);

  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [deptError, setDeptError] = useState<string | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryPrefix, setCategoryPrefix] = useState("");
  const [categoryType, setCategoryType] = useState<"CONSUMABLE" | "NON_CONSUMABLE">("NON_CONSUMABLE");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "site" | "department" | "category" | "item" | "bulk_items"; id: string; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // View Tags Modal states
  const [viewTagsItem, setViewTagsItem] = useState<CatalogItem | null>(null);
  const [viewTagsAssets, setViewTagsAssets] = useState<any[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  // Notifications states
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<DbNotification[]>([]);

  // Catalog states
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);

  // History & Audit Log states
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<CatalogItem | null>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Scan Modal state
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isBulkRequestOpen, setIsBulkRequestOpen] = useState(false);
  const [bulkRequestInitialMode, setBulkRequestInitialMode] = useState<'deploy' | 'request'>('deploy');

  const [mockAuditLogs, setMockAuditLogs] = useState<any[]>(() => {
    const getPastDateStr = (daysAgo: number, timeStr: string) => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      const datePart = d.toISOString().split('T')[0];
      return `${datePart}T${timeStr}`;
    };

    return [
      {
        id: "mock-log-1",
        action: "STOCK_ADJUSTED",
        details: "Qty 0 -> 3 at Skyrise 4B, STOCK_INCREASE",
        userId: "user-christian",
        user: {
          id: "user-christian",
          name: "Christian Mangas",
          email: "christian.mangas@contactpoint360.com",
          role: "ADMIN",
          siteId: "site-1"
        },
        siteId: "site-1",
        itemId: "item-1",
        itemName: "Laptop",
        itemSku: "AST-LAP-0012",
        ipAddress: "192.168.1.102",
        createdAt: getPastDateStr(1, "01:23:00.000Z") // Jul 9, 01:23 AM (1 day ago)
      },
      {
        id: "mock-log-2",
        action: "ITEM_CREATED",
        details: "SKU AST-CON-0001 added to catalog",
        userId: "user-christian",
        user: {
          id: "user-christian",
          name: "Christian Mangas",
          email: "christian.mangas@contactpoint360.com",
          role: "ADMIN",
          siteId: "site-1"
        },
        siteId: "site-1",
        itemId: "item-4",
        itemName: "AA batteries",
        itemSku: "AST-CON-0001",
        ipAddress: "192.168.1.102",
        createdAt: getPastDateStr(2, "23:56:00.000Z") // Jul 8, 11:56 PM (2 days ago)
      },
      {
        id: "mock-log-3",
        action: "STOCK_ADJUSTED",
        details: "Qty 6 -> 2 at Skyrise Alpha, correction",
        userId: "user-christian",
        user: {
          id: "user-christian",
          name: "Christian Mangas",
          email: "christian.mangas@contactpoint360.com",
          role: "ADMIN",
          siteId: "site-1"
        },
        siteId: "site-1",
        itemId: "item-1",
        itemName: "Laptop",
        itemSku: "AST-LAP-0012",
        ipAddress: "192.168.1.102",
        createdAt: getPastDateStr(2, "23:34:00.000Z") // Jul 8, 11:34 PM (2 days ago)
      },
      {
        id: "mock-log-4",
        action: "STOCK_ADJUSTED",
        details: "Qty 0 -> 6 at Skyrise Alpha, increase",
        userId: "user-1",
        user: { ...mockUsers[0], siteId: "site-1" }, // Super Admin (acting at site-1)
        siteId: "site-1",
        itemId: "item-1",
        itemName: "Laptop",
        itemSku: "AST-LAP-0012",
        ipAddress: "127.0.0.1",
        createdAt: getPastDateStr(2, "22:34:00.000Z") // Jul 8, 10:34 PM (2 days ago)
      },
      {
        id: "mock-log-5",
        action: "STOCK_ADJUSTED",
        details: "Qty 10 -> 12 at Cebu IT Park, increase",
        userId: "user-3",
        user: { ...mockUsers[2], siteId: "site-1" }, // Jane Smith
        siteId: "site-1",
        itemId: "item-2",
        itemName: "Dell UltraSharp 27\" Monitor",
        itemSku: "IT-DEL-U27",
        ipAddress: "192.168.2.40",
        createdAt: getPastDateStr(6, "10:15:00.000Z") // Jul 4 (6 days ago)
      },
      {
        id: "mock-log-6",
        action: "STOCK_ADJUSTED",
        details: "Qty 5 -> 8 at Toronto HQ, correction",
        userId: "user-2",
        user: { ...mockUsers[1], siteId: "site-2" }, // John Doe
        siteId: "site-2",
        itemId: "item-3",
        itemName: "Logitech MX Master 3S",
        itemSku: "IT-LOG-MX3S",
        ipAddress: "192.168.3.15",
        createdAt: getPastDateStr(6, "14:30:00.000Z") // Jul 4 (6 days ago)
      },
      {
        id: "mock-log-7",
        action: "STOCK_ADJUSTED",
        details: "Qty 20 -> 18 at Skyrise Alpha, allocation",
        userId: "user-4",
        user: { ...mockUsers[3], siteId: "site-1" }, // Elena Rostova
        siteId: "site-1",
        itemId: "item-1",
        itemName: "Laptop",
        itemSku: "AST-LAP-0012",
        ipAddress: "192.168.1.55",
        createdAt: getPastDateStr(5, "09:20:00.000Z") // Jul 5 (5 days ago)
      },
      {
        id: "mock-log-8",
        action: "STOCK_ADJUSTED",
        details: "Qty 2 -> 5 at Skyrise 4B, restock",
        userId: "user-christian",
        user: {
          id: "user-christian",
          name: "Christian Mangas",
          email: "christian.mangas@contactpoint360.com",
          role: "ADMIN",
          siteId: "site-1"
        },
        siteId: "site-1",
        itemId: "item-1",
        itemName: "Laptop",
        itemSku: "AST-LAP-0012",
        ipAddress: "192.168.1.102",
        createdAt: getPastDateStr(4, "11:00:00.000Z") // Jul 6 (4 days ago)
      },
      {
        id: "mock-log-9",
        action: "STOCK_ADJUSTED",
        details: "Qty 15 -> 12 at Toronto HQ, audit adjustment",
        userId: "user-2",
        user: { ...mockUsers[1], siteId: "site-2" }, // John Doe
        siteId: "site-2",
        itemId: "item-2",
        itemName: "Dell UltraSharp 27\" Monitor",
        itemSku: "IT-DEL-U27",
        ipAddress: "192.168.3.15",
        createdAt: getPastDateStr(4, "13:45:00.000Z") // Jul 6 (4 days ago)
      },
      {
        id: "mock-log-10",
        action: "STOCK_ADJUSTED",
        details: "Qty 8 -> 10 at Cebu IT Park, stock in",
        userId: "user-3",
        user: { ...mockUsers[2], siteId: "site-1" }, // Jane Smith
        siteId: "site-1",
        itemId: "item-3",
        itemName: "Logitech MX Master 3S",
        itemSku: "IT-LOG-MX3S",
        ipAddress: "192.168.2.40",
        createdAt: getPastDateStr(4, "16:10:00.000Z") // Jul 6 (4 days ago)
      },
      {
        id: "mock-log-11",
        action: "STOCK_ADJUSTED",
        details: "Qty 4 -> 10 at Skyrise Alpha, increase",
        userId: "user-3",
        user: { ...mockUsers[2], siteId: "site-1" }, // Jane Smith
        siteId: "site-1",
        itemId: "item-1",
        itemName: "Laptop",
        itemSku: "AST-LAP-0012",
        ipAddress: "192.168.1.55",
        createdAt: getPastDateStr(2, "08:12:00.000Z") // Jul 8 (2 days ago)
      },
      {
        id: "mock-log-12",
        action: "STOCK_ADJUSTED",
        details: "Qty 30 -> 35 at Cebu IT Park, restock",
        userId: "user-2",
        user: { ...mockUsers[1], siteId: "site-1" }, // John Doe
        siteId: "site-1",
        itemId: "item-4",
        itemName: "AA batteries",
        itemSku: "AST-CON-0001",
        ipAddress: "192.168.3.15",
        createdAt: getPastDateStr(2, "14:25:00.000Z") // Jul 8 (2 days ago)
      },
      {
        id: "mock-log-13",
        action: "STOCK_ADJUSTED",
        details: "Qty 12 -> 15 at Skyrise Alpha, check-in adjustment",
        userId: "user-4",
        user: { ...mockUsers[3], siteId: "site-1" }, // Elena Rostova
        siteId: "site-1",
        itemId: "item-1",
        itemName: "Laptop",
        itemSku: "AST-LAP-0012",
        ipAddress: "192.168.1.55",
        createdAt: getPastDateStr(0, "11:42:00.000Z") // Jul 10 (0 days ago / today)
      }
    ];
  });
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState("");

  // Filters for catalog
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState("ALL");
  const [catalogStockFilter, setCatalogStockFilter] = useState("ALL"); // ALL, LOW_STOCK, OUT_OF_STOCK
  const [catalogViewMode, setCatalogViewMode] = useState<"list" | "grid">("grid");
  const [catalogSortKey, setCatalogSortKey] = useState("name_asc");

  // Item Modal states
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemSku, setItemSku] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemUnitPrice, setItemUnitPrice] = useState("");
  const [itemLeadTimeDays, setItemLeadTimeDays] = useState("7");
  const [itemCategoryId, setItemCategoryId] = useState("");
  const [itemSiteId, setItemSiteId] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemError, setItemError] = useState<string | null>(null);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  // Stock Adjust Modal states
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockItem, setStockItem] = useState<CatalogItem | null>(null);
  const [stockSiteId, setStockSiteId] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [stockReorderPoint, setStockReorderPoint] = useState("5");
  const [stockError, setStockError] = useState<string | null>(null);
  const [isSubmittingStock, setIsSubmittingStock] = useState(false);
  const [stockOriginalQuantity, setStockOriginalQuantity] = useState(0);
  const [stockActiveAssets, setStockActiveAssets] = useState<any[]>([]);

  // Backend Offline warning states
  const [isBackendOffline, setIsBackendOffline] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  // Toast messages
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Filters
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(userSearch.toLowerCase()));
    
    const matchesRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
    
    return matchesSearch && matchesRole;
  });

  const filteredItems = catalogItems.filter((it) => {
    const matchesSearch =
      it.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      it.sku.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (it.description && it.description.toLowerCase().includes(catalogSearch.toLowerCase()));

    const matchesCategory =
      catalogCategoryFilter === "ALL" || it.categoryId === catalogCategoryFilter;

    const siteStock = it.stockLevels?.find((sl) => sl.siteId === selectedSiteId);
    const quantity = siteStock ? siteStock.quantity : 0;
    const reorderPoint = siteStock ? siteStock.reorderPoint : 5;

    let matchesStock = true;
    if (catalogStockFilter === "LOW_STOCK") {
      matchesStock = quantity <= reorderPoint;
    } else if (catalogStockFilter === "OUT_OF_STOCK") {
      matchesStock = quantity === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  }).sort((a, b) => {
    const aStock = a.stockLevels?.find((sl) => sl.siteId === selectedSiteId);
    const bStock = b.stockLevels?.find((sl) => sl.siteId === selectedSiteId);
    const aQty = aStock ? aStock.quantity : 0;
    const bQty = bStock ? bStock.quantity : 0;

    if (catalogSortKey === "name_asc") {
      return a.name.localeCompare(b.name);
    } else if (catalogSortKey === "name_desc") {
      return b.name.localeCompare(a.name);
    } else if (catalogSortKey === "price_asc") {
      return Number(a.unitPrice) - Number(b.unitPrice);
    } else if (catalogSortKey === "price_desc") {
      return Number(b.unitPrice) - Number(a.unitPrice);
    } else if (catalogSortKey === "stock_asc") {
      return aQty - bQty;
    } else if (catalogSortKey === "stock_desc") {
      return bQty - aQty;
    }
    return 0;
  });

  const checkBackendHealth = async () => {
    setIsCheckingConnection(true);
    try {
      const res = await fetch("http://localhost:3001/users");
      if (res.ok) {
        setIsBackendOffline(false);
        fetchUsers();
        fetchItems();
        fetchAllMetadata();
      } else {
        setIsBackendOffline(true);
      }
    } catch (err) {
      setIsBackendOffline(true);
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    setUsersError(null);
    try {
      const res = await fetch("http://localhost:3001/users");
      if (!res.ok) {
        throw new Error(`Failed to fetch users: status ${res.status}`);
      }
      const data = await res.json();
      setUsers(data);
      setIsUsingMockData(false);
    } catch (err: any) {
      console.error("Backend error fetching users:", err);
      setIsBackendOffline(true);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchSites = async () => {
    try {
      const res = await fetch("http://localhost:3001/sites");
      if (res.ok) {
        const data = await res.json();
        setSites(data);
        if (data.length > 0 && !selectedSiteId) {
          setSelectedSiteId(data[0].id);
        }
      } else {
        setIsBackendOffline(true);
      }
    } catch (e) {
      console.error("Backend error fetching sites:", e);
      setIsBackendOffline(true);
    }
  };

  const fetchItems = async () => {
    setIsLoadingItems(true);
    setItemsError(null);
    try {
      const res = await fetch("http://localhost:3001/items");
      if (!res.ok) {
        throw new Error(`Failed to fetch items: status ${res.status}`);
      }
      const data = await res.json();
      const formatted = data.map((it: any) => ({
        ...it,
        unitPrice: typeof it.unitPrice === 'string' ? parseFloat(it.unitPrice) : it.unitPrice,
      }));
      setCatalogItems(formatted);
      setIsUsingMockData(false);
    } catch (err: any) {
      console.error("Backend error fetching items:", err);
      setIsBackendOffline(true);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch("http://localhost:3001/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      } else {
        setIsBackendOffline(true);
      }
    } catch (e) {
      console.error("Backend error fetching departments:", e);
      setIsBackendOffline(true);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:3001/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      } else {
        setIsBackendOffline(true);
      }
    } catch (e) {
      console.error("Backend error fetching categories:", e);
      setIsBackendOffline(true);
    }
  };

  const fetchAllMetadata = async () => {
    await Promise.all([fetchSites(), fetchDepartments(), fetchCategories()]);
  };

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
      fetchAllMetadata();
    } else if (activeTab === "settings") {
      fetchAllMetadata();
    } else if (activeTab === "catalog") {
      fetchItems();
      fetchAllMetadata();
    }
  }, [activeTab]);

  useEffect(() => {
    setSelectedItemIds([]);
  }, [activeTab, catalogSearch, catalogCategoryFilter, catalogStockFilter, selectedSiteId]);

  const handleToggleSelectItem = (id: string, isMultiSelectMode: boolean = false) => {
    setSelectedItemIds((prev) => {
      const isSelected = prev.includes(id);
      const nextSelection = isSelected ? prev.filter((x) => x !== id) : [...prev, id];
      // In single mode (not multi-select mode), automatically open modal on click
      if (!isMultiSelectMode && nextSelection.length > 0) {
        const canDeploy = !currentUser || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'INVENTORY_STAFF' || currentUser?.role === 'OPS_MANAGER' || currentUser?.role === 'ADMIN';
        setBulkRequestInitialMode(canDeploy ? 'deploy' : 'request');
        setIsBulkRequestOpen(true);
      }
      return nextSelection;
    });
  };

  const handleToggleSelectAll = () => {
    const filteredIds = filteredItems.map((it) => it.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedItemIds.includes(id));
    if (allSelected) {
      setSelectedItemIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedItemIds((prev) => {
        const newSelection = [...prev];
        filteredIds.forEach((id) => {
          if (!newSelection.includes(id)) newSelection.push(id);
        });
        return newSelection;
      });
    }
  };

  const handleOpenViewTags = async (item: CatalogItem) => {
    setViewTagsItem(item);
    setViewTagsAssets([]);
    if (isUsingMockData) {
      setViewTagsAssets(item.assets || []);
    } else {
      setIsLoadingTags(true);
      try {
        const res = await fetch(`http://localhost:3001/items/${item.id}/assets`);
        if (res.ok) {
          const data = await res.json();
          setViewTagsAssets(data);
        }
      } catch (err) {
        console.error("Error fetching assets:", err);
      } finally {
        setIsLoadingTags(false);
      }
    }
  };

  const handleOpenHistoryModal = async (item: CatalogItem) => {
    setHistoryItem(item);
    setIsHistoryModalOpen(true);
    setHistoryLogs([]);
    if (isUsingMockData) {
      const logs = mockAuditLogs.filter(l => l.itemId === item.id);
      setHistoryLogs(logs);
    } else {
      setIsLoadingHistory(true);
      try {
        const res = await fetch(`http://localhost:3001/items/${item.id}/audit-logs`);
        if (res.ok) {
          const data = await res.json();
          setHistoryLogs(data);
        } else {
          throw new Error("Failed to fetch");
        }
      } catch (err) {
        console.error("Error fetching item history:", err);
        const logs = mockAuditLogs.filter(l => l.itemId === item.id);
        setHistoryLogs(logs);
      } finally {
        setIsLoadingHistory(false);
      }
    }
  };

  const handleBarcodeScan = (code: string) => {
    let matchedItem = catalogItems.find(it => it.sku.toUpperCase() === code);
    
    if (!matchedItem) {
      matchedItem = catalogItems.find(it => 
        it.assets?.some((a: any) => a.tagCode.toUpperCase() === code)
      );
    }

    if (matchedItem) {
      setIsScanModalOpen(false);
      showToast(`Asset identified: ${matchedItem.name} (${code})`);
      handleOpenViewTags(matchedItem);
    } else {
      showToast(`No catalog item found matching code or SKU "${code}"`, "error");
    }
  };

  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 80) {
        buffer = "";
      }

      lastKeyTime = currentTime;

      if (e.key === "Enter") {
        if (buffer.length > 2) {
          handleBarcodeScan(buffer.toUpperCase());
          buffer = "";
          e.preventDefault();
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [catalogItems]);

  const fetchNotifications = async () => {
    if (isUsingMockData) {
      // Mock mode handles local state of notifications
    } else {
      if (!currentUser) return;
      try {
        const res = await fetch(`http://localhost:3001/notifications?userId=${currentUser.id}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (err) {
        console.warn("Notifications API unreachable, switching to local mock notifications fallback.");
        setIsUsingMockData(true);
      }
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    if (isUsingMockData) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } else {
      try {
        const res = await fetch(`http://localhost:3001/notifications/${id}/read`, {
          method: "PATCH",
        });
        if (res.ok) {
          await fetchNotifications();
        }
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (isUsingMockData) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } else {
      if (!currentUser) return;
      try {
        const res = await fetch(`http://localhost:3001/notifications/read-all?userId=${currentUser.id}`, {
          method: "POST",
        });
        if (res.ok) {
          await fetchNotifications();
        }
      } catch (err) {
        console.error("Error marking all notifications as read:", err);
      }
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  // Load current user context
  useEffect(() => {
    const initUser = async () => {
      try {
        const res = await fetch("http://localhost:3001/users");
        if (res.ok) {
          const data = await res.json();
          const storedEmail = typeof window !== "undefined" ? localStorage.getItem("currentUserEmail") : null;
          const matchedUser = storedEmail ? data.find((u: any) => u.email.toLowerCase() === storedEmail.toLowerCase()) : null;
          
          let userToSet = matchedUser;
          if (!userToSet) {
            const admin = data.find((u: any) => u.email === "superadmin@contactpoint360.com");
            userToSet = admin || data[0] || null;
          }
          
          if (userToSet) {
            setCurrentUser(userToSet);
            if (userToSet.role === "EMPLOYEE" || userToSet.role === "TEAM_LEADER") {
              setActiveTab("requests");
            } else if (userToSet.role === "INVENTORY_STAFF") {
              setActiveTab("catalog");
            } else {
              setActiveTab("dashboard");
            }
          }
        } else {
          setIsBackendOffline(true);
        }
      } catch (e) {
        setIsBackendOffline(true);
      }
    };
    if (!isBackendOffline) {
      initUser();
    }
  }, [isBackendOffline]);

  const isTabAllowedForRole = (tab: string, role: string): boolean => {
    switch (role) {
      case "SUPER_ADMIN":
        return true;
      case "ADMIN":
        return ["dashboard", "catalog", "requests", "procurement", "alerts", "scan-ops", "reports"].includes(tab);
      case "INVENTORY_STAFF":
        return ["catalog", "requests", "procurement", "alerts", "scan-ops", "reports"].includes(tab);
      case "TEAM_LEADER":
        return ["catalog", "requests", "alerts"].includes(tab);
      case "EMPLOYEE":
        return ["catalog", "requests"].includes(tab);
      default:
        return false;
    }
  };

  useEffect(() => {
    if (currentUser) {
      const role = currentUser.role;
      if (!isTabAllowedForRole(activeTab, role)) {
        if (role === "EMPLOYEE" || role === "TEAM_LEADER") {
          setActiveTab("requests");
        } else if (role === "INVENTORY_STAFF") {
          setActiveTab("catalog");
        } else {
          setActiveTab("dashboard");
        }
      }
    }
  }, [activeTab, currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser]);

  const handleBulkRequestSubmit = async (
    requests: { itemId: string; quantity: number }[],
    siteId: string,
    reason: string,
    urgency: string
  ): Promise<boolean> => {
    if (!currentUser) return false;
    
    let successCount = 0;
    const createdRequests = [];

    for (const req of requests) {
      const selectedItem = catalogItems.find(i => i.id === req.itemId);
      const itemName = selectedItem?.name || "Unknown Item";
      const itemCategory = selectedItem?.category?.name || "Other";

      try {
        let created = null;
        if (!isBackendOffline) {
          const res = await fetch("http://localhost:3001/requests", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user": currentUser.email,
            },
            body: JSON.stringify({
              itemId: req.itemId,
              item: itemName,
              category: itemCategory,
              quantity: req.quantity,
              reason: reason,
              urgency: urgency,
              siteId: siteId || undefined,
            }),
          });
          if (res.ok) {
            const json = await res.json();
            created = json?.data ?? json;
            successCount++;
          }
        }

        if (!created) {
          // Fallback / simulation
          created = {
            id: `req-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
            itemId: req.itemId,
            itemName: itemName,
            itemCategory: itemCategory,
            requestedById: currentUser.id,
            requestedByName: currentUser.name,
            requestedByRole: currentUser.role,
            quantity: req.quantity,
            reason: reason,
            urgency: urgency,
            status: reason && reason.includes("[ASSET DEPLOYMENT]") ? "RELEASED" : "PENDING",
            siteId: siteId || undefined,
            siteName: sites.find((s: any) => s.id === siteId || (s.name && siteId && s.name.trim().toLowerCase() === siteId.trim().toLowerCase()))?.name || siteId || undefined,
            receiverSiteName: sites.find((s: any) => s.id === siteId || (s.name && siteId && s.name.trim().toLowerCase() === siteId.trim().toLowerCase()))?.name || siteId || undefined,
            receiverSiteAddress: sites.find((s: any) => s.id === siteId || (s.name && siteId && s.name.trim().toLowerCase() === siteId.trim().toLowerCase()))?.address || undefined,
            createdAt: new Date().toISOString(),
          };
          successCount++;
        }

        if (reason && reason.includes("[ASSET DEPLOYMENT]")) {
          created.status = "RELEASED";
        }

        // Deduct inventory stock level and remove deployed asset tags automatically for asset deployment
        if (reason && reason.includes("[ASSET DEPLOYMENT]")) {
          setCatalogItems(prevItems => prevItems.map(item => {
            if (item.id === req.itemId) {
              const updatedLevels = (item.stockLevels || []).map(sl => {
                if (sl.siteId === (siteId || selectedSiteId)) {
                  return { ...sl, quantity: Math.max(0, sl.quantity - req.quantity) };
                }
                return sl;
              });

              // Remove the deployed assets/tags matching requested quantity
              const remainingAssets = (item.assets || []).slice(req.quantity);

              return {
                ...item,
                stockLevels: updatedLevels,
                assets: remainingAssets
              };
            }
            return item;
          }));
        }

        createdRequests.push(created);
      } catch (err) {
        console.error("Bulk request item submission error:", err);
      }
    }

    if (createdRequests.length > 0) {
      // Merge into local storage cache so RequestsTab loads them too
      try {
        const cached = localStorage.getItem("salivio_requests");
        let currentList: any[] = [];
        if (cached) {
          currentList = JSON.parse(cached);
          // Normalize existing deployment requests in cache
          currentList = currentList.map((r: any) => {
            if (r.reason && r.reason.includes("[ASSET DEPLOYMENT]") && r.status !== 'RETURNED') {
              return { ...r, status: "RELEASED" };
            }
            return r;
          });
        }
        const merged = [...createdRequests, ...currentList];
        localStorage.setItem("salivio_requests", JSON.stringify(merged));
        localStorage.setItem("salivio_requests_v", "v7"); // REQUESTS_CACHE_V matches v7
      } catch (err) {
        console.error("Failed to sync bulk requests to cache:", err);
      }
    }

    if (successCount === requests.length) {
      showToast(`Successfully submitted ${requests.length} asset requests!`);
      setSelectedItemIds([]); // Clear selection
      return true;
    } else if (successCount > 0) {
      showToast(`Submitted ${successCount} of ${requests.length} requests successfully.`, "error");
      setSelectedItemIds([]); // Clear selection
      return true;
    } else {
      showToast("Failed to submit requests. Please try again.", "error");
      return false;
    }
  };

  const handleExportCSV = () => {
    const headers = ["Name", "SKU", "Category", "Category Type", "Unit Price (PHP)", "Stock Level", "Reorder Point"];
    const rows = filteredItems.map(it => {
      const siteStock = it.stockLevels?.find(sl => sl.siteId === selectedSiteId);
      const qty = siteStock ? siteStock.quantity : 0;
      const min = siteStock ? siteStock.reorderPoint : 5;
      return [
        `"${it.name.replace(/"/g, '""')}"`,
        `"${it.sku.replace(/"/g, '""')}"`,
        `"${(it.category?.name || "").replace(/"/g, '""')}"`,
        it.category?.type || "",
        it.unitPrice.toString(),
        qty.toString(),
        min.toString()
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const site = sites.find(s => s.id === selectedSiteId);
    const sitePrefix = site ? site.prefix : "ALL";
    link.setAttribute("download", `asset_catalog_${sitePrefix.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV Exported successfully!");
  };

  const handleAddUserPreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. First & Last Name Validation
    if (!formFirstName.trim() || formFirstName.trim().length < 1) {
      setFormError("First name is required.");
      return;
    }
    if (!formLastName.trim() || formLastName.trim().length < 1) {
      setFormError("Last name is required.");
      return;
    }

    // 2. Email Format Validation
    const cleanEmail = formEmail.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    // 3. Email Domain Validation
    if (!cleanEmail.endsWith("@contactpoint360.com") && !cleanEmail.endsWith("@cp-360.com")) {
      setFormError("Access Restricted: Only ContactPoint 360 corporate email addresses (@contactpoint360.com or @cp-360.com) are permitted.");
      return;
    }

    // 4. Employee ID Validation
    if (!formEmployeeId.trim()) {
      setFormError("Employee ID is required as it is used to generate the default account password.");
      return;
    }

    // 5. Site Validation
    if (formRole !== "SUPER_ADMIN" && !formSiteId) {
      setFormError("Assigned Site is required for non Super Admin roles.");
      return;
    }

    setShowAddConfirmation(true);
  };

  const handleConfirmAddUser = async () => {
    setIsSubmittingForm(true);
    setFormError(null);

    const generatedPassword = getGeneratedPassword(formEmployeeId, formFirstName, formLastName);
    const fullName = `${formFirstName.trim()} ${formLastName.trim()}`;

    const payload = {
      name: fullName,
      email: formEmail.trim(),
      passwordPlain: generatedPassword,
      role: formRole,
      employeeId: formEmployeeId.trim() || undefined,
      department: formDepartment.trim() || undefined,
      siteId: formSiteId || undefined,
    };

    if (isUsingMockData) {
      const selectedSite = sites.find(s => s.id === formSiteId);
      const newUser: User = {
        id: `mock-user-${Date.now()}`,
        name: payload.name,
        email: payload.email,
        role: payload.role as any,
        employeeId: payload.employeeId || null,
        department: payload.department || null,
        siteId: formSiteId || null,
        site: selectedSite ? { id: selectedSite.id, name: selectedSite.name, prefix: selectedSite.prefix } as any : null,
        createdAt: new Date().toISOString(),
        isActive: true,
      };
      await new Promise((r) => setTimeout(r, 600));
      setUsers((prev) => [newUser, ...prev]);
      setShowAddConfirmation(false);
      setIsAddModalOpen(false);
      showToast("User created successfully!");
      setFormFirstName("");
      setFormLastName("");
      setFormEmail("");
      setFormPassword("");
      setFormRole("EMPLOYEE");
      setFormEmployeeId("");
      setFormDepartment("");
      setFormSiteId("");
      setIsSubmittingForm(false);
    } else {
      try {
        const res = await fetch("http://localhost:3001/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Server responded with status ${res.status}`);
        }

        await fetchUsers();
        setShowAddConfirmation(false);
        setIsAddModalOpen(false);
        showToast("User created successfully!");
        setFormFirstName("");
        setFormLastName("");
        setFormEmail("");
        setFormPassword("");
        setFormRole("EMPLOYEE");
        setFormEmployeeId("");
        setFormDepartment("");
        setFormSiteId("");
      } catch (err: any) {
        console.error("Error creating user:", err);
        setFormError(err.message || "Failed to create user. Please try again.");
        setShowAddConfirmation(false);
      } finally {
        setIsSubmittingForm(false);
      }
    }
  };

  const handleCreateSiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSiteError(null);
    if (!siteName.trim() || !sitePrefix.trim()) {
      setSiteError("Name and Prefix are required.");
      return;
    }

    const payload = {
      name: siteName.trim(),
      prefix: sitePrefix.trim().toUpperCase(),
      address: siteAddress.trim() || undefined,
    };

    setIsSubmittingSite(true);

    if (isUsingMockData) {
      if (editingSite) {
        setSites((prev) => prev.map((s) => (s.id === editingSite.id ? { ...s, ...payload } : s)));
        showToast("Site updated successfully!");
      } else {
        const newSite = { id: `mock-site-${Date.now()}`, ...payload };
        setSites((prev) => [...prev, newSite]);
        showToast("Site created successfully!");
      }
      setSiteModalOpen(false);
      setEditingSite(null);
      setSiteName("");
      setSitePrefix("");
      setSiteAddress("");
      setIsSubmittingSite(false);
    } else {
      try {
        const url = editingSite ? `http://localhost:3001/sites/${editingSite.id}` : "http://localhost:3001/sites";
        const method = editingSite ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Request failed.");
        }
        await fetchSites();
        showToast(editingSite ? "Site updated successfully!" : "Site created successfully!");
        setSiteModalOpen(false);
        setEditingSite(null);
        setSiteName("");
        setSitePrefix("");
        setSiteAddress("");
      } catch (err: any) {
        console.error(err);
        setSiteError(err.message || "Failed to save site.");
      } finally {
        setIsSubmittingSite(false);
      }
    }
  };

  const handleCreateDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptError(null);
    if (!deptName.trim()) {
      setDeptError("Department name is required.");
      return;
    }

    const payload = { name: deptName.trim() };

    setIsSubmittingDept(true);

    if (isUsingMockData) {
      const newDept = { id: `mock-dept-${Date.now()}`, ...payload };
      setDepartments((prev) => [...prev, newDept]);
      showToast("Department created successfully!");
      setDeptModalOpen(false);
      setDeptName("");
      setIsSubmittingDept(false);
    } else {
      try {
        const res = await fetch("http://localhost:3001/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Request failed.");
        }
        await fetchDepartments();
        showToast("Department created successfully!");
        setDeptModalOpen(false);
        setDeptName("");
      } catch (err: any) {
        console.error(err);
        setDeptError(err.message || "Failed to save department.");
      } finally {
        setIsSubmittingDept(false);
      }
    }
  };

  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError(null);
    if (!categoryName.trim() || !categoryPrefix.trim()) {
      setCategoryError("Name and Prefix are required.");
      return;
    }

    const payload = {
      name: categoryName.trim(),
      prefix: categoryPrefix.trim().toUpperCase(),
      type: categoryType,
      description: categoryDescription.trim() || undefined,
    };

    setIsSubmittingCategory(true);

    if (isUsingMockData) {
      if (editingCategory) {
        setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? { ...c, ...payload } : c)));
        showToast("Category updated successfully!");
      } else {
        const newCat = { id: `mock-cat-${Date.now()}`, ...payload };
        setCategories((prev) => [...prev, newCat]);
        showToast("Category created successfully!");
      }
      setCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryName("");
      setCategoryPrefix("");
      setCategoryDescription("");
      setIsSubmittingCategory(false);
    } else {
      try {
        const url = editingCategory ? `http://localhost:3001/categories/${editingCategory.id}` : "http://localhost:3001/categories";
        const method = editingCategory ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Request failed.");
        }
        await fetchCategories();
        showToast(editingCategory ? "Category updated successfully!" : "Category created successfully!");
        setCategoryModalOpen(false);
        setEditingCategory(null);
        setCategoryName("");
        setCategoryPrefix("");
        setCategoryDescription("");
      } catch (err: any) {
        console.error(err);
        setCategoryError(err.message || "Failed to save category.");
      } finally {
        setIsSubmittingCategory(false);
      }
    }
  };

  const handleDeleteConfirmSubmit = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);

    if (deleteTarget.type === "bulk_items") {
      if (isUsingMockData) {
        selectedItemIds.forEach(id => {
          const item = catalogItems.find(it => it.id === id);
          if (item) {
            const newLog = {
              id: `mock-log-${Date.now()}-${id}`,
              action: "ITEM_DELETED",
              details: `Item "${item.name}" (SKU: ${item.sku}) was deleted.`,
              userId: currentUser?.id || "user-1",
              user: currentUser || mockUsers[0],
              itemId: id,
              ipAddress: "127.0.0.1",
              createdAt: new Date().toISOString()
            };
            setMockAuditLogs(prev => [newLog, ...prev]);
          }
        });
        setCatalogItems((prev) => prev.filter((it) => !selectedItemIds.includes(it.id)));
        setSelectedItemIds([]);
        setDeleteConfirmOpen(false);
        setDeleteTarget(null);
        showToast("Selected assets deleted successfully!");
      } else {
        try {
          let successCount = 0;
          let failCount = 0;

          await Promise.all(
            selectedItemIds.map(async (id) => {
              try {
                const res = await fetch(`http://localhost:3001/items/${id}`, {
                  method: "DELETE",
                  headers: { "x-user-id": currentUser?.id || "" }
                });
                if (!res.ok) {
                  throw new Error("Failed to delete.");
                }
                successCount++;
              } catch (err) {
                failCount++;
              }
            })
          );

          await fetchItems();
          setSelectedItemIds([]);
          setDeleteConfirmOpen(false);
          setDeleteTarget(null);

          if (failCount > 0) {
            showToast(`Deleted ${successCount} assets. Failed to delete ${failCount} assets (they may be linked to orders or physical assets).`, "error");
          } else {
            showToast("Selected assets deleted successfully!");
          }
        } catch (err: any) {
          console.error(err);
          setDeleteError(err.message || "Failed to delete selected items.");
        }
      }
      return;
    }

    if (isUsingMockData) {
      if (deleteTarget.type === "site") {
        setSites((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      } else if (deleteTarget.type === "department") {
        setDepartments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      } else if (deleteTarget.type === "category") {
        setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      } else {
        const item = catalogItems.find(it => it.id === deleteTarget.id);
        if (item) {
          const newLog = {
            id: `mock-log-${Date.now()}`,
            action: "ITEM_DELETED",
            details: `Item "${item.name}" (SKU: ${item.sku}) was deleted.`,
            userId: currentUser?.id || "user-1",
            user: currentUser || mockUsers[0],
            itemId: deleteTarget.id,
            ipAddress: "127.0.0.1",
            createdAt: new Date().toISOString()
          };
          setMockAuditLogs(prev => [newLog, ...prev]);
        }
        setCatalogItems((prev) => prev.filter((it) => it.id !== deleteTarget.id));
      }
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    } else {
      try {
        const endpoint = deleteTarget.type === "site" ? "sites" : deleteTarget.type === "department" ? "departments" : deleteTarget.type === "category" ? "categories" : "items";
        const res = await fetch(`http://localhost:3001/${endpoint}/${deleteTarget.id}`, {
          method: "DELETE",
          headers: { "x-user-id": currentUser?.id || "" }
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to delete item.");
        }
        if (deleteTarget.type === "site") await fetchSites();
        else if (deleteTarget.type === "department") await fetchDepartments();
        else if (deleteTarget.type === "category") await fetchCategories();
        else await fetchItems();
        setDeleteConfirmOpen(false);
        setDeleteTarget(null);
      } catch (err: any) {
        console.error(err);
        setDeleteError(err.message || "Failed to delete item. It might be linked to other records.");
      }
    }
  };

  const handleCreateItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setItemError(null);
    if (!itemName.trim() || !itemCategoryId) {
      setItemError("Name and Category are required.");
      return;
    }

    const priceNum = parseFloat(itemUnitPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setItemError("Price must be a positive number.");
      return;
    }

    const leadTimeNum = parseInt(itemLeadTimeDays);
    if (isNaN(leadTimeNum) || leadTimeNum < 0) {
      setItemError("Lead time must be a non-negative number.");
      return;
    }

    const qtyNum = parseInt(itemQuantity);
    if (isNaN(qtyNum) || qtyNum < 0) {
      setItemError("Quantity must be a non-negative number.");
      return;
    }

    setIsSubmittingItem(true);

    let finalSku = itemSku.trim().toUpperCase();
    if (!finalSku) {
      if (isUsingMockData) {
        const category = categories.find(c => c.id === itemCategoryId);
        const categoryPrefix = category?.prefix || "AST";
        
        const prefix = `AST-${categoryPrefix.toUpperCase()}-`;
        let nextNum = 1;
        const matchingItems = catalogItems.filter(it => it.sku.startsWith(prefix));
        if (matchingItems.length > 0) {
          const numbers = matchingItems.map(it => {
            const parts = it.sku.split("-");
            const num = parseInt(parts[parts.length - 1], 10);
            return isNaN(num) ? 0 : num;
          });
          nextNum = Math.max(...numbers, 0) + 1;
        }
        finalSku = `${prefix}${String(nextNum).padStart(4, "0")}`;
      } else {
        finalSku = ""; // Let backend generate it
      }
    }

    const payload: any = {
      name: itemName.trim(),
      sku: finalSku || undefined,
      description: itemDescription.trim() || null,
      unitPrice: priceNum,
      leadTimeDays: leadTimeNum,
      categoryId: itemCategoryId,
    };

    if (!editingItem) {
      payload.siteId = itemSiteId;
      payload.quantity = qtyNum;
    }

    if (isUsingMockData) {
      const selectedCategory = categories.find(c => c.id === itemCategoryId);
      if (editingItem) {
        const changes: string[] = [];
        if (itemName.trim() !== editingItem.name) changes.push(`Name: "${editingItem.name}" -> "${itemName.trim()}"`);
        if (priceNum !== editingItem.unitPrice) changes.push(`Unit Price: ${editingItem.unitPrice} -> ${priceNum}`);
        if (leadTimeNum !== editingItem.leadTimeDays) changes.push(`Lead Time: ${editingItem.leadTimeDays} -> ${leadTimeNum}`);
        
        if (changes.length > 0) {
          const newLog = {
            id: `mock-log-${Date.now()}`,
            action: "ITEM_UPDATED",
            details: `Item updated. Changes: ${changes.join(", ")}`,
            userId: currentUser?.id || "user-1",
            user: currentUser || mockUsers[0],
            itemId: editingItem.id,
            ipAddress: "127.0.0.1",
            createdAt: new Date().toISOString()
          };
          setMockAuditLogs(prev => [newLog, ...prev]);
        }

        setCatalogItems((prev) =>
          prev.map((it) =>
            it.id === editingItem.id
              ? {
                  ...it,
                  ...payload,
                  sku: finalSku,
                  category: selectedCategory || it.category,
                }
              : it
          )
        );
        showToast("Asset updated successfully!");
      } else {
        const isConsumable = selectedCategory?.type === "CONSUMABLE";
        const newItemId = `mock-item-${Date.now()}`;
        const mockStocks = sites.map((s, idx) => ({
          id: `mock-stock-${Date.now()}-${idx}`,
          siteId: s.id,
          itemId: newItemId,
          quantity: s.id === itemSiteId ? qtyNum : 0,
          reorderPoint: 5,
        }));

        const mockAssets: any[] = [];
        if (!isConsumable) {
          const site = sites.find(s => s.id === itemSiteId);
          const actualSitePrefix = (site?.prefix || "SYS").toUpperCase();
          const actualCategoryPrefix = (selectedCategory?.prefix || "AST").toUpperCase();
          const assetTagPrefix = `${actualSitePrefix}-${actualCategoryPrefix}-`;

          let assetNum = 1;
          const allTags: string[] = [];
          catalogItems.forEach(it => {
            if (it.assets) {
              it.assets.forEach(a => {
                if (a.tagCode.startsWith(assetTagPrefix)) {
                  allTags.push(a.tagCode);
                }
              });
            }
          });
          if (allTags.length > 0) {
            const numbers = allTags.map((tag) => {
              const parts = tag.split("-");
              const numStr = parts[parts.length - 1];
              const num = parseInt(numStr, 10);
              return isNaN(num) ? 0 : num;
            });
            assetNum = Math.max(...numbers, 0) + 1;
          }

          for (let i = 0; i < qtyNum; i++) {
            const tagCode = `${assetTagPrefix}${String(assetNum + i).padStart(4, "0")}`;
            mockAssets.push({
              id: `mock-asset-${Date.now()}-${i}`,
              tagCode,
              serialNumber: `SN-${tagCode}`,
              status: "AVAILABLE",
              condition: "GOOD",
            });
          }
        }

        const newItem: CatalogItem = {
          id: newItemId,
          ...payload,
          sku: finalSku || `AST-${selectedCategory?.prefix || "AST"}-0001`,
          category: selectedCategory || null,
          stockLevels: mockStocks,
          assets: mockAssets.length > 0 ? mockAssets : undefined,
        };

        const newLog = {
          id: `mock-log-${Date.now()}`,
          action: "ITEM_CREATED",
          details: `Item "${itemName.trim()}" (SKU: ${newItem.sku}) was created.`,
          userId: currentUser?.id || "user-1",
          user: currentUser || mockUsers[0],
          itemId: newItemId,
          ipAddress: "127.0.0.1",
          createdAt: new Date().toISOString()
        };
        setMockAuditLogs(prev => [newLog, ...prev]);

        setCatalogItems((prev) => [...prev, newItem]);
        showToast("Asset created successfully!");
      }
      setItemModalOpen(false);
      setEditingItem(null);
      setItemName("");
      setItemSku("");
      setItemDescription("");
      setItemUnitPrice("");
      setItemLeadTimeDays("7");
      setItemCategoryId("");
      setItemSiteId("");
      setItemQuantity("");
      setIsSubmittingItem(false);
    } else {
      try {
        const url = editingItem ? `http://localhost:3001/items/${editingItem.id}` : "http://localhost:3001/items";
        const method = editingItem ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { 
            "Content-Type": "application/json",
            "x-user-id": currentUser?.id || ""
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Request failed.");
        }
        await fetchItems();
        showToast(editingItem ? "Asset updated successfully!" : "Asset created successfully!");
        setItemModalOpen(false);
        setEditingItem(null);
        setItemName("");
        setItemSku("");
        setItemDescription("");
        setItemUnitPrice("");
        setItemLeadTimeDays("7");
        setItemCategoryId("");
        setItemSiteId("");
        setItemQuantity("");
      } catch (err: any) {
        console.error(err);
        setItemError(err.message || "Failed to save catalog item.");
      } finally {
        setIsSubmittingItem(false);
      }
    }
  };

  const handleAdjustStockSubmit = async (
    e: React.FormEvent,
    reason?: string,
    comments?: string,
  ) => {
    if (e && e.preventDefault) e.preventDefault();
    setStockError(null);
    if (!stockItem || !stockSiteId) return;

    const qty = parseInt(stockQuantity);
    if (isNaN(qty) || qty < 0) {
      setStockError("Quantity must be a non-negative number.");
      return;
    }

    const reorderPt = parseInt(stockReorderPoint);
    if (isNaN(reorderPt) || reorderPt < 0) {
      setStockError("Reorder point must be a non-negative number.");
      return;
    }

    setIsSubmittingStock(true);

    if (isUsingMockData) {
      const oldStock = stockItem.stockLevels?.find(sl => sl.siteId === stockSiteId);
      const oldQty = oldStock ? oldStock.quantity : 0;
      const oldReorder = oldStock ? oldStock.reorderPoint : 5;
      const site = sites.find((s) => s.id === stockSiteId);
      const isSerialized = stockItem.category?.type === "NON_CONSUMABLE";

      const changes: string[] = [];
      if (qty !== oldQty) changes.push(`Quantity: ${oldQty} -> ${qty}`);
      if (reorderPt !== oldReorder) changes.push(`Reorder Point: ${oldReorder} -> ${reorderPt}`);

      setCatalogItems((prev) =>
        prev.map((it) => {
          if (it.id === stockItem.id) {
            // Update stock levels
            const stockLevels = it.stockLevels || [];
            const existingIdx = stockLevels.findIndex((sl) => sl.siteId === stockSiteId);
            let updatedStocks = [...stockLevels];
            if (existingIdx > -1) {
              updatedStocks[existingIdx] = { ...updatedStocks[existingIdx], quantity: qty, reorderPoint: reorderPt };
            } else {
              updatedStocks.push({ id: `mock-stock-${Date.now()}`, siteId: stockSiteId, itemId: stockItem.id, quantity: qty, reorderPoint: reorderPt });
            }

            let updatedAssets = [...(it.assets || [])];

            if (isSerialized) {
              if (qty > oldQty) {
                // AUTO-GENERATE new asset tags
                const selectedCategory = it.category;
                const selectedSite = site;
                const actualSitePrefix = (selectedSite?.prefix || "SYS").toUpperCase();
                const actualCategoryPrefix = (selectedCategory?.prefix || "AST").toUpperCase();
                const assetTagPrefix = `${actualSitePrefix}-${actualCategoryPrefix}-`;

                // Find max existing tag number across ALL catalog items
                let assetNum = 1;
                const allTags: string[] = [];
                prev.forEach(catalogIt => {
                  (catalogIt.assets || []).forEach((a: any) => {
                    if (a.tagCode?.startsWith(assetTagPrefix)) allTags.push(a.tagCode);
                  });
                });
                if (allTags.length > 0) {
                  const numbers = allTags.map(tag => parseInt(tag.split("-").pop() || "0", 10)).filter(n => !isNaN(n));
                  assetNum = Math.max(...numbers, 0) + 1;
                }

                const qtyToGenerate = qty - oldQty;
                for (let i = 0; i < qtyToGenerate; i++) {
                  const tagCode = `${assetTagPrefix}${String(assetNum + i).padStart(4, "0")}`;
                  updatedAssets.push({
                    id: `mock-asset-${Date.now()}-${i}`,
                    tagCode,
                    serialNumber: `SN-${tagCode}`,
                    status: "AVAILABLE",
                    condition: "GOOD",
                    siteId: stockSiteId,
                    itemId: stockItem.id,
                  });
                }
              } else if (qty < oldQty) {
                // AUTO-RETIRE oldest AVAILABLE assets at this site
                const qtyToRetire = oldQty - qty;
                const retireCondition = reason === "DAMAGED_OR_BROKEN" ? "DAMAGED"
                  : reason === "LOST_OR_STOLEN" ? "LOST"
                  : "RETIRED";
                const availableAtSite = updatedAssets
                  .filter((a: any) => a.siteId === stockSiteId && a.status === "AVAILABLE")
                  .sort((a: any, b: any) => (a.id < b.id ? -1 : 1)); // oldest first by id
                const toRetireIds = availableAtSite.slice(0, qtyToRetire).map((a: any) => a.id);
                updatedAssets = updatedAssets.map((a: any) =>
                  toRetireIds.includes(a.id) ? { ...a, status: "RETIRED", condition: retireCondition } : a
                );
              }
            }

            if (changes.length > 0) {
              let details = `Stock levels adjusted at site "${site?.name || "Selected Site"}" (${site?.prefix || "N/A"}). Changes: ${changes.join(", ")}`;
              if (reason) details += `. Reason: ${reason}`;
              if (comments) details += `. Comments: ${comments}`;
              const newLog = {
                id: `mock-log-${Date.now()}`,
                action: "STOCK_ADJUSTED",
                details,
                userId: currentUser?.id || "user-1",
                user: currentUser || mockUsers[0],
                itemId: stockItem.id,
                ipAddress: "127.0.0.1",
                createdAt: new Date().toISOString()
              };
              setMockAuditLogs(prev => [newLog, ...prev]);
            }

            return { ...it, stockLevels: updatedStocks, assets: updatedAssets };
          }
          return it;
        })
      );

      if (qty <= reorderPt) {
        const newNotif: DbNotification = {
          id: `mock-notif-${Date.now()}`,
          title: "Low Stock Warning",
          message: `Stock level for "${stockItem.name}" at "${site?.name || "Selected Site"}" has dropped to ${qty} (Reorder threshold: ${reorderPt}).`,
          isRead: false,
          userId: currentUser?.id || "user-1",
          createdAt: new Date().toISOString(),
        };
        setNotifications((prev) => [newNotif, ...prev]);
      }

      showToast("Stock levels updated successfully!");
      setStockModalOpen(false);
      setStockItem(null);
      setStockQuantity("0");
      setStockReorderPoint("5");
      setIsSubmittingStock(false);
    } else {
      try {
        // Backend auto-handles asset tag creation/retirement — just send quantity, reason, comments
        const res = await fetch(`http://localhost:3001/items/${stockItem.id}/stock`, {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json",
            "x-user-id": currentUser?.id || ""
          },
          body: JSON.stringify({
            siteId: stockSiteId,
            quantity: qty,
            reorderPoint: reorderPt,
            reason,
            comments,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to update stock levels.");
        }
        await fetchItems();
        await fetchNotifications();
        showToast("Stock levels updated successfully!");
        setStockModalOpen(false);
        setStockItem(null);
        setStockQuantity("0");
        setStockReorderPoint("5");
      } catch (err: any) {
        console.error(err);
        setStockError(err.message || "Failed to update stock.");
      } finally {
        setIsSubmittingStock(false);
      }
    }
  };

  const handleStockSiteChange = async (siteId: string) => {
    if (!stockItem) return;
    setStockSiteId(siteId);

    const stock = stockItem.stockLevels?.find(sl => sl.siteId === siteId);
    const qty = stock ? stock.quantity : 0;
    const min = stock ? stock.reorderPoint : 5;

    setStockQuantity(String(qty));
    setStockReorderPoint(String(min));
    setStockOriginalQuantity(qty);
    setStockError(null);

    if (isUsingMockData) {
      const assetsAtSite = stockItem.assets?.filter(
        (a: any) => a.siteId === siteId && (a.status === "AVAILABLE" || a.status === "ASSIGNED")
      ) || [];
      const active = stockItem.assets?.filter(
        (a: any) => (a.status === "AVAILABLE" || a.status === "ASSIGNED")
      ) || [];
      setStockActiveAssets(assetsAtSite.length > 0 ? assetsAtSite : active);
    } else {
      try {
        const res = await fetch(`http://localhost:3001/items/${stockItem.id}/assets`);
        if (res.ok) {
          const data = await res.json();
          const filtered = data.filter(
            (a: any) => a.siteId === siteId && (a.status === "AVAILABLE" || a.status === "ASSIGNED")
          );
          setStockActiveAssets(filtered);
        }
      } catch (err) {
        console.error("Error loading assets on stock modal site change:", err);
      }
    }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditFormError(null);

    if (!editFormName.trim() || editFormName.trim().length < 2) {
      setEditFormError("Full name is required and must be at least 2 characters.");
      return;
    }
    if (!editFormEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormEmail)) {
      setEditFormError("Please enter a valid email address.");
      return;
    }

    if (editingUser.email === "superadmin@contactpoint360.com" && !editFormIsActive) {
      setEditFormError("The primary Super Admin user account cannot be deactivated.");
      return;
    }

    if (editFormRole !== "SUPER_ADMIN" && !editFormSiteId) {
      setEditFormError("Assigned Site is required for non Super Admin roles.");
      return;
    }

    setIsSubmittingEditForm(true);

    const payload = {
      name: editFormName.trim(),
      email: editFormEmail.trim(),
      role: editFormRole as any,
      employeeId: editFormEmployeeId.trim() || null,
      department: editFormDepartment.trim() || null,
      siteId: editFormSiteId || null,
      isActive: editFormIsActive,
    };

    if (isUsingMockData) {
      const selectedSite = sites.find(s => s.id === editFormSiteId);
      await new Promise((r) => setTimeout(r, 600));
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id ? { ...u, ...payload, site: selectedSite ? { id: selectedSite.id, name: selectedSite.name, prefix: selectedSite.prefix } : null } : u
        )
      );
      showToast("User updated successfully!");
      setIsEditModalOpen(false);
      setEditingUser(null);
      setIsSubmittingEditForm(false);
    } else {
      try {
        const res = await fetch(`http://localhost:3001/users/${editingUser.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Server responded with status ${res.status}`);
        }

        await fetchUsers();
        showToast("User updated successfully!");
        setIsEditModalOpen(false);
        setEditingUser(null);
      } catch (err: any) {
        console.error("Error editing user:", err);
        setEditFormError(err.message || "Failed to update user. Please try again.");
      } finally {
        setIsSubmittingEditForm(false);
      }
    }
  };

  const toggleUserActive = async (user: User) => {
    if (user.email === "superadmin@contactpoint360.com" && user.isActive) {
      alert("Safety Lock: The primary Super Admin user account cannot be deactivated.");
      return;
    }

    const nextActiveState = !user.isActive;

    if (isUsingMockData) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isActive: nextActiveState } : u
        )
      );
    } else {
      try {
        const res = await fetch(`http://localhost:3001/users/${user.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: nextActiveState }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to toggle user status.");
        }

        await fetchUsers();
      } catch (err: any) {
        console.error("Error toggling user status:", err);
        alert(err.message || "Failed to update status.");
      }
    }
  };

  const handleLogout = () => {
    router.push("/login");
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview onViewRequests={() => setActiveTab("requests")} />;
      case "users":
        return (
          <UsersTab
            users={users}
            isLoadingUsers={isLoadingUsers}
            isUsingMockData={isUsingMockData}
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            userRoleFilter={userRoleFilter}
            setUserRoleFilter={setUserRoleFilter}
            filteredUsers={filteredUsers}
            onOpenAddModal={() => {
              setFormError(null);
              setFormFirstName("");
              setFormLastName("");
              setFormEmail("");
              setFormEmployeeId("");
              setFormDepartment("");
              setFormSiteId("");
              setFormRole("EMPLOYEE");
              setIsAddModalOpen(true);
            }}
            onOpenEditModal={(u) => {
              setEditingUser(u);
              setEditFormName(u.name);
              setEditFormEmail(u.email);
              setEditFormRole(u.role);
              setEditFormEmployeeId(u.employeeId || "");
              setEditFormDepartment(u.department || "");
              setEditFormSiteId(u.siteId || "");
              setEditFormIsActive(u.isActive !== false);
              setEditFormError(null);
              setIsEditModalOpen(true);
            }}
            onToggleUserActive={toggleUserActive}
          />
        );
      case "catalog":
        return (
          <CatalogTab
            isUsingMockData={isUsingMockData}
            catalogItems={catalogItems}
            sites={sites}
            categories={categories}
            selectedSiteId={selectedSiteId}
            setSelectedSiteId={setSelectedSiteId}
            catalogSearch={catalogSearch}
            setCatalogSearch={setCatalogSearch}
            catalogCategoryFilter={catalogCategoryFilter}
            setCatalogCategoryFilter={setCatalogCategoryFilter}
            catalogStockFilter={catalogStockFilter}
            setCatalogStockFilter={setCatalogStockFilter}
            catalogViewMode={catalogViewMode}
            setCatalogViewMode={setCatalogViewMode}
            catalogSortKey={catalogSortKey}
            setCatalogSortKey={setCatalogSortKey}
            selectedItemIds={selectedItemIds}
            filteredItems={filteredItems}
            isLoadingItems={isLoadingItems}
            onToggleSelectItem={handleToggleSelectItem}
            onToggleSelectAll={handleToggleSelectAll}
            onClearSelection={() => setSelectedItemIds([])}
            onExportCSV={handleExportCSV}
            onOpenAddModal={() => {
              setEditingItem(null);
              setItemName("");
              setItemSku("");
              setItemDescription("");
              setItemUnitPrice("");
              setItemLeadTimeDays("7");
              setItemCategoryId("");
              setItemSiteId(selectedSiteId);
              setItemQuantity("");
              setItemError(null);
              setItemModalOpen(true);
            }}
            onOpenEditModal={(it) => {
              const stock = it.stockLevels?.find(sl => sl.siteId === selectedSiteId);
              const qty = stock ? stock.quantity : 0;
              setEditingItem(it);
              setItemName(it.name);
              setItemSku(it.sku);
              setItemDescription(it.description || "");
              setItemUnitPrice(String(it.unitPrice));
              setItemLeadTimeDays(String(it.leadTimeDays));
              setItemCategoryId(it.categoryId);
              setItemSiteId(selectedSiteId);
              setItemQuantity(String(qty));
              setItemError(null);
              setItemModalOpen(true);
            }}
            onOpenStockModal={async (it) => {
              const stock = it.stockLevels?.find(sl => sl.siteId === selectedSiteId);
              const qty = stock ? stock.quantity : 0;
              const min = stock ? stock.reorderPoint : 5;
              setStockItem(it);
              setStockSiteId(selectedSiteId);
              setStockQuantity(String(qty));
              setStockReorderPoint(String(min));
              setStockOriginalQuantity(qty);
              setStockError(null);

              if (isUsingMockData) {
                const assetsAtSite = it.assets?.filter(
                  (a: any) => a.siteId === selectedSiteId && (a.status === "AVAILABLE" || a.status === "ASSIGNED")
                ) || [];
                const active = it.assets?.filter(
                  (a: any) => (a.status === "AVAILABLE" || a.status === "ASSIGNED")
                ) || [];
                setStockActiveAssets(assetsAtSite.length > 0 ? assetsAtSite : active);
              } else {
                try {
                  const res = await fetch(`http://localhost:3001/items/${it.id}/assets`);
                  if (res.ok) {
                    const data = await res.json();
                    const filtered = data.filter(
                      (a: any) => a.siteId === selectedSiteId && (a.status === "AVAILABLE" || a.status === "ASSIGNED")
                    );
                    setStockActiveAssets(filtered);
                  }
                } catch (err) {
                  console.error("Error loading assets for stock modal:", err);
                }
              }

              setStockModalOpen(true);
            }}
            onOpenViewTags={handleOpenViewTags}
            onDeleteTarget={(type, id, name) => {
              setDeleteTarget({ type, id, name });
              setDeleteError(null);
              setDeleteConfirmOpen(true);
            }}
            onOpenHistoryModal={handleOpenHistoryModal}
            onOpenScanModal={() => setIsScanModalOpen(true)}
            currentUser={currentUser}
            onOpenBulkRequestModal={(mode: 'deploy' | 'request') => { setBulkRequestInitialMode(mode); setIsBulkRequestOpen(true); }}
          />
        );
      case "settings":
        return (
          <SettingsTab
            isUsingMockData={isUsingMockData}
            settingsSubTab={settingsSubTab}
            setSettingsSubTab={setSettingsSubTab}
            sites={sites}
            departments={departments}
            categories={categories}
            onOpenAddModal={() => {
              if (settingsSubTab === "sites") {
                setEditingSite(null);
                setSiteName("");
                setSitePrefix("");
                setSiteAddress("");
                setSiteError(null);
                setSiteModalOpen(true);
              } else if (settingsSubTab === "departments") {
                setDeptName("");
                setDeptError(null);
                setDeptModalOpen(true);
              } else {
                setEditingCategory(null);
                setCategoryName("");
                setCategoryPrefix("");
                setCategoryType("NON_CONSUMABLE");
                setCategoryDescription("");
                setCategoryError(null);
                setCategoryModalOpen(true);
              }
            }}
            onOpenEditSiteModal={(s) => {
              setEditingSite(s);
              setSiteName(s.name);
              setSitePrefix(s.prefix);
              setSiteAddress(s.address || "");
              setSiteError(null);
              setSiteModalOpen(true);
            }}
            onOpenEditCategoryModal={(c) => {
              setEditingCategory(c);
              setCategoryName(c.name);
              setCategoryPrefix(c.prefix);
              setCategoryType(c.type);
              setCategoryDescription(c.description || "");
              setCategoryError(null);
              setCategoryModalOpen(true);
            }}
            onDeleteTarget={(type, id, name) => {
              setDeleteTarget({ type, id, name });
              setDeleteError(null);
              setDeleteConfirmOpen(true);
            }}
          />
        );
      case "reports":
        return (
          <ReportsTab
            isUsingMockData={isUsingMockData}
            mockAuditLogs={mockAuditLogs}
            currentUser={currentUser}
          />
        );
      case "scan-ops":
        return (
          <ScanOperationsTab
            isUsingMockData={isUsingMockData}
            catalogItems={catalogItems}
            setCatalogItems={setCatalogItems}
            users={users}
            sites={sites}
            currentUser={currentUser}
            onUpdateCatalog={fetchItems}
            mockAuditLogs={mockAuditLogs}
            setMockAuditLogs={setMockAuditLogs}
          />
        );
      case "procurement":
        return (
          <ProcurementTab
            isUsingMockData={isUsingMockData}
            sites={sites}
            categories={categories}
            catalogItems={catalogItems}
            currentUser={currentUser}
          />
        );
      case "requests":
        return (
          <RequestsTab
            currentUser={currentUser}
            isUsingMockData={isUsingMockData}
            sites={sites}
            categories={categories}
            catalogItems={catalogItems}
            users={users}
            onRefreshNotifications={fetchNotifications}
            onRefreshCatalog={fetchItems}
          />
        );
      default:
        return (
          <ComingSoonPlaceholder
            tabName={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            onBackToDashboard={() => setActiveTab("dashboard")}
          />
        );
    }
  };

  if (isBackendOffline) {
    return (
      <OfflineWarningScreen
        isChecking={isCheckingConnection}
        onRetry={checkBackendHealth}
      />
    );
  }

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        isSidebarOpen={isSidebarOpen}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      {isSidebarOpen && (
        <div 
          className="mobile-backdrop"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Body */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}>
        {/* Header TopBar */}
        <TopBar
          activeTab={activeTab}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          notifications={notifications}
          isNotificationsOpen={isNotificationsOpen}
          onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
          onMarkRead={handleMarkNotificationRead}
          onMarkAllRead={handleMarkAllNotificationsRead}
          currentUser={currentUser}
        />

        {/* Dynamic Inner Tab View */}
        <main className="main-responsive" style={{
          flex: 1,
          padding: "1.5rem 1.75rem",
          overflowY: "auto",
        }}>
          <div key={activeTab} className="animate-module-flip" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {renderActiveTab()}
          </div>
        </main>
      </div>

      {/* Global CSS injection for spinner keyframes */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Modals Mounting */}
      <DeleteConfirmModal
        deleteTarget={deleteTarget}
        deleteError={deleteError}
        selectedItemIdsCount={selectedItemIds.length}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirmSubmit}
      />

      <StockModal
        stockModalOpen={stockModalOpen}
        stockItem={stockItem}
        stockSiteId={stockSiteId}
        stockQuantity={stockQuantity}
        setStockQuantity={setStockQuantity}
        stockReorderPoint={stockReorderPoint}
        setStockReorderPoint={setStockReorderPoint}
        stockError={stockError}
        isSubmittingStock={isSubmittingStock}
        sites={sites}
        originalQuantity={stockOriginalQuantity}
        activeAssets={stockActiveAssets}
        onChangeSite={handleStockSiteChange}
        onCancel={() => {
          setStockModalOpen(false);
          setStockItem(null);
        }}
        onSubmit={handleAdjustStockSubmit}
        currentUserRole={currentUser?.role}
      />

      <ViewTagsModal
        viewTagsItem={viewTagsItem}
        viewTagsAssets={viewTagsAssets}
        isLoadingTags={isLoadingTags}
        onClose={() => setViewTagsItem(null)}
        selectedSiteId={selectedSiteId}
      />

      <ItemHistoryModal
        isOpen={isHistoryModalOpen}
        item={historyItem}
        historyLogs={historyLogs}
        isLoading={isLoadingHistory}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setHistoryItem(null);
        }}
      />

      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onScan={handleBarcodeScan}
        catalogItems={catalogItems}
      />

      <ItemModal
        itemModalOpen={itemModalOpen}
        editingItem={editingItem}
        itemName={itemName}
        setItemName={setItemName}
        itemSku={itemSku}
        setItemSku={setItemSku}
        itemDescription={itemDescription}
        setItemDescription={setItemDescription}
        itemUnitPrice={itemUnitPrice}
        setItemUnitPrice={setItemUnitPrice}
        itemLeadTimeDays={itemLeadTimeDays}
        setItemLeadTimeDays={setItemLeadTimeDays}
        itemCategoryId={itemCategoryId}
        setItemCategoryId={setItemCategoryId}
        itemSiteId={itemSiteId}
        setItemSiteId={setItemSiteId}
        itemQuantity={itemQuantity}
        setItemQuantity={setItemQuantity}
        itemError={itemError}
        isSubmittingItem={isSubmittingItem}
        sites={sites}
        categories={categories}
        catalogItems={catalogItems}
        onCancel={() => setItemModalOpen(false)}
        onSubmit={handleCreateItemSubmit}
      />

      <AddUserModal
        isAddModalOpen={isAddModalOpen}
        showAddConfirmation={showAddConfirmation}
        setShowAddConfirmation={setShowAddConfirmation}
        formFirstName={formFirstName}
        setFormFirstName={setFormFirstName}
        formLastName={formLastName}
        setFormLastName={setFormLastName}
        formEmail={formEmail}
        setFormEmail={setFormEmail}
        formRole={formRole}
        setFormRole={setFormRole}
        formEmployeeId={formEmployeeId}
        setFormEmployeeId={setFormEmployeeId}
        formDepartment={formDepartment}
        setFormDepartment={setFormDepartment}
        formSiteId={formSiteId}
        setFormSiteId={setFormSiteId}
        formError={formError}
        isSubmittingForm={isSubmittingForm}
        sites={sites}
        departments={departments}
        onCancel={() => setIsAddModalOpen(false)}
        onPreSubmit={handleAddUserPreSubmit}
        onConfirmAddUser={handleConfirmAddUser}
      />

      <EditUserModal
        isEditModalOpen={isEditModalOpen}
        editingUser={editingUser}
        editFormName={editFormName}
        setEditFormName={setEditFormName}
        editFormEmail={editFormEmail}
        setEditFormEmail={setEditFormEmail}
        editFormRole={editFormRole}
        setEditFormRole={setEditFormRole}
        editFormEmployeeId={editFormEmployeeId}
        setEditFormEmployeeId={setEditFormEmployeeId}
        editFormDepartment={editFormDepartment}
        setEditFormDepartment={setEditFormDepartment}
        editFormSiteId={editFormSiteId}
        setEditFormSiteId={setEditFormSiteId}
        editFormIsActive={editFormIsActive}
        setEditFormIsActive={setEditFormIsActive}
        editFormError={editFormError}
        isSubmittingEditForm={isSubmittingEditForm}
        sites={sites}
        departments={departments}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleEditUserSubmit}
      />

      <SiteModal
        siteModalOpen={siteModalOpen}
        editingSite={editingSite}
        siteName={siteName}
        setSiteName={setSiteName}
        sitePrefix={sitePrefix}
        setSitePrefix={setSitePrefix}
        siteAddress={siteAddress}
        setSiteAddress={setSiteAddress}
        siteError={siteError}
        isSubmittingSite={isSubmittingSite}
        onCancel={() => {
          setSiteModalOpen(false);
          setEditingSite(null);
        }}
        onSubmit={handleCreateSiteSubmit}
      />

      <DeptModal
        deptModalOpen={deptModalOpen}
        deptName={deptName}
        setDeptName={setDeptName}
        deptError={deptError}
        isSubmittingDept={isSubmittingDept}
        onCancel={() => setDeptModalOpen(false)}
        onSubmit={handleCreateDeptSubmit}
      />

      <CategoryModal
        categoryModalOpen={categoryModalOpen}
        editingCategory={editingCategory}
        categoryName={categoryName}
        setCategoryName={setCategoryName}
        categoryPrefix={categoryPrefix}
        setCategoryPrefix={setCategoryPrefix}
        categoryType={categoryType}
        setCategoryType={setCategoryType}
        categoryDescription={categoryDescription}
        setCategoryDescription={setCategoryDescription}
        categoryError={categoryError}
        isSubmittingCategory={isSubmittingCategory}
        onCancel={() => {
          setCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleCreateCategorySubmit}
      />

      {isBulkRequestOpen && (
        <BulkRequestModal
          open={isBulkRequestOpen}
          currentUser={currentUser}
          onClose={() => {
            setIsBulkRequestOpen(false);
            if (selectedItemIds.length === 1) {
              setSelectedItemIds([]);
            }
          }}
          selectedItems={catalogItems
            .filter((it) => selectedItemIds.includes(it.id))
            .map((it) => {
              const stock = it.stockLevels?.find(sl => sl.siteId === selectedSiteId) || { quantity: 0 };
              const tags = (it.assets || []).map((a: any) => a.assetTag || a.serialNumber).filter(Boolean);
              return {
                id: it.id,
                name: it.name,
                sku: it.sku,
                stock: stock.quantity,
                category: it.category?.name,
                assetTags: tags,
              };
            })}
          sites={sites}
          initialMode={bulkRequestInitialMode}
          onSubmit={handleBulkRequestSubmit}
        />
      )}

      {/* Global Action Toasts */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          backgroundColor: toastMessage.type === "success" ? "#10b981" : "#ef4444",
          color: "#ffffff",
          padding: "0.85rem 1.4rem 1.05rem", // slightly padded bottom for progress bar spacing
          borderRadius: "10px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          fontSize: "0.82rem",
          fontWeight: 600,
          zIndex: 9999,
          animation: "slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          overflow: "hidden",
        }}>
          {toastMessage.type === "success" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          )}
          {toastMessage.text}
          <div className="toast-timer" />
          <style>{`
            @keyframes slideIn {
              from { transform: translateY(-20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
