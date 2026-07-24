'use client';

import { useState } from 'react';
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

export function NewRequestModal({ open, onClose, inventoryItems, sites, onSubmit }: NewRequestModalProps) {
  const [reqItemId, setReqItemId] = useState('');
  const [reqSpecificItemId, setReqSpecificItemId] = useState('');
  const [reqQuantity, setReqQuantity] = useState(1);
  const [reqSiteId, setReqSiteId] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [reqFormError, setReqFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

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
          maxWidth: '480px',
          height: '100%',
          backgroundColor: '#ffffff',
          boxShadow: '-10px 0 25px -5px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>New Request</h2>
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
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                    {item.name}{item.sku ? ` (${item.sku})` : ""}
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



            {/* Site input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label htmlFor="site-input" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Site *</label>
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

            {/* Reason */}
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
          <div style={{ position: 'sticky', bottom: 0, padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', backgroundColor: '#f8fafc', zIndex: 10 }}>
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
              backgroundColor: '#E85D00',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '0.5rem 1.25rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: (isSubmitting || !reqItemId || reqQuantity < 1 || !reqSiteId.trim() || reqReason.trim().length < 10) ? 'not-allowed' : 'pointer',
              opacity: (isSubmitting || !reqItemId || reqQuantity < 1 || !reqSiteId.trim() || reqReason.trim().length < 10) ? 0.5 : 1,
              transition: 'all 0.15s ease'
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
