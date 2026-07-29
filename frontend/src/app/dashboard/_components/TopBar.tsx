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
    case "requests": return "Asset Transfer";
    case "alerts": return "Low-Stock Alerts";
    case "suppliers": return "Supplier Module";
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
    <header style={{
      height: 64,
      backgroundColor: "#FFFFFF",
      borderBottom: "1px solid #E2E8F0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 1.5rem",
      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
      position: "relative",
      zIndex: 20
    }}>
      {/* Animated Scan Beam Line for Top Bar Bottom Edge */}
      <div className="topbar-scan-beam" />
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={onToggleSidebar}
          className="interactive-element"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E2E8F0",
            cursor: "pointer",
            color: "#64748B",
            display: "flex",
            alignItems: "center",
            padding: 8,
            borderRadius: 10,
            transition: "all 0.15s ease",
            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#F8FAFC";
            e.currentTarget.style.borderColor = "#CBD5E1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#FFFFFF";
            e.currentTarget.style.borderColor = "#E2E8F0";
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h2 style={{
          fontSize: "1.15rem",
          fontWeight: 800,
          color: "#0F172A",
          margin: 0,
          letterSpacing: "-0.01em"
        }}>
          {getPageTitle(activeTab)}
        </h2>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Notification Bell */}
        <div style={{ position: "relative" }}>
          <button
            onClick={onToggleNotifications}
            className="interactive-element"
            style={{
              backgroundColor: isNotificationsOpen ? "#F8FAFC" : "#FFFFFF",
              border: "1px solid #E2E8F0",
              cursor: "pointer",
              color: "#64748B",
              display: "flex",
              alignItems: "center",
              padding: 8,
              borderRadius: 10,
              position: "relative",
              transition: "all 0.15s ease",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#F8FAFC";
              e.currentTarget.style.borderColor = "#CBD5E1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isNotificationsOpen ? "#F8FAFC" : "#FFFFFF";
              e.currentTarget.style.borderColor = "#E2E8F0";
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </span>
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: 6, right: 6,
                backgroundColor: "#EF4444",
                borderRadius: "50%", width: 7, height: 7,
                boxShadow: "0 0 0 2px #FFFFFF"
              }} />
            )}
          </button>

          {isNotificationsOpen && (
            <div style={{
              position: "absolute", right: 0, top: 46, width: "320px",
              backgroundColor: "#FFFFFF", borderRadius: "12px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
              border: "1px solid #E2E8F0",
              zIndex: 200, display: "flex", flexDirection: "column", overflow: "hidden"
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.75rem 1rem", borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC"
              }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0F172A" }}>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#6366F1", fontSize: "0.7rem", fontWeight: 600, padding: "2px 4px", borderRadius: "4px" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#EEF2FF")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", color: "#64748B", fontSize: "0.8rem" }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && onMarkRead(n.id)}
                      style={{
                        padding: "0.75rem 1rem",
                        borderBottom: "1px solid #F1F5F9",
                        backgroundColor: n.isRead ? "#FFFFFF" : "#F8FAFC",
                        cursor: n.isRead ? "default" : "pointer",
                        transition: "background-color 0.15s ease",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.2rem"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: n.isRead ? 600 : 700, color: "#0F172A" }}>
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#EF4444" }} />
                        )}
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "#64748B" }}>{n.message}</span>
                      <span style={{ fontSize: "0.68rem", color: "#94A3B8", marginTop: "2px" }}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info Header Section */}
        {currentUser && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.65rem"
          }}>
            <div 
              className="glitter-glow-avatar"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3B82F6 0%, #00C6FF 100%)",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              {(currentUser.name || "SU").substring(0, 2).toUpperCase()}
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0F172A", lineHeight: 1.25 }}>
                {currentUser.name}
              </span>
              <span style={{ fontSize: "0.72rem", color: "#64748B", lineHeight: 1.2 }}>
                {currentUser.department || "IT Department"}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
