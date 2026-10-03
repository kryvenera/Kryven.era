export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { CASHFREE_CLIENT_ID, CASHFREE_CLIENT_SECRET, CASHFREE_ENV = 'sandbox', CASHFREE_API_VERSION = '2025-01-01' } = process.env;
  if (!CASHFREE_CLIENT_ID || !CASHFREE_CLIENT_SECRET) return res.status(500).json({ message: 'Cashfree environment variables are not configured.' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const amount = Number(body.amount);
    const orderId = String(body.orderId || '').trim();
    const customer = body.customer || {};
    if (!orderId || !Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: 'Invalid order details.' });
    const phone = String(customer.phone || '').replace(/\D/g, '').slice(-10);
    if (phone.length !== 10) return res.status(400).json({ message: 'A valid 10-digit customer phone is required.' });
    const origin = req.headers.origin || `https://${req.headers.host}`;
    const base = CASHFREE_ENV === 'sandbox' ? 'https://sandbox.cashfree.com/pg' : 'https://api.cashfree.com/pg';
    const payload = {
      order_id: orderId,
      order_amount: Number(amount.toFixed(2)),
      order_currency: 'INR',
      customer_details: {
        customer_id: String(customer.id || orderId).slice(0, 50),
        customer_name: String(customer.name || 'Kryven Customer').slice(0, 100),
        customer_email: String(customer.email || 'customer@kryvenera.com').slice(0, 100),
        customer_phone: phone
      },
      order_meta: {
        return_url: `${origin}/checkout.html?order_id={order_id}`,
        notify_url: `${origin}/api/cashfree/webhook`
      }
    };
    const r = await fetch(`${base}/orders`, {
      method: 'POST',
      headers: { 'x-client-id': CASHFREE_CLIENT_ID, 'x-client-secret': CASHFREE_CLIENT_SECRET, 'x-api-version': CASHFREE_API_VERSION, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(r.status).json({ message: data.message || 'Cashfree could not create the order.', details: data });
    return res.status(200).json({ payment_session_id: data.payment_session_id, order_id: data.order_id, mode: CASHFREE_ENV === 'sandbox' ? 'sandbox' : 'production' });
  } catch (e) { return res.status(500).json({ message: e.message || 'Cashfree order creation failed.' }); }
}
