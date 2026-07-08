"use client";

import React, { useState, useEffect, useRef } from "react";

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  catalogItems: any[];
}

export const ScanModal = ({
  isOpen,
  onClose,
  onScan,
  catalogItems,
}: ScanModalProps) => {
  const [manualCode, setManualCode] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Gather all physical tags currently in the mock/live catalog for ease of simulation
  const availableTags: string[] = [];
  catalogItems.forEach((item) => {
    if (item.assets) {
      item.assets.forEach((asset: any) => {
        availableTags.push(asset.tagCode);
      });
    }
  });

  useEffect(() => {
    if (isOpen && cameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, cameraActive]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError("Camera access denied or unavailable. Using manual entry instead.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim().toUpperCase());
      setManualCode("");
    }
  };

  const handleSimulatedSelect = (code: string) => {
    if (code) {
      onScan(code);
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
        animation: "scaleIn 0.2s ease-out",
      }}>
        {/* Header */}
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              backgroundColor: "rgba(33, 12, 174, 0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#210cae", flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Scan Code / Tag
              </h3>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                Scan an item barcode or enter tag code
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", padding: "4px", borderRadius: "4px" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Scanner view */}
          {cameraActive ? (
            <div style={{
              position: "relative",
              width: "100%",
              height: "220px",
              backgroundColor: "#000",
              borderRadius: "12px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              
              {/* Target Reticle View */}
              <div style={{
                position: "absolute",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: "180px", height: "120px",
                border: "2px solid #210cae",
                borderRadius: "8px",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center"
              }}>
                {/* Laser scan line animation */}
                <div style={{
                  width: "100%",
                  height: "2px",
                  backgroundColor: "#ef4444",
                  boxShadow: "0 0 8px #ef4444",
                  animation: "scanLine 2s linear infinite",
                  position: "absolute",
                  top: 0
                }} />
              </div>
              
              <button
                type="button"
                onClick={() => setCameraActive(false)}
                style={{
                  position: "absolute",
                  bottom: "10px",
                  padding: "0.35rem 0.85rem",
                  borderRadius: "20px",
                  border: "none",
                  backgroundColor: "rgba(15,23,42,0.8)",
                  color: "#ffffff",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  backdropFilter: "blur(4px)"
                }}
              >
                Use Manual Input
              </button>
            </div>
          ) : (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "220px",
              backgroundColor: "#f8fafc",
              border: "1px dashed #cbd5e1",
              borderRadius: "12px",
              padding: "1rem",
              textAlign: "center"
            }}>
              <span style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📷</span>
              <h4 style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.25rem 0" }}>Camera Scanner Offline</h4>
              <p style={{ fontSize: "0.7rem", color: "#64748b", maxWidth: "250px", margin: "0 0 1rem 0" }}>
                Use your webcam to scan physical labels or select an option below.
              </p>
              <button
                type="button"
                onClick={() => setCameraActive(true)}
                style={{
                  padding: "0.45rem 1rem",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#210cae",
                  color: "#ffffff",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(33,12,174,0.15)"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1b0a8f"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#210cae"}
              >
                Activate Camera Scan
              </button>
              {cameraError && (
                <span style={{ fontSize: "0.65rem", color: "#ef4444", marginTop: "0.5rem", padding: "0 0.5rem" }}>
                  {cameraError}
                </span>
              )}
            </div>
          )}

          {/* Simulated Scanner Tool */}
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Simulation / Mock Options
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.4rem" }}>
              <select
                onChange={(e) => handleSimulatedSelect(e.target.value)}
                defaultValue=""
                style={{
                  width: "100%",
                  padding: "0.45rem 0.65rem",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  fontSize: "0.8rem",
                  color: "#475569",
                  outline: "none",
                  backgroundColor: "#ffffff"
                }}
              >
                <option value="" disabled>Select active barcode tag code...</option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleManualSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>Manual Entry Code</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                placeholder="e.g. CEB-CON-0042"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                style={{
                  flex: 1,
                  padding: "0.45rem 0.65rem",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  fontSize: "0.8rem",
                  color: "#1e293b",
                  outline: "none"
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "0.45rem 1rem",
                  borderRadius: 6,
                  border: "none",
                  backgroundColor: "#475569",
                  color: "#ffffff",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#334155"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#475569"}
              >
                Submit
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "1rem 1.5rem",
          borderTop: "1px solid #e2e8f0",
          backgroundColor: "#f8fafc",
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.45rem 1.25rem",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#475569",
              fontSize: "0.8rem",
              fontWeight: 500,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Embedded CSS for scan laser animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scanLine {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}} />
    </div>
  );
};
