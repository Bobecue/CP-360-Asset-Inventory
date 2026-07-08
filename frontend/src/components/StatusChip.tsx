"use client";
import React from "react";

export type Status = "Pending" | "Approved" | "Ready for Pickup" | "Rejected";

const colorMap: Record<Status, string> = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Approved: "bg-green-100 text-green-800 border-green-200",
  "Ready for Pickup": "bg-blue-100 text-blue-800 border-blue-200",
  Rejected: "bg-red-100 text-red-800 border-red-200",
};

// Improvement #6: glow pulse class applied to the outer chip for attention states
const glowMap: Partial<Record<Status, string>> = {
  Pending: "status-badge-pending",
  "Ready for Pickup": "status-badge-processing",
};

export default function StatusChip({ status }: { status: Status }) {
  const cls = colorMap[status] ?? "bg-gray-100 text-gray-800 border-gray-200";
  const needsAttention = status === "Pending" || status === "Ready for Pickup";
  const glowCls = glowMap[status] ?? "";

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 shadow-sm ${cls} ${glowCls}`}
      style={{ transition: "box-shadow 0.2s ease" }}
    >
      {needsAttention && (
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              status === "Pending" ? "bg-yellow-500" : "bg-blue-500"
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              status === "Pending" ? "bg-yellow-600" : "bg-blue-600"
            }`}
          />
        </span>
      )}
      {status}
    </span>
  );
}
