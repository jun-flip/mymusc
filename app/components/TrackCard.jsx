import React from 'react';

function TrackCard({ track, idx, selectedTrack, isPlaying, progress, duration, playFromSearch, openPlayerPopup, addToPlaylist, IconPlay, IconPause, IconPlaylistAdd }) {
  return (
    <li key={track.id} className={selectedTrack && track.id === selectedTrack.id ? 'track-active' : ''} style={{ marginBottom: 10, display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Прогрессбар для активного трека */}
      {selectedTrack && track.id === selectedTrack.id && duration > 0 && (
        <div className="track-progress-bar" style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${Math.min(100, (progress/duration)*100)}%`,
          background: 'rgba(220,220,220,0.45)',
          zIndex: 0,
          transition: 'width 0.2s',
          pointerEvents: 'none',
        }} />
      )}
      <img src={track.artwork && track.artwork['150x150'] ? track.artwork['150x150'] : 'https://audius.co/favicon.ico'} alt={track.title} width={50} height={50} style={{ borderRadius: 8, marginRight: 10, objectFit: 'cover', zIndex: 1 }} />
      <div className="track-card-content" style={{ zIndex: 1 }}>
        <div className="track-card-title">{track.title}</div>
        <div className="track-card-meta">
          {track.user && track.user.name}
          {track.duration ? (
            <span style={{ color: '#666', marginLeft: 8 }}>{track.duration}</span>
          ) : null}
          {track.album && track.album.title && (
            <span style={{ color: '#ff5500', marginLeft: 8 }}>{track.album.title}</span>
          )}
        </div>
      </div>
      <div className="track-card-buttons" style={{ zIndex: 1 }}>
        <button className="track-play-btn" onClick={() => { playFromSearch(idx); openPlayerPopup(); }} aria-label={`Воспроизвести трек ${track.title}`}>{
          selectedTrack && track.id === selectedTrack.id && isPlaying
            ? (IconPause ? <IconPause /> : '⏸')
            : (IconPlay ? <IconPlay /> : '▶')
        }</button>
        <button className="playlist-btn" title="В плейлист" onClick={() => addToPlaylist(track)} aria-label={`Добавить в плейлист ${track.title}`}>{IconPlaylistAdd ? <IconPlaylistAdd /> : '+'}</button>
      </div>
    </li>
  );
}

export default TrackCard; 