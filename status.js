export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  const { CASHFREE_CLIENT_ID, CASHFREE_CLIENT_SECRET, CASHFREE_ENV = 'sandbox', CASHFREE_API_VERSION = '2025-01-01' } = process.env;
  if (!CASHFREE_CLIENT_ID || !CASHFREE_CLIENT_SECRET) return res.status(500).json({ message: 'Cashfree environment variables are not configured.' });
  const orderId = String(req.query?.orderId || '').trim();
  if (!orderId) return res.status(400).json({ message: 'orderId is required.' });
  try {
    const base = CASHFREE_ENV === 'sandbox' ? 'https://sandbox.cashfree.com/pg' : 'https://api.cashfree.com/pg';
    const r = await fetch(`${base}/orders/${encodeURIComponent(orderId)}/payments`, { headers: { 'x-client-id': CASHFREE_CLIENT_ID, 'x-client-secret': CASHFREE_CLIENT_SECRET, 'x-api-version': CASHFREE_API_VERSION, Accept: 'application/json' } });
    const data = await r.json().catch(() => ([]));
    if (!r.ok) return res.status(r.status).json({ message: data.message || 'Unable to verify payment.' });
    const payments = Array.isArray(data) ? data : [];
    const success = payments.some(p => p?.payment_status === 'SUCCESS');
    const pending = payments.some(p => p?.payment_status === 'PENDING');
    return res.status(200).json({ paid: success, status: success ? 'SUCCESS' : pending ? 'PENDING' : 'FAILED' });
  } catch (e) { return res.status(500).json({ message: e.message || 'Payment verification failed.' }); }
}
