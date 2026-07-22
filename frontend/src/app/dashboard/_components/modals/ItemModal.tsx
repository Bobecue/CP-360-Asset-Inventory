"use client";

import { CatalogItem } from "@/types/dashboard";

interface ItemModalProps {
  itemModalOpen: boolean;
  editingItem: CatalogItem | null;
  itemName: string;
  setItemName: (v: string) => void;
  itemSku: string;
  setItemSku: (v: string) => void;
  itemDescription: string;
  setItemDescription: (v: string) => void;
  itemUnitPrice: string;
  setItemUnitPrice: (v: string) => void;
  itemLeadTimeDays: string;
  setItemLeadTimeDays: (v: string) => void;
  itemCategoryId: string;
  setItemCategoryId: (v: string) => void;
  itemSiteId: string;
  setItemSiteId: (v: string) => void;
  itemQuantity: string;
  setItemQuantity: (v: string) => void;
  itemError: string | null;
  isSubmittingItem: boolean;
  sites: any[];
  categories: any[];
  catalogItems: CatalogItem[];
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ItemModal = ({
  itemModalOpen,
  editingItem,
  itemName,
  setItemName,
  itemSku,
  setItemSku,
  itemDescription,
  setItemDescription,
  itemUnitPrice,
  setItemUnitPrice,
  itemLeadTimeDays,
  setItemLeadTimeDays,
  itemCategoryId,
  setItemCategoryId,
  itemSiteId,
  setItemSiteId,
  itemQuantity,
  setItemQuantity,
  itemError,
  isSubmittingItem,
  sites,
  categories,
  catalogItems,
  onCancel,
  onSubmit,
}: ItemModalProps) => {
  if (!itemModalOpen) return null;

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
        maxWidth: "600px",
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
              {editingItem ? "Edit Asset" : "Create Asset"}
            </h3>
            <p style={{ fontSize: "0.72rem", color: "#64748b", margin: 0 }}>
              {editingItem ? "Modify product details in your inventory catalog." : "Register a new product into your inventory catalog."}
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
          {itemError && (
            <div style={{
              padding: "0.6rem 0.85rem",
              backgroundColor: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: "6px",
              fontSize: "0.75rem",
              color: "#991b1b",
              fontWeight: 500,
            }}>
              {itemError}
            </div>
          )}

          {/* Form fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            
            {/* ASSET ID / SERIAL & LOCATION */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Asset ID / Serial</label>
                <input
                  type="text"
                  disabled={!!editingItem}
                  placeholder="e.g. AST-M3MAX-99"
                  value={itemSku}
                  onChange={(e) => setItemSku(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    fontSize: "0.8rem",
                    color: "#1e293b",
                    backgroundColor: editingItem ? "#f1f5f9" : "#ffffff",
                    outline: "none",
                  }}
                />
                <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontStyle: "italic", marginTop: "0.1rem" }}>
                  Leave blank to auto-generate.
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Location</label>
                <select
                  disabled={!!editingItem}
                  value={itemSiteId}
                  onChange={(e) => setItemSiteId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    fontSize: "0.8rem",
                    color: "#475569",
                    backgroundColor: editingItem ? "#f1f5f9" : "#ffffff",
                    outline: "none",
                  }}
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.prefix})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ASSET NAME */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Asset Name *</label>
              <input
                type="text"
                required
                placeholder="e.g., MacBook Pro M3 Max 16 inch"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
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

            {/* CATEGORY & QUANTITY & UNIT COST */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.75rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Category *</label>
                <select
                  value={itemCategoryId}
                  onChange={(e) => setItemCategoryId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    fontSize: "0.8rem",
                    color: itemCategoryId ? "#1e293b" : "#94a3b8",
                    backgroundColor: "#ffffff",
                    outline: "none",
                  }}
                >
                  <option value="" disabled hidden>Select Category</option>
                  {categories.filter(c => c.type === "NON_CONSUMABLE" || (c.type !== "CONSUMABLE" && !c.name.toLowerCase().includes("consumable"))).length > 0 && (
                    <optgroup label="💻 Non-Consumable">
                      {categories.filter(c => c.type === "NON_CONSUMABLE" || (c.type !== "CONSUMABLE" && !c.name.toLowerCase().includes("consumable"))).map((c) => (
                        <option key={c.id} value={c.id} style={{ color: "#1e293b" }}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {categories.filter(c => c.type === "CONSUMABLE" || c.name.toLowerCase().includes("consumable")).length > 0 && (
                    <optgroup label="🟢 Consumable">
                      {categories.filter(c => c.type === "CONSUMABLE" || c.name.toLowerCase().includes("consumable")).map((c) => (
                        <option key={c.id} value={c.id} style={{ color: "#1e293b" }}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Quantity</label>
                <input
                  type="number"
                  required
                  disabled={!!editingItem}
                  placeholder="e.g. 10"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    fontSize: "0.8rem",
                    color: "#1e293b",
                    backgroundColor: editingItem ? "#f1f5f9" : "#ffffff",
                    outline: "none",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Unit Cost (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 450.00"
                  value={itemUnitPrice}
                  onChange={(e) => setItemUnitPrice(e.target.value)}
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

            {/* ASSET TAGS PREVIEW FOR BULK NON-CONSUMABLES */}
            {(() => {
              const qtyVal = parseInt(itemQuantity);
              const selectedCategory = categories.find(c => c.id === itemCategoryId);
              const isNonConsumable = selectedCategory?.type === "NON_CONSUMABLE";
              if (!editingItem && isNonConsumable && qtyVal > 1) {
                const tags: string[] = [];
                const baseSku = itemSku.trim().toUpperCase();
                
                if (baseSku) {
                  for (let i = 1; i <= qtyVal; i++) {
                    tags.push(`${baseSku}-${i}`);
                  }
                } else {
                  const site = sites.find(s => s.id === itemSiteId);
                  const categoryPrefix = (selectedCategory?.prefix || "AST").toUpperCase();
                  const sitePrefix = (site?.prefix || "SYS").toUpperCase();
                  const prefix = `${sitePrefix}-${categoryPrefix}-`;

                  let nextNum = 1;
                  const allTags: string[] = [];
                  catalogItems.forEach(it => {
                    if (it.assets) {
                      it.assets.forEach(a => {
                        if (a.tagCode.startsWith(prefix)) {
                          allTags.push(a.tagCode);
                        }
                      });
                    }
                  });
                  if (allTags.length > 0) {
                    const numbers = allTags.map(tag => {
                      const parts = tag.split("-");
                      const numStr = parts[parts.length - 1];
                      const num = parseInt(numStr, 10);
                      return isNaN(num) ? 0 : num;
                    });
                    nextNum = Math.max(...numbers, 0) + 1;
                  }
                  for (let i = 0; i < qtyVal; i++) {
                    tags.push(`${prefix}${String(nextNum + i).padStart(4, "0")}`);
                  }
                }

                return (
                  <div style={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "0.75rem",
                    marginTop: "0.25rem",
                  }}>
                    <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#475569", marginBottom: "0.4rem", display: "flex", justifyContent: "space-between" }}>
                      <span>Generated Asset Tags Preview ({tags.length})</span>
                      <span style={{ color: "#210cae" }}>1 by 1 serialization</span>
                    </div>
                    <div style={{
                      maxHeight: "100px",
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                      padding: "0.25rem",
                      backgroundColor: "#ffffff",
                      borderRadius: "6px",
                      border: "1px solid #f1f5f9"
                    }}>
                      {tags.map((tag, idx) => (
                        <div key={idx} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          fontSize: "0.74rem",
                          color: "#334155",
                          padding: "0.15rem 0.35rem",
                          backgroundColor: "#f8fafc",
                          borderRadius: "4px",
                        }}
                        >
                          <span style={{ color: "#94a3b8", fontWeight: 500 }}>#{idx + 1}</span>
                          <code style={{ fontWeight: 600, color: "#0f172a" }}>{tag}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Stock Levels Across Sites Comparison (only when editing) */}
            {editingItem && (
              <div style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "0.75rem",
                marginTop: "0.25rem",
              }}>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.5rem" }}>
                  Stock Levels Across Sites
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {sites.map(s => {
                    const level = editingItem.stockLevels?.find(sl => sl.siteId === s.id);
                    const qty = level ? level.quantity : 0;
                    const reorder = level ? level.reorderPoint : 5;
                    const isLow = qty <= reorder;
                    return (
                      <div key={s.id} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.3rem 0.5rem",
                        backgroundColor: "#ffffff",
                        borderRadius: "4px",
                        border: "1px solid #f1f5f9",
                        fontSize: "0.74rem"
                      }}>
                        <span style={{ fontWeight: 600, color: "#334155" }}>
                          {s.name} ({s.prefix})
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{
                            fontWeight: 700,
                            color: qty === 0 ? "#ef4444" : isLow ? "#f59e0b" : "#10b981"
                          }}>
                            {qty} in stock
                          </span>
                          <span style={{ color: "#94a3b8", fontSize: "0.68rem" }}>
                            (reorder pt: {reorder})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DESCRIPTION */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Description</label>
              <textarea
                placeholder="Hardware versions, accessory counts, setup details..."
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.65rem",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  fontSize: "0.8rem",
                  color: "#1e293b",
                  outline: "none",
                  minHeight: 80,
                  resize: "vertical",
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
              onClick={onCancel}
              disabled={isSubmittingItem}
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
              disabled={isSubmittingItem}
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
              {isSubmittingItem ? (
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
                "Save Asset"
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
