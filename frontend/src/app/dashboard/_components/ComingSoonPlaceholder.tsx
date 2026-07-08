"use client";

interface ComingSoonPlaceholderProps {
  tabName: string;
  onBackToDashboard: () => void;
}

export const ComingSoonPlaceholder = ({ tabName, onBackToDashboard }: ComingSoonPlaceholderProps) => {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "50vh",
      textAlign: "center",
      padding: "2rem",
      backgroundColor: "#ffffff",
      borderRadius: 12,
      boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        backgroundColor: "#f1f5f9",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#64748b", marginBottom: "1.5rem"
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.5rem 0" }}>
        {tabName} Module
      </h3>
      <p style={{ fontSize: "0.85rem", color: "#64748b", maxWidth: 320, margin: "0 0 1.5rem 0", lineHeight: 1.5 }}>
        This module is currently under active development. You can manage system users under the User Management tab.
      </p>
      <button
        onClick={onBackToDashboard}
        style={{
          background: "linear-gradient(135deg, #210cae 0%, #4dc9e6 100%)",
          color: "#ffffff", border: "none",
          borderRadius: 8, padding: "0.5rem 1.25rem", fontSize: "0.82rem",
          fontWeight: 600, cursor: "pointer",
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
        Return to Dashboard Overview
      </button>
    </div>
  );
};
