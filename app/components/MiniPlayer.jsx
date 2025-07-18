import React from 'react';
import { createPortal } from 'react-dom';

function MiniPlayer({
  selectedTrack,
  isPlaying,
  onPlayPause,
  onNext,
  onClose,
  progress,
  duration,
  formatTime,
  IconPlay,
  IconPause,
  asPortal = false,
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  if (!selectedTrack || (asPortal && (!mounted || typeof window === 'undefined'))) return null;
  const content = (
    <div className={`mini-player${asPortal ? '' : ' mini-player--inline'}`}>
      <img src={selectedTrack.artwork && selectedTrack.artwork['150x150'] ? selectedTrack.artwork['150x150'] : 'https://audius.co/favicon.ico'} alt={selectedTrack.title} width={40} height={40} style={{ borderRadius: 8, marginRight: 10, objectFit: 'cover' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mini-player-title" style={{ fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '1.05rem' }}>{selectedTrack.title}</div>
        <div className="mini-player-artist" style={{ color: '#ff5500', fontSize: '0.98rem' }}>{selectedTrack.user && selectedTrack.user.name}</div>
        <div className="mini-player-progress" style={{ width: '100%', height: 4, background: '#333', borderRadius: 2, margin: '6px 0 2px 0', position: 'relative' }}>
          <div className="mini-player-progress-inner" style={{ height: '100%', background: '#ff5500', borderRadius: 2, width: duration ? `${(progress/duration)*100}%` : '0%', transition: 'width 0.15s' }}></div>
        </div>
        <div className="mini-player-time" style={{ fontSize: '0.92rem', color: '#aaa', display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      <button className="mini-player-btn" onClick={onPlayPause} style={{ background: 'none', border: 'none', color: '#ff5500', fontSize: 22, margin: '0 8px', cursor: 'pointer' }} aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}>{isPlaying ? <IconPause /> : <IconPlay />}</button>
      <button className="mini-player-btn" onClick={onNext} style={{ background: 'none', border: 'none', color: '#ff5500', fontSize: 22, margin: '0 8px', cursor: 'pointer' }} aria-label="Следующий трек">&#9654;</button>
      <button className="mini-player-btn mini-close" onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, marginLeft: 8, cursor: 'pointer' }} aria-label="Закрыть мини-плеер">&times;</button>
    </div>
  );
  if (asPortal && typeof window !== 'undefined') {
    return createPortal(content, document.body);
  }
  return content;
}

export default MiniPlayer; 