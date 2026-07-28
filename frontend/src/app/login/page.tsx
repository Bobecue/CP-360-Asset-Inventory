"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InfiniteGridBackground } from "@/components/ui/infinite-grid-background";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSuccess(false);
    
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:3001/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
          passwordPlain: password,
        }),
      });

      setIsLoading(false);

      if (res.ok) {
        const loggedInUser = await res.json();
        localStorage.setItem("currentUserEmail", loggedInUser.email);
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
        return;
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.message || "Invalid credentials. Please try again.");
        return;
      }
    } catch (err) {
      console.warn("Backend login failed/unreachable, falling back to mock authentication:", err);
    }

    // Mock authentication fallback
    await new Promise((r) => setTimeout(r, 600));
    setIsLoading(false);

    if (password === "SuperAdmin360!" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      localStorage.setItem("currentUserEmail", cleanEmail);
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } else {
      setError("Invalid credentials. Please try again.");
    }
  }

  useEffect(() => {
    document.body.classList.add("login-page-body");
    return () => {
      document.body.classList.remove("login-page-body");
    };
  }, []);

  return (
    <main
      className="animate-brand-mesh moving-shine-overlay login-page-root"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: "2rem 1rem",
        backgroundImage: "linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)",
        backgroundSize: "300% 300%",
      }}
    >
      <InfiniteGridBackground />

      {/* Ambient floating background Orbs featuring Enterprise Indigo & Slate */}
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "-10%", left: "-5%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(148,163,184,0.06) 50%, transparent 75%)",
          animation: "floatA 12s ease-in-out infinite",
          filter: "blur(20px)",
        }} />
        <div style={{
          position: "absolute", bottom: "-12%", right: "-5%",
          width: 450, height: 450, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(225,29,72,0.05) 0%, rgba(203,213,225,0.1) 50%, transparent 75%)",
          animation: "floatB 15s ease-in-out infinite",
          filter: "blur(20px)",
        }} />
        <div style={{
          position: "absolute", top: "35%", left: "50%",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(79,70,229,0.06) 0%, rgba(148,163,184,0.08) 60%, transparent 80%)",
          animation: "floatA 10s ease-in-out infinite reverse",
          filter: "blur(15px)",
        }} />
      </div>

      {/* ── Card ── */}
      <div
        className="relative z-10 card-shine-effect login-card no-silver-red"
        style={{
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: 440,
          borderRadius: 24,
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 45px -10px rgba(15, 23, 42, 0.08), 0 8px 24px -4px rgba(99, 102, 241, 0.05)",
          padding: "3.2rem 2.5rem 2.5rem",
          overflow: "hidden",
          backgroundColor: "#ffffff",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Top glowing multi-brand line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 5,
          background: "linear-gradient(90deg, #4f46e5 0%, #e11d48 50%, #3b82f6 100%)",
          backgroundSize: "200% 100%",
          animation: "mesh-gradient-move 4s linear infinite",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: "0 2px 8px rgba(79, 70, 229, 0.2)",
        }} />

        {/* Brand heading + Logo */}
        <div className="no-card logo-header-clean" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1.6rem", background: "transparent" }}>
          <img 
            src="/logo.png" 
            alt="Contact Point 360 Logo" 
            style={{
              height: "65px",
              width: "auto",
              objectFit: "contain",
              marginBottom: "1rem",
              filter: "drop-shadow(0 2px 6px rgba(15, 23, 42, 0.06))",
            }} 
          />
          <h1 style={{
            fontSize: "1.4rem", fontWeight: 800,
            color: "#0f172a", letterSpacing: "-0.02em",
            margin: 0, marginBottom: "0.3rem",
          }}>
            CP360 Asset Inventory
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500, margin: 0 }}>
            Sign in to your workspace
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div role="alert" style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: "0.65rem 1rem",
            marginBottom: "1.25rem",
            display: "flex", alignItems: "center", gap: "0.5rem",
            color: "#991b1b", fontSize: "0.82rem", fontWeight: 600,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Success banner */}
        {isSuccess && (
          <div role="status" style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 8,
            padding: "0.65rem 1rem",
            marginBottom: "1.25rem",
            display: "flex", alignItems: "center", gap: "0.5rem",
            color: "#166534", fontSize: "0.82rem", fontWeight: 600,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Welcome, Super Admin! Authentication successful.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="login-email" style={{
              display: "block", fontSize: "0.75rem", fontWeight: 700,
              color: "#475569", marginBottom: "0.45rem",
              letterSpacing: "0.05em", textTransform: "uppercase",
            }}>
              Email Address
            </label>
            <div className="input-container" style={{ position: "relative" }}>
              <span aria-hidden style={{
                position: "absolute", left: 13, top: "50%",
                transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none",
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "0.75rem 1rem 0.75rem 2.6rem",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: "0.92rem",
                  outline: "none",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#6366f1";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.02)";
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="login-password" style={{
              display: "block", fontSize: "0.75rem", fontWeight: 700,
              color: "#475569", marginBottom: "0.45rem",
              letterSpacing: "0.05em", textTransform: "uppercase",
            }}>
              Password
            </label>
            <div className="input-container" style={{ position: "relative" }}>
              <span aria-hidden style={{
                position: "absolute", left: 13, top: "50%",
                transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none",
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "0.75rem 2.6rem 0.75rem 2.6rem",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: "0.92rem",
                  outline: "none",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#6366f1";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.02)";
                }}
              />
              <button
                type="button"
                id="toggle-password-visibility"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: 12, top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#64748b", padding: 4, display: "flex", alignItems: "center",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#4f46e5")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#64748b")}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={isLoading}
            className={isLoading ? "click-active" : "click-active card-shine-effect"}
            style={{
              width: "100%",
              padding: "0.85rem 1rem",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
              color: "#ffffff",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
              letterSpacing: "0.01em",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = "linear-gradient(135deg, #4338ca 0%, #2563eb 100%)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(79, 70, 229, 0.45)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(79, 70, 229, 0.35)";
              }
            }}
          >
            {isLoading ? (
              <>
                <svg style={{ animation: "spin 0.8s linear infinite" }}
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Signing in…
              </>
            ) : (
              <>
                Sign In
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          marginTop: "1.75rem",
        }}>
          <hr style={{ flex: 1, border: "none", borderTop: "1px solid #e4e4e7" }} />
          <span style={{ fontSize: "0.72rem", color: "#a1a1aa", whiteSpace: "nowrap", fontWeight: 500 }}>
            Powered by Contact Point 360
          </span>
          <hr style={{ flex: 1, border: "none", borderTop: "1px solid #e4e4e7" }} />
        </div>
      </div>

      <style>{`
        @keyframes floatA {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(28px, -20px) scale(1.04); }
        }
        @keyframes floatB {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-22px, 16px) scale(1.04); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 15s ease infinite;
        }
        .input-container:focus-within svg {
          color: #4f46e5 !important;
        }
        .input-container svg {
          transition: color 0.25s ease;
        }
      `}</style>
    </main>
  );
}
