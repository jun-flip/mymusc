import { NextResponse } from 'next/server';

let cachedProviders = null;
let lastFetch = 0;
const CACHE_TTL = 1000 * 60 * 10; // 10 минут

async function getProviders() {
  const now = Date.now();
  if (cachedProviders && now - lastFetch < CACHE_TTL) return cachedProviders;
  try {
    const res = await fetch('https://api.audius.co/v1/discovery_providers');
    const data = await res.json();
    if (data.data && Array.isArray(data.data)) {
      cachedProviders = data.data.map(p => p.endpoint.replace(/\/$/, '') + '/v1');
      lastFetch = now;
      return cachedProviders;
    }
  } catch {}
  // fallback
  return [
    'https://api.audius.co/v1',
    'https://discoveryprovider.audius-prod-6.poised-bush-6f6f.audius.co/v1',
    'https://discoveryprovider.audius-prod-7.poised-bush-6f6f.audius.co/v1',
    'https://discoveryprovider.audius-prod-8.poised-bush-6f6f.audius.co/v1',
  ];
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const offset = searchParams.get('offset') || 0;
  if (!q) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }
  let lastError = null;
  const providers = await getProviders();
  for (const base of providers) {
    try {
      const url = `${base}/tracks/search?query=${encodeURIComponent(q)}&app_name=audiofeel&limit=20&offset=${offset}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      } else {
        lastError = await response.text();
      }
    } catch (e) {
      lastError = e?.message || e;
    }
  }
  return NextResponse.json({ error: 'All Audius providers failed', details: lastError }, { status: 502 });
} 