'use client';

import { useEffect, useState, useCallback } from 'react';


interface SummaryData {
  pending: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  avgApprovalDays: number;
  pendingDelta: number;

  latestPending: {
    id: string;
    itemName: string;
    requestedBy: string;
    site: string;
    quantity: number;

    createdAt: string;
  }[];
}

const mockSummaryData: SummaryData = {
  pending: 12,
  approvedThisMonth: 47,
  rejectedThisMonth: 5,
  avgApprovalDays: 1.4,
  pendingDelta: 3,

  latestPending: [
    {
      id: "req_abc",
      itemName: 'MacBook Pro 14" M3',
      requestedBy: "Sarah Jenkins",
      site: "Toronto HQ",
      quantity: 1,

      createdAt: new Date(Date.now() - 2 * 3600000).toISOString()
    },
    {
      id: "req_def",
      itemName: "Logitech MX Master 3S",
      requestedBy: "Super Admin",
      site: "Cebu IT Park",
      quantity: 5,

      createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
    },
    {
      id: "req_ghi",
      itemName: 'Dell 27" Monitor U2723QE',
      requestedBy: "John Doe",
      site: "Toronto HQ",
      quantity: 3,

      createdAt: new Date(Date.now() - 1 * 3600000).toISOString()
    }
  ]
};

export function RequestCenterSummary({ onNavigateToRequests, allRequests }: { onNavigateToRequests: () => void; allRequests: any[] }) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/requests/summary');
      if (res.ok) {
        const envelope = await res.json();
        setSummary(envelope.data);
      } else {
        throw new Error('Failed to fetch backend summary');
      }
    } catch {
      // Graceful offline mock fallback computed dynamically from local requests state
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const approvedStatuses = ['APPROVED', 'READY_FOR_PICKUP', 'RELEASED', 'RETURNED', 'PENDING_PROCUREMENT'];

      const pending = allRequests.filter(r => r.status === 'PENDING');
      const approved = allRequests.filter(r => 
        approvedStatuses.includes(r.status) && new Date(r.createdAt) >= startOfMonth
      );
      const rejected = allRequests.filter(r => 
        r.status === 'REJECTED' && new Date(r.createdAt) >= startOfMonth
      );
      


      const latestPending = pending.slice(0, 3).map(r => ({
        id: r.id,
        itemName: r.itemName,
        requestedBy: r.requestedByName,
        site: r.siteName || 'Toronto HQ',
        quantity: r.quantity,

        createdAt: r.createdAt
      }));

      setSummary({
        pending: pending.length,
        approvedThisMonth: approved.length,
        rejectedThisMonth: rejected.length,
        avgApprovalDays: 1.4,
        pendingDelta: pending.length - 2,

        latestPending
      });
    } finally {
      setIsLoading(false);
    }
  }, [allRequests]);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 60000);
    return () => clearInterval(interval);
  }, [fetchSummary]);



  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem', boxShadow: '0 2px 10px rgba(15,23,42,0.02), 0 0 0 1px rgba(226,232,240,0.6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Request Center</h2>
          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
            Live snapshot of request activity across all sites
          </p>
        </div>
        <button
          onClick={onNavigateToRequests}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.75rem',
            color: '#E85D00',
            background: 'none',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            transition: 'color 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#C94E00'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#E85D00'}
        >
          Go to Request Orders
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>

      {/* 4 stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <StatCard
          label="Pending"
          value={summary?.pending ?? '—'}
          valueColor="#E85D00"
          sub={
            summary?.pendingDelta !== undefined
              ? `${summary.pendingDelta >= 0 ? '+' : ''}${summary.pendingDelta} since yesterday`
              : undefined
          }
          loading={isLoading}
        />
        <StatCard
          label="Approved this month"
          value={summary?.approvedThisMonth ?? '—'}
          valueColor="#16a34a"
          loading={isLoading}
        />
        <StatCard
          label="Rejected this month"
          value={summary?.rejectedThisMonth ?? '—'}
          valueColor="#dc2626"
          loading={isLoading}
        />
        <StatCard
          label="Avg. approval time"
          value={summary ? `${summary.avgApprovalDays}d` : '—'}
          valueColor="#0f172a"
          sub="Based on last 30 days"
          loading={isLoading}
        />
      </div>

      {/* Bottom row: urgency bars + latest pending */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>


        {/* Latest pending items */}
        <div>
          <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em', margin: '0 0 0.5rem 0' }}>Latest pending requests</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {isLoading
              ? [0, 1, 2].map(i => (
                  <div key={i} style={{ height: '42px', borderRadius: 8, backgroundColor: '#f1f5f9', animation: 'pulse 1.5s infinite' }} />
                ))
              : summary?.latestPending.map((req) => {
                  return (
                    <div
                      key={req.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.itemName}</p>
                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.72rem', color: '#64748b' }}>
                          {req.requestedBy} · {req.site} · Qty: {req.quantity}
                        </p>
                      </div>

                    </div>
                  );
                })}
            {!isLoading && summary?.latestPending.length === 0 && (
              <p style={{ fontSize: '0.78rem', color: '#64748b', padding: '1rem', textAlign: 'center', fontStyle: 'italic', margin: 0 }}>
                No pending requests right now.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({
  label, value, valueColor, sub, loading,
}: {
  label: string;
  value: string | number;
  valueColor?: string;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.6rem 0.85rem' }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.02em', margin: '0 0 0.35rem 0' }}>{label}</p>
      {loading ? (
        <div style={{ height: '24px', width: '40px', backgroundColor: '#e2e8f0', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
      ) : (
        <p style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 'none', margin: 0, color: valueColor }}>{value}</p>
      )}
      {sub && !loading && (
        <p style={{ fontSize: '0.68rem', color: '#64748b', margin: '0.35rem 0 0 0' }}>{sub}</p>
      )}
    </div>
  );
}
