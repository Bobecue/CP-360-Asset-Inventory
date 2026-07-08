"use client";

import React, { useState, useEffect } from "react";
import { Barcode } from "../Barcode";

interface ReceivingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purchaseOrder: any; // The PO to receive items for
  currentUser: any;
  isUsingMockData: boolean;
  onAddMockRR?: (rr: any) => void;
}

export const ReceivingWizardModal = ({
  isOpen,
  onClose,
  onSuccess,
  purchaseOrder,
  currentUser,
  isUsingMockData,
  onAddMockRR,
}: ReceivingWizardModalProps) => {
  const [step, setStep] = useState(1); // Steps 1 to 5
  
  // Step 2 references
  const [deliveryNoteRef, setDeliveryNoteRef] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceFileUrl, setInvoiceFileUrl] = useState("");

  // Step 3 quantities and serials state
  // Keyed by itemId: { quantityReceived: number, serials: string[] }
  const [receivedItems, setReceivedItems] = useState<{
    [itemId: string]: { quantityReceived: number; serials: string[] };
  }>({});

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdReport, setCreatedReport] = useState<any | null>(null); // Step 5 payload

  useEffect(() => {
    if (!isOpen || !purchaseOrder) return;

    // Initialize state based on purchaseOrder items
    setStep(1);
    setDeliveryNoteRef("");
    setInvoiceNumber("");
    setInvoiceFileUrl("");
    setError(null);
    setCreatedReport(null);

    const initial: { [itemId: string]: { quantityReceived: number; serials: string[] } } = {};
    purchaseOrder.items.forEach((poItem: any) => {
      const remaining = Math.max(0, poItem.quantityOrdered - poItem.quantityReceived);
      initial[poItem.itemId] = {
        quantityReceived: remaining,
        serials: Array(remaining).fill("")
      };
    });
    setReceivedItems(initial);
  }, [isOpen, purchaseOrder]);

  if (!isOpen || !purchaseOrder) return null;

  const handleQtyChange = (itemId: string, qty: number, isConsumable: boolean) => {
    const remaining = Math.max(0, qty);
    setReceivedItems(prev => {
      const existing = prev[itemId] || { quantityReceived: 0, serials: [] };
      const nextSerials = isConsumable 
        ? [] 
        : Array(remaining).fill("").map((_, i) => existing.serials[i] || "");
      
      return {
        ...prev,
        [itemId]: {
          quantityReceived: remaining,
          serials: nextSerials
        }
      };
    });
  };

  const handleSerialChange = (itemId: string, index: number, value: string) => {
    setReceivedItems(prev => {
      const existing = prev[itemId];
      if (!existing) return prev;
      const nextSerials = [...existing.serials];
      nextSerials[index] = value;
      return {
        ...prev,
        [itemId]: {
          ...existing,
          serials: nextSerials
        }
      };
    });
  };

  const validateStep2 = () => {
    setError(null);
    setStep(3);
  };

  const validateStep3 = () => {
    setError(null);
    // Enforce that at least one item has a quantity > 0
    const totalQty = Object.values(receivedItems).reduce((sum, item) => sum + item.quantityReceived, 0);
    if (totalQty <= 0) {
      setError("Please receive at least one item with a quantity greater than zero.");
      return;
    }

    // Verify serial numbers are entered for non-consumables
    for (const poItem of purchaseOrder.items) {
      const state = receivedItems[poItem.itemId];
      const isConsumable = poItem.item?.category?.type === "CONSUMABLE";
      if (!isConsumable && state && state.quantityReceived > 0) {
        const missingSerial = state.serials.some(s => !s.trim());
        if (missingSerial) {
          setError(`Please input serial numbers for all received "${poItem.item.name}".`);
          return;
        }

        // Verify serials are unique in current inputs
        const uniqueSerials = new Set(state.serials.map(s => s.trim().toUpperCase()));
        if (uniqueSerials.size !== state.serials.length) {
          setError(`Duplicate serial numbers found in your input list for "${poItem.item.name}".`);
          return;
        }
      }
    }

    setStep(4);
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    const payloadItems = Object.keys(receivedItems)
      .map(itemId => {
        const itemState = receivedItems[itemId];
        const poItem = purchaseOrder.items.find((pi: any) => pi.itemId === itemId);
        const isConsumable = poItem?.item?.category?.type === "CONSUMABLE";
        
        return {
          itemId,
          quantityReceived: itemState.quantityReceived,
          serials: isConsumable ? undefined : itemState.serials.map(s => s.trim())
        };
      })
      .filter(item => item.quantityReceived > 0);

    const payload = {
      purchaseOrderId: purchaseOrder.id,
      receivedById: currentUser?.id || "mock-admin-id",
      siteId: purchaseOrder.siteId,
      deliveryNoteRef: deliveryNoteRef.trim() || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
      invoiceFileUrl: invoiceFileUrl.trim() || undefined,
      items: payloadItems
    };

    if (isUsingMockData) {
      // Mock flow
      await new Promise(r => setTimeout(r, 800));
      
      // Auto generate tags
      const sitePrefix = purchaseOrder.site?.prefix || "CEB";
      const mockAssetsIntroduced: any[] = [];
      let mockSeqCount = Math.floor(Math.random() * 100) + 1;

      payloadItems.forEach(pi => {
        const poItem = purchaseOrder.items.find((p: any) => p.itemId === pi.itemId);
        const isConsumable = poItem?.item?.category?.type === "CONSUMABLE";
        if (!isConsumable && pi.serials) {
          pi.serials.forEach(serial => {
            const catPrefix = poItem?.item?.category?.prefix || "EQP";
            const tagCode = `${sitePrefix}-${catPrefix}-${String(mockSeqCount).padStart(4, "0")}`;
            mockSeqCount++;
            mockAssetsIntroduced.push({
              id: `mock-asset-${Math.random()}`,
              serialNumber: serial,
              tagCode,
              status: "AVAILABLE",
              condition: "GOOD",
              itemId: pi.itemId,
              item: poItem?.item || { name: "MacBook Pro" },
              siteId: purchaseOrder.siteId
            });
          });
        }
      });

      const newRr = {
        id: `mock-rr-${Date.now()}`,
        rrNumber: `RR-${String(Math.floor(Math.random() * 90000) + 10000)}`,
        deliveryNoteRef: payload.deliveryNoteRef || "N/A",
        invoiceNumber: payload.invoiceNumber || "N/A",
        invoiceFileUrl: payload.invoiceFileUrl || "",
        purchaseOrderId: purchaseOrder.id,
        purchaseOrder: { id: purchaseOrder.id, poNumber: purchaseOrder.poNumber },
        siteId: purchaseOrder.siteId,
        site: purchaseOrder.site || { name: "Mock Site" },
        receivedById: payload.receivedById,
        receivedBy: currentUser || { name: "Super Admin" },
        receivedItems: payloadItems.map(pi => {
          const poItem = purchaseOrder.items.find((p: any) => p.itemId === pi.itemId);
          return {
            id: `mock-rr-item-${Math.random()}`,
            itemId: pi.itemId,
            item: poItem?.item || { name: "Item SKU" },
            quantityReceived: pi.quantityReceived
          };
        }),
        assetsIntroduced: mockAssetsIntroduced,
        createdAt: new Date().toISOString()
      };

      if (onAddMockRR) {
        onAddMockRR(newRr);
      }

      setCreatedReport(newRr);
      setIsSubmitting(false);
      setStep(5);
    } else {
      try {
        const res = await fetch("http://localhost:3001/receiving-reports", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to submit receiving report.");
        }

        const report = await res.json();
        setCreatedReport(report);
        setIsSubmitting(false);
        setStep(5);
      } catch (err: any) {
        console.error("Error receiving items:", err);
        setError(err.message || "Something went wrong.");
        setIsSubmitting(false);
      }
    }
  };

  const handlePrintLabel = (asset: any, itemName: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label - ${asset.tagCode}</title>
          <style>
            @page { size: 2in 1in; margin: 0; }
            body {
              margin: 0; padding: 0.15in; width: 2in; height: 1in; box-sizing: border-box;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex; flex-direction: column; align-items: center; justify-content: space-between;
              text-align: center; background-color: white;
            }
            .header { font-size: 8px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .item-name { font-size: 7px; color: #64748b; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
            .barcode-container { width: 100%; height: 35px; display: flex; justify-content: center; align-items: center; }
            .barcode-container svg { width: 100%; height: 35px; }
            .tag-code { font-size: 8px; font-weight: 700; font-family: monospace; letter-spacing: 0.05em; margin-top: 1px; }
          </style>
        </head>
        <body>
          <div class="header">ContactPoint 360</div>
          <div class="item-name">${itemName}</div>
          <div class="barcode-container">
            ${document.getElementById(`barcode-rr-svg-${asset.id}`)?.outerHTML || ""}
          </div>
          <div class="tag-code">${asset.tagCode}</div>
          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintAllLabels = () => {
    if (!createdReport || !createdReport.assetsIntroduced || createdReport.assetsIntroduced.length === 0) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const labelPages = createdReport.assetsIntroduced.map((asset: any) => {
      const poItem = purchaseOrder.items.find((pi: any) => pi.itemId === asset.itemId);
      const itemName = poItem?.item?.name || "Asset Catalog Item";
      return `
        <div class="label-page">
          <div class="header">ContactPoint 360</div>
          <div class="item-name">${itemName}</div>
          <div class="barcode-container">
            ${document.getElementById(`barcode-rr-svg-${asset.id}`)?.outerHTML || ""}
          </div>
          <div class="tag-code">${asset.tagCode}</div>
        </div>
      `;
    }).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Labels - ${purchaseOrder.poNumber}</title>
          <style>
            @page { size: 2in 1in; margin: 0; }
            body { margin: 0; padding: 0; background-color: white; }
            .label-page {
              width: 2in; height: 1in; padding: 0.15in; box-sizing: border-box;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex; flex-direction: column; align-items: center; justify-content: space-between;
              text-align: center; page-break-after: always;
            }
            .header { font-size: 8px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .item-name { font-size: 7px; color: #64748b; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
            .barcode-container { width: 100%; height: 35px; display: flex; justify-content: center; align-items: center; }
            .barcode-container svg { width: 100%; height: 35px; }
            .tag-code { font-size: 8px; font-weight: 700; font-family: monospace; letter-spacing: 0.05em; margin-top: 1px; }
          </style>
        </head>
        <body>
          ${labelPages}
          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleWizardClose = () => {
    onSuccess();
    onClose();
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
      <div style={{
        width: "92%",
        maxWidth: "650px",
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
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Inventory Receiving Wizard
            </h3>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
              Processing Delivery for {purchaseOrder.poNumber} • Site: {purchaseOrder.site?.name}
            </span>
          </div>
          {step < 5 && (
            <button
              type="button"
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", padding: "4px", borderRadius: "4px" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>

        {/* Wizard Steps indicator */}
        <div style={{
          display: "flex",
          borderBottom: "1px solid #f1f5f9",
          backgroundColor: "#f8fafc",
          padding: "0.75rem 1.5rem",
          justifyContent: "space-between",
          fontSize: "0.74rem",
          fontWeight: 600
        }}>
          {[
            { n: 1, label: "Match Order" },
            { n: 2, label: "References" },
            { n: 3, label: "Count & Check" },
            { n: 4, label: "Review & Save" },
            { n: 5, label: "Print Labels" }
          ].map((s) => (
            <div key={s.n} style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              color: step === s.n ? "#210cae" : step > s.n ? "#10b981" : "#94a3b8"
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: "50%",
                backgroundColor: step === s.n ? "rgba(33,12,174,0.1)" : step > s.n ? "#d1fae5" : "#f1f5f9",
                border: step === s.n ? "1px solid #210cae" : "1px solid transparent",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem"
              }}>{step > s.n ? "✓" : s.n}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Content area */}
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", overflowY: "auto", flex: 1 }}>
          {error && (
            <div style={{ padding: "0.75rem 1rem", backgroundColor: "#fef2f2", borderLeft: "4px solid #ef4444", borderRadius: 6, fontSize: "0.8rem", color: "#991b1b" }}>
              {error}
            </div>
          )}

          {/* STEP 1: MATCH TO THE ORDER */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ padding: "1rem", backgroundColor: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", fontWeight: 700, color: "#1e293b" }}>PO Details</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.8rem", color: "#475569" }}>
                  <div><strong>Supplier:</strong> {purchaseOrder.supplier?.name}</div>
                  <div><strong>Target Site:</strong> {purchaseOrder.site?.name}</div>
                  <div><strong>Created By:</strong> {purchaseOrder.creator?.name}</div>
                  <div><strong>Order Date:</strong> {new Date(purchaseOrder.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.82rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Expected Items Checklist</h4>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "0.5rem 0", color: "#64748b" }}>Item Name / SKU</th>
                      <th style={{ padding: "0.5rem 0", color: "#64748b", textAlign: "center" }}>Ordered</th>
                      <th style={{ padding: "0.5rem 0", color: "#64748b", textAlign: "center" }}>Received</th>
                      <th style={{ padding: "0.5rem 0", color: "#64748b", textAlign: "right" }}>Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrder.items.map((pi: any) => {
                      const remaining = Math.max(0, pi.quantityOrdered - pi.quantityReceived);
                      return (
                        <tr key={pi.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "0.6rem 0" }}>
                            <strong>{pi.item.name}</strong>
                            <div style={{ fontSize: "0.68rem", color: "#94a3b8", fontFamily: "monospace" }}>SKU: {pi.item.sku} ({pi.item.category?.name})</div>
                          </td>
                          <td style={{ padding: "0.6rem 0", textAlign: "center", fontWeight: 600 }}>{pi.quantityOrdered}</td>
                          <td style={{ padding: "0.6rem 0", textAlign: "center", color: "#10b981" }}>{pi.quantityReceived}</td>
                          <td style={{ padding: "0.6rem 0", textAlign: "right", color: remaining > 0 ? "#dc2626" : "#64748b", fontWeight: 700 }}>{remaining}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 2: RECORD THE RECEIPT (REFERENCES) */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "0.5rem" }}>
                Please record the delivery metadata and supplier invoice details below. This creates the paper trail.
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Supplier Invoice Number</label>
                <input
                  type="text"
                  placeholder="e.g. INV-90024"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  style={{ padding: "0.5rem 0.65rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Delivery Note / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. DN-80124"
                  value={deliveryNoteRef}
                  onChange={(e) => setDeliveryNoteRef(e.target.value)}
                  style={{ padding: "0.5rem 0.65rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Attach Invoice Scan (Simulated File Reference)</label>
                <input
                  type="text"
                  placeholder="e.g. /uploads/invoices/inv-90024.pdf"
                  value={invoiceFileUrl}
                  onChange={(e) => setInvoiceFileUrl(e.target.value)}
                  style={{ padding: "0.5rem 0.65rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.82rem", outline: "none" }}
                />
              </div>
            </div>
          )}

          {/* STEP 3: COUNT & CHECK (TAILORED TO CATEGORY) */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ fontSize: "0.82rem", color: "#475569", padding: "0.5rem 0.75rem", backgroundColor: "#fffbeb", borderLeft: "4px solid #f59e0b", borderRadius: 4 }}>
                <strong>Tailored Quantity Entry</strong>: Consumables only require a raw count. Non-consumable (serialized) items require a unique serial number for each unit received.
              </div>

              {purchaseOrder.items.map((poItem: any) => {
                const isConsumable = poItem.item?.category?.type === "CONSUMABLE";
                const maxReceive = Math.max(0, poItem.quantityOrdered - poItem.quantityReceived);
                const itemState = receivedItems[poItem.itemId] || { quantityReceived: 0, serials: [] };

                return (
                  <div key={poItem.id} style={{
                    padding: "1rem", border: "1px solid #e2e8f0", borderRadius: 10,
                    backgroundColor: itemState.quantityReceived > 0 ? "rgba(33, 12, 174, 0.01)" : "#ffffff"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                      <div>
                        <strong style={{ fontSize: "0.85rem", color: "#0f172a" }}>{poItem.item.name}</strong>
                        <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                          SKU: {poItem.item.sku} • Category: <strong style={{ color: isConsumable ? "#b45309" : "#0369a1" }}>{poItem.item.category?.name} ({isConsumable ? "Consumable" : "Serialized"})</strong>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ fontSize: "0.74rem", color: "#64748b" }}>Qty Arrived:</span>
                        <input
                          type="number"
                          min="0"
                          max={maxReceive}
                          value={itemState.quantityReceived}
                          onChange={(e) => handleQtyChange(poItem.itemId, Math.min(maxReceive, Math.max(0, parseInt(e.target.value, 10) || 0)), isConsumable)}
                          style={{
                            width: "70px", padding: "0.3rem 0.4rem", borderRadius: 6,
                            border: "1px solid #cbd5e1", fontSize: "0.8rem", textAlign: "center", fontWeight: 700
                          }}
                        />
                        <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>/ max {maxReceive}</span>
                      </div>
                    </div>

                    {/* Serial Numbers inputs for NON_CONSUMABLES */}
                    {!isConsumable && itemState.quantityReceived > 0 && (
                      <div style={{
                        marginTop: "0.75rem", padding: "0.75rem", backgroundColor: "#f8fafc",
                        borderRadius: 8, border: "1px dashed #cbd5e1", display: "flex", flexDirection: "column", gap: "0.5rem"
                      }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Scan/Enter Serial Numbers ({itemState.quantityReceived})</span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                          {itemState.serials.map((serial, sIdx) => (
                            <div key={sIdx} style={{ position: "relative", display: "flex", alignItems: "center" }}>
                              <input
                                type="text"
                                placeholder={`Serial #${sIdx + 1}`}
                                value={serial}
                                onChange={(e) => handleSerialChange(poItem.itemId, sIdx, e.target.value)}
                                required
                                style={{
                                  width: "100%", padding: "0.35rem 0.5rem", borderRadius: 6,
                                  border: "1px solid #cbd5e1", fontSize: "0.78rem", outline: "none", backgroundColor: "#ffffff"
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 4: REVIEW & SAVE */}
          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ fontSize: "0.85rem", color: "#475569" }}>
                Please review the items and quantities before executing the stock update. This action is recorded in the system audit logs.
              </div>

              <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "0.75rem 1rem", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: "0.8rem", fontWeight: 700 }}>
                  Receiving Report Summary
                </div>
                <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8rem" }}>
                  <div><strong>Invoice Number:</strong> {invoiceNumber || <em style={{ color: "#cbd5e1" }}>None</em>}</div>
                  <div><strong>Delivery Note:</strong> {deliveryNoteRef || <em style={{ color: "#cbd5e1" }}>None</em>}</div>
                  <div><strong>Invoice Link:</strong> {invoiceFileUrl || <em style={{ color: "#cbd5e1" }}>None</em>}</div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Items Arriving</h4>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left", color: "#64748b" }}>
                      <th style={{ padding: "0.5rem 0" }}>Item Description</th>
                      <th style={{ padding: "0.5rem 0", textAlign: "center" }}>Qty Received</th>
                      <th style={{ padding: "0.5rem 0", textAlign: "right" }}>Type Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrder.items.map((pi: any) => {
                      const state = receivedItems[pi.itemId];
                      if (!state || state.quantityReceived <= 0) return null;
                      const isConsumable = pi.item?.category?.type === "CONSUMABLE";

                      return (
                        <tr key={pi.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "0.6rem 0" }}>
                            <strong>{pi.item.name}</strong>
                            <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>SKU: {pi.item.sku}</div>
                          </td>
                          <td style={{ padding: "0.6rem 0", textAlign: "center", fontWeight: 700, color: "#210cae" }}>{state.quantityReceived}</td>
                          <td style={{ padding: "0.6rem 0", textAlign: "right", color: "#475569" }}>
                            {isConsumable ? (
                              <span>Stock Addition</span>
                            ) : (
                              <span title={state.serials.join(", ")} style={{ fontSize: "0.72rem", color: "#0369a1", cursor: "help" }}>
                                {state.quantityReceived} Assets Serialized
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 5: SUCCESS & PRINT BARCODES */}
          {step === 5 && createdReport && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", alignItems: "center", textAlign: "center" }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%", backgroundColor: "#d1fae5",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981"
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>

              <div>
                <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>Stock Updated Instantly!</h4>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                  Receiving Report <strong>{createdReport.rrNumber}</strong> created successfully. Quantities on hand have been updated.
                </p>
              </div>

              {/* Barcode labels preview for printing */}
              {createdReport.assetsIntroduced && createdReport.assetsIntroduced.length > 0 && (
                <div style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 12, padding: "1rem", backgroundColor: "#f8fafc", textAlign: "left" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Generated Asset Labels ({createdReport.assetsIntroduced.length})</span>
                    <button
                      type="button"
                      onClick={handlePrintAllLabels}
                      style={{
                        padding: "0.3rem 0.65rem", borderRadius: 6, border: "none",
                        background: "#210cae", color: "#ffffff", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "0.25rem"
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                      Print All Labels
                    </button>
                  </div>

                  <div style={{
                    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                    gap: "0.5rem", maxHeight: "180px", overflowY: "auto", paddingRight: "0.25rem"
                  }}>
                    {createdReport.assetsIntroduced.map((asset: any) => {
                      const poItem = purchaseOrder.items.find((pi: any) => pi.itemId === asset.itemId);
                      const itemName = poItem?.item?.name || "Asset";
                      return (
                        <div key={asset.id} style={{
                          backgroundColor: "#ffffff", padding: "0.5rem", borderRadius: 8,
                          border: "1px dashed #cbd5e1", display: "flex", flexDirection: "column", gap: "0.15rem", position: "relative"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <code style={{ fontSize: "0.74rem", fontWeight: 700, color: "#210cae", fontFamily: "monospace" }}>{asset.tagCode}</code>
                            <button
                              onClick={() => handlePrintLabel(asset, itemName)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", padding: "2px" }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                            </button>
                          </div>
                          
                          {/* Hidden div holding full printing SVG */}
                          <div id={`barcode-rr-svg-${asset.id}`} style={{ display: "none" }}>
                            <Barcode text={asset.tagCode} height={35} showText={false} />
                          </div>

                          <div style={{ padding: "0.15rem", border: "1px solid #f1f5f9", borderRadius: 4, backgroundColor: "#f8fafc" }}>
                            <Barcode text={asset.tagCode} height={20} showText={false} />
                          </div>
                          <span style={{ fontSize: "0.58rem", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>SN: {asset.serialNumber}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: "flex",
          justifyContent: step === 5 ? "center" : "space-between",
          alignItems: "center",
          padding: "1rem 1.5rem",
          borderTop: "1px solid #e2e8f0",
          backgroundColor: "#f8fafc",
        }}>
          {step < 5 && (
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
          )}

          <div style={{ display: "flex", gap: "0.5rem" }}>
            {step > 1 && step < 5 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
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
                Back
              </button>
            )}

            {step === 1 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{
                  padding: "0.5rem 1.5rem",
                  borderRadius: 8,
                  border: "none",
                  background: "#210cae",
                  color: "#ffffff",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Match & Continue
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={validateStep2}
                style={{
                  padding: "0.5rem 1.5rem",
                  borderRadius: 8,
                  border: "none",
                  background: "#210cae",
                  color: "#ffffff",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Record References
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={validateStep3}
                style={{
                  padding: "0.5rem 1.5rem",
                  borderRadius: 8,
                  border: "none",
                  background: "#210cae",
                  color: "#ffffff",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Count & Verify
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{
                  padding: "0.5rem 1.75rem",
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
                Confirm Stock Update
              </button>
            )}

            {step === 5 && (
              <button
                type="button"
                onClick={handleWizardClose}
                style={{
                  padding: "0.55rem 2.25rem",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg, #210cae 0%, #4dc9e6 100%)",
                  color: "#ffffff",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(33,12,174,0.15)"
                }}
              >
                Close Wizard & Update View
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
