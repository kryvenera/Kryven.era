export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  // Cashfree webhooks are received here. Final payment verification in the storefront
  // is performed server-side through /api/cashfree/status before marking an order paid.
  return res.status(200).json({ received: true });
}
