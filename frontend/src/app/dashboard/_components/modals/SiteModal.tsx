"use client";

interface SiteModalProps {
  siteModalOpen: boolean;
  editingSite: any | null;
  siteName: string;
  setSiteName: (v: string) => void;
  sitePrefix: string;
  setSitePrefix: (v: string) => void;
  siteAddress: string;
  setSiteAddress: (v: string) => void;
  siteError: string | null;
  isSubmittingSite: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const SiteModal = ({
  siteModalOpen,
  editingSite,
  siteName,
  setSiteName,
  sitePrefix,
  setSitePrefix,
  siteAddress,
  setSiteAddress,
  siteError,
  isSubmittingSite,
  onCancel,
  onSubmit,
}: SiteModalProps) => {
  if (!siteModalOpen) return null;

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
        maxWidth: "450px",
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
              {editingSite ? "Edit Site" : "Add New Site"}
            </h3>
            <p style={{ fontSize: "0.72rem", color: "#64748b", margin: 0 }}>
              {editingSite ? "Update existing organization site parameters." : "Register a new workspace facility location."}
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
          {siteError && (
            <div style={{
              padding: "0.6rem 0.85rem",
              backgroundColor: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: "6px",
              fontSize: "0.75rem",
              color: "#991b1b",
              fontWeight: 500,
            }}>
              {siteError}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Site Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Cebu IT Park"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
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
              <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Site Prefix * (3-Letter Code)</label>
              <input
                type="text"
                required
                maxLength={3}
                placeholder="e.g. CEB"
                value={sitePrefix}
                onChange={(e) => setSitePrefix(e.target.value)}
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
              <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Physical Address</label>
              <input
                type="text"
                placeholder="e.g. Cebu City, Philippines"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
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
              disabled={isSubmittingSite}
              onClick={onCancel}
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
              disabled={isSubmittingSite}
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
              {isSubmittingSite ? (
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
                "Save Site"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
