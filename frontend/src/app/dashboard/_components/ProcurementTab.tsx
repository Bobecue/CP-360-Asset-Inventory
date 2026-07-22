"use client";

import React, { useState, useEffect } from "react";
import { CatalogItem } from "@/types/dashboard";
import { POModal } from "./modals/POModal";
import { ReceivingWizardModal } from "./modals/ReceivingWizardModal";

interface ProcurementTabProps {
  isUsingMockData: boolean;
  sites: any[];
  categories: any[];
  catalogItems: CatalogItem[];
  currentUser: any;
}

export const ProcurementTab = ({
  isUsingMockData: globalMock,
  sites,
  categories,
  catalogItems,
  currentUser,
}: ProcurementTabProps) => {
  const [subTab, setSubTab] = useState<"pos" | "rrs">("pos");
  const [searchQuery, setSearchQuery] = useState("");
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [receivingReports, setReceivingReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isRrWizardOpen, setIsRrWizardOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState<any | null>(null);
  
  const [isRrDetailOpen, setIsRrDetailOpen] = useState(false);
  const [selectedRr, setSelectedRr] = useState<any | null>(null);

  // Scope tracking (Site filter)
  const [selectedSiteId, setSelectedSiteId] = useState(currentUser?.siteId || "");

  // Local mock store for POs and RRs
  const [localPOs, setLocalPOs] = useState<any[]>([]);
  const [localRRs, setLocalRRs] = useState<any[]>([]);

  useEffect(() => {
    if (sites.length > 0 && !selectedSiteId) {
      setSelectedSiteId(currentUser?.siteId || sites[0].id);
    }
  }, [sites, currentUser]);

  // Seed local mock data once on mount
  useEffect(() => {
    if (catalogItems.length === 0 || sites.length === 0) return;

    const defaultSite = sites[0];
    const defaultItem1 = catalogItems[0];
    const defaultItem2 = catalogItems[1] || defaultItem1;

    const initialPOs = [
      {
        id: "mock-po-seeded-1",
        poNumber: "PO-00001",
        status: "DRAFT",
        supplierId: "mock-sup-1",
        supplier: { name: "Dell Global Ltd." },
        siteId: defaultSite.id,
        site: defaultSite,
        creatorId: currentUser?.id || "mock-admin-id",
        creator: currentUser || { name: "Super Admin" },
        items: [
          {
            id: "mpoi-1",
            itemId: defaultItem1.id,
            item: defaultItem1,
            quantityOrdered: 5,
            quantityReceived: 0,
            unitCost: Number(defaultItem1.unitPrice) || 45000
          }
        ],
        createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
        updatedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
      },
      {
        id: "mock-po-seeded-2",
        poNumber: "PO-00002",
        status: "ORDERED",
        supplierId: "mock-sup-2",
        supplier: { name: "Apple Corporate" },
        siteId: defaultSite.id,
        site: defaultSite,
        creatorId: currentUser?.id || "mock-admin-id",
        creator: currentUser || { name: "Super Admin" },
        items: [
          {
            id: "mpoi-2",
            itemId: defaultItem2.id,
            item: defaultItem2,
            quantityOrdered: 3,
            quantityReceived: 1,
            unitCost: Number(defaultItem2.unitPrice) || 85000
          }
        ],
        createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(), // 5 days ago
        updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
      }
    ];

    const initialRRs = [
      {
        id: "mock-rr-seeded-1",
        rrNumber: "RR-00001",
        deliveryNoteRef: "DN-90122",
        invoiceNumber: "INV-80231",
        invoiceFileUrl: "/uploads/invoices/inv-80231.pdf",
        purchaseOrderId: "mock-po-seeded-2",
        purchaseOrder: { poNumber: "PO-00002" },
        siteId: defaultSite.id,
        site: defaultSite,
        receivedById: currentUser?.id || "mock-admin-id",
        receivedBy: currentUser || { name: "Super Admin" },
        receivedItems: [
          {
            id: "mrri-1",
            itemId: defaultItem2.id,
            item: defaultItem2,
            quantityReceived: 1
          }
        ],
        assetsIntroduced: [
          {
            id: "mass-1",
            serialNumber: "SN-APP-IPHONE-9012",
            tagCode: `${defaultSite.prefix}-${defaultItem2.category?.prefix || "EQP"}-0001`,
            status: "AVAILABLE",
            condition: "GOOD"
          }
        ],
        createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString() // 2 days ago
      }
    ];

    setLocalPOs(initialPOs);
    setLocalRRs(initialRRs);
  }, [catalogItems, sites]);

  const fetchProcurementData = async () => {
    if (!selectedSiteId) return;
    setIsLoading(true);
    setError(null);

    if (globalMock) {
      // Filter mock data locally by siteId
      const filteredPOs = localPOs.filter(po => po.siteId === selectedSiteId);
      const filteredRRs = localRRs.filter(rr => rr.siteId === selectedSiteId);
      setPurchaseOrders(filteredPOs);
      setReceivingReports(filteredRRs);
      setIsLoading(false);
    } else {
      try {
        const poRes = await fetch(`http://localhost:3001/purchase-orders?siteId=${selectedSiteId}`);
        const rrRes = await fetch(`http://localhost:3001/receiving-reports?siteId=${selectedSiteId}`);
        
        if (poRes.ok && rrRes.ok) {
          const poData = await poRes.json();
          const rrData = await rrRes.json();
          setPurchaseOrders(poData);
          setReceivingReports(rrData);
        } else {
          // Fallback to local mock data if endpoints aren't completely online
          const filteredPOs = localPOs.filter(po => po.siteId === selectedSiteId);
          const filteredRRs = localRRs.filter(rr => rr.siteId === selectedSiteId);
          setPurchaseOrders(filteredPOs);
          setReceivingReports(filteredRRs);
        }
      } catch (err: any) {
        console.warn("Backend error fetching procurement data, falling back to offline simulation data.");
        const filteredPOs = localPOs.filter(po => po.siteId === selectedSiteId);
        const filteredRRs = localRRs.filter(rr => rr.siteId === selectedSiteId);
        setPurchaseOrders(filteredPOs);
        setReceivingReports(filteredRRs);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProcurementData();
  }, [selectedSiteId, localPOs, localRRs, globalMock]);

  const handlePlaceOrder = async (id: string) => {
    setError(null);
    if (globalMock) {
      setLocalPOs(prev =>
        prev.map(po => (po.id === id ? { ...po, status: "ORDERED", updatedAt: new Date().toISOString() } : po))
      );
    } else {
      try {
        const res = await fetch(`http://localhost:3001/purchase-orders/${id}/place`, {
          method: "POST"
        });
        if (res.ok) {
          fetchProcurementData();
        } else {
          // Local fallback
          setLocalPOs(prev =>
            prev.map(po => (po.id === id ? { ...po, status: "ORDERED", updatedAt: new Date().toISOString() } : po))
          );
        }
      } catch (err) {
        setLocalPOs(prev =>
          prev.map(po => (po.id === id ? { ...po, status: "ORDERED", updatedAt: new Date().toISOString() } : po))
        );
      }
    }
  };

  const handleAddMockPO = (po: any) => {
    setLocalPOs(prev => [po, ...prev]);
  };

  const handleAddMockRR = (rr: any) => {
    setLocalRRs(prev => [rr, ...prev]);
    // Also update PO status and items received count in local mock POs list
    setLocalPOs(prevPOs =>
      prevPOs.map(po => {
        if (po.id === rr.purchaseOrderId) {
          const updatedItems = po.items.map((pi: any) => {
            const receivedLine = rr.receivedItems.find((rri: any) => rri.itemId === pi.itemId);
            const additionalReceived = receivedLine ? receivedLine.quantityReceived : 0;
            return {
              ...pi,
              quantityReceived: pi.quantityReceived + additionalReceived
            };
          });
          
          const allReceived = updatedItems.every((pi: any) => pi.quantityReceived >= pi.quantityOrdered);
          return {
            ...po,
            items: updatedItems,
            status: allReceived ? "RECEIVED" : "PARTIALLY_RECEIVED",
            updatedAt: new Date().toISOString()
          };
        }
        return po;
      })
    );
  };

  const handleProcessReceipt = (po: any) => {
    setSelectedPo(po);
    setIsRrWizardOpen(true);
  };

  const handleShowRrDetail = (rr: any) => {
    setSelectedRr(rr);
    setIsRrDetailOpen(true);
  };

  const filteredPOs = purchaseOrders.filter((po) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const poNum = (po.poNumber || "").toLowerCase();
    const supplierName = (po.supplier?.name || "").toLowerCase();
    const creatorName = (po.creator?.name || "").toLowerCase();
    return poNum.includes(q) || supplierName.includes(q) || creatorName.includes(q);
  });

  const filteredRRs = receivingReports.filter((rr) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const rrNum = (rr.rrNumber || "").toLowerCase();
    const invNum = (rr.supplierInvoiceNumber || "").toLowerCase();
    const poNum = (rr.purchaseOrder?.poNumber || "").toLowerCase();
    const recName = (rr.receiver?.name || "").toLowerCase();
    return rrNum.includes(q) || invNum.includes(q) || poNum.includes(q) || recName.includes(q);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Banner and Filter */}
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
        {/* Sub-tab Swapper */}
        <div style={{
          display: "inline-flex",
          backgroundColor: "#f1f5f9",
          padding: "3px",
          borderRadius: "10px",
          border: "1px solid #e2e8f0"
        }}>
          <button
            onClick={() => setSubTab("pos")}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "8px",
              border: "none",
              background: subTab === "pos" ? "#ffffff" : "transparent",
              color: subTab === "pos" ? "#210cae" : "#64748b",
              fontWeight: 600,
              fontSize: "0.8rem",
              cursor: "pointer",
              boxShadow: subTab === "pos" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            📋 Purchase Orders
          </button>
          <button
            onClick={() => setSubTab("rrs")}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "8px",
              border: "none",
              background: subTab === "rrs" ? "#ffffff" : "transparent",
              color: subTab === "rrs" ? "#210cae" : "#64748b",
              fontWeight: 600,
              fontSize: "0.8rem",
              cursor: "pointer",
              boxShadow: subTab === "rrs" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            🚚 Receiving Logs
          </button>
        </div>

        {/* Filters and Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Search Bar */}
          <div style={{ position: "relative", minWidth: "220px" }}>
            <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              type="text"
              placeholder={subTab === "pos" ? "Search PO #, supplier..." : "Search RR #, invoice #..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-glow"
              style={{
                width: "100%",
                padding: "0.45rem 0.75rem 0.45rem 1.85rem",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: "0.8rem",
                color: "#1e293b",
                outline: "none",
                backgroundColor: "#ffffff",
              }}
            />
          </div>

          {/* Site Selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              style={{
                padding: "0.45rem 0.65rem",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: "0.8rem",
                color: "#475569",
                backgroundColor: "#ffffff",
                outline: "none",
              }}
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  Scope: {s.name} ({s.prefix})
                </option>
              ))}
            </select>
          </div>

          {subTab === "pos" && (
            <button
              onClick={() => setIsPoModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "linear-gradient(135deg, #210cae 0%, #4dc9e6 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                padding: "0.5rem 1.1rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(33,12,174,0.15)",
                transition: "transform 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Create Draft PO
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: 12,
        boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
        padding: "1.25rem",
        minHeight: "260px"
      }}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 0", gap: "1rem" }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              border: "3px solid #e2e8f0", borderTopColor: "#210cae",
              animation: "spin 1s linear infinite",
            }} />
            <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Loading records...</span>
          </div>
        ) : subTab === "pos" ? (
          /* PURCHASE ORDERS SUB-TAB */
          filteredPOs.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 1rem", textAlign: "center" }}>
              <span style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📋</span>
              <h4 style={{ fontSize: "0.88rem", fontWeight: 600, color: "#3f3f46", margin: "0 0 0.25rem 0" }}>No Purchase Orders Found</h4>
              <p style={{ fontSize: "0.76rem", color: "#71717a", maxWidth: 280, margin: 0 }}>
                {searchQuery ? "No purchase orders match your search query." : "Click \"Create Draft PO\" to draft a new purchasing shipment for this site."}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>PO Number</th>
                    <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Supplier</th>
                    <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Date Created</th>
                    <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Creator</th>
                    <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600, textAlign: "center" }}>Fulfillment</th>
                    <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600, textAlign: "center" }}>Status</th>
                    <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPOs.map((po, index) => {
                    const itemsList = po.items || [];
                    const totalOrdered = itemsList.reduce((sum: number, i: any) => sum + i.quantityOrdered, 0);
                    const totalReceived = itemsList.reduce((sum: number, i: any) => sum + i.quantityReceived, 0);
                    const isDraft = po.status === "DRAFT";
                    const isOrdered = po.status === "ORDERED";
                    const isPartiallyReceived = po.status === "PARTIALLY_RECEIVED";
                    const isReceived = po.status === "RECEIVED";

                    let statusColor = "#64748b", statusBg = "#f1f5f9";
                    if (isOrdered) { statusColor = "#3b82f6"; statusBg = "#eff6ff"; }
                    else if (isPartiallyReceived) { statusColor = "#f59e0b"; statusBg = "#fffbeb"; }
                    else if (isReceived) { statusColor = "#10b981"; statusBg = "#d1fae5"; }

                    return (
                      <tr key={po.id} 
                        className="animated-row"
                        style={{ borderBottom: "1px solid #f8fafc", animationDelay: `${index * 0.04}s` }}>
                        <td style={{ padding: "0.75rem 0.5rem", color: "#210cae", fontWeight: 700 }}>{po.poNumber}</td>
                        <td style={{ padding: "0.75rem 0.5rem", color: "#1e293b", fontWeight: 600 }}>{po.supplier?.name}</td>
                        <td style={{ padding: "0.75rem 0.5rem", color: "#64748b" }}>{new Date(po.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: "0.75rem 0.5rem", color: "#64748b" }}>{po.creator?.name}</td>
                        <td style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>
                          <span style={{ fontSize: "0.74rem", fontWeight: 600 }}>{totalReceived} / {totalOrdered} received</span>
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>
                          <span style={{
                            display: "inline-block", padding: "0.15rem 0.5rem", borderRadius: 6,
                            fontSize: "0.7rem", fontWeight: 700, color: statusColor, backgroundColor: statusBg
                          }}>
                            {po.status}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                            {isDraft && (
                              <button
                                onClick={() => handlePlaceOrder(po.id)}
                                style={{
                                  padding: "0.3rem 0.65rem", borderRadius: 6, border: "1px solid #3b82f6",
                                  backgroundColor: "#eff6ff", color: "#2563eb", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer"
                                }}
                              >
                                Place Order
                              </button>
                            )}
                            {(isOrdered || isPartiallyReceived) && (
                              <button
                                onClick={() => handleProcessReceipt(po)}
                                style={{
                                  padding: "0.3rem 0.65rem", borderRadius: 6, border: "none",
                                  backgroundColor: "#210cae", color: "#ffffff", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
                                  boxShadow: "0 1px 2px rgba(33,12,174,0.1)"
                                }}
                              >
                                Process Receipt
                              </button>
                            )}
                            {isReceived && (
                              <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 600, paddingRight: "0.5rem" }}>✓ Closed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* RECEIVING LOGS SUB-TAB */
          filteredRRs.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 1rem", textAlign: "center" }}>
              <span style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🚚</span>
              <h4 style={{ fontSize: "0.88rem", fontWeight: 600, color: "#3f3f46", margin: "0 0 0.25rem 0" }}>No Receiving Reports Found</h4>
              <p style={{ fontSize: "0.76rem", color: "#71717a", maxWidth: 280, margin: 0 }}>
                {searchQuery ? "No receiving reports match your search query." : "Historical logs will populate here once orders are processed through the receiving wizard."}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>RR Number</th>
                    <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>PO Reference</th>
                    <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Invoice Number</th>
                    <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Delivery Note</th>
                    <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Received By</th>
                    <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Date Received</th>
                    <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRRs.map((rr, index) => (
                    <tr key={rr.id} 
                      className="animated-row"
                      style={{ borderBottom: "1px solid #f8fafc", animationDelay: `${index * 0.04}s` }}>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 700, color: "#1e293b" }}>{rr.rrNumber}</td>
                      <td style={{ padding: "0.75rem 0.5rem", color: "#64748b" }}>{rr.purchaseOrder?.poNumber}</td>
                      <td style={{ padding: "0.75rem 0.5rem", color: "#1e293b", fontWeight: 600 }}>{rr.invoiceNumber || "N/A"}</td>
                      <td style={{ padding: "0.75rem 0.5rem", color: "#64748b" }}>{rr.deliveryNoteRef || "N/A"}</td>
                      <td style={{ padding: "0.75rem 0.5rem", color: "#64748b" }}>{rr.receivedBy?.name}</td>
                      <td style={{ padding: "0.75rem 0.5rem", color: "#64748b" }}>{new Date(rr.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                        <button
                          onClick={() => handleShowRrDetail(rr)}
                          style={{
                            padding: "0.3rem 0.65rem", borderRadius: 6, border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff", color: "#475569", fontSize: "0.72rem", fontWeight: 500, cursor: "pointer"
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* DRAFT PO CREATION MODAL */}
      <POModal
        isOpen={isPoModalOpen}
        onClose={() => setIsPoModalOpen(false)}
        onSuccess={fetchProcurementData}
        sites={sites}
        catalogItems={catalogItems}
        currentUser={currentUser}
        isUsingMockData={globalMock}
        onAddMockPO={handleAddMockPO}
      />

      {/* RECEIVING WIZARD MODAL */}
      {selectedPo && (
        <ReceivingWizardModal
          isOpen={isRrWizardOpen}
          onClose={() => {
            setIsRrWizardOpen(false);
            setSelectedPo(null);
          }}
          onSuccess={fetchProcurementData}
          purchaseOrder={selectedPo}
          currentUser={currentUser}
          isUsingMockData={globalMock}
          onAddMockRR={handleAddMockRR}
        />
      )}

      {/* HISTORICAL RR DETAILS MODAL */}
      {isRrDetailOpen && selectedRr && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100
        }}>
          <div style={{
            width: "92%", maxWidth: "500px", backgroundColor: "#ffffff", borderRadius: "16px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid #e2e8f0"
          }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.02rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Receiving Report Details</h3>
              <button
                onClick={() => { setIsRrDetailOpen(false); setSelectedRr(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto", maxHeight: "60vh" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.8rem", backgroundColor: "#f8fafc", padding: "0.85rem", borderRadius: 10 }}>
                <div><strong>RR Number:</strong> {selectedRr.rrNumber}</div>
                <div><strong>PO Ref:</strong> {selectedRr.purchaseOrder?.poNumber}</div>
                <div><strong>Invoice #:</strong> {selectedRr.invoiceNumber || "N/A"}</div>
                <div><strong>Delivery Note:</strong> {selectedRr.deliveryNoteRef || "N/A"}</div>
                <div style={{ gridColumn: "span 2" }}><strong>Received By:</strong> {selectedRr.receivedBy?.name}</div>
                <div style={{ gridColumn: "span 2" }}><strong>Date Received:</strong> {new Date(selectedRr.createdAt).toLocaleString()}</div>
              </div>

              <div>
                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Received Items</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {selectedRr.receivedItems?.map((ri: any) => (
                    <div key={ri.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem", fontSize: "0.8rem" }}>
                      <div>
                        <strong>{ri.item?.name}</strong>
                        <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>SKU: {ri.item?.sku}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: "#210cae" }}>+{ri.quantityReceived} units</div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRr.assetsIntroduced && selectedRr.assetsIntroduced.length > 0 && (
                <div>
                  <h4 style={{ margin: "0.5rem 0 0.5rem 0", fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Registered Serialized Assets</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", maxHeight: "150px", overflowY: "auto" }}>
                    {selectedRr.assetsIntroduced.map((asset: any) => (
                      <div key={asset.id} style={{ padding: "0.45rem", border: "1px solid #e2e8f0", borderRadius: 8, backgroundColor: "#f8fafc", fontSize: "0.74rem" }}>
                        <div style={{ fontWeight: 700, color: "#210cae", fontFamily: "monospace" }}>{asset.tagCode}</div>
                        <div style={{ fontSize: "0.64rem", color: "#64748b" }}>SN: {asset.serialNumber}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #e2e8f0", backgroundColor: "#f8fafc", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => { setIsRrDetailOpen(false); setSelectedRr(null); }}
                style={{ padding: "0.5rem 1.25rem", borderRadius: 8, border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#475569", fontSize: "0.8rem", fontWeight: 500, cursor: "pointer" }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
