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

// Система управления провайдерами Audius API
class AudiusProviderManager {
  constructor() {
    this.providers = [];
    this.workingProviders = [];
    this.lastFetch = 0;
    this.lastHealthCheck = 0;
    this.isInitialized = false;
    this.healthCheckInterval = 5 * 60 * 1000; // 5 минут
    this.fetchInterval = 10 * 60 * 1000; // 10 минут
    
    // Резервные провайдеры на случай, если API недоступен
    this.fallbackProviders = [
      'https://audius-discovery-1.cultur3stake.com',
      'https://audius-discovery-2.cultur3stake.com', 
      'https://audius-discovery-3.cultur3stake.com',
      'https://audius-discovery-4.cultur3stake.com',
      'https://audius-discovery-5.cultur3stake.com',
      'https://audius-discovery-6.cultur3stake.com',
      'https://audius-discovery-7.cultur3stake.com',
      'https://audius-discovery-8.cultur3stake.com',
      'https://audius-discovery-9.cultur3stake.com',
      'https://audius-discovery-10.cultur3stake.com',
      'https://audius-discovery-11.cultur3stake.com',
      'https://audius-discovery-12.cultur3stake.com',
      'https://audius-discovery-13.cultur3stake.com',
      'https://audius-discovery-14.cultur3stake.com',
      'https://audius-discovery-15.cultur3stake.com',
      'https://audius-discovery-16.cultur3stake.com',
      'https://audius-discovery-17.cultur3stake.com',
      'https://audius-discovery-18.cultur3stake.com',
      'https://audius-discovery-19.cultur3stake.com',
      'https://audius-discovery-20.cultur3stake.com',
      'https://audius-discovery-21.cultur3stake.com',
      'https://audius-discovery-22.cultur3stake.com',
      'https://audius-discovery-23.cultur3stake.com',
      'https://audius-discovery-24.cultur3stake.com',
      'https://audius-discovery-25.cultur3stake.com',
      'https://audius-discovery-26.cultur3stake.com',
      'https://audius-discovery-27.cultur3stake.com',
      'https://audius-discovery-28.cultur3stake.com',
      'https://audius-discovery-29.cultur3stake.com',
      'https://audius-discovery-30.cultur3stake.com',
      'https://audius-discovery-31.cultur3stake.com',
      'https://audius-discovery-32.cultur3stake.com',
      'https://audius-discovery-33.cultur3stake.com',
      'https://audius-discovery-34.cultur3stake.com',
      'https://audius-discovery-35.cultur3stake.com',
      'https://audius-discovery-36.cultur3stake.com',
      'https://audius-discovery-37.cultur3stake.com',
      'https://audius-discovery-38.cultur3stake.com',
      'https://audius-discovery-39.cultur3stake.com',
      'https://audius-discovery-40.cultur3stake.com',
      'https://audius-discovery-41.cultur3stake.com',
      'https://audius-discovery-42.cultur3stake.com',
      'https://audius-discovery-43.cultur3stake.com',
      'https://audius-discovery-44.cultur3stake.com',
      'https://audius-discovery-45.cultur3stake.com',
      'https://audius-discovery-46.cultur3stake.com',
      'https://audius-discovery-47.cultur3stake.com',
      'https://audius-discovery-48.cultur3stake.com',
      'https://audius-discovery-49.cultur3stake.com',
      'https://audius-discovery-50.cultur3stake.com',
      // Добавляем альтернативные провайдеры
      'https://discoveryprovider.audius.co',
      'https://api.audius.co',
      'https://discoveryprovider.audius-prod-1.poised-bush-6f6f.audius.co',
      'https://discoveryprovider.audius-prod-2.poised-bush-6f6f.audius.co',
      'https://discoveryprovider.audius-prod-3.poised-bush-6f6f.audius.co',
      'https://discoveryprovider.audius-prod-4.poised-bush-6f6f.audius.co',
      'https://discoveryprovider.audius-prod-5.poised-bush-6f6f.audius.co',
      'https://discoveryprovider.audius-prod-6.poised-bush-6f6f.audius.co',
      'https://discoveryprovider.audius-prod-7.poised-bush-6f6f.audius.co',
      'https://discoveryprovider.audius-prod-8.poised-bush-6f6f.audius.co',
      'https://discoveryprovider.audius-prod-9.poised-bush-6f6f.audius.co',
      'https://discoveryprovider.audius-prod-10.poised-bush-6f6f.audius.co'
    ];
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Загружаем провайдеры из localStorage
      const cached = this.loadFromCache();
      if (cached.length > 0) {
        this.providers = cached;
        this.workingProviders = [...cached];
        console.log('Loaded providers from cache:', cached.length);
      }

      // Загружаем свежие провайдеры
      await this.fetchProviders();
      
      // Проверяем здоровье провайдеров
      await this.healthCheck();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize provider manager:', error);
      // Используем резервные провайдеры
      this.providers = [...this.fallbackProviders];
      this.workingProviders = [...this.fallbackProviders];
      this.isInitialized = true;
    }
  }

  async fetchProviders() {
    const now = Date.now();
    if (now - this.lastFetch < this.fetchInterval) {
      return;
    }

    try {
      const response = await fetch('https://api.audius.co', {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 секунд таймаут
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        this.providers = data.data.map(provider => provider.endpoint);
        this.saveToCache();
        this.lastFetch = now;
        console.log('Fetched fresh providers:', this.providers.length);
      }
    } catch (error) {
      console.warn('Failed to fetch providers, using cached/fallback:', error.message);
      // Если нет провайдеров, используем резервные
      if (this.providers.length === 0) {
        this.providers = [...this.fallbackProviders];
      }
    }
  }

  async healthCheck() {
    const now = Date.now();
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return;
    }

    console.log('Starting health check for providers...');
    const healthPromises = this.providers.map(provider => this.testProvider(provider));
    
    try {
      const results = await Promise.allSettled(healthPromises);
      const working = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          working.push(this.providers[index]);
        }
      });

      this.workingProviders = working.length > 0 ? working : [...this.fallbackProviders];
      this.lastHealthCheck = now;
      
      console.log(`Health check complete: ${working.length}/${this.providers.length} providers working`);
      
      // Обновляем кэш с рабочими провайдерами
      if (working.length > 0) {
        this.saveToCache();
      }
    } catch (error) {
      console.error('Health check failed:', error);
      this.workingProviders = [...this.fallbackProviders];
    }
  }

  async testProvider(provider) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд таймаут

      const response = await fetch(`${provider}/v1/health_check`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  getProvider() {
    if (this.workingProviders.length === 0) {
      return this.fallbackProviders[Math.floor(Math.random() * this.fallbackProviders.length)];
    }
    return this.workingProviders[Math.floor(Math.random() * this.workingProviders.length)];
  }

  saveToCache() {
    try {
      localStorage.setItem('audius_providers', JSON.stringify(this.providers));
      localStorage.setItem('audius_providers_timestamp', Date.now().toString());
    } catch (error) {
      console.warn('Failed to save providers to cache:', error);
    }
  }

  loadFromCache() {
    try {
      const cached = localStorage.getItem('audius_providers');
      const timestamp = localStorage.getItem('audius_providers_timestamp');
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        // Кэш действителен 1 час
        if (age < 60 * 60 * 1000) {
          return JSON.parse(cached);
        }
      }
    } catch (error) {
      console.warn('Failed to load providers from cache:', error);
    }
    return [];
  }

  async getProviders() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Периодически обновляем провайдеры
    await this.fetchProviders();
    await this.healthCheck();
    
    return this.workingProviders.length > 0 ? this.workingProviders : this.fallbackProviders;
  }
}

// Создаем глобальный экземпляр
const providerManager = new AudiusProviderManager();

export default providerManager;

// Экспортируем функции
export {
  getWorkingSearchProviders,
  getWorkingStreamProviders,
  forceUpdateCache,
  COMMON_HEADERS
}; 