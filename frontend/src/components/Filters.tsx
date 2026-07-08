"use client";
import React, { useState } from "react";

export default function Filters({
  onChange,
}: {
  onChange: (filters: { status?: string; role?: string; from?: string; to?: string }) => void;
}) {
  const [status, setStatus] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  return (
    <div className="flex gap-2 items-end mb-4">
      <div>
        <label className="block text-xs">Status</label>
        <select value={status} onChange={(e)=>setStatus(e.target.value)} className="border rounded p-1">
          <option value="">All</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
        </select>
      </div>
      <div>
        <label className="block text-xs">Role</label>
        <input value={role} onChange={(e)=>setRole(e.target.value)} className="border rounded p-1" />
      </div>
      <div>
        <label className="block text-xs">From</label>
        <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="border rounded p-1" />
      </div>
      <div>
        <label className="block text-xs">To</label>
        <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="border rounded p-1" />
      </div>
      <div>
        <button
          onClick={() => onChange({ status, role, from, to })}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
