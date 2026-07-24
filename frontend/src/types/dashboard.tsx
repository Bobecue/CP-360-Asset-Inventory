import React from "react";

// ─── Shared types & mock data for the Dashboard ──────────────────────────────

export interface RequestItem {
  id: string;
  item: string;
  requester: string;
  site: string;
  status: "Pending" | "Released" | "Returned" | "Rejected";
  date: string;
}

export interface AlertItem {
  name: string;
  sku: string;
  stock: number;
  min: number;
  category: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  employeeId?: string | null;
  department?: string | null;
  siteId?: string | null;
  site?: { id: string; name: string; prefix: string } | null;
  role: "SUPER_ADMIN" | "ADMIN" | "INVENTORY_STAFF" | "TEAM_LEADER" | "EMPLOYEE";
  isActive: boolean;
  createdAt: string;
}

export interface SiteStock {
  id: string;
  siteId: string;
  itemId: string;
  quantity: number;
  reorderPoint: number;
  site?: { id: string; name: string; prefix: string } | null;
}

export interface Supplier {
  id: string;
  supplierId?: string | null;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  leadTimeDays?: number;
  assets?: any[];
  items?: any[];
  _count?: {
    assets?: number;
    items?: number;
    purchaseOrders?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  unitPrice: number;
  leadTimeDays: number;
  categoryId: string;
  supplierId?: string | null;
  supplier?: { id: string; name: string; supplierId?: string | null } | null;
  category?: { id: string; name: string; prefix: string; type: "CONSUMABLE" | "NON_CONSUMABLE" } | null;
  stockLevels?: SiteStock[] | null;
  assets?: any[] | null;
  quantity?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
}

export interface DbNotification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  userId: string;
  createdAt: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const mockUsers: User[] = [
  {
    id: "user-1",
    name: "Super Admin",
    email: "superadmin@contactpoint360.com",
    role: "SUPER_ADMIN",
    department: "Operations",
    employeeId: "EID-0001",
    isActive: true,
    createdAt: "2026-06-25T19:06:36.952Z",
  },
  {
    id: "user-2",
    name: "John Doe",
    email: "john.doe@contactpoint360.com",
    role: "ADMIN",
    department: "IT Infrastructure",
    employeeId: "EID-0042",
    isActive: true,
    createdAt: "2026-06-25T19:10:00.000Z",
  },
  {
    id: "user-3",
    name: "Jane Smith",
    email: "jane.smith@contactpoint360.com",
    role: "INVENTORY_STAFF",
    department: "Logistics",
    employeeId: "EID-0115",
    isActive: true,
    createdAt: "2026-06-25T19:15:00.000Z",
  },
  {
    id: "user-4",
    name: "Elena Rostova",
    email: "elena.rostova@contactpoint360.com",
    role: "TEAM_LEADER",
    department: "Customer Success",
    employeeId: "EID-0284",
    isActive: true,
    createdAt: "2026-06-25T19:20:00.000Z",
  },
];

export const mockItems: CatalogItem[] = [
  {
    id: "item-1",
    name: 'MacBook Pro 14" M3',
    sku: "IT-MBP-14",
    description: "Apple M3 Chip, 16GB RAM, 512GB SSD",
    unitPrice: 1999.0,
    leadTimeDays: 5,
    categoryId: "cat-1",
    category: { id: "cat-1", name: "Laptops", prefix: "LAP", type: "NON_CONSUMABLE" },
    stockLevels: [
      { id: "stock-1-1", siteId: "site-1", itemId: "item-1", quantity: 15, reorderPoint: 5 },
      { id: "stock-1-2", siteId: "site-2", itemId: "item-1", quantity: 8, reorderPoint: 3 },
    ],
    assets: [
      { id: "a-1-1", tagCode: "CEB-LAP-0001", serialNumber: "SN-CEB-LAP-0001", status: "AVAILABLE", condition: "GOOD", siteId: "site-1" },
      { id: "a-1-2", tagCode: "CEB-LAP-0002", serialNumber: "SN-CEB-LAP-0002", status: "AVAILABLE", condition: "GOOD", siteId: "site-1" },
      { id: "a-1-3", tagCode: "TOR-LAP-0001", serialNumber: "SN-TOR-LAP-0001", status: "AVAILABLE", condition: "GOOD", siteId: "site-2" },
    ],
  },
  {
    id: "item-2",
    name: 'Dell UltraSharp 27" Monitor',
    sku: "IT-DEL-U27",
    description: "4K USB-C Monitor U2723QE",
    unitPrice: 549.99,
    leadTimeDays: 7,
    categoryId: "cat-2",
    category: { id: "cat-2", name: "Peripherals", prefix: "PER", type: "NON_CONSUMABLE" },
    stockLevels: [
      { id: "stock-2-1", siteId: "site-1", itemId: "item-2", quantity: 20, reorderPoint: 5 },
      { id: "stock-2-2", siteId: "site-2", itemId: "item-2", quantity: 3, reorderPoint: 5 },
    ],
    assets: [
      { id: "a-2-1", tagCode: "CEB-PER-0001", serialNumber: "SN-CEB-PER-0001", status: "AVAILABLE", condition: "GOOD", siteId: "site-1" },
      { id: "a-2-2", tagCode: "TOR-PER-0001", serialNumber: "SN-TOR-PER-0001", status: "AVAILABLE", condition: "GOOD", siteId: "site-2" },
    ],
  },
  {
    id: "item-3",
    name: "Logitech MX Master 3S",
    sku: "IT-LOG-MX3S",
    description: "Wireless Performance Mouse",
    unitPrice: 99.99,
    leadTimeDays: 3,
    categoryId: "cat-2",
    category: { id: "cat-2", name: "Peripherals", prefix: "PER", type: "NON_CONSUMABLE" },
    stockLevels: [
      { id: "stock-3-1", siteId: "site-1", itemId: "item-3", quantity: 0, reorderPoint: 5 },
      { id: "stock-3-2", siteId: "site-2", itemId: "item-3", quantity: 12, reorderPoint: 5 },
    ],
    assets: [
      { id: "a-3-1", tagCode: "TOR-PER-0002", serialNumber: "SN-TOR-PER-0002", status: "AVAILABLE", condition: "GOOD", siteId: "site-2" },
    ],
  },
  {
    id: "item-4",
    name: "AA Alkaline Batteries (4-Pack)",
    sku: "CON-BATT-AA",
    description: "Energizer Max AA batteries",
    unitPrice: 4.99,
    leadTimeDays: 2,
    categoryId: "cat-3",
    category: { id: "cat-3", name: "Office Consumables", prefix: "CON", type: "CONSUMABLE" },
    stockLevels: [
      { id: "stock-4-1", siteId: "site-1", itemId: "item-4", quantity: 120, reorderPoint: 20 },
      { id: "stock-4-2", siteId: "site-2", itemId: "item-4", quantity: 15, reorderPoint: 20 },
    ],
  },
];

export const mockSites = [
  { id: "e6ffecfe-2683-4374-b373-93a66b962161", name: "Skyrise 4B", prefix: "SK4", address: "Cebu IT Park, Skyrise 4B" },
  { id: "69757c11-3849-40c2-9ca9-925a7056e932", name: "Skyrise Alpha", prefix: "SKA", address: "Cebu Business Park, Skyrise Alpha" },
  { id: "24410602-efbc-4fd9-81f6-e7859db56bdd", name: "Skyrise Beta", prefix: "SKB", address: "Cebu Business Park, Skyrise Beta" },
];

export const mockDepartments = [
  { id: "dept-1", name: "IT Infrastructure" },
  { id: "dept-2", name: "Operations" },
  { id: "dept-3", name: "Customer Success" },
  { id: "dept-4", name: "Logistics" },
];

export const mockCategories = [
  { id: "cat-1", name: "Laptops", prefix: "LAP", type: "NON_CONSUMABLE", description: "Laptops, MacBooks, and Notebooks" },
  { id: "cat-2", name: "Monitors", prefix: "MON", type: "NON_CONSUMABLE", description: "Desktop monitors and displays" },
  { id: "cat-8", name: "System Units", prefix: "SYS", type: "NON_CONSUMABLE", description: "Desktop PCs, System Units, and Workstations" },
  { id: "cat-5", name: "RAM", prefix: "RAM", type: "NON_CONSUMABLE", description: "Memory modules and RAM sticks" },
  { id: "cat-6", name: "SSD / Storage", prefix: "SSD", type: "NON_CONSUMABLE", description: "Solid State Drives and hard drives" },
  { id: "cat-3", name: "Keyboards", prefix: "KBD", type: "CONSUMABLE", description: "Keyboards and keypads" },
  { id: "cat-4", name: "Mice", prefix: "MOU", type: "CONSUMABLE", description: "Computer mice and pointers" },
  { id: "cat-7", name: "Cables", prefix: "CAB", type: "CONSUMABLE", description: "Cables, adapters, and power cords" },
];

export const mockNotifications: DbNotification[] = [
  {
    id: "notif-1",
    title: "Low Stock Warning",
    message: 'Stock level for "CAT6 Ethernet Cable (10m)" at "Cebu IT Park" has dropped to 12 (Reorder threshold: 50).',
    isRead: false,
    userId: "user-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "notif-2",
    title: "Pending Approval",
    message: 'Employee John Doe has requested 1x "MacBook Pro 14\\" M3" for project onboarding.',
    isRead: false,
    userId: "user-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "notif-3",
    title: "System Notification",
    message: "Asset Inventory sequential tagging module has been successfully integrated.",
    isRead: true,
    userId: "user-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
  },
];

// ─── Pure helper functions & Tag Components ─────────────────────────────────

export const getRoleBadgeStyle = (role: string): React.CSSProperties => {
  switch (role) {
    case "SUPER_ADMIN":
      return {
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
        color: "#ffffff",
        fontWeight: 700,
        border: "1px solid rgba(165, 180, 252, 0.35)",
        boxShadow: "0 2px 6px rgba(49, 46, 129, 0.25)",
      };
    case "ADMIN": // Ops Manager
      return {
        background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
        color: "#3730a3",
        fontWeight: 700,
        border: "1px solid #c7d2fe",
        boxShadow: "0 1px 3px rgba(67, 56, 202, 0.1)",
      };
    case "INVENTORY_STAFF":
      return {
        background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
        color: "#047857",
        fontWeight: 700,
        border: "1px solid #6ee7b7",
        boxShadow: "0 1px 3px rgba(4, 120, 87, 0.1)",
      };
    case "TEAM_LEADER":
      return {
        background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
        color: "#0369a1",
        fontWeight: 700,
        border: "1px solid #7dd3fc",
        boxShadow: "0 1px 3px rgba(3, 105, 161, 0.1)",
      };
    case "EMPLOYEE":
    default:
      return {
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        color: "#334155",
        fontWeight: 600,
        border: "1px solid #cbd5e1",
        boxShadow: "0 1px 2px rgba(51, 65, 85, 0.05)",
      };
  }
};

export const formatRoleName = (role: string): string => {
  switch (role) {
    case "SUPER_ADMIN": return "Super Admin";
    case "ADMIN": return "Ops Manager";
    case "INVENTORY_STAFF": return "Inventory Staff";
    case "TEAM_LEADER": return "Team Leader";
    case "EMPLOYEE": return "Employee";
    default: return role;
  }
};

export const RoleBadge = ({ role, size = "md" }: { role: string; size?: "sm" | "md" | "lg" }) => {
  const iconSize = size === "sm" ? 11 : size === "lg" ? 14 : 12;

  const renderRoleIcon = (r: string) => {
    switch (r) {
      case "SUPER_ADMIN":
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        );
      case "ADMIN": // Ops Manager
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        );
      case "INVENTORY_STAFF":
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        );
      case "TEAM_LEADER":
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 12 2" />
          </svg>
        );
      case "EMPLOYEE":
      default:
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
    }
  };

  const style = getRoleBadgeStyle(role);
  const sizeStyles = {
    sm: { padding: "0.15rem 0.5rem", fontSize: "0.68rem", gap: "0.3rem" },
    md: { padding: "0.25rem 0.65rem", fontSize: "0.74rem", gap: "0.35rem" },
    lg: { padding: "0.35rem 0.85rem", fontSize: "0.82rem", gap: "0.45rem" }
  }[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "9999px",
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
        userSelect: "none",
        transition: "all 0.15s ease",
        ...sizeStyles,
        ...style,
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center" }}>
        {renderRoleIcon(role)}
      </span>
      <span>{formatRoleName(role)}</span>
    </span>
  );
};

export const EidBadge = ({ employeeId, size = "md" }: { employeeId?: string | null; size?: "sm" | "md" }) => {
  if (!employeeId) {
    return <span style={{ color: "#cbd5e1" }}>—</span>;
  }

  const padding = size === "sm" ? "0.12rem 0.45rem" : "0.2rem 0.55rem";
  const fontSize = size === "sm" ? "0.68rem" : "0.74rem";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        padding: padding,
        borderRadius: "6px",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        color: "#1e293b",
        border: "1px solid #cbd5e1",
        fontSize: fontSize,
        fontWeight: 700,
        fontFamily: "var(--font-geist-mono), monospace",
        letterSpacing: "0.03em",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)",
        whiteSpace: "nowrap"
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.9 }}>
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="#210cae" fill="rgba(33, 12, 174, 0.1)" />
        <circle cx="9" cy="10" r="2" stroke="#210cae" />
        <line x1="15" y1="9" x2="17" y2="9" stroke="#4dc9e6" strokeWidth="2" />
        <line x1="15" y1="13" x2="17" y2="13" stroke="#4dc9e6" strokeWidth="2" />
        <line x1="7" y1="16" x2="17" y2="16" stroke="#210cae" />
      </svg>
      <span>{employeeId}</span>
    </span>
  );
};

export const SiteBadge = ({
  site,
  siteName,
  prefix,
  size = "md"
}: {
  site?: { id?: string; name: string; prefix?: string } | null;
  siteName?: string;
  prefix?: string;
  size?: "sm" | "md";
}) => {
  const name = site?.name || siteName;
  const pfx = site?.prefix || prefix;
  const pinSize = size === "sm" ? 11 : 12;

  if (!name) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          padding: size === "sm" ? "0.15rem 0.5rem" : "0.2rem 0.6rem",
          borderRadius: "9999px",
          background: "#f8fafc",
          color: "#64748b",
          border: "1px solid #e2e8f0",
          fontSize: size === "sm" ? "0.68rem" : "0.74rem",
          fontWeight: 500,
          fontStyle: "italic",
        }}
      >
        <svg width={pinSize} height={pinSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>Global Scope</span>
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: size === "sm" ? "0.15rem 0.55rem" : "0.25rem 0.65rem",
        borderRadius: "9999px",
        background: "linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)",
        border: "1px solid rgba(77, 201, 230, 0.35)",
        boxShadow: "0 1px 3px rgba(33, 12, 174, 0.05)",
        fontSize: size === "sm" ? "0.7rem" : "0.76rem",
        color: "#0f172a",
        fontWeight: 600,
        whiteSpace: "nowrap"
      }}
    >
      <svg width={pinSize} height={pinSize} viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
      {pfx && (
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 800,
            background: "linear-gradient(135deg, #210cae 0%, #4dc9e6 100%)",
            color: "#ffffff",
            padding: "0.08rem 0.4rem",
            borderRadius: "4px",
            letterSpacing: "0.04em",
            boxShadow: "0 1px 2px rgba(33, 12, 174, 0.2)"
          }}
        >
          {pfx}
        </span>
      )}
      <span>{name}</span>
    </span>
  );
};

export const AssetTagBadge = ({
  tag,
  size = "md",
  variant = "default"
}: {
  tag?: string | null;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "dark" | "outline";
}) => {
  if (!tag) return <span style={{ color: "#cbd5e1" }}>—</span>;

  const sizeStyles = {
    sm: { padding: "0.12rem 0.45rem", fontSize: "0.68rem", gap: "0.25rem" },
    md: { padding: "0.2rem 0.55rem", fontSize: "0.74rem", gap: "0.3rem" },
    lg: { padding: "0.3rem 0.75rem", fontSize: "0.82rem", gap: "0.35rem" }
  }[size];

  const variantStyles = {
    default: {
      background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
      color: "#210cae",
      border: "1px solid #c7d2fe",
      boxShadow: "0 1px 3px rgba(33, 12, 174, 0.08)"
    },
    dark: {
      background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
      color: "#38bdf8",
      border: "1px solid rgba(56, 189, 248, 0.3)",
      boxShadow: "0 2px 6px rgba(15, 23, 42, 0.25)"
    },
    outline: {
      background: "#ffffff",
      color: "#334155",
      border: "1px solid #cbd5e1",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)"
    }
  }[variant];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "6px",
        fontFamily: "var(--font-geist-mono), monospace",
        fontWeight: 700,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
        userSelect: "none",
        ...sizeStyles,
        ...variantStyles
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
      <span>{tag}</span>
    </span>
  );
};

export const getGeneratedPassword = (_eid?: string, _firstName?: string, _lastName?: string): string => {
  return "SuperAdmin360!";
};

export const getCategoryIcon = (categoryName?: string, itemName?: string, size = 18) => {
  const cat = (categoryName || "").toLowerCase();
  const item = (itemName || "").toLowerCase();
  const text = cat + " " + item;

  // 1. RAM / Memory Modules
  if (text.includes("ram") || text.includes("memory") || text.includes("ddr") || text.includes("dimm") || text.includes("s800") || text.includes("ramsta")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" fill="url(#brand-grad-icon)" fillOpacity="0.15" stroke="#210cae" />
        <line x1="6" y1="18" x2="6" y2="21" stroke="#4dc9e6" strokeWidth="2" />
        <line x1="10" y1="18" x2="10" y2="21" stroke="#210cae" strokeWidth="2" />
        <line x1="14" y1="18" x2="14" y2="21" stroke="#4dc9e6" strokeWidth="2" />
        <line x1="18" y1="18" x2="18" y2="21" stroke="#210cae" strokeWidth="2" />
        <circle cx="7" cy="11" r="1.5" fill="#4dc9e6" stroke="none" />
        <circle cx="17" cy="11" r="1.5" fill="#210cae" stroke="none" />
        <defs>
          <linearGradient id="brand-grad-icon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4dc9e6" />
            <stop offset="100%" stopColor="#210cae" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // 2. SSD / NVMe / Hard Drives / Storage
  if (text.includes("ssd") || text.includes("nvme") || text.includes("hdd") || text.includes("hard drive") || text.includes("disk") || text.includes("storage") || text.includes("255gb") || text.includes("512gb") || text.includes("1tb")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2" fill="url(#brand-grad-icon)" fillOpacity="0.12" stroke="#210cae" />
        <circle cx="9" cy="12" r="2.5" stroke="#4dc9e6" strokeWidth="1.8" />
        <line x1="15" y1="8" x2="17" y2="8" stroke="#210cae" strokeWidth="2" />
        <line x1="15" y1="12" x2="17" y2="12" stroke="#4dc9e6" strokeWidth="2" />
        <line x1="15" y1="16" x2="17" y2="16" stroke="#210cae" strokeWidth="2" />
      </svg>
    );
  }

  // 3. Desktop PC / Towers
  if (text.includes("desktop") || text.includes("system unit") || text.includes("tower") || text.includes("pc") || text.includes("workstation") || text.includes("dell")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" fill="url(#brand-grad-icon)" fillOpacity="0.12" stroke="#210cae" />
        <circle cx="12" cy="6" r="1.25" fill="#4dc9e6" />
        <line x1="9" y1="11" x2="15" y2="11" stroke="#210cae" />
        <line x1="9" y1="15" x2="15" y2="15" stroke="#4dc9e6" />
      </svg>
    );
  }

  // 4. Laptops / MacBooks
  if (text.includes("laptop") || text.includes("notebook") || text.includes("macbook") || text.includes("thinkpad") || text.includes("computer")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="12" rx="2" fill="url(#brand-grad-icon)" fillOpacity="0.15" stroke="#210cae" />
        <line x1="2" y1="20" x2="22" y2="20" stroke="#4dc9e6" strokeWidth="2.2" />
        <line x1="10" y1="16" x2="14" y2="16" stroke="#210cae" strokeWidth="1.8" />
      </svg>
    );
  }

  // 5. Monitors / Displays
  if (text.includes("monitor") || text.includes("display") || text.includes("screen") || text.includes("tv")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" fill="url(#brand-grad-icon)" fillOpacity="0.12" stroke="#210cae" />
        <line x1="12" y1="17" x2="12" y2="21" stroke="#4dc9e6" strokeWidth="2" />
        <line x1="8" y1="21" x2="16" y2="21" stroke="#210cae" strokeWidth="2" />
      </svg>
    );
  }

  // 6. Printers / Scanners
  if (text.includes("printer") || text.includes("scanner") || text.includes("laserjet") || text.includes("inkjet") || text.includes("copier")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9" stroke="#210cae" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" fill="url(#brand-grad-icon)" fillOpacity="0.12" stroke="#210cae" />
        <rect x="6" y="14" width="12" height="8" rx="1" stroke="#4dc9e6" strokeWidth="2" />
      </svg>
    );
  }

  // 7. Networking / Routers / Cables
  if (text.includes("network") || text.includes("router") || text.includes("switch") || text.includes("cable") || text.includes("ethernet") || text.includes("hdmi") || text.includes("usb")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v8M18 12a6 6 0 0 1-6 6M6 12a6 6 0 0 0 6 6M12 18v4" stroke="#210cae" />
        <rect x="6" y="2" width="4" height="4" rx="1" fill="#4dc9e6" stroke="none" />
        <rect x="14" y="2" width="4" height="4" rx="1" fill="#210cae" stroke="none" />
      </svg>
    );
  }

  // 8. Mice / Pointers
  if (text.includes("mouse") || text.includes("mice") || text.includes("pointer") || text.includes("trackpad") || text.includes("logitech") || text.includes("op-720")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="3" width="12" height="18" rx="6" fill="url(#brand-grad-icon)" fillOpacity="0.15" stroke="#210cae" />
        <line x1="12" y1="3" x2="12" y2="8" stroke="#4dc9e6" strokeWidth="2.2" />
        <path d="M6 9h12" stroke="#210cae" strokeWidth="1.5" />
      </svg>
    );
  }

  // 9. Headsets / Audio
  if (text.includes("headset") || text.includes("headphone") || text.includes("audio") || text.includes("earphone") || text.includes("jabra")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke="#210cae" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5z" fill="url(#brand-grad-icon)" fillOpacity="0.3" stroke="#210cae" />
        <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z" fill="url(#brand-grad-icon)" fillOpacity="0.3" stroke="#4dc9e6" />
      </svg>
    );
  }

  // 10. Keyboards
  if (text.includes("keyboard") || text.includes("keypad") || text.includes("kbd")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" fill="url(#brand-grad-icon)" fillOpacity="0.1" stroke="#210cae" />
        <circle cx="6" cy="10" r="0.75" fill="#4dc9e6" stroke="none" />
        <circle cx="10" cy="10" r="0.75" fill="#210cae" stroke="none" />
        <circle cx="14" cy="10" r="0.75" fill="#210cae" stroke="none" />
        <circle cx="18" cy="10" r="0.75" fill="#4dc9e6" stroke="none" />
        <line x1="8" y1="14" x2="16" y2="14" stroke="#4dc9e6" strokeWidth="2" />
      </svg>
    );
  }

  // 11. Office Supplies & Consumables
  if (text.includes("pen") || text.includes("ink") || text.includes("paper") || text.includes("stationery") || text.includes("office") || text.includes("consumable")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" stroke="#4dc9e6" strokeWidth="2" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" fill="url(#brand-grad-icon)" fillOpacity="0.2" stroke="#210cae" />
      </svg>
    );
  }

  // Default fallback asset box icon with CP360 brand gradient
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8L12 3L3 8L12 13L21 8Z" fill="url(#brand-grad-default)" fillOpacity="0.2" stroke="#210cae" />
      <path d="M21 16V8L12 13V21L21 16Z" stroke="#210cae" />
      <path d="M3 8V16L12 21V13L3 8Z" stroke="#4dc9e6" />
      <defs>
        <linearGradient id="brand-grad-default" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4dc9e6" />
          <stop offset="100%" stopColor="#210cae" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const getDepartmentIcon = (departmentName?: string, size = 16) => {
  const n = (departmentName || "").toLowerCase();

  if (n.includes("recruit") || n.includes("hr") || n.includes("talent") || n.includes("people")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="8.5" cy="7" r="4"/>
        <line x1="20" y1="8" x2="20" y2="14"/>
        <line x1="17" y1="11" x2="23" y2="11"/>
      </svg>
    );
  }

  if (n.includes("it") || n.includes("tech") || n.includes("system") || n.includes("information")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    );
  }

  if (n.includes("social") || n.includes("media") || n.includes("marketing") || n.includes("design")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        <circle cx="18" cy="4" r="3" fill="#ec4899" stroke="none"/>
      </svg>
    );
  }

  if (n.includes("engage") || n.includes("success") || n.includes("client") || n.includes("customer")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    );
  }

  if (n.includes("finance") || n.includes("account") || n.includes("billing")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    );
  }

  if (n.includes("logistics") || n.includes("inventory") || n.includes("operation") || n.includes("ops")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
};


