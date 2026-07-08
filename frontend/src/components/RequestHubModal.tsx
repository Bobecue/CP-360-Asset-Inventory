"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import RequestForm from "./RequestForm";
import Filters from "./Filters";
import { fetchRequests, updateRequest, addRequestComment } from "../lib/services/requestService";
import RequestCard, { type Request } from "./RequestCard";
import { toast } from "sonner";
import { Skeleton } from "./ui/Skeleton";
import { motion, AnimatePresence } from "framer-motion";

type Section = "submit" | "approval" | "history" | "admin";

interface RequestHubModalProps {
  isOpen: boolean;
  initialSection?: Section;
  onClose: () => void;
  currentUserRole?: string;
}

const formatDate = (value?: string) => {
  if (!value) return "";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function RequestHubModal({ isOpen, initialSection = "submit", onClose, currentUserRole }: RequestHubModalProps) {
  const [section, setSection] = useState<Section>(initialSection);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filters, setFilters] = useState<{ status?: string; role?: string; from?: string; to?: string }>({});
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async (sectionToLoad: Section = section, filterValues = filters) => {
    setLoading(true);
    setError(null);
    try {
      let query = "";
      if (sectionToLoad === "approval") query = "?status=Pending";
      else if (sectionToLoad === "history") query = "?mine=true";
      else if (sectionToLoad === "admin") {
        const qs = new URLSearchParams();
        if (filterValues.status) qs.set("status", filterValues.status);
        if (filterValues.role) qs.set("role", filterValues.role);
        if (filterValues.from) qs.set("from", filterValues.from);
        if (filterValues.to) qs.set("to", filterValues.to);
        query = qs.toString() ? `?${qs.toString()}` : "";
      }
      const data = await fetchRequests(query);
      setRequests(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [filters, section]);

  useEffect(() => {
    if (!isOpen) return;
    setSection(initialSection);
    setError(null);
    setRequests([]);
    if (initialSection !== "submit") {
      loadRequests(initialSection, filters);
    }
  }, [isOpen, initialSection, filters, loadRequests]);

  const handleAction = async (id: string, action: "approve" | "reject" | "comment", comment?: string) => {
    setLoading(true);
    try {
      if (action === "comment" && comment) {
        await addRequestComment(id, comment);
        toast.success("Comment added to request.");
      } else if (action !== "comment") {
        await updateRequest(id, action, comment);
        toast.success(`Request ${action}ed successfully.`);
      }
      await loadRequests();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast.error(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionSelect = async (sectionToOpen: Section) => {
    setSection(sectionToOpen);
    await loadRequests(sectionToOpen, filters);
  };

  const handleFilterChange = async (newFilters: { status?: string; role?: string; from?: string; to?: string }) => {
    setFilters(newFilters);
    setFilterLoading(true);
    try {
      await loadRequests(section, newFilters);
    } finally {
      setFilterLoading(false);
    }
  };

  const contentTitle = useMemo(() => {
    switch (section) {
      case "submit":
        return "Submit Inventory Request";
      case "approval":
        return "Approval Queue";
      case "history":
        return "My Request History";
      case "admin":
        return "Admin Request Management";
      default:
        return "Request Hub";
    }
  }, [section]);

  const resolveDisplayName = (req: any) => {
    let baseName = req.itemName || req.item || "";
    if (req.status === 'RELEASED' || req.status === 'RETURNED') {
      if (!req.assetTag) return baseName;
      const prefix = req.assetTag.substring(0, 3);
      const parts = req.assetTag.split('-');
      if (parts.length < 2) return baseName;
      const i = parseInt(parts[1], 10);
      const name = baseName.toLowerCase();
      let displayItemName = baseName;
      if (prefix === 'LAP' && !name.includes('macbook') && !name.includes('dell') && !name.includes('lenovo') && !name.includes('hp') && !name.includes('thinkpad')) {
        if (i % 3 === 1) displayItemName = 'MacBook Pro 14"';
        else if (i % 3 === 2) displayItemName = 'Dell Latitude 5440';
        else displayItemName = 'Lenovo ThinkPad X1 Carbon';
      }
      return displayItemName;
    }
    if (req.itemCategory && req.itemCategory !== 'Consumables') {
      const cat = req.itemCategory;
      if (cat === 'Laptops') return 'Laptop';
      if (cat === 'Accessories') return 'Accessory';
      if (cat === 'Accessories') return 'Accessory';
      return cat;
    }
    return baseName;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[1200] flex justify-center items-center p-5"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-[1040px] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl relative p-6 border border-white/20"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-10 h-10 rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors flex items-center justify-center text-xl z-10 shadow-sm"
            >
              ×
            </button>

            <div className="flex justify-between flex-wrap gap-4 items-center mb-5">
              <div>
                <h2 className="m-0 text-2xl font-extrabold text-slate-900">{contentTitle}</h2>
                <p className="mt-2 text-slate-500 max-w-[560px]">
                  Manage request submission, approvals, personal history, and admin workflows from one popup.
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                {(["submit", "approval", "history", "admin"] as Section[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSectionSelect(option)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer border-none transition-all duration-200 ${
                      section === option ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {option === "submit" ? "Submit" : option === "approval" ? "Approval" : option === "history" ? "My History" : "Admin"}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-xl border border-red-200">
                {error}
              </div>
            )}

            {section === "submit" ? (
              <div className="grid gap-6">
                <RequestForm onSuccess={() => {
                  setError(null);
                  setSection("history");
                  loadRequests("history");
                }} />
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                  <h3 className="m-0 text-base font-bold text-slate-900">Need approval fast?</h3>
                  <p className="mt-2 text-slate-600 leading-relaxed">Requests are automatically routed to the approval queue and tracked under your history once submitted.</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {section === "admin" && (
                  <Filters onChange={handleFilterChange} />
                )}
                <div className="grid gap-4">
                  {loading || filterLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="w-full h-32 rounded-xl" />
                      ))}
                    </div>
                  ) : requests.length === 0 ? (
                    <div className="text-slate-600">No requests found for this view.</div>
                  ) : (
                    requests.map((request: any) => (
                      <RequestCard key={request.id} request={{...request, item: resolveDisplayName(request)}} onAction={currentUserRole === "SUPER_ADMIN" ? undefined : handleAction} />
                    ))
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
