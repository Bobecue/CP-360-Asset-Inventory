"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { User } from "@/types/dashboard";

interface ImportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: any[];
  departments: any[];
  onImportSuccess: (importedUsers: any[]) => void;
}

export const ImportUserModal = ({
  isOpen,
  onClose,
  sites = [],
  departments = [],
  onImportSuccess,
}: ImportUserModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Generate and download Excel Template matching the "Create User Account" form layout
  const handleDownloadTemplate = () => {
    const defaultSite = sites[0]?.name || "Skyrise 4B (SK4)";
    const defaultDept = departments[0]?.name || "IT Department";

    const templateData = [
      {
        "First Name *": "John",
        "Last Name *": "Doe",
        "Email Address *": "john.doe@contactpoint360.com",
        "System Role *": "Employee", // Employee, Team Leader, Inventory Staff, Ops Manager, Super Admin
        "Employee ID": "EID - 00021",
        "Account Type": "IT Staff",
        "Assigned Site *": defaultSite,
        "Department": defaultDept,
      },
      {
        "First Name *": "Jane",
        "Last Name *": "Smith",
        "Email Address *": "jane.smith@contactpoint360.com",
        "System Role *": "Team Leader",
        "Employee ID": "EID - 00022",
        "Account Type": "HR Officer",
        "Assigned Site *": defaultSite,
        "Department": defaultDept,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Auto fit column widths
    const colWidths = [
      { wch: 16 }, // First Name
      { wch: 16 }, // Last Name
      { wch: 32 }, // Email Address
      { wch: 20 }, // System Role
      { wch: 16 }, // Employee ID
      { wch: 22 }, // Account Type
      { wch: 25 }, // Assigned Site
      { wch: 25 }, // Department
    ];
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "User Import Template");
    XLSX.writeFile(workbook, "User_Import_Template.xlsx");
  };

  // Helper to normalize role names to backend role keys
  const mapRoleToKey = (roleStr: string): string => {
    const r = roleStr.trim().toUpperCase().replace(/[\s\-]/g, "_");
    if (r.includes("SUPER")) return "SUPER_ADMIN";
    if (r.includes("OPS") || r.includes("ADMIN")) return "ADMIN";
    if (r.includes("INVENTORY") || r.includes("STAFF")) return "INVENTORY_STAFF";
    if (r.includes("LEAD") || r.includes("TEAM")) return "TEAM_LEADER";
    return "EMPLOYEE";
  };

  // Parse file and validate rows
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);
    setPreviewData([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);

        if (rawData.length === 0) {
          setErrors(["The selected file contains no data rows."]);
          return;
        }

        const parsedRows: any[] = [];
        const errList: string[] = [];

        rawData.forEach((row: any, idx: number) => {
          const rowNum = idx + 2; // Row offset considering header

          const findValue = (keys: string[]) => {
            const rowKeys = Object.keys(row);
            for (const key of keys) {
              const matchedKey = rowKeys.find(rk => rk.trim().toLowerCase().replace(/[\*\(\)\₱\$\s]/g, '') === key.trim().toLowerCase().replace(/[\*\(\)\₱\$\s]/g, ''));
              if (matchedKey !== undefined && row[matchedKey] !== undefined && row[matchedKey] !== null) {
                return row[matchedKey];
              }
            }
            return undefined;
          };

          const firstName = (findValue(["First Name *", "First Name", "FirstName"]) || "").toString().trim();
          const lastName = (findValue(["Last Name *", "Last Name", "LastName"]) || "").toString().trim();
          const email = (findValue(["Email Address *", "Email Address", "Email"]) || "").toString().trim();
          const roleRaw = (findValue(["System Role *", "System Role", "Role"]) || "Employee").toString().trim();
          const employeeId = (findValue(["Employee ID", "EmployeeID", "EID"]) || "").toString().trim();
          const accountType = (findValue(["Account Type", "AccountType", "Account"]) || "").toString().trim();
          const locationName = (findValue(["Assigned Site *", "Assigned Site", "Site", "Location"]) || "").toString().trim();
          const departmentName = (findValue(["Department", "Dept"]) || "").toString().trim();

          // Validation
          if (!firstName) {
            errList.push(`Row ${rowNum}: First Name is required.`);
          }
          if (!lastName) {
            errList.push(`Row ${rowNum}: Last Name is required.`);
          }
          if (!email || !email.includes("@")) {
            errList.push(`Row ${rowNum}: Valid Email Address is required.`);
          }

          // Match site
          let matchedSite = sites.find(s => s.id === locationName || s.name.toLowerCase() === locationName.toLowerCase() || s.prefix?.toLowerCase() === locationName.toLowerCase());
          if (!matchedSite && sites.length > 0) {
            matchedSite = sites[0]; // Fallback default
          }

          // Match department
          let matchedDept = departments.find(d => d.id === departmentName || d.name.toLowerCase() === departmentName.toLowerCase());
          if (!matchedDept && departments.length > 0) {
            matchedDept = departments[0];
          }

          const roleKey = mapRoleToKey(roleRaw);

          parsedRows.push({
            rowNum,
            firstName,
            lastName,
            name: `${firstName} ${lastName}`.trim(),
            email,
            role: roleKey,
            roleDisplay: roleRaw || roleKey,
            employeeId: employeeId || null,
            accountType: accountType || null,
            siteId: matchedSite?.id || sites[0]?.id || "",
            siteName: matchedSite?.name || "Default Site",
            department: matchedDept?.name || departmentName || "IT Department",
          });
        });

        setErrors(errList);
        setPreviewData(parsedRows);
      } catch (err: any) {
        setErrors([`Failed to parse Excel file: ${err.message || "Invalid format"}`]);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleConfirmImport = async () => {
    if (previewData.length === 0 || errors.length > 0) return;
    setIsProcessing(true);

    try {
      await onImportSuccess(previewData);
      setFile(null);
      setPreviewData([]);
      setErrors([]);
      onClose();
    } catch (err: any) {
      setErrors([`Error saving imported users: ${err.message || "Failed"}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0,
      width: "100%", height: "100%",
      backgroundColor: "rgba(15, 23, 42, 0.4)",
      backdropFilter: "blur(4px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    }}>
      <div style={{
        width: "100%",
        maxWidth: "720px",
        maxHeight: "90vh",
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        overflow: "hidden",
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
          backgroundColor: "#F8FAFC"
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#210cae" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>
              Import User Accounts from Excel
            </h3>
            <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0 }}>
              Batch create authenticated user accounts using standard Excel template matching your Create User fields.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#94a3b8", padding: 4, display: "flex", borderRadius: 4,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: "1.5rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Download Template Banner */}
          <div style={{
            padding: "1rem 1.25rem",
            backgroundColor: "#EEF2FF",
            borderRadius: "12px",
            border: "1px solid #C7D2FE",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: 36, height: 36, borderRadius: "8px", backgroundColor: "#210cae", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
              </div>
              <div>
                <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E1B4B", margin: 0 }}>Need the Excel Template?</h4>
                <p style={{ fontSize: "0.75rem", color: "#4338CA", margin: 0 }}>Download pre-formatted Excel template matching the Create User fields.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              style={{
                height: "36px",
                padding: "0 14px",
                backgroundColor: "#FFFFFF",
                color: "#210cae",
                border: "1px solid #C7D2FE",
                borderRadius: "8px",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                whiteSpace: "nowrap"
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Download Template
            </button>
          </div>

          {/* File Upload Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed #CBD5E1",
              borderRadius: "12px",
              padding: "2rem 1rem",
              textAlign: "center",
              backgroundColor: "#F8FAFC",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#210cae";
              e.currentTarget.style.backgroundColor = "#F5F3FF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#CBD5E1";
              e.currentTarget.style.backgroundColor = "#F8FAFC";
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "#E0E7FF", color: "#210cae", margin: "0 auto 10px auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            </div>
            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155", margin: "0 0 4px 0" }}>
              {file ? file.name : "Click to select or drop your Excel file here"}
            </p>
            <p style={{ fontSize: "0.75rem", color: "#94A3B8", margin: 0 }}>
              Supports .xlsx, .xls, and .csv files. Automatic password initialization applied.
            </p>
          </div>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div style={{
              backgroundColor: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: "8px",
              padding: "0.85rem",
              fontSize: "0.78rem",
              color: "#991B1B",
              maxHeight: "120px",
              overflowY: "auto"
            }}>
              <strong style={{ display: "block", marginBottom: "4px" }}>Please fix the following validation errors:</strong>
              <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Table */}
          {previewData.length > 0 && errors.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>
                  Preview Ready Rows ({previewData.length})
                </span>
                <span style={{ fontSize: "0.72rem", color: "#10B981", fontWeight: 600 }}>
                  ✓ All user rows validated
                </span>
              </div>
              <div style={{
                maxHeight: "220px",
                overflowY: "auto",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#F1F5F9", color: "#475569", fontWeight: 600 }}>
                      <th style={{ padding: "8px 10px" }}>Name</th>
                      <th style={{ padding: "8px 10px" }}>Email</th>
                      <th style={{ padding: "8px 10px" }}>Role</th>
                      <th style={{ padding: "8px 10px" }}>Emp ID</th>
                      <th style={{ padding: "8px 10px" }}>Account</th>
                      <th style={{ padding: "8px 10px" }}>Site</th>
                      <th style={{ padding: "8px 10px" }}>Dept</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "8px 10px", fontWeight: 600, color: "#1E293B" }}>{row.name}</td>
                        <td style={{ padding: "8px 10px", color: "#475569" }}>{row.email}</td>
                        <td style={{ padding: "8px 10px", color: "#210cae", fontWeight: 600 }}>{row.role}</td>
                        <td style={{ padding: "8px 10px", color: "#64748B" }}>{row.employeeId || "-"}</td>
                        <td style={{ padding: "8px 10px", color: "#15803d", fontWeight: 600 }}>{row.accountType || "-"}</td>
                        <td style={{ padding: "8px 10px", color: "#334155" }}>{row.siteName}</td>
                        <td style={{ padding: "8px 10px", color: "#334155" }}>{row.department}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.5rem",
          padding: "1rem 1.5rem",
          borderTop: "1px solid #F1F5F9",
          backgroundColor: "#F8FAFC"
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            style={{
              padding: "0.5rem 1.1rem",
              borderRadius: "8px",
              border: "1px solid #CBD5E1",
              background: "#FFFFFF",
              color: "#475569",
              fontSize: "0.82rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={previewData.length === 0 || errors.length > 0 || isProcessing}
            style={{
              padding: "0.5rem 1.4rem",
              borderRadius: "8px",
              border: "none",
              background: previewData.length > 0 && errors.length === 0 ? "linear-gradient(135deg, #210cae 0%, #4dc9e6 100%)" : "#94A3B8",
              color: "#FFFFFF",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: previewData.length > 0 && errors.length === 0 ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 4px rgba(33,12,174,0.2)",
            }}
          >
            {isProcessing ? "Importing Users..." : `Import ${previewData.length > 0 ? previewData.length : ""} User(s)`}
          </button>
        </div>

      </div>
    </div>
  );
};
