import { NextResponse } from 'next/server';
import { getWorkingStreamProviders, COMMON_HEADERS } from '../../../../lib/providers';

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
    const providers = await getWorkingStreamProviders();
    
    for (const base of providers) {
      try {
        const url = `${base}/tracks/${id}/stream?app_name=audiofeel`;
        console.log(`Trying to get stream from: ${base} for track ${id}`);
        
        const response = await fetch(url, { 
          redirect: 'manual',
          timeout: 10000,
          headers: COMMON_HEADERS
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
    
    console.error('All stream providers failed, last error:', lastError);
    
    // Fallback для демо-треков
    if (id === '12345' || id === '67890') {
      console.log('Returning demo stream for track:', id);
      const demoUrl = id === '12345' 
        ? 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
        : 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
      return NextResponse.redirect(demoUrl);
    }
    
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