"use client";

import { DbNotification } from "@/types/dashboard";

interface TopBarProps {
  activeTab: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  notifications: DbNotification[];
  isNotificationsOpen: boolean;
  onToggleNotifications: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  currentUser: any | null;
}

const getPageTitle = (activeTab: string) => {
  switch (activeTab) {
    case "dashboard": return "Dashboard Overview";
    case "users": return "User Management";
    case "catalog": return "Asset Catalog";
    case "requests": return "Request Orders";
    case "alerts": return "Low-Stock Alerts";
    case "reports": return "Reports & Logs";
    case "settings": return "System Settings";
    default: return "System Dashboard";
  }
};

export const TopBar = ({
  activeTab,
  isSidebarOpen,
  onToggleSidebar,
  notifications,
  isNotificationsOpen,
  onToggleNotifications,
  onMarkRead,
  onMarkAllRead,
  currentUser,
}: TopBarProps) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="topbar-responsive" style={{
      height: 64,
      backgroundColor: "#ffffff",
      borderBottom: "1px solid #e2e8f0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 1.5rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={onToggleSidebar}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#64748b", display: "flex", alignItems: "center", padding: 4,
            borderRadius: 4,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
          {getPageTitle(activeTab)}
        </h2>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
        {/* Notification Bell */}
        <div style={{ position: "relative" }}>
          <button
            onClick={onToggleNotifications}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#64748b", display: "flex", alignItems: "center", padding: 6,
              borderRadius: 6, position: "relative"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <span
              key={unreadCount > 0 ? "has-unread" : "no-unread"}
              className={unreadCount > 0 ? "animate-bell" : ""}
              style={{ display: "inline-flex", alignItems: "center" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </span>
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: 2, right: 2,
                backgroundColor: "#ef4444", color: "#ffffff",
                fontSize: "0.6rem", fontWeight: 700,
                borderRadius: "50%", width: 15, height: 15,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div style={{
              position: "absolute", right: 0, top: 38, width: "320px",
              backgroundColor: "#ffffff", borderRadius: "12px",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05), 0 0 0 1px rgba(226,232,240,0.8)",
              zIndex: 200, display: "flex", flexDirection: "column", overflow: "hidden"
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.75rem 1rem", borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc"
              }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0f172a" }}>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#210cae", fontSize: "0.7rem", fontWeight: 600, padding: "2px 4px", borderRadius: "4px" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e8e6f8")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "2rem 1rem", textAlign: "center", color: "#94a3b8", fontSize: "0.76rem" }}>
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => onMarkRead(n.id)}
                      style={{
                        padding: "0.75rem 1rem", borderBottom: "1px solid #f8fafc",
                        cursor: "pointer", backgroundColor: n.isRead ? "transparent" : "rgba(33, 12, 174, 0.02)",
                        display: "flex", flexDirection: "column", gap: "0.15rem", transition: "background-color 0.15s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fafafa"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = n.isRead ? "transparent" : "rgba(33, 12, 174, 0.02)"}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: n.isRead ? 600 : 700, color: n.isRead ? "#475569" : "#0f172a" }}>
                          {n.title}
                        </span>
                        {!n.isRead && <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#210cae", flexShrink: 0, marginTop: 5 }} />}
                      </div>
                      {(() => {
                        const isLowStock = n.title?.toLowerCase().includes("low stock");
                        if (isLowStock) {
                          const match = n.message.match(/at\s+["“]?([^"”\.]+?)["”]?\s+(has|dropped|is)/i) || 
                                        n.message.match(/at\s+["“]?([^"”\.]+?)["”]?$/i) ||
                                        n.message.match(/site\s+["“]?([^"”\.]+?)["”]?/i);
                          const siteName = match ? match[1].trim() : null;

                          if (siteName) {
                            const escapedSite = siteName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            const regex = new RegExp(`(at\\s+["“]?${escapedSite}["”]?|${escapedSite})`, 'i');
                            const parts = n.message.split(regex);

                            return (
                              <span style={{ fontSize: "0.72rem", color: "#64748b", lineHeight: 1.45 }}>
                                {parts.map((part, idx) => {
                                  if (part.toLowerCase() === siteName.toLowerCase() || part.toLowerCase() === `at "${siteName.toLowerCase()}"` || part.toLowerCase() === `at ${siteName.toLowerCase()}`) {
                                    return (
                                      <span key={idx} style={{
                                        fontSize: "0.68rem",
                                        fontWeight: 800,
                                        padding: "0.1rem 0.45rem",
                                        borderRadius: "4px",
                                        backgroundColor: "#eef2ff",
                                        color: "#210cae",
                                        border: "1px solid #c7d2fe",
                                        margin: "0 0.15rem",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.2rem"
                                      }}>
                                        📍 {siteName}
                                      </span>
                                    );
                                  }
                                  return <span key={idx}>{part}</span>;
                                })}
                              </span>
                            );
                          }
                        }
                        return <span style={{ fontSize: "0.72rem", color: "#64748b", lineHeight: 1.3 }}>{n.message}</span>;
                      })()}
                      <span style={{ fontSize: "0.62rem", color: "#cbd5e1", marginTop: "0.1rem" }}>
                        {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderLeft: "1px solid #e2e8f0", paddingLeft: "1rem" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #210cae 0%, #4dc9e6 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#ffffff", fontWeight: 700, fontSize: "0.8rem",
            boxShadow: "0 2px 4px rgba(33, 12, 174, 0.15)"
          }}>
            SA
          </div>
          <div className="hide-on-mobile" style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1e293b", lineHeight: 1.1 }}>
              {currentUser?.name || "Super Admin"}
            </span>
            <span style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 500 }}>
              {currentUser?.role === "SUPER_ADMIN" ? "System Manager" : "Site Administrator"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
