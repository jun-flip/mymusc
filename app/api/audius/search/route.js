import { NextResponse } from 'next/server';
import { getWorkingSearchProviders, COMMON_HEADERS } from '../../../lib/providers';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const offset = searchParams.get('offset') || 0;
  
  if (!q) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }
  
  let lastError = null;
  const providers = await getWorkingSearchProviders();
  
  for (const base of providers) {
    try {
      const url = `${base}/tracks/search?query=${encodeURIComponent(q)}&app_name=audiofeel&limit=20&offset=${offset}`;
      console.log(`Trying provider: ${base}`);
      
      const response = await fetch(url, {
        timeout: 8000,
        headers: COMMON_HEADERS
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Success from ${base}, data:`, data);
        
        if (!data || !Array.isArray(data.data)) {
          console.error(`Invalid data format from ${base}:`, data);
          continue;
        }
        
        return NextResponse.json(data);
      } else {
        lastError = await response.text();
        console.error(`Provider ${base} failed with status ${response.status}:`, lastError);
      }
    } catch (e) {
      lastError = e?.message || e;
      console.error(`Provider ${base} threw error:`, e);
    }
  }
  
  console.error('All providers failed, last error:', lastError);
  
  // Fallback с демо-данными если все провайдеры недоступны
  if (q.toLowerCase().includes('demo') || q.toLowerCase().includes('test')) {
    console.log('Returning demo data as fallback');
    return NextResponse.json({
      data: [
        {
          id: 'demo-1',
          title: 'Demo Track 1',
          user: { name: 'Demo Artist' },
          artwork: { '150x150': 'https://audius.co/favicon.ico' },
          permalink: '/track/demo-track-1-12345',
          duration: '3:45'
        },
        {
          id: 'demo-2',
          title: 'Demo Track 2',
          user: { name: 'Demo Artist' },
          artwork: { '150x150': 'https://audius.co/favicon.ico' },
          permalink: '/track/demo-track-2-67890',
          duration: '4:20'
        }
      ]
    });
  }
  
  return NextResponse.json({ 
    error: 'All Audius providers failed', 
    details: lastError,
    message: 'Сервис поиска временно недоступен. Попробуйте позже или поищите "demo" для тестовых треков.'
  }, { status: 502 });
} 