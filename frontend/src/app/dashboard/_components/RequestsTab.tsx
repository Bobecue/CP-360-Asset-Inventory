'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { User, CatalogItem, getCategoryIcon } from '@/types/dashboard';
import { RequestsTable } from './RequestsTable';
import { NewRequestModal } from './NewRequestModal';
import { MyRequestsPanel } from './MyRequestsPanel';
import { RequestTimeline } from './RequestTimeline';
import { cancelRequest } from '../../../lib/services/requestService';
import { InteractiveModal } from '../../../components/ui/InteractiveModal';

type RequestStatus = 'PENDING' | 'PENDING_OPS_APPROVAL' | 'APPROVED' | 'READY_FOR_PICKUP' | 'PENDING_PROCUREMENT' | 'REJECTED' | 'RETURNED' | 'CANCELLED' | 'RELEASED' | 'AWAITING_CONFIRMATION' | 'ITEM_RECEIVED';
type UrgencyLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export function cleanReason(reason?: string): string {
  if (!reason) return '';
  if (reason.startsWith('Bulk asset request for selected items: ')) {
    return reason.replace('Bulk asset request for selected items: ', '');
  }
  if (reason === 'Bulk asset request for selected items') {
    return 'Request for selected items';
  }
  return reason;
}

export function cleanReviewComment(comment?: string): string {
  if (!comment) return '';
  if (comment === 'Bulk staged for pickup') return 'Staged for pickup';
  if (comment === 'Bulk approved from Request Orders module') return 'Approved from Request Orders module';
  if (comment === 'Bulk approved') return 'Approved';
  if (comment === 'Bulk released') return 'Released';
  if (comment === 'Bulk cancelled') return 'Cancelled';
  if (comment.startsWith('Bulk ')) {
    const stripped = comment.slice(5);
    return stripped.charAt(0).toUpperCase() + stripped.slice(1);
  }
  return comment;
}

interface RequestEntry {
  id: string;
  itemId: string;
  itemName: string;
  itemCategory?: string;
  requestedById: string;
  requestedByName: string;
  requestedByRole?: string;
  requestedByDepartment?: string;
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
  assetSiteName?: string;
  assetSiteAddress?: string;
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

interface Site {
  id: string;
  name: string;
  prefix: string;
  address?: string;
}

interface RequestsTabProps {
  currentUser: User | null;
  isUsingMockData: boolean;
  sites: Site[];
  categories: { id: string; name: string; prefix: string; type: 'CONSUMABLE' | 'NON_CONSUMABLE' }[];
  catalogItems: CatalogItem[];
  users: User[];
  onRefreshNotifications?: () => void;
  onRefreshCatalog?: () => void;
}

const REQUESTS_CACHE_V = 'v8';

export function RequestsTab({
  currentUser,
  isUsingMockData,
  sites,
  categories,
  catalogItems,
  users,
  onRefreshNotifications,
  onRefreshCatalog
}: RequestsTabProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!currentUser) {
    return <div style={{ padding: '2rem', color: '#64748b' }}>Loading session data...</div>;
  }

  // --- Local states ---
  const [allRequests, setAllRequests] = useState<RequestEntry[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [ordersSubTab, setOrdersSubTab] = useState<'queue' | 'my-requests'>('queue');
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Detail Drawer states
  const [selectedRequest, setSelectedRequest] = useState<RequestEntry | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  const [showDrawerReturnForm, setShowDrawerReturnForm] = useState(false);
  const [returnAssetTag, setReturnAssetTag] = useState('');
  const [returnComment, setReturnComment] = useState('');
  const [returnQuantityStatus, setReturnQuantityStatus] = useState<'COMPLETE' | 'MISSING'>('COMPLETE');
  const [returnMissingCount, setReturnMissingCount] = useState<number>(0);
  const [returnCondition, setReturnCondition] = useState<'GOOD' | 'BAD'>('GOOD');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');
  const [isExportingMovementPdf, setIsExportingMovementPdf] = useState(false);

  // Global Interactive Modal
  const [globalModal, setGlobalModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    theme: 'approve' | 'prepare' | 'danger' | 'info' | undefined;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert',
    theme: 'info',
    onConfirm: () => {}
  });

  const showAlert = (message: string, title = 'Alert') => {
    setGlobalModal({
      isOpen: true,
      title,
      message,
      type: 'alert',
      theme: 'danger',
      onConfirm: () => setGlobalModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const showConfirm = (message: string, onConfirm: () => void, title = 'Confirm') => {
    setGlobalModal({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      theme: 'info',
      onConfirm: () => {
        onConfirm();
        setGlobalModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Helper functions
  const getDisplayName = (req: RequestEntry) => {
    if (req.status === 'RELEASED' || req.status === 'RETURNED') {
      return req.itemName;
    }
    if (req.itemCategory && req.itemCategory !== 'Consumables') {
      const cat = req.itemCategory;
      if (cat === 'Laptops') return 'Laptop';
      if (cat === 'Accessories') return 'Accessory';
      if (cat === 'Peripherals') return 'Accessory';
      return cat;
    }
    return req.itemName;
  };

  const renderStatusBadge = (status: RequestStatus, reason?: string) => {
    if (reason && reason.includes("[ASSET DEPLOYMENT]") && status !== 'RETURNED') {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.65rem',
          borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700,
          background: "linear-gradient(135deg, #ffffff 0%, #f1f5f9 60%, rgba(225, 29, 72, 0.12) 100%)",
          color: "#be123c", border: "1px solid rgba(225, 29, 72, 0.40)",
          boxShadow: "0 1px 3px rgba(225, 29, 72, 0.10)"
        }}>
          Deployed
        </span>
      );
    }
    const conf: Record<RequestStatus, { bg: string; color: string; border: string; label: string }> = {
      PENDING: { bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', color: '#c2410c', border: '#fdba74', label: 'Pending Staff Approval' },
      PENDING_OPS_APPROVAL: { bg: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', color: '#6b21a8', border: '#d8b4fe', label: 'Pending Ops Approval' },
      APPROVED: { bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', color: '#1d4ed8', border: '#93c5fd', label: 'Approved' },
      READY_FOR_PICKUP: { bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)', color: '#0e7490', border: '#67e8f9', label: 'Ready for Pickup' },
      PENDING_PROCUREMENT: { bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', color: '#6d28d9', border: '#c4b5fd', label: 'Pending Procurement' },
      RELEASED: { bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', color: '#15803d', border: '#86efac', label: 'Released' },
      AWAITING_CONFIRMATION: { bg: 'linear-gradient(135deg, #fefce8 0%, #fef08a 100%)', color: '#a16207', border: '#fde047', label: 'Awaiting Confirmation' },
      ITEM_RECEIVED: { bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', color: '#047857', border: '#6ee7b7', label: 'Item Received' },
      REJECTED: { bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', color: '#b91c1c', border: '#fca5a5', label: 'Rejected' },
      RETURNED: { bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', color: '#065f46', border: '#6ee7b7', label: 'Returned' },
      CANCELLED: { bg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', color: '#475569', border: '#cbd5e1', label: 'Cancelled' },
    };
    const s = conf[status];
    return (
      <span className="glitter-status-badge" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.65rem', borderRadius: 999, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {s.label}
      </span>
    );
  };

  const formatRelativeTime = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // --- API Action Handlers ---
  const fetchAllRequestsData = useCallback(async () => {
    setIsLoadingRequests(true);
    try {
      const res = await fetch('http://localhost:3001/requests', {
        headers: {
          'x-user': currentUser.email
        }
      });
      if (res.ok) {
        const json = await res.json();
        const apiData: RequestEntry[] = Array.isArray(json) ? json : (json.data || []);
        
        const normalized = apiData
          .filter(r => !!r.itemId && r.quantity >= 1)
          .filter(r => !(r.reason && r.reason.includes("[ASSET DEPLOYMENT]")))
          .map(r => {
            if (r.status === ('REJECTED' as any) && r.reviewComment === 'Cancelled by requester.') {
              return { ...r, status: 'CANCELLED' as RequestStatus };
            }
            return r;
          });

        setAllRequests(normalized);
        localStorage.setItem('salivio_requests', JSON.stringify(normalized));
        localStorage.setItem('salivio_requests_v', REQUESTS_CACHE_V);
      }
    } catch {
      // keep existing state
    } finally {
      setIsLoadingRequests(false);
    }
  }, [currentUser.email]);

  useEffect(() => {
    fetchAllRequestsData();
  }, [fetchAllRequestsData, refreshTrigger]);

  // Load from cache on mount
  useEffect(() => {
    const storedVersion = localStorage.getItem('salivio_requests_v');
    const cached = localStorage.getItem('salivio_requests');

    if (storedVersion === REQUESTS_CACHE_V && cached) {
      try {
        const parsed: RequestEntry[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed
            .filter(r => !!r.itemId && r.quantity >= 1)
            .filter(r => !(r.reason && r.reason.includes("[ASSET DEPLOYMENT]")))
            .map(r => {
              let status = r.status;
              if (status === ('REJECTED' as any) && r.reviewComment === 'Cancelled by requester.') {
                status = 'CANCELLED';
              }
              return { ...r, status };
            });
          setAllRequests(normalized);
        }
      } catch {
        // Fallback
      }
    }
  }, []);

  // Sync to cache
  useEffect(() => {
    if (allRequests && allRequests.length > 0) {
      localStorage.setItem('salivio_requests', JSON.stringify(allRequests));
      localStorage.setItem('salivio_requests_v', REQUESTS_CACHE_V);
    }
  }, [allRequests]);

  // Submit Request
  const handleSubmitRequestDirect = async (
    itemId: string,
    quantity: number,
    siteId: string,
    reason: string
  ): Promise<boolean> => {
    setIsSubmittingRequest(true);
    const selectedItem = catalogItems.find(i => i.id === itemId);
    let itemName = selectedItem?.name;
    let itemCategory = selectedItem?.category?.name;

    if (!selectedItem && itemId.startsWith('gen-')) {
      if (itemId === 'gen-laptops') { itemName = 'Laptop'; itemCategory = 'Laptops'; }
      else if (itemId === 'gen-accessories' || itemId === 'gen-peripherals') { itemName = 'Accessory'; itemCategory = 'Accessories'; }
      else { itemName = 'Generic Item'; itemCategory = 'Other'; }
    }

    try {
      let created: RequestEntry | null = null;
      try {
        const res = await fetch('http://localhost:3001/requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user': currentUser.email,
          },
          body: JSON.stringify({
            itemId,
            item: itemName,
            category: itemCategory,
            quantity,
            reason,
            urgency: 'NORMAL',
            siteId: siteId || undefined,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          created = json?.data ?? json;
        }
      } catch {
        // Fallback to mock
      }

      if (!created) {
        await new Promise(r => setTimeout(r, 700));
        created = {
          id: `req-${Date.now().toString(36)}`,
          itemId,
          itemName: itemName || itemId,
          itemCategory: itemCategory,
          requestedById: currentUser.id,
          requestedByName: currentUser.name,
          requestedByRole: currentUser.role,
          quantity,
          reason,
          urgency: 'NORMAL',
          status: 'PENDING',
          siteId: siteId || undefined,
          siteName: sites.find(s => s.id === siteId)?.name || siteId || undefined,
          createdAt: new Date().toISOString(),
        };
      }

      setAllRequests(prev => [created!, ...prev]);
      setRefreshTrigger(prev => prev + 1);
      if (onRefreshNotifications) onRefreshNotifications();
      return true;
    } catch {
      return false;
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Review (Approve/Reject) Request
  const handleReviewRequest = async (id: string, newStatus: RequestStatus, comment: string) => {
    setIsSubmittingReview(true);
    const reqToUpdate = allRequests.find(r => r.id === id);
    const currentStatus = reqToUpdate?.status;

    try {
      let updatedRequest: RequestEntry | null = null;
      try {
        let res;
        if (currentStatus === 'PENDING' && newStatus === 'PENDING_OPS_APPROVAL') {
          res = await fetch(`http://localhost:3001/movements/${id}/approve-staff`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-user': currentUser.email },
            body: JSON.stringify({ comment }),
          });
        } else if (currentStatus === 'PENDING_OPS_APPROVAL' && newStatus === 'APPROVED') {
          res = await fetch(`http://localhost:3001/movements/${id}/approve-ops`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-user': currentUser.email },
            body: JSON.stringify({ comment }),
          });
        } else if (currentStatus === 'APPROVED' && newStatus === 'READY_FOR_PICKUP') {
          res = await fetch(`http://localhost:3001/movements/${id}/prepare-pickup`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-user': currentUser.email },
            body: JSON.stringify({ comment }),
          });
        } else {
          const action = newStatus.toLowerCase();
          res = await fetch(`http://localhost:3001/requests/${id}/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment, approverEmail: currentUser.email }),
          });
        }
        if (res && res.ok) {
          const json = await res.json();
          updatedRequest = json?.data ?? json;
        }
      } catch (err) {
        console.warn('Backend request review failed, falling back to mock:', err);
      }

      await new Promise(r => setTimeout(r, 450));

      setAllRequests(prev => prev.map(r => {
        if (r.id === id) {
          if (updatedRequest) return updatedRequest;

          let staffApprovedById = r.staffApprovedById;
          let staffApprovedByName = r.staffApprovedByName;
          let staffApprovedAt = r.staffApprovedAt;
          let opsApprovedById = r.opsApprovedById;
          let opsApprovedByName = r.opsApprovedByName;
          let opsApprovedAt = r.opsApprovedAt;
          let history = r.history || [];

          if (currentStatus === 'PENDING' && newStatus === 'PENDING_OPS_APPROVAL') {
            staffApprovedById = currentUser.id;
            staffApprovedByName = currentUser.name;
            staffApprovedAt = new Date().toISOString();
            history = [...history, { status: 'PENDING_OPS_APPROVAL', comment, timestamp: new Date().toISOString(), byName: currentUser.name }];
          } else if (currentStatus === 'PENDING_OPS_APPROVAL' && newStatus === 'APPROVED') {
            opsApprovedById = currentUser.id;
            opsApprovedByName = currentUser.name;
            opsApprovedAt = new Date().toISOString();
            history = [...history, { status: 'APPROVED', comment, timestamp: new Date().toISOString(), byName: currentUser.name }];
          } else if (currentStatus === 'APPROVED' && newStatus === 'READY_FOR_PICKUP') {
            history = [...history, { status: 'READY_FOR_PICKUP', comment: comment || 'Item staged and ready for pickup', timestamp: new Date().toISOString(), byName: currentUser.name }];
          } else if (newStatus === 'REJECTED') {
            history = [...history, { status: 'REJECTED', comment: comment || 'Rejected', timestamp: new Date().toISOString(), byName: currentUser.name }];
          }

          return {
            ...r,
            status: newStatus,
            reviewComment: comment || undefined,
            approvedByName: opsApprovedByName || staffApprovedByName || currentUser.name,
            approvedBySiteId: currentUser.siteId || undefined,
            staffApprovedById,
            staffApprovedByName,
            staffApprovedAt,
            opsApprovedById,
            opsApprovedByName,
            opsApprovedAt,
            history
          };
        }
        return r;
      }));

      setSelectedRequest(prev => {
        if (prev?.id === id) {
          if (updatedRequest) return updatedRequest;

          let staffApprovedById = prev.staffApprovedById;
          let staffApprovedByName = prev.staffApprovedByName;
          let staffApprovedAt = prev.staffApprovedAt;
          let opsApprovedById = prev.opsApprovedById;
          let opsApprovedByName = prev.opsApprovedByName;
          let opsApprovedAt = prev.opsApprovedAt;
          let history = prev.history || [];

          if (currentStatus === 'PENDING' && newStatus === 'PENDING_OPS_APPROVAL') {
            staffApprovedById = currentUser.id;
            staffApprovedByName = currentUser.name;
            staffApprovedAt = new Date().toISOString();
            history = [...history, { status: 'PENDING_OPS_APPROVAL', comment, timestamp: new Date().toISOString(), byName: currentUser.name }];
          } else if (currentStatus === 'PENDING_OPS_APPROVAL' && newStatus === 'APPROVED') {
            opsApprovedById = currentUser.id;
            opsApprovedByName = currentUser.name;
            opsApprovedAt = new Date().toISOString();
            history = [...history, { status: 'APPROVED', comment, timestamp: new Date().toISOString(), byName: currentUser.name }];
          } else if (currentStatus === 'APPROVED' && newStatus === 'READY_FOR_PICKUP') {
            history = [...history, { status: 'READY_FOR_PICKUP', comment: comment || 'Item staged and ready for pickup', timestamp: new Date().toISOString(), byName: currentUser.name }];
          } else if (newStatus === 'REJECTED') {
            history = [...history, { status: 'REJECTED', comment: comment || 'Rejected', timestamp: new Date().toISOString(), byName: currentUser.name }];
          }

          return {
            ...prev,
            status: newStatus,
            reviewComment: comment || undefined,
            approvedByName: opsApprovedByName || staffApprovedByName || currentUser.name,
            approvedBySiteId: currentUser.siteId || undefined,
            staffApprovedById,
            staffApprovedByName,
            staffApprovedAt,
            opsApprovedById,
            opsApprovedByName,
            opsApprovedAt,
            history
          };
        }
        return prev;
      });

      setApprovalExpandedId(null);
      setApprovalComment('');
      setRefreshTrigger(prev => prev + 1);
      if (onRefreshNotifications) onRefreshNotifications();
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Bulk Approve Requests
  const handleBulkApprove = async (selectedIds: string[], comment?: string) => {
    setIsSubmittingReview(true);
    try {
      let updatedList: any[] = [];
      const approvalComment = comment || 'Approved from Request Orders module';
      try {
        const response = await fetch('http://localhost:3001/requests/bulk-approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ids: selectedIds,
            approverEmail: currentUser.email,
            comment: approvalComment
          })
        });
        if (response.ok) {
          const json = await response.json();
          updatedList = json.data || [];
        }
      } catch (err) {
        console.warn('Backend bulk approve error, executing fallback loop:', err);
      }

      if (updatedList.length > 0) {
        const updatedMap = new Map(updatedList.map(item => [item.id, item]));
        setAllRequests(prev => prev.map(r => updatedMap.get(r.id) || r));
      } else {
        for (const id of selectedIds) {
          const req = allRequests.find(r => r.id === id);
          if (!req) continue;
          let targetStatus: RequestStatus = 'APPROVED';
          if (req.status === 'PENDING' || (req.status as string) === 'PENDING_APPROVAL') {
            targetStatus = (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') ? 'APPROVED' : 'PENDING_OPS_APPROVAL';
          }
          await handleReviewRequest(id, targetStatus, approvalComment);
        }
      }

      setRefreshTrigger(prev => prev + 1);
      if (onRefreshCatalog) onRefreshCatalog();
      if (onRefreshNotifications) onRefreshNotifications();
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Bulk Prepare Pickup
  const handleBulkPreparePickup = async (selectedIds: string[], comment?: string) => {
    setIsSubmittingReview(true);
    const pickupComment = comment || 'Staged for pickup';
    try {
      let updatedList: any[] = [];
      try {
        const response = await fetch('http://localhost:3001/requests/bulk-prepare-pickup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ids: selectedIds,
            staffEmail: currentUser.email,
            comment: pickupComment
          })
        });
        if (response.ok) {
          const json = await response.json();
          updatedList = json.data || [];
        }
      } catch (err) {
        console.warn('Backend bulk prepare pickup error, fallback loop:', err);
      }

      if (updatedList.length > 0) {
        const updatedMap = new Map(updatedList.map(item => [item.id, item]));
        setAllRequests(prev => prev.map(r => updatedMap.get(r.id) || r));
      } else {
        for (const id of selectedIds) {
          await handleReviewRequest(id, 'READY_FOR_PICKUP', pickupComment);
        }
      }

      setRefreshTrigger(prev => prev + 1);
      if (onRefreshCatalog) onRefreshCatalog();
      if (onRefreshNotifications) onRefreshNotifications();
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Bulk Release
  const handleBulkRelease = async (selectedIds: string[], comment?: string) => {
    setIsSubmittingReview(true);
    const releaseComment = comment || 'Released';
    try {
      let updatedList: any[] = [];
      try {
        const response = await fetch('http://localhost:3001/requests/bulk-release', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ids: selectedIds,
            releaserEmail: currentUser.email,
            comment: releaseComment
          })
        });
        if (response.ok) {
          const json = await response.json();
          updatedList = json.data || [];
        }
      } catch (err) {
        console.warn('Backend bulk release error, fallback loop:', err);
      }

      if (updatedList.length > 0) {
        const updatedMap = new Map(updatedList.map(item => [item.id, item]));
        setAllRequests(prev => prev.map(r => updatedMap.get(r.id) || r));
      } else {
        for (const id of selectedIds) {
          await handleReleaseRequest(id, '');
        }
      }

      setRefreshTrigger(prev => prev + 1);
      if (onRefreshCatalog) onRefreshCatalog();
      if (onRefreshNotifications) onRefreshNotifications();
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Bulk Cancel
  const handleBulkCancel = async (selectedIds: string[], comment?: string) => {
    setIsSubmittingReview(true);
    const cancelComment = comment || 'Cancelled';
    try {
      let updatedList: any[] = [];
      try {
        const response = await fetch('http://localhost:3001/requests/bulk-cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ids: selectedIds,
            userEmail: currentUser.email,
            comment: cancelComment
          })
        });
        if (response.ok) {
          const json = await response.json();
          updatedList = json.data || [];
        }
      } catch (err) {
        console.warn('Backend bulk cancel error, fallback loop:', err);
      }

      if (updatedList.length > 0) {
        const updatedMap = new Map(updatedList.map(item => [item.id, item]));
        setAllRequests(prev => prev.map(r => updatedMap.get(r.id) || r));
      } else {
        for (const id of selectedIds) {
          await handleReviewRequest(id, 'REJECTED', cancelComment);
        }
      }

      setRefreshTrigger(prev => prev + 1);
      if (onRefreshCatalog) onRefreshCatalog();
      if (onRefreshNotifications) onRefreshNotifications();
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Release Request
  const handleReleaseRequest = async (id: string, assetId: string) => {
    setIsSubmittingReview(true);
    try {
      let updated: any = null;
      try {
        const response = await fetch(`http://localhost:3001/requests/${id}/release`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assetId, releaserEmail: currentUser.email }),
        });
        if (response.ok) {
          const json = await response.json();
          updated = json.data || json;
        } else {
          const text = await response.text();
          showAlert(`Release failed: ${text}`);
          setIsSubmittingReview(false);
          return;
        }
      } catch (err) {
        console.error('Fetch error during release:', err);
      }

      await new Promise(r => setTimeout(r, 450));
      if (updated) {
        setAllRequests(prev => prev.map(r => r.id === id ? updated : r));
        setSelectedRequest(prev => prev?.id === id ? updated : prev);
      } else {
        const releasedState = {
          status: 'AWAITING_CONFIRMATION' as RequestStatus,
          assetId,
          history: [
            ...(selectedRequest?.history || []),
            { status: 'RELEASED', timestamp: new Date().toISOString() },
            { status: 'AWAITING_CONFIRMATION', timestamp: new Date().toISOString() }
          ]
        };
        setAllRequests(prev => prev.map(r => r.id === id ? { ...r, ...releasedState } : r));
        setSelectedRequest(prev => prev?.id === id ? { ...prev, ...releasedState } : prev);
      }
      setRefreshTrigger(prev => prev + 1);
      if (onRefreshNotifications) onRefreshNotifications();
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Return Request
  const handleReturnRequest = async (
    id: string,
    quantityStatus: 'COMPLETE' | 'MISSING',
    missingCount: number,
    condition: 'GOOD' | 'BAD',
    remarks?: string,
    assetTag?: string
  ): Promise<void> => {
    setIsSubmittingReview(true);
    const parts: string[] = [];
    if (assetTag?.trim()) parts.push(`Asset Tag: ${assetTag.trim()}`);
    parts.push(`Quantity: ${quantityStatus === 'COMPLETE' ? 'Complete' : `Missing ${missingCount} item(s)`}`);
    parts.push(`Condition: ${condition === 'GOOD' ? 'Good' : 'Bad / Damaged'}`);
    if (remarks?.trim()) parts.push(`Remarks: ${remarks.trim()}`);
    const comment = parts.join(' | ');

    try {
      let success = false;
      let updatedData = null;
      try {
        const response = await fetch(`http://localhost:3001/requests/${id}/return`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comment, returnerEmail: currentUser.email })
        });
        if (response.ok) {
          const json = await response.json();
          updatedData = json.data;
          success = true;
        } else {
          const text = await response.text();
          showAlert(`Return failed: ${text}`);
          setIsSubmittingReview(false);
          return;
        }
      } catch (err) {
        console.error('Fetch error during return:', err);
      }

      await new Promise(r => setTimeout(r, 450));
      if (success && updatedData) {
        setAllRequests(prev => prev.map(r => r.id === id ? updatedData : r));
        setSelectedRequest(prev => prev?.id === id ? updatedData : prev);
      } else {
        const returnedState = {
          status: 'RETURNED' as RequestStatus,
          returnedAt: new Date().toISOString(),
          returnComment: comment,
          history: [
            ...(selectedRequest?.history || []),
            { status: 'RETURNED', comment, timestamp: new Date().toISOString(), byName: currentUser.name }
          ]
        };
        setAllRequests(prev => prev.map(r => r.id === id ? { ...r, ...returnedState } : r));
        setSelectedRequest(prev => prev?.id === id ? { ...prev, ...returnedState } : prev);
      }

      // Explicitly sync updated status to local storage cache so it persists on reload
      try {
        const cached = localStorage.getItem('salivio_requests');
        if (cached) {
          const parsed = JSON.parse(cached);
          const updatedCache = parsed.map((req: any) => req.id === id ? { ...req, status: 'RETURNED', returnedAt: new Date().toISOString() } : req);
          localStorage.setItem('salivio_requests', JSON.stringify(updatedCache));
        }
      } catch (err) {
        console.error('Failed to sync return state to cache:', err);
      }
      setRefreshTrigger(prev => prev + 1);
      if (onRefreshNotifications) onRefreshNotifications();
      if (onRefreshCatalog) onRefreshCatalog();
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Cancel Request
  const handleCancelRequest = async (id: string): Promise<void> => {
    try {
      let success = false;
      let updatedData = null;
      try {
        const json = await cancelRequest(id);
        updatedData = json?.data ?? json;
        success = true;
      } catch (err) {
        console.error('Network error during cancellation:', err);
      }

      if (success && updatedData) {
        setAllRequests(prev => prev.map(r => r.id === id ? updatedData : r));
        setSelectedRequest(prev => prev?.id === id ? updatedData : prev);
      } else {
        const cancelledState = {
          status: 'CANCELLED' as RequestStatus,
          reviewComment: 'Cancelled by requester.'
        };
        setAllRequests(prev => prev.map(r => r.id === id ? { ...r, ...cancelledState } : r));
        setSelectedRequest(prev => prev?.id === id ? { ...prev, ...cancelledState } : prev);
      }
      setRefreshTrigger(prev => prev + 1);
      if (onRefreshNotifications) onRefreshNotifications();
    } catch (err) {
      console.error('Error in handleCancelRequest:', err);
    }
  };

  const handleOpenReturnFromTable = (req: RequestEntry) => {
    setSelectedRequest(req);
    setIsDetailDrawerOpen(true);
    setShowDrawerReturnForm(true);
    // Only use a real assigned tag — no fabricated fallback
    const resolvedTag = req.assetTag || req.assetId || '';
    setReturnAssetTag(resolvedTag);
    setReturnComment('');
    setReturnQuantityStatus('COMPLETE');
    setReturnMissingCount(0);
    setReturnCondition('GOOD');
  };

  // Export PDF
  const handleExportPDF = async () => {
    if (!selectedRequest || isExportingMovementPdf) return;

    const printPdf = (request: RequestEntry) => {
      const fmt = (v: unknown) => String(v ?? 'N/A');
      const fmtDate = (d: string) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const fmtDateShort = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      const getTimelineStatusTitle = (statusStr: string) => {
        const s = (statusStr || '').toUpperCase();
        if (s === 'PENDING' || s === 'PENDING_APPROVAL' || s === 'REQUESTED') return 'Pending Staff Approval';
        if (s === 'PENDING_OPS_APPROVAL') return 'Approved By Staff';
        if (s === 'APPROVED') return 'Approved by Ops';
        if (s === 'READY_FOR_PICKUP') return 'Ready for Pickup';
        if (s === 'RELEASED') return 'Released';
        if (s === 'AWAITING_CONFIRMATION') return 'Awaiting Confirmation';
        if (s === 'ITEM_RECEIVED' || s === 'COMPLETED') return 'Item Received';
        if (s === 'RETURNED') return 'Item Returned';
        if (s === 'REJECTED') return 'Request Rejected';
        if (s === 'CANCELLED') return 'Request Cancelled';
        return s.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
      };

      const getHeaderStatusLabel = (statusStr: string) => {
        const s = (statusStr || '').toUpperCase();
        if (s === 'PENDING' || s === 'PENDING_APPROVAL' || s === 'REQUESTED') return 'Pending Staff Approval';
        if (s === 'PENDING_OPS_APPROVAL') return 'Pending Ops Approval';
        if (s === 'APPROVED') return 'Approved by Ops';
        if (s === 'READY_FOR_PICKUP') return 'Ready for Pickup';
        if (s === 'RELEASED') return 'Released';
        if (s === 'AWAITING_CONFIRMATION') return 'Awaiting Confirmation';
        if (s === 'ITEM_RECEIVED' || s === 'COMPLETED') return 'Item Received';
        if (s === 'RETURNED') return 'Item Returned';
        if (s === 'REJECTED') return 'Request Rejected';
        if (s === 'CANCELLED') return 'Request Cancelled';
        return s.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
      };

      const getRemark = (entry: any) => {
        if (entry.comment && entry.comment !== 'No comment' && entry.comment.trim() !== '') {
          return entry.comment;
        }
        const s = (entry.status || '').toUpperCase();
        if (s === 'PENDING' || s === 'PENDING_APPROVAL' || s === 'REQUESTED') return '&mdash;';
        if (s === 'PENDING_OPS_APPROVAL') return 'Initial approval granted';
        if (s === 'APPROVED') return 'Request approved by Ops Manager';
        if (s === 'READY_FOR_PICKUP') return 'Item staged and ready for pickup';
        if (s === 'RELEASED') return 'Item released to user';
        if (s === 'AWAITING_CONFIRMATION') return 'Awaiting confirmation of receipt by requester';
        if (s === 'ITEM_RECEIVED' || s === 'COMPLETED') return 'Receipt confirmed by requester';
        if (s === 'RETURNED') return 'Item returned to inventory';
        return '&mdash;';
      };

      const getActionedBy = (entry: any, req: RequestEntry) => {
        if (entry.byName && entry.byName.trim() !== '') {
          return entry.byName;
        }
        const s = (entry.status || '').toUpperCase();
        if (s === 'PENDING' || s === 'PENDING_APPROVAL' || s === 'REQUESTED') return req.requestedByName || 'Requester';
        if (s === 'PENDING_OPS_APPROVAL') return req.staffApprovedByName || 'Inventory Staff';
        if (s === 'APPROVED') return req.opsApprovedByName || 'Ops Manager';
        if (s === 'READY_FOR_PICKUP') return 'Inventory Staff';
        if (s === 'RELEASED') return req.senderName || 'Logistics Staff';
        if (s === 'AWAITING_CONFIRMATION') return 'System';
        if (s === 'ITEM_RECEIVED' || s === 'COMPLETED') return req.requestedByName || 'Requester';
        return 'System';
      };

      const ascHistory = [...(request.history || [])].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const hasInitialPending = ascHistory.some(evt => (evt.status || '').toUpperCase() === 'PENDING_APPROVAL' || (evt.status || '').toUpperCase() === 'PENDING');
      if (!hasInitialPending) {
        const firstTimestamp = ascHistory.length > 0 ? ascHistory[0].timestamp : (request.createdAt || new Date().toISOString());
        ascHistory.unshift({
          status: 'PENDING_APPROVAL',
          timestamp: firstTimestamp,
          byName: request.requestedByName
        });
      }

      interface PdfTimelineEntry {
        timestamp: string;
        title: string;
        remark: string;
        byName: string;
      }

      const timelineEntries: PdfTimelineEntry[] = [];

      for (let i = 0; i < ascHistory.length; i++) {
        const evt = ascHistory[i];
        const s = (evt.status || '').toUpperCase();

        if (s === 'PENDING' || s === 'PENDING_APPROVAL' || s === 'REQUESTED') {
          timelineEntries.push({
            timestamp: evt.timestamp,
            title: 'Pending Staff Approval',
            remark: (evt.comment && evt.comment !== 'No comment' && evt.comment.trim() !== '') ? evt.comment : '&mdash;',
            byName: evt.byName || request.requestedByName || 'Requester'
          });
        } else if (s === 'PENDING_OPS_APPROVAL') {
          timelineEntries.push({
            timestamp: evt.timestamp,
            title: 'Approved By Staff',
            remark: (evt.comment && evt.comment !== 'No comment' && evt.comment.trim() !== '') ? evt.comment : 'Initial approval granted',
            byName: request.staffApprovedByName || evt.byName || 'Inventory Staff'
          });
          timelineEntries.push({
            timestamp: evt.timestamp,
            title: 'Pending Ops Approval',
            remark: 'Forwarded for Ops Manager review',
            byName: 'Ops Manager'
          });
        } else if (s === 'APPROVED') {
          timelineEntries.push({
            timestamp: evt.timestamp,
            title: 'Approved by Ops',
            remark: (evt.comment && evt.comment !== 'No comment' && evt.comment.trim() !== '') ? evt.comment : 'Request approved by Ops Manager',
            byName: request.opsApprovedByName || evt.byName || 'Ops Manager'
          });
        } else if (s === 'READY_FOR_PICKUP') {
          timelineEntries.push({
            timestamp: evt.timestamp,
            title: 'Ready for Pickup',
            remark: (evt.comment && evt.comment !== 'No comment' && evt.comment.trim() !== '') ? evt.comment : 'Item staged and ready for pickup',
            byName: evt.byName || 'Inventory Staff'
          });
        } else if (s === 'RELEASED') {
          timelineEntries.push({
            timestamp: evt.timestamp,
            title: 'Released',
            remark: (evt.comment && evt.comment !== 'No comment' && evt.comment.trim() !== '') ? evt.comment : 'Item released to user',
            byName: evt.byName || request.senderName || 'Logistics Staff'
          });
        } else if (s === 'AWAITING_CONFIRMATION') {
          timelineEntries.push({
            timestamp: evt.timestamp,
            title: 'Awaiting Confirmation',
            remark: (evt.comment && evt.comment !== 'No comment' && evt.comment.trim() !== '') ? evt.comment : 'Awaiting confirmation of receipt by requester',
            byName: 'System'
          });
        } else if (s === 'ITEM_RECEIVED' || s === 'COMPLETED') {
          timelineEntries.push({
            timestamp: evt.timestamp,
            title: 'Item Received',
            remark: (evt.comment && evt.comment !== 'No comment' && evt.comment.trim() !== '') ? evt.comment : 'Receipt confirmed by requester',
            byName: request.requestedByName || evt.byName || 'Requester'
          });
        } else if (s === 'RETURNED') {
          timelineEntries.push({
            timestamp: evt.timestamp,
            title: 'Item Returned',
            remark: (evt.comment && evt.comment !== 'No comment' && evt.comment.trim() !== '') ? evt.comment : 'Item returned to inventory',
            byName: evt.byName || 'Inventory Staff'
          });
        } else if (s === 'REJECTED' || s === 'CANCELLED') {
          timelineEntries.push({
            timestamp: evt.timestamp,
            title: s === 'REJECTED' ? 'Request Rejected' : 'Request Cancelled',
            remark: (evt.comment && evt.comment !== 'No comment' && evt.comment.trim() !== '') ? evt.comment : `Request ${s.toLowerCase()}`,
            byName: evt.byName || 'System'
          });
        } else {
          timelineEntries.push({
            timestamp: evt.timestamp,
            title: s.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' '),
            remark: evt.comment || '&mdash;',
            byName: evt.byName || 'System'
          });
        }
      }

      const sortedHistory = timelineEntries;

      const timelineTableRows = timelineEntries.map((entry, i) => `
        <tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
          <td class="tbl-cell">${fmtDate(entry.timestamp)}</td>
          <td class="tbl-cell" style="font-weight:700">${entry.title}</td>
          <td class="tbl-cell">${entry.remark}</td>
          <td class="tbl-cell">${entry.byName}</td>
        </tr>
      `).join('');

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Asset Movement Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Georgia&family=Inter:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', Arial, sans-serif;
    font-size: 9pt;
    color: #1a1a2e;
    background: #fff;
    line-height: 1.45;
  }
  .page { width: 794px; margin: 0 auto; padding: 36px 48px; }

  /* ── Letterhead ── */
  .letterhead {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 12px;
    border-bottom: 3px solid #2a6496;
    margin-bottom: 4px;
  }
  .org-name {
    font-size: 17pt;
    font-weight: 700;
    color: #2a6496;
    letter-spacing: -0.3px;
    line-height: 1.1;
  }
  .org-sub {
    font-size: 7.5pt;
    color: #555;
    margin-top: 3px;
    letter-spacing: 0.2px;
  }
  .doc-meta { text-align: right; }
  .doc-title {
    font-size: 10pt;
    font-weight: 700;
    color: #2a6496;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .doc-ref {
    font-size: 7pt;
    color: #666;
    margin-top: 4px;
    font-family: 'Courier New', monospace;
  }
  .doc-date { font-size: 8pt; color: #444; margin-top: 2px; }

  /* ── Accent bar ── */
  .accent-bar {
    height: 3px;
    background: linear-gradient(to right, #2a6496, #5bc0de);
    margin-bottom: 18px;
  }

  /* ── Section headers ── */
  .section-label {
    font-size: 7.5pt;
    font-weight: 700;
    color: #2a6496;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 1.5px solid #2a6496;
    padding-bottom: 3px;
    margin-bottom: 6px;
  }

  /* ── Info table (key-value pairs) ── */
  .info-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .info-table td { padding: 5px 8px; vertical-align: top; }
  .info-key {
    width: 16%;
    font-size: 8pt;
    font-weight: 600;
    color: #444;
    background: #f0f4f8;
    border: 1px solid #dde4ed;
  }
  .info-val {
    width: 34%;
    font-size: 8.5pt;
    color: #1a1a2e;
    border: 1px solid #dde4ed;
  }

  /* ── Movement block ── */
  .movement-row {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 16px;
    border: 1px solid #dde4ed;
  }
  .move-cell {
    flex: 1;
    padding: 8px 12px;
    background: #f7fafc;
  }
  .move-cell + .move-cell { border-left: 1px solid #dde4ed; }
  .move-label { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #2a6496; margin-bottom: 3px; }
  .move-value { font-size: 9.5pt; font-weight: 600; color: #1a1a2e; }
  .move-arrow {
    padding: 0 14px;
    font-size: 14pt;
    color: #2a6496;
    font-weight: 700;
    background: #e8f1f8;
    align-self: stretch;
    display: flex;
    align-items: center;
  }

  /* ── Reason box ── */
  .reason-box {
    border: 1px solid #dde4ed;
    background: #fafbfc;
    padding: 8px 12px;
    margin-bottom: 16px;
  }
  .reason-text { font-size: 8.5pt; color: #333; text-align: justify; line-height: 1.6; }

  /* ── Timeline table ── */
  .data-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 7.5pt; }
  .tbl-head th {
    background: #2a6496;
    color: #fff;
    font-size: 7pt;
    font-weight: 700;
    text-align: left;
    padding: 6px 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border: 1px solid #1e4f78;
  }
  .tbl-cell { padding: 5px 8px; border: 1px solid #dde4ed; color: #2c2c2c; vertical-align: top; }
  .row-even { background: #f7fafc; }
  .row-odd  { background: #fff; }

  /* ── Status strip ── */
  .status-strip {
    display: flex;
    justify-content: flex-start;
    gap: 32px;
    padding: 8px 16px;
    background: #f0f4f8;
    border: 1px solid #dde4ed;
    margin-bottom: 16px;
  }
  .strip-item { display: flex; flex-direction: column; gap: 2px; }
  .strip-key { font-size: 6.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #666; }
  .strip-val { font-size: 8.5pt; font-weight: 600; color: #1a1a2e; }
  .strip-div { width: 1px; background: #ccd6e0; align-self: stretch; margin: 0 -16px; }

  /* ── Footer ── */
  .footer {
    border-top: 1.5px solid #2a6496;
    padding-top: 8px;
    margin-top: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-left { font-size: 6.5pt; color: #888; }
  .footer-right { font-size: 6.5pt; color: #888; text-align: right; }
  .conf-label {
    font-size: 6pt;
    font-weight: 700;
    letter-spacing: 0.8px;
    color: #c0392b;
    text-transform: uppercase;
    border: 1px solid #c0392b;
    padding: 1px 5px;
    display: inline-block;
  }
</style>
</head>
<body>
<div class="page">

  <!-- Letterhead -->
  <div class="letterhead">
    <div>
      <div class="org-name">ContactPoint 360</div>
      <div class="org-sub">Asset Inventory System &nbsp;&bull;&nbsp; Internal Use Only</div>
    </div>
    <div class="doc-meta">
      <div class="doc-title">Asset Movement Report</div>
      <div class="doc-ref">Ref No.: ${request.id.substring(0, 16).toUpperCase()}</div>
      <div class="doc-date">Date: ${fmtDateShort(request.createdAt)}</div>
    </div>
  </div>
  <div class="accent-bar"></div>

  <!-- Status Strip -->
  <div class="status-strip">
    <div class="strip-item">
      <span class="strip-key">Status</span>
      <span class="strip-val">${getHeaderStatusLabel(request.status)}</span>
    </div>
    <div class="strip-div"></div>
    <div class="strip-item">
      <span class="strip-key">Urgency Level</span>
      <span class="strip-val">${fmt(request.urgency)}</span>
    </div>
    <div class="strip-div"></div>
    <div class="strip-item">
      <span class="strip-key">Report Generated</span>
      <span class="strip-val">${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
    </div>
  </div>

  <!-- Item & Requester Info -->
  <div class="section-label">Item &amp; Requester Details</div>
  <table class="info-table">
    <tr>
      <td class="info-key">Item Name</td>
      <td class="info-val">${fmt(request.itemName)}</td>
      <td class="info-key">Requested By</td>
      <td class="info-val">${fmt(request.requestedByName)}</td>
    </tr>
    <tr>
      <td class="info-key">Quantity</td>
      <td class="info-val">${fmt(request.quantity)}</td>
      <td class="info-key">Department</td>
      <td class="info-val">${fmt(request.requestedByDepartment || 'N/A')}</td>
    </tr>
    ${request.assetTag ? `<tr>
      <td class="info-key">Asset Tag</td>
      <td class="info-val" style="font-family:'Courier New',monospace;font-size:8pt">${fmt(request.assetTag)}</td>
      <td class="info-key">Category</td>
      <td class="info-val">${fmt(request.itemCategory || 'N/A')}</td>
    </tr>` : ''}
  </table>

  <!-- Movement -->
  <div class="section-label">Movement Details</div>
  <div class="movement-row">
    <div class="move-cell">
      <div class="move-label">Origin Site (From)</div>
      <div class="move-value">
        ${fmt(request.assetSiteName || request.senderSiteName || 'N/A')}
        ${request.assetSiteName && request.senderSiteName && request.assetSiteName !== request.senderSiteName ? `<span style="font-size:7pt;color:#555;font-weight:normal;display:block;margin-top:2px;">(Sourced by staff from ${request.senderSiteName})</span>` : ''}
      </div>
    </div>
    <div class="move-arrow">&#8594;</div>
    <div class="move-cell">
      <div class="move-label">Destination Site (To)</div>
      <div class="move-value">${fmt(request.receiverSiteName || 'N/A')}</div>
    </div>
  </div>

  <!-- Reason -->
  <div class="section-label">Reason for Request</div>
  <div class="reason-box">
    <div class="reason-text">${fmt(request.reason || 'No reason provided.')}</div>
  </div>

  <!-- Timeline -->
  ${sortedHistory.length ? `
  <div class="section-label">Movement Timeline</div>
  <table class="data-table">
    <thead class="tbl-head">
      <tr>
        <th style="width:24%">Date &amp; Time</th>
        <th style="width:22%">Status</th>
        <th style="width:36%">Remarks / Comment</th>
        <th style="width:18%">Actioned By</th>
      </tr>
    </thead>
    <tbody>
      ${timelineTableRows}
    </tbody>
  </table>` : ''}

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">
      ContactPoint 360 &mdash; Asset Management System &nbsp;&nbsp;
      <span class="conf-label">Confidential</span>
    </div>
    <div class="footer-right">
      Page 1 of 1 &nbsp;|&nbsp; &copy; ${new Date().getFullYear()} ContactPoint 360
    </div>
  </div>

</div>
</body>
</html>`;

      return html;
    };


    setIsExportingMovementPdf(true);
    setIsExportingMovementPdf(true);
    try {
      const html = printPdf(selectedRequest);

      // Create hidden iframe to render the HTML at full A4 width
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:794px;height:1123px;border:none;visibility:hidden;';
      document.body.appendChild(iframe);

      const iDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iDoc) throw new Error('Failed to create render frame');
      iDoc.open();
      iDoc.write(html);
      iDoc.close();

      // Wait for fonts and layout
      await new Promise(r => setTimeout(r, 800));

      const canvas = await html2canvas(iDoc.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        windowWidth: 794,
      });

      document.body.removeChild(iframe);

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
      pdf.save(`asset-movement-${selectedRequest.id}.pdf`);
    } catch (error) {
      showAlert(error instanceof Error ? error.message : String(error), 'Export PDF Failed');
    } finally {
      setIsExportingMovementPdf(false);
    }
  };

  // Map CatalogItems to InventoryItems for NewRequestModal

  const mappedInventoryItems = catalogItems.map(it => {
    const totalStock = it.stockLevels?.reduce((sum, sl) => sum + sl.quantity, 0) ?? 0;
    return {
      id: it.id,
      name: it.name,
      sku: it.sku,
      stock: totalStock,
      category: it.category?.name
    };
  });

  const isStaff = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'INVENTORY_STAFF';

  // State expansion helper
  const [approvalExpandedId, setApprovalExpandedId] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', padding: '1.5rem' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>Asset Transfer</h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
            Manage asset transfer requests and approval queues
          </p>
        </div>
        <button
          onClick={() => setIsNewRequestOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            backgroundColor: '#6366F1',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            padding: '0.5rem 1rem',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#4F46E5';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(99, 102, 241, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#6366F1';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(99, 102, 241, 0.2)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {isStaff ? 'Transfer Asset' : 'Request Transfer'}
        </button>
      </div>

      {/* Sub-tabs header for Admins / Staff */}
      {isStaff && (
        <div style={{
          display: 'flex',
          backgroundColor: '#f1f5f9',
          borderRadius: 10,
          padding: '0.25rem',
          width: 'fit-content',
          gap: '0.25rem',
          border: '1px solid #e2e8f0'
        }}>
          {([
            { id: 'queue', label: 'Asset Transfer Queue' },
            { id: 'my-requests', label: 'Recent Transfers' }
          ] as const).map((tab) => {
            const isActive = ordersSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setOrdersSubTab(tab.id)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#0f172a' : '#64748b',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Queue View vs My Requests View */}
      <div key={ordersSubTab} className="animate-module-flip">
        {isStaff && ordersSubTab === 'queue' ? (
          <>
            <RequestsTable
              allRequests={allRequests}
              sites={sites}
              canApprove={currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'INVENTORY_STAFF'}
              canRelease={currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'INVENTORY_STAFF'}
              canExport={true}
              onReview={handleReviewRequest}
              onRelease={handleReleaseRequest}
              onBulkApprove={handleBulkApprove}
              onBulkPreparePickup={handleBulkPreparePickup}
              onBulkRelease={handleBulkRelease}
              onBulkCancel={handleBulkCancel}
              onExport={handleExportPDF}
              onReturn={handleOpenReturnFromTable}
              onRowClick={(req) => {
                setSelectedRequest(req);
                setIsDetailDrawerOpen(true);
                setShowDrawerReturnForm(false);
              }}
              renderStatusBadge={renderStatusBadge}
              formatRelativeTime={formatRelativeTime}
              currentUserId={currentUser.id}
              currentUserRole={currentUser.role}
            />
          </>
        ) : (
          <MyRequestsPanel
            onCancel={handleCancelRequest}
            onBulkCancel={handleBulkCancel}
            renderStatusBadge={renderStatusBadge}
            formatRelativeTime={formatRelativeTime}
            refreshTrigger={refreshTrigger}
            allRequests={allRequests}
            currentUserId={currentUser.id}
            currentUserName={currentUser.name}
            collapsible={false}
            onRowClick={(req) => {
              setSelectedRequest(req);
              setIsDetailDrawerOpen(true);
              setShowDrawerReturnForm(false);
            }}
          />
        )}
      </div>

      {/* Modals & Slide-overs */}
      {isNewRequestOpen && (
        <NewRequestModal
          open={isNewRequestOpen}
          onClose={() => setIsNewRequestOpen(false)}
          inventoryItems={mappedInventoryItems}
          sites={sites}
          onSubmit={handleSubmitRequestDirect}
          title={isStaff ? 'Transfer Asset' : 'Request Transfer'}
        />
      )}

      {/* Detail Drawer Modal */}
      {isMounted && isDetailDrawerOpen && selectedRequest && createPortal(
        <div
          onClick={() => setIsDetailDrawerOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1.25rem',
            boxSizing: 'border-box'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '640px',
              maxHeight: '88vh',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #e2e8f0',
              boxSizing: 'border-box'
            }}
          >
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.72rem', color: '#3730a3', fontFamily: 'monospace', fontWeight: 700, backgroundColor: '#eef2ff', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid #c7d2fe', width: 'fit-content' }}>
                  {(selectedRequest as any).groupRequestId || selectedRequest.id}
                </span>
                <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  {selectedRequest.reason && selectedRequest.reason.includes('[ASSET DEPLOYMENT]') ? 'Deployment Details' : 'Request Details'}
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isStaff && (
                  <button
                    onClick={handleExportPDF}
                    disabled={isExportingMovementPdf}
                    title={isExportingMovementPdf ? 'Exporting PDF' : 'Export PDF'}
                    style={{
                      background: '#ffffff', border: '1px solid #e2e8f0', padding: '6px 10px',
                      borderRadius: '6px', cursor: isExportingMovementPdf ? 'wait' : 'pointer', fontSize: '0.8rem', color: '#475569',
                      fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      opacity: isExportingMovementPdf ? 0.65 : 1
                    }}
                    onMouseOver={(e) => {
                      if (isExportingMovementPdf) return;
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.color = '#0f172a';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.color = '#475569';
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    {isExportingMovementPdf ? 'Exporting' : 'Export'}
                  </button>
                )}
                <button
                  onClick={() => setIsDetailDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.5rem', padding: '4px' }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Status Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '0.85rem 1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Current Status</span>
                {renderStatusBadge(selectedRequest.status, selectedRequest.reason)}
              </div>

              {/* Info Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {(() => {
                  const groupItems: RequestEntry[] = (selectedRequest as any).groupItems || [];
                  if (groupItems.length > 1) {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Asset Names & Quantities ({groupItems.length} Assets)
                        </label>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                              <tr>
                                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#475569' }}>Asset Name</th>
                                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Qty</th>
                                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#475569' }}>Asset Tag</th>
                                <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#475569' }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {groupItems.map((gItem: RequestEntry, idx: number) => (
                                <tr key={gItem.id || idx} style={{ borderBottom: idx < groupItems.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                  <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#0f172a' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <span style={{ color: '#64748b' }}>{getCategoryIcon(gItem.itemCategory, gItem.itemName)}</span>
                                      <span>{getDisplayName(gItem)}</span>
                                    </div>
                                  </td>
                                  <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                                    {gItem.quantity || 1}
                                  </td>
                                  <td style={{ padding: '0.65rem 0.75rem' }}>
                                    {gItem.assetTag ? (
                                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4338ca', backgroundColor: '#eef2ff', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid #c7d2fe' }}>
                                        🏷️ {gItem.assetTag}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.72rem' }}>N/A</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '0.65rem 0.75rem' }}>
                                    {renderStatusBadge(gItem.status)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  }

                  const cat = (selectedRequest.itemCategory || '').toLowerCase();
                  const itemNameLower = (selectedRequest.itemName || '').toLowerCase();
                  const isConsumableReq =
                    cat.includes('consumable') ||
                    cat.includes('keyboard') || cat.includes('mice') || cat.includes('mouse') ||
                    itemNameLower.includes('keyboard') || itemNameLower.includes('mouse') ||
                    itemNameLower.includes('krs-83') || itemNameLower.includes('ser01') || itemNameLower.includes('op-720');

                  const realTag = selectedRequest.assetTag?.trim() || null;

                  return (
                    <>
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Item Name</label>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '0.15rem' }}>{getDisplayName(selectedRequest)}</div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: isConsumableReq || !realTag ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Quantity</label>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a', marginTop: '0.15rem' }}>{selectedRequest.quantity} units</div>
                        </div>
                        {!isConsumableReq && realTag && (
                          <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Asset Tag</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem', maxWidth: '100%' }}>
                              {realTag.split(/,\s*/).map((tag, idx) => (
                                <span key={idx} style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  color: '#4338ca',
                                  backgroundColor: '#eef2ff',
                                  border: '1px solid #c7d2fe',
                                  borderRadius: '4px',
                                  padding: '0.15rem 0.45rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  wordBreak: 'break-all',
                                  maxWidth: '100%'
                                }}>
                                  🏷️ {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                      {selectedRequest.reason && selectedRequest.reason.includes('[ASSET DEPLOYMENT]') ? 'Deployed By' : 'Requested By'}
                    </label>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginTop: '0.15rem', display: 'flex', alignItems: 'center', wordBreak: 'break-word' }}>
                      {sites.find(s => s.id === selectedRequest.requestedBySiteId)?.prefix && (
                        <span style={{ fontSize: '0.6rem', padding: '0.15rem 0.35rem', backgroundColor: '#f5f3ff', color: '#3730a3', borderRadius: '4px', fontWeight: 700, letterSpacing: '0.02em', marginRight: '0.35rem', flexShrink: 0 }}>
                          {sites.find(s => s.id === selectedRequest.requestedBySiteId)?.prefix}
                        </span>
                      )}
                      <span style={{ wordBreak: 'break-word' }}>{selectedRequest.requestedByName}</span>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                      {selectedRequest.reason && selectedRequest.reason.includes('[ASSET DEPLOYMENT]') ? 'Deployment Site' : 'Site'}
                    </label>
                    <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '0.15rem', wordBreak: 'break-word' }}>{selectedRequest.siteName || 'No specific site'}</div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                    {selectedRequest.reason && selectedRequest.reason.includes('[ASSET DEPLOYMENT]') ? 'Deployment Notes' : 'Reason for Request'}
                  </label>
                  <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, marginTop: '0.25rem', padding: '0.75rem', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {cleanReason(selectedRequest.reason)}
                  </div>
                </div>

                {(selectedRequest.status === 'APPROVED' || selectedRequest.status === 'READY_FOR_PICKUP' || selectedRequest.status === 'RETURNED' || selectedRequest.status === 'REJECTED' || selectedRequest.status === 'RELEASED') && (
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                      {selectedRequest.status === 'REJECTED' ? 'Rejected By' : 'Approved By'}
                    </label>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginTop: '0.15rem', display: 'flex', alignItems: 'center' }}>
                      {sites.find(s => s.id === selectedRequest.approvedBySiteId)?.prefix && (
                        <span style={{ fontSize: '0.6rem', padding: '0.15rem 0.35rem', backgroundColor: '#f5f3ff', color: '#3730a3', borderRadius: '4px', fontWeight: 700, letterSpacing: '0.02em', marginRight: '0.35rem' }}>
                          {sites.find(s => s.id === selectedRequest.approvedBySiteId)?.prefix}
                        </span>
                      )}
                      <span>{selectedRequest.approvedByName || 'System Manager'}</span>
                    </div>
                  </div>
                )}

                {selectedRequest.reviewComment && (
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Fulfillment & Approval Remarks</label>
                    <div style={{ fontSize: '0.82rem', color: '#1e293b', lineHeight: 1.5, marginTop: '0.25rem', padding: '0.75rem', background: '#fffbeb', borderRadius: 6, border: '1px solid #fef3c7' }}>
                      "{cleanReviewComment(selectedRequest.reviewComment)}"
                    </div>
                  </div>
                )}                {/* Permanent Asset Movement Details Section */}
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
                }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.75rem' }}>
                    Asset Movement Details
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>Sender</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', display: 'block', marginTop: '0.15rem' }}>
                        {selectedRequest.reason && selectedRequest.reason.includes("[ASSET DEPLOYMENT]")
                          ? (selectedRequest.requestedByName || "Inventory Staff")
                          : (selectedRequest.senderName || "Inventory Staff")}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#475569', display: 'block', marginTop: '0.1rem' }}>
                        {selectedRequest.senderSiteName || sites.find(s => s.id === currentUser?.siteId || s.name === currentUser?.site?.name)?.name || "Skyrise 4B"}
                      </span>
                      {selectedRequest.assetSiteName && (
                        <div style={{ marginTop: '0.4rem', padding: '0.3rem 0.45rem', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, fontSize: '0.72rem' }}>
                          <span style={{ fontWeight: 600, color: '#0369a1', display: 'block', textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.3px' }}>Asset Origin Site</span>
                          <div style={{ color: '#0c4a6e', fontWeight: 700, marginTop: '0.05rem' }}>{selectedRequest.assetSiteName}</div>
                        </div>
                      )}
                    </div>
                    <div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>Receiver</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', display: 'block', marginTop: '0.15rem' }}>
                        {selectedRequest.reason && selectedRequest.reason.includes("[ASSET DEPLOYMENT]")
                          ? (selectedRequest.reason.match(/Deploy to:\s*([^|]+)/)?.[1]?.trim() || selectedRequest.requestedByName)
                          : (selectedRequest.receiverName || selectedRequest.requestedByName)}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#475569', display: 'block', marginTop: '0.1rem' }}>
                        {(() => {
                          const sName = selectedRequest.siteName || selectedRequest.receiverSiteName;
                          const targetSite = sites.find(s =>
                            (selectedRequest.siteId && s.id === selectedRequest.siteId) ||
                            (sName && (s.name.trim().toLowerCase() === sName.trim().toLowerCase() || (s.address && s.address.trim().toLowerCase() === sName.trim().toLowerCase())))
                          );
                          return targetSite?.name || sName || "Default Site";
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline / History Log Accordion */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsTimelineExpanded(prev => !prev)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '0.65rem 0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {selectedRequest.reason && selectedRequest.reason.includes('[ASSET DEPLOYMENT]') ? 'Deployment Timeline' : 'Request Timeline'}
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      style={{
                        transform: isTimelineExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        color: '#64748b'
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {isTimelineExpanded && (
                    <div style={{ marginTop: '0.85rem' }}>
                      <RequestTimeline
                        requestId={selectedRequest.id}
                        status={selectedRequest.status}
                        requestedById={selectedRequest.requestedById}
                        requestedByName={selectedRequest.requestedByName}
                        currentUserEmail={currentUser.email}
                        currentUserId={currentUser.id}
                        currentUserRole={currentUser.role}
                        staffApprovedById={selectedRequest.staffApprovedById}
                        staffApprovedByName={selectedRequest.staffApprovedByName}
                        staffApprovedAt={selectedRequest.staffApprovedAt}
                        opsApprovedById={selectedRequest.opsApprovedById}
                        opsApprovedByName={selectedRequest.opsApprovedByName}
                        opsApprovedAt={selectedRequest.opsApprovedAt}
                        history={selectedRequest.history}
                        onConfirmSuccess={(updatedReq) => {
                          setAllRequests(prev => prev.map(r => r.id === updatedReq.id ? { ...r, ...updatedReq } : r));
                          setSelectedRequest(prev => prev?.id === updatedReq.id ? { ...prev, ...updatedReq } : prev);
                        }}
                        assetTag={selectedRequest.assetTag || selectedRequest.assetId}
                        itemName={selectedRequest.itemName}
                        itemCategory={selectedRequest.itemCategory}
                        senderName={
                          selectedRequest.reason && selectedRequest.reason.includes("[ASSET DEPLOYMENT]")
                            ? (selectedRequest.requestedByName || "Inventory Staff")
                            : (selectedRequest.senderName || undefined)
                        }
                        senderSiteName={
                          selectedRequest.senderSiteName ||
                          sites.find(s => s.id === currentUser?.siteId || s.name === currentUser?.site?.name)?.name ||
                          "Skyrise 4B"
                        }
                        senderSiteAddress={
                          selectedRequest.senderSiteAddress ||
                          sites.find(s => s.id === currentUser?.siteId || s.name === currentUser?.site?.name)?.address ||
                          undefined
                        }
                        assetSiteName={
                          (() => {
                            const targetName = selectedRequest.siteName || selectedRequest.receiverSiteName;
                            if (selectedRequest.assetSiteName && selectedRequest.assetSiteName !== targetName) {
                              return selectedRequest.assetSiteName;
                            }
                            if (selectedRequest.senderSiteName && selectedRequest.senderSiteName !== targetName) {
                              return selectedRequest.senderSiteName;
                            }
                            return 'Skyrise 4B';
                          })()
                        }
                        assetSiteAddress={selectedRequest.assetSiteAddress || undefined}
                        receiverName={
                          selectedRequest.reason && selectedRequest.reason.includes("[ASSET DEPLOYMENT]")
                            ? (selectedRequest.reason.match(/Deploy to:\s*([^|]+)/)?.[1]?.trim() || selectedRequest.requestedByName)
                            : (selectedRequest.receiverName || selectedRequest.requestedByName)
                        }
                        receiverSiteName={
                          (() => {
                            const sName = selectedRequest.siteName || selectedRequest.receiverSiteName;
                            const targetSite = sites.find(s =>
                              (selectedRequest.siteId && s.id === selectedRequest.siteId) ||
                              (sName && (s.name.trim().toLowerCase() === sName.trim().toLowerCase() || (s.address && s.address.trim().toLowerCase() === sName.trim().toLowerCase())))
                            );
                            return targetSite?.name || sName || undefined;
                          })()
                        }
                        receiverSiteAddress={
                          (() => {
                            const sName = selectedRequest.siteName || selectedRequest.receiverSiteName;
                            const targetSite = sites.find(s =>
                              (selectedRequest.siteId && s.id === selectedRequest.siteId) ||
                              (sName && (s.name.trim().toLowerCase() === sName.trim().toLowerCase() || (s.address && s.address.trim().toLowerCase() === sName.trim().toLowerCase())))
                            );
                            return targetSite?.address || (targetSite?.name ? targetSite.name : undefined);
                          })()
                        }
                        receivedAt={selectedRequest.returnedAt || selectedRequest.updatedAt}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Review Form for Admin (Reject only in this panel, approve is handled inline in table) */}
            {(selectedRequest.status === 'PENDING' || selectedRequest.status === 'PENDING_OPS_APPROVAL') && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && selectedRequest.requestedById !== currentUser.id && (
              <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Review Comment</label>
                  <textarea
                    rows={2}
                    placeholder="Add rejection comment (required)..."
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.8rem', fontFamily: 'inherit' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      if (!approvalComment.trim()) {
                        showAlert('A comment is required when rejecting a request.');
                        return;
                      }
                      handleReviewRequest(selectedRequest.id, 'REJECTED', approvalComment.trim());
                    }}
                    disabled={isSubmittingReview}
                    style={{ padding: '0.45rem 1.25rem', border: '1px solid #dc2626', color: '#dc2626', background: '#ffffff', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Reject Request
                  </button>
                </div>
              </div>
            )}


            {/* Cancel Request — visible to the requester for any cancellable status */}
            {['PENDING', 'PENDING_OPS_APPROVAL'].includes(selectedRequest.status) &&
              selectedRequest.requestedById === currentUser.id && (
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #fee2e2', backgroundColor: '#fef2f2', display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span>&#9888;</span>
                  <span style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 600 }}>
                    {isStaff ? 'Self-request: You cannot approve your own request.' : 'Your request is pending review.'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    showConfirm(
                      'Are you sure you want to cancel this request? This action cannot be undone.',
                      async () => {
                        await handleCancelRequest(selectedRequest.id);
                        setIsDetailDrawerOpen(false);
                      },
                      'Cancel Request'
                    );
                  }}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: 6,
                    border: '1px solid #dc2626',
                    backgroundColor: '#ffffff',
                    color: '#dc2626',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                >
                  Cancel Request
                </button>
              </div>
            )}


            {/* Return Asset Form & Button for Inventory Staff, Admin, and Super Admin */}
            {showDrawerReturnForm && (selectedRequest.status === 'RELEASED' || selectedRequest.status === 'ITEM_RECEIVED' || (selectedRequest.reason && selectedRequest.reason.includes('[ASSET DEPLOYMENT]'))) && ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_STAFF'].includes(currentUser.role) && (
              <div style={{ padding: '1.25rem 1.5rem', borderTop: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Return Asset Form</p>
                  </div>

                  {selectedRequest.itemCategory !== 'Consumables' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#475569' }}>
                        Asset Tag / Serial Number {returnQuantityStatus !== 'MISSING' && <span style={{ color: '#ef4444' }}>*</span>}
                      </label>
                      <input
                        type="text"
                        placeholder="Scan barcode or type tag"
                        value={returnAssetTag}
                        onChange={(e) => setReturnAssetTag(e.target.value)}
                        readOnly={!!selectedRequest.assetTag}
                        disabled={!!selectedRequest.assetTag}
                        style={{
                          padding: '0.5rem 0.65rem',
                          borderRadius: 7,
                          border: selectedRequest.assetTag ? '1px solid #cbd5e1' : '1px solid #38bdf8',
                          fontSize: '0.82rem',
                          color: selectedRequest.assetTag ? '#64748b' : '#0f172a',
                          backgroundColor: selectedRequest.assetTag ? '#f1f5f9' : '#ffffff',
                          outline: 'none',
                          width: '100%'
                        }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#475569' }}>
                      Quantity Status <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={returnQuantityStatus}
                      onChange={(e) => {
                        setReturnQuantityStatus(e.target.value as 'COMPLETE' | 'MISSING');
                        if (e.target.value === 'COMPLETE') setReturnMissingCount(0);
                      }}
                      style={{ padding: '0.5rem 0.65rem', borderRadius: 7, border: '1px solid #cbd5e1', fontSize: '0.82rem', backgroundColor: '#ffffff', outline: 'none' }}
                    >
                      <option value="COMPLETE">✓ Complete – all items returned</option>
                      <option value="MISSING">⚠ Missing – some items not returned</option>
                    </select>
                  </div>

                  {returnQuantityStatus === 'MISSING' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#ef4444' }}>
                        Number of Missing Items <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={selectedRequest.quantity}
                        value={returnMissingCount || ''}
                        onChange={(e) => setReturnMissingCount(Math.max(1, Math.min(selectedRequest.quantity, parseInt(e.target.value) || 0)))}
                        placeholder={`Max: ${selectedRequest.quantity}`}
                        style={{ padding: '0.5rem 0.65rem', borderRadius: 7, border: '1px solid #fca5a5', fontSize: '0.82rem', outline: 'none', width: '120px' }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#475569' }}>Item Condition *</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {(['GOOD', 'BAD'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setReturnCondition(opt)}
                          style={{
                            flex: 1,
                            padding: '0.45rem 0.75rem',
                            borderRadius: 7,
                            border: returnCondition === opt
                              ? opt === 'GOOD' ? '2px solid #16a34a' : '2px solid #dc2626'
                              : '1px solid #cbd5e1',
                            backgroundColor: returnCondition === opt
                              ? opt === 'GOOD' ? '#dcfce7' : '#fee2e2'
                              : '#ffffff',
                            color: returnCondition === opt
                              ? opt === 'GOOD' ? '#15803d' : '#b91c1c'
                              : '#64748b',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {opt === 'GOOD' ? '✓ Good' : '✕ Bad / Damaged'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#475569' }}>Remarks</label>
                    <textarea
                      rows={2}
                      placeholder="Any notes about the condition..."
                      value={returnComment}
                      onChange={(e) => setReturnComment(e.target.value)}
                      style={{ padding: '0.5rem', borderRadius: 7, border: '1px solid #cbd5e1', fontSize: '0.8rem', fontFamily: 'inherit' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {(() => {
                      const isNonConsumable = selectedRequest.itemCategory !== 'Consumables';
                      const returnedCount = selectedRequest.quantity - (returnQuantityStatus === 'MISSING' ? returnMissingCount : 0);
                      const isValid = (returnQuantityStatus === 'COMPLETE' || (returnQuantityStatus === 'MISSING' && returnMissingCount > 0)) && (returnQuantityStatus === 'MISSING' || returnedCount === 0 || !isNonConsumable || returnAssetTag.trim() !== '');
                      return (
                        <button
                          onClick={() => {
                            if (!isValid) return;
                            handleReturnRequest(selectedRequest.id, returnQuantityStatus, returnMissingCount, returnCondition, returnComment.trim(), returnAssetTag);
                            setReturnComment('');
                            setReturnQuantityStatus('COMPLETE');
                            setReturnMissingCount(0);
                            setReturnCondition('GOOD');
                            setReturnAssetTag('');
                            setIsDetailDrawerOpen(false);
                          }}
                          disabled={isSubmittingReview || !isValid}
                          style={{
                            padding: '0.5rem 1.25rem',
                            border: 'none',
                            color: '#ffffff',
                            background: isValid ? '#16a34a' : '#cbd5e1',
                            borderRadius: 8,
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: isValid ? 'pointer' : 'not-allowed'
                          }}
                        >
                          {isSubmittingReview ? 'Submitting...' : 'Confirm Return'}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Global Interactive Modal */}
      {globalModal.isOpen && (
        <InteractiveModal
          isOpen={globalModal.isOpen}
          title={globalModal.title}
          message={globalModal.message}
          type={globalModal.type}
          theme={globalModal.theme}
          onConfirm={globalModal.onConfirm}
          onCancel={() => setGlobalModal(prev => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
}
