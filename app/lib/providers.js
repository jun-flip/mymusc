// Глобальный кэш провайдеров с приоритетом
let cachedProviders = [];
let lastFetch = 0;
let lastHealthCheck = 0;
const CACHE_TTL = 1000 * 60 * 10; // 10 минут
const HEALTH_CHECK_TTL = 1000 * 60 * 5; // 5 минут

// Базовые провайдеры для fallback
const BASE_PROVIDERS = [
  'https://api.audius.co/v1',
  'https://discoveryprovider.audius.co/v1',
  'https://discoveryprovider.audius-prod-1.poised-bush-6f6f.audius.co/v1',
  'https://discoveryprovider.audius-prod-2.poised-bush-6f6f.audius.co/v1',
  'https://discoveryprovider.audius-prod-3.poised-bush-6f6f.audius.co/v1',
  'https://discoveryprovider.audius-prod-4.poised-bush-6f6f.audius.co/v1',
  'https://discoveryprovider.audius-prod-5.poised-bush-6f6f.audius.co/v1',
  'https://discoveryprovider.audius-prod-6.poised-bush-6f6f.audius.co/v1',
  'https://discoveryprovider.audius-prod-7.poised-bush-6f6f.audius.co/v1',
  'https://discoveryprovider.audius-prod-8.poised-bush-6f6f.audius.co/v1',
  'https://discoveryprovider.audius-prod-9.poised-bush-6f6f.audius.co/v1',
  'https://discoveryprovider.audius-prod-10.poised-bush-6f6f.audius.co/v1',
];

// Общие заголовки для запросов
const COMMON_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

// Функция для тестирования провайдера поиска
async function testSearchProvider(provider) {
  try {
    const response = await fetch(`${provider}/tracks/search?query=test&app_name=audiofeel&limit=1`, {
      timeout: 5000,
      headers: COMMON_HEADERS
    });
    
    if (response.ok) {
      const data = await response.json();
      return data && Array.isArray(data.data);
    }
    return false;
  } catch {
    return false;
  }
}

// Функция для тестирования провайдера стриминга
async function testStreamProvider(provider) {
  try {
    const response = await fetch(`${provider}/tracks/12345/stream?app_name=audiofeel`, {
      timeout: 5000,
      redirect: 'manual',
      headers: COMMON_HEADERS
    });
    
    // Для стриминга нас интересуют 302 редиректы или 404 (трек не найден, но API работает)
    return response.status === 302 || response.status === 404;
  } catch {
    return false;
  }
}

// Функция для получения и проверки провайдеров
async function getProviders() {
  const now = Date.now();
  
  // Если кэш актуален, возвращаем его
  if (cachedProviders.length > 0 && now - lastFetch < CACHE_TTL) {
    return cachedProviders;
  }
  
  // Если нужно обновить кэш
  if (now - lastFetch >= CACHE_TTL) {
    console.log('Updating providers cache...');
    
    try {
      // Пытаемся получить актуальные провайдеры от Audius
      const res = await fetch('https://api.audius.co/v1/discovery_providers', {
        timeout: 5000,
        headers: COMMON_HEADERS
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          const newProviders = data.data.map(p => p.endpoint.replace(/\/$/, '') + '/v1');
          cachedProviders = [...newProviders, ...BASE_PROVIDERS];
          lastFetch = now;
          console.log(`Updated providers: ${cachedProviders.length} total`);
          return cachedProviders;
        }
      }
    } catch (error) {
      console.error('Error fetching providers from Audius:', error);
    }
    
    // Если не удалось получить от Audius, используем базовые
    cachedProviders = BASE_PROVIDERS;
    lastFetch = now;
    console.log(`Using base providers: ${cachedProviders.length} total`);
  }
  
  return cachedProviders;
}

// Функция для получения рабочих провайдеров поиска
async function getWorkingSearchProviders() {
  const providers = await getProviders();
  const now = Date.now();
  
  // Проверяем здоровье провайдеров каждые 5 минут
  if (now - lastHealthCheck >= HEALTH_CHECK_TTL) {
    console.log('Checking search providers health...');
    lastHealthCheck = now;
    
    const healthChecks = await Promise.allSettled(
      providers.map(async (provider) => {
        const isWorking = await testSearchProvider(provider);
        return { provider, isWorking };
      })
    );
    
    const workingProviders = healthChecks
      .filter(result => result.status === 'fulfilled' && result.value.isWorking)
      .map(result => result.value.provider);
    
    if (workingProviders.length > 0) {
      // Обновляем кэш с рабочими провайдерами в начале
      cachedProviders = [...workingProviders, ...providers.filter(p => !workingProviders.includes(p))];
      console.log(`Found ${workingProviders.length} working search providers`);
    }
  }
  
  return cachedProviders;
}

// Функция для получения рабочих провайдеров стриминга
async function getWorkingStreamProviders() {
  const providers = await getProviders();
  const now = Date.now();
  
  // Проверяем здоровье провайдеров каждые 5 минут
  if (now - lastHealthCheck >= HEALTH_CHECK_TTL) {
    console.log('Checking stream providers health...');
    lastHealthCheck = now;
    
    const healthChecks = await Promise.allSettled(
      providers.map(async (provider) => {
        const isWorking = await testStreamProvider(provider);
        return { provider, isWorking };
      })
    );
    
    const workingProviders = healthChecks
      .filter(result => result.status === 'fulfilled' && result.value.isWorking)
      .map(result => result.value.provider);
    
    if (workingProviders.length > 0) {
      // Обновляем кэш с рабочими провайдерами в начале
      cachedProviders = [...workingProviders, ...providers.filter(p => !workingProviders.includes(p))];
      console.log(`Found ${workingProviders.length} working stream providers`);
    }
  }
  
  return cachedProviders;
}

// Функция для принудительного обновления кэша
function forceUpdateCache() {
  lastFetch = 0;
  lastHealthCheck = 0;
  cachedProviders = [];
  console.log('Forced cache update');
}

// Экспортируем функции
export {
  getWorkingSearchProviders,
  getWorkingStreamProviders,
  forceUpdateCache,
  COMMON_HEADERS
}; 