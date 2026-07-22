'use client';

import { useState } from 'react';

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
                    {item.name} ({item.sku})
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
