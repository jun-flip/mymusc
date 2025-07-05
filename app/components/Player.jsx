import React from 'react';

function Player({
  selectedTrack,
  isPlaying,
  audioRef,
  onPlay,
  onPause,
  onEnded,
  playNext,
  playPrev,
  progress,
  duration,
  buffered,
  isBuffering,
  handleSeek,
  handlePlayPause,
  formatTime,
  IconPrev,
  IconNext,
  IconPlay,
  IconPause,
}) {
  if (!selectedTrack) {
    return (
      <div className="player-bg-box" style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#232323', borderRadius: 18 }}>
        <div style={{ color: '#aaa', fontSize: '1.15rem', textAlign: 'center' }}>
          Выберите трек для воспроизведения
        </div>
      </div>
    );
  }
  const streamId = selectedTrack.streamId || (selectedTrack.permalink && selectedTrack.permalink.match(/-(\d+)$/)?.[1]);
  if (!streamId) return null;
  return (
    <div className="player-bg-box" style={{
      backgroundImage: `url('${selectedTrack.artwork && selectedTrack.artwork['150x150'] ? selectedTrack.artwork['150x150'] : 'https://audius.co/favicon.ico'}')`
    }}>
      <div className="player-popup-content">
        {/* Плеер визуально "сидит" на обложке */}
        <h2>{selectedTrack.title}</h2>
        <div className="artist">{selectedTrack.user && selectedTrack.user.name}</div>
        <div className="player-popup-progress" onClick={handleSeek} title="Перемотать" style={{ position: 'relative' }}>
          {/* Буферизация (серый бар) */}
          {duration > 0 && buffered.length > 0 && (
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: '100%',
              zIndex: 0,
            }}>
              {buffered.map((b, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: `${(b.start / duration) * 100}%`,
                  width: `${((b.end - b.start) / duration) * 100}%`,
                  height: '100%',
                  background: '#bbb',
                  borderRadius: 8,
                  opacity: 0.5,
                }} />
              ))}
            </div>
          )}
          {/* Прогресс (оранжевый бар) */}
          <div className="player-popup-progress-inner" style={{ width: duration ? `${(progress/duration)*100}%` : '0%', position: 'relative', zIndex: 1 }}></div>
        </div>
        <div className="player-popup-time">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        {/* Индикатор буферизации */}
        {isBuffering && (
          <div style={{ color: '#ff5500', marginBottom: 8, fontWeight: 500 }}>Буферизация...</div>
        )}
        <div className="player-popup-controls">
          <button className="player-btn" onClick={() => { playPrev(); }} title="Предыдущий" aria-label="Предыдущий трек"><IconPrev /></button>
          <button className="player-btn player-btn--main" onClick={() => { handlePlayPause(); }} title={isPlaying ? 'Пауза' : 'Воспроизвести'} aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}>{isPlaying ? <IconPause /> : <IconPlay />}</button>
          <button className="player-btn" onClick={() => { playNext(); }} title="Следующий" aria-label="Следующий трек"><IconNext /></button>
        </div>
      </div>
    </div>
  );
}

export default Player; 