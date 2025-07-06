import { NextResponse } from 'next/server';

let cachedProviders = null;
let lastFetch = 0;
const CACHE_TTL = 1000 * 60 * 10; // 10 минут

async function getProviders() {
  const now = Date.now();
  if (cachedProviders && now - lastFetch < CACHE_TTL) return cachedProviders;
  try {
    const res = await fetch('https://api.audius.co/v1/discovery_providers');
    if (!res.ok) {
      throw new Error(`Failed to fetch providers: ${res.status}`);
    }
    const data = await res.json();
    if (data.data && Array.isArray(data.data)) {
      cachedProviders = data.data.map(p => p.endpoint.replace(/\/$/, '') + '/v1');
      lastFetch = now;
      return cachedProviders;
    }
  } catch (error) {
    console.error('Error fetching providers:', error);
  }
  // fallback
  return [
    'https://api.audius.co/v1',
    'https://discoveryprovider.audius-prod-6.poised-bush-6f6f.audius.co/v1',
    'https://discoveryprovider.audius-prod-7.poised-bush-6f6f.audius.co/v1',
    'https://discoveryprovider.audius-prod-8.poised-bush-6f6f.audius.co/v1',
  ];
}

export async function GET(req, { params }) {
  try {
    params = await params;
    const { id } = params;
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Valid track id required' }, { status: 400 });
    }

    // Проверяем, что id содержит только цифры
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid track id format' }, { status: 400 });
    }

    let lastError = null;
    const providers = await getProviders();
    
    for (const base of providers) {
      try {
        const url = `${base}/tracks/${id}/stream?app_name=audiofeel`;
        console.log(`Trying to get stream from: ${base} for track ${id}`);
        
        const response = await fetch(url, { 
          redirect: 'manual',
          timeout: 10000 // 10 секунд таймаут
        });
        
        if (response.status === 302) {
          const redirectUrl = response.headers.get('location');
          if (redirectUrl) {
            console.log(`Redirecting to: ${redirectUrl}`);
            return NextResponse.redirect(redirectUrl);
          } else {
            lastError = 'Invalid redirect response';
          }
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
        
        console.error(`Provider ${base} failed with status ${response.status}:`, lastError);
      } catch (e) {
        lastError = e?.message || e;
        console.error(`Provider ${base} threw error:`, e);
      }
    }
    
    console.error('All providers failed, last error:', lastError);
    return NextResponse.json({ 
      error: 'All Audius providers failed', 
      details: lastError,
      message: 'Не удалось получить аудио поток. Попробуйте позже.'
    }, { status: 502 });
  } catch (error) {
    console.error('Unexpected error in stream endpoint:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Внутренняя ошибка сервера'
    }, { status: 500 });
  }
} 