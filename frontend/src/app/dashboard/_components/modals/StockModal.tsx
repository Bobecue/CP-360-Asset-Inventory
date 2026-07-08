"use client";

import React, { useState, useEffect } from "react";
import { CatalogItem } from "@/types/dashboard";

interface StockModalProps {
  stockModalOpen: boolean;
  stockItem: CatalogItem | null;
  stockSiteId: string;
  stockQuantity: string;
  setStockQuantity: (v: string) => void;
  stockReorderPoint: string;
  setStockReorderPoint: (v: string) => void;
  stockError: string | null;
  isSubmittingStock: boolean;
  sites: any[];
  onCancel: () => void;
  onSubmit: (e: React.FormEvent, reason: string, comments: string) => void;
  originalQuantity: number;
  activeAssets: any[];
  onChangeSite: (siteId: string) => void;
  currentUserRole?: string;
}

export const StockModal = ({
  stockModalOpen,
  stockItem,
  stockSiteId,
  stockQuantity,
  setStockQuantity,
  stockReorderPoint,
  setStockReorderPoint,
  stockError,
  isSubmittingStock,
  sites,
  onCancel,
  onSubmit,
  originalQuantity,
  activeAssets,
  onChangeSite,
  currentUserRole,
}: StockModalProps) => {
  const [adjustmentReason, setAdjustmentReason] = useState("INVENTORY_COUNT_CORRECTION");
  const [adjustmentComments, setAdjustmentComments] = useState("");

  useEffect(() => {
    if (stockModalOpen) {
      setAdjustmentReason("INVENTORY_COUNT_CORRECTION");
      setAdjustmentComments("");
    }
  }, [stockModalOpen]);

  const newQty = parseInt(stockQuantity) || 0;
  const isDecrease = newQty < originalQuantity;
  const isIncrease = newQty > originalQuantity;
  const diff = Math.abs(newQty - originalQuantity);
  const isSerialized = stockItem?.category?.type === "NON_CONSUMABLE";

  // How many AVAILABLE assets can actually be auto-retired
  const availableCount = activeAssets.filter(a => a.status === "AVAILABLE").length;
  const willAutoRetire = isSerialized && isDecrease ? Math.min(diff, availableCount) : 0;
  const willAutoCreate = isSerialized && isIncrease ? diff : 0;

  if (!stockModalOpen || !stockItem) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Backend now handles asset lifecycle automatically — no need to pass assetIdsToRemove
    onSubmit(e, isDecrease ? adjustmentReason : "STOCK_INCREASE", adjustmentComments);
  };

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
        maxWidth: "420px",
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
              Adjust Stock Levels
            </h3>
            <p style={{ fontSize: "0.72rem", color: "#64748b", margin: 0 }}>
              Update inventory levels and thresholds at the selected site.
            </p>
          </div>
          <button
            type="button"
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
        <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.5rem" }}>
          
          {/* Status Banner */}
          {stockError && (
            <div style={{
              padding: "0.6rem 0.85rem",
              backgroundColor: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: "6px",
              fontSize: "0.75rem",
              color: "#991b1b",
              fontWeight: 500,
            }}>
              {stockError}
            </div>
          )}

          {/* Context Info */}
          <div style={{
            padding: "0.75rem 0.85rem",
            backgroundColor: "#f8fafc",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}>
            <span style={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>Asset Tag: {stockItem.sku}</span>
            <span style={{ fontSize: "0.82rem", color: "#0f172a", fontWeight: 600 }}>{stockItem.name}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", marginTop: "0.15rem" }}>
              <label style={{ fontSize: "0.68rem", color: "#210cae", textTransform: "uppercase", fontWeight: 700 }}>Site Location</label>
              <select
                value={stockSiteId}
                onChange={(e) => onChangeSite(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.25rem 0.45rem",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: "0.76rem",
                  color: "#1e293b",
                  backgroundColor: "#ffffff",
                  outline: "none"
                }}
              >
                {sites.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.prefix})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Safeguard Notice for decrease */}
          {isDecrease && (
            <div style={{
              padding: "0.6rem 0.85rem",
              backgroundColor: "#fffbeb",
              border: "1px solid #fef3c7",
              borderRadius: "6px",
              fontSize: "0.72rem",
              color: "#b45309",
              lineHeight: "1.35",
              display: "flex",
              flexDirection: "column",
              gap: "0.2rem"
            }}>
              <span style={{ fontWeight: 700 }}>⚠️ Transfer Safeguard Alert:</span>
              <span>
                To transfer items to another site, please use the **Request Transfers** module. 
                Manual adjustments should only be used for write-offs (losses, damages, decommissions) or audit corrections.
              </span>
            </div>
          )}

          {/* Form fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            
            {/* Quantity */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Stock Quantity *</label>
              <input
                type="number"
                required
                placeholder="e.g. 10"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.65rem",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: "0.8rem",
                  color: "#1e293b",
                  outline: "none",
                }}
              />
            </div>

            {/* Reorder Point */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Reorder Point (Min Threshold) *</label>
              <input
                type="number"
                required
                placeholder="e.g. 5"
                value={stockReorderPoint}
                onChange={(e) => setStockReorderPoint(e.target.value)}
                disabled={currentUserRole !== "SUPER_ADMIN" && currentUserRole !== "ADMIN"}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.65rem",
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  fontSize: "0.8rem",
                  color: currentUserRole !== "SUPER_ADMIN" && currentUserRole !== "ADMIN" ? "#64748b" : "#1e293b",
                  backgroundColor: currentUserRole !== "SUPER_ADMIN" && currentUserRole !== "ADMIN" ? "#f1f5f9" : "#ffffff",
                  cursor: currentUserRole !== "SUPER_ADMIN" && currentUserRole !== "ADMIN" ? "not-allowed" : "text",
                  outline: "none",
                }}
              />
            </div>

            {/* Adjustment Reasons */}
            {isDecrease && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Reason for Adjustment *</label>
                  <select
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.65rem",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      fontSize: "0.8rem",
                      color: "#1e293b",
                      backgroundColor: "#ffffff",
                      outline: "none"
                    }}
                  >
                    <option value="INVENTORY_COUNT_CORRECTION">Inventory Count Correction (Audit)</option>
                    <option value="DAMAGED_OR_BROKEN">Damaged / Broken (Decommission)</option>
                    <option value="LOST_OR_STOLEN">Lost / Stolen</option>
                    <option value="DECOMMISSIONED_OR_RETIRED">Decommissioned / Retired</option>
                    <option value="OTHER">Other Reason</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Adjustment Comments</label>
                  <textarea
                    rows={2}
                    placeholder="Enter additional details/comments..."
                    value={adjustmentComments}
                    onChange={(e) => setAdjustmentComments(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.65rem",
                      borderRadius: 6,
                      border: "1px solid #cbd5e1",
                      fontSize: "0.8rem",
                      color: "#1e293b",
                      outline: "none",
                      resize: "none"
                    }}
                  />
                </div>

                {/* Auto-retire preview for serialized assets */}
                {isSerialized && isDecrease && (
                  <div style={{
                    padding: "0.6rem 0.85rem",
                    backgroundColor: willAutoRetire > 0 ? "#fef2f2" : "#f8fafc",
                    border: `1px solid ${willAutoRetire > 0 ? "#fca5a5" : "#e2e8f0"}`,
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    color: willAutoRetire > 0 ? "#991b1b" : "#64748b",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.4rem",
                  }}>
                    <span style={{ fontSize: "0.9rem", lineHeight: 1 }}>
                      {willAutoRetire > 0 ? "🗑️" : "ℹ️"}
                    </span>
                    <span>
                      {willAutoRetire > 0
                        ? <><strong>{willAutoRetire} asset tag{willAutoRetire !== 1 ? "s" : ""}</strong> will be automatically retired (oldest available first).
                          {availableCount < diff && ` Note: only ${availableCount} AVAILABLE asset${availableCount !== 1 ? "s" : ""} found at this site.`}
                        </>
                        : "No available asset tags to retire at this site for this item."
                      }
                    </span>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Auto-create preview for increases on serialized items */}
          {isSerialized && isIncrease && (
            <div style={{
              padding: "0.6rem 0.85rem",
              backgroundColor: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: "6px",
              fontSize: "0.72rem",
              color: "#166534",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.4rem",
            }}>
              <span style={{ fontSize: "0.9rem", lineHeight: 1 }}>🏷️</span>
              <span>
                <strong>{willAutoCreate} new asset tag{willAutoCreate !== 1 ? "s" : ""}</strong> will be automatically generated and assigned to this site.
              </span>
            </div>
          )}

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
              disabled={isSubmittingStock}
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
              disabled={isSubmittingStock}
              style={{
                padding: "0.45rem 1.25rem",
                borderRadius: 6,
                border: "none",
                background: "linear-gradient(135deg, #210cae 0%, #4dc9e6 100%)",
                color: "#ffffff",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                opacity: 1,
                boxShadow: "0 2px 4px rgba(33,12,174,0.1)",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              {isSubmittingStock ? (
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
                "Save Stock"
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
