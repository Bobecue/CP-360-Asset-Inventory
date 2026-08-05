"use client";

import { useState, useRef, useEffect } from "react";
import { DbNotification, RoleBadge, EidBadge } from "@/types/dashboard";

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
  onChangePassword?: () => void;
  onLogout?: () => void;
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
  onChangePassword,
  onLogout,
}: TopBarProps) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const role = currentUser?.role || "EMPLOYEE";
  const employeeId = currentUser?.employeeId || "EID-0000";

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

        {/* User Profile Dropdown */}
        {currentUser && (
          <div ref={userMenuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setIsUserMenuOpen(prev => !prev)}
              className="interactive-element"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                backgroundColor: isUserMenuOpen ? "#F8FAFC" : "transparent",
                border: "1px solid",
                borderColor: isUserMenuOpen ? "#CBD5E1" : "transparent",
                borderRadius: 12,
                padding: "5px 10px 5px 5px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#F8FAFC";
                e.currentTarget.style.borderColor = "#CBD5E1";
              }}
              onMouseLeave={(e) => {
                if (!isUserMenuOpen) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                }
              }}
            >
              <div
                className="glitter-glow-avatar"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3B82F6 0%, #00C6FF 100%)",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {(currentUser.name || "SU").substring(0, 2).toUpperCase()}
              </div>
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0, textAlign: "left" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0F172A", lineHeight: 1.25 }}>
                  {currentUser.name}
                </span>
                <span style={{ fontSize: "0.7rem", color: "#64748B", lineHeight: 1.2 }}>
                  {currentUser.department || "IT Department"}
                </span>
              </div>
              {/* Chevron */}
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ transition: "transform 0.2s ease", transform: isUserMenuOpen ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: 230,
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                boxShadow: "0 10px 30px -5px rgba(15, 23, 42, 0.15), 0 4px 6px -2px rgba(15, 23, 42, 0.05)",
                border: "1px solid #E2E8F0",
                zIndex: 300,
                overflow: "hidden",
                animation: "scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                transformOrigin: "top right",
              }}>
                {/* User info header in dropdown */}
                <div style={{
                  padding: "1rem",
                  borderBottom: "1px solid #F1F5F9",
                  backgroundColor: "#F8FAFC",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%",
                      background: "linear-gradient(135deg, #3B82F6 0%, #00C6FF 100%)",
                      color: "#FFFFFF", fontWeight: 800, fontSize: "0.88rem",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {(currentUser.name || "SU").substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0F172A", lineHeight: 1.3 }}>
                        {currentUser.name}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "#64748B", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {currentUser.email}
                      </span>
                    </div>
                  </div>
                  {/* Badges row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                    <RoleBadge role={role} size="sm" />
                    <EidBadge employeeId={employeeId} size="sm" />
                  </div>
                </div>

                {/* Menu actions */}
                <div style={{ padding: "0.5rem" }}>
                  {/* Change Password */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onChangePassword?.();
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.65rem",
                      width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8,
                      border: "none", backgroundColor: "transparent",
                      color: "#374151", cursor: "pointer", fontSize: "0.82rem",
                      fontWeight: 500, textAlign: "left", transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#F1F5F9";
                      e.currentTarget.style.color = "#0F172A";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#374151";
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Change Password
                  </button>

                  <div style={{ height: 1, backgroundColor: "#F1F5F9", margin: "0.35rem 0" }} />

                  {/* Sign Out */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout?.();
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.65rem",
                      width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8,
                      border: "none", backgroundColor: "transparent",
                      color: "#EF4444", cursor: "pointer", fontSize: "0.82rem",
                      fontWeight: 500, textAlign: "left", transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#FEF2F2";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
