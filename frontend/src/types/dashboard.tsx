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
  isActive?: boolean;
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
  { id: "e6ffecfe-2683-4374-b373-93a66b962161", name: "Skyrise 4B", prefix: "SK4", address: "Cebu IT Park, Skyrise 4B", floor: "10th, 11th floor" },
  { id: "69757c11-3849-40c2-9ca9-925a7056e932", name: "Skyrise Alpha", prefix: "SKA", address: "Cebu Business Park, Skyrise Alpha", floor: "6th floor" },
  { id: "24410602-efbc-4fd9-81f6-e7859db56bdd", name: "Skyrise Beta", prefix: "SKB", address: "Cebu Business Park, Skyrise Beta", floor: "10th, 12th floor" },
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
  { id: "cat-9", name: "Headsets", prefix: "HDS", type: "NON_CONSUMABLE", description: "Audio headsets, earphones, and microphones" },
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
        background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #818CF8 100%)",
        color: "#ffffff",
        fontWeight: 700,
        border: "1px solid rgba(255, 255, 255, 0.4)",
        boxShadow: "0 2px 8px rgba(99, 102, 241, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
      };
    case "ADMIN": // Ops Manager
      return {
        background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 50%, rgba(99, 102, 241, 0.15) 100%)",
        color: "#4338CA",
        fontWeight: 700,
        border: "1px solid rgba(99, 102, 241, 0.4)",
        boxShadow: "0 1px 4px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
      };
    case "INVENTORY_STAFF":
      return {
        background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, rgba(16, 185, 129, 0.12) 100%)",
        color: "#15803D",
        fontWeight: 700,
        border: "1px solid rgba(16, 185, 129, 0.4)",
        boxShadow: "0 1px 4px rgba(16, 185, 129, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
      };
    case "TEAM_LEADER":
      return {
        background: "linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 60%, rgba(168, 85, 247, 0.12) 100%)",
        color: "#7E22CE",
        fontWeight: 700,
        border: "1px solid rgba(168, 85, 247, 0.4)",
        boxShadow: "0 1px 4px rgba(168, 85, 247, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
      };
    case "EMPLOYEE":
    default:
      return {
        background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
        color: "#334155",
        fontWeight: 600,
        border: "1px solid #CBD5E1",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
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
          <svg className="glitter-star-icon" width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        );
      case "ADMIN": // Ops Manager
        return (
          <svg className="glitter-star-icon" width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        );
      case "INVENTORY_STAFF":
        return (
          <svg className="glitter-star-icon" width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        );
      case "TEAM_LEADER":
        return (
          <svg className="glitter-star-icon" width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 12 2" />
          </svg>
        );
      case "EMPLOYEE":
      default:
        return (
          <svg className="glitter-star-icon" width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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

  const roleClassKey = role ? role.toLowerCase() : "employee";
  const glitterClassName = `glitter-glow-badge-${roleClassKey}`;

  return (
    <span
      className={glitterClassName}
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
    return <span style={{ color: "#94a3b8" }}>—</span>;
  }

  const padding = size === "sm" ? "0.15rem 0.5rem" : "0.22rem 0.6rem";
  const fontSize = size === "sm" ? "0.7rem" : "0.76rem";

  return (
    <span
      className="glitter-eid-badge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: padding,
        borderRadius: "6px",
        background: "#EEF2FF",
        color: "#3730A3",
        border: "1.5px solid #C7D2FE",
        fontSize: fontSize,
        fontWeight: 700,
        fontFamily: "var(--font-geist-mono), monospace",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap"
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="#4F46E5" fill="rgba(79, 70, 229, 0.1)" />
        <circle cx="9" cy="10" r="2" stroke="#4F46E5" />
        <line x1="15" y1="9" x2="17" y2="9" stroke="#4338CA" strokeWidth="2" />
        <line x1="15" y1="13" x2="17" y2="13" stroke="#4338CA" strokeWidth="2" />
        <line x1="7" y1="16" x2="17" y2="16" stroke="#4F46E5" />
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
  const pinSize = size === "sm" ? 12 : 13;

  if (!name) {
    return (
      <span
        className="glitter-site-badge"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          padding: size === "sm" ? "0.15rem 0.5rem" : "0.22rem 0.6rem",
          borderRadius: "9999px",
          background: "#F1F5F9",
          color: "#475569",
          border: "1.5px solid #CBD5E1",
          fontSize: size === "sm" ? "0.7rem" : "0.76rem",
          fontWeight: 600,
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
      className="glitter-site-badge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: size === "sm" ? "0.18rem 0.55rem" : "0.25rem 0.7rem",
        borderRadius: "9999px",
        background: "#DBEAFE",
        border: "1.5px solid #93C5FD",
        fontSize: size === "sm" ? "0.72rem" : "0.78rem",
        color: "#1E3A8A",
        fontWeight: 700,
        whiteSpace: "nowrap"
      }}
    >
      <svg width={pinSize} height={pinSize} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
      {pfx && (
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 800,
            background: "#2563EB",
            color: "#ffffff",
            padding: "0.1rem 0.45rem",
            borderRadius: "4px",
            letterSpacing: "0.03em"
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
  if (!tag) return <span style={{ color: "#94a3b8" }}>—</span>;

  const sizeStyles = {
    sm: { padding: "0.15rem 0.5rem", fontSize: "0.7rem", gap: "0.3rem" },
    md: { padding: "0.22rem 0.6rem", fontSize: "0.76rem", gap: "0.35rem" },
    lg: { padding: "0.32rem 0.8rem", fontSize: "0.84rem", gap: "0.4rem" }
  }[size];

  const variantStyles = {
    default: {
      background: "#EEF2FF",
      color: "#312E81",
      border: "1.5px solid #A5B4FC"
    },
    dark: {
      background: "#0F172A",
      color: "#C7D2FE",
      border: "1.5px solid #475569"
    },
    outline: {
      background: "#ffffff",
      color: "#3730A3",
      border: "1.5px solid #C7D2FE"
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
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
        userSelect: "none",
        ...sizeStyles,
        ...variantStyles
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
      <span>{tag}</span>
    </span>
  );
};

export const isCategoryConsumable = (cat?: any): boolean => {
  if (!cat) return false;
  const typeStr = (typeof cat === "string" ? cat : cat.type || "").toUpperCase();
  const nameStr = (typeof cat === "string" ? cat : cat.name || "").toLowerCase();

  return (
    typeStr === "CONSUMABLE" ||
    typeStr === "OPEX" ||
    nameStr.includes("consumable") ||
    nameStr.includes("mouse") ||
    nameStr.includes("mice") ||
    nameStr.includes("keyboard") ||
    nameStr.includes("cable")
  );
};

export const AssetTypeBadge = ({ type, categoryName, size = "md" }: { type?: any; categoryName?: string; size?: "sm" | "md" | "lg" }) => {
  const isConsumable = isCategoryConsumable({ type, name: categoryName });
  const label = isConsumable ? "Consumable" : "Non-Consumable";

  const sizeStyles = {
    sm: { padding: "3px 10px", fontSize: "0.68rem" },
    md: { padding: "4px 12px", fontSize: "0.75rem" },
    lg: { padding: "5px 14px", fontSize: "0.82rem" },
  }[size];

  const badgeStyle: React.CSSProperties = isConsumable
    ? {
        background: "#FEF3C7",
        color: "#92400E",
        border: "1.5px solid #FCD34D",
      }
    : {
        background: "#F1F5F9",
        color: "#334155",
        border: "1.5px solid #CBD5E1",
      };

  return (
    <span
      className="glitter-category-badge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        borderRadius: "9999px",
        fontWeight: 800,
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
        userSelect: "none",
        ...sizeStyles,
        ...badgeStyle,
      }}
    >
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          backgroundColor: isConsumable ? "#D97706" : "#475569",
        }}
      />
      <span>{label}</span>
    </span>
  );
};

export const getGeneratedPassword = (_eid?: string, _firstName?: string, _lastName?: string): string => {
  return "SuperAdmin360!";
};

export const getCategoryIcon = (categoryName?: string, itemName?: string, size = 20) => {
  const cat = (categoryName || "").toLowerCase();
  const item = (itemName || "").toLowerCase();
  const text = cat + " " + item;

  // 1. RAM / Memory Modules
  if (text.includes("ram") || text.includes("memory") || text.includes("ddr") || text.includes("dimm") || text.includes("s800") || text.includes("ramsta")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" />
        <line x1="6" y1="18" x2="6" y2="21" stroke="currentColor" strokeWidth="2" />
        <line x1="10" y1="18" x2="10" y2="21" stroke="currentColor" strokeWidth="2" />
        <line x1="14" y1="18" x2="14" y2="21" stroke="currentColor" strokeWidth="2" />
        <line x1="18" y1="18" x2="18" y2="21" stroke="currentColor" strokeWidth="2" />
        <circle cx="7" cy="11" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="17" cy="11" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  // 2. SSD / NVMe / Hard Drives / Storage
  if (text.includes("ssd") || text.includes("nvme") || text.includes("hdd") || text.includes("hard drive") || text.includes("disk") || text.includes("storage") || text.includes("255gb") || text.includes("512gb") || text.includes("1tb")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" />
        <circle cx="9" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
        <line x1="15" y1="8" x2="17" y2="8" stroke="currentColor" strokeWidth="2" />
        <line x1="15" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="2" />
        <line x1="15" y1="16" x2="17" y2="16" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  // 3. Desktop PC / System Units / Towers
  if (text.includes("desktop") || text.includes("system unit") || text.includes("tower") || text.includes("pc") || text.includes("workstation") || text.includes("dell")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" />
        <circle cx="12" cy="6" r="1.5" fill="currentColor" />
        <line x1="9" y1="11" x2="15" y2="11" stroke="currentColor" />
        <line x1="9" y1="15" x2="15" y2="15" stroke="currentColor" />
      </svg>
    );
  }

  // 4. Laptops / MacBooks
  if (text.includes("laptop") || text.includes("notebook") || text.includes("macbook") || text.includes("thinkpad") || text.includes("computer")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" />
        <line x1="2" y1="20" x2="22" y2="20" stroke="currentColor" strokeWidth="2.5" />
        <line x1="10" y1="16" x2="14" y2="16" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  // 5. Monitors / Displays
  if (text.includes("monitor") || text.includes("display") || text.includes("screen") || text.includes("tv")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" />
        <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2" />
        <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  // 6. Printers / Scanners
  if (text.includes("printer") || text.includes("scanner") || text.includes("laserjet") || text.includes("inkjet") || text.includes("copier")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9" stroke="currentColor" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke="currentColor" />
        <rect x="6" y="14" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  // 7. Networking / Routers / Cables
  if (text.includes("network") || text.includes("router") || text.includes("switch") || text.includes("cable") || text.includes("ethernet") || text.includes("hdmi") || text.includes("usb")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v8M18 12a6 6 0 0 1-6 6M6 12a6 6 0 0 0 6 6M12 18v4" stroke="currentColor" />
        <rect x="6" y="2" width="4" height="4" rx="1" fill="currentColor" stroke="none" />
        <rect x="14" y="2" width="4" height="4" rx="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  // 8. Mice / Pointers
  if (text.includes("mouse") || text.includes("mice") || text.includes("pointer") || text.includes("trackpad") || text.includes("logitech") || text.includes("op-720")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="3" width="12" height="18" rx="6" stroke="currentColor" />
        <line x1="12" y1="3" x2="12" y2="8" stroke="currentColor" strokeWidth="2" />
        <path d="M6 9h12" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  // 9. Headsets / Audio
  if (text.includes("headset") || text.includes("headphone") || text.includes("audio") || text.includes("earphone") || text.includes("jabra")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke="currentColor" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5z" stroke="currentColor" />
        <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z" stroke="currentColor" />
      </svg>
    );
  }

  // 10. Keyboards
  if (text.includes("keyboard") || text.includes("keypad") || text.includes("kbd")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" />
        <circle cx="6" cy="10" r="0.75" fill="currentColor" stroke="none" />
        <circle cx="10" cy="10" r="0.75" fill="currentColor" stroke="none" />
        <circle cx="14" cy="10" r="0.75" fill="currentColor" stroke="none" />
        <circle cx="18" cy="10" r="0.75" fill="currentColor" stroke="none" />
        <line x1="8" y1="14" x2="16" y2="14" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  // 11. Office Supplies & Consumables
  if (text.includes("pen") || text.includes("ink") || text.includes("paper") || text.includes("stationery") || text.includes("office") || text.includes("consumable")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" stroke="currentColor" strokeWidth="2" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" />
      </svg>
    );
  }

  // Default fallback asset box icon
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8L12 3L3 8L12 13L21 8Z" stroke="currentColor" />
      <path d="M21 16V8L12 13V21L21 16Z" stroke="currentColor" />
      <path d="M3 8V16L12 21V13L3 8Z" stroke="currentColor" />
    </svg>
  );
};

export const getDepartmentIcon = (departmentName?: string, size = 16) => {
  const n = (departmentName || "").toLowerCase();

  if (n.includes("recruit") || n.includes("hr") || n.includes("talent") || n.includes("people")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="8.5" cy="7" r="4"/>
        <line x1="20" y1="8" x2="20" y2="14"/>
        <line x1="17" y1="11" x2="23" y2="11"/>
      </svg>
    );
  }

  if (n.includes("it") || n.includes("tech") || n.includes("system") || n.includes("information")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    );
  }

  if (n.includes("social") || n.includes("media") || n.includes("marketing") || n.includes("design")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        <circle cx="18" cy="4" r="3" fill="#A855F7" stroke="none"/>
      </svg>
    );
  }

  if (n.includes("engage") || n.includes("success") || n.includes("client") || n.includes("customer")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    );
  }

  if (n.includes("finance") || n.includes("account") || n.includes("billing")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    );
  }

  if (n.includes("logistics") || n.includes("inventory") || n.includes("operation") || n.includes("ops")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
};


