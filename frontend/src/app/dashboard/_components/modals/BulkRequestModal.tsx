'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';

type UrgencyLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

interface SelectedItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  category?: string;
  assetTags?: string[];
}

interface Site {
  id: string;
  name: string;
  prefix: string;
  address?: string;
}

interface BulkRequestModalProps {
  open: boolean;
  onClose: () => void;
  selectedItems: SelectedItem[];
  sites: Site[];
  currentUser?: any;
  initialMode?: 'deploy' | 'request';
  onSubmit: (requests: { itemId: string; quantity: number }[], siteId: string, reason: string, urgency: UrgencyLevel) => Promise<boolean>;
}

const getCategoryIcon = (category?: string, name?: string) => {
  const cat = (category || '').toLowerCase();
  const itemName = (name || '').toLowerCase();
  const text = cat + ' ' + itemName;

  // Laptops / Computers
  if (text.includes('laptop') || text.includes('macbook') || text.includes('computer') || text.includes('notebook') || text.includes('desktop') || text.includes('pc')) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="2" y1="20" x2="22" y2="20" />
        <line x1="12" y1="17" x2="12" y2="20" />
      </svg>
    );
  }

  // Monitors / Screens
  if (text.includes('monitor') || text.includes('display') || text.includes('screen') || text.includes('tv')) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="12" rx="2" ry="2" />
        <line x1="12" y1="15" x2="12" y2="21" />
        <line x1="8" y1="21" x2="16" y2="21" />
      </svg>
    );
  }

  // Headsets / Headphones / Jabra
  if (text.includes('headset') || text.includes('headphones') || text.includes('audio') || text.includes('earphone') || text.includes('jabra')) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    );
  }

  // Keyboards
  if (text.includes('keyboard')) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
        <line x1="6" y1="8" x2="6.01" y2="8" />
        <line x1="10" y1="8" x2="10.01" y2="8" />
        <line x1="14" y1="8" x2="14.01" y2="8" />
        <line x1="18" y1="8" x2="18.01" y2="8" />
        <line x1="6" y1="12" x2="6.01" y2="12" />
        <line x1="10" y1="12" x2="10.01" y2="12" />
        <line x1="14" y1="12" x2="14.01" y2="12" />
        <line x1="18" y1="12" x2="18.01" y2="12" />
        <line x1="7" y1="16" x2="17" y2="16" />
      </svg>
    );
  }

  // Mice / Pointers
  if (text.includes('mouse') || text.includes('logitech') || text.includes('trackpad') || text.includes('pointer')) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="7" />
        <path d="M12 2v6" />
      </svg>
    );
  }

  // Cables
  if (text.includes('cable') || text.includes('wire') || text.includes('ethernet') || text.includes('cat6') || text.includes('hdmi') || text.includes('usb')) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v8M18 12a6 6 0 0 1-6 6M6 12a6 6 0 0 0 6 6M12 18v4" />
        <line x1="8" y1="2" x2="8" y2="5" />
        <line x1="16" y1="2" x2="16" y2="5" />
      </svg>
    );
  }

  // Batteries & Power
  if (text.includes('battery') || text.includes('batteries') || text.includes('powerbank') || text.includes('charger') || text.includes('adapter') || text.includes('power')) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="16" height="10" rx="2" ry="2" />
        <line x1="22" y1="11" x2="22" y2="13" />
        <line x1="6" y1="11" x2="10" y2="11" />
        <line x1="8" y1="9" x2="8" y2="13" />
      </svg>
    );
  }

  // Phones & Mobiles
  if (text.includes('phone') || text.includes('mobile') || text.includes('smartphone') || text.includes('telephone')) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    );
  }

  // Writing & Paper Stationery / Supplies
  if (text.includes('pen') || text.includes('pencil') || text.includes('ink') || text.includes('stationery') || text.includes('paper') || text.includes('office') || text.includes('consumable')) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    );
  }

  // Accessories (Generic)
  if (text.includes('peripheral') || text.includes('accessory') || text.includes('accessories')) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    );
  }

  // Default box icon
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  );
};

export function BulkRequestModal({ open, onClose, selectedItems, sites, currentUser, initialMode, onSubmit }: BulkRequestModalProps) {
  const canDeploy = !currentUser || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'INVENTORY_STAFF' || currentUser?.role === 'OPS_MANAGER' || currentUser?.role === 'ADMIN';
  const [mode, setMode] = useState<'deploy' | 'request'>(initialMode || (canDeploy ? 'deploy' : 'request'));
  const isDeployMode = canDeploy && mode === 'deploy';

  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    selectedItems.forEach(it => {
      init[it.id] = 1;
    });
    return init;
  });

  // Employee & Deployment Fields
  const [employeeName, setEmployeeName] = useState('');
  const [employeeAccount, setEmployeeAccount] = useState('');
  const [employeeEid, setEmployeeEid] = useState('');
  const [reqSiteId, setReqSiteId] = useState('');
  const [deploymentNotes, setDeploymentNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reqFormError, setReqFormError] = useState<string | null>(null);

  if (!open) return null;

  const handleQuantityChange = (itemId: string, val: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(1, val)
    }));
  };

  const handleSubmit = async () => {
    setReqFormError(null);

    if (isDeployMode) {
      if (!employeeName.trim()) {
        setReqFormError("Employee's Name is required.");
        return;
      }
      if (!employeeAccount.trim()) {
        setReqFormError("Employee's Account is required.");
        return;
      }
      if (!employeeEid.trim()) {
        setReqFormError("Employee EID is required.");
        return;
      }
    }
    if (!reqSiteId.trim()) {
      setReqFormError(isDeployMode ? "Deployment Site is required." : "Target Site is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const selectedSiteObj = sites.find(s => s.name === reqSiteId || s.id === reqSiteId);
      const siteIdToSend = selectedSiteObj ? selectedSiteObj.id : reqSiteId;

      const requestsToSend = selectedItems.map(item => ({
        itemId: item.id,
        quantity: quantities[item.id] || 1
      }));

      const deploymentReason = isDeployMode
        ? `[ASSET DEPLOYMENT] Deploy to: ${employeeName.trim()} | Account: ${employeeAccount.trim()} | EID: ${employeeEid.trim()}${deploymentNotes.trim() ? ` | Notes: ${deploymentNotes.trim()}` : ''}`
        : `Bulk asset request for selected items${deploymentNotes.trim() ? `: ${deploymentNotes.trim()}` : ''}`;

      const success = await onSubmit(requestsToSend, siteIdToSend, deploymentReason, 'NORMAL');
      if (success) {
        setEmployeeName('');
        setEmployeeAccount('');
        setEmployeeEid('');
        setReqSiteId('');
        setDeploymentNotes('');
        onClose();
      }
    } catch (err) {
      setReqFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const nowStr = new Date().toLocaleString();

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(33, 12, 174);
      doc.text('CP-360 ASSET DEPLOYMENT FORM', 20, 20);

      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 25, 190, 25);

      // Metadata
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text('DEPLOYMENT DETAILS', 20, 33);

      doc.setFont('helvetica', 'normal');
      doc.text(`Date & Time: ${nowStr}`, 20, 40);
      doc.text(`Employee Name: ${employeeName.trim() || 'N/A'}`, 20, 46);
      doc.text(`Employee Account: ${employeeAccount.trim() || 'N/A'}`, 20, 52);
      doc.text(`Employee ID (EID): ${employeeEid.trim() || 'N/A'}`, 20, 58);
      doc.text(`Deployment Site: ${reqSiteId.trim() || 'N/A'}`, 20, 64);
      if (deploymentNotes.trim()) {
        doc.text(`Notes: ${deploymentNotes.trim()}`, 20, 70);
      }

      // Assets Table Header
      let y = deploymentNotes.trim() ? 80 : 74;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(33, 12, 174);
      doc.text('DEPLOYED ASSETS LIST', 20, y);

      y += 6;
      doc.setFillColor(240, 244, 254);
      doc.rect(20, y, 170, 8, 'F');
      doc.setFontSize(9);
      doc.setTextColor(30, 27, 75);
      doc.text('Asset Name', 22, y + 5.5);
      doc.text('SKU', 85, y + 5.5);
      doc.text('Asset Tag(s)', 125, y + 5.5);
      doc.text('Qty', 175, y + 5.5);

      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      selectedItems.forEach((it) => {
        const qty = quantities[it.id] || 1;
        const availableTags = it.assetTags || [];
        const tagsList: string[] = [];
        for (let i = 0; i < qty; i++) {
          if (availableTags[i]) {
            tagsList.push(availableTags[i]);
          } else {
            const prefix = (it.sku || 'AST').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
            tagsList.push(`${prefix}-${String(1001 + i).padStart(4, '0')}`);
          }
        }
        const tagsStr = tagsList.join(', ');

        doc.text(it.name.substring(0, 32), 22, y + 5.5);
        doc.text(it.sku.substring(0, 20), 85, y + 5.5);
        doc.text(tagsStr.substring(0, 28), 125, y + 5.5);
        doc.text(String(qty), 175, y + 5.5);
        doc.line(20, y + 8, 190, y + 8);
        y += 8;
      });

      // Signatures Area
      y += 20;
      if (y > 250) {
        doc.addPage();
        y = 30;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('ACKNOWLEDGEMENT & SIGNATURES', 20, y);

      y += 15;
      doc.line(20, y, 85, y);
      doc.line(110, y, 175, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text("Received By (Employee Signature)", 20, y + 5);
      doc.text("Issued By (Inventory Staff)", 110, y + 5);

      const fileName = `Asset_Deployment_${employeeEid.trim() || 'Record'}_${Date.now()}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15,23,42,0.4)',
        backdropFilter: 'blur(2px)',
        zIndex: 1500,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '100%',
          backgroundColor: '#ffffff',
          boxShadow: '-10px 0 25px -5px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{isDeployMode ? "Asset Deployment" : "Asset Request"}</h2>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                {isDeployMode ? `Deploy ${selectedItems.length} selected asset${selectedItems.length === 1 ? '' : 's'} to employee` : `Submit request for ${selectedItems.length} selected item${selectedItems.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.5rem', padding: '4px' }}
            >
              ×
            </button>
          </div>

          {/* Mode Switcher Tab — shown when selecting 1 asset for privileged users */}
          {canDeploy && selectedItems.length === 1 && (
            <div style={{
              display: 'flex',
              backgroundColor: '#f1f5f9',
              borderRadius: 10,
              padding: '0.2rem',
              gap: '0.2rem',
              border: '1px solid #e2e8f0'
            }}>
              {[
                { id: 'deploy' as const, label: '🚀 Asset Deployment' },
                { id: 'request' as const, label: '📋 Asset Request' }
              ].map((tab) => {
                const isActive = mode === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setMode(tab.id)}
                    style={{
                      flex: 1,
                      padding: '0.45rem 0.75rem',
                      borderRadius: 8,
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: isActive ? (tab.id === 'deploy' ? '#210cae' : '#7c3aed') : 'transparent',
                      color: isActive ? '#ffffff' : '#64748b',
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Form Body */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {reqFormError && (
              <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 8, fontSize: '0.82rem', fontWeight: 500 }}>
                ⚠ {reqFormError}
              </div>
            )}

            {/* Selected Assets List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Selected Items & Quantities</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.75rem', backgroundColor: '#f8fafc' }}>
                {selectedItems.map(item => {
                  const qty = quantities[item.id] || 1;
                  const isExceeded = qty > item.stock;

                  // Build dynamic tags list matching requested quantity
                  const availableTags = item.assetTags || [];
                  const displayTags: string[] = [];
                  for (let i = 0; i < qty; i++) {
                    if (availableTags[i]) {
                      displayTags.push(availableTags[i]);
                    } else {
                      // Generate clean tag based on SKU or item name prefix
                      const prefix = (item.sku || 'AST').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
                      const num = String(1001 + i).padStart(4, '0');
                      displayTags.push(`${prefix}-${num}`);
                    }
                  }

                  return (
                    <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                          <span style={{ color: '#64748b', flexShrink: 0 }}>
                            {getCategoryIcon(item.category, item.name)}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.name}</span>
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Stock: {item.stock} | SKU: {item.sku}</span>
                            {isExceeded && (
                              <span style={{ fontSize: '0.65rem', color: '#E85D00', fontWeight: 600 }}>
                                ⚠ Exceeds stock (deployment will be flagged)
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>Qty:</label>
                          <input
                            type="number"
                            min="1"
                            value={qty}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                            style={{ padding: '0.35rem 0.5rem', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.8rem', outline: 'none', color: '#0f172a', width: '65px', textAlign: 'center' }}
                          />
                        </div>
                      </div>

                      {/* Dynamic Asset Tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', paddingLeft: '1.75rem' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, alignSelf: 'center', marginRight: '0.2rem' }}>
                          Asset Tag{qty > 1 ? 's' : ''}:
                        </span>
                        {displayTags.map((tag, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.68rem',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              color: '#210cae',
                              backgroundColor: '#eef2ff',
                              border: '1px solid #c7d2fe',
                              borderRadius: '4px',
                              padding: '0.1rem 0.4rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}
                          >
                            🏷️ {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Conditional Fields: Employee details ONLY in Deploy mode */}
            {isDeployMode ? (
              <>
                {/* Employee's Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Employee&apos;s Name *</label>
                  <input
                    type="text"
                    placeholder="Enter full name of employee..."
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    style={{ padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', color: '#0f172a', width: '100%', backgroundColor: '#ffffff' }}
                  />
                </div>

                {/* Employee's Account */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Employee&apos;s Account *</label>
                  <input
                    type="text"
                    placeholder="e.g. Finance / Customer Support / IT..."
                    value={employeeAccount}
                    onChange={(e) => setEmployeeAccount(e.target.value)}
                    style={{ padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', color: '#0f172a', width: '100%', backgroundColor: '#ffffff' }}
                  />
                </div>

                {/* Employee ID (EID) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Employee ID (EID) *</label>
                  <input
                    type="text"
                    placeholder="e.g. EMP-10492"
                    value={employeeEid}
                    onChange={(e) => setEmployeeEid(e.target.value)}
                    style={{ padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', color: '#0f172a', width: '100%', backgroundColor: '#ffffff' }}
                  />
                </div>
              </>
            ) : null}

            {/* Deployment / Target Site */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label htmlFor="site-input" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>{isDeployMode ? "Deployment Site *" : "Target Site *"}</label>
              <input
                id="site-input"
                list="sites-list"
                type="text"
                placeholder="Select or enter site name..."
                value={reqSiteId}
                onChange={(e) => setReqSiteId(e.target.value)}
                style={{ padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', color: '#0f172a', width: '100%', backgroundColor: '#ffffff' }}
              />
              <datalist id="sites-list">
                {sites.map(site => (
                  <option key={site.id} value={site.name} />
                ))}
              </datalist>
            </div>

            {/* Notes / Reason */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>{isDeployMode ? "Deployment Notes (Optional)" : "Reason / Purpose (Optional)"}</label>
              <textarea
                rows={3}
                placeholder={isDeployMode ? "Additional notes for this asset deployment..." : "Specify reason for requesting these assets..."}
                value={deploymentNotes}
                onChange={(e) => setDeploymentNotes(e.target.value)}
                style={{ padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', color: '#0f172a', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ position: 'sticky', bottom: 0, padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.65rem', backgroundColor: '#f8fafc', zIndex: 10 }}>
          <button
            type="button"
            onClick={handleExportPDF}
            style={{
              padding: '0.5rem 0.9rem',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              backgroundColor: '#ffffff',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M12 18v-6" />
              <path d="M9 15l3 3 3-3" />
            </svg>
            Export PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '0.5rem 0.9rem', border: '1px solid #cbd5e1', color: '#475569', backgroundColor: '#ffffff', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedItems.length === 0 || !reqSiteId.trim() || (isDeployMode && (!employeeName.trim() || !employeeAccount.trim() || !employeeEid.trim()))}
            style={{
              backgroundColor: isDeployMode ? '#210cae' : '#7c3aed',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '0.5rem 1.25rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: (isSubmitting || selectedItems.length === 0 || !reqSiteId.trim() || (isDeployMode && (!employeeName.trim() || !employeeAccount.trim() || !employeeEid.trim()))) ? 'not-allowed' : 'pointer',
              opacity: (isSubmitting || selectedItems.length === 0 || !reqSiteId.trim() || (isDeployMode && (!employeeName.trim() || !employeeAccount.trim() || !employeeEid.trim()))) ? 0.5 : 1,
              transition: 'all 0.15s ease'
            }}
          >
            {isSubmitting ? (isDeployMode ? 'Deploying...' : 'Submitting...') : (isDeployMode ? 'Deploy Asset' : 'Submit Request')}
          </button>
        </div>
      </div>
    </div>
  );
}
