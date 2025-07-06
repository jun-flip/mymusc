// Глобальный кэш провайдеров с приоритетом
let cachedProviders = [];
let lastFetch = 0;
let lastHealthCheck = 0;
const CACHE_TTL = 1000 * 60 * 10; // 10 минут
const HEALTH_CHECK_TTL = 1000 * 60 * 5; // 5 минут

// Динамически генерируемые провайдеры
const DYNAMIC_PROVIDERS = [
  // Основные домены Audius
  'https://api.audius.co',
  'https://discoveryprovider.audius.co',
  
  // Динамические discovery провайдеры
  'https://discoveryprovider.audius-prod-1.poised-bush-6f6f.audius.co',
  'https://discoveryprovider.audius-prod-2.poised-bush-6f6f.audius.co',
  'https://discoveryprovider.audius-prod-3.poised-bush-6f6f.audius.co',
  'https://discoveryprovider.audius-prod-4.poised-bush-6f6f.audius.co',
  'https://discoveryprovider.audius-prod-5.poised-bush-6f6f.audius.co',
  'https://discoveryprovider.audius-prod-6.poised-bush-6f6f.audius.co',
  'https://discoveryprovider.audius-prod-7.poised-bush-6f6f.audius.co',
  'https://discoveryprovider.audius-prod-8.poised-bush-6f6f.audius.co',
  'https://discoveryprovider.audius-prod-9.poised-bush-6f6f.audius.co',
  'https://discoveryprovider.audius-prod-10.poised-bush-6f6f.audius.co',
  
  // Альтернативные домены
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
  
  // Дополнительные провайдеры
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
  
  // Новые провайдеры
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
  
  // Дополнительные альтернативы
  'https://audius-discovery-51.cultur3stake.com',
  'https://audius-discovery-52.cultur3stake.com',
  'https://audius-discovery-53.cultur3stake.com',
  'https://audius-discovery-54.cultur3stake.com',
  'https://audius-discovery-55.cultur3stake.com',
  'https://audius-discovery-56.cultur3stake.com',
  'https://audius-discovery-57.cultur3stake.com',
  'https://audius-discovery-58.cultur3stake.com',
  'https://audius-discovery-59.cultur3stake.com',
  'https://audius-discovery-60.cultur3stake.com',
  
  // Еще больше провайдеров
  'https://audius-discovery-61.cultur3stake.com',
  'https://audius-discovery-62.cultur3stake.com',
  'https://audius-discovery-63.cultur3stake.com',
  'https://audius-discovery-64.cultur3stake.com',
  'https://audius-discovery-65.cultur3stake.com',
  'https://audius-discovery-66.cultur3stake.com',
  'https://audius-discovery-67.cultur3stake.com',
  'https://audius-discovery-68.cultur3stake.com',
  'https://audius-discovery-69.cultur3stake.com',
  'https://audius-discovery-70.cultur3stake.com',
  'https://audius-discovery-71.cultur3stake.com',
  'https://audius-discovery-72.cultur3stake.com',
  'https://audius-discovery-73.cultur3stake.com',
  'https://audius-discovery-74.cultur3stake.com',
  'https://audius-discovery-75.cultur3stake.com',
  'https://audius-discovery-76.cultur3stake.com',
  'https://audius-discovery-77.cultur3stake.com',
  'https://audius-discovery-78.cultur3stake.com',
  'https://audius-discovery-79.cultur3stake.com',
  'https://audius-discovery-80.cultur3stake.com',
  'https://audius-discovery-81.cultur3stake.com',
  'https://audius-discovery-82.cultur3stake.com',
  'https://audius-discovery-83.cultur3stake.com',
  'https://audius-discovery-84.cultur3stake.com',
  'https://audius-discovery-85.cultur3stake.com',
  'https://audius-discovery-86.cultur3stake.com',
  'https://audius-discovery-87.cultur3stake.com',
  'https://audius-discovery-88.cultur3stake.com',
  'https://audius-discovery-89.cultur3stake.com',
  'https://audius-discovery-90.cultur3stake.com',
  'https://audius-discovery-91.cultur3stake.com',
  'https://audius-discovery-92.cultur3stake.com',
  'https://audius-discovery-93.cultur3stake.com',
  'https://audius-discovery-94.cultur3stake.com',
  'https://audius-discovery-95.cultur3stake.com',
  'https://audius-discovery-96.cultur3stake.com',
  'https://audius-discovery-97.cultur3stake.com',
  'https://audius-discovery-98.cultur3stake.com',
  'https://audius-discovery-99.cultur3stake.com',
  'https://audius-discovery-100.cultur3stake.com'
];

// Общие заголовки для запросов
const COMMON_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, audio/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache'
};

// Функция для генерации дополнительных провайдеров
function generateAdditionalProviders() {
  const providers = [];
  
  // Генерируем провайдеры с разными доменами
  const domains = [
    'cultur3stake.com',
    'audius.co',
    'poised-bush-6f6f.audius.co',
    'audius-prod-1.poised-bush-6f6f.audius.co',
    'audius-prod-2.poised-bush-6f6f.audius.co',
    'audius-prod-3.poised-bush-6f6f.audius.co',
    'audius-prod-4.poised-bush-6f6f.audius.co',
    'audius-prod-5.poised-bush-6f6f.audius.co'
  ];
  
  const prefixes = [
    'audius-discovery',
    'discoveryprovider',
    'api',
    'discovery'
  ];
  
  // Генерируем комбинации
  for (const domain of domains) {
    for (const prefix of prefixes) {
      // Основные варианты
      providers.push(`https://${prefix}.${domain}`);
      
      // С номерами
      for (let i = 1; i <= 20; i++) {
        providers.push(`https://${prefix}-${i}.${domain}`);
      }
    }
  }
  
  return [...new Set(providers)]; // Убираем дубликаты
}

// Функция для тестирования провайдера поиска
async function testSearchProvider(provider) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${provider}/v1/tracks/search?query=test&app_name=audiofeel&limit=1`, {
      headers: COMMON_HEADERS,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${provider}/v1/tracks/12345/stream?app_name=audiofeel`, {
      headers: COMMON_HEADERS,
      redirect: 'manual',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const res = await fetch('https://api.audius.co/v1/discovery_providers', {
        headers: COMMON_HEADERS,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          const newProviders = data.data.map(p => p.endpoint.replace(/\/$/, ''));
          cachedProviders = [...newProviders, ...DYNAMIC_PROVIDERS];
          lastFetch = now;
          console.log(`Updated providers from Audius: ${cachedProviders.length} total`);
          return cachedProviders;
        }
      }
    } catch (error) {
      console.error('Error fetching providers from Audius:', error);
    }
    
    // Если не удалось получить от Audius, используем динамические + генерируемые
    const additionalProviders = generateAdditionalProviders();
    cachedProviders = [...DYNAMIC_PROVIDERS, ...additionalProviders];
    lastFetch = now;
    console.log(`Using generated providers: ${cachedProviders.length} total`);
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
    
    // Тестируем только первые 20 провайдеров для скорости
    const providersToTest = providers.slice(0, 20);
    
    const healthChecks = await Promise.allSettled(
      providersToTest.map(async (provider) => {
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
    
    // Тестируем только первые 20 провайдеров для скорости
    const providersToTest = providers.slice(0, 20);
    
    const healthChecks = await Promise.allSettled(
      providersToTest.map(async (provider) => {
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
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Загружаем провайдеры
      await this.fetchProviders();
      
      // Проверяем здоровье провайдеров
      await this.healthCheck();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize provider manager:', error);
      // Используем базовые провайдеры
      this.providers = [...DYNAMIC_PROVIDERS];
      this.workingProviders = [...DYNAMIC_PROVIDERS];
      this.isInitialized = true;
    }
  }

  async fetchProviders() {
    const now = Date.now();
    if (now - this.lastFetch < this.fetchInterval) {
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://api.audius.co/v1/discovery_providers', {
        method: 'GET',
        headers: COMMON_HEADERS,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        
        if (data.data && Array.isArray(data.data)) {
          const newProviders = data.data.map(provider => provider.endpoint.replace(/\/$/, ''));
          this.providers = [...newProviders, ...DYNAMIC_PROVIDERS];
          this.lastFetch = now;
          console.log('Fetched fresh providers:', this.providers.length);
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn('Failed to fetch providers, using generated:', error.message);
      // Если нет провайдеров, используем сгенерированные
      if (this.providers.length === 0) {
        this.providers = [...DYNAMIC_PROVIDERS, ...generateAdditionalProviders()];
      }
    }
  }

  async healthCheck() {
    const now = Date.now();
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return;
    }

    console.log('Starting health check for providers...');
    
    // Тестируем только первые 30 провайдеров для скорости
    const providersToTest = this.providers.slice(0, 30);
    const healthPromises = providersToTest.map(provider => this.testProvider(provider));
    
    try {
      const results = await Promise.allSettled(healthPromises);
      const working = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          working.push(providersToTest[index]);
        }
      });

      this.workingProviders = working.length > 0 ? working : [...DYNAMIC_PROVIDERS];
      this.lastHealthCheck = now;
      
      console.log(`Health check complete: ${working.length}/${providersToTest.length} providers working`);
    } catch (error) {
      console.error('Health check failed:', error);
      this.workingProviders = [...DYNAMIC_PROVIDERS];
    }
  }

  async testProvider(provider) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${provider}/v1/health_check`, {
        method: 'GET',
        headers: COMMON_HEADERS,
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
      return DYNAMIC_PROVIDERS[Math.floor(Math.random() * DYNAMIC_PROVIDERS.length)];
    }
    return this.workingProviders[Math.floor(Math.random() * this.workingProviders.length)];
  }

  async getProviders() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Периодически обновляем провайдеры
    await this.fetchProviders();
    await this.healthCheck();
    
    return this.workingProviders.length > 0 ? this.workingProviders : DYNAMIC_PROVIDERS;
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
  COMMON_HEADERS,
  DYNAMIC_PROVIDERS,
  generateAdditionalProviders
}; 