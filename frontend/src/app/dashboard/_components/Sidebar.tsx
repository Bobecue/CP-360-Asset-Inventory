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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="2" fill="url(#brand-grad-1)" fillOpacity="0.25" stroke="#210cae" strokeWidth="1.8" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" stroke="#4dc9e6" strokeWidth="1.8" />
            <rect x="14" y="11" width="7" height="10" rx="2" fill="url(#brand-grad-1)" fillOpacity="0.15" stroke="#210cae" strokeWidth="1.8" />
            <rect x="3" y="15" width="7" height="6" rx="1.5" stroke="#4dc9e6" strokeWidth="1.8" />
            <defs>
              <linearGradient id="brand-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4dc9e6" />
                <stop offset="100%" stopColor="#210cae" />
              </linearGradient>
            </defs>
          </svg>
        ) },
        { id: "catalog", label: "Asset Catalog", visible: true, icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8L12 3L3 8L12 13L21 8Z" fill="url(#brand-grad-2)" fillOpacity="0.25" stroke="#210cae" strokeWidth="1.8" />
            <path d="M21 12L12 17L3 12" stroke="#4dc9e6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 16L12 21L3 16" stroke="#210cae" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="brand-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4dc9e6" />
                <stop offset="100%" stopColor="#210cae" />
              </linearGradient>
            </defs>
          </svg>
        ) },
      ].filter(item => item.visible)
    },
    {
      title: "Inventory",
      visible: true,
      items: [
        { id: "requests", label: "Request Orders", visible: true, icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="url(#brand-grad-3)" fillOpacity="0.12" stroke="#210cae" />
            <polyline points="14 2 14 8 20 8" fill="rgba(77, 201, 230, 0.2)" stroke="#4dc9e6" />
            <line x1="16" y1="13" x2="8" y2="13" stroke="#210cae" />
            <line x1="16" y1="17" x2="8" y2="17" stroke="#4dc9e6" />
            <circle cx="9" cy="9" r="1" fill="#210cae" stroke="none" />
            <defs>
              <linearGradient id="brand-grad-3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4dc9e6" />
                <stop offset="100%" stopColor="#210cae" />
              </linearGradient>
            </defs>
          </svg>
        ) },
        { id: "procurement", label: "Procurement & POs", visible: role === "SUPER_ADMIN" || role === "ADMIN" || role === "INVENTORY_STAFF", icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z" stroke="#210cae" fill="url(#brand-grad-4)" fillOpacity="0.12" />
            <line x1="3" y1="6" x2="21" y2="6" stroke="#4dc9e6" />
            <path d="M16 10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10" stroke="#210cae" strokeWidth="2" />
            <defs>
              <linearGradient id="brand-grad-4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4dc9e6" />
                <stop offset="100%" stopColor="#210cae" />
              </linearGradient>
            </defs>
          </svg>
        ) },
        { id: "alerts", label: "Low-Stock Alerts", visible: role === "SUPER_ADMIN" || role === "ADMIN" || role === "INVENTORY_STAFF", icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18C1.5 18.55 1.9 19.25 2.53 19.25H21.47C22.1 19.25 22.5 18.55 22.18 18L13.71 3.86C13.01 2.71 10.99 2.71 10.29 3.86Z" fill="rgba(239, 68, 68, 0.12)" stroke="#ef4444" strokeWidth="1.8" />
            <line x1="12" y1="9" x2="12" y2="13" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16.5" r="1" fill="#ef4444" stroke="none" />
          </svg>
        ) },
        { id: "scan-ops", label: "Scan Operations", visible: role === "SUPER_ADMIN" || role === "ADMIN" || role === "INVENTORY_STAFF", icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="3" stroke="#210cae" fill="url(#brand-grad-5)" fillOpacity="0.1" />
            <path d="M7 8V16M10 8V16M13 8V16M17 8V16" stroke="#210cae" strokeWidth="1.6" strokeDasharray="1 1" />
            <line x1="2" y1="12" x2="22" y2="12" stroke="#4dc9e6" strokeWidth="2" />
            <defs>
              <linearGradient id="brand-grad-5" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4dc9e6" />
                <stop offset="100%" stopColor="#210cae" />
              </linearGradient>
            </defs>
          </svg>
        ) },
      ].filter(item => item.visible)
    },
    {
      title: "System",
      visible: role === "SUPER_ADMIN" || role === "ADMIN" || role === "INVENTORY_STAFF",
      items: [
        { id: "suppliers", label: "Supplier Module", visible: role === "SUPER_ADMIN" || role === "ADMIN" || role === "INVENTORY_STAFF", icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill="url(#brand-grad-sup)" fillOpacity="0.16" stroke="#210cae" strokeWidth="1.8" />
            <polyline points="3.29 7 12 12 20.71 7" stroke="#4dc9e6" strokeWidth="1.8" />
            <line x1="12" y1="22" x2="12" y2="12" stroke="#210cae" strokeWidth="1.8" />
            <circle cx="12" cy="12" r="2.5" fill="#4dc9e6" stroke="#210cae" strokeWidth="1.2" />
            <defs>
              <linearGradient id="brand-grad-sup" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4dc9e6" />
                <stop offset="100%" stopColor="#210cae" />
              </linearGradient>
            </defs>
          </svg>
        ) },
        { id: "users", label: "User Management", visible: role === "SUPER_ADMIN", icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21" stroke="#210cae" />
            <circle cx="9" cy="7" r="4" fill="url(#brand-grad-6)" fillOpacity="0.25" stroke="#210cae" strokeWidth="1.8" />
            <path d="M23 21V19C22.9986 17.1771 21.765 15.5857 20 15.13" stroke="#4dc9e6" />
            <path d="M16 3.13C17.7699 3.58317 19.0078 5.17799 19.0078 7.005C19.0078 8.83201 17.7699 10.4268 16 10.88" stroke="#4dc9e6" />
            <defs>
              <linearGradient id="brand-grad-6" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4dc9e6" />
                <stop offset="100%" stopColor="#210cae" />
              </linearGradient>
            </defs>
          </svg>
        ) },
        { id: "reports", label: "Reports & Logs", visible: role === "SUPER_ADMIN" || role === "ADMIN" || role === "INVENTORY_STAFF", icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 20V10" stroke="#4dc9e6" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 20V4" stroke="#210cae" strokeWidth="2" strokeLinecap="round" />
            <path d="M6 20V14" stroke="#4dc9e6" strokeWidth="2" strokeLinecap="round" />
            <rect x="4" y="14" width="4" height="6" rx="1" fill="#4dc9e6" fillOpacity="0.3" stroke="none" />
            <rect x="10" y="4" width="4" height="16" rx="1" fill="#210cae" fillOpacity="0.3" stroke="none" />
            <rect x="16" y="10" width="4" height="10" rx="1" fill="#4dc9e6" fillOpacity="0.3" stroke="none" />
          </svg>
        ) },
        { id: "settings", label: "System Settings", visible: role === "SUPER_ADMIN", icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" fill="url(#brand-grad-7)" fillOpacity="0.3" stroke="#210cae" strokeWidth="2" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="#210cae" strokeWidth="1.8" />
            <defs>
              <linearGradient id="brand-grad-7" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4dc9e6" />
                <stop offset="100%" stopColor="#210cae" />
              </linearGradient>
            </defs>
          </svg>
        ) },
      ].filter(item => item.visible)
    }
  ].filter(group => group.visible && group.items.length > 0);

  return (
    <aside 
      className={`sidebar-responsive sidebar-brand-bg ${isSidebarOpen ? "open" : ""}`}
      style={{
        width: isSidebarOpen ? 260 : 70,
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
      {/* Ambient moving glow with soft Red, Indigo, & Sky Blue */}
      <div aria-hidden style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 220,
        background: "radial-gradient(circle at 40% 15%, rgba(225,29,72,0.06) 0%, rgba(77,201,230,0.12) 50%, rgba(33,12,174,0.05) 80%, transparent 100%)",
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
            padding: "0.2rem 0.25rem"
          }}>
            <div style={{ 
              height: 54, 
              width: "100%",
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              background: "transparent",
              overflow: "hidden"
            }}>
              <img
                src="/logo.png"
                alt="Contact Point 360"
                style={{
                  height: "76px",
                  width: "auto",
                  objectFit: "contain",
                  mixBlendMode: "darken",
                  transform: "scale(1.75)",
                  filter: "contrast(1.25) brightness(0.92)"
                }}
              />
            </div>
            <span style={{ 
              fontSize: "0.72rem", 
              color: "#210cae", 
              fontWeight: 800, 
              letterSpacing: "0.08em", 
              textTransform: "uppercase",
              marginTop: "6px",
              textAlign: "center"
            }}>
              Asset Inventory
            </span>
          </div>
        ) : (
          <div style={{
            width: 38,
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: "rgba(255, 255, 255, 0.85)",
            borderRadius: "10px",
            border: "1px solid rgba(77, 201, 230, 0.3)",
            boxShadow: "0 2px 6px rgba(33, 12, 174, 0.08)",
            padding: "3px"
          }}>
            <img
              src="/logo.png"
              alt="CP360 Logo"
              style={{
                height: "26px",
                width: "auto",
                objectFit: "contain",
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
              const normalizedRole = (role || "").toUpperCase().replace(/[\s\-]/g, "_");
              const canAccessDeployments = ["SUPER_ADMIN", "ADMIN", "OPS_MANAGER", "OPERATIONS_MANAGER", "INVENTORY_STAFF"].includes(normalizedRole);
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
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                            <line x1="12" y1="22.08" x2="12" y2="12"/>
                          </svg>
                          <span>Catalog Inventory</span>
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
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                            <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-3.05 11a22.35 22.35 0 0 1-3.95 2z"/>
                            <path d="M9 12l-2 2"/>
                            <path d="M15 9l-2 2"/>
                          </svg>
                          <span>Asset Deployments</span>
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
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, gap: "0.2rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 }}>{name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexWrap: "wrap" }}>
                <RoleBadge role={role} size="sm" />
                <EidBadge employeeId={employeeId} size="sm" />
              </div>
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
