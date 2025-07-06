import providerManager from '../../../lib/providers.js';

// Демо данные для fallback
const DEMO_TRACKS = [
  {
    id: 'demo-1',
    title: 'Demo Track 1 - Electronic Vibes',
    user: { name: 'Demo Artist' },
    artwork: { '150x150': 'https://via.placeholder.com/150x150/ff5500/ffffff?text=Demo+1' },
    permalink: '/demo-1',
    streamId: 'demo-1'
  },
  {
    id: 'demo-2', 
    title: 'Demo Track 2 - Ambient Sounds',
    user: { name: 'Demo Producer' },
    artwork: { '150x150': 'https://via.placeholder.com/150x150/ff5500/ffffff?text=Demo+2' },
    permalink: '/demo-2',
    streamId: 'demo-2'
  },
  {
    id: 'demo-3',
    title: 'Demo Track 3 - Chill Beats',
    user: { name: 'Demo Musician' },
    artwork: { '150x150': 'https://via.placeholder.com/150x150/ff5500/ffffff?text=Demo+3' },
    permalink: '/demo-3',
    streamId: 'demo-3'
  }
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query || !query.trim()) {
      return Response.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Получаем рабочие провайдеры
    const providers = await providerManager.getProviders();
    
    if (!providers || providers.length === 0) {
      console.warn('No providers available, returning demo tracks');
      // Возвращаем демо треки если все провайдеры недоступны
      const demoResults = DEMO_TRACKS.filter(track => 
        track.title.toLowerCase().includes(query.toLowerCase()) ||
        track.user.name.toLowerCase().includes(query.toLowerCase())
      );
      return Response.json({ 
        data: demoResults,
        demo: true,
        message: 'Using demo tracks - Audius providers unavailable'
      });
    }

    // Пробуем каждый провайдер
    let lastError = null;
    
    for (const provider of providers) {
      try {
        // Пробуем разные варианты URL для поиска
        const urls = [
          `${provider}/v1/tracks/search?query=${encodeURIComponent(query.trim())}&app_name=audiofeel&limit=${limit}&offset=${offset}`,
          `${provider}/tracks/search?query=${encodeURIComponent(query.trim())}&app_name=audiofeel&limit=${limit}&offset=${offset}`,
          `${provider}/v1/tracks/search?query=${encodeURIComponent(query.trim())}&limit=${limit}&offset=${offset}`,
          `${provider}/tracks/search?query=${encodeURIComponent(query.trim())}&limit=${limit}&offset=${offset}`
        ];
        
        let success = false;
        let response = null;
        let data = null;
        
        for (const url of urls) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд таймаут

            response = await fetch(url, {
              method: 'GET',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
              },
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              data = await response.json();
              if (data && Array.isArray(data.data)) {
                success = true;
                break;
              }
            }
          } catch (urlError) {
            console.warn(`URL ${url} failed:`, urlError.message);
            continue;
          }
        }
        
        if (!success || !data) {
          console.warn(`Provider ${provider} failed: HTTP ${response?.status || 'fetch failed'}`);
          throw new Error(`HTTP ${response?.status || 'fetch failed'}: ${response?.statusText || 'Network error'}`);
        }

        console.log(`Search successful via ${provider}: ${data.data.length} tracks`);
        return Response.json(data);

      } catch (error) {
        console.warn(`Provider ${provider} failed:`, error.message);
        lastError = error;
        continue; // Пробуем следующий провайдер
      }
    }

    // Если все провайдеры не сработали, возвращаем демо треки
    console.warn('All providers failed, returning demo tracks');
    const demoResults = DEMO_TRACKS.filter(track => 
      track.title.toLowerCase().includes(query.toLowerCase()) ||
      track.user.name.toLowerCase().includes(query.toLowerCase())
    );
    
    return Response.json({ 
      data: demoResults,
      demo: true,
      message: 'Using demo tracks - all Audius providers failed',
      error: lastError?.message
    });

  } catch (error) {
    console.error('Search API error:', error);
    return Response.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 