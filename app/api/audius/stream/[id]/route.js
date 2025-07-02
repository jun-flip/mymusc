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

export async function GET(req, { params }) {
  params = await params;
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Track id required' }, { status: 400 });
  }
  let lastError = null;
  const providers = await getProviders();
  for (const base of providers) {
    try {
      const url = `${base}/tracks/${id}/stream?app_name=audiofeel`;
      const response = await fetch(url, { redirect: 'manual' });
      if (response.status === 302) {
        const redirectUrl = response.headers.get('location');
        return NextResponse.redirect(redirectUrl);
      } else if (response.status === 404) {
        lastError = 'Track not found on Audius';
      } else if (response.status === 403) {
        lastError = 'Forbidden by Audius provider';
      } else if (response.status >= 400 && response.status < 500) {
        lastError = `Audius client error: ${response.status}`;
      } else if (response.status >= 500) {
        lastError = `Audius server error: ${response.status}`;
      } else {
        lastError = `Failed to get stream url from Audius: ${response.status}`;
      }
    } catch (e) {
      lastError = e?.message || e;
    }
  }
  return NextResponse.json({ error: 'All Audius providers failed', details: lastError }, { status: 502 });
} 