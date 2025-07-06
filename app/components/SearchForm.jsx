import React, { useState, useCallback } from 'react';

// Хук для медиа-запроса
function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  
  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  
  return matches;
}

function SearchForm({ onSearch, isLoading, searchResults, loadMore, hasMore }) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  
  // Определяем, является ли экран узким (меньше 480px)
  const isNarrowScreen = useMediaQuery('(max-width: 480px)');

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Введите поисковый запрос');
      return;
    }

    setError('');
    
    try {
      await onSearch(query.trim());
    } catch (error) {
      console.error('Search error:', error);
      
      // Определяем тип ошибки и показываем соответствующее сообщение
      if (error.message?.includes('502') || error.message?.includes('503')) {
        setError('Сервис поиска временно недоступен. Попробуйте позже или поищите "demo" для тестовых треков.');
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        setError('Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.');
      } else if (error.message?.includes('timeout')) {
        setError('Превышено время ожидания ответа. Попробуйте еще раз.');
      } else {
        setError('Произошла ошибка при поиске. Попробуйте позже.');
      }
    }
  }, [query, onSearch]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    
    try {
      await loadMore();
    } catch (error) {
      console.error('Load more error:', error);
      setError('Ошибка при загрузке дополнительных результатов');
    }
  }, [hasMore, isLoading, loadMore]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    if (error) setError(''); // Очищаем ошибку при вводе
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%'
        }}>
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Поиск треков..."
            className="search-input"
            disabled={isLoading}
            aria-label="Поиск треков"
            style={{
              flex: 1,
              height: '44px',
              padding: '12px 16px',
              fontSize: '16px',
              border: '2px solid #333',
              borderRadius: '8px',
              backgroundColor: '#1a1a1a',
              color: '#fff',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#ff5500';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#333';
            }}
          />
          <button 
            type="submit" 
            className="search-button"
            disabled={isLoading || !query.trim()}
            aria-label="Начать поиск"
            style={{
              height: '44px',
              minWidth: isNarrowScreen ? '48px' : '80px',
              padding: isNarrowScreen ? '8px' : '8px 16px',
              fontSize: isNarrowScreen ? '18px' : '16px',
              border: '2px solid #ff5500',
              borderRadius: '8px',
              backgroundColor: '#ff5500',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onMouseOver={(e) => {
              if (!isLoading && query.trim()) {
                e.target.style.backgroundColor = '#e64a19';
                e.target.style.borderColor = '#e64a19';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#ff5500';
              e.target.style.borderColor = '#ff5500';
            }}
          >
            {isLoading 
              ? (isNarrowScreen ? '⏳' : 'Поиск...') 
              : (isNarrowScreen ? '🔍' : 'Поиск')
            }
          </button>
        </div>
      </form>

      {/* Показываем ошибку */}
      {error && (
        <div className="error-message" style={{
          color: '#ff6b6b',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          padding: '10px',
          borderRadius: '8px',
          marginTop: '10px',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {/* Индикатор загрузки */}
      {isLoading && (
        <div className="loading-indicator" style={{
          textAlign: 'center',
          padding: '20px',
          color: '#666'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔍</div>
          <p>Поиск треков...</p>
        </div>
      )}
    </div>
  );
}

export default SearchForm; 