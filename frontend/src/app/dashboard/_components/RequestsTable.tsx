'use client';

import { useState, useMemo } from 'react';
import { InteractiveModal, ModalType } from '../../../components/ui/InteractiveModal';

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

interface RequestsTableProps {
  allRequests: RequestEntry[];
  sites: Site[];
  canApprove: boolean;
  canRelease: boolean;
  canExport: boolean;
  onReview: (id: string, newStatus: RequestStatus, comment: string) => Promise<void>;
  onRelease: (id: string, assetId: string) => Promise<void>;
  onExport: () => void;
  onReturn?: (req: RequestEntry) => void;
  onRowClick: (req: RequestEntry) => void;
  renderStatusBadge: (status: RequestStatus) => React.ReactNode;
  formatRelativeTime: (dateStr: string) => string;
  currentUserId?: string;
  currentUserRole: string;
  onBulkApprove?: (selectedIds: string[], comment?: string) => Promise<void>;
  onBulkPreparePickup?: (selectedIds: string[]) => Promise<void>;
  onBulkRelease?: (selectedIds: string[]) => Promise<void>;
  onBulkCancel?: (selectedIds: string[], comment?: string) => Promise<void>;
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
  if (text.includes('keyboard') || text.includes('keyboards') || text.includes('kbd') || text.includes('krs-83') || text.includes('krs')) {
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
  if (text.includes('mouse') || text.includes('mice') || text.includes('mou') || text.includes('op-720') || text.includes('ser01') || text.includes('logitech') || text.includes('trackpad') || text.includes('pointer') || text.includes('a4tech-24ser01')) {
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
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
};

export function RequestsTable({
  allRequests,
  sites,
  canApprove,
  canRelease,
  canExport,
  onReview,
  onRelease,
  onExport,
  onReturn,
  onRowClick,
  renderStatusBadge,
  formatRelativeTime,
  currentUserId,
  currentUserRole,
  onBulkApprove,
  onBulkPreparePickup,
  onBulkRelease,
  onBulkCancel
}: RequestsTableProps) {
  const [search, setSearch] = useState('');
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [siteFilter, setSiteFilter] = useState('');
  const [categoryTypeFilter, setCategoryTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Bulk approval state
  const [selectedReqIds, setSelectedReqIds] = useState<string[]>([]);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [isBulkApproveModalOpen, setIsBulkApproveModalOpen] = useState(false);
  const [bulkApproveComment, setBulkApproveComment] = useState('');
  const [bulkApproveError, setBulkApproveError] = useState<string | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<'createdAt' | 'status'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Reject Modal State
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Release Modal State
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [assetIdInput, setAssetIdInput] = useState('');
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [availableAssets, setAvailableAssets] = useState<{ id: string; tagCode: string; barcode: string | null; status: string; serialNumber: string }[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);

  // Confirm Modal State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    type: ModalType;
    theme: 'approve' | 'prepare' | 'danger' | 'info';
    placeholder?: string;
    onConfirm: (val?: string) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    type: 'confirm',
    theme: 'info',
    onConfirm: () => {}
  });



  // Exclude Asset Deployments from Request Orders queue
  const requestOrdersOnly = useMemo(() => {
    return allRequests.filter(r => !(r.reason && r.reason.includes('[ASSET DEPLOYMENT]')));
  }, [allRequests]);

  // Filter logic: Exclude Asset Deployments from Request Orders queue
  const filtered = requestOrdersOnly.filter(r => {

    const matchesSearch =
      r.itemName.toLowerCase().includes(search.toLowerCase()) ||
      r.requestedByName.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      (r.assetTag && r.assetTag.toLowerCase().includes(search.toLowerCase()));

    let matchesStatus = true;
    if (statusFilter === 'PENDING') {
      matchesStatus = r.status === 'PENDING' || r.status === 'PENDING_OPS_APPROVAL';
    } else if (statusFilter === 'PROCESSING') {
      matchesStatus = r.status === 'APPROVED' || r.status === 'PENDING_PROCUREMENT';
    } else if (statusFilter === 'READY') {
      matchesStatus = r.status === 'READY_FOR_PICKUP';
    } else if (statusFilter === 'RELEASED') {
      matchesStatus = r.status === 'RELEASED' || r.status === 'AWAITING_CONFIRMATION';
    } else if (statusFilter === 'COMPLETED') {
      matchesStatus = r.status === 'ITEM_RECEIVED';
    } else if (statusFilter === 'CLOSED') {
      matchesStatus = r.status === 'REJECTED' || r.status === 'RETURNED' || r.status === 'CANCELLED';
    } else if (statusFilter !== 'ALL') {
      matchesStatus = r.status === statusFilter;
    }

    const matchesSite = !siteFilter || r.siteId === siteFilter;

    let matchesCategoryType = true;
    if (categoryTypeFilter === 'CONSUMABLE') {
      matchesCategoryType = r.itemCategory === 'Consumables';
    } else if (categoryTypeFilter === 'NON_CONSUMABLE') {
      matchesCategoryType = r.itemCategory !== 'Consumables';
    }

    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && new Date(r.createdAt) >= new Date(dateFrom);
    }
    if (dateTo) {
      // Inclusive of the end date
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(r.createdAt) <= toDate;
    }

    return matchesSearch && matchesStatus && matchesSite && matchesDate && matchesCategoryType;
  });

  // Sort logic
  const urgencyWeight = { LOW: 1, NORMAL: 2, HIGH: 3, CRITICAL: 4 };
  const statusWeight = { PENDING: 1, PENDING_OPS_APPROVAL: 2, APPROVED: 3, READY_FOR_PICKUP: 4, PENDING_PROCUREMENT: 5, RELEASED: 6, AWAITING_CONFIRMATION: 7, ITEM_RECEIVED: 8, RETURNED: 9, REJECTED: 10, CANCELLED: 11 };
  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'createdAt') {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortField === 'status') {
      comparison = statusWeight[a.status] - statusWeight[b.status];
    }
    return sortDir === 'asc' ? comparison : -comparison;
  });

  // Paginate
  const itemsPerPage = 10;
  const paginated = sorted.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(sorted.length / itemsPerPage);

  // Actionable requests in current filtered view (Pending, Approved, Ready for pickup)
  const actionableRequestsInView = useMemo(() => {
    return filtered.filter(
      r => ['PENDING', 'PENDING_APPROVAL', 'PENDING_OPS_APPROVAL', 'APPROVED', 'READY_FOR_PICKUP'].includes(r.status as string)
    );
  }, [filtered]);

  const selectedRequests = useMemo(() => {
    return allRequests.filter(r => selectedReqIds.includes(r.id));
  }, [allRequests, selectedReqIds]);

  const isAllActionableSelected = actionableRequestsInView.length > 0 &&
    actionableRequestsInView.every(r => selectedReqIds.includes(r.id));

  // Determine if all selected items belong to the same employee
  const singleRequesterName = useMemo(() => {
    if (selectedRequests.length === 0) return null;
    const firstRequester = selectedRequests[0].requestedByName;
    return selectedRequests.every(r => r.requestedByName === firstRequester) ? firstRequester : null;
  }, [selectedRequests]);

  const handleOpenBulkApproveModal = () => {
    if (selectedReqIds.length === 0 || isSubmittingBulk) return;
    setBulkApproveComment('');
    setBulkApproveError(null);
    setIsBulkApproveModalOpen(true);
  };

  const handleConfirmBulkApprove = async () => {
    if (!bulkApproveComment.trim()) {
      setBulkApproveError('An approval comment is required.');
      return;
    }
    if (bulkApproveComment.trim().length < 3) {
      setBulkApproveError('Approval comment must be at least 3 characters.');
      return;
    }
    setIsSubmittingBulk(true);
    try {
      const commentToUse = bulkApproveComment.trim();
      if (onBulkApprove) {
        await onBulkApprove(selectedReqIds, commentToUse);
      } else {
        for (const id of selectedReqIds) {
          const req = allRequests.find(r => r.id === id);
          if (!req) continue;
          let targetStatus: RequestStatus = 'APPROVED';
          if (req.status === 'PENDING' || (req.status as string) === 'PENDING_APPROVAL') {
            targetStatus = (currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN') ? 'APPROVED' : 'PENDING_OPS_APPROVAL';
          }
          await onReview(id, targetStatus, commentToUse);
        }
      }
      setSelectedReqIds([]);
      setIsBulkApproveModalOpen(false);
      setBulkApproveComment('');
    } catch (err) {
      console.error('Error during bulk approve:', err);
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const handleBulkPreparePickupClick = async () => {
    if (selectedReqIds.length === 0 || isSubmittingBulk) return;
    setIsSubmittingBulk(true);
    try {
      if (onBulkPreparePickup) {
        await onBulkPreparePickup(selectedReqIds);
      } else {
        for (const id of selectedReqIds) {
          await onReview(id, 'READY_FOR_PICKUP', 'Bulk staged for pickup');
        }
      }
      setSelectedReqIds([]);
    } catch (err) {
      console.error('Error during bulk prepare pickup:', err);
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const handleBulkReleaseClick = async () => {
    if (selectedReqIds.length === 0 || isSubmittingBulk) return;
    setIsSubmittingBulk(true);
    try {
      if (onBulkRelease) {
        await onBulkRelease(selectedReqIds);
      } else {
        for (const id of selectedReqIds) {
          await onRelease(id, '');
        }
      }
      setSelectedReqIds([]);
    } catch (err) {
      console.error('Error during bulk release:', err);
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const handleBulkCancelClick = async () => {
    if (selectedReqIds.length === 0 || isSubmittingBulk) return;
    setIsSubmittingBulk(true);
    try {
      if (onBulkCancel) {
        await onBulkCancel(selectedReqIds, 'Bulk cancelled');
      } else {
        for (const id of selectedReqIds) {
          await onReview(id, 'REJECTED', 'Bulk cancelled');
        }
      }
      setSelectedReqIds([]);
    } catch (err) {
      console.error('Error during bulk cancel:', err);
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const toggleSort = (field: 'createdAt' | 'status') => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const renderSortIndicator = (field: 'createdAt' | 'status') => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  const handleApprove = async (id: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Approve Request',
      message: 'Are you sure you want to approve this request?',
      confirmText: 'Approve',
      type: 'confirm',
      theme: 'approve',
      onConfirm: async () => {
        await onReview(id, 'APPROVED', '');
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleOpenReject = (id: string) => {
    setRejectingId(id);
    setRejectComment('');
    setRejectError(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectComment.trim()) {
      setRejectError('A comment is required when rejecting.');
      return;
    }
    if (rejectComment.trim().length < 10) {
      setRejectError('Reject comment must be at least 10 characters.');
      return;
    }
    if (rejectingId) {
      await onReview(rejectingId, 'REJECTED', rejectComment.trim());
      setRejectingId(null);
      setRejectComment('');
    }
  };

  const handleOpenRelease = async (id: string) => {
    setReleasingId(id);
    setAssetIdInput('');
    setReleaseError(null);
    setAvailableAssets([]);
    
    const req = allRequests.find(r => r.id === id);
    if (req) {
      if (req.itemCategory === 'Consumables') {
        return;
      }
      setIsLoadingAssets(true);
      try {
        const res = await fetch(`http://localhost:3001/items/${req.itemId}/assets`);
        if (res.ok) {
          const data = await res.json();
          // Filter for AVAILABLE assets — prefer assets at the request's site, fall back to any site
          const allAvailable = data.filter((a: any) => a.status === 'AVAILABLE');
          const siteAvailable = req.siteId
            ? allAvailable.filter((a: any) => a.siteId === req.siteId)
            : allAvailable;
          // Use site-specific ones if they exist, otherwise fall back to any available
          const available = siteAvailable.length > 0 ? siteAvailable : allAvailable;
          setAvailableAssets(available);
          if (available.length > 0) {
            setAssetIdInput(available[0].tagCode);
          }
        }
      } catch (err) {
        console.error('Failed to fetch available assets:', err);
      } finally {
        setIsLoadingAssets(false);
      }
    }
  };


  const handleConfirmRelease = async () => {
    if (releasingId) {
      await onRelease(releasingId, assetIdInput.trim());
      setReleasingId(null);
      setAssetIdInput('');
    }
  };



  const handleExportClick = () => {
    // Only exports currently filtered rows
    const headers = ["Request ID", "Item", "Category", "Requested By", "Role", "Department", "Quantity", "Status", "Site", "Submitted", "Review Comment"];
    const rows = sorted.map(r => [
      r.id,
      r.itemName,
      r.itemCategory || "",
      r.requestedByName,
      r.requestedByRole || "",
      r.requestedByDepartment || "",
      r.quantity,
      r.status,
      r.siteName || "",
      r.createdAt,
      r.reviewComment || ""
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "RequestLog_Salivio.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

    // If it's a non-consumable (has a known category like Laptops, Accessories)
    // we want to display the generic category name rather than the specific model
    if (req.itemCategory && req.itemCategory !== 'Consumables') {
      const cat = req.itemCategory;
      if (cat === 'Laptops') return 'Laptop';
      if (cat === 'Accessories') return 'Accessory';
      if (cat === 'Accessories') return 'Accessory';
      return cat;
    }
    // For consumables or uncategorized items, display the original itemName
    return req.itemName;
  };

  const getSitePrefix = (siteId?: string) => {
    const site = sites.find(s => s.id === siteId);
    return site ? site.prefix : '';
  };

  const renderPrefixBadge = (siteId?: string) => {
    const prefix = getSitePrefix(siteId);
    if (!prefix) return null;
    return (
      <span style={{
        fontSize: '0.6rem',
        padding: '0.15rem 0.35rem',
        backgroundColor: '#f5f3ff',
        color: '#3730a3',
        borderRadius: '4px',
        fontWeight: 700,
        letterSpacing: '0.02em'
      }}>
        {prefix}
      </span>
    );
  };

  const groupedCounts = {
    ALL: requestOrdersOnly.length,
    PENDING: requestOrdersOnly.filter(r => ['PENDING', 'PENDING_OPS_APPROVAL'].includes(r.status)).length,
    PROCESSING: requestOrdersOnly.filter(r => ['APPROVED', 'PENDING_PROCUREMENT'].includes(r.status)).length,
    READY: requestOrdersOnly.filter(r => ['READY_FOR_PICKUP'].includes(r.status)).length,
    RELEASED: requestOrdersOnly.filter(r => ['RELEASED', 'AWAITING_CONFIRMATION'].includes(r.status)).length,
    COMPLETED: requestOrdersOnly.filter(r => ['ITEM_RECEIVED'].includes(r.status)).length,
    CLOSED: requestOrdersOnly.filter(r => ['REJECTED', 'RETURNED', 'CANCELLED'].includes(r.status)).length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <style>{`
        @keyframes slideFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animated-row {
          animation: slideFadeIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }
        .search-focus:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
        }
        .table-row-hover:hover {
          background-color: #f1f5f9 !important;
        }
      `}</style>

      {/* Overview Top Panel */}
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
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isOverviewExpanded ? '1rem' : '0', transition: 'margin-bottom 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Request Overview</h3>
            {!isOverviewExpanded && <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>(Hover to expand)</span>}
          </div>
          {!isOverviewExpanded && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 1, animation: 'fadeIn 0.3s ease-in' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Active Filter:</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#210cae', backgroundColor: 'rgba(33, 12, 174, 0.05)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                {statusFilter === 'ALL' ? 'All Requests' : statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase()}
              </span>
            </div>
          )}
        </div>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '0.75rem',
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
            const isActive = statusFilter === s.id;
            const count = groupedCounts[s.id as keyof typeof groupedCounts] || 0;
            const itemColor = isActive ? s.color : '#64748b';
            const itemBg = isActive ? s.bg : '#fcfcfc';
            const hoverBg = isActive ? s.bg : '#f8fafc';
            const borderColor = isActive ? s.color : '#f1f5f9';

            return (
              <div 
                key={s.id}
                onClick={() => { setStatusFilter(s.id as any); setPage(1); }}
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
                  const iconSvg = e.currentTarget.querySelector('svg') as unknown as HTMLElement;
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
                  const iconSvg = e.currentTarget.querySelector('svg') as unknown as HTMLElement;
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

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
        {/* Filter Bar Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', backgroundColor: '#ffffff', padding: '1rem', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(15,23,42,0.02)' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            className="search-focus search-glow"
            placeholder="Search item, requester, or asset tag..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '100%', padding: '0.45rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none' }}
          />
        </div>


        {/* Site */}
        <select
          value={siteFilter}
          onChange={(e) => { setSiteFilter(e.target.value); setPage(1); }}
          style={{ padding: '0.45rem 1.5rem 0.45rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.8rem', color: '#475569', backgroundColor: '#ffffff' }}
        >
          <option value="">All Sites</option>
          {sites.map(site => (
            <option key={site.id} value={site.id}>{site.name}</option>
          ))}
        </select>

        {/* Asset Type (Consumable / Non-Consumable) */}
        <select
          value={categoryTypeFilter}
          onChange={(e) => { setCategoryTypeFilter(e.target.value); setPage(1); }}
          style={{ padding: '0.45rem 1.5rem 0.45rem 0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.8rem', color: '#475569', backgroundColor: '#ffffff' }}
        >
          <option value="">All Asset Types</option>
          <option value="CONSUMABLE">Consumable</option>
          <option value="NON_CONSUMABLE">Non-Consumable</option>
        </select>

        {/* Date From */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            style={{ padding: '0.35rem 0.5rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.8rem', color: '#475569' }}
          />
        </div>

        {/* Date To */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            style={{ padding: '0.35rem 0.5rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.8rem', color: '#475569' }}
          />
        </div>

        {/* Export CSV (Admin Only guarded or standard conditionally shown) */}
        {canExport && (
          <button
            onClick={handleExportClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 1rem',
              borderRadius: 8,
              border: 'none',
              background: '#0f172a',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginLeft: 'auto',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 2px 4px rgba(15, 23, 42, 0.15)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(15, 23, 42, 0.25)';
              e.currentTarget.style.background = '#1e293b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(15, 23, 42, 0.15)';
              e.currentTarget.style.background = '#0f172a';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Export CSV
          </button>
        )}
      </div>

      {/* Bulk Approval Banner */}
      {selectedReqIds.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '0.85rem 1.25rem',
            borderRadius: 12,
            border: '1px solid #334155',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
            animation: 'slideFadeIn 0.3s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, backgroundColor: '#3b82f6', color: '#ffffff', padding: '0.3rem 0.65rem', borderRadius: '6px' }}>
              ⚡ {selectedReqIds.length} Request{selectedReqIds.length > 1 ? 's' : ''} Selected
            </span>

            {singleRequesterName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: '#38bdf8' }}>
                <span>👤 Requested by:</span>
                <span style={{ color: '#ffffff', fontWeight: 700, backgroundColor: '#1e293b', padding: '0.2rem 0.55rem', borderRadius: '4px', border: '1px solid #334155' }}>
                  {singleRequesterName}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>({selectedReqIds.length} item{selectedReqIds.length > 1 ? 's' : ''})</span>
              </div>
            ) : (
              <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                👥 Across multiple employees ({selectedReqIds.length} items)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {canApprove && selectedRequests.some(r => ['PENDING', 'PENDING_APPROVAL', 'PENDING_OPS_APPROVAL'].includes(r.status as string)) && (
              <button
                onClick={handleOpenBulkApproveModal}
                disabled={isSubmittingBulk}
                style={{
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.45rem 0.95rem',
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
                {isSubmittingBulk ? 'Processing...' : `✅ Bulk Approve`}
              </button>
            )}

            {canApprove && selectedRequests.some(r => ['APPROVED', 'PENDING', 'PENDING_APPROVAL', 'PENDING_OPS_APPROVAL'].includes(r.status as string)) && (
              <button
                onClick={handleBulkPreparePickupClick}
                disabled={isSubmittingBulk}
                style={{
                  backgroundColor: '#7c3aed',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: isSubmittingBulk ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 2px 6px rgba(124, 58, 237, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isSubmittingBulk ? 'Processing...' : `📦 Prepare Pickup`}
              </button>
            )}

            {canRelease && selectedRequests.some(r => ['READY_FOR_PICKUP', 'APPROVED'].includes(r.status as string)) && (
              <button
                onClick={handleBulkReleaseClick}
                disabled={isSubmittingBulk}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: isSubmittingBulk ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isSubmittingBulk ? 'Processing...' : `🚀 Bulk Release`}
              </button>
            )}

            <button
              onClick={() => setSelectedReqIds([])}
              style={{
                backgroundColor: 'transparent',
                color: '#94a3b8',
                border: '1px solid #475569',
                borderRadius: 8,
                padding: '0.45rem 0.75rem',
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

      {/* Main requests table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 2px 10px rgba(15,23,42,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', textTransform: 'uppercase' }}>
              {canApprove && (
                <th style={{ width: '40px', padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isAllActionableSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedReqIds(actionableRequestsInView.map(r => r.id));
                      } else {
                        setSelectedReqIds([]);
                      }
                    }}
                    style={{ cursor: 'pointer', accentColor: '#3b82f6', width: '16px', height: '16px' }}
                    title="Select all active requests"
                  />
                </th>
              )}
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textAlign: 'left', width: '110px' }}>Request ID</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textAlign: 'left' }}>Item Catalog</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textAlign: 'left' }}>Requested By</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textAlign: 'center', width: '70px' }}>Qty</th>

              <th onClick={() => toggleSort('status')} style={{ padding: '0.85rem 1rem', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textAlign: 'left', cursor: 'pointer', userSelect: 'none', width: '120px' }}>
                Status{renderSortIndicator('status')}
              </th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textAlign: 'left' }}>Site</th>
              <th onClick={() => toggleSort('createdAt')} style={{ padding: '0.85rem 1rem', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textAlign: 'left', cursor: 'pointer', userSelect: 'none', width: '135px' }}>
                Submitted{renderSortIndicator('createdAt')}
              </th>
              {(currentUserRole === 'ADMIN' || currentUserRole === 'INVENTORY_STAFF') && (
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textAlign: 'center', width: '150px' }}>Fulfillment</th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={canApprove ? (currentUserRole === 'ADMIN' || currentUserRole === 'INVENTORY_STAFF' ? 9 : 8) : (currentUserRole === 'ADMIN' || currentUserRole === 'INVENTORY_STAFF' ? 8 : 7)} style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', animation: 'slideFadeIn 0.4s ease-out forwards' }}>
                    <div style={{ padding: '1.25rem', backgroundColor: '#f1f5f9', borderRadius: '50%', boxShadow: '0 4px 10px rgba(15,23,42,0.03)' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>No requests found</p>
                      <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.8rem', color: '#64748b', maxWidth: '300px' }}>
                        We couldn't find any requests matching your current filters. Try adjusting your search.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : paginated.map((req, index) => (
              <tr
                className="animated-row"
                key={req.id}
                onClick={() => onRowClick(req)}
                style={{ 
                  borderBottom: '1px solid #e2e8f0', 
                  backgroundColor: selectedReqIds.includes(req.id) ? '#f0f9ff' : 'transparent',
                  cursor: 'pointer', 
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  animationDelay: `${index * 0.04}s` 
                }}
                onMouseEnter={(e) => {
                  if (!selectedReqIds.includes(req.id)) e.currentTarget.style.backgroundColor = '#f1f5f9';
                  const iconSpan = e.currentTarget.querySelector('.item-icon') as HTMLElement;
                  if (iconSpan) {
                    iconSpan.style.transform = 'scale(1.2) rotate(-5deg)';
                    iconSpan.style.color = '#3b82f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedReqIds.includes(req.id)) e.currentTarget.style.backgroundColor = 'transparent';
                  const iconSpan = e.currentTarget.querySelector('.item-icon') as HTMLElement;
                  if (iconSpan) {
                    iconSpan.style.transform = 'scale(1) rotate(0deg)';
                    iconSpan.style.color = '#64748b';
                  }
                }}
              >
                {canApprove && (
                  <td onClick={(e) => e.stopPropagation()} style={{ width: '40px', padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                    {['PENDING', 'PENDING_APPROVAL', 'PENDING_OPS_APPROVAL', 'APPROVED', 'READY_FOR_PICKUP'].includes(req.status as string) ? (
                      <input
                        type="checkbox"
                        checked={selectedReqIds.includes(req.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            setSelectedReqIds(prev => [...prev, req.id]);
                          } else {
                            setSelectedReqIds(prev => prev.filter(id => id !== req.id));
                          }
                        }}
                        style={{ cursor: 'pointer', accentColor: '#3b82f6', width: '16px', height: '16px' }}
                      />
                    ) : null}
                  </td>
                )}
                <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#334155',
                    backgroundColor: '#f1f5f9',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease'
                  }}>
                    {req.id.substring(0, 10)}
                  </span>
                </td>
                <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                    <span className="item-icon" style={{ color: '#64748b', display: 'flex', alignItems: 'center', marginTop: '0.1rem', transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                      {getCategoryIcon(req.itemCategory, req.itemName)}
                    </span>
                    <div>
                      <div>{getDisplayName(req)}</div>
                      {req.status !== 'RELEASED' && req.assetTag ? (
                        <span style={{ display: 'inline-block', fontSize: '0.68rem', background: '#e0f2fe', padding: '0.1rem 0.4rem', borderRadius: 4, color: '#0369a1', marginTop: '0.25rem', fontWeight: 600 }}>
                          Asset Tag: {req.assetTag}
                        </span>
                      ) : req.status !== 'RELEASED' && req.assetId ? (
                        <span style={{ display: 'inline-block', fontSize: '0.68rem', background: '#e0f2fe', padding: '0.1rem 0.4rem', borderRadius: 4, color: '#0369a1', marginTop: '0.25rem', fontWeight: 600 }}>
                          Asset ID: {req.assetId}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#334155', whiteSpace: 'nowrap' }}>
                  <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {renderPrefixBadge(req.requestedBySiteId)}
                    <span>{req.requestedByName}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', marginTop: '0.2rem' }}>
                    {req.requestedByRole && (
                      <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        {req.requestedByRole.replace('_', ' ')}
                      </span>
                    )}
                    {req.requestedByDepartment && (
                      <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        {req.requestedByDepartment}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#0f172a', textAlign: 'center', fontWeight: 600 }}>
                  {req.quantity}
                </td>

                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
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
                </td>
                <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#475569' }}>
                  {sites.find(s => s.id === req.siteId)?.name || req.siteName || '—'}
                </td>
                <td style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: '#64748b' }} title={new Date(req.createdAt).toLocaleString()}>
                  {formatRelativeTime(req.createdAt)}
                </td>
                {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' || currentUserRole === 'INVENTORY_STAFF') && (
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    {req.status === 'PENDING' && (currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' || currentUserRole === 'INVENTORY_STAFF') ? (
                      req.requestedById === currentUserId ? (
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          Self-request
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              setConfirmState({
                                isOpen: true,
                                title: 'Approve Request',
                                message: 'Are you sure you want to approve this request?',
                                confirmText: 'Approve',
                                type: 'confirm',
                                theme: 'approve',
                                onConfirm: async () => {
                                  await onReview(req.id, 'PENDING_OPS_APPROVAL', '');
                                  setConfirmState(prev => ({ ...prev, isOpen: false }));
                                }
                              });
                            }}
                            style={{
                              fontSize: '0.72rem',
                              color: '#ea580c',
                              fontWeight: 600,
                              backgroundColor: '#ffffff',
                              border: '1px solid #fed7aa',
                              padding: '0.25rem 0.5rem',
                              borderRadius: 4,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fff7ed'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenReject(req.id)}
                            style={{
                              fontSize: '0.72rem',
                              color: '#dc2626',
                              fontWeight: 600,
                              backgroundColor: '#ffffff',
                              border: '1px solid #fecaca',
                              padding: '0.25rem 0.5rem',
                              borderRadius: 4,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                          >
                            Reject
                          </button>
                        </div>
                      )
                    ) : req.status === 'PENDING_OPS_APPROVAL' && (currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' || currentUserRole === 'INVENTORY_STAFF') ? (
                      req.staffApprovedById === currentUserId ? (
                        <span style={{ fontSize: '0.72rem', color: '#dc2626', fontStyle: 'italic', fontWeight: 500 }} title="Separation of duties">
                          Staff approver
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              setConfirmState({
                                isOpen: true,
                                title: 'Ops Manager Approval',
                                message: 'Please provide an approval remark (required):',
                                placeholder: 'Remark...',
                                confirmText: 'Approve',
                                type: 'prompt',
                                theme: 'approve',
                                onConfirm: async (val) => {
                                  if (!val || !val.trim()) {
                                    setConfirmState({
                                      isOpen: true,
                                      title: 'Action Required',
                                      message: 'A remark is required to approve this request.',
                                      confirmText: 'OK',
                                      type: 'alert',
                                      theme: 'danger',
                                      onConfirm: () => setConfirmState(prev => ({ ...prev, isOpen: false }))
                                    });
                                    return;
                                  }
                                  await onReview(req.id, 'APPROVED', val.trim());
                                  setConfirmState(prev => ({ ...prev, isOpen: false }));
                                }
                              });
                            }}
                            style={{
                              fontSize: '0.72rem',
                              color: '#16a34a',
                              fontWeight: 600,
                              backgroundColor: '#ffffff',
                              border: '1px solid #bbf7d0',
                              padding: '0.25rem 0.5rem',
                              borderRadius: 4,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0fdf4'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                          >
                            Approve Ops
                          </button>
                          <button
                            onClick={() => handleOpenReject(req.id)}
                            style={{
                              fontSize: '0.72rem',
                              color: '#dc2626',
                              fontWeight: 600,
                              backgroundColor: '#ffffff',
                              border: '1px solid #fecaca',
                              padding: '0.25rem 0.5rem',
                              borderRadius: 4,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                          >
                            Reject
                          </button>
                        </div>
                      )
                    ) : req.status === 'APPROVED' && (currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' || currentUserRole === 'INVENTORY_STAFF') ? (
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button
                          onClick={() => {
                            setConfirmState({
                              isOpen: true,
                              title: 'Prepare Pickup',
                              message: 'Mark this request as Ready for Pickup?',
                              confirmText: 'Prepare Pickup',
                              type: 'confirm',
                              theme: 'prepare',
                              onConfirm: async () => {
                                await onReview(req.id, 'READY_FOR_PICKUP', '');
                                setConfirmState(prev => ({ ...prev, isOpen: false }));
                              }
                            });
                          }}
                          style={{
                            fontSize: '0.72rem',
                            color: '#475569',
                            fontWeight: 600,
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            padding: '0.25rem 0.5rem',
                            borderRadius: 4,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                        >
                          Prepare Pickup
                        </button>
                      </div>
                    ) : req.status === 'READY_FOR_PICKUP' && (currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' || currentUserRole === 'INVENTORY_STAFF') ? (
                      req.requestedById === currentUserId ? (
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          Self-request
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenRelease(req.id)}
                            style={{
                              fontSize: '0.72rem',
                              color: '#0284c7',
                              fontWeight: 600,
                              backgroundColor: '#ffffff',
                              border: '1px solid #bae6fd',
                              padding: '0.25rem 0.5rem',
                              borderRadius: 4,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f9ff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                          >
                            Release
                          </button>
                          <button
                            onClick={() => onRowClick(req)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#E85D00'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                          >
                            View →
                          </button>
                        </div>
                      )
                    ) : req.status !== 'RETURNED' && (req.status === 'RELEASED' || req.status === 'ITEM_RECEIVED' || (req.reason && req.reason.includes('[ASSET DEPLOYMENT]'))) && (currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' || currentUserRole === 'INVENTORY_STAFF') ? (
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => onReturn && onReturn(req)}
                            style={{
                              fontSize: '0.72rem',
                              color: '#059669',
                              fontWeight: 600,
                              backgroundColor: '#ffffff',
                              border: '1px solid #a7f3d0',
                              padding: '0.25rem 0.5rem',
                              borderRadius: 4,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ecfdf5'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
                          >
                            Return
                          </button>
                          <button
                            onClick={() => onRowClick(req)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#E85D00'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                          >
                            View →
                          </button>
                        </div>
                    ) : (
                      <button
                        onClick={() => onRowClick(req)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#E85D00'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                      >
                        View Drawer →
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Showing {((page - 1) * itemsPerPage) + 1}–{Math.min(page * itemsPerPage, sorted.length)} of {sorted.length} entries
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                style={{ padding: '0.35rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, background: '#ffffff', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                style={{ padding: '0.35rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: 6, background: '#ffffff', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Comment Dialog Box Modal */}
      {rejectingId && (
        <div
          onClick={() => setRejectingId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15,23,42,0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 1600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: '#ffffff',
              borderRadius: 12,
              padding: '1.25rem',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Reason for Rejection</h3>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>Provide a reason why this request is being rejected.</p>
            </div>

            {rejectError && (
              <div style={{ fontSize: '0.75rem', color: '#b91c1c', padding: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>
                ⚠ {rejectError}
              </div>
            )}

            <textarea
              rows={3}
              placeholder="Min 10 characters explanation..."
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.65rem',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={() => setRejectingId(null)}
                style={{ padding: '0.4rem 0.85rem', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                style={{ padding: '0.4rem 1rem', border: 'none', backgroundColor: '#dc2626', color: '#ffffff', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Release Item Modal */}
      {releasingId && (() => {
        const releasingRequest = allRequests.find(r => r.id === releasingId);
        const isConsumable = releasingRequest?.itemCategory === 'Consumables';
        return (
        <div
          onClick={() => setReleasingId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15,23,42,0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 1600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '400px',
              backgroundColor: '#ffffff',
              borderRadius: 12,
              padding: '1.25rem',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Release Item</h3>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Confirm physical release of the requested item.
              </p>
            </div>

            {releaseError && (
              <div style={{ fontSize: '0.75rem', color: '#b91c1c', padding: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>
                ⚠ {releaseError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
              {isConsumable ? (
                <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#16a34a', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Consumable Item (No Asset Tag Required)
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#14532d' }}>
                    {releasingRequest?.itemName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.15rem' }}>
                    This item will be released directly without serialized tracking.
                  </div>
                </div>
              ) : isLoadingAssets ? (
                <div style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                  Loading automatically selected asset tag...
                </div>
              ) : availableAssets.length === 0 ? (
                <div style={{ padding: '0.75rem', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#c2410c', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Auto-generated Asset Tag
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#9a3412' }}>
                    New Asset Tag will be generated
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.15rem' }}>
                    No pre-registered assets found in catalog. A new tag code will be created on release.
                  </div>
                </div>
              ) : (
                <div style={{ padding: '0.75rem', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0369a1', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Auto-selected Asset Tag
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0c4a6e' }}>
                    {availableAssets[0].tagCode}
                  </div>
                  {availableAssets[0].serialNumber && (
                    <div style={{ fontSize: '0.75rem', color: '#0284c7', marginTop: '0.15rem' }}>
                      Serial Number: {availableAssets[0].serialNumber}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => setReleasingId(null)}
                style={{ padding: '0.4rem 0.85rem', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                disabled={isLoadingAssets}
                onClick={handleConfirmRelease}
                style={{
                  padding: '0.4rem 1rem',
                  border: 'none',
                  backgroundColor: isLoadingAssets ? '#cbd5e1' : '#0284c7',
                  color: '#ffffff',
                  borderRadius: 6,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: isLoadingAssets ? 'not-allowed' : 'pointer'
                }}
              >
                Confirm Release
              </button>
            </div>
          </div>
        </div>
        );
      })()}


      {/* Bulk Approval Interactive Modal */}
      <InteractiveModal
        isOpen={isBulkApproveModalOpen}
        type="prompt"
        title="Bulk Approve Request Orders"
        message={`You are approving ${selectedReqIds.length} selected request(s). Please provide an approval comment.`}
        placeholder="Enter approval comment (e.g., Approved for deployment by Ops Admin)..."
        confirmText={isSubmittingBulk ? "Approving..." : `Approve ${selectedReqIds.length} Request(s)`}
        theme="approve"
        onConfirm={async (val) => {
          const comment = (val || '').trim();
          if (!comment) {
            return;
          }
          setIsSubmittingBulk(true);
          try {
            if (onBulkApprove) {
              await onBulkApprove(selectedReqIds, comment);
            } else {
              for (const id of selectedReqIds) {
                const req = allRequests.find(r => r.id === id);
                if (!req) continue;
                let targetStatus: RequestStatus = 'APPROVED';
                if (req.status === 'PENDING' || (req.status as string) === 'PENDING_APPROVAL') {
                  targetStatus = (currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN') ? 'APPROVED' : 'PENDING_OPS_APPROVAL';
                }
                await onReview(id, targetStatus, comment);
              }
            }
            setSelectedReqIds([]);
            setIsBulkApproveModalOpen(false);
            setBulkApproveComment('');
          } catch (err) {
            console.error('Error during bulk approve:', err);
          } finally {
            setIsSubmittingBulk(false);
          }
        }}
        onCancel={() => {
          setIsBulkApproveModalOpen(false);
          setBulkApproveComment('');
          setBulkApproveError(null);
        }}
      />

      {/* Animated Confirm Modal */}
      <InteractiveModal
        isOpen={confirmState.isOpen}
        type={confirmState.type}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        theme={confirmState.theme}
        placeholder={confirmState.placeholder}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
      </div>
    </div>
  );
}
