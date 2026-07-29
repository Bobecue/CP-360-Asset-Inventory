'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getCategoryIcon } from '@/types/dashboard';

type UrgencyLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  category?: string;
}

interface Site {
  id: string;
  name: string;
  prefix: string;
  address?: string;
}

interface NewRequestModalProps {
  open: boolean;
  onClose: () => void;
  inventoryItems: InventoryItem[];
  sites: Site[];
  onSubmit: (itemId: string, quantity: number, siteId: string, reason: string) => Promise<boolean>;
  title?: string;
}

const getAccessoryType = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('mouse') || lower.includes('mx master') || lower.includes('magic')) return 'Mouse';
  if (lower.includes('keyboard')) return 'Keyboard';
  if (lower.includes('monitor') || lower.includes('display')) return 'Monitor';
  if (lower.includes('headset') || lower.includes('headphones')) return 'Headset';
  if (lower.includes('hub') || lower.includes('dock')) return 'USB Hub / Dock';
  if (lower.includes('cable')) return 'Cable';
  if (lower.includes('charger') || lower.includes('adapter')) return 'Charger / Adapter';

  const brands = ['logitech', 'dell', 'jabra', 'lenovo', 'apple', 'hp', 'asus', 'acer', 'microsoft'];
  const words = name.split(' ');
  if (brands.includes(words[0].toLowerCase())) {
    return words.slice(1).join(' ');
  }
  return name;
};

export function formatItemDisplayName(name: string): string {
  if (!name) return '';
  const parts = name.split('-').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    const brand = parts[0];
    const model = parts.slice(2).join('-');
    return `${model} ${brand}`;
  } else if (parts.length === 2) {
    const brand = parts[0];
    const model = parts[1];
    return `${model} ${brand}`;
  }
  return name;
}

export function NewRequestModal({ open, onClose, inventoryItems, sites, onSubmit, title = 'New Request' }: NewRequestModalProps) {
  const [reqItemId, setReqItemId] = useState('');
  const [reqSpecificItemId, setReqSpecificItemId] = useState('');
  const [reqQuantity, setReqQuantity] = useState(1);
  const [reqSiteId, setReqSiteId] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [reqFormError, setReqFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!open || !isMounted) return null;

  const handleSubmit = async () => {
    setReqFormError(null);
    if (!reqItemId) {
      setReqFormError('Please select an item.');
      return;
    }
    if (reqQuantity < 1) {
      setReqFormError('Quantity must be at least 1.');
      return;
    }
    if (!reqSiteId.trim()) {
      setReqFormError('Please enter a site.');
      return;
    }
    if (reqReason.trim().length < 10) {
      setReqFormError('Reason must be at least 10 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalItemId = reqItemId;
      const matchedSite = sites.find(s => s.name.toLowerCase() === reqSiteId.trim().toLowerCase());
      const siteIdToSend = matchedSite ? matchedSite.id : reqSiteId.trim();
      const success = await onSubmit(finalItemId, reqQuantity, siteIdToSend, reqReason.trim());
      if (success) {
        setReqItemId('');
        setReqSpecificItemId('');
        setReqQuantity(1);
        setReqSiteId('');
        setReqReason('');
        onClose();
      }
    } catch (err) {
      setReqFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
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
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>Submit an asset request for approval</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.5rem', padding: '4px' }}
          >
            ×
          </button>
        </div>

        {/* Form Body */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1.25rem' }}>
          {reqFormError && (
            <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 8, fontSize: '0.82rem', fontWeight: 500 }}>
              ⚠ {reqFormError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Item selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Asset / Consumable *</label>
              <select
                value={reqItemId}
                onChange={(e) => {
                  setReqItemId(e.target.value);
                }}
                style={{ padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', color: '#0f172a', width: '100%', backgroundColor: '#ffffff' }}
              >
                <option value="">-- Select an Item --</option>
                {inventoryItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {formatItemDisplayName(item.name)}{item.sku ? ` (${item.sku})` : ""}
                  </option>
                ))}
              </select>
              {reqItemId && (() => {
                const selectedItem = inventoryItems.find(i => i.id === reqItemId);
                const stock = selectedItem?.stock ?? 0;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                      <span style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}>
                        {getCategoryIcon(selectedItem?.category, selectedItem?.name)}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Available stock: {stock} units
                      </span>
                    </div>
                    {reqQuantity > stock && (
                      <span style={{ fontSize: '0.72rem', color: '#E85D00', fontWeight: 600 }}>
                        ⚠ Quantity exceeds current stock. Request will be flagged.
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Quantity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Quantity *</label>
              <input
                type="number"
                min="1"
                value={reqQuantity}
                onChange={(e) => setReqQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', color: '#0f172a', width: '120px' }}
              />
            </div>

            {/* Site selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Site *</label>
              <input
                type="text"
                list="sites-list"
                placeholder="Select or enter site name..."
                value={reqSiteId}
                onChange={(e) => setReqSiteId(e.target.value)}
                style={{ padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', color: '#0f172a', width: '100%' }}
              />
              <datalist id="sites-list">
                {sites.map(s => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
            </div>

            {/* Reason for Request */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Reason for Request * (min 10 chars)</label>
              <textarea
                rows={4}
                placeholder="Provide reasoning, e.g. New hire onboarding, replacing broken unit..."
                value={reqReason}
                onChange={(e) => setReqReason(e.target.value)}
                style={{ padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none', color: '#0f172a', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', backgroundColor: '#f8fafc' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', color: '#475569', backgroundColor: '#ffffff', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !reqItemId || reqQuantity < 1 || !reqSiteId.trim() || reqReason.trim().length < 10}
            style={{
              backgroundColor: '#6366F1',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '0.6rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)',
              transition: 'all 0.2s ease',
              opacity: isSubmitting ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = '#4F46E5';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(99, 102, 241, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = '#6366F1';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(99, 102, 241, 0.2)';
              }
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
