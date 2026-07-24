"use client";

import React, { useState } from "react";
import { CatalogItem, AssetTagBadge } from "@/types/dashboard";
import { Barcode } from "../Barcode";

interface ViewTagsModalProps {
  viewTagsItem: CatalogItem | null;
  viewTagsAssets: any[];
  isLoadingTags: boolean;
  onClose: () => void;
  selectedSiteId?: string;
}

export const ViewTagsModal = ({
  viewTagsItem,
  viewTagsAssets,
  isLoadingTags,
  onClose,
  selectedSiteId,
}: ViewTagsModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  if (!viewTagsItem) return null;

  const handlePrintLabel = (asset: any, itemName: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label - ${asset.tagCode}</title>
          <style>
            @page {
              size: 2in 1in;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0.15in;
              width: 2in;
              height: 1in;
              box-sizing: border-box;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              text-align: center;
              background-color: white;
            }
            .header {
              font-size: 8px;
              font-weight: 700;
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              width: 100%;
            }
            .item-name {
              font-size: 7px;
              color: #64748b;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              width: 100%;
              margin-top: 1px;
            }
            .barcode-container {
              width: 100%;
              height: 35px;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .barcode-container svg {
              width: 100%;
              height: 35px;
            }
            .tag-code {
              font-size: 8px;
              font-weight: 700;
              font-family: monospace;
              letter-spacing: 0.05em;
              margin-top: 1px;
            }
          </style>
        </head>
        <body>
          <div class="header">ContactPoint 360</div>
          <div class="item-name">${itemName}</div>
          <div class="barcode-container">
            ${document.getElementById(`barcode-svg-${asset.id}`)?.outerHTML || ""}
          </div>
          <div class="tag-code">${asset.tagCode}</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintAllLabels = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const labelPages = filteredAssets.map(asset => `
      <div class="label-page">
        <div class="header">ContactPoint 360</div>
        <div class="item-name">${viewTagsItem.name}</div>
        <div class="barcode-container">
          ${document.getElementById(`barcode-svg-${asset.id}`)?.outerHTML || ""}
        </div>
        <div class="tag-code">${asset.tagCode}</div>
      </div>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Labels - ${viewTagsItem.name}</title>
          <style>
            @page {
              size: 2in 1in;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background-color: white;
            }
            .label-page {
              width: 2in;
              height: 1in;
              padding: 0.15in;
              box-sizing: border-box;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              text-align: center;
              page-break-after: always;
            }
            .header {
              font-size: 8px;
              font-weight: 700;
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              width: 100%;
            }
            .item-name {
              font-size: 7px;
              color: #64748b;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              width: 100%;
              margin-top: 1px;
            }
            .barcode-container {
              width: 100%;
              height: 35px;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .barcode-container svg {
              width: 100%;
              height: 35px;
            }
            .tag-code {
              font-size: 8px;
              font-weight: 700;
              font-family: monospace;
              letter-spacing: 0.05em;
              margin-top: 1px;
            }
          </style>
        </head>
        <body>
          ${labelPages}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredAssets = viewTagsAssets.filter(asset => {
    const matchesSearch = asset.tagCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.serialNumber && asset.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSite = !selectedSiteId || asset.siteId === selectedSiteId;
    return matchesSearch && matchesSite;
  });

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
        borderRadius: "20px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0,0,0,0.05)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        border: "1px solid #e2e8f0",
        animation: "scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}>
        {/* Modal Header */}
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              backgroundColor: "rgba(33, 12, 174, 0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#210cae", flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1"/></svg>
            </div>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Asset Tags & Barcodes
              </h3>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                For {viewTagsItem.name} ({viewTagsItem.sku})
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#94a3b8", display: "flex", alignItems: "center",
              padding: "6px", borderRadius: "50%", transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f1f5f9";
              e.currentTarget.style.color = "#475569";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#94a3b8";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Search Bar Container */}
        {!isLoadingTags && viewTagsAssets.length > 0 && (
          <div style={{
            padding: "1.25rem 1.5rem 0.25rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem"
          }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <svg 
                style={{ position: "absolute", left: 12, color: "#94a3b8" }} 
                width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search by Tag Code or Serial Number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-glow"
                style={{
                  width: "100%",
                  padding: "0.55rem 2.25rem 0.55rem 2.25rem",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.82rem",
                  color: "#1e293b",
                  outline: "none",
                  backgroundColor: "#f8fafc",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#210cae";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(33, 12, 174, 0.15)";
                  e.currentTarget.style.backgroundColor = "#ffffff";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute", right: 12, background: "none", border: "none",
                    cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center",
                    padding: "4px", borderRadius: "50%"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e2e8f0"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem", color: "#64748b", padding: "0 0.25rem" }}>
              <span>Showing {filteredAssets.length} of {viewTagsAssets.length} tags</span>
              {filteredAssets.length !== viewTagsAssets.length && (
                <span style={{ color: "#210cae", fontWeight: 600 }}>Filtered</span>
              )}
            </div>
          </div>
        )}

        {/* Modal Content */}
        <div style={{ padding: "1rem 1.5rem 1.5rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {isLoadingTags ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 1rem" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                border: "3px solid rgba(33,12,174,0.15)",
                borderTopColor: "#210cae",
                animation: "spin 0.8s linear infinite",
                marginBottom: "0.85rem"
              }} />
              <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 500 }}>Fetching asset tags...</span>
            </div>
          ) : viewTagsAssets.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 1rem", textAlign: "center" }}>
              <span style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>⚠️</span>
              <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>No physical asset tags generated for this item.</span>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 1rem", textAlign: "center" }}>
              <span style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🔍</span>
              <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>No asset tags matched your search query.</span>
              <button 
                onClick={() => setSearchQuery("")} 
                style={{
                  marginTop: "0.75rem",
                  fontSize: "0.8rem",
                  color: "#210cae",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  textDecoration: "underline"
                }}
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "1rem",
              maxHeight: "420px",
              overflowY: "auto",
              padding: "0.5rem",
              margin: "0 -0.5rem"
            }}>
              {filteredAssets.map(asset => (
                <div key={asset.id} style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "1rem",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                  position: "relative",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02), 0 0 0 1px rgba(226,232,240,0.8)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#210cae";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(33,12,174,0.06), 0 0 0 1px rgba(33,12,174,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02), 0 0 0 1px rgba(226,232,240,0.8)";
                }}
                >
                  {/* Card Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        backgroundColor: "#4dc9e6"
                      }} />
                      <span style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>CP360 Label</span>
                    </div>
                    <button
                      onClick={() => handlePrintLabel(asset, viewTagsItem.name)}
                      title="Print Barcode Label"
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#475569", padding: "4px", borderRadius: "6px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        backgroundColor: "#f1f5f9",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#210cae";
                        e.currentTarget.style.color = "#ffffff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#f1f5f9";
                        e.currentTarget.style.color = "#475569";
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    </button>
                  </div>

                  {/* Tag Code Display */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <span style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>TAG CODE</span>
                    <div>
                      <AssetTagBadge tag={asset.tagCode} size="md" />
                    </div>
                  </div>

                  {/* Hidden / SVG container for printing */}
                  <div id={`barcode-svg-${asset.id}`} style={{ display: "none" }}>
                    <Barcode text={asset.tagCode} height={35} showText={false} />
                  </div>

                  {/* Barcode Preview Graphic */}
                  <div style={{
                    marginTop: "0.2rem",
                    padding: "0.4rem",
                    backgroundColor: "#ffffff",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)"
                  }}>
                    <Barcode text={asset.tagCode} height={25} showText={false} />
                  </div>

                  {/* Serial Number Display */}
                  <div style={{ marginTop: "0.2rem", display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                    <span style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 500 }}>SERIAL NUMBER</span>
                    <span style={{
                      fontSize: "0.74rem",
                      color: asset.serialNumber ? "#334155" : "#94a3b8",
                      fontWeight: asset.serialNumber ? 600 : 400,
                      fontFamily: "monospace",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {asset.serialNumber || "None"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.25rem 1.5rem",
          borderTop: "1px solid #e2e8f0",
          backgroundColor: "#f8fafc",
        }}>
          {!isLoadingTags && filteredAssets.length > 0 ? (
            <button
              type="button"
              onClick={handlePrintAllLabels}
              style={{
                padding: "0.55rem 1.5rem",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg, #210cae 0%, #4dc9e6 100%)",
                color: "#ffffff",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(33,12,174,0.15)",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(33,12,174,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(33,12,174,0.15)";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print All Labels ({filteredAssets.length})
            </button>
          ) : <div />}
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.55rem 1.5rem",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#475569",
              fontSize: "0.82rem",
              fontWeight: 500,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f8fafc";
              e.currentTarget.style.borderColor = "#94a3b8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
