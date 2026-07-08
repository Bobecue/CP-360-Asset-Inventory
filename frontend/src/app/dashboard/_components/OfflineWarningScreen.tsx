"use client";

import React from "react";

interface OfflineWarningScreenProps {
  isChecking: boolean;
  onRetry: () => void;
}

export const OfflineWarningScreen = ({
  isChecking,
  onRetry,
}: OfflineWarningScreenProps) => {
  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      backgroundColor: "#090d16",
      backgroundImage: "radial-gradient(circle at 50% 30%, rgba(239, 68, 68, 0.08) 0%, transparent 60%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      padding: "1rem",
      boxSizing: "border-box"
    }}>
      <div style={{
        maxWidth: "440px",
        width: "100%",
        backgroundColor: "rgba(17, 24, 39, 0.7)",
        backdropFilter: "blur(12px)",
        borderRadius: "20px",
        border: "1px solid rgba(239, 68, 68, 0.15)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(239, 68, 68, 0.05)",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        {/* Connection status signal light */}
        <div style={{
          position: "relative",
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1.5rem"
        }}>
          {/* Pulsating ring */}
          <div style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: "2px solid #ef4444",
            opacity: 0.6,
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
          }} />
          
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.5" />
            <path d="M5 12.5a10.94 10.94 0 0 1 5.83-2.84" />
            <path d="M12 18.5a4.25 4.25 0 0 1-2.42-.76" />
            <path d="M14.42 17.74a4.25 4.25 0 0 1-.42.76" />
            <path d="M12 12.5a8.25 8.25 0 0 1 2.92.53" />
            <path d="M9.08 13.03a8.25 8.25 0 0 1 1.25-.53" />
            <circle cx="12" cy="21" r="1" />
          </svg>
        </div>

        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: 800,
          color: "#f8fafc",
          margin: "0 0 0.5rem 0",
          letterSpacing: "-0.02em"
        }}>
          Server Connection Lost
        </h2>
        
        <p style={{
          fontSize: "0.85rem",
          color: "#94a3b8",
          lineHeight: "1.5",
          margin: "0 0 1.5rem 0"
        }}>
          The application backend database connection is unreachable. 
          To prevent local inventory conflicts, access is temporarily locked until the connection is restored.
        </p>

        {/* Diagnostics Checklist */}
        <div style={{
          width: "100%",
          backgroundColor: "rgba(248, 250, 252, 0.03)",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.04)",
          padding: "1rem",
          textAlign: "left",
          boxSizing: "border-box",
          marginBottom: "1.75rem"
        }}>
          <span style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            display: "block",
            marginBottom: "0.6rem"
          }}>
            Diagnosis Checklist
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              "Check if NestJS service is running (port 3001)",
              "Verify local network connection settings",
              "Ensure database service (Prisma/PostgreSQL) is active"
            ].map((text, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                <span style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "1px" }}>•</span>
                <span style={{ fontSize: "0.76rem", color: "#cbd5e1" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Retry Button */}
        <button
          type="button"
          onClick={onRetry}
          disabled={isChecking}
          style={{
            width: "100%",
            padding: "0.68rem",
            borderRadius: "10px",
            border: "none",
            background: isChecking 
              ? "rgba(255, 255, 255, 0.05)" 
              : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            color: isChecking ? "#64748b" : "#ffffff",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: isChecking ? "not-allowed" : "pointer",
            boxShadow: isChecking ? "none" : "0 4px 12px rgba(239, 68, 68, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            transition: "transform 0.15s, background-color 0.15s"
          }}
          onMouseEnter={(e) => {
            if (!isChecking) {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(239, 68, 68, 0.35)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isChecking) {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.25)";
            }
          }}
        >
          {isChecking ? (
            <>
              <div style={{
                width: 14, height: 14, borderRadius: "50%",
                border: "2px solid rgba(148, 163, 184, 0.2)",
                borderTopColor: "#94a3b8",
                animation: "spin 0.8s linear infinite"
              }} />
              Verifying Connection...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              Retry Connection
            </>
          )}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}} />
    </div>
  );
};
