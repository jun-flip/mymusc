import providerManager from '../../../lib/providers.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get('id');

    if (!trackId) {
      return Response.json({ error: 'Track ID is required' }, { status: 400 });
    }

    // Получаем рабочие провайдеры
    const providers = await providerManager.getProviders();
    
    if (!providers || providers.length === 0) {
      console.error('No providers available for streaming');
      return Response.json({ 
        error: 'No providers available',
        details: 'All Audius discovery providers are currently unavailable'
      }, { status: 503 });
    }

    // Пробуем каждый провайдер
    let lastError = null;
    let triedProviders = [];
    
    for (const provider of providers) {
      triedProviders.push(provider);
      
      try {
        const url = `${provider}/v1/tracks/${trackId}/stream`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 секунд таймаут

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'audio/*, application/json',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorDetails = {
            provider: provider,
            status: response.status,
            statusText: response.statusText,
            url: url
          };
          
          // Логируем детали ошибки для диагностики
          console.warn(`Provider ${provider} failed for track ${trackId}:`, errorDetails);
          
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Проверяем, что это аудио файл
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('audio/')) {
          throw new Error(`Invalid content type: ${contentType}`);
        }

        // Получаем размер файла
        const contentLength = response.headers.get('content-length');
        
        console.log(`Stream successful via ${provider} for track ${trackId}`);
        
        // Возвращаем аудио поток
        return new Response(response.body, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Length': contentLength || '',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD',
            'Access-Control-Allow-Headers': 'Range, User-Agent, Accept'
          }
        });

      } catch (error) {
        console.warn(`Provider ${provider} failed for track ${trackId}:`, error.message);
        lastError = error;
        continue; // Пробуем следующий провайдер
      }
    }

    // Если все провайдеры не сработали
    console.error(`All providers failed for track ${trackId}:`, {
      triedProviders: triedProviders.length,
      lastError: lastError?.message,
      trackId: trackId
    });
    
    // Формируем информативное сообщение об ошибке
    let errorMessage = 'Трек недоступен для воспроизведения';
    let errorDetails = '';
    
    if (lastError?.message?.includes('502') || lastError?.message?.includes('503')) {
      errorMessage = 'Audius сервис временно недоступен';
      errorDetails = 'Все discovery провайдеры возвращают ошибки. Попробуйте позже.';
    } else if (lastError?.message?.includes('404')) {
      errorMessage = 'Трек не найден';
      errorDetails = 'Возможно, трек был удалён или недоступен на всех провайдерах.';
    } else if (lastError?.message?.includes('timeout') || lastError?.message?.includes('abort')) {
      errorMessage = 'Превышено время ожидания';
      errorDetails = 'Серверы Audius отвечают слишком медленно.';
    } else {
      errorDetails = `Проблема с доступом к треку. Попробовано провайдеров: ${triedProviders.length}`;
    }
    
    return Response.json({ 
      error: errorMessage,
      details: errorDetails,
      trackId: trackId,
      triedProviders: triedProviders.length,
      lastError: lastError?.message
    }, { status: 404 });

  } catch (error) {
    console.error('Stream API error:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error.message,
      trackId: trackId
    }, { status: 500 });
  }
} 