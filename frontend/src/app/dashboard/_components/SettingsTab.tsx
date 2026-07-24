import { getCategoryIcon } from "@/types/dashboard";

const getDepartmentIcon = (name: string = "") => {
  const n = name.toLowerCase();
  if (n.includes("recruit") || n.includes("hr") || n.includes("talent") || n.includes("people")) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="8.5" cy="7" r="4"/>
        <line x1="20" y1="8" x2="20" y2="14"/>
        <line x1="17" y1="11" x2="23" y2="11"/>
      </svg>
    );
  }
  if (n.includes("it") || n.includes("tech") || n.includes("system") || n.includes("information")) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    );
  }
  if (n.includes("social") || n.includes("media") || n.includes("marketing") || n.includes("design")) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        <circle cx="18" cy="4" r="3" fill="#ec4899" stroke="none"/>
      </svg>
    );
  }
  if (n.includes("engage") || n.includes("success") || n.includes("client") || n.includes("customer")) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    );
  }
  if (n.includes("finance") || n.includes("account") || n.includes("billing")) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    );
  }
  if (n.includes("logistics") || n.includes("inventory") || n.includes("operation") || n.includes("ops")) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
};

interface SettingsTabProps {
  isUsingMockData: boolean;
  settingsSubTab: "sites" | "departments" | "categories";
  setSettingsSubTab: (tab: "sites" | "departments" | "categories") => void;
  sites: any[];
  departments: any[];
  categories: any[];
  onOpenAddModal: () => void;
  onOpenEditSiteModal: (site: any) => void;
  onOpenEditCategoryModal: (cat: any) => void;
  onDeleteTarget: (type: "site" | "department" | "category", id: string, name: string) => void;
}

export const SettingsTab = ({
  isUsingMockData,
  settingsSubTab,
  setSettingsSubTab,
  sites,
  departments,
  categories,
  onOpenAddModal,
  onOpenEditSiteModal,
  onOpenEditCategoryModal,
  onDeleteTarget,
}: SettingsTabProps) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* Warnings & Notices */}
      {isUsingMockData && (
        <div style={{
          padding: "0.85rem 1.25rem",
          backgroundColor: "#fffbeb",
          borderLeft: "4px solid #f59e0b",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          boxShadow: "0 2px 4px rgba(245,158,11,0.05)",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div style={{ fontSize: "0.82rem", color: "#b45309", fontWeight: 500 }}>
            <strong>Offline Simulation Mode:</strong> The NestJS backend database connection is unreachable. Modifying settings will only affect temporary client-side data.
          </div>
        </div>
      )}

      {/* Settings sub-navigation bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: "0.75rem 1.25rem",
        boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
      }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[
            { id: "sites", label: "Managed Sites" },
            { id: "departments", label: "Departments" },
            { id: "categories", label: "Asset Categories" },
          ].map((tab) => {
            const isActive = settingsSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSettingsSubTab(tab.id as any)}
                className="click-active"
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 8,
                  border: "none",
                  background: isActive ? "linear-gradient(90deg, rgba(33,12,174,0.08) 0%, rgba(77,201,230,0.04) 100%)" : "transparent",
                  color: isActive ? "#210cae" : "#64748b",
                  fontWeight: isActive ? 600 : 500,
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  transition: "all 0.15s ease",
                  boxShadow: isActive ? "inset 0 0 0 1px rgba(33,12,174,0.08)" : "none",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={onOpenAddModal}
          className="click-active card-shine-effect"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "linear-gradient(135deg, #210cae 0%, #4dc9e6 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: 8,
            padding: "0.5rem 1rem",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(33,12,174,0.15)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          {settingsSubTab === "sites" ? "Add Site" : settingsSubTab === "departments" ? "Add Department" : "Add Category"}
        </button>
      </div>

      {/* Content Table Card */}
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: 12,
        boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
        padding: "1.5rem",
        overflow: "hidden"
      }}>
        <div key={settingsSubTab} className="animate-module-flip">
          {settingsSubTab === "sites" && (
          <>
            {sites.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 1rem", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", marginBottom: "0.75rem" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#3f3f46", margin: "0 0 0.25rem 0" }}>No Sites Found</h4>
                <p style={{ fontSize: "0.78rem", color: "#71717a", maxWidth: 280, margin: 0 }}>Create a site to assign users and catalog items to location scope.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Site Name</th>
                      <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Prefix</th>
                      <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Address</th>
                      <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sites.map((s, index) => (
                      <tr key={s.id} 
                        className="animated-row"
                        style={{ borderBottom: "1px solid #f8fafc", animationDelay: `${index * 0.04}s` }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600, color: "#1e293b" }}>{s.name}</td>
                        <td style={{ padding: "0.75rem 0.5rem" }}>
                          <span style={{ fontSize: "0.68rem", backgroundColor: "rgba(33, 12, 174, 0.06)", color: "#210cae", padding: "0.1rem 0.35rem", borderRadius: 4, fontWeight: 700 }}>
                            {s.prefix}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem", color: "#475569" }}>{s.address || <span style={{ color: "#cbd5e1" }}>—</span>}</td>
                        <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.4rem" }}>
                            <button
                              onClick={() => onOpenEditSiteModal(s)}
                              title="Edit Site"
                              style={{
                                background: "none", border: "none", cursor: "pointer",
                                color: "#475569", padding: "4px", borderRadius: "4px",
                                display: "flex", alignItems: "center"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e2e8f0"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            </button>
                            <button
                              onClick={() => onDeleteTarget("site", s.id, s.name)}
                              title="Delete Site"
                              style={{
                                background: "none", border: "none", cursor: "pointer",
                                color: "#dc2626", padding: "4px", borderRadius: "4px",
                                display: "flex", alignItems: "center"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fee2e2"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {settingsSubTab === "departments" && (
          <>
            {departments.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 1rem", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", marginBottom: "0.75rem" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#3f3f46", margin: "0 0 0.25rem 0" }}>No Departments Found</h4>
                <p style={{ fontSize: "0.78rem", color: "#71717a", maxWidth: 280, margin: 0 }}>Create organization departments to organize users.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                          <span>Department Name</span>
                        </div>
                      </th>
                      <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((d, index) => (
                      <tr key={d.id} 
                        className="animated-row"
                        style={{ borderBottom: "1px solid #f8fafc", animationDelay: `${index * 0.04}s` }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td style={{ padding: "0.75rem 0.5rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
                              color: "#3730a3", fontSize: "0.85rem",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              border: "1px solid #a5b4fc", flexShrink: 0,
                              boxShadow: "0 1px 3px rgba(55, 48, 163, 0.1)"
                            }}>
                              {getDepartmentIcon(d.name)}
                            </div>
                            <span style={{ fontWeight: 600, color: "#1e293b" }}>{d.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.4rem" }}>
                            <button
                              onClick={() => onDeleteTarget("department", d.id, d.name)}
                              title="Delete Department"
                              style={{
                                background: "none", border: "none", cursor: "pointer",
                                color: "#dc2626", padding: "4px", borderRadius: "4px",
                                display: "flex", alignItems: "center"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fee2e2"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {settingsSubTab === "categories" && (
          <>
            {categories.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 1rem", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", marginBottom: "0.75rem" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
                </div>
                <h4 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#3f3f46", margin: "0 0 0.25rem 0" }}>No Categories Found</h4>
                <p style={{ fontSize: "0.78rem", color: "#71717a", maxWidth: 280, margin: 0 }}>Create asset categories to catalog hardware, software or office items.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
                          <span>Category Name</span>
                        </div>
                      </th>
                      <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1"/></svg>
                          <span>Prefix</span>
                        </div>
                      </th>
                      <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          <span>Type</span>
                        </div>
                      </th>
                      <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Description</th>
                      <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c, index) => (
                      <tr key={c.id} 
                        className="animated-row"
                        style={{ borderBottom: "1px solid #f8fafc", animationDelay: `${index * 0.04}s` }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td style={{ padding: "0.75rem 0.5rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                              color: "#15803d",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              border: "1px solid #86efac", flexShrink: 0,
                              boxShadow: "0 1px 3px rgba(21, 128, 61, 0.1)"
                            }}>
                              {getCategoryIcon(c.name, c.name, 16)}
                            </div>
                            <span style={{ fontWeight: 600, color: "#1e293b" }}>{c.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: "0.35rem",
                            padding: "0.15rem 0.5rem", borderRadius: 9999,
                            fontSize: "0.68rem", fontWeight: 800,
                            fontFamily: "'JetBrains Mono', monospace",
                            background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
                            color: "#3730a3", border: "1px solid #a5b4fc",
                            boxShadow: "0 1px 2px rgba(55, 48, 163, 0.1)"
                          }}>
                            <span style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: "#4f46e5", color: "#ffffff", fontSize: "0.58rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>#</span>
                            <span>{c.prefix}</span>
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem" }}>
                          <span style={{
                            display: "inline-block",
                            padding: "0.18rem 0.55rem",
                            borderRadius: 9999,
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            letterSpacing: "0.03em",
                            background: c.type === "CONSUMABLE" ? "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)" : "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
                            color: c.type === "CONSUMABLE" ? "#92400e" : "#0369a1",
                            border: c.type === "CONSUMABLE" ? "1px solid #fcd34d" : "1px solid #7dd3fc",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                          }}>
                            {c.type === "CONSUMABLE" ? "Consumable" : "Non-Consumable"}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem", color: "#475569" }}>{c.description || <span style={{ color: "#cbd5e1" }}>—</span>}</td>
                        <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.4rem" }}>
                            <button
                              onClick={() => onOpenEditCategoryModal(c)}
                              title="Edit Category"
                              style={{
                                background: "none", border: "none", cursor: "pointer",
                                color: "#475569", padding: "4px", borderRadius: "4px",
                                display: "flex", alignItems: "center"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e2e8f0"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            </button>
                            <button
                              onClick={() => onDeleteTarget("category", c.id, c.name)}
                              title="Delete Category"
                              style={{
                                background: "none", border: "none", cursor: "pointer",
                                color: "#dc2626", padding: "4px", borderRadius: "4px",
                                display: "flex", alignItems: "center"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fee2e2"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        </div>
      </div>

    </div>
  );
};
