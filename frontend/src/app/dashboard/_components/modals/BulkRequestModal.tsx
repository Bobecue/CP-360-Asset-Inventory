'use client';

import { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import { requestFilePreview } from '@/utils/filePreview';
import { drawPdfHeader } from '@/utils/pdfHeader';

type UrgencyLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

interface SelectedItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  category?: string;
  categoryType?: 'CONSUMABLE' | 'NON_CONSUMABLE';
  assetTags?: string[];
  allExistingTags?: string[];
  stockLevels?: { siteId: string; quantity: number }[] | null;
}

interface Site {
  id: string;
  name: string;
  prefix: string;
  address?: string;
  floor?: string;
}

interface BulkRequestModalProps {
  open: boolean;
  onClose: () => void;
  selectedItems: SelectedItem[];
  sites: Site[];
  users?: any[];
  currentUser?: any;
  initialMode?: 'deploy' | 'request';
  sourceSiteId?: string;
  onSubmit: (requests: { itemId: string; quantity: number }[], siteId: string, reason: string, urgency: UrgencyLevel, sourceSiteId?: string) => Promise<boolean>;
}

import { getCategoryIcon } from '@/types/dashboard';

const parseFloors = (floorStr?: string): string[] => {
  if (!floorStr) return [];
  return floorStr
    .split(',')
    .map(f => {
      let cleaned = f.toLowerCase().replace(/floors?/g, '').trim();
      if (!cleaned) return '';
      const cap = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      return cap.endsWith('Floor') ? cap : `${cap} Floor`;
    })
    .filter(Boolean);
};

export function BulkRequestModal({ open, onClose, selectedItems, sites, users = [], currentUser, initialMode, sourceSiteId, onSubmit }: BulkRequestModalProps) {
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
  const [deploymentType, setDeploymentType] = useState<'employee' | 'station'>('employee');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeAccount, setEmployeeAccount] = useState('');
  const [employeeEid, setEmployeeEid] = useState('');
  const [stationName, setStationName] = useState('');
  const [stationDept, setStationDept] = useState('');
  const [reqSiteId, setReqSiteId] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [deploymentNotes, setDeploymentNotes] = useState('');
  const [eidSuggestions, setEidSuggestions] = useState<any[]>([]);
  const [showEidSuggestions, setShowEidSuggestions] = useState(false);

  // Auto-fill employee details based on EID lookup
  const autofillUserByEid = (inputEid: string) => {
    if (!inputEid.trim() || !users || users.length === 0) return;
    const cleanEid = inputEid.trim().toLowerCase();
    const matchedUser = users.find((u: any) => u.employeeId && u.employeeId.trim().toLowerCase() === cleanEid);

    if (matchedUser) {
      if (matchedUser.name) setEmployeeName(matchedUser.name);
      if (matchedUser.accountType || matchedUser.department) {
        setEmployeeAccount(matchedUser.accountType || matchedUser.department || '');
      }
      if (matchedUser.site?.name) {
        setReqSiteId(matchedUser.site.name);
      } else if (matchedUser.siteId) {
        const matchingSite = sites.find((s: any) => s.id === matchedUser.siteId || s.name === matchedUser.siteId);
        if (matchingSite) setReqSiteId(matchingSite.name);
      }
    }
  };

  const handleEidChange = (val: string) => {
    setEmployeeEid(val);
    if (!val.trim()) {
      setEidSuggestions([]);
      setShowEidSuggestions(false);
      return;
    }
    autofillUserByEid(val);

    if (users && users.length > 0) {
      const q = val.trim().toLowerCase();
      const matches = users.filter((u: any) =>
        u.employeeId && u.employeeId.toLowerCase().includes(q)
      );
      setEidSuggestions(matches.slice(0, 5));
      setShowEidSuggestions(matches.length > 0);
    }
  };

  // E-Signature States
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reqFormError, setReqFormError] = useState<string | null>(null);
  const [liveTagsMap, setLiveTagsMap] = useState<Record<string, { availableTags: string[]; allExistingTags: string[] }>>({});

  const selectedSiteObj = sites.find(s => s.name === reqSiteId || s.id === reqSiteId);
  const availableFloors = parseFloors(selectedSiteObj?.floor);

  const hasZeroStockItemForDeploy = isDeployMode && selectedItems.some(item => item.stock <= 0);

  const isDeployDisabled = isDeployMode && (
    (deploymentType === 'employee' 
      ? (!employeeName.trim() || !employeeAccount.trim() || !employeeEid.trim())
      : (!stationName.trim() || !stationDept.trim())) || !hasSignature || hasZeroStockItemForDeploy
  );
  const isSubmitDisabled = isSubmitting || selectedItems.length === 0 || !reqSiteId.trim() || isDeployDisabled;

  useEffect(() => {
    if (!open || selectedItems.length === 0) return;
    const fetchLiveAssets = async () => {
      try {
        const res = await fetch('http://localhost:3001/items', {
          headers: {
            "x-user-id": currentUser?.id || "",
          },
        });
        if (res.ok) {
          const itemsData = await res.json();
          const newMap: Record<string, { availableTags: string[]; allExistingTags: string[] }> = {};
          
          itemsData.forEach((it: any) => {
            const getNum = (t: string) => {
              const m = (t || '').match(/(\d+)(?=[^\d]*$)/);
              return m && m[1] ? parseInt(m[1], 10) : 0;
            };

            const availableAssets = (it.assets || [])
              .filter((a: any) => a.status === 'AVAILABLE' && a.condition !== 'BAD' && a.condition !== 'DAMAGED')
              .sort((a: any, b: any) => {
                const tagA = a.tagCode || a.assetTag || a.serialNumber || '';
                const tagB = b.tagCode || b.assetTag || b.serialNumber || '';
                const numA = getNum(tagA);
                const numB = getNum(tagB);
                if (numA !== numB) return numA - numB;
                return tagA.localeCompare(tagB);
              });

            const tags = availableAssets.map((a: any) => a.tagCode || a.assetTag || a.serialNumber).filter(Boolean);
            const allTags = (it.assets || [])
              .map((a: any) => a.tagCode || a.assetTag || a.serialNumber)
              .filter(Boolean);

            newMap[it.id] = {
              availableTags: tags,
              allExistingTags: allTags
            };
          });

          setLiveTagsMap(newMap);
        }
      } catch (err) {
        console.warn('Failed to fetch live asset tags in modal:', err);
      }
    };

    fetchLiveAssets();
  }, [open, selectedItems]);

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
      const zeroStockItem = selectedItems.find(item => item.stock <= 0);
      if (zeroStockItem) {
        setReqFormError(`Cannot deploy "${zeroStockItem.name}" because it has 0 stock.`);
        return;
      }
      
      const exceededStockItem = selectedItems.find(item => (quantities[item.id] || 1) > item.stock);
      if (exceededStockItem) {
        setReqFormError(`Cannot deploy "${exceededStockItem.name}". Requested quantity exceeds available stock (${exceededStockItem.stock}).`);
        return;
      }

      if (deploymentType === 'employee') {
        if (!employeeEid.trim()) {
          setReqFormError("Employee EID is required.");
          return;
        }
        if (!employeeAccount.trim()) {
          setReqFormError("Employee's Account is required.");
          return;
        }
        if (!employeeName.trim()) {
          setReqFormError("Employee's Name is required.");
          return;
        }
        if (!reqSiteId.trim()) {
          setReqFormError("Employee's Site is required.");
          return;
        }
      } else {
        if (!stationName.trim()) {
          setReqFormError("Station Name / Number is required.");
          return;
        }
        if (!stationDept.trim()) {
          setReqFormError("Station Department / Area is required.");
          return;
        }
        if (!reqSiteId.trim()) {
          setReqFormError("Station Site is required.");
          return;
        }
      }

      const selectedSiteObj = sites.find(s => s.name === reqSiteId || s.id === reqSiteId);
      const availableFloors = parseFloors(selectedSiteObj?.floor);
      if (availableFloors.length > 0 && !selectedFloor) {
        setReqFormError("Floor selection is required.");
        return;
      }
      if (!hasSignature) {
        setReqFormError("E-signature is required for asset deployment.");
        return;
      }
    }
    if (!reqSiteId.trim() && !isDeployMode) {
      setReqFormError("Target Site is required.");
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

      const floorSuffix = selectedFloor ? ` | Floor: ${selectedFloor}` : '';
      const deploymentReason = isDeployMode
        ? (deploymentType === 'employee'
            ? `[ASSET DEPLOYMENT] Deploy to Employee: ${employeeName.trim()} | Account: ${employeeAccount.trim()} | EID: ${employeeEid.trim()} | Site: ${reqSiteId}${floorSuffix}${deploymentNotes.trim() ? ` | Notes: ${deploymentNotes.trim()}` : ''}`
            : `[ASSET DEPLOYMENT] Deploy to Station: ${stationName.trim()} | Dept/Area: ${stationDept.trim()} | Site: ${reqSiteId}${floorSuffix}${deploymentNotes.trim() ? ` | Notes: ${deploymentNotes.trim()}` : ''}`)
        : (deploymentNotes.trim() || 'Request for selected items');

      const success = await onSubmit(requestsToSend, siteIdToSend, deploymentReason, 'NORMAL', sourceSiteId);
      if (success) {
        setEmployeeName('');
        setEmployeeAccount('');
        setEmployeeEid('');
        setStationName('');
        setStationDept('');
        setReqSiteId('');
        setSelectedFloor('');
        setDeploymentNotes('');
        clearSignature();
        onClose();
      }
    } catch (err) {
      setReqFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const nowStr = new Date().toLocaleString();

      await drawPdfHeader(doc, 'CP-360 ASSET DEPLOYMENT FORM');

      // Metadata
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);
      doc.text('DEPLOYMENT DETAILS', 20, 33);

      doc.setFont('helvetica', 'normal');
      doc.text(`Date & Time: ${nowStr}`, 20, 40);
      if (deploymentType === 'employee') {
        doc.text(`Employee Name: ${employeeName.trim() || 'N/A'}`, 20, 46);
        doc.text(`Employee Account: ${employeeAccount.trim() || 'N/A'}`, 20, 52);
        doc.text(`Employee ID (EID): ${employeeEid.trim() || 'N/A'}`, 20, 58);
      } else {
        doc.text(`Station Name/Number: ${stationName.trim() || 'N/A'}`, 20, 46);
        doc.text(`Department / Area: ${stationDept.trim() || 'N/A'}`, 20, 52);
      }
      const siteY = deploymentType === 'employee' ? 64 : 58;
      doc.text(`Deployment Site: ${reqSiteId.trim() || 'N/A'}`, 20, siteY);
      let notesY = siteY + 6;
      if (selectedFloor) {
        doc.text(`Floor: ${selectedFloor}`, 20, notesY);
        notesY += 6;
      }
      if (deploymentNotes.trim()) {
        doc.text(`Notes: ${deploymentNotes.trim()}`, 20, notesY);
      }

      // Assets Table Header
      let y = deploymentNotes.trim() ? (notesY + 10) : (notesY + 4);
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

        doc.text((it.name || 'N/A').substring(0, 32), 22, y + 5.5);
        doc.text((it.sku || 'N/A').substring(0, 20), 85, y + 5.5);
        doc.text((tagsStr || '').substring(0, 28), 125, y + 5.5);
        doc.text(String(qty), 175, y + 5.5);
        doc.line(20, y + 8, 190, y + 8);
        y += 8;
      });

      // Signatures Area
      y += 15;
      if (y > 230) {
        doc.addPage();
        y = 30;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('ACKNOWLEDGEMENT & SIGNATURES', 20, y);

      // Embed signature image if drawn
      if (canvasRef.current && hasSignature) {
        try {
          const sigDataUrl = canvasRef.current.toDataURL('image/png');
          doc.addImage(sigDataUrl, 'PNG', 20, y + 3, 55, 18);
        } catch (e) {
          console.warn('Failed to embed signature in PDF:', e);
        }
      }

      y += 24;
      doc.line(20, y, 85, y);
      doc.line(110, y, 175, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(deploymentType === 'employee' ? "Received By (Employee Signature)" : "Received By (Station Representative)", 20, y + 5);
      doc.text("Issued By (Inventory Staff)", 110, y + 5);

      const identifier = deploymentType === 'employee' ? (employeeEid.trim() || 'Record') : (stationName.trim() || 'Record');
      const fileName = `Asset_Deployment_${identifier}_${Date.now()}.pdf`;
      const pdfBlob = doc.output('blob');
      requestFilePreview(pdfBlob, fileName);
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
        backdropFilter: 'blur(4px)',
        zIndex: 1500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{isDeployMode ? "Asset Deployment" : "Asset Transfer"}</h2>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                {isDeployMode ? `Deploy ${selectedItems.length} selected asset${selectedItems.length === 1 ? '' : 's'} to ${deploymentType}` : `Submit request for ${selectedItems.length} selected item${selectedItems.length === 1 ? '' : 's'}`}
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
                {
                  id: 'deploy' as const,
                  label: 'Asset Deployment',
                  icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.71 1.1-1.68 1.1-2.7a3.4 3.4 0 0 0-1.4-2.9l-2.7 2.6z"/>
                      <path d="M12 15l-3-3 7.5-7.5a2.12 2.12 0 0 1 3 3L12 15z"/>
                      <path d="M9 18l3 3"/>
                      <path d="M14 9l3 3"/>
                    </svg>
                  )
                },
                {
                  id: 'request' as const,
                  label: 'Asset Transfer',
                  icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M8 3L4 7l4 4"/>
                      <path d="M4 7h16"/>
                      <path d="M16 21l4-4-4-4"/>
                      <path d="M20 17H4"/>
                    </svg>
                  )
                }
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
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
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
                  const activeSiteId = sourceSiteId;
                  const siteStockObj = activeSiteId && activeSiteId !== 'ALL'
                    ? item.stockLevels?.find(sl => sl.siteId === activeSiteId)
                    : null;
                  const relevantStock = activeSiteId && activeSiteId !== 'ALL'
                    ? (siteStockObj ? siteStockObj.quantity : 0)
                    : item.stock;

                  const effectiveStock = isDeployMode ? relevantStock : item.stock;
                  const isExceeded = qty > relevantStock;

                  const itemCat = (item.category || '').toLowerCase();
                  const itemNameLower = (item.name || '').toLowerCase();
                  const itemSkuLower = (item.sku || '').toLowerCase();
                  const isConsumableItem = item.categoryType === 'CONSUMABLE' ||
                    itemCat.includes('consumable') || itemCat.includes('keyboard') || itemCat.includes('mice') || itemCat.includes('mouse') ||
                    itemNameLower.includes('keyboard') || itemNameLower.includes('krs-83') || itemNameLower.includes('ser01') || itemNameLower.includes('op-720') || itemNameLower.includes('mouse') ||
                    itemSkuLower.includes('kbd') || itemSkuLower.includes('mou');

                  // Build dynamic tags list matching requested quantity using AVAILABLE & GOOD assets only
                  const getTagNum = (t: string) => {
                    const m = (t || '').match(/(\d+)(?=[^\d]*$)/);
                    return m && m[1] ? parseInt(m[1], 10) : 0;
                  };

                  const liveItem = liveTagsMap[item.id];
                  const rawAvailable = liveItem ? liveItem.availableTags : (item.assetTags || []);
                  const rawKnown = liveItem ? liveItem.allExistingTags : (item.allExistingTags && item.allExistingTags.length > 0 ? item.allExistingTags : rawAvailable);

                  const availableTags = [...rawAvailable].sort((a, b) => {
                    const numA = getTagNum(a);
                    const numB = getTagNum(b);
                    if (numA !== numB) return numA - numB;
                    return a.localeCompare(b);
                  });

                  const knownTags = [...rawKnown].sort((a, b) => {
                    const numA = getTagNum(a);
                    const numB = getTagNum(b);
                    if (numA !== numB) return numA - numB;
                    return a.localeCompare(b);
                  });

                  const displayTags: string[] = [];
                  const usedNumbers = new Set(knownTags.map(t => getTagNum(t)).filter(n => n > 0));
                  let nextTagNum = 1;

                  for (let i = 0; i < qty; i++) {
                    if (availableTags[i]) {
                      displayTags.push(availableTags[i]);
                    } else {
                      while (usedNumbers.has(nextTagNum)) {
                        nextTagNum++;
                      }
                      usedNumbers.add(nextTagNum);
                      const prefix = (item.sku || 'AST').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
                      const num = String(nextTagNum).padStart(4, '0');
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
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                              Stock: {isDeployMode ? relevantStock : item.stock} | SKU: {item.sku}
                              {!isDeployMode && relevantStock <= 0 && (
                                <span style={{ marginLeft: '0.5rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', fontWeight: 700, fontSize: '0.65rem' }}>
                                  Pending for Procurement
                                </span>
                              )}
                            </span>
                            {isDeployMode && relevantStock <= 0 ? (
                              <span style={{ fontSize: '0.65rem', color: '#dc2626', fontWeight: 600 }}>
                                ❌ Out of stock (cannot deploy)
                              </span>
                            ) : isExceeded ? (
                              <span style={{ fontSize: '0.65rem', color: '#E85D00', fontWeight: 600 }}>
                                ⚠ Exceeds stock (request/deployment will be flagged)
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>Qty:</label>
                          <input
                            type="number"
                            min="1"
                            disabled={isDeployMode && effectiveStock <= 0}
                            value={isDeployMode && effectiveStock <= 0 ? 0 : qty}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                            style={{ padding: '0.35rem 0.5rem', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.8rem', outline: 'none', color: '#0f172a', width: '65px', textAlign: 'center', backgroundColor: isDeployMode && effectiveStock <= 0 ? '#f1f5f9' : '#ffffff' }}
                          />
                        </div>
                      </div>

                      {/* Dynamic Asset Tags or Consumable Label */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', paddingLeft: '1.75rem' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, alignSelf: 'center', marginRight: '0.2rem' }}>
                          Asset Tag{qty > 1 ? 's' : ''}:
                        </span>
                        {isConsumableItem ? (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              color: '#16a34a',
                              backgroundColor: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: '4px',
                              padding: '0.1rem 0.4rem',
                              fontStyle: 'italic',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                          >
                            N/A (Bulk Consumable)
                          </span>
                        ) : (
                          displayTags.map((tag, idx) => (
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
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Conditional Fields: Employee or Station details ONLY in Deploy mode */}
            {isDeployMode ? (
              <>
                {/* Deployment Type Choice */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Deployment Type *</label>
                  <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: 10, padding: '0.2rem', gap: '0.2rem', border: '1px solid #e2e8f0', width: 'fit-content' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setDeploymentType('employee');
                        setReqSiteId('');
                        setSelectedFloor('');
                      }}
                      style={{
                        padding: '0.4rem 1rem',
                        borderRadius: 8,
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: deploymentType === 'employee' ? '#210cae' : 'transparent',
                        color: deploymentType === 'employee' ? '#ffffff' : '#64748b',
                        boxShadow: deploymentType === 'employee' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Employee
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeploymentType('station');
                        setReqSiteId('');
                        setSelectedFloor('');
                      }}
                      style={{
                        padding: '0.4rem 1rem',
                        borderRadius: 8,
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: deploymentType === 'station' ? '#210cae' : 'transparent',
                        color: deploymentType === 'station' ? '#ffffff' : '#64748b',
                        boxShadow: deploymentType === 'station' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Station
                    </button>
                  </div>
                </div>

                {deploymentType === 'employee' ? (
                  <>
                    {/* Employee's Site */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Employee&apos;s Site *</label>
                      <select
                        value={reqSiteId}
                        onChange={(e) => {
                          setReqSiteId(e.target.value);
                          setSelectedFloor('');
                        }}
                        style={{ padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', color: '#0f172a', width: '100%', backgroundColor: '#ffffff' }}
                      >
                        <option value="">Select a site...</option>
                        {sites.map(site => (
                          <option key={site.id} value={site.name}>{site.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Available Floors (conditional dropdown) */}
                    {reqSiteId && availableFloors.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Floor *</label>
                        <select
                          value={selectedFloor}
                          onChange={(e) => setSelectedFloor(e.target.value)}
                          style={{ padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', color: '#0f172a', width: '100%', backgroundColor: '#ffffff' }}
                        >
                          <option value="">Select floor...</option>
                          {availableFloors.map(floor => (
                            <option key={floor} value={floor}>{floor}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Employee ID (EID) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', position: 'relative' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Employee ID (EID) *</label>
                      <input
                        type="text"
                        placeholder="e.g. EMP-10492"
                        value={employeeEid}
                        onChange={(e) => handleEidChange(e.target.value)}
                        onFocus={() => {
                          if (employeeEid.trim() && eidSuggestions.length > 0) setShowEidSuggestions(true);
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowEidSuggestions(false), 200);
                        }}
                        style={{ padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', color: '#0f172a', width: '100%', backgroundColor: '#ffffff' }}
                      />

                      {/* EID Autocomplete Dropdown */}
                      {showEidSuggestions && eidSuggestions.length > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            zIndex: 50,
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            marginTop: '4px',
                            maxHeight: '180px',
                            overflowY: 'auto'
                          }}
                        >
                          {eidSuggestions.map((userItem: any) => (
                            <div
                              key={userItem.id}
                              onMouseDown={() => {
                                setEmployeeEid(userItem.employeeId || '');
                                autofillUserByEid(userItem.employeeId || '');
                                setShowEidSuggestions(false);
                              }}
                              style={{
                                padding: '0.5rem 0.75rem',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f1f5f9',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                            >
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>
                                  {userItem.employeeId}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  {userItem.name} {userItem.accountType || userItem.department ? `• ${userItem.accountType || userItem.department}` : ''}
                                </div>
                              </div>
                              <span style={{ fontSize: '0.7rem', color: '#210cae', fontWeight: 600, backgroundColor: '#eef2ff', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                Match
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
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
                  </>
                ) : (
                  <>
                    {/* Station's Site */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Station&apos;s Site *</label>
                      <select
                        value={reqSiteId}
                        onChange={(e) => {
                          setReqSiteId(e.target.value);
                          setSelectedFloor('');
                        }}
                        style={{ padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', color: '#0f172a', width: '100%', backgroundColor: '#ffffff' }}
                      >
                        <option value="">Select a site...</option>
                        {sites.map(site => (
                          <option key={site.id} value={site.name}>{site.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Available Floors (conditional dropdown) */}
                    {reqSiteId && availableFloors.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Floor *</label>
                        <select
                          value={selectedFloor}
                          onChange={(e) => setSelectedFloor(e.target.value)}
                          style={{ padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', color: '#0f172a', width: '100%', backgroundColor: '#ffffff' }}
                        >
                          <option value="">Select floor...</option>
                          {availableFloors.map(floor => (
                            <option key={floor} value={floor}>{floor}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Station's Account */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Station&apos;s Account *</label>
                      <input
                        type="text"
                        placeholder="e.g. Operations / HR / Recruitment..."
                        value={stationDept}
                        onChange={(e) => setStationDept(e.target.value)}
                        style={{ padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', color: '#0f172a', width: '100%', backgroundColor: '#ffffff' }}
                      />
                    </div>

                    {/* Station Name / Number */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Station Name / Number *</label>
                      <input
                        type="text"
                        placeholder="e.g. STN-01 or HR Station 1..."
                        value={stationName}
                        onChange={(e) => setStationName(e.target.value)}
                        style={{ padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', color: '#0f172a', width: '100%', backgroundColor: '#ffffff' }}
                      />
                    </div>
                  </>
                )}
              </>
            ) : (
              /* Deployment / Target Site in non-deploy mode */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label htmlFor="site-input" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Target Site *</label>
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
            )}

            {/* Notes / Reason */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>{isDeployMode ? "Deployment Notes (Optional)" : "Reason / Purpose (Optional)"}</label>
              <textarea
                rows={2}
                placeholder={isDeployMode ? "Additional notes for this asset deployment..." : "Specify reason for requesting these assets..."}
                value={deploymentNotes}
                onChange={(e) => setDeploymentNotes(e.target.value)}
                style={{ padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', color: '#0f172a', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>

            {/* E-Signature Canvas */}
            {isDeployMode && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                    E-Signature (Recipient / Employee) *
                  </label>
                  {hasSignature && (
                    <button
                      type="button"
                      onClick={clearSignature}
                      style={{
                        fontSize: '0.72rem',
                        color: '#dc2626',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        textDecoration: 'underline'
                      }}
                    >
                      Clear Signature
                    </button>
                  )}
                </div>
                <div style={{
                  border: reqFormError && !hasSignature ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                  borderRadius: 8,
                  backgroundColor: '#ffffff',
                  overflow: 'hidden',
                  position: 'relative',
                  touchAction: 'none'
                }}>
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={110}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{
                      width: '100%',
                      height: '110px',
                      display: 'block',
                      cursor: 'crosshair',
                      backgroundColor: '#f8fafc'
                    }}
                  />
                  {!hasSignature && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      color: '#94a3b8',
                      fontSize: '0.8rem',
                      fontStyle: 'italic'
                    }}>
                      Sign here using mouse or touch...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ position: 'sticky', bottom: 0, padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.65rem', backgroundColor: '#f8fafc', zIndex: 10 }}>
          {isDeployMode && (
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
          )}
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
            disabled={isSubmitDisabled}
            style={{
              backgroundColor: isDeployMode ? '#210cae' : '#7c3aed',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '0.5rem 1.25rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
              opacity: isSubmitDisabled ? 0.5 : 1,
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
