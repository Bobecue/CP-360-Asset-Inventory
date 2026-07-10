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

export interface CatalogItem {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  unitPrice: number;
  leadTimeDays: number;
  categoryId: string;
  category?: { id: string; name: string; prefix: string; type: "CONSUMABLE" | "NON_CONSUMABLE" } | null;
  stockLevels?: SiteStock[] | null;
  assets?: any[] | null;
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
  { id: "site-1", name: "Cebu IT Park", prefix: "CEB", address: "Cebu City, Philippines" },
  { id: "site-2", name: "Toronto HQ", prefix: "TOR", address: "Toronto, ON, Canada" },
];

export const mockDepartments = [
  { id: "dept-1", name: "IT Infrastructure" },
  { id: "dept-2", name: "Operations" },
  { id: "dept-3", name: "Customer Success" },
  { id: "dept-4", name: "Logistics" },
];

export const mockCategories = [
  { id: "cat-1", name: "Laptops", prefix: "LAP", type: "NON_CONSUMABLE", description: "Company laptops" },
  { id: "cat-2", name: "Peripherals", prefix: "PER", type: "NON_CONSUMABLE", description: "Mice, keyboards, monitors" },
  { id: "cat-3", name: "Office Consumables", prefix: "CON", type: "CONSUMABLE", description: "Pens, papers, batteries" },
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

// ─── Pure helper functions ────────────────────────────────────────────────────

export const getRoleBadgeStyle = (role: string): React.CSSProperties => {
  switch (role) {
    case "SUPER_ADMIN":
      return { background: "linear-gradient(135deg, #210cae 0%, #4dc9e6 100%)", color: "#ffffff", fontWeight: 700 };
    case "ADMIN":
      return { backgroundColor: "#e0e7ff", color: "#4338ca", fontWeight: 600 };
    case "INVENTORY_STAFF":
      return { backgroundColor: "#d1fae5", color: "#065f46", fontWeight: 600 };
    case "TEAM_LEADER":
      return { backgroundColor: "#e0f2fe", color: "#0369a1", fontWeight: 600 };
    default:
      return { backgroundColor: "#f1f5f9", color: "#475569", fontWeight: 500 };
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

export const getGeneratedPassword = (eid: string, firstName: string, lastName: string): string => {
  const cleanEid = eid.trim();
  const firstInitial = firstName.trim().charAt(0).toUpperCase();
  const cleanLast = lastName.trim();
  const formattedLastName = cleanLast.length > 0
    ? cleanLast.charAt(0).toUpperCase() + cleanLast.slice(1).toLowerCase()
    : "";
  return `${cleanEid}${firstInitial}${formattedLastName}`;
};

export const getCategoryIcon = (categoryName?: string, itemName?: string, size = 20) => {
  const cat = (categoryName || "").toLowerCase();
  const item = (itemName || "").toLowerCase();
  const text = cat + " " + item;

  // Laptops / Computers
  if (text.includes("laptop") || text.includes("macbook") || text.includes("computer") || text.includes("notebook") || text.includes("desktop") || text.includes("pc")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="2" y1="20" x2="22" y2="20" />
        <line x1="12" y1="17" x2="12" y2="20" />
      </svg>
    );
  }

  // Monitors / Screens
  if (text.includes("monitor") || text.includes("display") || text.includes("screen") || text.includes("tv")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="12" rx="2" ry="2" />
        <line x1="12" y1="15" x2="12" y2="21" />
        <line x1="8" y1="21" x2="16" y2="21" />
      </svg>
    );
  }

  // Headsets / Headphones / Jabra
  if (text.includes("headset") || text.includes("headphones") || text.includes("audio") || text.includes("earphone") || text.includes("jabra")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    );
  }

  // Keyboards
  if (text.includes("keyboard")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
        <line x1="6" y1="8" x2="6.01" y2="8" />
        <line x1="10" y1="8" x2="10.01" y2="8" />
        <line x1="14" y1="8" x2="14.01" y2="8" />
        <line x1="18" y1="8" x2="18.01" y2="8" />
        <line x1="6" y1="12" x2="6.01" y2="12" />
        <line x1="10" y1="12" x2="10.01" y2="12" />
        <line x1="14" y1="12" x2="14.01" y2="12" />
        <line x1="18" y1="12" x2="18.01" y2="12" />
        <line x1="7" y1="16" x2="17" y2="16" />
      </svg>
    );
  }

  // Mice / Pointers
  if (text.includes("mouse") || text.includes("logitech") || text.includes("trackpad") || text.includes("pointer")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="7" />
        <path d="M12 2v6" />
      </svg>
    );
  }

  // Cables
  if (text.includes("cable") || text.includes("wire") || text.includes("ethernet") || text.includes("cat6") || text.includes("hdmi") || text.includes("usb")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v8M18 12a6 6 0 0 1-6 6M6 12a6 6 0 0 0 6 6M12 18v4" />
        <line x1="8" y1="2" x2="8" y2="5" />
        <line x1="16" y1="2" x2="16" y2="5" />
      </svg>
    );
  }

  // Batteries & Power
  if (text.includes("battery") || text.includes("batteries") || text.includes("powerbank") || text.includes("charger") || text.includes("adapter") || text.includes("power")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="16" height="10" rx="2" ry="2" />
        <line x1="22" y1="11" x2="22" y2="13" />
        <line x1="6" y1="11" x2="10" y2="11" />
        <line x1="8" y1="9" x2="8" y2="13" />
      </svg>
    );
  }

  // Phones & Mobiles
  if (text.includes("phone") || text.includes("mobile") || text.includes("smartphone") || text.includes("telephone")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    );
  }

  // Writing & Paper Stationery / Supplies
  if (text.includes("pen") || text.includes("pencil") || text.includes("ink") || text.includes("stationery") || text.includes("paper") || text.includes("office") || text.includes("consumable")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    );
  }

  // Accessories (Generic)
  if (text.includes("peripheral") || text.includes("accessory") || text.includes("accessories")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    );
  }

  // Default box icon
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
};
