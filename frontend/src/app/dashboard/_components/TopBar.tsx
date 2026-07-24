"use client";

import { DbNotification, RoleBadge, SiteBadge, EidBadge } from "@/types/dashboard";

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
    <header className="topbar-responsive moving-shine-overlay topbar-brand-bg" style={{
      height: 64,
      borderBottom: "1px solid #e2e8f0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 1.5rem",
      boxShadow: "0 2px 10px rgba(33, 12, 174, 0.03)",
      position: "relative",
      zIndex: 20
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={onToggleSidebar}
          style={{
            background: "linear-gradient(135deg, rgba(77,201,230,0.08) 0%, rgba(33,12,174,0.05) 100%)",
            border: "1px solid rgba(77, 201, 230, 0.2)",
            cursor: "pointer",
            color: "#210cae",
            display: "flex",
            alignItems: "center",
            padding: 6,
            borderRadius: 8,
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#eef2ff";
            e.currentTarget.style.borderColor = "rgba(77, 201, 230, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "rgba(77, 201, 230, 0.2)";
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" stroke="#210cae" /><line x1="3" y1="6" x2="21" y2="6" stroke="#4dc9e6" /><line x1="3" y1="18" x2="21" y2="18" stroke="#4dc9e6" />
          </svg>
        </button>
        <h2 style={{
          fontSize: "1.15rem",
          fontWeight: 800,
          background: "linear-gradient(135deg, #0f172a 0%, #210cae 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          margin: 0,
          letterSpacing: "-0.01em"
        }}>
          {getPageTitle(activeTab)}
        </h2>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
        {/* Notification Bell */}
        <div style={{ position: "relative" }}>
          <button
            onClick={onToggleNotifications}
            style={{
              background: isNotificationsOpen ? "rgba(33, 12, 174, 0.08)" : "transparent",
              border: "1px solid rgba(77, 201, 230, 0.2)",
              cursor: "pointer",
              color: "#210cae", display: "flex", alignItems: "center", padding: 7,
              borderRadius: 8, position: "relative",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#eef2ff")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isNotificationsOpen ? "rgba(33, 12, 174, 0.08)" : "transparent")}
          >
            <span
              key={unreadCount > 0 ? "has-unread" : "no-unread"}
              className={unreadCount > 0 ? "animate-bell" : ""}
              style={{ display: "inline-flex", alignItems: "center" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#210cae"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#4dc9e6"/>
              </svg>
            </span>
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: -2, right: -2,
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                color: "#ffffff",
                fontSize: "0.62rem", fontWeight: 800,
                borderRadius: "50%", width: 17, height: 17,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 6px rgba(239, 68, 68, 0.4), 0 0 0 2px #ffffff"
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div style={{
              position: "absolute", right: 0, top: 44, width: "320px",
              backgroundColor: "#ffffff", borderRadius: "12px",
              boxShadow: "0 12px 30px -4px rgba(33, 12, 174, 0.15), 0 0 0 1px rgba(77, 201, 230, 0.3)",
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
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                          <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        <span>{siteName}</span>
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", borderLeft: "1px solid #e2e8f0", paddingLeft: "1rem" }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "linear-gradient(135deg, #210cae 0%, #4dc9e6 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#ffffff", fontWeight: 700, fontSize: "0.82rem",
            boxShadow: "0 2px 6px rgba(33, 12, 174, 0.2)"
          }}>
            {(currentUser?.name || "SA").split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
          </div>
          <div className="hide-on-mobile" style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", lineHeight: 1.1 }}>
                {currentUser?.name || "Super Admin"}
              </span>
              {currentUser?.employeeId && (
                <EidBadge employeeId={currentUser.employeeId} size="sm" />
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <RoleBadge role={currentUser?.role || "SUPER_ADMIN"} size="sm" />
              {currentUser?.site && (
                <SiteBadge site={currentUser.site} size="sm" />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
