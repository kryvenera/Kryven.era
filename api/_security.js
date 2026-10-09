import crypto from 'crypto';

const buckets = new Map();

export function clientIp(req) {
  const xf = String(req.headers['x-forwarded-for'] || '')
    .split(',')[0].trim();
  return xf || req.socket?.remoteAddress || 'unknown';
}

export function rateLimit(req, res, name, limit, windowMs) {
  const now = Date.now();
  const key = `${name}:${clientIp(req)}`;
  let b = buckets.get(key);

  if (!b || b.reset <= now) {
    b = { count: 0, reset: now + windowMs };
    buckets.set(key, b);
  }

  b.count++;

  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.reset <= now) buckets.delete(k);
    }
  }

  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader(
    'X-RateLimit-Remaining',
    String(Math.max(0, limit - b.count))
  );

  if (b.count > limit) {
    res.setHeader(
      'Retry-After',
      String(Math.ceil((b.reset - now) / 1000))
    );
    res.status(429).json({
      error: 'Too many requests. Please wait a moment and try again.'
    });
    return false;
  }

  return true;
}

export const ORDER_ID_RE = /^[A-Za-z0-9_-]{1,50}$/;

export function cleanText(v, max = 100) {
  return String(v ?? '')
    .replace(/[\u0000-\u001f\u007f<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function validEmail(v) {
  const s = String(v ?? '').trim();
  return s.length <= 120 &&
    /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s) ? s : '';
}

export function supabaseConfig() {
  const url = process.env.SUPABASE_URL ||
    'https://iisezaptudifgwkjxnkh.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    'sb_publishable_oGorfrDciMl6GGOllbTjfg_Sr3YzDsH';
  const table = process.env.SUPABASE_TABLE ||
    'Allow public order insert';

  return {
    url,
    key,
    table,
    rest: `${url}/rest/v1/${encodeURIComponent(table)}`
  };
}

export function signAdminToken(ttlMs = 8 * 60 * 60 * 1000) {
  const secret = process.env.ADMIN_TOKEN_SECRET ||
    process.env.ADMIN_PIN || '';
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + ttlMs })
  ).toString('base64url');

  const sig = crypto.createHmac('sha256', secret)
    .update(payload).digest('base64url');

  return `${payload}.${sig}`;
}

export function safeEqual(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
    }
