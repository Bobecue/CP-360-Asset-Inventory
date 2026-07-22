"use client";

import { getGeneratedPassword, formatRoleName } from "@/types/dashboard";

interface AddUserModalProps {
  isAddModalOpen: boolean;
  showAddConfirmation: boolean;
  setShowAddConfirmation: (v: boolean) => void;
  formFirstName: string;
  setFormFirstName: (v: string) => void;
  formLastName: string;
  setFormLastName: (v: string) => void;
  formEmail: string;
  setFormEmail: (v: string) => void;
  formRole: string;
  setFormRole: (v: string) => void;
  formEmployeeId: string;
  setFormEmployeeId: (v: string) => void;
  formDepartment: string;
  setFormDepartment: (v: string) => void;
  formSiteId: string;
  setFormSiteId: (v: string) => void;
  formError: string | null;
  isSubmittingForm: boolean;
  sites: any[];
  departments: any[];
  onCancel: () => void;
  onPreSubmit: (e: React.FormEvent) => void;
  onConfirmAddUser: () => void;
}

export const AddUserModal = ({
  isAddModalOpen,
  showAddConfirmation,
  setShowAddConfirmation,
  formFirstName,
  setFormFirstName,
  formLastName,
  setFormLastName,
  formEmail,
  setFormEmail,
  formRole,
  setFormRole,
  formEmployeeId,
  setFormEmployeeId,
  formDepartment,
  setFormDepartment,
  formSiteId,
  setFormSiteId,
  formError,
  isSubmittingForm,
  sites,
  departments,
  onCancel,
  onPreSubmit,
  onConfirmAddUser,
}: AddUserModalProps) => {
  if (!isAddModalOpen) return null;

  return (
    <>
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
                Create User Account
              </h3>
              <p style={{ fontSize: "0.72rem", color: "#64748b", margin: 0 }}>
                Register a new authenticated system user account.
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
          <form onSubmit={onPreSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.5rem" }}>
            
            {/* Status Banner */}
            {formError && (
              <div style={{
                padding: "0.6rem 0.85rem",
                backgroundColor: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: "6px",
                fontSize: "0.75rem",
                color: "#991b1b",
                fontWeight: 500,
              }}>
                {formError}
              </div>
            )}

            {/* Form Grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              
              {/* First & Last Name */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John"
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
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
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Doe"
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
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

              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john.doe@contactpoint360.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
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
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
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
                    placeholder="e.g. EID-0042 (Optional)"
                    value={formEmployeeId}
                    onChange={(e) => setFormEmployeeId(e.target.value)}
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
                    Assigned Site {formRole !== "SUPER_ADMIN" ? "*" : ""}
                  </label>
                  <select
                    value={formSiteId}
                    onChange={(e) => setFormSiteId(e.target.value)}
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
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
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
                disabled={isSubmittingForm}
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
                disabled={isSubmittingForm}
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
                Save User
              </button>
            </div>

          </form>

        </div>
      </div>

      {/* Confirmation Step */}
      {showAddConfirmation && (
        <div style={{
          position: "fixed",
          top: 0, left: 0,
          width: "100%", height: "100%",
          backgroundColor: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1100,
        }}>
          <div style={{
            width: "100%",
            maxWidth: "420px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            border: "1px solid #e2e8f0",
            animation: "scaleIn 0.2s ease-out",
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                backgroundColor: "#e0e7ff",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#4338ca", flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Confirm User Creation
              </h3>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to register this user? Please review the account details below:
              </p>

              <div style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Full Name</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>{`${formFirstName.trim()} ${formLastName.trim()}`}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Email Address</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>{formEmail}</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                    <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>System Role</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>
                      {formatRoleName(formRole)}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                    <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Employee ID</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>{formEmployeeId || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Not Specified</span>}</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Department</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1e293b" }}>{formDepartment || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Not Specified</span>}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", borderTop: "1px dashed #e2e8f0", paddingTop: "0.65rem", marginTop: "0.25rem" }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Generated Default Password</span>
                  <code style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: "#210cae",
                    backgroundColor: "#f1f5f9",
                    padding: "0.25rem 0.5rem",
                    borderRadius: 6,
                    fontFamily: "monospace",
                    width: "fit-content",
                    letterSpacing: "0.03em",
                  }}>
                    {getGeneratedPassword(formEmployeeId, formFirstName, formLastName)}
                  </code>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.5rem",
              padding: "1rem 1.5rem",
              borderTop: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc",
            }}>
              <button
                type="button"
                onClick={() => setShowAddConfirmation(false)}
                disabled={isSubmittingForm}
                style={{
                  padding: "0.45rem 1rem",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={onConfirmAddUser}
                disabled={isSubmittingForm}
                style={{
                  padding: "0.45rem 1.25rem",
                  borderRadius: 6,
                  border: "none",
                  background: "linear-gradient(135deg, #210cae 0%, #4dc9e6 100%)",
                  color: "#ffffff",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(33,12,174,0.15)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                {isSubmittingForm ? (
                  <>
                    <div style={{
                      width: 12, height: 12, borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#ffffff",
                      animation: "spin 1s linear infinite",
                    }} />
                    Creating...
                  </>
                ) : (
                  "Confirm & Create"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
