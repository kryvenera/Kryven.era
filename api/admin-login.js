// Server-side admin PIN check. The PIN lives only in the ADMIN_PIN environment variable (never in browser code).
import { rateLimit, safeEqual, signAdminToken } from './_security.js';

export default async function handler(req, res){
  res.setHeader('Cache-Control', 'no-store');
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  // Brute-force protection: 5 attempts per 15 minutes per IP.
  if(!rateLimit(req, res, 'admin-login', 5, 15 * 60 * 1000)) return;
  const expected = process.env.ADMIN_PIN || '';
  if(!expected) return res.status(503).json({ error: 'ADMIN_PIN is not set in Vercel environment variables' });
  let body = req.body;
  if(typeof body === 'string'){ try{ body = JSON.parse(body) }catch{ body = {} } }
  const pin = String(body?.pin ?? '').trim().slice(0, 100);
  if(!pin || !safeEqual(pin, expected)) return res.status(401).json({ error: 'Incorrect admin PIN' });
  return res.status(200).json({ ok: true, token: signAdminToken() });
}
