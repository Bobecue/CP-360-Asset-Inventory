"use client";

interface DeleteConfirmModalProps {
  deleteTarget: { type: "site" | "department" | "category" | "item" | "bulk_items"; id: string; name: string } | null;
  deleteError: string | null;
  selectedItemIdsCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal = ({
  deleteTarget,
  deleteError,
  selectedItemIdsCount,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) => {
  if (!deleteTarget) return null;

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
      zIndex: 1100,
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
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
            backgroundColor: "#fee2e2",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#dc2626", flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Confirm Deletion
          </h3>
        </div>

        {/* Modal Content */}
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
            {deleteTarget.type === "bulk_items" ? (
              <>Are you sure you want to delete the selected <strong>{selectedItemIdsCount}</strong> catalog items?</>
            ) : (
              <>Are you sure you want to delete the {deleteTarget.type} <strong>{deleteTarget.name}</strong>?</>
            )}
          </p>
          <p style={{ fontSize: "0.75rem", color: "#dc2626", margin: 0, fontWeight: 500 }}>
            Warning: This action cannot be undone. If this item is currently assigned to users or assets, the request might fail.
          </p>
          {deleteError && (
            <div style={{
              padding: "0.6rem 0.85rem",
              backgroundColor: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: "6px",
              fontSize: "0.75rem",
              color: "#991b1b",
              fontWeight: 500,
            }}>
              {deleteError}
            </div>
          )}
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
            onClick={onCancel}
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
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "0.45rem 1.25rem",
              borderRadius: 6,
              border: "none",
              backgroundColor: "#dc2626",
              color: "#ffffff",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(220,38,38,0.15)",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
