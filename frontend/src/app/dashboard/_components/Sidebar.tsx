"use client";
import { useState } from "react";

interface SidebarProps {
  activeTab: string;
  isSidebarOpen: boolean;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  currentUser?: any | null;
}

export const Sidebar = ({ activeTab, isSidebarOpen, onTabChange, onLogout, currentUser }: SidebarProps) => {
  const [isCatalogHovered, setIsCatalogHovered] = useState(false);
  const role = currentUser?.role || 'EMPLOYEE';
  const name = currentUser?.name || 'User';
  const employeeId = currentUser?.employeeId || 'EID-0000';
  const department = currentUser?.department || 'Operations';

  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const getRoleLabel = (r?: string) => {
    switch (r) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'ADMIN': return 'Ops Manager';
      case 'INVENTORY_STAFF': return 'Inventory Staff';
      case 'TEAM_LEADER': return 'Team Leader';
      case 'EMPLOYEE': return 'Employee';
      default: return 'User';
    }
  };

  const visibleNavGroups = [
    {
      title: "Core",
      visible: true,
      items: [
        { id: "dashboard", label: "Dashboard Overview", visible: role === "SUPER_ADMIN" || role === "ADMIN", icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1.5" fill="rgba(33, 12, 174, 0.15)" stroke="none" />
            <rect x="14" y="3" width="7" height="5" rx="1" fill="none" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" fill="none" />
            <rect x="3" y="16" width="7" height="5" rx="1" fill="none" />
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
          </svg>
        ) },
        { id: "catalog", label: "Asset Catalog", visible: true, icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 20.73 7 12 12 3.27 7" fill="rgba(33, 12, 174, 0.15)" stroke="none" />
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        ) },
      ].filter(item => item.visible)
    },
    {
      title: "Inventory",
      visible: true,
      items: [
        { id: "requests", label: "Request Orders", visible: true, icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" fill="rgba(33, 12, 174, 0.15)" stroke="currentColor" strokeWidth="0" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        ) },
        { id: "procurement", label: "Procurement & POs", visible: role === "SUPER_ADMIN" || role === "ADMIN" || role === "INVENTORY_STAFF", icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" fill="rgba(33, 12, 174, 0.15)" />
          </svg>
        ) },
        { id: "alerts", label: "Low-Stock Alerts", visible: role === "SUPER_ADMIN" || role === "ADMIN" || role === "INVENTORY_STAFF" || role === "TEAM_LEADER", icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="rgba(239, 68, 68, 0.1)" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        ) },
        { id: "scan-ops", label: "Scan Operations", visible: role === "SUPER_ADMIN" || role === "ADMIN" || role === "INVENTORY_STAFF", icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" fill="rgba(33, 12, 174, 0.15)" />
          </svg>
        ) },
      ].filter(item => item.visible)
    },
    {
      title: "System",
      visible: role === "SUPER_ADMIN" || role === "ADMIN" || role === "INVENTORY_STAFF",
      items: [
        { id: "users", label: "User Management", visible: role === "SUPER_ADMIN", icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" fill="rgba(33, 12, 174, 0.15)" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ) },
        { id: "reports", label: "Reports & Logs", visible: role === "SUPER_ADMIN" || role === "ADMIN" || role === "INVENTORY_STAFF", icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
            <rect x="4" y="14" width="4" height="6" fill="rgba(33, 12, 174, 0.15)" stroke="none" />
            <rect x="10" y="4" width="4" height="16" fill="rgba(33, 12, 174, 0.15)" stroke="none" />
            <rect x="16" y="10" width="4" height="10" fill="rgba(33, 12, 174, 0.15)" stroke="none" />
          </svg>
        ) },
        { id: "settings", label: "System Settings", visible: role === "SUPER_ADMIN", icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" fill="rgba(33, 12, 174, 0.15)" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        ) },
      ].filter(item => item.visible)
    }
  ].filter(group => group.visible && group.items.length > 0);

  return (
    <aside 
      className={`sidebar-responsive ${isSidebarOpen ? "open" : ""}`}
      style={{
        width: isSidebarOpen ? 260 : 70,
        backgroundColor: "#ffffff",
        color: "#1e293b",
        transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #e2e8f0",
        zIndex: 10,
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
    >
      {/* Ambient glow */}
      <div aria-hidden style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 120,
        background: "radial-gradient(circle at 20% 20%, rgba(77,201,230,0.06) 0%, transparent 65%)",
        pointerEvents: "none", zIndex: 0
      }} />

      {/* Brand Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isSidebarOpen ? "1.5rem 1.25rem" : "1.5rem 0",
        borderBottom: "1px solid #e2e8f0",
        overflow: "hidden",
        whiteSpace: "nowrap",
        position: "relative",
        zIndex: 1,
        height: 80,
        boxSizing: "border-box"
      }}>
        {isSidebarOpen ? (
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center", 
            width: "100%" 
          }}>
            <div style={{ 
              height: 38, 
              overflow: "hidden", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center" 
            }}>
              <img
                src="/logo.png"
                alt="Contact Point 360"
                style={{
                  height: "90px",
                  width: "auto",
                  objectFit: "contain",
                  mixBlendMode: "multiply"
                }}
              />
            </div>
            <span style={{ 
              fontSize: "0.72rem", 
              color: "#210cae", 
              fontWeight: 700, 
              letterSpacing: "0.08em", 
              textTransform: "uppercase",
              marginTop: "-4px",
              textAlign: "center"
            }}>
              Asset Inventory
            </span>
          </div>
        ) : (
          <div style={{
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
            position: "relative"
          }}>
            <img
              src="/logo.png"
              alt="CP360 Logo"
              style={{
                height: "64px",
                width: "auto",
                objectFit: "contain",
                position: "absolute",
                left: "-3px",
                top: "-16px",
                mixBlendMode: "multiply"
              }}
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "1.25rem 0.75rem", display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto", position: "relative", zIndex: 1 }}>
        {visibleNavGroups.map((group) => (
          <div key={group.title} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {isSidebarOpen && (
              <span style={{
                fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8",
                textTransform: "uppercase", letterSpacing: "0.08em",
                padding: "0 0.8rem 0.25rem", display: "block",
              }}>
                {group.title}
              </span>
            )}
            {group.items.map((item) => {
              const isCatalogGroup = item.id === "catalog";
              const canAccessDeployments = role === "SUPER_ADMIN" || role === "ADMIN" || role === "INVENTORY_STAFF";
              const isActive = activeTab === item.id || (isCatalogGroup && activeTab === "deployments");

              if (isCatalogGroup) {
                const showSubMenu = isCatalogHovered || activeTab === "catalog" || activeTab === "deployments";
                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setIsCatalogHovered(true)}
                    onMouseLeave={() => setIsCatalogHovered(false)}
                    style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}
                  >
                    <button
                      onClick={() => onTabChange("catalog")}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        padding: "0.6rem 0.8rem", borderRadius: 8, border: "none",
                        background: (activeTab === "catalog" || activeTab === "deployments")
                          ? "linear-gradient(90deg, rgba(33,12,174,0.08) 0%, rgba(77,201,230,0.04) 100%)"
                          : "transparent",
                        color: (activeTab === "catalog" || activeTab === "deployments") ? "#210cae" : "#475569",
                        cursor: "pointer", fontSize: "0.84rem",
                        fontWeight: (activeTab === "catalog" || activeTab === "deployments") ? 600 : 500,
                        textAlign: "left",
                        transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                        width: "100%",
                        borderLeft: (activeTab === "catalog" || activeTab === "deployments") ? "3px solid #210cae" : "3px solid transparent",
                        paddingLeft: (activeTab === "catalog" || activeTab === "deployments") ? "calc(0.8rem - 3px)" : "0.8rem",
                        boxShadow: (activeTab === "catalog" || activeTab === "deployments")
                          ? "inset 0 0 0 1px rgba(33,12,174,0.08), 2px 0 16px rgba(33,12,174,0.06)"
                          : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (activeTab !== "catalog" && activeTab !== "deployments") {
                          e.currentTarget.style.background = "#f1f5f9";
                          e.currentTarget.style.color = "#0f172a";
                          e.currentTarget.style.transform = "translateX(2px)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== "catalog" && activeTab !== "deployments") {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#475569";
                          e.currentTarget.style.transform = "translateX(0)";
                        }
                      }}
                    >
                      <span style={{ color: (activeTab === "catalog" || activeTab === "deployments") ? "#210cae" : "inherit", display: "flex", alignItems: "center" }}>{item.icon}</span>
                      {isSidebarOpen && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                          <span>{item.label}</span>
                          <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>{showSubMenu ? "▾" : "▸"}</span>
                        </div>
                      )}
                    </button>

                    {/* Sub-menu nested directly below Asset Catalog */}
                    {isSidebarOpen && canAccessDeployments && showSubMenu && (
                      <div style={{
                        display: "flex", flexDirection: "column", gap: "0.2rem",
                        paddingLeft: "1.75rem", marginTop: "0.15rem", marginBottom: "0.25rem",
                        borderLeft: "2px solid #e2e8f0", marginLeft: "1.25rem"
                      }}>
                        <button
                          onClick={() => onTabChange("catalog")}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.45rem",
                            padding: "0.4rem 0.6rem", borderRadius: 6, border: "none",
                            backgroundColor: activeTab === "catalog" ? "#eef2ff" : "transparent",
                            color: activeTab === "catalog" ? "#210cae" : "#64748b",
                            cursor: "pointer", fontSize: "0.78rem", fontWeight: activeTab === "catalog" ? 700 : 500,
                            textAlign: "left", transition: "all 0.15s ease", width: "100%"
                          }}
                          onMouseEnter={(e) => { if (activeTab !== "catalog") e.currentTarget.style.backgroundColor = "#f1f5f9"; }}
                          onMouseLeave={(e) => { if (activeTab !== "catalog") e.currentTarget.style.backgroundColor = "transparent"; }}
                        >
                          <span>📦 Catalog Inventory</span>
                        </button>

                        <button
                          onClick={() => onTabChange("deployments")}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.45rem",
                            padding: "0.4rem 0.6rem", borderRadius: 6, border: "none",
                            backgroundColor: activeTab === "deployments" ? "#eef2ff" : "transparent",
                            color: activeTab === "deployments" ? "#210cae" : "#64748b",
                            cursor: "pointer", fontSize: "0.78rem", fontWeight: activeTab === "deployments" ? 700 : 500,
                            textAlign: "left", transition: "all 0.15s ease", width: "100%"
                          }}
                          onMouseEnter={(e) => { if (activeTab !== "deployments") e.currentTarget.style.backgroundColor = "#f1f5f9"; }}
                          onMouseLeave={(e) => { if (activeTab !== "deployments") e.currentTarget.style.backgroundColor = "transparent"; }}
                        >
                          <span>🚀 Asset Deployments</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.6rem 0.8rem", borderRadius: 8, border: "none",
                    background: isActive
                      ? "linear-gradient(90deg, rgba(33,12,174,0.08) 0%, rgba(77,201,230,0.04) 100%)"
                      : "transparent",
                    color: isActive ? "#210cae" : "#475569",
                    cursor: "pointer", fontSize: "0.84rem",
                    fontWeight: isActive ? 600 : 500,
                    textAlign: "left",
                    transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                    width: "100%",
                    borderLeft: isActive ? "3px solid #210cae" : "3px solid transparent",
                    paddingLeft: isActive ? "calc(0.8rem - 3px)" : "0.8rem",
                    boxShadow: isActive
                      ? "inset 0 0 0 1px rgba(33,12,174,0.08), 2px 0 16px rgba(33,12,174,0.06)"
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "#f1f5f9";
                      e.currentTarget.style.color = "#0f172a";
                      e.currentTarget.style.transform = "translateX(2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#475569";
                      e.currentTarget.style.transform = "translateX(0)";
                    }
                  }}
                >
                  <span style={{ color: isActive ? "#210cae" : "inherit", display: "flex", alignItems: "center" }}>{item.icon}</span>
                  {isSidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: "1rem", borderTop: "1px solid #e2e8f0",
        display: "flex", flexDirection: "column", gap: "0.75rem",
        overflow: "hidden", position: "relative", zIndex: 1,
      }}>
        {isSidebarOpen && (
          <div style={{
            display: "flex", alignItems: "center", gap: "0.65rem",
            background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", padding: "0.75rem",
          }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg, #4dc9e6 0%, #210cae 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#ffffff", fontWeight: 700, fontSize: "0.85rem",
                boxShadow: "0 2px 8px rgba(33,12,174,0.12)", border: "1px solid rgba(255, 255, 255, 0.1)",
              }}>
                {initials}
              </div>
              <span
                className="online-dot-pulse"
                style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 8, height: 8, borderRadius: "50%",
                  backgroundColor: "#10b981", border: "1.5px solid #ffffff"
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 }}>{name}</span>
              <span style={{ fontSize: "0.68rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{employeeId} • {getRoleLabel(role)}</span>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          style={{
            display: "flex", alignItems: "center",
            justifyContent: isSidebarOpen ? "flex-start" : "center",
            gap: "0.65rem", padding: "0.55rem 0.75rem", borderRadius: 8,
            border: "1px solid #fecaca", background: "transparent",
            color: "#dc2626", cursor: "pointer", fontSize: "0.8rem",
            fontWeight: 500, width: "100%", transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#fff5f5"; e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.color = "#b91c1c"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#fecaca"; e.currentTarget.style.color = "#dc2626"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {isSidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
