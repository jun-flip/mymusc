import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function formatTime(sec) {
  if (!isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function PseudoRandomEQ({ isPlaying, barCount = 96 }) {
  const [heights, setHeights] = useState(() => Array(barCount).fill(18));
  const rafRef = useRef();

  useEffect(() => {
    if (!isPlaying) {
      setHeights(Array(barCount).fill(18));
      return;
    }
    let running = true;
    let lastUpdate = Date.now();
    const animate = () => {
      if (!running) return;
      setHeights(prev => prev.map((h, i) => {
        // Плавно меняем высоту с небольшой случайностью
        const t = Date.now() / 700 + i * 0.15;
        const base = 18 + 62 * (0.5 + 0.5 * Math.sin(t + Math.sin(i)));
        const noise = 8 * Math.sin(t * (i % 7 + 1));
        return Math.max(12, Math.min(100, base + noise));
      }));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, barCount]);

  return (
    <div className="background-eq" aria-hidden>
      {heights.map((h, i) => (
        <div
          key={i}
          className="background-eq-bar"
          style={{
            height: `${h}%`,
            animation: 'none',
            animationPlayState: 'paused',
          }}
        ></div>
      ))}
    </div>
  );
}

// SVG-иконки Material UI
const IconPrev = ({color = '#ff5500'}) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 18V6M19 18L10 12L19 6V18Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const IconNext = ({color = '#ff5500'}) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6V18M5 6L14 12L5 18V6Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const IconPlay = ({color = 'currentColor'}) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5V19L19 12L8 5Z" fill="currentColor"/></svg>
);
const IconPause = ({color = '#ff5500'}) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="5" width="4" height="14" rx="2" fill={color}/><rect x="14" y="5" width="4" height="14" rx="2" fill={color}/></svg>
);
const IconExpand = ({color = '#fff'}) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15L6 9H18L12 15Z" fill={color}/></svg>
);
const IconCollapse = ({color = '#fff'}) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 9L18 15H6L12 9Z" fill={color}/></svg>
);
const IconClose = ({color = '#fff'}) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>
);
const IconQueue = ({color = '#ff5500'}) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="6" width="16" height="2" rx="1" fill={color}/><rect x="4" y="11" width="16" height="2" rx="1" fill={color}/><rect x="4" y="16" width="10" height="2" rx="1" fill={color}/></svg>
);
const IconPlaylistAdd = ({color = 'currentColor'}) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="6" width="12" height="2" rx="1" fill={color}/><rect x="4" y="11" width="12" height="2" rx="1" fill={color}/><rect x="4" y="16" width="8" height="2" rx="1" fill={color}/><path d="M19 13v-2m-1 1h2" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>
);
const IconDelete = ({color = 'currentColor'}) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 7V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2m5 4v6m4-6v6" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>
);

function App() {
  const [query, setQuery] = useState(() => localStorage.getItem('lastQuery') || '');
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const audioRef = useRef(null);
  const inputRef = useRef(null);
  const [queue, setQueue] = useState([]); // очередь треков
  const PLAYLIST_KEY = 'audiofeel_playlist';
  const PLAYLIST_TTL = 1000 * 60 * 60 * 24 * 30; // 30 дней
  const [playlist, setPlaylist] = useState(() => {
    try {
      const raw = localStorage.getItem(PLAYLIST_KEY);
      if (!raw) return [];
      const { tracks, ts } = JSON.parse(raw);
      if (Date.now() - ts > PLAYLIST_TTL) {
        localStorage.removeItem(PLAYLIST_KEY);
        return [];
      }
      return tracks || [];
    } catch { return []; }
  });
  const [playingFromPlaylist, setPlayingFromPlaylist] = useState(false);

  // Автофокус на поле поиска
  useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);

  // Сохранять последний запрос
  useEffect(() => { localStorage.setItem('lastQuery', query); }, [query]);

  // Сохранять плейлист
  useEffect(() => {
    localStorage.setItem(PLAYLIST_KEY, JSON.stringify({ tracks: playlist, ts: Date.now() }));
  }, [playlist]);

  // Индекс выбранного трека
  const selectedIndex = selectedTrack
    ? (playingFromPlaylist
        ? playlist.findIndex(t => t.id === selectedTrack.id)
        : tracks.findIndex(t => t.id === selectedTrack.id))
    : -1;
  const currentList = playingFromPlaylist ? playlist : tracks;

  // Переключение трека
  const playTrackAt = idx => {
    if (idx >= 0 && idx < currentList.length) {
      setSelectedTrack(currentList[idx]);
      setIsPlaying(true);
      setExpanded(false);
    }
  };

  // Следующий трек (с учётом очереди)
  const playNext = () => {
    if (!playingFromPlaylist && queue.length > 0) {
      setSelectedTrack(queue[0]);
      setQueue(q => q.slice(1));
      setIsPlaying(true);
      setExpanded(false);
    } else {
      playTrackAt(selectedIndex + 1);
    }
  };
  // Предыдущий трек
  const playPrev = () => playTrackAt(selectedIndex - 1);

  // Добавить в очередь
  const addToQueue = track => {
    setQueue(q => [...q, track]);
  };

  // Добавить в плейлист
  const addToPlaylist = track => {
    setPlaylist(pl => pl.find(t => t.id === track.id) ? pl : [...pl, track]);
  };

  // Воспроизведение/пауза
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Прогресс и длительность
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration);
    };
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('durationchange', update);
    return () => {
      audio.removeEventListener('timeupdate', update);
      audio.removeEventListener('durationchange', update);
    };
  }, [selectedTrack]);

  // Перемотка по прогресс-бару
  const handleSeek = e => {
    if (!audioRef.current || !duration) return;
    const rect = e.target.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * duration;
  };

  // Автоматически запускать play() при смене трека
  useEffect(() => {
    if (selectedTrack && audioRef.current) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [selectedTrack]);

  // Сбросить плеер полностью
  const closePlayer = () => {
    setSelectedTrack(null);
    setIsPlaying(false);
    setExpanded(false);
    setQueue([]);
  };

  const searchTracks = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTracks([]);
    try {
      const response = await fetch(`/api/audius/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setTracks((data.data || []).map(track => ({ ...track })));
    } catch (err) {
      alert('Ошибка поиска треков!');
    }
    setLoading(false);
  };

  // Удалить из плейлиста
  const removeFromPlaylist = id => {
    setPlaylist(pl => pl.filter(t => t.id !== id));
  };

  // Очистить плейлист
  const clearPlaylist = () => setPlaylist([]);

  // Воспроизвести из плейлиста
  const playFromPlaylist = idx => {
    setSelectedTrack(playlist[idx]);
    setIsPlaying(true);
    setExpanded(false);
    setPlayingFromPlaylist(true);
  };

  // Воспроизвести из поиска
  const playFromSearch = idx => {
    setSelectedTrack(tracks[idx]);
    setIsPlaying(true);
    setExpanded(false);
    setPlayingFromPlaylist(false);
  };

  // При смене трека, если трек не найден в текущем списке — сбрасываем режим
  useEffect(() => {
    if (!selectedTrack) return;
    if (playingFromPlaylist && !playlist.find(t => t.id === selectedTrack.id)) {
      setPlayingFromPlaylist(false);
    }
    if (!playingFromPlaylist && !tracks.find(t => t.id === selectedTrack.id)) {
      setPlayingFromPlaylist(true);
    }
  }, [selectedTrack, playlist, tracks, playingFromPlaylist]);

  return (
    <>
      <PseudoRandomEQ isPlaying={isPlaying && !!selectedTrack} barCount={96} />
    <div className="App">
        <h1>Музыкальный Поиск</h1>
        <div className="search-form-wrapper">
          <form onSubmit={searchTracks} style={{ marginBottom: 0 }}>
        <input
              ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Поиск трека..."
          style={{ padding: 8, width: 250 }}
        />
        <button type="submit" style={{ padding: 8, marginLeft: 8 }}>Поиск</button>
      </form>
        </div>
        {loading && (
          <div className="loader">
            <span className="loader-dot"></span>
            <span className="loader-dot"></span>
            <span className="loader-dot"></span>
          </div>
        )}
        {!loading && tracks.length === 0 && (
          <div style={{ textAlign: 'center', color: '#aaa', marginTop: 30 }}>Ничего не найдено</div>
        )}
      <ul style={{ listStyle: 'none', padding: 0 }}>
          {tracks.map((track, idx) => (
            <li key={track.id} className={selectedTrack && track.id === selectedTrack.id ? 'track-active' : ''} style={{ marginBottom: 10, display: 'flex', alignItems: 'center' }}>
              <img src={track.artwork && track.artwork['150x150'] ? track.artwork['150x150'] : 'https://audius.co/favicon.ico'} alt={track.title} style={{ width: 50, height: 50, borderRadius: 8, marginRight: 10 }} />
              <span style={{ flex: 1 }}>
                <b>{track.title}</b> <br />
                <span style={{ color: '#aaa' }}>{track.user && track.user.name}</span>
                {track.duration ? (
                  <span style={{ color: '#666', marginLeft: 8, fontSize: '0.95em' }}>{formatTime(track.duration)}</span>
                ) : null}
                {track.album && track.album.title && (
                  <span style={{ color: '#ff5500', marginLeft: 8, fontSize: '0.95em' }}>{track.album.title}</span>
                )}
              </span>
              <button className="track-play-btn" style={{ marginLeft: 10 }} onClick={() => { playFromSearch(idx); }}>
                <IconPlay />
              </button>
              <button className="playlist-btn" title="В плейлист" onClick={() => addToPlaylist(track)}><IconPlaylistAdd /></button>
          </li>
        ))}
      </ul>
      <div style={{ height: 90 }}></div>
      {/* Мини-плеер */}
      {selectedTrack && (
          <div className={`mini-player${isPlaying ? ' playing' : ''}${expanded ? ' expanded' : ''}`}>
            
            <span className="mini-player-title">{selectedTrack.title}</span>
            <span className="mini-player-artist">{selectedTrack.user && selectedTrack.user.name}</span>
            <div className="mini-player-controls">
              <button onClick={playPrev} disabled={selectedIndex <= 0} title="Предыдущий">
                <IconPrev color={selectedIndex <= 0 ? '#aaa' : '#ff5500'} />
              </button>
              <button onClick={handlePlayPause} title={isPlaying ? 'Пауза' : 'Воспроизвести'}>
                {isPlaying ? <IconPause /> : <IconPlay />}
              </button>
              <button
                onClick={playNext}
                disabled={selectedIndex === -1 || selectedIndex >= currentList.length - 1}
                title="Следующий"
              >
                <IconNext color={selectedIndex === -1 || selectedIndex >= currentList.length - 1 ? '#aaa' : '#ff5500'} />
              </button>
              <button className="mini-expand" onClick={() => setExpanded(e => !e)} title={expanded ? 'Свернуть' : 'Развернуть'}>{expanded ? <IconCollapse /> : <IconExpand />}</button>
              <button className="mini-close" onClick={closePlayer} title="Закрыть"><IconClose /></button>
            </div>
            <audio
              ref={audioRef}
              src={`/api/audius/stream/${selectedTrack.id}`}
              style={{ display: 'none' }}
              autoPlay={isPlaying}
              onEnded={playNext}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            <div className="mini-player-progress" onClick={handleSeek} title="Перемотать">
              <div className="mini-player-progress-inner" style={{ width: duration ? `${(progress/duration)*100}%` : '0%' }}></div>
            </div>
            <div className="mini-player-time">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            {expanded && (
              <div className="mini-player-extra-info">
                <div>Альбом: {selectedTrack.album && selectedTrack.album.title ? selectedTrack.album.title : '—'}</div>
                <div>Длительность: {formatTime(selectedTrack.duration)}</div>
                <div>Артист: {selectedTrack.user && selectedTrack.user.name ? selectedTrack.user.name : '—'}</div>
  </div>
)}
        </div>
      )}
      {/* Плейлист */}
      {playlist.length > 0 && (
        <div className="playlist-section">
          <div className="playlist-title">Плейлист
            <button className="playlist-clear-btn" title="Очистить плейлист" onClick={clearPlaylist}><IconDelete color="#ff5500" /></button>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {playlist.map((track, idx) => (
              <li key={track.id} className={selectedTrack && track.id === selectedTrack.id ? 'track-active' : ''} style={{ marginBottom: 10, display: 'flex', alignItems: 'center' }}>
                <img src={track.artwork && track.artwork['150x150'] ? track.artwork['150x150'] : 'https://audius.co/favicon.ico'} alt={track.title} style={{ width: 40, height: 40, borderRadius: 8, marginRight: 10 }} />
                <span style={{ flex: 1 }}>
                  <b>{track.title}</b> <br />
                  <span style={{ color: '#aaa' }}>{track.user && track.user.name}</span>
                </span>
                <button className="track-play-btn" onClick={() => playFromPlaylist(idx)}><IconPlay /></button>
                <button className="playlist-btn" title="Удалить из плейлиста" onClick={() => removeFromPlaylist(track.id)}><IconDelete /></button>
              </li>
            ))}
          </ul>
          <div style={{ height: 90 }}></div>
        </div>
      )}
    </div>
    </>
  );
}

export default App;
