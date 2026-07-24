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

  // 8. Headsets / Audio
  if (text.includes("headset") || text.includes("headphone") || text.includes("audio") || text.includes("earphone") || text.includes("jabra") || text.includes("mic")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke="#210cae" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5z" fill="url(#brand-grad-icon)" fillOpacity="0.3" stroke="#210cae" />
        <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z" fill="url(#brand-grad-icon)" fillOpacity="0.3" stroke="#4dc9e6" />
      </svg>
    );
  }

  // 9. Keyboards
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

  // 10. Mice / Pointers
  if (text.includes("mouse") || text.includes("mice") || text.includes("pointer") || text.includes("trackpad") || text.includes("logitech")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="3" width="12" height="18" rx="6" fill="url(#brand-grad-icon)" fillOpacity="0.12" stroke="#210cae" />
        <line x1="12" y1="3" x2="12" y2="9" stroke="#4dc9e6" strokeWidth="2" />
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


