"use client";

import React, { useState, useEffect } from "react";
import { CatalogItem } from "@/types/dashboard";
import { getApiUrl } from "@/utils/api";

interface POModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sites: any[];
  catalogItems: CatalogItem[];
  currentUser: any;
  isUsingMockData: boolean;
  onAddMockPO?: (po: any) => void;
}

export const POModal = ({
  isOpen,
  onClose,
  onSuccess,
  sites,
  catalogItems,
  currentUser,
  isUsingMockData,
  onAddMockPO,
}: POModalProps) => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState("");
  
  // Array of items to order
  const [orderItems, setOrderItems] = useState<{ itemId: string; quantityOrdered: number; unitCost: number }[]>([
    { itemId: "", quantityOrdered: 1, unitCost: 0 }
  ]);
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default mock suppliers
  const mockSuppliers = [
    { id: "mock-sup-1", name: "Dell Global Ltd.", leadTimeDays: 7 },
    { id: "mock-sup-2", name: "Apple Corporate", leadTimeDays: 10 },
    { id: "mock-sup-3", name: "Office Warehouse", leadTimeDays: 3 },
    { id: "mock-sup-4", name: "Logitech Distributor", leadTimeDays: 5 }
  ];

  useEffect(() => {
    if (!isOpen) return;

    // Reset fields
    setSelectedSupplierId("");
    setSelectedSiteId(currentUser?.siteId || (sites.length > 0 ? sites[0].id : ""));
    setOrderItems([{ itemId: "", quantityOrdered: 1, unitCost: 0 }]);
    setError(null);

    // Fetch suppliers
    const fetchSuppliers = async () => {
      setIsLoadingSuppliers(true);
      if (isUsingMockData) {
        setSuppliers(mockSuppliers);
        if (mockSuppliers.length > 0) {
          setSelectedSupplierId(mockSuppliers[0].id);
        }
        setIsLoadingSuppliers(false);
      } else {
        try {
          const res = await fetch(getApiUrl("/suppliers"));
          if (res.ok) {
            const json = await res.json();
            const list = Array.isArray(json) ? json : json.data || [];
            setSuppliers(list);
            if (list.length > 0) {
              setSelectedSupplierId(list[0].id);
            }
          } else {
            setSuppliers(mockSuppliers);
            if (mockSuppliers.length > 0) {
              setSelectedSupplierId(mockSuppliers[0].id);
            }
          }
        } catch (e) {
          setSuppliers(mockSuppliers);
          if (mockSuppliers.length > 0) {
            setSelectedSupplierId(mockSuppliers[0].id);
          }
        } finally {
          setIsLoadingSuppliers(false);
        }
      }
    };

    fetchSuppliers();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddItemRow = () => {
    setOrderItems([...orderItems, { itemId: "", quantityOrdered: 1, unitCost: 0 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (orderItems.length === 1) return;
    setOrderItems(orderItems.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, itemId: string) => {
    const selectedItem = catalogItems.find(it => it.id === itemId);
    const updated = [...orderItems];
    updated[index] = {
      itemId,
      quantityOrdered: updated[index].quantityOrdered,
      unitCost: selectedItem ? Number(selectedItem.unitPrice) : 0
    };
    setOrderItems(updated);
  };

  const handleNumberChange = (index: number, field: "quantityOrdered" | "unitCost", value: number) => {
    const updated = [...orderItems];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setOrderItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!selectedSupplierId) {
      setError("Please select a supplier.");
      return;
    }
    if (!selectedSiteId) {
      setError("Please select a target site.");
      return;
    }

    const invalidItems = orderItems.some(item => !item.itemId || item.quantityOrdered <= 0 || item.unitCost < 0);
    if (invalidItems) {
      setError("Please verify that all items are selected and have valid quantities/costs.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      supplierId: selectedSupplierId,
      siteId: selectedSiteId,
      creatorId: currentUser?.id || "mock-admin-id",
      items: orderItems
    };

    if (isUsingMockData && onAddMockPO) {
      // Mock PO flow
      const selectedSite = sites.find(s => s.id === selectedSiteId);
      const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
      const newPo = {
        id: `mock-po-${Date.now()}`,
        poNumber: `PO-${String(Math.floor(Math.random() * 90000) + 10000)}`,
        status: "DRAFT",
        supplierId: selectedSupplierId,
        supplier: selectedSupplier || { name: "Mock Supplier" },
        siteId: selectedSiteId,
        site: selectedSite || { name: "Mock Site", prefix: "MCK" },
        creatorId: payload.creatorId,
        creator: currentUser || { name: "Super Admin" },
        items: orderItems.map((oi, idx) => {
          const item = catalogItems.find(it => it.id === oi.itemId);
          return {
            id: `mock-po-item-${idx}-${Date.now()}`,
            itemId: oi.itemId,
            item: item || { name: "Catalog Item", sku: "SKU" },
            quantityOrdered: oi.quantityOrdered,
            quantityReceived: 0,
            unitCost: oi.unitCost
          };
        }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await new Promise(r => setTimeout(r, 600));
      onAddMockPO(newPo);
      setIsSubmitting(false);
      onSuccess();
      onClose();
    } else {
      try {
        const res = await fetch("http://localhost:3001/purchase-orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to create Purchase Order.");
        }

        setIsSubmitting(false);
        onSuccess();
        onClose();
      } catch (err: any) {
        console.error("Error creating PO:", err);
        setError(err.message || "Something went wrong.");
        setIsSubmitting(false);
      }
    }
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
      zIndex: 1100,
    }}>
      <form onSubmit={handleSubmit} style={{
        width: "92%",
        maxWidth: "600px",
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        border: "1px solid #e2e8f0",
        animation: "scaleIn 0.2s ease-out",
        maxHeight: "90vh"
      }}>
        {/* Header */}
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Create Purchase Order (PO)
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", padding: "4px", borderRadius: "4px" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Content Scroll Area */}
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", overflowY: "auto", flex: 1 }}>
          {error && (
            <div style={{ padding: "0.75rem 1rem", backgroundColor: "#fef2f2", borderLeft: "4px solid #ef4444", borderRadius: 6, fontSize: "0.8rem", color: "#991b1b" }}>
              {error}
            </div>
          )}

          {/* Supplier and Site Pickers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Supplier</label>
              {isLoadingSuppliers ? (
                <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Loading...</div>
              ) : (
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  required
                  style={{ padding: "0.5rem 0.65rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none" }}
                >
                  <option value="" disabled>Select Supplier</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Target Site</label>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                required
                style={{ padding: "0.5rem 0.65rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none" }}
              >
                <option value="" disabled>Select Site</option>
                {sites.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.prefix})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Order Items</label>
              <button
                type="button"
                onClick={handleAddItemRow}
                style={{
                  fontSize: "0.75rem",
                  color: "#210cae",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem"
                }}
              >
                + Add Item Line
              </button>
            </div>

            {/* Items Rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {orderItems.map((orderItem, idx) => (
                <div key={idx} style={{ display: "flex", gap: "0.5rem", alignItems: "center", backgroundColor: "#f8fafc", padding: "0.6rem", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                  
                  {/* Select Catalog Item */}
                  <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                    <select
                      value={orderItem.itemId}
                      onChange={(e) => handleItemChange(idx, e.target.value)}
                      required
                      style={{ padding: "0.4rem 0.5rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.8rem", outline: "none", width: "100%", backgroundColor: "#ffffff" }}
                    >
                      <option value="" disabled>Select Catalog Item</option>
                      {catalogItems.map(it => (
                        <option key={it.id} value={it.id}>{it.name} (SKU: {it.sku})</option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity Ordered */}
                  <div style={{ width: "90px", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      required
                      value={orderItem.quantityOrdered}
                      onChange={(e) => handleNumberChange(idx, "quantityOrdered", Math.max(1, parseInt(e.target.value, 10) || 1))}
                      style={{ padding: "0.4rem 0.5rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.8rem", outline: "none", textAlign: "center" }}
                    />
                  </div>

                  {/* Negotiated Cost */}
                  <div style={{ width: "120px", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                    <input
                      type="number"
                      placeholder="Unit Cost (₱)"
                      min="0"
                      step="0.01"
                      required
                      value={orderItem.unitCost || ""}
                      onChange={(e) => handleNumberChange(idx, "unitCost", Math.max(0, parseFloat(e.target.value) || 0))}
                      style={{ padding: "0.4rem 0.5rem", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: "0.8rem", outline: "none", textAlign: "right" }}
                    />
                  </div>

                  {/* Remove row button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(idx)}
                    disabled={orderItems.length === 1}
                    style={{
                      background: "none",
                      border: "none",
                      color: orderItems.length === 1 ? "#cbd5e1" : "#ef4444",
                      cursor: orderItems.length === 1 ? "not-allowed" : "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.75rem",
          padding: "1rem 1.5rem",
          borderTop: "1px solid #e2e8f0",
          backgroundColor: "#f8fafc",
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#475569",
              fontSize: "0.82rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "0.55rem 1.5rem",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #210cae 0%, #4dc9e6 100%)",
              color: "#ffffff",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(33,12,174,0.15)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            {isSubmitting ? (
              <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #ffffff", borderTopColor: "transparent", animation: "spin 0.6s linear infinite" }} />
            ) : null}
            Create PO (Draft)
          </button>
        </div>
      </form>
    </div>
  );
};
