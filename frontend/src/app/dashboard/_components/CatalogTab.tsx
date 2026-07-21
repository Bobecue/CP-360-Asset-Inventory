"use client";

import { useState } from "react";
import { CatalogItem } from "@/types/dashboard";
import { getCategoryIcon } from "@/types/dashboard";

interface CatalogTabProps {
  isUsingMockData: boolean;
  catalogItems: CatalogItem[];
  sites: any[];
  categories: any[];
  selectedSiteId: string;
  setSelectedSiteId: (s: string) => void;
  catalogSearch: string;
  setCatalogSearch: (s: string) => void;
  catalogCategoryFilter: string;
  setCatalogCategoryFilter: (s: string) => void;
  catalogStockFilter: string;
  setCatalogStockFilter: (s: string) => void;
  catalogViewMode: "list" | "grid";
  setCatalogViewMode: (m: "list" | "grid") => void;
  catalogSortKey: string;
  setCatalogSortKey: (s: string) => void;
  selectedItemIds: string[];
  filteredItems: CatalogItem[];
  isLoadingItems: boolean;
  onToggleSelectItem: (id: string, isMultiSelectMode?: boolean) => void;
  onToggleSelectAll: () => void;
  onClearSelection?: () => void;
  onExportCSV: () => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (item: CatalogItem) => void;
  onOpenStockModal: (item: CatalogItem) => void;
  onOpenViewTags: (item: CatalogItem) => void;
  onDeleteTarget: (type: "item" | "bulk_items", id: string, name: string) => void;
  onOpenHistoryModal: (item: CatalogItem) => void;
  onOpenScanModal?: () => void;
  currentUser: any;
  onOpenBulkRequestModal: () => void;
}

export const CatalogTab = ({
  isUsingMockData,
  catalogItems,
  sites,
  categories,
  selectedSiteId,
  setSelectedSiteId,
  catalogSearch,
  setCatalogSearch,
  catalogCategoryFilter,
  setCatalogCategoryFilter,
  catalogStockFilter,
  setCatalogStockFilter,
  catalogViewMode,
  setCatalogViewMode,
  catalogSortKey,
  setCatalogSortKey,
  selectedItemIds,
  filteredItems,
  isLoadingItems,
  onToggleSelectItem,
  onToggleSelectAll,
  onClearSelection,
  onExportCSV,
  onOpenAddModal,
  onOpenEditModal,
  onOpenStockModal,
  onOpenViewTags,
  onDeleteTarget,
  onOpenHistoryModal,
  onOpenScanModal,
  currentUser,
  onOpenBulkRequestModal,
}: CatalogTabProps) => {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const filteredIds = filteredItems.map((it) => it.id);
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedItemIds.includes(id));
  const canEditAddRemove = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN" || currentUser?.role === "INVENTORY_STAFF";
  const canAdjustStock = canEditAddRemove;

  // Show selection circles ONLY when explicit multi-select mode is active
  const showCircles = isMultiSelectMode;

  const toggleMultiSelectMode = () => {
    if (isMultiSelectMode) {
      // Exit multi select mode and clear selections if active
      setIsMultiSelectMode(false);
      if (onClearSelection) {
        onClearSelection();
      } else if (allSelected) {
        onToggleSelectAll();
      }
    } else {
      // Enter multi select mode
      setIsMultiSelectMode(true);
    }
  };

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
            <strong>Offline Simulation Mode:</strong> The NestJS backend database connection is unreachable. The application is running using safe client-side data. New items will be created in temporary local storage.
          </div>
        </div>
      )}

      {/* Items Summary Cards */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {[
          {
            title: "Total Catalog Items",
            value: catalogItems.length,
            desc: "Configured catalog SKUs",
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 20.73 7 12 12 3.27 7" fill="rgba(33, 12, 174, 0.15)" stroke="none" />
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            )
          },
          {
            title: "Consumable Items",
            value: catalogItems.filter(it => it.category?.type === "CONSUMABLE").length,
            desc: "Non-serialized items",
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" fill="rgba(33, 12, 174, 0.15)" />
              </svg>
            )
          },
          {
            title: "Non-Consumable Items",
            value: catalogItems.filter(it => it.category?.type === "NON_CONSUMABLE").length,
            desc: "Serialized assets",
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" fill="rgba(33, 12, 174, 0.15)" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            )
          },
          {
            title: "Low Stock / Out of Stock",
            value: catalogItems.filter(it => {
              const stock = it.stockLevels?.find(sl => sl.siteId === selectedSiteId);
              const qty = stock ? stock.quantity : 0;
              const min = stock ? stock.reorderPoint : 5;
              return qty <= min;
            }).length,
            desc: "At selected site",
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="rgba(239, 68, 68, 0.1)" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
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
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
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
          {/* Site Scope Selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "160px" }}>
            <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Viewing Stock At</label>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              style={{
                padding: "0.45rem 0.65rem",
                borderRadius: 6,
                border: "1px solid #e2e8f0",
                fontSize: "0.8rem",
                color: "#475569",
                backgroundColor: "#ffffff",
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

          {/* Search */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: "200px" }}>
            <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Search Item</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                type="text"
                placeholder="Search Asset Tag, Name, Description..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="search-glow"
                style={{
                  width: "100%",
                  padding: "0.45rem 2.2rem 0.45rem 1.85rem",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  fontSize: "0.8rem",
                  color: "#1e293b",
                  outline: "none",
                }}
              />
              {onOpenScanModal && (
                <button
                  type="button"
                  onClick={onOpenScanModal}
                  title="Scan Barcode / Tag Code"
                  style={{
                    position: "absolute",
                    right: 6,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#475569",
                    padding: "4px",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "150px" }}>
            <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Category</label>
            <select
              value={catalogCategoryFilter}
              onChange={(e) => setCatalogCategoryFilter(e.target.value)}
              style={{
                padding: "0.45rem 0.65rem",
                borderRadius: 6,
                border: "1px solid #e2e8f0",
                fontSize: "0.8rem",
                color: "#475569",
                backgroundColor: "#ffffff",
                outline: "none",
              }}
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "130px" }}>
            <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Stock Status</label>
            <select
              value={catalogStockFilter}
              onChange={(e) => setCatalogStockFilter(e.target.value)}
              style={{
                padding: "0.45rem 0.65rem",
                borderRadius: 6,
                border: "1px solid #e2e8f0",
                fontSize: "0.8rem",
                color: "#475569",
                backgroundColor: "#ffffff",
                outline: "none",
              }}
            >
              <option value="ALL">All Levels</option>
              <option value="LOW_STOCK">Low Stock Warning</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>

          {/* Sort Order Selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: "150px" }}>
            <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Sort By</label>
            <select
              value={catalogSortKey}
              onChange={(e) => setCatalogSortKey(e.target.value)}
              style={{
                padding: "0.45rem 0.65rem",
                borderRadius: 6,
                border: "1px solid #e2e8f0",
                fontSize: "0.8rem",
                color: "#475569",
                backgroundColor: "#ffffff",
                outline: "none",
              }}
            >
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="price_asc">Price (Low to High)</option>
              <option value="price_desc">Price (High to Low)</option>
              <option value="stock_asc">Stock Level (Low to High)</option>
              <option value="stock_desc">Stock Level (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Action buttons (Add, CSV Export, Toggle View Mode) */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem" }}>
          {/* List/Grid view toggle */}
          <div style={{
            display: "inline-flex",
            backgroundColor: "#f1f5f9",
            padding: "2px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            marginRight: "0.5rem"
          }}>
            <button
              onClick={() => setCatalogViewMode("list")}
              style={{
                padding: "0.35rem 0.65rem",
                borderRadius: "6px",
                border: "none",
                background: catalogViewMode === "list" ? "#ffffff" : "transparent",
                color: catalogViewMode === "list" ? "#210cae" : "#64748b",
                fontWeight: 600,
                fontSize: "0.74rem",
                cursor: "pointer",
                boxShadow: catalogViewMode === "list" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                transition: "all 0.15s ease",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
              List
            </button>
            <button
              onClick={() => setCatalogViewMode("grid")}
              style={{
                padding: "0.35rem 0.65rem",
                borderRadius: "6px",
                border: "none",
                background: catalogViewMode === "grid" ? "#ffffff" : "transparent",
                color: catalogViewMode === "grid" ? "#210cae" : "#64748b",
                fontWeight: 600,
                fontSize: "0.74rem",
                cursor: "pointer",
                boxShadow: catalogViewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                transition: "all 0.15s ease",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
              Grid
            </button>
          </div>

          <button
            onClick={onExportCSV}
            style={{
              padding: "0.5rem 0.85rem",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#475569",
              fontSize: "0.82rem",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#ffffff"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Export CSV
          </button>

          {canEditAddRemove && (
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
              Add Asset
            </button>
          )}
        </div>
      </div>

      {/* Catalog Listing Card */}
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: 12,
        boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
        padding: "1.25rem 1.5rem 1.5rem",
        overflow: "hidden"
      }}>
        {/* Upper Left Multi-Select Trigger Button Header (Exact Red Dot Position) */}
        {!isLoadingItems && filteredItems.length > 0 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}>
            <button
              type="button"
              onClick={toggleMultiSelectMode}
              title={showCircles ? "Exit Multi-Select Mode" : "Enable Multi-Select Mode"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.45rem 0.85rem",
                borderRadius: 8,
                border: showCircles ? "2px solid #210cae" : "1px solid #cbd5e1",
                backgroundColor: showCircles ? "#f0f4fe" : "#ffffff",
                color: showCircles ? "#210cae" : "#475569",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: showCircles ? "0 2px 6px rgba(33,12,174,0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!showCircles) {
                  e.currentTarget.style.borderColor = "#210cae";
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                  e.currentTarget.style.color = "#210cae";
                }
              }}
              onMouseLeave={(e) => {
                if (!showCircles) {
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.backgroundColor = "#ffffff";
                  e.currentTarget.style.color = "#475569";
                }
              }}
            >
              <div style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                border: showCircles ? "2px solid #210cae" : "2px solid #94a3b8",
                backgroundColor: showCircles ? "#210cae" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}>
                {showCircles && (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span>{showCircles ? `Multi-Select Active (${selectedItemIds.length})` : "Select Multiple"}</span>
            </button>
          </div>
        )}

        {isLoadingItems ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 0", gap: "1rem" }}>
            <div style={{
              width: 28, height: 28,
              borderRadius: "50%",
              border: "3px solid #e2e8f0",
              borderTopColor: "#210cae",
              animation: "spin 1s linear infinite",
            }} />
            <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 500 }}>Fetching catalog records...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 1rem", textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", marginBottom: "0.75rem" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
            </div>
            <h4 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#3f3f46", margin: "0 0 0.25rem 0" }}>No Assets Found</h4>
            <p style={{ fontSize: "0.78rem", color: "#71717a", maxWidth: 280, margin: 0 }}>
              {catalogItems.length === 0 ? "No inventory assets created. Click 'Add Asset' to start cataloging product stock." : "No records match your active category, stock status, or search filters."}
            </p>
          </div>
        ) : catalogViewMode === "list" ? (
          /* List table layout */
          <div style={{ overflowX: "auto" }}>
            {/* Bulk select action banner bar - Enabled ONLY when explicit multi-select mode is active */}
            {isMultiSelectMode && selectedItemIds.length > 0 && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#f0f4fe",
                borderRadius: "10px",
                padding: "0.75rem 1rem",
                marginBottom: "1.25rem",
                border: "1px solid #c7d2fe",
                boxShadow: "0 2px 8px rgba(33, 12, 174, 0.06)",
                animation: "fadeIn 0.2s ease-in-out",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    backgroundColor: "#210cae",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                  }}>
                    {selectedItemIds.length}
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e1b4b" }}>
                    {selectedItemIds.length} {selectedItemIds.length === 1 ? "Asset" : "Assets"} Selected
                  </span>
                  {selectedItemIds.length < filteredItems.length && (
                    <button
                      onClick={onToggleSelectAll}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        backgroundColor: "#ffffff",
                        border: "1px solid #c7d2fe",
                        borderRadius: "7px",
                        color: "#210cae",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        padding: "0.35rem 0.65rem",
                        cursor: "pointer",
                        boxShadow: "0 1px 2px rgba(33,12,174,0.05)",
                        transition: "all 0.15s ease",
                        marginLeft: "0.5rem",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e0e7ff"; e.currentTarget.style.borderColor = "#818cf8"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; e.currentTarget.style.borderColor = "#c7d2fe"; }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 11 12 14 22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                      Select All Visible ({filteredItems.length})
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (onClearSelection) {
                        onClearSelection();
                      } else if (allSelected) {
                        onToggleSelectAll();
                      }
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "7px",
                      color: "#64748b",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      padding: "0.35rem 0.65rem",
                      cursor: "pointer",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      transition: "all 0.15s ease",
                      marginLeft: "0.35rem",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; e.currentTarget.style.color = "#0f172a"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; e.currentTarget.style.color = "#64748b"; }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Clear Selection
                  </button>
                </div>

                <div style={{ display: "flex", gap: "0.65rem", alignItems: "center" }}>
                  {(() => {
                    const canDeploy = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "INVENTORY_STAFF" || currentUser?.role === "OPS_MANAGER";
                    return (
                      <button
                        onClick={onOpenBulkRequestModal}
                        className="btn-hover-effect"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.45rem",
                          background: canDeploy ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" : "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                          border: "none",
                          borderRadius: "8px",
                          color: "#ffffff",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          padding: "0.45rem 1rem",
                          cursor: "pointer",
                          boxShadow: canDeploy ? "0 2px 6px rgba(37, 99, 235, 0.25)" : "0 2px 6px rgba(124, 58, 237, 0.25)",
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = canDeploy ? "0 4px 12px rgba(37, 99, 235, 0.35)" : "0 4px 12px rgba(124, 58, 237, 0.35)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = canDeploy ? "0 2px 6px rgba(37, 99, 235, 0.25)" : "0 2px 6px rgba(124, 58, 237, 0.25)";
                        }}
                      >
                        {canDeploy ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="20" y1="8" x2="20" y2="14"></line>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                          </svg>
                        ) : (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                          </svg>
                        )}
                        {canDeploy ? `Deploy Asset (${selectedItemIds.length})` : `Request Selected (${selectedItemIds.length})`}
                      </button>
                    );
                  })()}

                  {canEditAddRemove && (
                    <button
                      onClick={() => onDeleteTarget("bulk_items", "bulk", "Selected Items")}
                      className="btn-hover-effect"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        backgroundColor: "#ffffff",
                        border: "1px solid #fecaca",
                        borderRadius: "8px",
                        color: "#dc2626",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        padding: "0.45rem 1rem",
                        cursor: "pointer",
                        boxShadow: "0 1px 3px rgba(220, 38, 38, 0.08)",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#fef2f2";
                        e.currentTarget.style.borderColor = "#f87171";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#ffffff";
                        e.currentTarget.style.borderColor = "#fecaca";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Delete Selected ({selectedItemIds.length})
                    </button>
                  )}
                </div>
              </div>
            )}

            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "0.6rem 0.5rem", width: "44px", textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={onToggleSelectAll}
                      title={allSelected ? "Deselect All" : "Select All"}
                      aria-label="Select All Items"
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: allSelected ? "2px solid #210cae" : "2px solid #94a3b8",
                        backgroundColor: allSelected ? "#210cae" : "transparent",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        transition: "all 0.2s ease",
                        outline: "none",
                      }}
                    >
                      {allSelected && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  </th>
                  <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Asset / SKU</th>
                  <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Category</th>
                  <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Category Type</th>
                  <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Unit Price</th>
                  <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600 }}>Stock Level</th>
                  <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600, textAlign: "right" }}>Lead Time</th>
                  <th style={{ padding: "0.6rem 0.5rem", color: "#64748b", fontWeight: 600, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((it, index) => {
                  const siteStock = it.stockLevels?.find(sl => sl.siteId === selectedSiteId);
                  const quantity = siteStock ? siteStock.quantity : 0;
                  const reorderPt = siteStock ? siteStock.reorderPoint : 5;
                  const isSelected = selectedItemIds.includes(it.id);

                  let stockColor = "#10b981", bg = "#d1fae5";
                  if (quantity === 0) {
                    stockColor = "#ef4444"; bg = "#fee2e2";
                  } else if (quantity <= reorderPt) {
                    stockColor = "#f59e0b"; bg = "#fffbeb";
                  }

                  const isConsumable = it.category?.type === "CONSUMABLE";

                  return (
                    <tr key={it.id}
                      className="animated-row"
                      style={{
                        borderBottom: "1px solid #f8fafc",
                        transition: "background-color 0.15s",
                        backgroundColor: isSelected ? "rgba(33, 12, 174, 0.04)" : "transparent",
                        animationDelay: `${index * 0.04}s`,
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "#fafafa"; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      <td style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelectItem(it.id, showCircles);
                          }}
                          aria-label={`Select ${it.name}`}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: isSelected ? "2px solid #210cae" : "2px solid #cbd5e1",
                            backgroundColor: isSelected ? "#210cae" : "#ffffff",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            transition: "all 0.2s ease",
                            boxShadow: isSelected ? "0 2px 5px rgba(33,12,174,0.3)" : "none",
                            outline: "none",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = "#210cae";
                              e.currentTarget.style.backgroundColor = "#f0f4fe";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = "#cbd5e1";
                              e.currentTarget.style.backgroundColor = "#ffffff";
                            }
                          }}
                        >
                          {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", color: "#1e293b" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                          <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{it.name}</span>
                          <span style={{ fontSize: "0.68rem", color: "#64748b", fontFamily: "monospace" }}>SKU: {it.sku}</span>
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", color: "#64748b" }}>{it.category?.name || "Uncategorized"}</td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "0.15rem 0.4rem",
                          borderRadius: 6,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          backgroundColor: isConsumable ? "#fff3c7" : "#e0f2fe",
                          color: isConsumable ? "#b45309" : "#0369a1",
                        }}>
                          {isConsumable ? "Consumable" : "Non-Consumable"}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 700 }}>
                        ₱{(it.unitPrice || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <span style={{
                            display: "inline-block",
                            padding: "0.15rem 0.45rem",
                            borderRadius: 6,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            backgroundColor: bg,
                            color: stockColor,
                          }}>
                            {quantity}
                          </span>
                          <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>min {reorderPt}</span>
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", color: "#64748b", textAlign: "right" }}>{it.leadTimeDays} {it.leadTimeDays === 1 ? "day" : "days"}</td>
                      <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden", backgroundColor: "#ffffff", boxShadow: "0 1px 2px rgba(15,23,42,0.02)" }}>
                          {[
                            {
                              title: "Adjust stock levels",
                              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
                              onClick: () => onOpenStockModal(it),
                              color: "#475569",
                              hoverBg: "#f1f5f9",
                              show: canAdjustStock
                            },
                            {
                              title: "View Asset Tags",
                              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><circle cx="7" cy="7" r="1" /></svg>,
                              onClick: () => onOpenViewTags(it),
                              color: "#210cae",
                              hoverBg: "rgba(33,12,174,0.06)",
                              show: it.category?.type === "NON_CONSUMABLE"
                            },
                            {
                              title: "Edit Item Info",
                              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>,
                              onClick: () => onOpenEditModal(it),
                              color: "#475569",
                              hoverBg: "#f1f5f9",
                              show: canEditAddRemove
                            },
                            {
                              title: "View Change History",
                              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
                              onClick: () => onOpenHistoryModal(it),
                              color: "#475569",
                              hoverBg: "#f1f5f9",
                              show: true
                            },
                            {
                              title: "Delete Item",
                              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>,
                              onClick: () => onDeleteTarget("item", it.id, it.name),
                              color: "#dc2626",
                              hoverBg: "#fee2e2",
                              show: canEditAddRemove
                            }
                          ].filter(act => act.show).map((act, idx, arr) => (
                            <button
                              key={idx}
                              onClick={(e) => { e.stopPropagation(); act.onClick(); }}
                              title={act.title}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: act.color,
                                padding: "6px 9px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRight: idx < arr.length - 1 ? "1px solid #cbd5e1" : "none",
                                transition: "background-color 0.15s ease",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = act.hoverBg}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                              {act.icon}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid view layout */
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Bulk select action banner bar - Enabled ONLY when explicit multi-select mode is active */}
            {isMultiSelectMode && selectedItemIds.length > 0 && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#f0f4fe",
                borderRadius: "10px",
                padding: "0.75rem 1rem",
                border: "1px solid #c7d2fe",
                boxShadow: "0 2px 8px rgba(33, 12, 174, 0.06)",
                animation: "fadeIn 0.2s ease-in-out",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    backgroundColor: "#210cae",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                  }}>
                    {selectedItemIds.length}
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e1b4b" }}>
                    {selectedItemIds.length} {selectedItemIds.length === 1 ? "Asset" : "Assets"} Selected
                  </span>
                  {selectedItemIds.length < filteredItems.length && (
                    <button
                      onClick={onToggleSelectAll}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        backgroundColor: "#ffffff",
                        border: "1px solid #c7d2fe",
                        borderRadius: "7px",
                        color: "#210cae",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        padding: "0.35rem 0.65rem",
                        cursor: "pointer",
                        boxShadow: "0 1px 2px rgba(33,12,174,0.05)",
                        transition: "all 0.15s ease",
                        marginLeft: "0.5rem",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#e0e7ff"; e.currentTarget.style.borderColor = "#818cf8"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; e.currentTarget.style.borderColor = "#c7d2fe"; }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 11 12 14 22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                      Select All Visible ({filteredItems.length})
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (onClearSelection) {
                        onClearSelection();
                      } else if (allSelected) {
                        onToggleSelectAll();
                      }
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "7px",
                      color: "#64748b",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      padding: "0.35rem 0.65rem",
                      cursor: "pointer",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                      transition: "all 0.15s ease",
                      marginLeft: "0.35rem",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; e.currentTarget.style.color = "#0f172a"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; e.currentTarget.style.color = "#64748b"; }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Clear Selection
                  </button>
                </div>

                <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                  {(() => {
                    const canDeploy = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "INVENTORY_STAFF" || currentUser?.role === "OPS_MANAGER";
                    return (
                      <button
                        onClick={onOpenBulkRequestModal}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          backgroundColor: canDeploy ? "#210cae" : "#7c3aed",
                          border: "none",
                          borderRadius: "7px",
                          color: "#ffffff",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          padding: "0.45rem 0.9rem",
                          cursor: "pointer",
                          boxShadow: canDeploy ? "0 2px 5px rgba(33,12,174,0.2)" : "0 2px 5px rgba(124,58,237,0.2)",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = canDeploy ? "#1a098c" : "#6d28d9"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = canDeploy ? "#210cae" : "#7c3aed"}
                      >
                        {canDeploy ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                        )}
                        {canDeploy ? "Deploy Asset" : "Request Selected"}
                      </button>
                    );
                  })()}

                  {canEditAddRemove && (
                    <button
                      onClick={() => onDeleteTarget("bulk_items", "bulk", "Selected Items")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fca5a5",
                        borderRadius: "7px",
                        color: "#dc2626",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        padding: "0.45rem 0.9rem",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fee2e2"; e.currentTarget.style.borderColor = "#f87171"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#fef2f2"; e.currentTarget.style.borderColor = "#fca5a5"; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      Delete Selected ({selectedItemIds.length})
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Grid cards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
              gap: "1.1rem",
            }}>
              {filteredItems.map((it) => {
                const siteStock = it.stockLevels?.find(sl => sl.siteId === selectedSiteId);
                const quantity = siteStock ? siteStock.quantity : 0;
                const reorderPt = siteStock ? siteStock.reorderPoint : 5;
                const isSelected = selectedItemIds.includes(it.id);
                const fillPct = quantity === 0 ? 0 : Math.min((quantity / Math.max(reorderPt * 2, 10)) * 100, 100);

                let stockBadgeColor = "#10b981";
                let stockBg = "#d1fae5";
                let stockLabel = "In Stock";
                let headerGradient = "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)";
                let iconColor = "#059669";

                if (quantity === 0) {
                  stockBadgeColor = "#ef4444";
                  stockBg = "#fee2e2";
                  stockLabel = "Out of Stock";
                  headerGradient = "linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)";
                  iconColor = "#dc2626";
                } else if (quantity <= reorderPt) {
                  stockBadgeColor = "#f59e0b";
                  stockBg = "#fffbeb";
                  stockLabel = "Low Stock";
                  headerGradient = "linear-gradient(135deg, #fffbeb 0%, #fef9c3 100%)";
                  iconColor = "#d97706";
                }

                const isConsumable = it.category?.type === "CONSUMABLE";

                return (
                  <div
                    key={it.id}
                    onClick={() => onToggleSelectItem(it.id, showCircles)}
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: 14,
                      border: isSelected ? "2px solid #210cae" : "1px solid #e2e8f0",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      overflow: "hidden",
                      transition: "all 0.2s ease-in-out",
                      boxShadow: isSelected
                        ? "0 0 0 3px rgba(33,12,174,0.1), 0 8px 20px rgba(33,12,174,0.08)"
                        : "0 1px 4px rgba(0,0,0,0.04), 0 0 0 1px rgba(226,232,240,0.6)",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = "translateY(-3px)";
                        e.currentTarget.style.boxShadow = "0 12px 24px rgba(15,23,42,0.08), 0 0 0 1px #cbd5e1";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04), 0 0 0 1px rgba(226,232,240,0.6)";
                      }
                    }}
                  >
                    {/* Card Header with circular selection button + icon + badges */}
                    <div style={{
                      background: isSelected ? "linear-gradient(135deg, rgba(33,12,174,0.07) 0%, rgba(77,201,230,0.05) 100%)" : headerGradient,
                      padding: "1rem 1.1rem 0.85rem",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      borderBottom: "1px solid rgba(0,0,0,0.04)",
                    }}>
                      {/* Circular selection button to left of card - displayed ONLY when showCircles (multi-select mode) is true */}
                      {showCircles && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelectItem(it.id, showCircles);
                          }}
                          aria-label={`Select ${it.name}`}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: isSelected ? "2px solid #210cae" : "2px solid #94a3b8",
                            backgroundColor: isSelected ? "#210cae" : "#ffffff",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: "2px",
                            padding: 0,
                            transition: "all 0.2s ease",
                            boxShadow: isSelected ? "0 2px 5px rgba(33,12,174,0.3)" : "none",
                            outline: "none",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = "#210cae";
                              e.currentTarget.style.backgroundColor = "#f0f4fe";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = "#94a3b8";
                              e.currentTarget.style.backgroundColor = "#ffffff";
                            }
                          }}
                        >
                          {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      )}

                      {/* Category icon avatar */}
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        backgroundColor: isSelected ? "rgba(33,12,174,0.1)" : "rgba(255,255,255,0.8)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        color: isSelected ? "#210cae" : iconColor,
                        border: "1px solid rgba(0,0,0,0.06)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      }}>
                        {getCategoryIcon(it.category?.name || "", it.name)}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                          <span style={{
                            padding: "0.12rem 0.45rem", borderRadius: 5,
                            fontSize: "0.65rem", fontWeight: 700,
                            backgroundColor: isConsumable ? "#fff3c7" : "#e0f2fe",
                            color: isConsumable ? "#b45309" : "#0369a1",
                          }}>
                            {isConsumable ? "CONSUMABLE" : "NON-CONSUMABLE"}
                          </span>
                          <span style={{
                            padding: "0.12rem 0.45rem", borderRadius: 5,
                            fontSize: "0.65rem", fontWeight: 700,
                            backgroundColor: stockBg,
                            color: stockBadgeColor,
                          }}>
                            {stockLabel}
                          </span>
                        </div>
                        <h4 style={{
                          fontSize: "0.9rem", fontWeight: 700, color: "#0f172a",
                          margin: 0, lineHeight: 1.3,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {it.name}
                        </h4>
                        <span style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "0.1rem", display: "block" }}>
                          {it.category?.name || "Uncategorized"}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: "0.85rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.7rem", flex: 1 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* SKU */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><circle cx="7" cy="7" r="1" /></svg>
                        <code style={{
                          fontSize: "0.7rem", color: "#475569", fontFamily: "monospace",
                          backgroundColor: "#f1f5f9", padding: "0.1rem 0.35rem",
                          borderRadius: 4, letterSpacing: "0.02em",
                        }}>
                          {it.sku}
                        </code>
                      </div>

                      {/* Description */}
                      {it.description && (
                        <p style={{
                          fontSize: "0.73rem", color: "#64748b", margin: 0,
                          display: "-webkit-box", WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical", overflow: "hidden",
                          lineHeight: 1.5,
                        }}>
                          {it.description}
                        </p>
                      )}

                      {/* Price + Lead Time row */}
                      <div style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr",
                        gap: "0.5rem",
                      }}>
                        <div style={{
                          backgroundColor: "#f8fafc", borderRadius: 8, padding: "0.5rem 0.65rem",
                          border: "1px solid #f1f5f9",
                        }}>
                          <span style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>Unit Price</span>
                          <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1e293b" }}>
                            ₱{(it.unitPrice || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div style={{
                          backgroundColor: "#f8fafc", borderRadius: 8, padding: "0.5rem 0.65rem",
                          border: "1px solid #f1f5f9",
                        }}>
                          <span style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>Lead Time</span>
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569" }}>
                            {it.leadTimeDays} {it.leadTimeDays === 1 ? "day" : "days"}
                          </span>
                        </div>
                      </div>

                      {/* Stock level bar */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <span style={{ fontSize: "1.05rem", fontWeight: 800, color: quantity === 0 ? "#ef4444" : "#0f172a" }}>{quantity}</span>
                            <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>/ min {reorderPt}</span>
                          </div>
                          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: stockBadgeColor }}>{Math.round(fillPct)}% capacity</span>
                        </div>
                        <div style={{ width: "100%", height: "7px", backgroundColor: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{
                            width: `${fillPct}%`, height: "100%",
                            background: quantity === 0
                              ? "#ef4444"
                              : quantity <= reorderPt
                                ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                                : "linear-gradient(90deg, #10b981, #34d399)",
                            borderRadius: "4px",
                            transition: "width 0.35s ease",
                          }} />
                        </div>
                      </div>
                    </div>

                    {/* Card Footer action bar */}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0.6rem 1.1rem",
                      borderTop: "1px solid #f1f5f9",
                      backgroundColor: "#fafbfc",
                    }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Adjust Stock */}
                      {canAdjustStock && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenStockModal(it);
                          }}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.3rem",
                            background: "none", border: "none", cursor: "pointer",
                            color: "#475569", fontSize: "0.72rem", fontWeight: 600,
                            padding: "4px 6px", borderRadius: 5, transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; e.currentTarget.style.color = "#0f172a"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#475569"; }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          Adjust Stock
                        </button>
                      )}

                      {/* Right actions */}
                      <div style={{ display: "flex", gap: "0.3rem", marginLeft: "auto" }}>
                        {it.category?.type === "NON_CONSUMABLE" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenViewTags(it);
                            }}
                            title="View Asset Tags"
                            style={{
                              background: "#ffffff", border: "1px solid #e2e8f0", cursor: "pointer",
                              color: "#210cae", padding: "6px", borderRadius: "6px",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.02)", transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(33,12,174,0.05)"; e.currentTarget.style.borderColor = "#210cae"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><circle cx="7" cy="7" r="1" /></svg>
                          </button>
                        )}
                        {canEditAddRemove && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenEditModal(it);
                            }}
                            title="Edit Item"
                            style={{
                              background: "#ffffff", border: "1px solid #e2e8f0", cursor: "pointer",
                              color: "#475569", padding: "6px", borderRadius: "6px",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.02)", transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; e.currentTarget.style.borderColor = "#94a3b8"; e.currentTarget.style.color = "#0f172a"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenHistoryModal(it);
                          }}
                          title="View Change History"
                          style={{
                            background: "#ffffff", border: "1px solid #e2e8f0", cursor: "pointer",
                            color: "#475569", padding: "6px", borderRadius: "6px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.02)", transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; e.currentTarget.style.borderColor = "#94a3b8"; e.currentTarget.style.color = "#210cae"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        </button>
                        {canEditAddRemove && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteTarget("item", it.id, it.name);
                            }}
                            title="Delete Item"
                            style={{
                              background: "#ffffff", border: "1px solid #e2e8f0", cursor: "pointer",
                              color: "#dc2626", padding: "6px", borderRadius: "6px",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.02)", transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fee2e2"; e.currentTarget.style.borderColor = "#fca5a5"; e.currentTarget.style.color = "#b91c1c"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#dc2626"; }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
