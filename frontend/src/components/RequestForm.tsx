"use client";
import React, { useState } from "react";
import { submitRequest } from "../lib/services/requestService";

type FormState = {
  item: string;
  quantity: number;
  reason: string;
  urgency: "Low" | "Medium" | "High";
};

export default function RequestForm({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState<FormState>({
    item: "",
    quantity: 1,
    reason: "",
    urgency: "Medium",
  });
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Submitting...");
    try {
      await submitRequest(form);
      setStatus("Request submitted");
      setForm({ item: "", quantity: 1, reason: "", urgency: "Medium" });
      onSuccess?.();
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setTimeout(() => setStatus(null), 3000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div>
        <label className="block text-sm font-medium">Item</label>
        <input
          value={form.item}
          onChange={(e) => setForm({ ...form, item: e.target.value })}
          required
          className="mt-1 block w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Quantity</label>
        <input
          type="number"
          value={form.quantity}
          min={1}
          onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
          className="mt-1 block w-32 border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Reason</label>
        <textarea
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          className="mt-1 block w-full border rounded p-2"
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Urgency</label>
        <select
          value={form.urgency}
          onChange={(e) => setForm({ ...form, urgency: e.target.value as FormState["urgency"] })}
          className="mt-1 block border rounded p-2"
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </div>

      <div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          Submit Request
        </button>
        {status && <span className="ml-3 text-sm">{status}</span>}
      </div>
    </form>
  );
}
