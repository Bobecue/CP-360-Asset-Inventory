'use client';

import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import { InteractiveModal, ModalType } from '../../../components/ui/InteractiveModal';
import { confirmReceipt, bulkConfirmReceiptApi, bulkReturnApi } from '../../../lib/services/requestService';

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
  onBulkConfirmReceipt?: (selectedIds: string[]) => Promise<void>;
  onBulkReturn?: (selectedIds: string[]) => Promise<void>;
}

import { getCategoryIcon, getDepartmentIcon, RoleBadge, SiteBadge, EidBadge, AssetTagBadge } from '@/types/dashboard';

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
  onBulkCancel,
  onBulkConfirmReceipt,
  onBulkReturn
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
  const [isBulkConfirmReceiptModalOpen, setIsBulkConfirmReceiptModalOpen] = useState(false);
  const [isBulkReturnModalOpen, setIsBulkReturnModalOpen] = useState(false);
  const [bulkReturnComment, setBulkReturnComment] = useState('');
  const [bulkReturnError, setBulkReturnError] = useState<string | null>(null);

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
    required?: boolean;
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

  const [selectedGroupModal, setSelectedGroupModal] = useState<any | null>(null);

  const getFormattedRequestId = (req: RequestEntry) => {
    const rawId = req.id || '';
    const digits = rawId.replace(/\D/g, '');
    if (digits.length > 0) {
      return `GRP-${digits.padStart(4, '0').slice(-4)}`;
    }
    const cleanStr = rawId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(-5);
    return `GRP-${cleanStr}`;
  };

  // Exclude Asset Deployments from Request Orders queue
  const requestOrdersOnly = useMemo(() => {
    return allRequests.filter(r => !(r.reason && r.reason.includes('[ASSET DEPLOYMENT]')));
  }, [allRequests]);

  // 1. Group request orders chronologically (made at the same time by same custodian)
  const allGroupedRequests = useMemo(() => {
    const groups: any[] = [];
    const sorted = [...requestOrdersOnly].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    sorted.forEach((req: RequestEntry) => {
      const reqTime = new Date(req.createdAt).getTime();
      
      // Find an existing group for this user where the time difference is less than 15 seconds
      const group = groups.find(g => 
        g.requestedById === req.requestedById && 
        Math.abs(new Date(g.latestCreatedAt).getTime() - reqTime) < 15000
      );

      if (group) {
        group.items.push(req);
        
        if (req.status === 'PENDING_OPS_APPROVAL') {
          group.pendingOpsCount++;
          group.pendingCount++;
        } else if (['PENDING', 'PENDING_APPROVAL'].includes(req.status)) {
          group.pendingStaffCount++;
          group.pendingCount++;
        } else if (req.status === 'PENDING_PROCUREMENT') {
          group.pendingProcurementCount++;
        } else if (req.status === 'APPROVED') {
          group.approvedCount++;
        } else if (['READY_FOR_PICKUP'].includes(req.status)) {
          group.readyCount++;
        } else if (['RELEASED', 'AWAITING_CONFIRMATION'].includes(req.status)) {
          group.releasedCount++;
        } else if (req.status === 'ITEM_RECEIVED') {
          group.itemReceivedCount++;
        } else if (req.status === 'RETURNED') {
          group.returnedCount++;
        } else if (req.status === 'REJECTED') {
          group.rejectedCount++;
        } else if (req.status === 'CANCELLED') {
          group.cancelledCount++;
        } else {
          group.otherCount++;
        }
        
        if (new Date(req.createdAt) > new Date(group.latestCreatedAt)) {
          group.latestCreatedAt = req.createdAt;
        }
      } else {
        const newGroup = {
          key: `${req.id}___${req.requestedById}___${req.createdAt}`,
          requestedByName: req.requestedByName || "N/A",
          requestedById: req.requestedById || "N/A",
          requestedByRole: req.requestedByRole || "STAFF",
          requestedByDepartment: req.requestedByDepartment || "General",
          siteName: req.siteName || "Cebu IT Park",
          latestCreatedAt: req.createdAt,
          groupRequestId: getFormattedRequestId(req),
          items: [req],
          pendingCount: 0,
          pendingOpsCount: 0,
          pendingStaffCount: 0,
          approvedCount: 0,
          pendingProcurementCount: 0,
          readyCount: 0,
          releasedCount: 0,
          itemReceivedCount: 0,
          returnedCount: 0,
          rejectedCount: 0,
          cancelledCount: 0,
          otherCount: 0,
        };

        if (req.status === 'PENDING_OPS_APPROVAL') {
          newGroup.pendingOpsCount++;
          newGroup.pendingCount++;
        } else if (['PENDING', 'PENDING_APPROVAL'].includes(req.status)) {
          newGroup.pendingStaffCount++;
          newGroup.pendingCount++;
        } else if (req.status === 'PENDING_PROCUREMENT') {
          newGroup.pendingProcurementCount++;
        } else if (req.status === 'APPROVED') {
          newGroup.approvedCount++;
        } else if (['READY_FOR_PICKUP'].includes(req.status)) {
          newGroup.readyCount++;
        } else if (['RELEASED', 'AWAITING_CONFIRMATION'].includes(req.status)) {
          newGroup.releasedCount++;
        } else if (req.status === 'ITEM_RECEIVED') {
          newGroup.itemReceivedCount++;
        } else if (req.status === 'RETURNED') {
          newGroup.returnedCount++;
        } else if (req.status === 'REJECTED') {
          newGroup.rejectedCount++;
        } else if (req.status === 'CANCELLED') {
          newGroup.cancelledCount++;
        } else {
          newGroup.otherCount++;
        }

        groups.push(newGroup);
      }
    });

    return groups;
  }, [requestOrdersOnly]);

  // 2. Filter groups based on search, site, status, category, date filters
  const groupedRequests = useMemo(() => {
    const searchLower = search.toLowerCase().trim();

    return allGroupedRequests.filter(group => {
      // Check search match
      const groupReqIdLower = group.groupRequestId.toLowerCase();
      const matchesSearch = !searchLower ||
        groupReqIdLower.includes(searchLower) ||
        group.requestedByName.toLowerCase().includes(searchLower) ||
        group.requestedByDepartment.toLowerCase().includes(searchLower) ||
        group.requestedByRole.toLowerCase().includes(searchLower) ||
        group.items.some(r =>
          (r.id || '').toLowerCase().includes(searchLower) ||
          r.itemName.toLowerCase().includes(searchLower) ||
          (r.assetTag && r.assetTag.toLowerCase().includes(searchLower))
        );

      // Check site match
      const matchesSite = !siteFilter || group.items.some(r => r.siteId === siteFilter);

      // Check status match
      let matchesStatus = true;
      if (statusFilter === 'PENDING') {
        matchesStatus = group.pendingCount > 0;
      } else if (statusFilter === 'PROCESSING') {
        matchesStatus = group.approvedCount > 0;
      } else if (statusFilter === 'READY') {
        matchesStatus = group.readyCount > 0;
      } else if (statusFilter === 'RELEASED') {
        matchesStatus = group.releasedCount > 0;
      } else if (statusFilter === 'CLOSED') {
        matchesStatus = group.otherCount > 0;
      } else if (statusFilter !== 'ALL') {
        matchesStatus = group.items.some(r => r.status === statusFilter);
      }

      // Check category match
      let matchesCategoryType = true;
      if (categoryTypeFilter === 'CONSUMABLE') {
        matchesCategoryType = group.items.some(r => r.itemCategory === 'Consumables');
      } else if (categoryTypeFilter === 'NON_CONSUMABLE') {
        matchesCategoryType = group.items.some(r => r.itemCategory !== 'Consumables');
      }

      // Check date match
      let matchesDate = true;
      if (dateFrom) {
        matchesDate = matchesDate && group.items.some(r => new Date(r.createdAt) >= new Date(dateFrom));
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && group.items.some(r => new Date(r.createdAt) <= toDate);
      }

      return matchesSearch && matchesSite && matchesStatus && matchesCategoryType && matchesDate;
    });
  }, [allGroupedRequests, search, siteFilter, statusFilter, categoryTypeFilter, dateFrom, dateTo]);

  const [expandedGroupKeys, setExpandedGroupKeys] = useState<Record<string, boolean>>({});

  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroupKeys(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const itemsPerPage = 10;
  const totalPages = Math.ceil(groupedRequests.length / itemsPerPage);

  const selectedRequests = useMemo(() => {
    return allRequests.filter(r => selectedReqIds.includes(r.id));
  }, [allRequests, selectedReqIds]);

  const singleRequesterName = useMemo(() => {
    if (selectedRequests.length === 0) return null;
    const firstRequester = selectedRequests[0].requestedByName;
    return selectedRequests.every(r => r.requestedByName === firstRequester) ? firstRequester : null;
  }, [selectedRequests]);

  const actionableRequestsInView = useMemo(() => {
    return requestOrdersOnly.filter(
      r => ['PENDING', 'PENDING_APPROVAL', 'PENDING_OPS_APPROVAL', 'APPROVED', 'READY_FOR_PICKUP', 'PENDING_PROCUREMENT', 'AWAITING_CONFIRMATION', 'RELEASED', 'ITEM_RECEIVED'].includes(r.status as string) &&
           !(['PENDING', 'PENDING_APPROVAL', 'PENDING_OPS_APPROVAL'].includes(r.status as string) && r.requestedById === currentUserId)
    );
  }, [requestOrdersOnly, currentUserId]);

  const isAllActionableSelected = actionableRequestsInView.length > 0 &&
    actionableRequestsInView.every((r: any) => selectedReqIds.includes(r.id));

  const handleToggleExpandAll = () => {
    const hasUnexpanded = groupedRequests.some(g => g.items.length > 1 && !expandedGroupKeys[g.key]);
    const newMap: Record<string, boolean> = {};
    groupedRequests.forEach(g => {
      if (g.items.length > 1) {
        newMap[g.key] = hasUnexpanded;
      }
    });
    setExpandedGroupKeys(newMap);
  };

  const handleDownloadGroupRequestReceipt = async (group: any) => {
    const items: RequestEntry[] = group.items || [];
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Header Banner
    doc.setFillColor(33, 12, 174);
    doc.rect(0, 0, 210, 24, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text("GROUP HARDWARE ASSET REQUISITION RECEIPT", 14, 15);

    // Logo
    try {
      const loadLogo = (): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = "/logo.png";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        });
      };

      const logoImg = await loadLogo();
      if (logoImg && logoImg.width > 0 && logoImg.height > 0) {
        const canvas = document.createElement("canvas");
        canvas.width = logoImg.width;
        canvas.height = logoImg.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(logoImg, 0, 0);
          const logoDataUrl = canvas.toDataURL("image/png");

          const badgeX = 155;
          const badgeY = 3;
          const badgeW = 44;
          const badgeH = 18;
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3, 3, 'F');

          const maxW = 38;
          const maxH = 14;
          const aspect = logoImg.width / logoImg.height;
          let renderW = maxW;
          let renderH = maxW / aspect;

          if (renderH > maxH) {
            renderH = maxH;
            renderW = maxH * aspect;
          }

          const renderX = badgeX + (badgeW - renderW) / 2;
          const renderY = badgeY + (badgeH - renderH) / 2;

          doc.addImage(logoDataUrl, "PNG", renderX, renderY, renderW, renderH);
        }
      }
    } catch (e) {
      console.error("Error drawing logo in group request PDF:", e);
    }

    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");
    doc.text(`Requisition Ref: REQ-GRP-${Date.now().toString().slice(-6)}`, 14, 33);
    doc.text(`Request Date: ${new Date(group.latestCreatedAt).toLocaleDateString()}`, 14, 39);
    doc.text(`Total Requested Items: ${items.reduce((acc, i) => acc + (i.quantity || 1), 0)}`, 110, 39);

    // Requester Information Box
    doc.setFillColor(245, 247, 250);
    doc.rect(14, 45, 182, 36, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("REQUESTER INFORMATION", 18, 53);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`Requester Name: ${group.requestedByName}`, 18, 60);
    doc.text(`Role / Position: ${group.requestedByRole || 'Staff'}`, 18, 66);
    doc.text(`Department: ${group.requestedByDepartment || 'General'}`, 18, 72);
    doc.text(`Site Location: ${group.siteName || 'Cebu IT Park'}`, 110, 60);

    // Table of Requested Items
    const tableY = 88;
    doc.setFillColor(33, 12, 174);
    doc.rect(14, tableY, 182, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("#", 18, tableY + 5.5);
    doc.text("Requested Item / Catalog", 28, tableY + 5.5);
    doc.text("Qty", 118, tableY + 5.5);
    doc.text("Urgency", 138, tableY + 5.5);
    doc.text("Status", 168, tableY + 5.5);

    let curY = tableY + 8;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(8.5);

    items.forEach((req: RequestEntry, index: number) => {
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, curY, 182, 7.5, 'F');
      }

      doc.text(`${index + 1}`, 18, curY + 5);
      doc.text(`${req.itemName || 'Asset Order'}`, 28, curY + 5);
      doc.text(`${req.quantity || 1}`, 118, curY + 5);
      doc.text(`${req.urgency || 'NORMAL'}`, 138, curY + 5);
      doc.text(`${req.status || 'PENDING'}`, 168, curY + 5);

      curY += 7.5;
    });

    // Outer table border
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, tableY, 182, curY - tableY);

    // Signatures
    const sigY = Math.max(curY + 16, 180);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text("APPROVAL & ACKNOWLEDGEMENT SIGNATURES", 14, sigY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(
      "I hereby submit/authorize the asset requisition requests listed above for company inventory allocation.",
      14,
      sigY + 6
    );

    doc.setDrawColor(150, 150, 150);
    doc.line(14, sigY + 28, 90, sigY + 28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${group.requestedByName}`, 14, sigY + 33);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Requester (${group.requestedByDepartment || 'Department'})`, 14, sigY + 37);

    doc.line(110, sigY + 28, 186, sigY + 28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Operations / Inventory Approver", 110, sigY + 33);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Authorized Approving Authority", 110, sigY + 37);

    doc.save(`Group_Requisition_Receipt_${(group.requestedByName || 'Record').replace(/\s+/g, '_')}_${Date.now()}.pdf`);
  };

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
          await onReview(id, 'READY_FOR_PICKUP', 'Staged for pickup');
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
        await onBulkCancel(selectedReqIds, 'Cancelled');
      } else {
        for (const id of selectedReqIds) {
          await onReview(id, 'REJECTED', 'Cancelled');
        }
      }
      setSelectedReqIds([]);
    } catch (err) {
      console.error('Error during bulk cancel:', err);
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const handleBulkConfirmReceiptClick = async () => {
    if (selectedReqIds.length === 0 || isSubmittingBulk) return;
    setIsSubmittingBulk(true);
    try {
      const userIdentifier = currentUserId || 'superadmin@contactpoint360.com';
      if (onBulkConfirmReceipt) {
        await onBulkConfirmReceipt(selectedReqIds);
      } else {
        await bulkConfirmReceiptApi(selectedReqIds, userIdentifier);
      }
      setSelectedReqIds([]);
      if (typeof window !== 'undefined') window.location.reload();
    } catch (err) {
      console.error('Error during bulk confirm receipt:', err);
    } finally {
      setIsSubmittingBulk(false);
      setIsBulkConfirmReceiptModalOpen(false);
    }
  };

  const handleBulkReturnClick = async () => {
    if (selectedReqIds.length === 0 || isSubmittingBulk) return;
    setIsSubmittingBulk(true);
    setBulkReturnError(null);
    try {
      const userIdentifier = currentUserId || 'superadmin@contactpoint360.com';
      if (onBulkReturn) {
        await onBulkReturn(selectedReqIds);
      } else {
        await bulkReturnApi(selectedReqIds, userIdentifier, bulkReturnComment || 'Bulk return by inventory staff');
      }
      setSelectedReqIds([]);
      setBulkReturnComment('');
      if (typeof window !== 'undefined') window.location.reload();
    } catch (err: any) {
      setBulkReturnError(err?.message || 'An error occurred during bulk return.');
    } finally {
      setIsSubmittingBulk(false);
      setIsBulkReturnModalOpen(false);
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
      message: 'Please provide an approval review comment (required):',
      placeholder: 'Enter approval comment/review...',
      confirmText: 'Approve',
      type: 'prompt',
      theme: 'approve',
      required: true,
      onConfirm: async (val) => {
        if (!val || !val.trim()) return;
        await onReview(id, 'APPROVED', val.trim());
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
    const allExportItems = groupedRequests.flatMap((g: any) => g.items);
    const rows = allExportItems.map((r: any) => [
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
            placeholder="Search item, requester, REQ-ID, or GRP-ID (e.g. GRP-7171)..."
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
            backgroundColor: '#eff6ff',
            color: '#1e293b',
            padding: '0.85rem 1.25rem',
            borderRadius: 12,
            border: '1px solid #bfdbfe',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.08)',
            animation: 'slideFadeIn 0.3s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, backgroundColor: '#2563eb', color: '#ffffff', padding: '0.3rem 0.65rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              {selectedReqIds.length} Request{selectedReqIds.length > 1 ? 's' : ''} Selected
            </span>

            {singleRequesterName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: '#1d4ed8' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Requested by:
                </span>
                <span style={{ color: '#1e40af', fontWeight: 700, backgroundColor: '#dbeafe', padding: '0.2rem 0.55rem', borderRadius: '4px', border: '1px solid #93c5fd' }}>
                  {singleRequesterName}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#475569' }}>({selectedReqIds.length} item{selectedReqIds.length > 1 ? 's' : ''})</span>
              </div>
            ) : (
              <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-3-3.87"/><path d="M9 21v-2a4 4 0 0 1 4-4h1"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Across multiple employees ({selectedReqIds.length} items)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(() => {
              const eligibleApproveReqs = selectedRequests.filter(
                r => ['PENDING', 'PENDING_APPROVAL', 'PENDING_OPS_APPROVAL'].includes(r.status as string) && 
                     (r.requestedById !== currentUserId || currentUserRole === 'SUPER_ADMIN')
              );
              const eligiblePrepareReqs = selectedRequests.filter(
                r => ['APPROVED'].includes(r.status as string)
              );
              const eligibleReleaseReqs = selectedRequests.filter(
                r => ['READY_FOR_PICKUP'].includes(r.status as string)
              );
              const eligibleConfirmReqs = selectedRequests.filter(
                r => ['AWAITING_CONFIRMATION', 'RELEASED'].includes(r.status as string)
              );
              const eligibleReturnReqs = selectedRequests.filter(
                r => ['RELEASED', 'AWAITING_CONFIRMATION', 'ITEM_RECEIVED'].includes(r.status as string)
              );

              if (canApprove && eligibleApproveReqs.length > 0) {
                return (
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {isSubmittingBulk ? 'Processing...' : 'Bulk Approve'}
                  </button>
                );
              }

              if (canApprove && eligiblePrepareReqs.length > 0) {
                return (
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                    {isSubmittingBulk ? 'Processing...' : 'Prepare Pickup'}
                  </button>
                );
              }

              if (canRelease && eligibleReleaseReqs.length > 0) {
                return (
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    {isSubmittingBulk ? 'Processing...' : 'Bulk Release'}
                  </button>
                );
              }

              if (canApprove && eligibleConfirmReqs.length > 0) {
                return (
                  <button
                    onClick={() => setIsBulkConfirmReceiptModalOpen(true)}
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    {isSubmittingBulk ? 'Processing...' : 'Bulk Confirm Receipt'}
                  </button>
                );
              }

              if ((canApprove || canRelease) && eligibleReturnReqs.length > 0) {
                return (
                  <button
                    onClick={() => setIsBulkReturnModalOpen(true)}
                    disabled={isSubmittingBulk}
                    style={{
                      backgroundColor: '#ea580c',
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
                      boxShadow: '0 2px 6px rgba(234, 88, 12, 0.3)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    {isSubmittingBulk ? 'Processing...' : 'Bulk Return'}
                  </button>
                );
              }

              return null;
            })()}

            <button
              onClick={() => setSelectedReqIds([])}
              style={{
                backgroundColor: '#ffffff',
                color: '#475569',
                border: '1px solid #cbd5e1',
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
                <th style={{ width: '40px', padding: '0.85rem 0.5rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
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
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textAlign: 'left', width: '125px', whiteSpace: 'nowrap' }}>Request ID</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textAlign: 'left', width: '140px', whiteSpace: 'nowrap' }}>Request Type</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textAlign: 'left', whiteSpace: 'nowrap' }}>Item Catalog</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textAlign: 'left', whiteSpace: 'nowrap' }}>Requested By</th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textAlign: 'center', width: '70px', whiteSpace: 'nowrap' }}>Qty</th>

              <th onClick={() => toggleSort('status')} style={{ padding: '0.85rem 1rem', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textAlign: 'left', cursor: 'pointer', userSelect: 'none', width: '120px', whiteSpace: 'nowrap' }}>
                Status{renderSortIndicator('status')}
              </th>
              <th style={{ padding: '0.85rem 1rem', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textAlign: 'left', whiteSpace: 'nowrap' }}>Site</th>
              <th onClick={() => toggleSort('createdAt')} style={{ padding: '0.85rem 1rem', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textAlign: 'left', cursor: 'pointer', userSelect: 'none', width: '135px', whiteSpace: 'nowrap' }}>
                Submitted{renderSortIndicator('createdAt')}
              </th>
              {(currentUserRole === 'ADMIN' || currentUserRole === 'INVENTORY_STAFF') && (
                <th style={{ padding: '0.85rem 1rem', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textAlign: 'center', width: '160px', whiteSpace: 'nowrap' }}>Fulfillment & PDF</th>
              )}
            </tr>
          </thead>
          <tbody>
            {groupedRequests.length === 0 ? (
              <tr>
                <td colSpan={canApprove ? (currentUserRole === 'ADMIN' || currentUserRole === 'INVENTORY_STAFF' ? 10 : 9) : (currentUserRole === 'ADMIN' || currentUserRole === 'INVENTORY_STAFF' ? 9 : 8)} style={{ padding: '4rem 1rem', textAlign: 'center' }}>
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
            ) : (() => {
              const paginatedGroups = groupedRequests.slice((page - 1) * itemsPerPage, page * itemsPerPage);
              return paginatedGroups.map((group: any, gIdx: number) => {
              if (group.items.length === 1) {
                const req = group.items[0];
                return (
                  <tr
                    className="animated-row"
                    key={req.id}
                    onClick={() => onRowClick(req)}
                    style={{ 
                      borderBottom: '1px solid #e2e8f0', 
                      backgroundColor: selectedReqIds.includes(req.id) ? '#f0f9ff' : 'transparent',
                      cursor: 'pointer', 
                      transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      animationDelay: `${gIdx * 0.04}s` 
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedReqIds.includes(req.id)) e.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedReqIds.includes(req.id)) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {canApprove && (
                      <td onClick={(e) => e.stopPropagation()} style={{ width: '40px', padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                        {['PENDING', 'PENDING_APPROVAL', 'PENDING_OPS_APPROVAL', 'APPROVED', 'READY_FOR_PICKUP', 'AWAITING_CONFIRMATION', 'RELEASED', 'ITEM_RECEIVED'].includes(req.status as string) &&
                         req.status !== 'PENDING_PROCUREMENT' &&
                         (currentUserRole === 'SUPER_ADMIN' || !(['PENDING', 'PENDING_APPROVAL', 'PENDING_OPS_APPROVAL'].includes(req.status as string) && req.requestedById === currentUserId)) ? (
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
                        {getFormattedRequestId(req)}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        color: '#475569',
                        backgroundColor: '#f1f5f9',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        border: '1px solid #cbd5e1',
                        whiteSpace: 'nowrap'
                      }}>
                        Single Request
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                        <span className="item-icon" style={{ color: '#64748b', display: 'flex', alignItems: 'center', marginTop: '0.1rem', transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                          {getCategoryIcon(req.itemCategory, req.itemName)}
                        </span>
                        <div>
                          <div>{getDisplayName(req)}</div>
                          {req.assetTag ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                              {req.assetTag.split(/,\s*/).map((tag: any, idx: number) => (
                                <AssetTagBadge key={idx} tag={tag} size="sm" />
                              ))}
                            </div>
                          ) : req.assetId ? (
                            <span style={{ display: 'inline-block', marginTop: '0.25rem' }}>
                              <AssetTagBadge tag={req.assetId} size="sm" variant="outline" />
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#334155', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#0f172a', whiteSpace: 'nowrap' }}>
                        <span>{req.requestedByName}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'nowrap', marginTop: '0.25rem' }}>
                        {req.requestedByRole && (
                          <RoleBadge role={req.requestedByRole} size="sm" />
                        )}
                        {req.requestedByDepartment && (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: "0.25rem",
                            fontSize: "0.68rem", fontWeight: 600, color: "#475569",
                            backgroundColor: "#f8fafc", padding: "0.1rem 0.45rem",
                            borderRadius: "9999px", border: "1px solid #e2e8f0", whiteSpace: "nowrap"
                          }}>
                            {getDepartmentIcon(req.requestedByDepartment, 11)}
                            <span>{req.requestedByDepartment}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#0f172a', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {req.quantity}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                        {renderStatusBadge(req.status)}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                      <SiteBadge site={sites.find(s => s.id === req.siteId)} siteName={req.siteName} size="sm" />
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap' }} title={new Date(req.createdAt).toLocaleString()}>
                      {formatRelativeTime(req.createdAt)}
                    </td>
                    {(currentUserRole === 'ADMIN' || currentUserRole === 'INVENTORY_STAFF') && (
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onRowClick(req)}
                          style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: 6,
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#334155',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                          }}
                        >
                          View Drawer →
                        </button>
                      </td>
                    )}
                  </tr>
                );
              }

              const groupRequestId = getFormattedRequestId(group.items[0]);
              const totalQty = group.items.reduce((acc: number, i: any) => acc + (i.quantity || 1), 0);
              const allGroupReqIds = group.items.map((r: any) => r.id);
              const isAllGroupSelected = allGroupReqIds.length > 0 && allGroupReqIds.every((id: string) => selectedReqIds.includes(id));

              return (
                <tr
                  key={group.key}
                  className="animated-row"
                  onClick={() => onRowClick({ ...group.items[0], groupItems: group.items, groupRequestId, groupTotalQty: totalQty } as any)}
                  style={{
                    borderBottom: '1px solid #e2e8f0',
                    backgroundColor: gIdx % 2 === 1 ? '#fcfdfe' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = gIdx % 2 === 1 ? '#fcfdfe' : '#ffffff'}
                >
                  {canApprove && (
                    <td onClick={(e) => e.stopPropagation()} style={{ width: '40px', padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                      {(() => {
                        const selectableGroupReqIds = group.items
                          .filter((r: any) => !['RETURNED', 'REJECTED', 'CANCELLED', 'PENDING_PROCUREMENT'].includes(r.status as string))
                          .filter((r: any) => currentUserRole === 'SUPER_ADMIN' || !(['PENDING', 'PENDING_APPROVAL', 'PENDING_OPS_APPROVAL'].includes(r.status as string) && r.requestedById === currentUserId))
                          .map((r: any) => r.id);

                        if (selectableGroupReqIds.length === 0) {
                          return null;
                        }

                        return (
                          <input
                            type="checkbox"
                            checked={selectableGroupReqIds.length > 0 && selectableGroupReqIds.every((id: string) => selectedReqIds.includes(id))}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (e.target.checked) {
                                setSelectedReqIds(prev => Array.from(new Set([...prev, ...selectableGroupReqIds])));
                              } else {
                                setSelectedReqIds(prev => prev.filter(id => !allGroupReqIds.includes(id)));
                              }
                            }}
                            style={{ cursor: 'pointer', accentColor: '#3b82f6', width: '16px', height: '16px' }}
                            title="Select all eligible requests in group"
                          />
                        );
                      })()}
                    </td>
                  )}

                  <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#3730a3',
                      backgroundColor: '#eef2ff',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #c7d2fe',
                      letterSpacing: '0.5px',
                      whiteSpace: 'nowrap'
                    }}>
                      {groupRequestId}
                    </span>
                  </td>

                  <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: '#3730a3',
                      backgroundColor: '#eef2ff',
                      padding: '0.15rem 0.55rem',
                      borderRadius: '9999px',
                      border: '1px solid #c7d2fe',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                      Grouped ({group.items.length} Requests)
                    </span>
                  </td>

                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.82rem' }}>
                        {group.items.slice(0, 2).map((i: any) => i.itemName).join(', ')}
                        {group.items.length > 2 ? ` +${group.items.length - 2} more` : ''}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Combined Requisition ({group.items.length} Assets)
                      </span>
                    </div>
                  </td>

                  <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{group.requestedByName}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'nowrap' }}>
                        {group.requestedByRole && <RoleBadge role={group.requestedByRole} size="sm" />}
                        {group.requestedByDepartment && (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: "0.25rem",
                            fontSize: "0.68rem", fontWeight: 600, color: "#475569",
                            backgroundColor: "#f8fafc", padding: "0.1rem 0.45rem",
                            borderRadius: "9999px", border: "1px solid #e2e8f0", whiteSpace: "nowrap"
                          }}>
                            {getDepartmentIcon(group.requestedByDepartment, 11)}
                            <span>{group.requestedByDepartment}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#0f172a', textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {totalQty}
                  </td>

                  <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {group.pendingOpsCount > 0 && <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '9999px', backgroundColor: '#faf5ff', color: '#6b21a8', border: '1px solid #e9d5ff' }}>{group.pendingOpsCount} PENDING OPS APPROVAL</span>}
                      {group.pendingStaffCount > 0 && <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '9999px', backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5' }}>{group.pendingStaffCount} PENDING STAFF APPROVAL</span>}
                      {group.pendingProcurementCount > 0 && <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '9999px', backgroundColor: '#f5f3ff', color: '#6d28d9', border: '1px solid #c4b5fd' }}>{group.pendingProcurementCount} PENDING PROCUREMENT</span>}
                      {group.approvedCount > 0 && <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '9999px', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #dcfce7' }}>{group.approvedCount} APPROVED</span>}
                      {group.readyCount > 0 && <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '9999px', backgroundColor: '#ecfeff', color: '#0e7490', border: '1px solid #67e8f9' }}>{group.readyCount} READY FOR PICKUP</span>}
                      {group.releasedCount > 0 && <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '9999px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' }}>{group.releasedCount} RELEASED</span>}
                      {group.itemReceivedCount > 0 && <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '9999px', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #6ee7b7' }}>{group.itemReceivedCount} ITEM RECEIVED</span>}
                      {group.returnedCount > 0 && <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '9999px', backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #6ee7b7' }}>{group.returnedCount} RETURNED</span>}
                      {group.rejectedCount > 0 && <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '9999px', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' }}>{group.rejectedCount} REJECTED</span>}
                      {group.cancelledCount > 0 && <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '9999px', backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' }}>{group.cancelledCount} CANCELLED</span>}
                    </div>
                  </td>

                  <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                    <SiteBadge site={sites.find(s => s.id === group.siteId)} siteName={group.siteName} size="sm" />
                  </td>

                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {formatRelativeTime(group.latestCreatedAt)}
                  </td>

                  {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN' || currentUserRole === 'INVENTORY_STAFF') && (
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', alignItems: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadGroupRequestReceipt(group);
                          }}
                          title="Download Group PDF Requisition Receipt"
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(148, 163, 184, 0.45)',
                            background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                            color: '#334155',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          📄 PDF Receipt
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRowClick({ ...group.items[0], groupItems: group.items, groupRequestId, groupTotalQty: totalQty } as any);
                          }}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#334155',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          View Details →
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          })()}
          </tbody>
        </table>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Showing {((page - 1) * itemsPerPage) + 1}–{Math.min(page * itemsPerPage, groupedRequests.length)} of {groupedRequests.length} request groups
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
        title="Bulk Approve Asset Transfers"
        message={`You are approving ${selectedReqIds.length} selected request(s). Please provide an approval comment.`}
        placeholder="Enter approval comment (e.g., Approved for deployment by Ops Admin)..."
        confirmText={isSubmittingBulk ? "Approving..." : `Approve ${selectedReqIds.length} Request(s)`}
        theme="approve"
        required={true}
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
        required={confirmState.required}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Bulk Confirm Receipt Modal */}
      {isBulkConfirmReceiptModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: '2rem', minWidth: 420, maxWidth: 520, boxShadow: '0 20px 60px rgba(15,23,42,0.18)', animation: 'slideFadeIn 0.25s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>✅</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Bulk Confirm Receipt</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Confirm receipt for {selectedReqIds.length} selected request{selectedReqIds.length > 1 ? 's' : ''}</p>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.5rem', backgroundColor: '#f0fdf4', padding: '0.85rem 1rem', borderRadius: 10, border: '1px solid #bbf7d0' }}>
              You are about to confirm receipt for <strong>{selectedReqIds.length} request{selectedReqIds.length > 1 ? 's' : ''}</strong>. This will mark each selected request as <strong>Item Received</strong> and notify the inventory staff.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setIsBulkConfirmReceiptModalOpen(false); }}
                disabled={isSubmittingBulk}
                style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.5rem 1.1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkConfirmReceiptClick}
                disabled={isSubmittingBulk}
                style={{ backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: 8, padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 700, cursor: isSubmittingBulk ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}
              >
                {isSubmittingBulk ? (
                  <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Processing...</>
                ) : `✅ Confirm ${selectedReqIds.length} Receipt${selectedReqIds.length > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Return Modal */}
      {isBulkReturnModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: '2rem', minWidth: 440, maxWidth: 540, boxShadow: '0 20px 60px rgba(15,23,42,0.18)', animation: 'slideFadeIn 0.25s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🔄</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Bulk Asset Return</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Return {selectedReqIds.length} selected asset{selectedReqIds.length > 1 ? 's' : ''} back to stock</p>
              </div>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, marginBottom: '1rem', backgroundColor: '#fff7ed', padding: '0.85rem 1rem', borderRadius: 10, border: '1px solid #fed7aa' }}>
              You are about to mark <strong>{selectedReqIds.length} request{selectedReqIds.length > 1 ? 's' : ''}</strong> as <strong>Returned</strong>. The assets will be added back to inventory stock.
            </p>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Return Comment (optional)</label>
              <textarea
                value={bulkReturnComment}
                onChange={(e) => setBulkReturnComment(e.target.value)}
                placeholder="e.g. Employee resigned, contract ended, equipment replacement..."
                rows={3}
                style={{ width: '100%', borderRadius: 8, border: '1px solid #d1d5db', padding: '0.6rem 0.8rem', fontSize: '0.85rem', color: '#1e293b', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
            {bulkReturnError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.65rem 0.9rem', marginBottom: '1rem', fontSize: '0.82rem', color: '#dc2626', fontWeight: 600 }}>
                ⚠️ {bulkReturnError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setIsBulkReturnModalOpen(false); setBulkReturnError(null); setBulkReturnComment(''); }}
                disabled={isSubmittingBulk}
                style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.5rem 1.1rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkReturnClick}
                disabled={isSubmittingBulk}
                style={{ backgroundColor: '#ea580c', color: '#ffffff', border: 'none', borderRadius: 8, padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 700, cursor: isSubmittingBulk ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 8px rgba(234,88,12,0.3)' }}
              >
                {isSubmittingBulk ? (
                  <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Processing...</>
                ) : `🔄 Return ${selectedReqIds.length} Asset${selectedReqIds.length > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
