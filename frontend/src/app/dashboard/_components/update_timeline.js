const fs = require('fs');

let content = fs.readFileSync('RequestTimeline.tsx', 'utf8');

// Replace mapStatus, getStepConfig, and timeline node generation
const regex1 = /  const mapStatus = \(statusStr: string\): string => \{[\s\S]*?displayHistory\.unshift\(\{\s*status: 'AWAITING_OPS_MANAGER_APPROVAL',[\s\S]*?\}\);\s*\}/m;

const new_logic = `  const Badge = ({ children, type }: { children: React.ReactNode, type: 'ops' | 'inv' }) => {
    const isOps = type === 'ops';
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', padding: '0.15rem 0.5rem',
        borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 600,
        backgroundColor: isOps ? '#faf5ff' : '#eff6ff',
        color: isOps ? '#6b21a8' : '#1e40af',
        border: \`1px solid \${isOps ? '#e9d5ff' : '#bfdbfe'}\`,
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
      return \`\${datePart}, \${timePart}\`;
    } catch {
      return dateStr;
    }
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

    if (ascHistory.length === 0 && (status === 'PENDING' || status === 'PENDING_APPROVAL')) {
      ascHistory.push({
        status: 'PENDING_APPROVAL',
        timestamp: new Date().toISOString(),
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
          iconSvg: <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'currentColor' }} />,
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
          iconSvg: <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'currentColor' }} />,
          timestamp: evt.timestamp,
          boxText: evt.comment || 'Item released to user',
          bottomHtml: <span>Handled by: <strong>{evt.byName || 'Logistics Staff'}</strong></span>
        });
      }
      if (s === 'ITEM_RECEIVED') {
         nodes.push({
          type: 'received',
          title: 'ITEM RECEIVED',
          titleColor: '#16a34a',
          iconColor: '#16a34a',
          iconSvg: getApprovedIcon(),
          timestamp: evt.timestamp,
          boxText: evt.comment || 'Receipt confirmed by requester',
          bottomHtml: <span>Received by: <strong>{evt.byName || requestedByName}</strong></span>
        });
      }
      if (s === 'REJECTED' || s === 'CANCELLED') {
        nodes.push({
          type: 'rejected',
          title: s === 'REJECTED' ? 'REJECTED' : 'CANCELLED',
          titleColor: '#dc2626',
          iconColor: '#dc2626',
          iconSvg: <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'currentColor' }} />,
          timestamp: evt.timestamp,
          boxText: evt.comment || \`Request \${s.toLowerCase()}\`,
          bottomHtml: <span>By: <strong>{evt.byName}</strong></span>
        });
      }
    }
    
    nodes.reverse();
    return nodes;
  };

  const displayNodes = buildNodes();`;

if (!regex1.test(content)) {
    console.log("Could not find first regex block");
    process.exit(1);
}

content = content.replace(regex1, new_logic);

// Second replacement block
const regex2 = /          \{displayHistory\.map\(\(evt, idx\) => \{[\s\S]*?\}\)\}\s*<\/div>/m;

const new_render_logic = `          {displayNodes.map((node, idx) => {
            return (
              <div key={idx} style={{ display: 'flex', gap: '1.25rem', position: 'relative', zIndex: 1, alignItems: 'flex-start', paddingBottom: idx === displayNodes.length - 1 ? '0' : '2rem' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  border: \`1.5px solid \${node.iconColor}\`,
                  color: node.iconColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '0px'
                }}>
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
                    <div style={{
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
                    }}>
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
        </div>`;

if (!regex2.test(content)) {
    console.log("Could not find second regex block");
    process.exit(1);
}

content = content.replace(regex2, new_render_logic);

fs.writeFileSync('RequestTimeline.tsx', content, 'utf8');
console.log("Updated RequestTimeline.tsx successfully!");
