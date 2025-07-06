import providerManager from '../../../lib/providers.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const offset = searchParams.get('offset') || '0';
    const limit = searchParams.get('limit') || '20';

    if (!query) {
      return Response.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Получаем рабочие провайдеры
    const providers = await providerManager.getProviders();
    
    if (!providers || providers.length === 0) {
      console.error('No providers available');
      return Response.json({ error: 'No providers available' }, { status: 503 });
    }

    // Пробуем каждый провайдер
    let lastError = null;
    
    for (const provider of providers) {
      try {
        const url = `${provider}/v1/tracks/search?query=${encodeURIComponent(query)}&offset=${offset}&limit=${limit}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 секунд таймаут

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Проверяем структуру ответа
        if (!data || !data.data) {
          throw new Error('Invalid response structure');
        }

        // Валидируем и очищаем данные треков
        const tracks = data.data
          .filter(track => track && track.id && track.title)
          .map(track => ({
            id: track.id || '',
            title: track.title || 'Без названия',
            duration: track.duration || 0,
            play_count: track.play_count || 0,
            repost_count: track.repost_count || 0,
            like_count: track.like_count || 0,
            user: {
              id: track.user?.id || '',
              name: track.user?.name || 'Неизвестный исполнитель',
              handle: track.user?.handle || '',
              profile_picture: track.user?.profile_picture || null
            },
            artwork: track.artwork || {
              '150x150': 'https://audius.co/favicon.ico',
              '480x480': 'https://audius.co/favicon.ico',
              '1000x1000': 'https://audius.co/favicon.ico'
            },
            album: track.album ? {
              id: track.album.id || '',
              title: track.album.title || ''
            } : null,
            genre: track.genre || '',
            mood: track.mood || '',
            tags: track.tags || [],
            description: track.description || '',
            download: track.download || null,
            stream_url: track.stream_url || null
          }));

        console.log(`Search successful via ${provider}: ${tracks.length} tracks found`);
        
        return Response.json({
          data: tracks,
          provider: provider,
          query: query,
          offset: parseInt(offset),
          limit: parseInt(limit)
        });

      } catch (error) {
        console.warn(`Provider ${provider} failed:`, error.message);
        lastError = error;
        continue; // Пробуем следующий провайдер
      }
    }

    // Если все провайдеры не сработали, возвращаем демо данные
    console.warn('All providers failed, returning demo data');
    
    const demoTracks = [
      {
        id: 'demo-1',
        title: 'Demo Track 1',
        duration: 180,
        play_count: 1000,
        repost_count: 50,
        like_count: 200,
        user: {
          id: 'demo-user-1',
          name: 'Demo Artist',
          handle: 'demoartist',
          profile_picture: 'https://audius.co/favicon.ico'
        },
        artwork: {
          '150x150': 'https://audius.co/favicon.ico',
          '480x480': 'https://audius.co/favicon.ico',
          '1000x1000': 'https://audius.co/favicon.ico'
        },
        album: null,
        genre: 'Demo',
        mood: 'Happy',
        tags: ['demo'],
        description: 'This is a demo track',
        download: null,
        stream_url: null
      },
      {
        id: 'demo-2',
        title: 'Demo Track 2',
        duration: 240,
        play_count: 2000,
        repost_count: 100,
        like_count: 400,
        user: {
          id: 'demo-user-2',
          name: 'Demo Producer',
          handle: 'demoproducer',
          profile_picture: 'https://audius.co/favicon.ico'
        },
        artwork: {
          '150x150': 'https://audius.co/favicon.ico',
          '480x480': 'https://audius.co/favicon.ico',
          '1000x1000': 'https://audius.co/favicon.ico'
        },
        album: null,
        genre: 'Demo',
        mood: 'Chill',
        tags: ['demo', 'chill'],
        description: 'Another demo track',
        download: null,
        stream_url: null
      }
    ];

    return Response.json({
      data: demoTracks,
      provider: 'demo',
      query: query,
      offset: parseInt(offset),
      limit: parseInt(limit),
      warning: 'Using demo data due to provider issues'
    });

  } catch (error) {
    console.error('Search API error:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 