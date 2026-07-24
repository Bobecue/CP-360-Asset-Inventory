"use client";

import { User, RoleBadge, SiteBadge, EidBadge, getDepartmentIcon } from "@/types/dashboard";

interface UsersTabProps {
  users: User[];
  isLoadingUsers: boolean;
  isUsingMockData: boolean;
  userSearch: string;
  setUserSearch: (s: string) => void;
  userRoleFilter: string;
  setUserRoleFilter: (s: string) => void;
  filteredUsers: User[];
  onOpenAddModal: () => void;
  onOpenEditModal: (user: User) => void;
  onToggleUserActive: (user: User) => void;
}

export const UsersTab = ({
  users,
  isLoadingUsers,
  isUsingMockData,
  userSearch,
  setUserSearch,
  userRoleFilter,
  setUserRoleFilter,
  filteredUsers,
  onOpenAddModal,
  onOpenEditModal,
  onToggleUserActive,
}: UsersTabProps) => {
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
            <strong>Offline Simulation Mode:</strong> The NestJS backend database connection is unreachable. The application is running using safe client-side data. New users will be created in temporary local storage.
          </div>
        </div>
      )}

      {/* Users Summary Cards */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {[
          {
            title: "Total Users",
            value: users.length,
            desc: "Registered in system",
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" fill="rgba(33, 12, 174, 0.15)" stroke="none" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            )
          },
          {
            title: "Administrative Accounts",
            value: users.filter(u => u.role === "SUPER_ADMIN" || u.role === "ADMIN").length,
            desc: "Full & manager level access",
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(33, 12, 174, 0.15)" />
              </svg>
            )
          },
          {
            title: "Staff & Employees",
            value: users.filter(u => u.role !== "SUPER_ADMIN" && u.role !== "ADMIN").length,
            desc: "Team leaders, staff & employees",
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" fill="rgba(33, 12, 174, 0.15)" stroke="none" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )
          },
        ].map((item, idx) => (
          <div key={idx}
            className="metric-card card-shine-effect"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 12,
              padding: "1rem 1.25rem",
              boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                {item.title}
              </span>
              <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>
                {item.value}
              </span>
              <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                {item.desc}
              </span>
            </div>
            <span style={{ display: "flex", alignItems: "center" }}>{item.icon}</span>
          </div>
        ))}
      </section>

      {/* Filter and Action Bar */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: "1rem 1.25rem",
        boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
      }}>
        <div style={{ display: "flex", flex: 1, flexWrap: "wrap", gap: "0.75rem", minWidth: "280px" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              type="text"
              placeholder="Search users by name, email, employee ID..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="search-glow"
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem 0.5rem 2rem",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: "0.8rem",
                color: "#1e293b",
                outline: "none",
              }}
            />
          </div>

          {/* Role filter */}
          <select
            value={userRoleFilter}
            onChange={(e) => setUserRoleFilter(e.target.value)}
            style={{
              padding: "0.5rem 1.5rem 0.5rem 0.75rem",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: "0.8rem",
              color: "#475569",
              backgroundColor: "#ffffff",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Ops Manager</option>
            <option value="INVENTORY_STAFF">Inventory Staff</option>
            <option value="TEAM_LEADER">Team Leader</option>
            <option value="EMPLOYEE">Employee</option>
          </select>
        </div>

        <button
          onClick={onOpenAddModal}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            background: "linear-gradient(135deg, #210cae 0%, #4dc9e6 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: 8,
            padding: "0.55rem 1.1rem",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(33,12,174,0.15)",
            transition: "transform 0.15s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(33,12,174,0.25)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 6px rgba(33,12,174,0.15)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add User
        </button>
      </div>

      {/* Users Table Card */}
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: 12,
        boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
        padding: "1.5rem",
        overflow: "hidden"
      }}>
        {isLoadingUsers ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 0", gap: "1rem" }}>
            <div style={{
              width: 28, height: 28,
              borderRadius: "50%",
              border: "3px solid #e2e8f0",
              borderTopColor: "#210cae",
              animation: "spin 1s linear infinite",
            }} />
            <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 500 }}>Loading system accounts...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 1rem", textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", marginBottom: "0.75rem" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </div>
            <h4 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#3f3f46", margin: "0 0 0.25rem 0" }}>No Users Found</h4>
            <p style={{ fontSize: "0.78rem", color: "#71717a", maxWidth: 280, margin: 0 }}>
              {users.length === 0 ? "No user accounts registered. Click 'Add User' to register the first system account." : "No accounts match your current search and role filters."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <span>User Profile</span>
                    </div>
                  </th>
                  <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      <span>Role</span>
                    </div>
                  </th>
                  <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>Status</span>
                    </div>
                  </th>
                  <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      <span>Department</span>
                    </div>
                  </th>
                  <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      <span>Assigned Site</span>
                    </div>
                  </th>
                  <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="13" y2="12"/></svg>
                      <span>Employee ID</span>
                    </div>
                  </th>
                  <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600, textAlign: "right" }}>Registered On</th>
                  <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, index) => {
                  // Generate Initials
                  const initials = u.name
                    ? u.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
                    : "US";

                  return (
                    <tr key={u.id} 
                      className="animated-row"
                      style={{ 
                        borderBottom: "1px solid #f8fafc", 
                        animationDelay: `${index * 0.04}s`,
                        opacity: u.isActive === false ? 0.6 : 1,
                      }}
                    >
                      {/* Profile */}
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: u.role === "SUPER_ADMIN" ? "linear-gradient(135deg, #210cae 0%, #4dc9e6 100%)" : "#f1f5f9",
                            color: u.role === "SUPER_ADMIN" ? "#ffffff" : "#475569",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.75rem", fontWeight: 700,
                            border: "1px solid #e2e8f0",
                          }}>
                            {initials}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.82rem" }}>{u.name}</span>
                            <span style={{ color: "#64748b", fontSize: "0.72rem" }}>{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <RoleBadge role={u.role} size="sm" />
                      </td>

                      {/* Status */}
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <span style={{
                            width: 7, height: 7, borderRadius: "50%",
                            backgroundColor: u.isActive !== false ? "#10b981" : "#94a3b8",
                            display: "inline-block",
                          }} />
                          <span style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: u.isActive !== false ? "#065f46" : "#64748b",
                          }}>
                            {u.isActive !== false ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>

                      {/* Department */}
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        {u.department ? (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: "0.35rem",
                            padding: "0.18rem 0.55rem", borderRadius: 9999,
                            fontSize: "0.72rem", fontWeight: 600,
                            backgroundColor: "#f1f5f9", color: "#334155",
                            border: "1px solid #e2e8f0"
                          }}>
                            {getDepartmentIcon(u.department, 12)}
                            <span>{u.department}</span>
                          </span>
                        ) : (
                          <span style={{ color: "#cbd5e1" }}>—</span>
                        )}
                      </td>

                      {/* Assigned Site */}
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <SiteBadge site={u.site} size="sm" />
                      </td>

                      {/* Employee ID */}
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <EidBadge employeeId={u.employeeId} size="sm" />
                      </td>

                      {/* Created Date */}
                      <td style={{ padding: "0.75rem 0.5rem", color: "#94a3b8", textAlign: "right" }}>
                        {new Date(u.createdAt).toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric"
                        })}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.4rem" }}>
                          <button
                            onClick={() => onOpenEditModal(u)}
                            title="Edit User Info"
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

                          {u.email !== "superadmin@contactpoint360.com" ? (
                            <button
                              onClick={() => onToggleUserActive(u)}
                              title={u.isActive !== false ? "Deactivate User" : "Activate User"}
                              style={{
                                background: "none", border: "none", cursor: "pointer",
                                color: u.isActive !== false ? "#dc2626" : "#10b981",
                                padding: "4px", borderRadius: "4px",
                                display: "flex", alignItems: "center"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = u.isActive !== false ? "#fee2e2" : "#d1fae5"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                              {u.isActive !== false ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                              )}
                            </button>
                          ) : (
                            <div style={{ width: 22 }} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
