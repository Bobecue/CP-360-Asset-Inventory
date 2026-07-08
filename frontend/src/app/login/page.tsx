"use client";

import { useState } from "react";
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

    // Mock authentication delay
    await new Promise((r) => setTimeout(r, 600));
    setIsLoading(false);

    const mockUsers = [
      { email: "superadmin@contactpoint360.com" },
      { email: "john.doe@contactpoint360.com" },
      { email: "jane.smith@contactpoint360.com" },
      { email: "elena.rostova@contactpoint360.com" },
      { email: "markus@contactpoint360.com" },
      { email: "elena@contactpoint360.com" },
      { email: "reyniel.mangas@contactpoint360.com" },
      { email: "mosesandrew.salivio@contactpoint360.com" },
      { email: "moses.salivio@contactpoint360.com" }
    ];

    const foundUser = mockUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (foundUser && password === "SuperAdmin360!") {
      localStorage.setItem("currentUserEmail", foundUser.email);
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } else {
      setError("Invalid credentials. Please try again.");
    }
  }

  return (
    <main
      className="animate-gradient-shift"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: "2rem 1rem",
        backgroundImage: "linear-gradient(-45deg, #f8fafc, #e2e8f0, #ffffff, #e0e7ff, #f1f5f9)",
        backgroundSize: "400% 400%",
      }}
    >
      <InfiniteGridBackground />

      {/* Toned down soft background blobs with highly transparent indigo and sky blue hints */}
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "-8%", left: "-6%",
          width: 480, height: 480, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(33,12,174,0.06) 0%, transparent 70%)",
          animation: "floatA 12s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "-10%", right: "-6%",
          width: 420, height: 420, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(77,201,230,0.05) 0%, transparent 70%)",
          animation: "floatB 15s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", top: "40%", left: "55%",
          width: 220, height: 220, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(33,12,174,0.04) 0%, transparent 70%)",
          animation: "floatA 10s ease-in-out infinite reverse",
        }} />
      </div>

      {/* Very subtle dot grid */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, zIndex: 0, opacity: 0.15,
        backgroundImage: "radial-gradient(circle, #94a3b8 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        pointerEvents: "none",
      }} />

      {/* ── Card ── */}
      <div
        className="relative z-10 card-shine-effect"
        style={{
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: 440,
          background: "#ffffff",
          borderRadius: 24,
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.02)",
          padding: "3.2rem 2.5rem 2.5rem",
          overflow: "hidden",
        }}
      >
        {/* Top glowing brand line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 5,
          background: "linear-gradient(90deg, #210cae, #4dc9e6)",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }} />

        {/* Logo + brand heading */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem" }}>
          <img 
            src="/logo.png" 
            alt="Contact Point 360 Logo" 
            style={{
              height: "180px",
              width: "auto",
              objectFit: "contain",
              marginTop: "-40px",
              marginBottom: "-40px",
            }} 
          />

          <h1 style={{
            fontSize: "1.35rem", fontWeight: 700,
            color: "#1e293b", letterSpacing: "-0.02em",
            margin: 0, marginBottom: "0.3rem",
          }}>
            CP360 Asset Inventory
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 400, margin: 0 }}>
            Sign in to your workspace
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div role="alert" style={{
            background: "#fff5f5",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: "0.65rem 1rem",
            marginBottom: "1.25rem",
            display: "flex", alignItems: "center", gap: "0.5rem",
            color: "#dc2626", fontSize: "0.82rem", fontWeight: 500,
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
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: 8,
            padding: "0.65rem 1rem",
            marginBottom: "1.25rem",
            display: "flex", alignItems: "center", gap: "0.5rem",
            color: "#047857", fontSize: "0.82rem", fontWeight: 500,
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
              display: "block", fontSize: "0.75rem", fontWeight: 600,
              color: "#475569", marginBottom: "0.45rem",
              letterSpacing: "0.05em", textTransform: "uppercase",
            }}>
              Email Address
            </label>
            <div className="input-container" style={{ position: "relative" }}>
              <span aria-hidden style={{
                position: "absolute", left: 13, top: "50%",
                transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none",
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
                className="search-glow"
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "0.75rem 1rem 0.75rem 2.6rem",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#1e293b",
                  fontSize: "0.92rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="login-password" style={{
              display: "block", fontSize: "0.75rem", fontWeight: 600,
              color: "#475569", marginBottom: "0.45rem",
              letterSpacing: "0.05em", textTransform: "uppercase",
            }}>
              Password
            </label>
            <div className="input-container" style={{ position: "relative" }}>
              <span aria-hidden style={{
                position: "absolute", left: 13, top: "50%",
                transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none",
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
                className="search-glow"
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "0.75rem 2.6rem 0.75rem 2.6rem",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#1e293b",
                  fontSize: "0.92rem",
                  outline: "none",
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
                  color: "#94a3b8", padding: 4, display: "flex", alignItems: "center",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#210cae")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#94a3b8")}
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
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
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
            className={isLoading ? "click-active" : "animate-gradient-shift click-active card-shine-effect"}
            style={{
              width: "100%",
              padding: "0.8rem 1rem",
              borderRadius: 8,
              border: "none",
              backgroundColor: isLoading ? "rgba(33,12,174,0.55)" : undefined,
              backgroundImage: isLoading
                ? "none"
                : "linear-gradient(135deg, #210cae 0%, #4dc9e6 50%, #210cae 100%)",
              backgroundSize: "200% 200%",
              color: "#ffffff",
              fontSize: "0.93rem",
              fontWeight: 600,
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              boxShadow: isLoading ? "none" : "0 4px 14px rgba(33,12,174,0.18)",
              letterSpacing: "0.01em",
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
          color: #210cae !important;
        }
        .input-container svg {
          transition: color 0.25s ease;
        }
      `}</style>
    </main>
  );
}
