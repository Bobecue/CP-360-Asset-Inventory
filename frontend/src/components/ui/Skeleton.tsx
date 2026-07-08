import React from "react";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`skeleton-shimmer ${className ?? ""}`}
      style={{ minHeight: 16, ...((props as any).style ?? {}) }}
      {...props}
    />
  );
}

/** Pre-built skeleton layout for a dashboard metric card */
export function MetricCardSkeleton() {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: "1.25rem 1.5rem",
        boxShadow: "0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      <Skeleton style={{ height: 12, width: "55%", borderRadius: 6 }} />
      <Skeleton style={{ height: 32, width: "40%", borderRadius: 6, marginTop: 4 }} />
      <Skeleton style={{ height: 10, width: "70%", borderRadius: 6 }} />
    </div>
  );
}

/** Pre-built skeleton for a table row */
export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: "0.75rem 0.5rem" }}>
          <Skeleton style={{ height: 12, width: i === 0 ? "80%" : "60%", borderRadius: 6 }} />
        </td>
      ))}
    </tr>
  );
}
