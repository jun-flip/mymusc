import React, { useState } from 'react';

function TrackCard({ track, idx, selectedTrack, isPlaying, progress, duration, playFromSearch, openPlayerPopup, addToPlaylist, IconPlay, IconPause, IconPlaylistAdd, isTrackUnavailable }) {
  // Проверяем, что track существует и имеет необходимые свойства
  if (!track || !track.id) {
    console.error('Invalid track data:', track);
    return null;
  }

  // Проверяем, что все функции существуют
  if (typeof playFromSearch !== 'function') {
    console.error('playFromSearch is not a function');
    return null;
  }

  if (typeof openPlayerPopup !== 'function') {
    console.error('openPlayerPopup is not a function');
    return null;
  }

  if (typeof addToPlaylist !== 'function') {
    console.error('addToPlaylist is not a function');
    return null;
  }

  const trackTitle = track.title || 'Без названия';
  const artistName = track.user?.name || 'Неизвестный исполнитель';
  const defaultArtworkUrl = 'https://audius.co/favicon.ico';
  
  // Состояние для обработки ошибок загрузки изображений
  const [imageError, setImageError] = useState(false);
  const [currentArtworkUrl, setCurrentArtworkUrl] = useState(
    track.artwork?.['150x150'] || defaultArtworkUrl
  );

  // Безопасные обработчики событий
  const handlePlayClick = () => {
    try {
      if (typeof idx === 'number' && idx >= 0) {
        playFromSearch(idx);
        openPlayerPopup();
      } else {
        console.error('Invalid index for playFromSearch:', idx);
      }
    } catch (error) {
      console.error('Error in handlePlayClick:', error);
    }
  };

  const handleAddToPlaylist = () => {
    try {
      addToPlaylist(track);
    } catch (error) {
      console.error('Error in handleAddToPlaylist:', error);
    }
  };

  // Обработчик ошибки загрузки изображения
  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      setCurrentArtworkUrl(defaultArtworkUrl);
    }
  };

  // Проверяем валидность прогресса и длительности
  const validProgress = typeof progress === 'number' && isFinite(progress) && progress >= 0 ? progress : 0;
  const validDuration = typeof duration === 'number' && isFinite(duration) && duration > 0 ? duration : 0;
  const progressPercent = validDuration > 0 ? Math.min(100, (validProgress / validDuration) * 100) : 0;

  // Определяем, недоступен ли трек
  const isUnavailable = isTrackUnavailable && isTrackUnavailable(track.id);

  return (
    <li key={track.id} className={selectedTrack && track.id === selectedTrack.id ? 'track-active' : ''} style={{ 
      marginBottom: 10, 
      display: 'flex', 
      alignItems: 'center', 
      position: 'relative', 
      overflow: 'hidden',
      opacity: isUnavailable ? 0.6 : 1
    }}>
      {/* Прогрессбар для активного трека */}
      {selectedTrack && track.id === selectedTrack.id && validDuration > 0 && (
        <div className="track-progress-bar" style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${progressPercent}%`,
          background: 'rgba(220,220,220,0.45)',
          zIndex: 0,
          transition: 'width 0.2s',
          pointerEvents: 'none',
        }} />
      )}
      
      {/* Индикатор недоступности трека */}
      {isUnavailable && (
        <div style={{
          position: 'absolute',
          top: 5,
          right: 5,
          background: '#ff6b6b',
          color: 'white',
          fontSize: 10,
          padding: '2px 6px',
          borderRadius: 10,
          zIndex: 2,
          fontWeight: 'bold'
        }}>
          ⚠️
        </div>
      )}
      
      <img 
        src={currentArtworkUrl} 
        alt={trackTitle} 
        width={50} 
        height={50} 
        style={{ 
          borderRadius: 8, 
          marginRight: 10, 
          objectFit: 'cover', 
          zIndex: 1,
          filter: isUnavailable ? 'grayscale(50%)' : 'none'
        }}
        onError={handleImageError}
        onLoad={() => setImageError(false)}
      />
      <div className="track-card-content" style={{ zIndex: 1, flex: 1 }}>
        <div className="track-card-title" style={{ 
          color: isUnavailable ? '#888' : 'inherit',
          textDecoration: isUnavailable ? 'line-through' : 'none'
        }}>
          {trackTitle}
        </div>
        <div className="track-card-meta" style={{ color: isUnavailable ? '#666' : '#aaa' }}>
          {artistName}
          {track.duration ? (
            <span style={{ color: '#666', marginLeft: 8 }}>{track.duration}</span>
          ) : null}
          {track.album && track.album.title && (
            <span style={{ color: '#ff5500', marginLeft: 8 }}>{track.album.title}</span>
          )}
          {isUnavailable && (
            <span style={{ color: '#ff6b6b', marginLeft: 8, fontSize: 12 }}>
              Недоступен
            </span>
          )}
        </div>
      </div>
      <div className="track-card-buttons" style={{ zIndex: 1 }}>
        <button 
          className="track-play-btn" 
          onClick={handlePlayClick} 
          disabled={isUnavailable}
          aria-label={`Воспроизвести трек ${trackTitle}`}
          style={{
            opacity: isUnavailable ? 0.5 : 1,
            cursor: isUnavailable ? 'not-allowed' : 'pointer'
          }}
        >
          {selectedTrack && track.id === selectedTrack.id && isPlaying
            ? (IconPause ? <IconPause /> : '⏸')
            : (IconPlay ? <IconPlay /> : '▶')
          }
        </button>
        <button 
          className="playlist-btn" 
          title="В плейлист" 
          onClick={handleAddToPlaylist} 
          aria-label={`Добавить в плейлист ${trackTitle}`}
        >
          {IconPlaylistAdd ? <IconPlaylistAdd /> : '+'}
        </button>
      </div>
    </li>
  );
}

export default TrackCard; 