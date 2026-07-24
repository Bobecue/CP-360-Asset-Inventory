import { useState, useEffect } from "react";
import { Supplier } from "@/types/dashboard";
import { getApiUrl } from "@/utils/api";

interface SuppliersTabProps {
  currentUser?: any | null;
}

export const SuppliersTab = ({ currentUser }: SuppliersTabProps) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [assignableAssets, setAssignableAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplierForAssets, setSelectedSupplierForAssets] = useState<Supplier | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);

  // Form Fields
  const [formSupplierId, setFormSupplierId] = useState("");
  const [formName, setFormName] = useState("");
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formProvince, setFormProvince] = useState("");
  const [formCountry, setFormCountry] = useState("Philippines");
  const [formLeadTime, setFormLeadTime] = useState<number>(7);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Asset Assignment Selection State
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [assetSearchTerm, setAssetSearchTerm] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(getApiUrl("/suppliers"));
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      const json = await res.json();
      setSuppliers(json.data || []);
    } catch (err: any) {
      console.error(err);
      setError("Unable to load suppliers list.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssignableAssets = async () => {
    try {
      const res = await fetch(getApiUrl("/suppliers/assignable-assets"));
      if (!res.ok) throw new Error("Failed to fetch assignable assets");
      const json = await res.json();
      setAssignableAssets(json.data || []);
    } catch (err) {
      console.error("Error fetching assets:", err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchAssignableAssets();
  }, []);

  const resetForm = () => {
    setFormSupplierId("");
    setFormName("");
    setFormContactPerson("");
    setFormEmail("");
    setFormPhone("");
    setFormAddress("");
    setFormCity("");
    setFormProvince("");
    setFormCountry("Philippines");
    setFormLeadTime(7);
    setFormError(null);
    setEditingSupplier(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    resetForm();
    setEditingSupplier(sup);
    setFormSupplierId(sup.supplierId || "");
    setFormName(sup.name);
    setFormContactPerson(sup.contactPerson || "");
    setFormEmail(sup.email || "");
    setFormPhone(sup.phone || "");
    setFormAddress(sup.address || "");
    setFormCity(sup.city || "");
    setFormProvince(sup.province || "");
    setFormCountry(sup.country || "Philippines");
    setFormLeadTime(sup.leadTimeDays || 7);
    setIsAddModalOpen(true);
  };

  const handleSubmitSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Supplier Name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      const payload = {
        supplierId: formSupplierId.trim() || undefined,
        name: formName.trim(),
        contactPerson: formContactPerson.trim() || undefined,
        email: formEmail.trim() || undefined,
        phone: formPhone.trim() || undefined,
        address: formAddress.trim() || undefined,
        city: formCity.trim() || undefined,
        province: formProvince.trim() || undefined,
        country: formCountry.trim() || undefined,
        leadTimeDays: Number(formLeadTime) || 7,
      };

      const url = editingSupplier
        ? getApiUrl(`/suppliers/${editingSupplier.id}`)
        : getApiUrl("/suppliers");
      const method = editingSupplier ? "PATCH" : "POST";

      console.log("[SuppliersTab] Submitting supplier payload:", payload, "URL:", url);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      console.log("[SuppliersTab] Backend response:", json);

      if (!res.ok) {
        throw new Error(json.message || "Failed to save supplier.");
      }

      const savedSupplier = json.data;
      if (savedSupplier && savedSupplier.id) {
        setSuppliers((prev) => {
          const index = prev.findIndex((s) => s.id === savedSupplier.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = { ...updated[index], ...savedSupplier };
            return updated;
          }
          return [savedSupplier, ...prev];
        });
      }

      setIsAddModalOpen(false);
      resetForm();
      fetchSuppliers();
    } catch (err: any) {
      console.error("[SuppliersTab] Error saving supplier:", err);
      setFormError(err.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete supplier "${name}"?`)) return;

    try {
      const res = await fetch(getApiUrl(`/suppliers/${id}`), {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.message || "Failed to delete supplier.");
        return;
      }
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting the supplier.");
    }
  };

  const handleOpenAssignModal = (supplier: Supplier) => {
    setSelectedSupplierForAssets(supplier);
    // Pre-select currently assigned asset IDs
    const currentAssigned = (supplier.assets || []).map((a) => a.id);
    setSelectedAssetIds(currentAssigned);
    setAssetSearchTerm("");
    setIsAssignModalOpen(true);
  };

  const handleSaveAssignments = async () => {
    if (!selectedSupplierForAssets) return;
    try {
      setIsAssigning(true);
      const res = await fetch(
        getApiUrl(`/suppliers/${selectedSupplierForAssets.id}/assign-assets`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetIds: selectedAssetIds }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to assign assets.");

      setIsAssignModalOpen(false);
      setSelectedSupplierForAssets(null);
      fetchSuppliers();
      fetchAssignableAssets();
    } catch (err: any) {
      alert(err.message || "Error saving asset assignments.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassignSingleAsset = async (assetId: string) => {
    try {
      const res = await fetch(getApiUrl(`/suppliers/assets/${assetId}/unassign`), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to unassign asset");
      fetchSuppliers();
      fetchAssignableAssets();
      if (viewingSupplier) {
        setViewingSupplier({
          ...viewingSupplier,
          assets: (viewingSupplier.assets || []).filter((a) => a.id !== assetId),
        });
      }
    } catch (err) {
      console.error(err);
      alert("Error unassigning asset.");
    }
  };

  // Filtered suppliers
  const filteredSuppliers = suppliers.filter((s) => {
    if (!searchTerm || searchTerm.trim() === "") return true;
    const q = searchTerm.toLowerCase().trim();
    return (
      (s.supplierId || "").toLowerCase().includes(q) ||
      (s.name || "").toLowerCase().includes(q) ||
      (s.contactPerson || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.phone || "").toLowerCase().includes(q) ||
      (s.city || "").toLowerCase().includes(q) ||
      (s.province || "").toLowerCase().includes(q) ||
      (s.country || "").toLowerCase().includes(q)
    );
  });

  // Filtered assignable assets inside modal
  const filteredAssets = assignableAssets.filter((a) => {
    const q = assetSearchTerm.toLowerCase();
    const tag = (a.tagCode || "").toLowerCase();
    const serial = (a.serialNumber || "").toLowerCase();
    const name = (a.item?.name || "").toLowerCase();
    const cat = (a.item?.category?.name || "").toLowerCase();
    const site = (a.site?.name || "").toLowerCase();
    return tag.includes(q) || serial.includes(q) || name.includes(q) || cat.includes(q) || site.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V10m0 0V4" />
            </svg>
            Supplier Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage vendor details, contact info, locations, and assign suppliers to assets.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-indigo-200 dark:shadow-none"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New Supplier
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search suppliers by ID, Name, Contact Person, Email, Phone, City, Country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm bg-transparent border-none focus:outline-none text-gray-900 dark:text-white placeholder-gray-400"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-xs text-gray-400 hover:text-gray-600">
              Clear
            </button>
          )}
        </div>

        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-800/80 p-4 rounded-xl border border-indigo-100 dark:border-gray-700/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Total Vendors</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{suppliers.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-gray-700 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold">
            {suppliers.length}
          </div>
        </div>
      </div>

      {/* Main Table / Grid */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading supplier records...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 text-center">
          <p className="font-semibold">{error}</p>
          <button onClick={fetchSuppliers} className="mt-3 text-xs underline text-red-600 dark:text-red-400 font-medium">
            Try Again
          </button>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm text-center">
          <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-base font-semibold text-gray-900 dark:text-white">No suppliers found</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Try adjusting your search criteria or add a new supplier.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 12h10M7 17h10" />
                      </svg>
                      <span>Supplier ID</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V10m0 0V4" />
                      </svg>
                      <span>Supplier Name</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Contact Person</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Contact Details</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Location</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span>Assigned Assets</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">
                      {s.supplierId ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60 shadow-xs">
                          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                            S
                          </span>
                          <span>{s.supplierId}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 italic font-sans">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center shadow-sm shrink-0">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {s.contactPerson ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-700/60 dark:text-gray-200 dark:border-gray-600 shadow-2xs">
                          <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{s.contactPerson}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 italic">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        {s.email && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>{s.email}</span>
                          </div>
                        )}
                        {s.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{s.phone}</span>
                          </div>
                        )}
                        {!s.email && !s.phone && <span className="text-xs text-gray-400 italic">No contact info</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300">
                      {[s.city, s.province, s.country].filter(Boolean).length > 0 ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/60 shadow-xs">
                            <span className="w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0">
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                            </span>
                            <span>{[s.city, s.province].filter(Boolean).join(", ")}</span>
                          </span>
                          {s.address && (
                            <div className="text-[11px] text-gray-400 pl-1 truncate max-w-[200px]">
                              {s.address}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No location info</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setViewingSupplier(s)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        {((s._count?.assets || (s.assets || []).length) + (s._count?.items || (s.items || []).length))} Assigned
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          title="Edit Supplier"
                          className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(s.id, s.name)}
                          title="Delete Supplier"
                          className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      {isAddModalOpen && (
        <div style={{
          position: "fixed",
          top: 0, left: 0,
          width: "100%", height: "100%",
          backgroundColor: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          paddingTop: "4rem",
          paddingBottom: "2rem",
          zIndex: 1000,
        }}>
          <div style={{
            width: "100%",
            maxWidth: "600px",
            maxHeight: "90vh",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            border: "1px solid #e2e8f0",
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                <h3 style={{ fontSize: "0.98rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
                </h3>
                <p style={{ fontSize: "0.72rem", color: "#64748b", margin: 0 }}>
                  {editingSupplier ? "Modify supplier contact and location details." : "Register a new vendor/supplier into your inventory system."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#94a3b8", padding: 4, display: "flex", borderRadius: 4,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitSupplier} style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.5rem" }}>
              {formError && (
                <div style={{
                  padding: "0.6rem 0.85rem",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fca5a5",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  color: "#991b1b",
                  fontWeight: 500,
                }}>
                  {formError}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>
                      Supplier ID (Optional / Auto)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SUP-0001"
                      value={formSupplierId}
                      onChange={(e) => setFormSupplierId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.45rem 0.65rem",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.8rem",
                        color: "#1e293b",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>
                      Supplier Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dell Philippines"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.45rem 0.65rem",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.8rem",
                        color: "#1e293b",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>
                      Contact Person
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Juan Dela Cruz"
                      value={formContactPerson}
                      onChange={(e) => setFormContactPerson(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.45rem 0.65rem",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.8rem",
                        color: "#1e293b",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. sales@vendor.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.45rem 0.65rem",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.8rem",
                        color: "#1e293b",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +63 (2) 8123-4567"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.45rem 0.65rem",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.8rem",
                        color: "#1e293b",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>
                      Lead Time (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formLeadTime}
                      onChange={(e) => setFormLeadTime(Number(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "0.45rem 0.65rem",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.8rem",
                        color: "#1e293b",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>
                    Street Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bldg 4, Tech Plaza, Ayala Ave"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.65rem",
                      borderRadius: 6,
                      border: "1px solid #e2e8f0",
                      fontSize: "0.8rem",
                      color: "#1e293b",
                      outline: "none",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Makati"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.45rem 0.65rem",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.8rem",
                        color: "#1e293b",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>
                      Province / State
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Metro Manila"
                      value={formProvince}
                      onChange={(e) => setFormProvince(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.45rem 0.65rem",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.8rem",
                        color: "#1e293b",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#475569" }}>
                      Country
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Philippines"
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.45rem 0.65rem",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: "0.8rem",
                        color: "#1e293b",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.5rem",
                marginTop: "0.75rem",
                borderTop: "1px solid #f1f5f9",
                paddingTop: "1rem",
              }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  style={{
                    padding: "0.45rem 1rem",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    background: "transparent",
                    color: "#475569",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: "0.45rem 1.25rem",
                    borderRadius: 6,
                    border: "none",
                    background: "linear-gradient(135deg, #210cae 0%, #4dc9e6 100%)",
                    color: "#ffffff",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(33,12,174,0.1)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div style={{
                        width: 12, height: 12, borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#ffffff",
                        animation: "spin 1s linear infinite",
                      }} />
                      Saving...
                    </>
                  ) : (
                    editingSupplier ? "Update Supplier" : "Save Supplier"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Assets Modal */}
      {isAssignModalOpen && selectedSupplierForAssets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Assign Assets to Supplier
                </h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                  {selectedSupplierForAssets.name} ({selectedSupplierForAssets.supplierId || "No ID"})
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="Search assets by tag, serial number, item name, site..."
                  value={assetSearchTerm}
                  onChange={(e) => setAssetSearchTerm(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {filteredAssets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const filteredIds = filteredAssets.map((a) => a.id);
                      const allSelected = filteredIds.every((id) => selectedAssetIds.includes(id));
                      if (allSelected) {
                        setSelectedAssetIds(selectedAssetIds.filter((id) => !filteredIds.includes(id)));
                      } else {
                        const newSet = new Set([...selectedAssetIds, ...filteredIds]);
                        setSelectedAssetIds(Array.from(newSet));
                      }
                    }}
                    className="shrink-0 text-xs px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold rounded-xl transition-colors border border-indigo-200/50 dark:border-indigo-800/40"
                  >
                    {filteredAssets.every((a) => selectedAssetIds.includes(a.id)) ? "Deselect All" : "Select All"}
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-700/60">
                {filteredAssets.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400">
                    No matching assets available in the system catalog.
                  </div>
                ) : (
                  filteredAssets.map((asset) => {
                    const isChecked = selectedAssetIds.includes(asset.id);
                    const isAssignedToOther =
                      asset.supplier && asset.supplier.id !== selectedSupplierForAssets.id;

                    return (
                      <label
                        key={asset.id}
                        className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-indigo-50/60 dark:bg-indigo-950/40"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAssetIds([...selectedAssetIds, asset.id]);
                              } else {
                                setSelectedAssetIds(selectedAssetIds.filter((id) => id !== asset.id));
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                                {asset.tagCode}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md font-medium">
                                {asset.item?.name || "Item"}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                              S/N: {asset.serialNumber} | Site: {asset.site?.name || "N/A"}
                            </div>
                          </div>
                        </div>

                        {isAssignedToOther && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-md font-medium">
                            Currently: {asset.supplier.name}
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-500 font-medium">
                {selectedAssetIds.length} asset(s) selected
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAssignments}
                  disabled={isAssigning}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  {isAssigning ? "Assigning..." : "Save Assignments"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Supplier Assets Drawer / Modal */}
      {viewingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Assigned Assets — {viewingSupplier.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  ID: {viewingSupplier.supplierId || "—"} | Contact: {viewingSupplier.contactPerson || "N/A"}
                </p>
              </div>
              <button
                onClick={() => setViewingSupplier(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/60">
              {((!viewingSupplier.assets || viewingSupplier.assets.length === 0) && (!viewingSupplier.items || viewingSupplier.items.length === 0)) ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  No assets or catalog items currently assigned to this supplier.
                </div>
              ) : (
                <>
                  {viewingSupplier.items?.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-bold">
                            CATALOG ITEM
                          </span>
                          <span className="text-xs font-semibold text-gray-900 dark:text-white">
                            {item.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          SKU: {item.sku} | Category: {item.category?.name || "N/A"}
                        </div>
                      </div>
                    </div>
                  ))}
                  {viewingSupplier.assets?.map((asset) => (
                    <div key={asset.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {asset.tagCode}
                          </span>
                          <span className="text-xs font-semibold text-gray-900 dark:text-white">
                            {asset.item?.name || "Asset Item"}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          S/N: {asset.serialNumber} | Site: {asset.site?.name || "N/A"} | Status: {asset.status}
                        </div>
                      </div>

                      <button
                        onClick={() => handleUnassignSingleAsset(asset.id)}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
                      >
                        Unassign
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
              <button
                onClick={() => setViewingSupplier(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
