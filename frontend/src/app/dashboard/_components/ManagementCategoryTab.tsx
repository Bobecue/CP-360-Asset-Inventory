"use client";

import React, { useState, useEffect } from "react";

interface ExpenseCategory {
  id: string;
  name: string;
  type: "OPEX" | "CAPEX";
  isActive: boolean;
  transactionCount?: number;
  createdAt: string;
}

interface SiteLocation {
  id: string;
  name: string;
  prefix?: string;
  address?: string;
  isActive: boolean;
  transactionCount?: number;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  previousValue?: string;
  newValue?: string;
  createdAt: string;
  performedByUser?: { name: string; email: string; role: string };
  category?: { name: string };
  site?: { name: string };
}

export default function ManagementCategoryTab({ currentUser }: { currentUser: any }) {
  const [activeTab, setActiveTab] = useState<"categories" | "sites" | "audit">("categories");

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [sites, setSites] = useState<SiteLocation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);

  const [isAddSiteOpen, setIsAddSiteOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteLocation | null>(null);

  // Category Form
  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState<"OPEX" | "CAPEX">("OPEX");

  // Site Form
  const [siteName, setSiteName] = useState("");
  const [sitePrefix, setSitePrefix] = useState("");
  const [siteAddress, setSiteAddress] = useState("");

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const userHeader = currentUser?.email || "superadmin@contactpoint360.com";

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${backendUrl}/categories`, { headers: { "x-user": userHeader } });
      const json = await res.json();
      setCategories(json.data || []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchSites = async () => {
    try {
      const res = await fetch(`${backendUrl}/categories/sites`, { headers: { "x-user": userHeader } });
      const json = await res.json();
      setSites(json.data || []);
    } catch (err) {
      console.error("Failed to fetch sites:", err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`${backendUrl}/categories/audit-logs`, { headers: { "x-user": userHeader } });
      const json = await res.json();
      setAuditLogs(json.data || []);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    }
  };

  const fetchAll = async () => {
    setIsLoading(true);
    await Promise.all([fetchCategories(), fetchSites(), fetchAuditLogs()]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const role = currentUser?.role || "EMPLOYEE";
  const normalizedRole = (role || "").toUpperCase().replace(/[\s\-]/g, "_");
  const isSuperAdmin = normalizedRole === "SUPER_ADMIN";

  if (!isSuperAdmin) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 m-6 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-rose-800 dark:text-rose-400 mb-1">Access Restricted</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Management Category configuration is restricted exclusively to Super Admin users.
        </p>
      </div>
    );
  }

  // Handle Category Submit
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    try {
      const isEdit = !!editingCategory;
      const url = isEdit ? `${backendUrl}/categories/${editingCategory.id}` : `${backendUrl}/categories`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user": userHeader,
        },
        body: JSON.stringify({
          name: catName,
          type: catType,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.message || "Failed to save category");
        return;
      }

      setIsAddCategoryOpen(false);
      setEditingCategory(null);
      setCatName("");
      setCatType("OPEX");
      fetchAll();
    } catch (err: any) {
      alert(`Error saving category: ${err.message}`);
    }
  };

  // Toggle Category Active Status
  const handleToggleCategoryActive = async (cat: ExpenseCategory) => {
    const actionText = cat.isActive ? "deactivate" : "reactivate";
    if (!confirm(`Are you sure you want to ${actionText} category "${cat.name}"?`)) return;

    try {
      const res = await fetch(`${backendUrl}/categories/${cat.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user": userHeader,
        },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.message || `Failed to ${actionText} category`);
        return;
      }
      fetchAll();
    } catch (err: any) {
      alert(`Error updating category: ${err.message}`);
    }
  };

  // Handle Site Submit
  const handleSaveSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) return;

    try {
      const isEdit = !!editingSite;
      const url = isEdit ? `${backendUrl}/categories/sites/${editingSite.id}` : `${backendUrl}/categories/sites`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user": userHeader,
        },
        body: JSON.stringify({
          name: siteName,
          prefix: sitePrefix || undefined,
          address: siteAddress || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.message || "Failed to save site");
        return;
      }

      setIsAddSiteOpen(false);
      setEditingSite(null);
      setSiteName("");
      setSitePrefix("");
      setSiteAddress("");
      fetchAll();
    } catch (err: any) {
      alert(`Error saving site: ${err.message}`);
    }
  };

  // Toggle Site Active Status
  const handleToggleSiteActive = async (site: SiteLocation) => {
    const actionText = site.isActive ? "deactivate" : "reactivate";
    if (!confirm(`Are you sure you want to ${actionText} site "${site.name}"?`)) return;

    try {
      const res = await fetch(`${backendUrl}/categories/sites/${site.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user": userHeader,
        },
        body: JSON.stringify({ isActive: !site.isActive }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.message || `Failed to ${actionText} site`);
        return;
      }
      fetchAll();
    } catch (err: any) {
      alert(`Error updating site: ${err.message}`);
    }
  };

  // Filtered Lists
  const filteredCategories = categories.filter(c =>
    (c.name || "").toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const filteredSites = sites.filter(s =>
    (s.name || "").toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
    (s.prefix || "").toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className="space-y-6 animate-module-flip p-6 text-slate-800 w-full min-h-full flex flex-col flex-1">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animated-mesh-background p-6 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Management Category
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Standardize master lists for Expense Categories, OPEX/CAPEX type mappings, and Site Locations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "categories" && (
            <button
              onClick={() => {
                setEditingCategory(null);
                setCatName("");
                setCatType("OPEX");
                setIsAddCategoryOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-indigo-200 dark:shadow-none"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Category
            </button>
          )}
          {activeTab === "sites" && (
            <button
              onClick={() => {
                setEditingSite(null);
                setSiteName("");
                setSitePrefix("");
                setSiteAddress("");
                setIsAddSiteOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-indigo-200 dark:shadow-none"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Site / Location
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === "categories"
              ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Expense Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab("sites")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === "sites"
              ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Sites & Locations ({sites.length})
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === "audit"
              ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          Category Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* Search Bar */}
      {activeTab !== "audit" && (
        <div className="animated-mesh-background p-4 rounded-xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={activeTab === "categories" ? "Search categories by name..." : "Search sites by name or prefix..."}
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
      )}

      {/* Tab 1: Expense Categories */}
      {activeTab === "categories" && (
        <div className="animated-mesh-background rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">CATEGORY NAME</th>
                  <th className="px-6 py-4 font-semibold">TYPE MAPPING</th>
                  <th className="px-6 py-4 font-semibold">STATUS</th>
                  <th className="px-6 py-4 font-semibold text-right">TRANSACTION USAGE</th>
                  <th className="px-6 py-4 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading categories...</td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No categories found.</td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white text-xs">
                        {cat.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                          cat.type === "CAPEX" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                        }`}>
                          {cat.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          cat.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}>
                          {cat.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-medium">
                        <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 font-bold">
                          {cat.transactionCount || 0} entries
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setCatName(cat.name);
                            setCatType(cat.type);
                            setIsAddCategoryOpen(true);
                          }}
                          className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleCategoryActive(cat)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border shadow-sm ${
                            cat.isActive
                              ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          {cat.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Sites & Locations */}
      {activeTab === "sites" && (
        <div className="animated-mesh-background rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">SITE NAME</th>
                  <th className="px-6 py-4 font-semibold">PREFIX</th>
                  <th className="px-6 py-4 font-semibold">ADDRESS</th>
                  <th className="px-6 py-4 font-semibold">STATUS</th>
                  <th className="px-6 py-4 font-semibold text-right">TRANSACTION USAGE</th>
                  <th className="px-6 py-4 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading sites...</td>
                  </tr>
                ) : filteredSites.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No sites found.</td>
                  </tr>
                ) : (
                  filteredSites.map((site) => (
                    <tr key={site.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white text-xs">
                        {site.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                        {site.prefix || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                        {site.address || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          site.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}>
                          {site.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-medium">
                        <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 font-bold">
                          {site.transactionCount || 0} entries
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingSite(site);
                            setSiteName(site.name);
                            setSitePrefix(site.prefix || "");
                            setSiteAddress(site.address || "");
                            setIsAddSiteOpen(true);
                          }}
                          className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleSiteActive(site)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border shadow-sm ${
                            site.isActive
                              ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          {site.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Category Audit Logs */}
      {activeTab === "audit" && (
        <div className="animated-mesh-background rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">DATE / TIME</th>
                  <th className="px-6 py-4 font-semibold">ACTION</th>
                  <th className="px-6 py-4 font-semibold">TARGET</th>
                  <th className="px-6 py-4 font-semibold">PERFORMED BY</th>
                  <th className="px-6 py-4 font-semibold">DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No audit log records found.</td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                          log.action === "CREATED" ? "bg-emerald-100 text-emerald-800" :
                          log.action === "RENAMED" ? "bg-blue-100 text-blue-800" :
                          log.action === "DEACTIVATED" ? "bg-rose-100 text-rose-800" : "bg-purple-100 text-purple-800"
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-xs text-gray-900 dark:text-white">
                        {log.category?.name || log.site?.name || "System Record"}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-gray-700 dark:text-gray-300">
                        {log.performedByUser?.name || log.performedByUser?.email || "Super Admin"}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate font-mono">
                        {log.newValue || log.previousValue || "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4 z-[99999]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingCategory ? "Edit Expense Category" : "Add Expense Category"}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., MAINTENANCE_REPAIRS"
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Expenditure Type *</label>
                <select
                  value={catType}
                  onChange={e => setCatType(e.target.value as any)}
                  className="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="OPEX">OPEX (Operating Expenditure)</option>
                  <option value="CAPEX">CAPEX (Capital Expenditure)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Site Modal */}
      {isAddSiteOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4 z-[99999]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingSite ? "Edit Site / Location" : "Add Site / Location"}
            </h3>
            <form onSubmit={handleSaveSite} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Site Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Skyrise 4B"
                  value={siteName}
                  onChange={e => setSiteName(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Prefix / Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., CEB"
                  value={sitePrefix}
                  onChange={e => setSitePrefix(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Address (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., IT Park, Lahug, Cebu City"
                  value={siteAddress}
                  onChange={e => setSiteAddress(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSiteOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Save Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
