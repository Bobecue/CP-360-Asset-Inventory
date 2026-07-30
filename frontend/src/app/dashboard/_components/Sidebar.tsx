"use client";
import { useState } from "react";
import { RoleBadge, EidBadge } from "@/types/dashboard";

interface SidebarProps {
  activeTab: string;
  isSidebarOpen: boolean;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  currentUser?: any | null;
}

export const Sidebar = ({ activeTab, isSidebarOpen, onTabChange, onLogout, currentUser }: SidebarProps) => {
  const [isCatalogHovered, setIsCatalogHovered] = useState(false);
  const [isOpexHovered, setIsOpexHovered] = useState(false);
  const role = currentUser?.role || 'EMPLOYEE';
  const normalizedRole = (role || "").toUpperCase().replace(/[\s\-]/g, "_");
  const isSuperAdmin = normalizedRole === "SUPER_ADMIN";
  const isOpsAdmin = normalizedRole === "ADMIN" || normalizedRole === "OPS_MANAGER" || normalizedRole === "OPERATIONS_MANAGER";
  const isInventoryStaff = normalizedRole === "INVENTORY_STAFF";
  const isTeamLeader = normalizedRole === "TEAM_LEADER";
  const canAccessSuppliers = isSuperAdmin || isOpsAdmin || isInventoryStaff;

  const name = currentUser?.name || 'User';
  const employeeId = currentUser?.employeeId || 'EID-0000';
  const department = currentUser?.department || 'Operations';

  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const visibleNavGroups = [
    {
      title: "Core",
      visible: true,
      items: [
        { id: "dashboard", label: "Dashboard Overview", visible: isSuperAdmin || isOpsAdmin, icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="11" width="7" height="10" rx="1.5" />
            <rect x="3" y="15" width="7" height="6" rx="1.5" />
          </svg>
        ) },
        { id: "catalog", label: "Asset Catalog", visible: true, icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8L12 3L3 8L12 13L21 8Z" />
            <path d="M21 12L12 17L3 12" />
            <path d="M21 16L12 21L3 16" />
          </svg>
        ) },
      ].filter(item => item.visible)
    },
    {
      title: "Inventory",
      visible: true,
      items: [
        { id: "procurement", label: "Procurement & POs", visible: isSuperAdmin || isOpsAdmin || isInventoryStaff, icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10" />
          </svg>
        ) },
        { id: "alerts", label: "Low-Stock Alerts", visible: isSuperAdmin || isOpsAdmin || isInventoryStaff, icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18C1.5 18.55 1.9 19.25 2.53 19.25H21.47C22.1 19.25 22.5 18.55 22.18 18L13.71 3.86C13.01 2.71 10.99 2.71 10.29 3.86Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <circle cx="12" cy="16.5" r="0.8" fill="currentColor" />
          </svg>
        ) },
        { id: "scan-ops", label: "Scan Operations", visible: isSuperAdmin || isOpsAdmin || isInventoryStaff, icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="3" />
            <path d="M7 8V16M10 8V16M13 8V16M17 8V16" strokeDasharray="1 1" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
        ) },
        { id: "opex", label: "Transaction Tracker", visible: isSuperAdmin || isOpsAdmin || isInventoryStaff || isTeamLeader, icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        ) },
      ].filter(item => item.visible)
    },
    {
      title: "System",
      visible: canAccessSuppliers,
      items: [
        { id: "suppliers", label: "Supplier Module", visible: canAccessSuppliers, icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.29 7 12 12 20.71 7" />
            <line x1="12" y1="22" x2="12" y2="12" />
          </svg>
        ) },
        { id: "users", label: "User Management", visible: isSuperAdmin, icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21V19C22.9986 17.1771 21.765 15.5857 20 15.13" />
            <path d="M16 3.13C17.7699 3.58317 19.0078 5.17799 19.0078 7.005C19.0078 8.83201 17.7699 10.4268 16 10.88" />
          </svg>
        ) },
        { id: "reports", label: "Reports & Logs", visible: isSuperAdmin || isOpsAdmin || isInventoryStaff, icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        ) },
        { id: "management-category", label: "Management Category", visible: isSuperAdmin, icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        ) },
        { id: "settings", label: "System Settings", visible: isSuperAdmin, icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        ) },
      ].filter(item => item.visible)
    }
  ].filter(group => group.visible && group.items.length > 0);

  return (
    <aside 
      className={`sidebar-responsive glitter-sidebar-bg ${isSidebarOpen ? "open" : ""}`}
      style={{
        width: isSidebarOpen ? 260 : 70,
        backgroundColor: "#0B1220",
        color: "#F1F5F9",
        transition: "width 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #1E293B",
        zIndex: 10,
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
    >
      {/* Animated Scan Beam Line for Sidebar Right Edge */}
      <div className="sidebar-scan-beam" />

      {/* Brand Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isSidebarOpen ? "1.5rem 1.25rem" : "1.5rem 0",
        borderBottom: "1px solid #1E293B",
        overflow: "hidden",
        whiteSpace: "nowrap",
        position: "relative",
        zIndex: 1,
        height: 96,
        boxSizing: "border-box"
      }}>
        {isSidebarOpen ? (
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center", 
            width: "100%",
            padding: "0.25rem"
          }}>
            <div className="glitter-logo-container" style={{ 
              height: 44, 
              width: "100%",
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              background: "transparent",
            }}>
              <img
                src="/logo.png"
                alt="Contact Point 360"
                className="glitter-glow-logo"
                style={{
                  height: "38px",
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
              />
            </div>
            <span style={{ 
              fontSize: "0.72rem", 
              color: "#818CF8", 
              fontWeight: 800, 
              letterSpacing: "0.08em", 
              textTransform: "uppercase",
              marginTop: "4px",
              textAlign: "center"
            }}>
              Asset Inventory
            </span>
          </div>
        ) : (
          <div className="glitter-logo-container" style={{
            width: 42,
            height: 42,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: "transparent",
            padding: "2px"
          }}>
            <img
              src="/logo.png"
              alt="CP360 Logo"
              className="glitter-glow-logo"
              style={{
                height: "30px",
                maxWidth: "100%",
                objectFit: "contain",
              }}
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "1.25rem 0.75rem", display: "flex", flexDirection: "column", gap: "1.25rem", overflowY: "auto", position: "relative", zIndex: 1 }}>
        {visibleNavGroups.map((group) => (
          <div key={group.title} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {isSidebarOpen && (
              <span style={{
                fontSize: "0.68rem", fontWeight: 700, color: "#64748B",
                textTransform: "uppercase", letterSpacing: "0.08em",
                padding: "0 0.8rem 0.35rem", display: "block",
              }}>
                {group.title}
              </span>
            )}
            {group.items.map((item) => {
              const isCatalogGroup = item.id === "catalog";
              const normalizedRole = (role || "").toUpperCase().replace(/[\s\-]/g, "_");
              const canAccessDeployments = ["SUPER_ADMIN", "ADMIN", "OPS_MANAGER", "OPERATIONS_MANAGER", "INVENTORY_STAFF"].includes(normalizedRole);
              const isCatalogActive = activeTab === "catalog" || activeTab === "deployments" || activeTab === "requests";
              const isActive = activeTab === item.id || (isCatalogGroup && isCatalogActive);

              if (isCatalogGroup) {
                const showSubMenu = isCatalogHovered || isCatalogActive;
                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setIsCatalogHovered(true)}
                    onMouseLeave={() => setIsCatalogHovered(false)}
                    style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}
                  >
                    <button
                      onClick={() => onTabChange("catalog")}
                      className="interactive-element"
                      style={{
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        padding: "0.65rem 0.85rem", borderRadius: 10, border: "none",
                        backgroundColor: isCatalogActive
                          ? "#1E293B"
                          : "transparent",
                        color: isCatalogActive ? "#818CF8" : "#94A3B8",
                        cursor: "pointer", fontSize: "0.85rem",
                        fontWeight: isCatalogActive ? 600 : 500,
                        textAlign: "left",
                        transition: "all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
                        width: "100%",
                      }}
                      onMouseEnter={(e) => {
                        if (!isCatalogActive) {
                          e.currentTarget.style.backgroundColor = "#1E293B";
                          e.currentTarget.style.color = "#F8FAFC";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCatalogActive) {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#94A3B8";
                        }
                      }}
                    >
                      <span style={{ color: isCatalogActive ? "#818CF8" : "inherit", display: "flex", alignItems: "center" }}>{item.icon}</span>
                      {isSidebarOpen && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                          <span>{item.label}</span>
                          <span style={{ fontSize: "0.65rem", color: isCatalogActive ? "#818CF8" : "#64748B" }}>{showSubMenu ? "▾" : "▸"}</span>
                        </div>
                      )}
                    </button>

                    {/* Sub-menu nested directly below Asset Catalog */}
                    {isSidebarOpen && showSubMenu && (
                      <div style={{
                        display: "flex", flexDirection: "column", gap: "0.2rem",
                        paddingLeft: "1.5rem", marginTop: "0.2rem", marginBottom: "0.25rem",
                        borderLeft: "2px solid #1E293B", marginLeft: "1.25rem"
                      }}>
                        <button
                          onClick={() => onTabChange("catalog")}
                          className="interactive-element"
                          style={{
                            display: "flex", alignItems: "center", gap: "0.5rem",
                            padding: "0.45rem 0.65rem", borderRadius: 8, border: "none",
                            backgroundColor: activeTab === "catalog" ? "#1E293B" : "transparent",
                            color: activeTab === "catalog" ? "#818CF8" : "#94A3B8",
                            cursor: "pointer", fontSize: "0.8rem", fontWeight: activeTab === "catalog" ? 700 : 500,
                            textAlign: "left", transition: "all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)", width: "100%"
                          }}
                          onMouseEnter={(e) => { if (activeTab !== "catalog") { e.currentTarget.style.backgroundColor = "#1E293B"; e.currentTarget.style.color = "#F8FAFC"; } }}
                          onMouseLeave={(e) => { if (activeTab !== "catalog") { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#94A3B8"; } }}
                        >
                          <span>Catalog Inventory</span>
                        </button>

                        {canAccessDeployments && (
                          <button
                            onClick={() => onTabChange("deployments")}
                            className="interactive-element"
                            style={{
                              display: "flex", alignItems: "center", gap: "0.5rem",
                              padding: "0.45rem 0.65rem", borderRadius: 8, border: "none",
                              backgroundColor: activeTab === "deployments" ? "#1E293B" : "transparent",
                              color: activeTab === "deployments" ? "#818CF8" : "#94A3B8",
                              cursor: "pointer", fontSize: "0.8rem", fontWeight: activeTab === "deployments" ? 700 : 500,
                              textAlign: "left", transition: "all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)", width: "100%"
                            }}
                            onMouseEnter={(e) => { if (activeTab !== "deployments") { e.currentTarget.style.backgroundColor = "#1E293B"; e.currentTarget.style.color = "#F8FAFC"; } }}
                            onMouseLeave={(e) => { if (activeTab !== "deployments") { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#94A3B8"; } }}
                          >
                            <span>Asset Deployments</span>
                          </button>
                        )}

                        <button
                          onClick={() => onTabChange("requests")}
                          className="interactive-element"
                          style={{
                            display: "flex", alignItems: "center", gap: "0.5rem",
                            padding: "0.45rem 0.65rem", borderRadius: 8, border: "none",
                            backgroundColor: activeTab === "requests" ? "#1E293B" : "transparent",
                            color: activeTab === "requests" ? "#818CF8" : "#94A3B8",
                            cursor: "pointer", fontSize: "0.8rem", fontWeight: activeTab === "requests" ? 700 : 500,
                            textAlign: "left", transition: "all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)", width: "100%"
                          }}
                          onMouseEnter={(e) => { if (activeTab !== "requests") { e.currentTarget.style.backgroundColor = "#1E293B"; e.currentTarget.style.color = "#F8FAFC"; } }}
                          onMouseLeave={(e) => { if (activeTab !== "requests") { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#94A3B8"; } }}
                        >
                          <span>Asset Transfer</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              const isOpexGroup = item.id === "opex";
              const isOpexActive = activeTab === "opex" || activeTab === "opex-reports";
              const canAccessReports = isSuperAdmin || isOpsAdmin || isInventoryStaff;

              if (isOpexGroup) {
                const showOpexSubMenu = isOpexHovered || isOpexActive;
                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setIsOpexHovered(true)}
                    onMouseLeave={() => setIsOpexHovered(false)}
                    style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}
                  >
                    <button
                      onClick={() => onTabChange("opex")}
                      className="interactive-element"
                      style={{
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        padding: "0.65rem 0.85rem", borderRadius: 10, border: "none",
                        backgroundColor: isOpexActive ? "#1E293B" : "transparent",
                        color: isOpexActive ? "#818CF8" : "#94A3B8",
                        cursor: "pointer", fontSize: "0.85rem",
                        fontWeight: isOpexActive ? 600 : 500,
                        textAlign: "left",
                        transition: "all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
                        width: "100%",
                      }}
                      onMouseEnter={(e) => {
                        if (!isOpexActive) {
                          e.currentTarget.style.backgroundColor = "#1E293B";
                          e.currentTarget.style.color = "#F8FAFC";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isOpexActive) {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#94A3B8";
                        }
                      }}
                    >
                      <span style={{ color: isOpexActive ? "#818CF8" : "inherit", display: "flex", alignItems: "center" }}>{item.icon}</span>
                      {isSidebarOpen && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                          <span>{item.label}</span>
                          <span style={{ fontSize: "0.65rem", color: isOpexActive ? "#818CF8" : "#64748B" }}>{showOpexSubMenu ? "▾" : "▸"}</span>
                        </div>
                      )}
                    </button>

                    {/* Sub-menu nested directly below Transaction Tracker */}
                    {isSidebarOpen && showOpexSubMenu && (
                      <div style={{
                        display: "flex", flexDirection: "column", gap: "0.2rem",
                        paddingLeft: "1.5rem", marginTop: "0.2rem", marginBottom: "0.25rem",
                        borderLeft: "2px solid #1E293B", marginLeft: "1.25rem"
                      }}>
                        <button
                          onClick={() => onTabChange("opex")}
                          className="interactive-element"
                          style={{
                            display: "flex", alignItems: "center", gap: "0.5rem",
                            padding: "0.45rem 0.65rem", borderRadius: 8, border: "none",
                            backgroundColor: activeTab === "opex" ? "#1E293B" : "transparent",
                            color: activeTab === "opex" ? "#818CF8" : "#94A3B8",
                            cursor: "pointer", fontSize: "0.8rem", fontWeight: activeTab === "opex" ? 700 : 500,
                            textAlign: "left", transition: "all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)", width: "100%"
                          }}
                          onMouseEnter={(e) => { if (activeTab !== "opex") { e.currentTarget.style.backgroundColor = "#1E293B"; e.currentTarget.style.color = "#F8FAFC"; } }}
                          onMouseLeave={(e) => { if (activeTab !== "opex") { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#94A3B8"; } }}
                        >
                          <span>Transaction Tracker</span>
                        </button>

                        {canAccessReports && (
                          <button
                            onClick={() => onTabChange("opex-reports")}
                            className="interactive-element"
                            style={{
                              display: "flex", alignItems: "center", gap: "0.5rem",
                              padding: "0.45rem 0.65rem", borderRadius: 8, border: "none",
                              backgroundColor: activeTab === "opex-reports" ? "#1E293B" : "transparent",
                              color: activeTab === "opex-reports" ? "#818CF8" : "#94A3B8",
                              cursor: "pointer", fontSize: "0.8rem", fontWeight: activeTab === "opex-reports" ? 700 : 500,
                              textAlign: "left", transition: "all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)", width: "100%"
                            }}
                            onMouseEnter={(e) => { if (activeTab !== "opex-reports") { e.currentTarget.style.backgroundColor = "#1E293B"; e.currentTarget.style.color = "#F8FAFC"; } }}
                            onMouseLeave={(e) => { if (activeTab !== "opex-reports") { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#94A3B8"; } }}
                          >
                            <span>Executive Rollups & Archives</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className="interactive-element"
                  style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.65rem 0.85rem", borderRadius: 10, border: "none",
                    backgroundColor: isActive ? "#1E293B" : "transparent",
                    color: isActive ? "#818CF8" : "#94A3B8",
                    cursor: "pointer", fontSize: "0.85rem",
                    fontWeight: isActive ? 600 : 500,
                    textAlign: "left",
                    transition: "all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "#1E293B";
                      e.currentTarget.style.color = "#F8FAFC";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#94A3B8";
                    }
                  }}
                >
                  <span style={{ color: isActive ? "#818CF8" : "inherit", display: "flex", alignItems: "center" }}>{item.icon}</span>
                  {isSidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: "1rem", borderTop: "1px solid #1E293B",
        display: "flex", flexDirection: "column", gap: "0.75rem",
        overflow: "hidden", position: "relative", zIndex: 1,
      }}>
        {isSidebarOpen && (
          <div style={{
            display: "flex", alignItems: "center", gap: "0.65rem",
            backgroundColor: "#1E293B", borderRadius: 12, border: "1px solid #334155", padding: "0.75rem",
          }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div 
                className="glitter-glow-avatar"
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  backgroundColor: "#6366F1",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#FFFFFF", fontWeight: 700, fontSize: "0.85rem",
                }}
              >
                {initials}
              </div>
              <span
                style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 8, height: 8, borderRadius: "50%",
                  backgroundColor: "#10B981", border: "1.5px solid #0F172A"
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: "0.2rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#F8FAFC", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 }}>{name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexWrap: "wrap" }}>
                <RoleBadge role={role} size="sm" />
                <EidBadge employeeId={employeeId} size="sm" />
              </div>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          className="interactive-element"
          style={{
            display: "flex", alignItems: "center",
            justifyContent: isSidebarOpen ? "flex-start" : "center",
            gap: "0.65rem", padding: "0.55rem 0.75rem", borderRadius: 8,
            border: "1px solid #334155", backgroundColor: "#1E293B",
            color: "#94A3B8", cursor: "pointer", fontSize: "0.8rem",
            fontWeight: 500, width: "100%", transition: "all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#334155"; e.currentTarget.style.borderColor = "#6366F1"; e.currentTarget.style.color = "#F8FAFC"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#1E293B"; e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.color = "#94A3B8"; }}
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

