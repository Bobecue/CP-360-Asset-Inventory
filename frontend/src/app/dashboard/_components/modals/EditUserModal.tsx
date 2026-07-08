"use client";

import { User } from "@/types/dashboard";

interface EditUserModalProps {
  isEditModalOpen: boolean;
  editingUser: User | null;
  editFormName: string;
  setEditFormName: (v: string) => void;
  editFormEmail: string;
  setEditFormEmail: (v: string) => void;
  editFormRole: string;
  setEditFormRole: (v: string) => void;
  editFormEmployeeId: string;
  setEditFormEmployeeId: (v: string) => void;
  editFormDepartment: string;
  setEditFormDepartment: (v: string) => void;
  editFormSiteId: string;
  setEditFormSiteId: (v: string) => void;
  editFormIsActive: boolean;
  setEditFormIsActive: (v: boolean) => void;
  editFormError: string | null;
  isSubmittingEditForm: boolean;
  sites: any[];
  departments: any[];
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const EditUserModal = ({
  isEditModalOpen,
  editingUser,
  editFormName,
  setEditFormName,
  editFormEmail,
  setEditFormEmail,
  editFormRole,
  setEditFormRole,
  editFormEmployeeId,
  setEditFormEmployeeId,
  editFormDepartment,
  setEditFormDepartment,
  editFormSiteId,
  setEditFormSiteId,
  editFormIsActive,
  setEditFormIsActive,
  editFormError,
  isSubmittingEditForm,
  sites,
  departments,
  onCancel,
  onSubmit,
}: EditUserModalProps) => {
  if (!isEditModalOpen || !editingUser) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0,
      width: "100%", height: "100%",
      backgroundColor: "rgba(15, 23, 42, 0.4)",
      backdropFilter: "blur(4px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    }}>
      <div style={{
        width: "100%",
        maxWidth: "500px",
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        border: "1px solid #e2e8f0",
      }}>
        
        {/* Modal Header */}
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
            <h3 style={{ fontSize: "0.98rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Edit User Account
            </h3>
            <p style={{ fontSize: "0.72rem", color: "#64748b", margin: 0 }}>
              Modify profile information and status of {editingUser.name}.
            </p>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#94a3b8", padding: 4, display: "flex", borderRadius: 4,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.5rem" }}>
          
          {/* Status Banner */}
          {editFormError && (
            <div style={{
              padding: "0.6rem 0.85rem",
              backgroundColor: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: "6px",
              fontSize: "0.75rem",
              color: "#991b1b",
              fontWeight: 500,
            }}>
              {editFormError}
            </div>
          )}

          {/* Form Grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            
            {/* Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={editFormName}
                onChange={(e) => setEditFormName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.65rem",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  fontSize: "0.8rem",
                  color: "#1e293b",
                  outline: "none",
                }}
              />
            </div>

            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Email Address *</label>
              <input
                type="email"
                required
                placeholder="e.g. john.doe@contactpoint360.com"
                value={editFormEmail}
                onChange={(e) => setEditFormEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.65rem",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  fontSize: "0.8rem",
                  color: "#1e293b",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {/* Role select */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>System Role *</label>
                <select
                  value={editFormRole}
                  onChange={(e) => setEditFormRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    fontSize: "0.8rem",
                    color: "#475569",
                    backgroundColor: "#ffffff",
                    outline: "none",
                  }}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="TEAM_LEADER">Team Leader</option>
                  <option value="INVENTORY_STAFF">Inventory Staff</option>
                  <option value="ADMIN">Ops Manager</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              {/* Employee ID */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Employee ID</label>
                <input
                  type="text"
                  placeholder="e.g. EID-0042"
                  value={editFormEmployeeId}
                  onChange={(e) => setEditFormEmployeeId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    fontSize: "0.8rem",
                    color: "#1e293b",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Site & Department Selector */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {/* Site selector */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>
                  Assigned Site {editFormRole !== "SUPER_ADMIN" ? "*" : ""}
                </label>
                <select
                  value={editFormSiteId}
                  onChange={(e) => setEditFormSiteId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    fontSize: "0.8rem",
                    color: "#475569",
                    backgroundColor: "#ffffff",
                    outline: "none",
                  }}
                >
                  <option value="">-- Select Site --</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.prefix})
                    </option>
                  ))}
                </select>
              </div>

              {/* Department selector */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Department</label>
                <select
                  value={editFormDepartment}
                  onChange={(e) => setEditFormDepartment(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    fontSize: "0.8rem",
                    color: "#475569",
                    backgroundColor: "#ffffff",
                    outline: "none",
                  }}
                >
                  <option value="">-- Select Dept --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status Checkbox */}
            {editingUser.email !== "superadmin@contactpoint360.com" && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                <input
                  type="checkbox"
                  id="editFormIsActive"
                  checked={editFormIsActive}
                  onChange={(e) => setEditFormIsActive(e.target.checked)}
                  style={{ cursor: "pointer", width: 15, height: 15 }}
                />
                <label htmlFor="editFormIsActive" style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                  Account Active
                </label>
              </div>
            )}

          </div>

          {/* Actions */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
            marginTop: "0.75rem",
            borderTop: "1px solid #f1f5f9",
            paddingTop: "1rem",
          }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmittingEditForm}
              style={{
                padding: "0.45rem 1rem",
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                background: "transparent",
                color: "#475569",
                fontSize: "0.8rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingEditForm}
              style={{
                padding: "0.45rem 1.25rem",
                borderRadius: 6,
                border: "none",
                background: "linear-gradient(135deg, #210cae 0%, #4dc9e6 100%)",
                color: "#ffffff",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(33,12,174,0.1)",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              {isSubmittingEditForm ? (
                <>
                  <div style={{
                    width: 12, height: 12, borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#ffffff",
                    animation: "spin 1s linear infinite",
                  }} />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
