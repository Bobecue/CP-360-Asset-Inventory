export type NewRequest = {
  item: string;
  quantity: number;
  reason: string;
  urgency: string;
};

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function submitRequest(body: NewRequest) {
  const res = await fetch(`${BASE}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchRequests(query = '') {
  const res = await fetch(`${BASE}/requests${query}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateRequest(id: string, action: 'approve' | 'reject', comment?: string) {
  const res = await fetch(`${BASE}/requests/${id}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function cancelRequest(id: string) {
  const res = await fetch(`${BASE}/requests/${id}/withdraw`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment: 'Cancelled by requester.' }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addRequestComment(id: string, comment: string) {
  const res = await fetch(`${BASE}/requests/${id}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function confirmReceipt(id: string, userEmail: string) {
  const res = await fetch(`${BASE}/movements/${id}/confirm-receipt`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'x-user': userEmail
    }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function approveStaff(id: string, userEmail: string, comment?: string) {
  const res = await fetch(`${BASE}/movements/${id}/approve-staff`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'x-user': userEmail
    },
    body: JSON.stringify({ comment })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function approveOps(id: string, userEmail: string, comment?: string) {
  const res = await fetch(`${BASE}/movements/${id}/approve-ops`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'x-user': userEmail
    },
    body: JSON.stringify({ comment })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function preparePickup(id: string, userEmail: string, comment?: string) {
  const res = await fetch(`${BASE}/movements/${id}/prepare-pickup`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'x-user': userEmail
    },
    body: JSON.stringify({ comment })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
