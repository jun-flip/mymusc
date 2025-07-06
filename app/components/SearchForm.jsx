import React, { useState, useCallback } from 'react';

function SearchForm({ onSearch, isLoading, searchResults, loadMore, hasMore }) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

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
        <div className="search-input-container">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Поиск треков..."
            className="search-input"
            disabled={isLoading}
            aria-label="Поиск треков"
          />
          <button 
            type="submit" 
            className="search-button"
            disabled={isLoading || !query.trim()}
            aria-label="Начать поиск"
          >
            {isLoading ? '🔍' : '🔍'}
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