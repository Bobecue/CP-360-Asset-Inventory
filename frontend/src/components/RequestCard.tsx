"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import StatusChip, { Status } from "./StatusChip";
import { InteractiveModal } from "./ui/InteractiveModal";

export type Request = {
  id: string;
  item: string;
  quantity: number;
  reason: string;
  urgency: string;
  status: Status | string;
  requester?: string;
  createdAt?: string;
  history?: { status: string; comment?: string; timestamp: string; byName?: string }[];
};

export default function RequestCard({
  request,
  onAction,
}: {
  request: Request;
  onAction?: (id: string, action: "approve" | "reject" | "comment", comment?: string) => void;
}) {
  const [note, setNote] = useState("");
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: "approve" | "reject" | null;
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: null
  });

  const steps = ["Submitted", "Approved", "Processing", "Deployed"];
  let currentStep = 0;
  const statusStr = request.status.toUpperCase();
  if (statusStr.includes("PENDING")) currentStep = 1;
  if (statusStr === "APPROVED") currentStep = 2;
  if (statusStr === "READY_FOR_PICKUP" || statusStr === "RELEASED") currentStep = 4;
  if (statusStr === "RETURNED" || statusStr === "CANCELLED" || statusStr === "REJECTED") currentStep = -1;

  const handleSendNote = () => {
    if (!note.trim() || !onAction) return;
    onAction(request.id, "comment", note.trim());
    setNote("");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
      transition={{ duration: 0.2 }}
      className="border border-gray-100 rounded-xl p-5 mb-4 bg-white shadow-sm transition-colors hover:border-blue-100"
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="text-lg font-semibold text-gray-900">{request.item}</div>
          <div className="text-sm text-gray-600 mt-1">Qty: {request.quantity} • Urgency: {request.urgency}</div>
          <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-100">&quot;{request.reason}&quot;</div>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <StatusChip status={request.status as Status} />
          <div className="text-xs text-gray-500">{request.createdAt ? new Date(request.createdAt).toLocaleString() : ""}</div>
        </div>
      </div>

      {/* Visual Status Timeline */}
      {currentStep >= 0 && (
        <div className="mt-6 mb-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full z-0 transition-all duration-500"
              style={{ width: `${((currentStep === 4 ? 3 : currentStep) / 3) * 100}%` }}
            ></div>
            
            {steps.map((step, idx) => {
              let isActive = idx <= currentStep;
              if (currentStep === 4) isActive = true;
              return (
                <div key={step} className="relative z-10 flex flex-col items-center gap-1" style={{ width: '60px' }}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${isActive ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                    {isActive && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className={`text-[10px] font-medium text-center leading-tight ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* In-line Communication / Notes */}
      <div className="mt-5 border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Notes & History</h4>
        {request.history && request.history.length > 0 ? (
          <div className="max-h-32 overflow-y-auto mb-3 space-y-2 pr-2 text-sm">
            {request.history.filter(h => h.comment).map((h, i) => (
              <div key={i} className="bg-gray-50 p-2 rounded text-gray-700 border border-gray-100">
                <span className="font-semibold text-gray-900">{h.byName || "System"}:</span> {h.comment}
                <div className="text-[10px] text-gray-400 mt-1">{new Date(h.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-500 mb-3 italic">No notes yet.</div>
        )}

        {onAction && (
          <div className="flex gap-2 items-center">
            <input 
              type="text" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendNote()}
              placeholder="Add a comment or question..." 
              className="flex-1 text-sm border rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button 
              onClick={handleSendNote}
              disabled={!note.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm px-4 py-1.5 rounded transition-colors"
            >
              Send
            </button>
          </div>
        )}
      </div>

      {/* Approvals */}
      {onAction && (request.status === "Pending" || request.status === "PENDING" || request.status === "PENDING_APPROVAL") && (
        <div className="mt-4 flex gap-2 pt-3 border-t border-gray-100">
          <button
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
            onClick={() => {
              setModalState({
                isOpen: true,
                title: "Approve Request",
                message: "Provide an approval comment (optional):",
                action: "approve"
              });
            }}
          >
            Approve Request
          </button>
          <button
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
            onClick={() => {
              setModalState({
                isOpen: true,
                title: "Reject Request",
                message: "Provide a rejection reason (optional):",
                action: "reject"
              });
            }}
          >
            Reject Request
          </button>
        </div>
      )}

      <InteractiveModal
        isOpen={modalState.isOpen}
        type="prompt"
        title={modalState.title}
        message={modalState.message}
        placeholder="Enter comment..."
        theme={modalState.action === "approve" ? "approve" : "danger"}
        onConfirm={(value) => {
          if (modalState.action) {
            onAction?.(request.id, modalState.action, value || undefined);
          }
          setModalState(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setModalState(prev => ({ ...prev, isOpen: false }))}
      />
    </motion.div>
  );
}
