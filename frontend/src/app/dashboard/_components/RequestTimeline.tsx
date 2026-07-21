'use client';

import React, { useState } from 'react';
import { confirmReceipt, approveStaff, approveOps, preparePickup } from '../../../lib/services/requestService';

export interface RequestTimelineEvent {
  status: string;
  comment?: string;
  timestamp: string;
  byName?: string;
  receivedBy?: string;
}

export interface RequestTimelineProps {
  requestId: string;
  status: string;
  requestedById: string;
  requestedByName: string;
  currentUserEmail: string;
  currentUserId: string;
  currentUserRole: string;
  staffApprovedById?: string;
  staffApprovedByName?: string;
  staffApprovedAt?: string;
  opsApprovedById?: string;
  opsApprovedByName?: string;
  opsApprovedAt?: string;
  history?: RequestTimelineEvent[];
  onConfirmSuccess: (updatedRequest: any) => void;
  assetTag?: string;
  senderName?: string;
  senderSiteName?: string;
  senderSiteAddress?: string;
  receiverName?: string;
  receiverSiteName?: string;
  receiverSiteAddress?: string;
  receivedAt?: string;
  itemName?: string;
  itemCategory?: string;
  assetSiteName?: string;
  assetSiteAddress?: string;
}

export function RequestTimeline({
  requestId,
  status,
  requestedById,
  requestedByName,
  currentUserEmail,
  currentUserId,
  currentUserRole,
  staffApprovedById,
  staffApprovedByName,
  staffApprovedAt,
  opsApprovedById,
  opsApprovedByName,
  opsApprovedAt,
  history = [],
  onConfirmSuccess,
  assetTag,
  senderName = 'Moses Salivio',
  senderSiteName = 'Cebu IT Park',
  senderSiteAddress = 'Skyrise 4B',
  assetSiteName,
  assetSiteAddress,
  receiverName,
  receiverSiteName = 'Cebu IT Park',
  receiverSiteAddress = 'Skyrise 4B',
  receivedAt,
  itemName,
  itemCategory
}: RequestTimelineProps) {
  const [isActioning, setIsActioning] = useState(false);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isRequester = currentUserId === requestedById;

  const handleConfirm = async () => {
    setIsActioning(true);
    setError(null);
    try {
      let data: any = null;
      try {
        data = await confirmReceipt(requestId, currentUserEmail);
      } catch (err) {
        console.warn(err);
      }
      if (data) {
        onConfirmSuccess(data.data);
      } else {
        const newEvent = {
          status: 'ITEM_RECEIVED',
          comment: 'Receipt confirmed by requester',
          timestamp: new Date().toISOString(),
          byName: requestedByName
        };
        onConfirmSuccess({
          id: requestId,
          status: 'ITEM_RECEIVED',
          history: [...history, newEvent]
        });
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsActioning(false);
    }
  };

  const handleApproveStaff = async () => {
    setIsActioning(true);
    setError(null);
    try {
      let data: any = null;
      try {
        data = await approveStaff(requestId, currentUserEmail, comment);
      } catch (err) {
        console.warn(err);
      }
      if (data) {
        onConfirmSuccess(data.data);
      } else {
        const newEvent = {
          status: 'PENDING_OPS_APPROVAL',
          comment: comment || 'Approved by Inventory Staff — awaiting Ops Manager approval',
          timestamp: new Date().toISOString(),
          byName: 'Mock Staff'
        };
        onConfirmSuccess({
          id: requestId,
          status: 'PENDING_OPS_APPROVAL',
          staffApprovedById: currentUserId,
          staffApprovedByName: 'Mock Staff',
          staffApprovedAt: new Date().toISOString(),
          history: [...history, newEvent]
        });
      }
      setComment('');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsActioning(false);
    }
  };

  const handleApproveOps = async () => {
    setIsActioning(true);
    setError(null);
    try {
      let data: any = null;
      try {
        data = await approveOps(requestId, currentUserEmail, comment);
      } catch (err) {
        console.warn(err);
      }
      if (data) {
        onConfirmSuccess(data.data);
      } else {
        const newEvent = {
          status: 'APPROVED',
          comment: comment || 'Approved by Ops Manager',
          timestamp: new Date().toISOString(),
          byName: 'Mock Ops Manager'
        };
        onConfirmSuccess({
          id: requestId,
          status: 'APPROVED',
          opsApprovedById: currentUserId,
          opsApprovedByName: 'Mock Ops Manager',
          opsApprovedAt: new Date().toISOString(),
          history: [...history, newEvent]
        });
      }
      setComment('');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsActioning(false);
    }
  };

  const handlePreparePickup = async () => {
    setIsActioning(true);
    setError(null);
    try {
      let data: any = null;
      try {
        data = await preparePickup(requestId, currentUserEmail, comment);
      } catch (err) {
        console.warn(err);
      }
      if (data) {
        onConfirmSuccess(data.data);
      } else {
        const newEvent = {
          status: 'READY_FOR_PICKUP',
          comment: comment || 'Item staged and ready for pickup',
          timestamp: new Date().toISOString(),
          byName: 'Mock Staff'
        };
        onConfirmSuccess({
          id: requestId,
          status: 'READY_FOR_PICKUP',
          history: [...history, newEvent]
        });
      }
      setComment('');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsActioning(false);
    }
  };

  const cleanAddress = (address?: string) => {
    if (!address) return '';
    const trimmed = address.trim();
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      return trimmed;
    }
    return `(${trimmed})`;
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const optionsDate: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      };
      const optionsTime: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      const datePart = date.toLocaleDateString('en-US', optionsDate);
      const timePart = date.toLocaleTimeString('en-US', optionsTime);
      return `${datePart}, ${timePart}`;
    } catch {
      return dateStr;
    }
  };

  const Badge = ({ children, type }: { children: React.ReactNode, type: 'ops' | 'inv' }) => {
    const isOps = type === 'ops';
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', padding: '0.15rem 0.5rem',
        borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 600,
        backgroundColor: isOps ? '#faf5ff' : '#eff6ff',
        color: isOps ? '#6b21a8' : '#1e40af',
        border: `1px solid ${isOps ? '#e9d5ff' : '#bfdbfe'}`,
        marginLeft: '0.4rem',
        transform: 'translateY(-1px)'
      }}>
        {children}
      </span>
    );
  };

  const mapStatus = (statusStr: string): string => {
    const s = statusStr.toUpperCase();
    if (s === 'PENDING' || s === 'PENDING_APPROVAL' || s === 'REQUESTED') return 'PENDING_APPROVAL';
    if (s === 'PENDING_OPS_APPROVAL') return 'PENDING_OPS_APPROVAL';
    if (s === 'APPROVED') return 'APPROVED';
    if (s === 'READY_FOR_PICKUP') return 'READY_FOR_PICKUP';
    if (s === 'RELEASED') return 'RELEASED';
    if (s === 'AWAITING_CONFIRMATION') return 'AWAITING_CONFIRMATION';
    if (s === 'ITEM_RECEIVED') return 'ITEM_RECEIVED';
    return s;
  };


  const buildNodes = () => {
    const ascHistory = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let nodes: any[] = [];

    const getPendingIcon = () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    );

    const getApprovedIcon = () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
    );

    const getReadyIcon = () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    );

    const getReleasedIcon = () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 16 16 12 12 8" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    );

    const getAwaitingIcon = () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );

    const getReceivedIcon = () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    );

    const getReturnedIcon = () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );

    const getRejectedIcon = () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    );

    // Check if this is an Asset Deployment transaction
    const isDeployment = status === 'RELEASED' || ascHistory.some(e => e.comment && e.comment.includes('[ASSET DEPLOYMENT]'));

    if (isDeployment) {
      const deployTimestamp = ascHistory.length > 0 ? ascHistory[ascHistory.length - 1].timestamp : new Date().toISOString();
      const targetEmployee = receiverName || requestedByName;
      nodes.push({
        type: 'released',
        title: 'DEPLOYED',
        titleColor: '#2563eb',
        iconColor: '#2563eb',
        iconSvg: getReleasedIcon(),
        timestamp: deployTimestamp,
        boxText: `Asset deployed directly to ${targetEmployee}`,
        bottomHtml: <span>Deployed by: <strong>{senderName || requestedByName || 'Inventory Staff'}</strong> <Badge type="inv">Inv. Staff</Badge></span>
      });
      return nodes;
    }

    const hasInitialPending = ascHistory.some(evt => mapStatus(evt.status) === 'PENDING_APPROVAL');
    if (!hasInitialPending) {
      const firstTimestamp = ascHistory.length > 0 ? ascHistory[0].timestamp : new Date().toISOString();
      ascHistory.unshift({
        status: 'PENDING_APPROVAL',
        timestamp: firstTimestamp,
        byName: requestedByName
      });
    }

    for (let i = 0; i < ascHistory.length; i++) {
      const evt = ascHistory[i];
      const s = mapStatus(evt.status);

      if (s === 'PENDING_APPROVAL') {
        nodes.push({
          type: 'pending_inv',
          title: 'PENDING APPROVAL',
          titleColor: '#ea580c',
          iconColor: '#ea580c',
          iconSvg: getPendingIcon(),
          timestamp: evt.timestamp,
          boxText: 'Submitted for Inventory Staff review',
          bottomHtml: <span>Requested by: <strong>{evt.byName || requestedByName}</strong> &middot; Waiting for: <strong>Inv. Staff</strong> <Badge type="inv">Inv. Staff</Badge></span>
        });
      }

      if (s === 'PENDING_OPS_APPROVAL') {
        nodes.push({
          type: 'approved_inv',
          title: 'APPROVED',
          titleColor: '#16a34a',
          iconColor: '#16a34a',
          iconSvg: getApprovedIcon(),
          timestamp: evt.timestamp,
          boxText: evt.comment || 'Initial approval granted',
          bottomHtml: <span>Approved by: <strong>{staffApprovedByName || evt.byName || 'Inventory Staff'}</strong> <Badge type="inv">Inv. Staff</Badge></span>
        });

        nodes.push({
          type: 'pending_ops',
          title: 'PENDING APPROVAL',
          titleColor: '#ea580c',
          iconColor: '#ea580c',
          iconSvg: getPendingIcon(),
          timestamp: evt.timestamp,
          boxText: 'Forwarded for Ops Manager review',
          bottomHtml: <span>Waiting for: <strong>Ops Manager</strong> <Badge type="ops">Ops Manager</Badge></span>
        });
      }

      if (s === 'APPROVED') {
        nodes.push({
          type: 'approved_ops',
          title: 'APPROVED',
          titleColor: '#16a34a',
          iconColor: '#16a34a',
          iconSvg: getApprovedIcon(),
          timestamp: evt.timestamp,
          boxText: evt.comment || 'Request approved by Ops Manager',
          bottomHtml: <span>Approved by: <strong>{opsApprovedByName || evt.byName || 'Ops Manager'}</strong> <Badge type="ops">Ops Manager</Badge></span>
        });
      }

      if (s === 'READY_FOR_PICKUP') {
        nodes.push({
          type: 'ready_pickup',
          title: 'READY FOR PICKUP',
          titleColor: '#4b5563',
          iconColor: '#4b5563',
          iconSvg: getReadyIcon(),
          timestamp: evt.timestamp,
          boxText: evt.comment || 'Item staged and ready for pickup',
          bottomHtml: <span>Prepared by: <strong>{evt.byName || 'Inventory Staff'}</strong></span>
        });
      }
      if (s === 'RELEASED') {
        nodes.push({
          type: 'released',
          title: 'RELEASED',
          titleColor: '#2563eb',
          iconColor: '#2563eb',
          iconSvg: getReleasedIcon(),
          timestamp: evt.timestamp,
          boxText: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div>{evt.comment || 'Item released to user'}</div>
              {(itemName || assetTag) && (
                <div style={{
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '6px',
                  padding: '0.4rem 0.6rem',
                  fontSize: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.15rem'
                }}>
                  {itemName && <div><strong style={{ color: '#1e40af' }}>Brand/Item:</strong> <span style={{ color: '#1e3a8a' }}>{itemName}</span></div>}
                  {assetTag && <div><strong style={{ color: '#1e40af' }}>{itemCategory === 'Consumables' ? 'Batch Number' : 'Asset Tag'}:</strong> <span style={{ fontFamily: 'monospace', color: '#1e3a8a' }}>{assetTag}</span></div>}
                  {assetSiteName && <div><strong style={{ color: '#1e40af' }}>Source Site:</strong> <span style={{ color: '#1e3a8a' }}>{assetSiteName}</span></div>}
                </div>
              )}
            </div>
          ),
          bottomHtml: <span>Handled by: <strong>{evt.byName || 'Logistics Staff'}</strong></span>
        });
      }
      if (s === 'AWAITING_CONFIRMATION') {
        nodes.push({
          type: 'awaiting',
          title: 'AWAITING CONFIRMATION',
          titleColor: '#d97706',
          iconColor: '#d97706',
          iconSvg: getAwaitingIcon(),
          timestamp: evt.timestamp,
          boxText: evt.comment || 'Awaiting confirmation of receipt by requester',
          bottomHtml: <span>Waiting for: <strong>{requestedByName}</strong></span>
        });
      }
      if (s === 'ITEM_RECEIVED') {
        nodes.push({
          type: 'received',
          title: 'ITEM RECEIVED',
          titleColor: '#16a34a',
          iconColor: '#16a34a',
          iconSvg: getReceivedIcon(),
          timestamp: evt.timestamp,
          boxText: evt.comment || 'Receipt confirmed by requester',
          bottomHtml: (
            <span>
              Received by: <strong>{evt.byName || requestedByName}</strong>
              {receiverSiteName && <> at <strong>{receiverSiteName}</strong></>}
            </span>
          )
        });
      }
      if (s === 'RETURNED') {
        nodes.push({
          type: 'returned',
          title: 'RETURNED',
          titleColor: '#059669',
          iconColor: '#059669',
          iconSvg: getReturnedIcon(),
          timestamp: evt.timestamp,
          boxText: evt.comment || 'Item returned to inventory',
          bottomHtml: (
            <span>
              Returned by: <strong>{requestedByName}</strong>
              {receiverSiteName && <> (from <strong>{receiverSiteName}</strong>)</>}
              &middot; Received by: <strong>{evt.byName || 'Inventory Staff'}</strong>
              {senderSiteName && <> at <strong>{senderSiteName}</strong></>}
            </span>
          )
        });
      }
      if (s === 'REJECTED' || s === 'CANCELLED') {
        nodes.push({
          type: 'rejected',
          title: s === 'REJECTED' ? 'REJECTED' : 'CANCELLED',
          titleColor: '#dc2626',
          iconColor: '#dc2626',
          iconSvg: getRejectedIcon(),
          timestamp: evt.timestamp,
          boxText: evt.comment || `Request ${s.toLowerCase()}`,
          bottomHtml: <span>By: <strong>{evt.byName}</strong></span>
        });
      }
    }

    nodes.reverse();
    return nodes;
  };

  const displayNodes = buildNodes();

  const isFinalComplete = status === 'ITEM_RECEIVED' || history.some(h => mapStatus(h.status) === 'ITEM_RECEIVED');
  const itemReceivedEvent = history.find(h => mapStatus(h.status) === 'ITEM_RECEIVED');
  const dateReceivedStr = itemReceivedEvent ? formatTimestamp(itemReceivedEvent.timestamp) : (receivedAt ? formatTimestamp(receivedAt) : '');
  const receivedByNameStr = itemReceivedEvent?.byName || receiverName || requestedByName;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'inherit' }}>

      {assetTag && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {itemCategory === 'Consumables' ? 'Assigned Batch Number' : 'Assigned Asset Tag'}
          </label>
          <div style={{
            alignSelf: 'flex-start',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '0.4rem 0.8rem',
            fontSize: '0.82rem',
            fontWeight: 700,
            fontFamily: 'monospace',
            color: '#334155',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            {assetTag}
          </div>
        </div>
      )}

      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
      }}>
        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '1rem' }}>
          Asset Movement Details
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>Sender</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', display: 'block', marginTop: '0.2rem' }}>{senderName}</span>
            <span style={{ fontSize: '0.8rem', color: '#475569', display: 'block', marginTop: '0.1rem' }}>{senderSiteName}</span>
            {senderSiteAddress && (
              <span style={{ fontSize: '0.76rem', color: '#64748b', fontStyle: 'italic', display: 'block' }}>
                {cleanAddress(senderSiteAddress)}
              </span>
            )}
            {assetSiteName && (
              <div style={{ marginTop: '0.5rem', padding: '0.35rem 0.5rem', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, fontSize: '0.72rem' }}>
                <span style={{ fontWeight: 600, color: '#0369a1', display: 'block', textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.3px' }}>Asset Origin Site</span>
                <div style={{ color: '#0c4a6e', fontWeight: 700, marginTop: '0.1rem' }}>{assetSiteName}</div>
                {assetSiteAddress && assetSiteAddress !== senderSiteAddress && (
                  <div style={{ color: '#0284c7', fontStyle: 'italic', fontSize: '0.68rem', marginTop: '0.05rem' }}>{cleanAddress(assetSiteAddress)}</div>
                )}
              </div>
            )}
          </div>
          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>Receiver</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', display: 'block', marginTop: '0.2rem' }}>{receiverName || requestedByName}</span>
            <span style={{ fontSize: '0.8rem', color: '#475569', display: 'block', marginTop: '0.1rem' }}>{receiverSiteName}</span>
            {receiverSiteAddress && (
              <span style={{ fontSize: '0.76rem', color: '#64748b', fontStyle: 'italic', display: 'block' }}>
                {cleanAddress(receiverSiteAddress)}
              </span>
            )}
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Request Timeline
        </label>

        {isFinalComplete && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </span>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#14532d' }}>
                Receipt confirmed by requester
              </h4>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#15803d', display: 'flex', flexWrap: 'wrap', gap: '1.2rem', marginTop: '0.1rem' }}>
              <span><strong style={{ color: '#14532d' }}>RECEIVED BY:</strong> {receivedByNameStr}</span>
              {dateReceivedStr && (
                <span><strong style={{ color: '#14532d' }}>DATE RECEIVED:</strong> {dateReceivedStr}</span>
              )}
              {receiverSiteName && (
                <span><strong style={{ color: '#14532d' }}>SITE:</strong> {receiverSiteName}</span>
              )}
            </div>
          </div>
        )}

        {status === 'PENDING' && currentUserRole === 'INVENTORY_STAFF' && !isRequester && (
          <div style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', marginTop: '0.15rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </span>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#92400e' }}>
                  Inventory Staff Approval Required
                </h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#b45309', lineHeight: 1.4 }}>
                  Approve this request to forward it to the Ops Manager approval queue.
                </p>
              </div>
            </div>
            <input
              type="text"
              placeholder="Add approval comment (optional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ padding: '0.45rem 0.65rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none' }}
            />
            {error && (
              <div style={{ fontSize: '0.75rem', color: '#b91c1c', padding: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>
                ⚠ {error}
              </div>
            )}
            <button
              onClick={handleApproveStaff}
              disabled={isActioning}
              style={{
                alignSelf: 'flex-start',
                padding: '0.5rem 1.25rem',
                borderRadius: 8,
                border: 'none',
                background: '#d97706',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: isActioning ? 'not-allowed' : 'pointer',
              }}
            >
              {isActioning ? 'Processing...' : '✓ Approve Request'}
            </button>
          </div>
        )}

        {status === 'PENDING_OPS_APPROVAL' && currentUserRole === 'ADMIN' && !isRequester && (
          <div style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ color: '#ea580c', display: 'flex', alignItems: 'center', marginTop: '0.15rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
              </span>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#9a3412' }}>
                  Ops Manager Approval Required
                </h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#c2410c', lineHeight: 1.4 }}>
                  Review and approve the request as the second-step Ops Manager.
                </p>
              </div>
            </div>
            {staffApprovedById === currentUserId ? (
              <div style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 600, padding: '0.5rem 0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
                ⚠ Separation of duties: You cannot approve this request because you completed the initial Inventory Staff approval.
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Add approval comment (optional)..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{ padding: '0.45rem 0.65rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none' }}
                />
                {error && (
                  <div style={{ fontSize: '0.75rem', color: '#b91c1c', padding: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>
                    ⚠ {error}
                  </div>
                )}
                <button
                  onClick={handleApproveOps}
                  disabled={isActioning}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '0.5rem 1.25rem',
                    borderRadius: 8,
                    border: 'none',
                    background: '#ea580c',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: isActioning ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isActioning ? 'Processing...' : '✓ Approve Request'}
                </button>
              </>
            )}
          </div>
        )}

        {status === 'APPROVED' && currentUserRole === 'INVENTORY_STAFF' && !isRequester && (
          <div style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ color: '#4b5563', display: 'flex', alignItems: 'center', marginTop: '0.15rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </span>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>
                  Prepare & Stage for Pickup
                </h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#4b5563', lineHeight: 1.4 }}>
                  Review, allocate stock, and mark this item as staged and ready for pickup.
                </p>
              </div>
            </div>
            <input
              type="text"
              placeholder="Add comments (optional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ padding: '0.45rem 0.65rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none' }}
            />
            {error && (
              <div style={{ fontSize: '0.75rem', color: '#b91c1c', padding: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>
                ⚠ {error}
              </div>
            )}
            <button
              onClick={handlePreparePickup}
              disabled={isActioning}
              style={{
                alignSelf: 'flex-start',
                padding: '0.5rem 1.25rem',
                borderRadius: 8,
                border: 'none',
                background: '#475569',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: isActioning ? 'not-allowed' : 'pointer',
              }}
            >
              {isActioning ? 'Processing...' : '✓ Mark Ready for Pickup'}
            </button>
          </div>
        )}

        {status === 'AWAITING_CONFIRMATION' && (
          <>
            {isRequester ? (
              <div style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', marginTop: '0.15rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </span>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#92400e' }}>
                      Did you receive this item?
                    </h4>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#b45309', lineHeight: 1.4 }}>
                      {requestedByName} must confirm receipt to complete this request.
                    </p>
                  </div>
                </div>

                {error && (
                  <div style={{ fontSize: '0.75rem', color: '#b91c1c', padding: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>
                    ⚠ {error}
                  </div>
                )}

                <button
                  onClick={handleConfirm}
                  disabled={isActioning}
                  style={{
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.5rem 1rem',
                    borderRadius: 8,
                    border: 'none',
                    background: '#d97706',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: isActioning ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.15s',
                    boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)'
                  }}
                  onMouseEnter={(e) => { if (!isActioning) e.currentTarget.style.backgroundColor = '#b45309'; }}
                  onMouseLeave={(e) => { if (!isActioning) e.currentTarget.style.backgroundColor = '#d97706'; }}
                >
                  {isActioning ? 'Processing...' : '✓ Confirm Receipt'}
                </button>
              </div>
            ) : (
              <div style={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#4b5563', fontWeight: 500 }}>
                  Awaiting confirmation of receipt by original requester ({requestedByName}).
                </p>
              </div>
            )}
          </>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', marginTop: '0.5rem' }}>
          <div style={{ position: 'absolute', left: '15px', top: '16px', bottom: '16px', width: '2px', backgroundColor: '#e2e8f0', zIndex: 0 }} />

          {displayNodes.map((node, idx) => {
            const isLatest = idx === 0;
            let pulseAnim = '';
            if (isLatest) {
              if (node.iconColor === '#ea580c') pulseAnim = 'pulse-orange 2s infinite';
              else if (node.iconColor === '#16a34a') pulseAnim = 'pulse-green 2s infinite';
              else if (node.iconColor === '#2563eb') pulseAnim = 'pulse-blue 2s infinite';
              else if (node.iconColor === '#059669') pulseAnim = 'pulse-emerald 2s infinite';
            }

            return (
              <div
                key={idx}
                className="timeline-node"
                style={{
                  display: 'flex',
                  gap: '1.25rem',
                  position: 'relative',
                  zIndex: 1,
                  alignItems: 'flex-start',
                  paddingBottom: idx === displayNodes.length - 1 ? '0' : '2rem',
                  animationDelay: `${idx * 0.15}s`
                }}
              >
                <div
                  className="timeline-node-icon"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    border: `1.5px solid ${node.iconColor}`,
                    color: node.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '0px',
                    animation: pulseAnim || undefined
                  }}
                >
                  {node.iconSvg}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: node.titleColor, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                    {node.title}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginBottom: '0.5rem' }}>
                    {formatTimestamp(node.timestamp)}
                  </span>

                  {node.boxText && (
                    <div
                      className="timeline-box"
                      style={{
                        fontSize: '0.82rem',
                        color: '#475569',
                        background: '#ffffff',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        marginBottom: '0.6rem',
                        display: 'inline-block',
                        width: '100%',
                        maxWidth: '450px'
                      }}
                    >
                      {node.boxText}
                    </div>
                  )}

                  <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                    {node.bottomHtml}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      <style jsx global>{`
        @keyframes pulse-orange {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(234, 88, 12, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 6px rgba(234, 88, 12, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(234, 88, 12, 0); }
        }
        @keyframes pulse-green {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 6px rgba(22, 163, 74, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
        }
        @keyframes pulse-blue {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 6px rgba(37, 99, 235, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
        @keyframes pulse-emerald {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 6px rgba(5, 150, 105, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(5, 150, 105, 0); }
        }
        @keyframes slide-up-fade {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .timeline-node {
          animation: slide-up-fade 0.5s ease-out forwards;
          opacity: 0;
        }
        .timeline-node-icon {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
        }
        .timeline-node:hover .timeline-node-icon {
          transform: scale(1.2);
        }
        .timeline-box {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .timeline-node:hover .timeline-box {
          transform: translateY(-3px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.06);
          border-color: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
