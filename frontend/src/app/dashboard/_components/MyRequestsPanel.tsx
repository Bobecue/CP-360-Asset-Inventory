'use client';

import { useState, useEffect, useMemo } from 'react';
import { InteractiveModal } from '../../../components/ui/InteractiveModal';
import { cleanReason, cleanReviewComment } from './RequestsTab';

type RequestStatus = 'PENDING' | 'PENDING_OPS_APPROVAL' | 'APPROVED' | 'READY_FOR_PICKUP' | 'PENDING_PROCUREMENT' | 'REJECTED' | 'RETURNED' | 'CANCELLED' | 'RELEASED' | 'AWAITING_CONFIRMATION' | 'ITEM_RECEIVED';
type UrgencyLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

interface RequestEntry {
  id: string;
  itemId: string;
  itemName: string;
  itemCategory?: string;
  requestedById: string;
  requestedByName: string;
  requestedByRole?: string;
  quantity: number;
  reason: string;
  urgency: UrgencyLevel;
  status: RequestStatus;
  reviewComment?: string;
  siteId?: string;
  siteName?: string;
  returnedAt?: string;
  returnComment?: string;
  approvedByName?: string;
  requestedBySiteId?: string;
  approvedBySiteId?: string;
  assetId?: string;
  assetTag?: string;
  senderName?: string;
  senderSiteName?: string;
  senderSiteAddress?: string;
  receiverName?: string;
  receiverSiteName?: string;
  receiverSiteAddress?: string;
  staffApprovedById?: string;
  staffApprovedByName?: string;
  staffApprovedAt?: string;
  opsApprovedById?: string;
  opsApprovedByName?: string;
  opsApprovedAt?: string;
  createdAt: string;
  updatedAt?: string;
  history?: { status: string; timestamp: string; comment?: string; byName?: string }[];
}

interface MyRequestsPanelProps {
  onCancel: (id: string) => Promise<void>;
  renderStatusBadge: (status: RequestStatus) => React.ReactNode;
  formatRelativeTime: (dateStr: string) => string;
  // A trigger prop to force refetch when a new request is submitted
  refreshTrigger?: number;
  // Locally-cached requests used as an offline fallback
  allRequests?: RequestEntry[];
  // The current user's ID — used to filter allRequests in offline mode
  currentUserId?: string;
  // The current user's Name — used to filter requests in case of ID mismatch
  currentUserName?: string;
  collapsible?: boolean;
  onRowClick?: (req: RequestEntry) => void;
  onBulkCancel?: (selectedIds: string[]) => Promise<void>;
}

import { getCategoryIcon } from '@/types/dashboard';

export function MyRequestsPanel({
  onCancel,
  renderStatusBadge,
  formatRelativeTime,
  refreshTrigger: _refreshTrigger,
  allRequests = [],
  currentUserId = 'user-1',
  currentUserName = 'Super Admin',
  collapsible = true,
  onRowClick,
  onBulkCancel
}: MyRequestsPanelProps) {
  const [open, setOpen] = useState(!collapsible);
  const [filter, setFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelRequestId, setCancelRequestId] = useState<string | null>(null);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [selectedReqIds, setSelectedReqIds] = useState<string[]>([]);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [isBulkCancelConfirmOpen, setIsBulkCancelConfirmOpen] = useState(false);

  // Initialize open state from localStorage only if collapsible
  useEffect(() => {
    if (collapsible && typeof window !== 'undefined') {
      const stored = localStorage.getItem('salivio_myrequests_open');
      if (stored !== null) {
        setOpen(stored === 'true');
      }
    }
  }, [collapsible]);

  const handleToggle = () => {
    if (!collapsible) return;
    const nextState = !open;
    setOpen(nextState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('salivio_myrequests_open', String(nextState));
    }
  };

  // Derive myRequests directly from the parent-managed allRequests prop.
  // This avoids a race condition where the /requests/mine API returned stale or
  // empty data right after a new request was submitted locally.
  const myRequests = useMemo(() => {
    const mine = allRequests.filter(r =>
      r.requestedById === currentUserId ||
      (currentUserName && r.requestedByName === currentUserName)
    );
    let filtered = mine;
    if (filter === 'PENDING') {
      filtered = mine.filter(r => r.status === 'PENDING' || r.status === 'PENDING_OPS_APPROVAL');
    } else if (filter === 'PROCESSING') {
      filtered = mine.filter(r => r.status === 'APPROVED' || r.status === 'PENDING_PROCUREMENT');
    } else if (filter === 'READY') {
      filtered = mine.filter(r => r.status === 'READY_FOR_PICKUP');
    } else if (filter === 'RELEASED') {
      filtered = mine.filter(r => r.status === 'RELEASED' || r.status === 'AWAITING_CONFIRMATION');
    } else if (filter === 'COMPLETED') {
      filtered = mine.filter(r => r.status === 'ITEM_RECEIVED');
    } else if (filter === 'CLOSED') {
      filtered = mine.filter(r => r.status === 'REJECTED' || r.status === 'RETURNED' || r.status === 'CANCELLED');
    } else if (filter !== 'ALL') {
      filtered = mine.filter(r => r.status === filter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(r =>
        r.itemName.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        (r.status && r.status.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const pendingCount = mine.filter(r => r.status === 'PENDING').length;
    return { items: filtered, pendingCount };
  }, [allRequests, currentUserId, currentUserName, filter, searchQuery]);

  const groupedCounts = useMemo(() => {
    const mine = allRequests.filter(r =>
      r.requestedById === currentUserId ||
      (currentUserName && r.requestedByName === currentUserName)
    );
    return {
      ALL: mine.length,
      PENDING: mine.filter(r => r.status === 'PENDING' || r.status === 'PENDING_OPS_APPROVAL').length,
      PROCESSING: mine.filter(r => r.status === 'APPROVED' || r.status === 'PENDING_PROCUREMENT').length,
      READY: mine.filter(r => r.status === 'READY_FOR_PICKUP').length,
      RELEASED: mine.filter(r => r.status === 'RELEASED' || r.status === 'AWAITING_CONFIRMATION').length,
      COMPLETED: mine.filter(r => r.status === 'ITEM_RECEIVED').length,
      CLOSED: mine.filter(r => r.status === 'REJECTED' || r.status === 'RETURNED' || r.status === 'CANCELLED').length,
    };
  }, [allRequests, currentUserId, currentUserName]);

  const isLoading = false;

  const allSelectableRequestsInView = useMemo(() => {
    return myRequests?.items || [];
  }, [myRequests?.items]);

  const isAllSelected = allSelectableRequestsInView.length > 0 &&
    allSelectableRequestsInView.every(r => selectedReqIds.includes(r.id));

  const selectedRequests = useMemo(() => {
    return allSelectableRequestsInView.filter(r => selectedReqIds.includes(r.id));
  }, [allSelectableRequestsInView, selectedReqIds]);

  const handleConfirmBulkCancel = async () => {
    if (selectedReqIds.length === 0 || isSubmittingBulk) return;
    setIsSubmittingBulk(true);
    try {
      if (onBulkCancel) {
        await onBulkCancel(selectedReqIds);
      } else {
        for (const id of selectedReqIds) {
          await onCancel(id);
        }
      }
      setSelectedReqIds([]);
    } catch (err) {
      console.error('Error bulk cancelling requests:', err);
    } finally {
      setIsSubmittingBulk(false);
      setIsBulkCancelConfirmOpen(false);
    }
  };

  const handleBulkConfirmReceipt = async () => {
    if (selectedReqIds.length === 0 || isSubmittingBulk) return;
    setIsSubmittingBulk(true);
    try {
      const userIdentifier = currentUserName || currentUserId || 'superadmin@contactpoint360.com';
      try {
        await fetch('http://localhost:3001/requests/bulk-confirm-receipt', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user': userIdentifier
          },
          body: JSON.stringify({ ids: selectedReqIds, userEmail: userIdentifier })
        });
      } catch (err) {
        console.warn('Bulk confirm receipt backend endpoint fallback to loop:', err);
        for (const id of selectedReqIds) {
          await fetch(`http://localhost:3001/movements/${id}/confirm-receipt`, {
            method: 'PATCH',
            headers: { 
              'Content-Type': 'application/json',
              'x-user': userIdentifier
            },
            body: JSON.stringify({ userEmail: userIdentifier })
          });
        }
      }
      setSelectedReqIds([]);
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (err) {
      console.error('Error during bulk confirm receipt:', err);
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const handleCancelClick = async (id: string) => {
    setCancelRequestId(id);
  };

  const getDisplayName = (req: RequestEntry) => {
    if (req.status === 'RELEASED' || req.status === 'RETURNED') {
      if (!req.assetTag) return req.itemName;

      const prefix = req.assetTag.substring(0, 3);
      const parts = req.assetTag.split('-');
      if (parts.length < 2) return req.itemName;

      const i = parseInt(parts[1], 10);
      const name = (req.itemName || '').toLowerCase();

      let displayItemName = req.itemName;
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
    return req.itemName;
  };

  const requestOverview = (
    <div 
      onMouseEnter={() => setIsOverviewExpanded(true)}
      onMouseLeave={() => setIsOverviewExpanded(false)}
      style={{ 
        width: '100%', 
        backgroundColor: '#ffffff', 
        borderRadius: 12, 
        border: '1px solid #e2e8f0', 
        boxShadow: '0 2px 10px rgba(15,23,42,0.02)', 
        padding: isOverviewExpanded ? '1.25rem' : '0.85rem 1.25rem',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        maxHeight: isOverviewExpanded ? '500px' : '48px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: isOverviewExpanded ? 'default' : 'pointer',
        marginBottom: '1rem'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isOverviewExpanded ? '1rem' : '0', transition: 'margin-bottom 0.3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Request Overview</h3>
          {!isOverviewExpanded && <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>(Hover to expand)</span>}
        </div>
        {!isOverviewExpanded && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 1, transition: 'opacity 0.3s ease-in' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Active Filter:</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#E85D00', backgroundColor: 'rgba(232, 93, 0, 0.08)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
              {filter === 'ALL' ? 'All Requests' : filter.charAt(0) + filter.slice(1).toLowerCase()}
            </span>
          </div>
        )}
      </div>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'nowrap', 
        gap: '0.75rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
        opacity: isOverviewExpanded ? 1 : 0,
        transform: isOverviewExpanded ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'all 0.3s ease-in-out',
        pointerEvents: isOverviewExpanded ? 'auto' : 'none'
      }}>
      {[
        { id: 'ALL', label: 'All Requests', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)', icon: <svg style={{ transition: 'all 0.3s ease' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> },
        { id: 'PENDING', label: 'Pending', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: <svg style={{ transition: 'all 0.3s ease' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> },
        { id: 'PROCESSING', label: 'Processing', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: <svg style={{ transition: 'all 0.3s ease' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"></path><path d="M12 18v4"></path><path d="M4.93 4.93l2.83 2.83"></path><path d="M16.24 16.24l2.83 2.83"></path><path d="M2 12h4"></path><path d="M18 12h4"></path><path d="M4.93 19.07l2.83-2.83"></path><path d="M16.24 7.76l2.83-2.83"></path></svg> },
        { id: 'READY', label: 'Ready', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', icon: <svg style={{ transition: 'all 0.3s ease' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> },
        { id: 'RELEASED', label: 'Released', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)', icon: <svg style={{ transition: 'all 0.3s ease' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg> },
        { id: 'COMPLETED', label: 'Completed', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: <svg style={{ transition: 'all 0.3s ease' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> },
        { id: 'CLOSED', label: 'Closed', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', icon: <svg style={{ transition: 'all 0.3s ease' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> },
      ].map((s) => {
        const isActive = filter === s.id;
        const count = groupedCounts[s.id as keyof typeof groupedCounts] || 0;
        const itemColor = isActive ? s.color : '#64748b';
        const itemBg = isActive ? s.bg : '#fcfcfc';
        const hoverBg = isActive ? s.bg : '#f8fafc';
        const borderColor = isActive ? s.color : '#f1f5f9';

        return (
          <div 
            key={s.id}
            onClick={() => setFilter(s.id as any)}
            style={{ 
              flex: 1,
              minWidth: '110px',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.35rem',
              padding: '1rem', 
              borderRadius: 12, 
              cursor: 'pointer', 
              backgroundColor: itemBg, 
              border: `1px solid ${isActive ? borderColor : '#f1f5f9'}`,
              color: itemColor,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isActive ? `0 4px 12px ${s.bg}` : 'none',
            }}
            onMouseEnter={(e) => { 
              if (!isActive) { e.currentTarget.style.backgroundColor = hoverBg; e.currentTarget.style.borderColor = '#e2e8f0'; }
              e.currentTarget.style.transform = 'translateY(-2px)';
              const iconDiv = e.currentTarget.querySelector('.icon-container') as HTMLElement;
              const iconSvg = e.currentTarget.querySelector('svg') as SVGSVGElement | null;
              if (iconDiv && iconSvg) {
                iconDiv.style.backgroundColor = s.color;
                iconSvg.style.color = '#ffffff';
                iconSvg.style.transform = s.id === 'PROCESSING' ? 'rotate(180deg)' : 'scale(1.1)';
                iconSvg.style.filter = 'drop-shadow(0 0 4px rgba(255,255,255,0.8))';
              }
            }}
            onMouseLeave={(e) => { 
              if (!isActive) { e.currentTarget.style.backgroundColor = itemBg; e.currentTarget.style.borderColor = '#f1f5f9'; }
              e.currentTarget.style.transform = 'translateY(0)';
              const iconDiv = e.currentTarget.querySelector('.icon-container') as HTMLElement;
              const iconSvg = e.currentTarget.querySelector('svg') as SVGSVGElement | null;
              if (iconDiv && iconSvg) {
                iconDiv.style.backgroundColor = isActive ? s.color : s.bg;
                iconSvg.style.color = isActive ? '#ffffff' : s.color;
                iconSvg.style.transform = 'rotate(0deg) scale(1)';
                iconSvg.style.filter = 'none';
              }
            }}
          >
            <div 
              className="icon-container"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: isActive ? s.color : s.bg,
                color: isActive ? '#ffffff' : s.color,
                transition: 'all 0.3s ease',
                marginBottom: '4px'
              }}
            >
              {s.icon}
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em', color: isActive ? s.color : '#64748b', transition: 'color 0.3s ease' }}>{s.label}</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: isActive ? s.color : '#0f172a', transition: 'color 0.3s ease' }}>{count}</span>
          </div>
        );
      })}
      </div>
    </div>

  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {requestOverview}
      <div style={{ border: '1px solid #cbd5e1', borderRadius: 12, overflow: 'hidden', backgroundColor: '#ffffff', boxShadow: '0 2px 10px rgba(15,23,42,0.02)' }}>
      {/* Header Container */}
      <div
        onClick={collapsible ? handleToggle : undefined}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          backgroundColor: '#ffffff',
          border: 'none',
          cursor: collapsible ? 'pointer' : 'default',
          transition: 'background-color 0.15s ease'
        }}
        onMouseEnter={collapsible ? (e) => e.currentTarget.style.backgroundColor = '#f8fafc' : undefined}
        onMouseLeave={collapsible ? (e) => e.currentTarget.style.backgroundColor = '#ffffff' : undefined}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
          <svg style={{ color: '#94a3b8' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <div>
            <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>My Requests</p>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>Your submitted requests and their current status</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {myRequests?.pendingCount > 0 && (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                backgroundColor: '#FFF0E8',
                color: '#E85D00',
                border: '1px solid rgba(232,93,0,0.3)',
                padding: '0.15rem 0.5rem',
                borderRadius: 99
              }}
            >
              {myRequests.pendingCount} pending
            </span>
          )}
          {collapsible && (
            <svg
              style={{
                color: '#94a3b8',
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          )}
        </div>
      </div>

      {/* Expandable body */}
      {open && (
        <div style={{ borderTop: '1px solid #e2e8f0', padding: '1rem 1.25rem', backgroundColor: '#ffffff' }}>
          {/* Search bar & Select All bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search item, reason, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-glow"
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem 0.45rem 2.25rem',
                  fontSize: '0.8rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
                  color: '#0f172a',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#E85D00';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232, 93, 0, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <svg
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>

            {allSelectableRequestsInView.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.5rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#475569', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedReqIds(allSelectableRequestsInView.map(r => r.id));
                      } else {
                        setSelectedReqIds([]);
                      }
                    }}
                    style={{ cursor: 'pointer', accentColor: '#3b82f6', width: '15px', height: '15px' }}
                  />
                  Select All Orders ({allSelectableRequestsInView.length})
                </label>
                {selectedReqIds.length > 0 && (
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                    {selectedReqIds.length} of {allSelectableRequestsInView.length} selected
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Bulk Action Banner */}
          {selectedReqIds.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#eff6ff',
                color: '#1e293b',
                padding: '0.75rem 1rem',
                borderRadius: 10,
                border: '1px solid #bfdbfe',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.08)',
                marginBottom: '1rem',
                animation: 'slideFadeIn 0.3s ease-out'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#2563eb', color: '#ffffff', padding: '0.25rem 0.55rem', borderRadius: '6px' }}>
                  ⚡ {selectedReqIds.length} Request{selectedReqIds.length > 1 ? 's' : ''} Selected
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {selectedRequests.some(r => ['PENDING', 'PENDING_APPROVAL', 'PENDING_OPS_APPROVAL', 'APPROVED', 'READY_FOR_PICKUP'].includes(r.status as string)) && (
                  <button
                    onClick={() => setIsBulkCancelConfirmOpen(true)}
                    disabled={isSubmittingBulk}
                    style={{
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '0.4rem 0.95rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: isSubmittingBulk ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isSubmittingBulk ? 'Processing...' : `🚫 Cancel Orders`}
                  </button>
                )}

                {selectedRequests.some(r => r.status === 'AWAITING_CONFIRMATION' || r.status === 'RELEASED') && (
                  <button
                    onClick={handleBulkConfirmReceipt}
                    disabled={isSubmittingBulk}
                    style={{
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '0.4rem 0.95rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: isSubmittingBulk ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isSubmittingBulk ? 'Processing...' : `✅ Confirm Receipt`}
                  </button>
                )}

                <button
                  onClick={() => setSelectedReqIds([])}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Deselect
                </button>
              </div>
            </div>
          )}

          {/* Card list */}
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ height: '56px', borderRadius: 8, backgroundColor: '#f1f5f9', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : myRequests?.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>No requests found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {myRequests.items.map(req => {
                const isCancellable = ['PENDING', 'PENDING_APPROVAL', 'PENDING_OPS_APPROVAL', 'APPROVED', 'READY_FOR_PICKUP'].includes(req.status as string);
                const isSelected = selectedReqIds.includes(req.id);

                return (
                  <div
                    key={req.id}
                    onClick={() => onRowClick && onRowClick(req)}
                    style={{
                      backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                      padding: '1rem',
                      borderRadius: 12,
                      border: `1px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                      cursor: onRowClick ? 'pointer' : 'default',
                      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                    onMouseEnter={(e) => { 
                      if (onRowClick && !isSelected) { 
                        e.currentTarget.style.borderColor = '#94a3b8'; 
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 10px 24px rgba(15, 23, 42, 0.08)';
                      } 
                    }}
                    onMouseLeave={(e) => { 
                      if (onRowClick && !isSelected) { 
                        e.currentTarget.style.borderColor = '#e2e8f0'; 
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.01)';
                      } 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setSelectedReqIds(prev => [...prev, req.id]);
                            } else {
                              setSelectedReqIds(prev => prev.filter(id => id !== req.id));
                            }
                          }}
                          style={{ cursor: 'pointer', accentColor: '#3b82f6', width: '16px', height: '16px', marginTop: '0.2rem' }}
                        />
                        <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', marginTop: '0.15rem' }}>
                          {getCategoryIcon(req.itemCategory, req.itemName)}
                        </span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{getDisplayName(req)}</h4>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem', display: 'block' }}>
                            Qty: {req.quantity} • Submitted: {formatRelativeTime(req.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                        {renderStatusBadge(req.status)}
                        {req.status === 'RETURNED' && (
                          <>
                            {req.returnComment?.includes('Missing') && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.15rem',
                                padding: '0.1rem 0.35rem',
                                borderRadius: 4,
                                backgroundColor: '#fffbeb',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                              }}>
                                ⚠️ Incomplete Qty
                              </span>
                            )}
                            {(req.returnComment?.includes('Bad') || req.returnComment?.includes('Damaged')) && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.15rem',
                                padding: '0.1rem 0.35rem',
                                borderRadius: 4,
                                backgroundColor: '#fef2f2',
                                color: '#b91c1c',
                                border: '1px solid #fecaca',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                              }}>
                                🚨 Damaged
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cleanReason(req.reason)}
                    </p>

                    {req.reviewComment && (
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
                        <strong>Review comment:</strong> "{cleanReviewComment(req.reviewComment)}"
                      </div>
                    )}

                    {isCancellable && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCancelClick(req.id); }}
                          style={{
                            padding: '0.3rem 0.65rem',
                            borderRadius: 6,
                            border: '1px solid #fecaca',
                            backgroundColor: '#ffffff',
                            color: '#dc2626',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>

      <InteractiveModal
        isOpen={cancelRequestId !== null}
        type="confirm"
        title="Cancel Request"
        message="Are you sure you want to cancel this request? This action cannot be undone."
        confirmText="Cancel Request"
        theme="danger"
        onConfirm={async () => {
          if (cancelRequestId) {
            try {
              await onCancel(cancelRequestId);
            } catch (err) {
              console.error('Error cancelling request:', err);
            } finally {
              setCancelRequestId(null);
            }
          }
        }}
        onCancel={() => setCancelRequestId(null)}
      />

      <InteractiveModal
        isOpen={isBulkCancelConfirmOpen}
        type="confirm"
        title="Cancel Selected Orders"
        message={`Are you sure you want to cancel these ${selectedReqIds.length} selected request orders? This action cannot be undone.`}
        confirmText={`Cancel ${selectedReqIds.length} Order(s)`}
        theme="danger"
        onConfirm={handleConfirmBulkCancel}
        onCancel={() => setIsBulkCancelConfirmOpen(false)}
      />
    </div>
  );
}
