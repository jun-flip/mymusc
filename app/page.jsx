/* eslint-disable @typescript-eslint/no-unused-expressions */
'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './App.css';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Player from './components/Player';
import Playlist from './components/Playlist';
import PseudoRandomEQ from './components/PseudoRandomEQ';
import TrackCard from './components/TrackCard';
import SearchForm from './components/SearchForm';
import BurgerMenu from './components/BurgerMenu';
import MiniPlayer from './components/MiniPlayer.js';

function formatTime(sec) {
  if (!isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

const IconPrev = ({color = '#ff5500'}) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 18V6M19 18L10 12L19 6V18Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const IconNext = ({color = '#ff5500'}) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6V18M5 6L14 12L5 18V6Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const IconPlay = () => (
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
const IconPlaylistAdd = ({color = 'currentColor'}) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="6" width="12" height="2" rx="1" fill={color}/><rect x="4" y="11" width="12" height="2" rx="1" fill={color}/><rect x="4" y="16" width="8" height="2" rx="1" fill={color}/><path d="M19 13v-2m-1 1h2" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>
);
const IconDelete = ({color = 'currentColor'}) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 7V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2m5 4v6m4-6v6" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>
);
const IconMinimize = ({color = '#ff5500'}) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="11" width="14" height="2" rx="1" fill={color}/></svg>
);
const IconChevronDown = ({color = '#ff5500'}) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const IconChevronUp = ({color = '#ff5500'}) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

// Компонент для сортируемого трека
function SortableTrack({ track, idx, selectedTrack, playFromPlaylist, openPlayerPopup, removeFromPlaylist, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isDraggingItem } = useSortable({ id: track.id });
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={selectedTrack && track.id === selectedTrack.id ? 'track-active' : ''}
      style={{
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        background: isDraggingItem ? '#333' : '#292929',
        borderRadius: 8,
        padding: '10px 16px',
        boxShadow: isDraggingItem ? '0 4px 16px #0006' : undefined,
        cursor: isDraggingItem ? 'grabbing' : 'grab',
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <img src={track.artwork && track.artwork['150x150'] ? track.artwork['150x150'] : 'https://audius.co/favicon.ico'} alt={track.title} width={40} height={40} style={{ borderRadius: 8, marginRight: 10, objectFit: 'cover' }} />
      <span style={{ flex: 1 }}>
        <b>{track.title}</b> <br />
        <span style={{ color: '#aaa' }}>{track.user && track.user.name}</span>
      </span>
      <button className="track-play-btn" onClick={() => { playFromPlaylist(idx); openPlayerPopup(); }}><IconPlay /></button>
      <button className="playlist-btn" title="Удалить из плейлиста" onClick={e => { e.stopPropagation(); removeFromPlaylist(track.id); }} disabled={isDragging}><IconDelete /></button>
    </li>
  );
}

// Вспомогательная функция для извлечения числового id из permalink
function extractTrackNumericId(permalink) {
  if (!permalink) return null;
  const match = permalink.match(/-(\d+)$/);
  return match ? match[1] : null;
}

function ErrorBoundary({ children }) {
  const [error, setError] = useState(null);
  if (error) {
    return <div style={{ color: '#ff5500', padding: 32, textAlign: 'center', fontSize: 20 }}>Что-то пошло не так: {error.message || error.toString()}</div>;
  }
  return (
    <React.Suspense fallback={<div style={{ color: '#ff5500', padding: 32, textAlign: 'center', fontSize: 20 }}>Загрузка...</div>}>
      {React.Children.map(children, child =>
        React.isValidElement(child)
          ? React.cloneElement(child, { onError: setError })
          : child
      )}
    </React.Suspense>
  );
}

const translations = {
  ru: {
    searchPlaceholder: 'Поиск трека...',
    searchButton: 'Поиск',
    nothingFound: 'Ничего не найдено',
    openPlaylist: 'Открыть плейлист',
    play: 'Воспроизвести',
    addToPlaylist: 'В плейлист',
    next: 'Следующий',
    prev: 'Предыдущий',
    buffering: 'Буферизация...',
    lightTheme: 'Светлая тема',
    darkTheme: 'Тёмная тема',
    switchTheme: 'Переключить тему',
    switchLang: 'Switch to English',
  },
  en: {
    searchPlaceholder: 'Search track...',
    searchButton: 'Search',
    nothingFound: 'Nothing found',
    openPlaylist: 'Open playlist',
    play: 'Play',
    addToPlaylist: 'Add to playlist',
    next: 'Next',
    prev: 'Previous',
    buffering: 'Buffering...',
    lightTheme: 'Light theme',
    darkTheme: 'Dark theme',
    switchTheme: 'Switch theme',
    switchLang: 'Переключить на русский',
  },
};

// Хук для медиа-запроса
function useMediaQuery(query) {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
}

function Page() {
  const [query, setQuery] = useState('');
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
  const [playlist, setPlaylist] = useState([]);
  const [playingFromPlaylist, setPlayingFromPlaylist] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showPlayerPopup, setShowPlayerPopup] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [buffered, setBuffered] = useState([]); // массив диапазонов буфера
  const [isBuffering, setIsBuffering] = useState(false); // индикатор буферизации
  const [tab, setTab] = useState('search');
  const [theme, setTheme] = useState('dark');
  const [lang, setLang] = useState('ru');
  const [playlistCollapsed, setPlaylistCollapsed] = useState(false);
  const [burgerOpen, setBurgerOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const isNarrow = useMediaQuery('(max-width: 600px)');
  const [shouldPlayOnTrackChange, setShouldPlayOnTrackChange] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  // Инициализация query и playlist из localStorage только на клиенте
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setQuery(localStorage.getItem('lastQuery') || '');
      try {
        const raw = localStorage.getItem(PLAYLIST_KEY);
        if (raw) {
          const { tracks, ts } = JSON.parse(raw);
          if (Date.now() - ts <= PLAYLIST_TTL) {
            // Добавляем streamId для каждого трека, если его нет
            setPlaylist((tracks || []).map(track => ({
              ...track,
              streamId: track.streamId || extractTrackNumericId(track.permalink),
            })));
          } else {
            localStorage.removeItem(PLAYLIST_KEY);
          }
        }
      } catch {
        // Ошибка при чтении из localStorage
      }
    }
  }, []);

  // Автофокус на поле поиска
  useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);

  // Сохранять последний запрос
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('lastQuery', query); }, [query]);

  // Сохранять плейлист
  useEffect(() => {
    if (isDragging) return; // Не синхронизируем во время drag
    if (typeof window !== 'undefined') localStorage.setItem(PLAYLIST_KEY, JSON.stringify({ tracks: playlist, ts: Date.now() }));
  }, [playlist, isDragging]);

  // Логирование изменений playlist и isDragging
  useEffect(() => {
    console.log('playlist changed', playlist.map(t => t.id), 'isDragging:', isDragging);
  }, [playlist, isDragging]);

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
      setShouldPlayOnTrackChange(true);
      setExpanded(false);
    }
  };

  // Следующий трек (с учётом очереди)
  const playNext = () => {
    if (selectedIndex >= 0 && selectedIndex < currentList.length - 1) {
      setSelectedTrack(currentList[selectedIndex + 1]);
      setShouldPlayOnTrackChange(true);
      setExpanded(false);
    } else {
      setIsPlaying(false);
    }
  };
  // Предыдущий трек
  const playPrev = () => playTrackAt(selectedIndex - 1);

  // Добавить в очередь
  // const addToQueue = track => { // Удалено как неиспользуемое
  //   setQueue(q => [...q, track]);
  // };

  // Добавить в плейлист
  const addToPlaylist = track => {
    setPlaylist(pl => pl.find(t => t.id === track.id) ? pl : [...pl, { ...track, streamId: track.streamId || extractTrackNumericId(track.permalink) }]);
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

  // Сбросить плеер полностью (останавливаем музыку)
  // Оставляем closePlayer только для явного закрытия, не вызываем при смене tab
  const closePlayer = () => {
    setSelectedTrack(null);
    setIsPlaying(false);
    setExpanded(false);
    setQueue([]);
    setShowPlayerPopup(false);
  };

  const searchTracks = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTracks([]);
    setOffset(0);
    setHasMore(false);
    try {
      const cleanQuery = query.replace(/#/g, '');
      const response = await fetch(`/api/audius/search?q=${encodeURIComponent(cleanQuery)}&offset=0`);
      const data = await response.json();
      const newTracks = (data.data || []).map(track => ({
        ...track,
        streamId: extractTrackNumericId(track.permalink),
      }));
      setTracks(newTracks);
      setHasMore(newTracks.length === 20);
      setOffset(20);
      // Если playing трек был из поиска, но его больше нет — сохраняем selectedTrack и isPlaying
      // (ничего не сбрасываем)
    } catch {
      alert('Ошибка поиска треков!');
    }
    setLoading(false);
  };

  // Функция для подгрузки ещё треков
  const loadMoreTracks = async () => {
    setLoading(true);
    try {
      const cleanQuery = query.replace(/#/g, '');
      const response = await fetch(`/api/audius/search?q=${encodeURIComponent(cleanQuery)}&offset=${offset}`);
      const data = await response.json();
      const newTracks = (data.data || []).map(track => ({
        ...track,
        streamId: extractTrackNumericId(track.permalink),
      }));
      setTracks(prev => [...prev, ...newTracks]);
      setHasMore(newTracks.length === 20);
      setOffset(prev => prev + 20);
    } catch {
      alert('Ошибка загрузки треков!');
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
    if (selectedTrack && playlist[idx] && selectedTrack.id === playlist[idx].id) {
      // Уже выбран этот трек — не перезапускать
      return;
    }
    setSelectedTrack(playlist[idx]);
    setShouldPlayOnTrackChange(true);
    setExpanded(false);
    setPlayingFromPlaylist(true);
  };

  // Воспроизвести из поиска
  const playFromSearch = idx => {
    setSelectedTrack(tracks[idx]);
    setShouldPlayOnTrackChange(true);
    setExpanded(false);
    setPlayingFromPlaylist(false);
  };

  // Открыть попап-плеер
  const openPlayerPopup = () => setShowPlayerPopup(true);
  const closePlayerPopup = () => setShowPlayerPopup(false); // просто скрываем попап, не останавливаем музыку

  // sensors для dnd-kit с поддержкой мобильных
  const isMobile = typeof window !== 'undefined' && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } })
  );

  // Обновление буфера
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateBuffered = () => {
      const buf = [];
      for (let i = 0; i < audio.buffered.length; i++) {
        buf.push({
          start: audio.buffered.start(i),
          end: audio.buffered.end(i),
        });
      }
      setBuffered(buf);
    };
    audio.addEventListener('progress', updateBuffered);
    updateBuffered();
    return () => {
      audio.removeEventListener('progress', updateBuffered);
    };
  }, [selectedTrack]);

  // События буферизации
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlay);
    return () => {
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlay);
    };
  }, [selectedTrack]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('tab');
      if (savedTab) setTab(savedTab);
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) setTheme(savedTheme);
      const savedLang = localStorage.getItem('lang');
      if (savedLang) setLang(savedLang);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tab', tab);
    }
    // Не сбрасываем selectedTrack и isPlaying при смене tab
  }, [tab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.body.classList.toggle('theme-light', theme === 'light');
      document.body.classList.toggle('theme-dark', theme === 'dark');
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', lang);
    }
  }, [lang]);

  // useEffect для устойчивого старта воспроизведения после смены трека
  useEffect(() => {
    if (!selectedTrack || !shouldPlayOnTrackChange) return;
    const audio = audioRef.current;
    if (!audio) return;
    const tryPlay = () => {
      audio.play().catch(() => {});
      setIsPlaying(true);
      setShouldPlayOnTrackChange(false);
    };
    if (audio.readyState >= 3) {
      tryPlay();
    } else {
      audio.addEventListener('canplay', tryPlay, { once: true });
      return () => {
        audio.removeEventListener('canplay', tryPlay);
      };
    }
  }, [selectedTrack, shouldPlayOnTrackChange]);

  const t = translations[lang];

  return (
    <ErrorBoundary>
      <BurgerMenu tab={tab} setTab={setTab} theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} t={t} />
      <PseudoRandomEQ isPlaying={isPlaying && !!selectedTrack} barCount={96} />
      {selectedTrack && selectedTrack.streamId && (
        <audio
          ref={audioRef}
          src={`/api/audius/stream/${selectedTrack.streamId}`}
          autoPlay={isPlaying}
          onEnded={playNext}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          style={{ display: 'none' }}
          controls={false}
        />
      )}
      {tab === 'search' && (
      <div className="App">
        <h1><span style={{ color: '#ff5500' }}>FREE</span>ZBY</h1>
          <SearchForm query={query} setQuery={setQuery} onSubmit={searchTracks} inputRef={inputRef} />
        {loading && (
            <div className="loader" role="status" aria-live="polite">
            <span className="loader-dot"></span>
            <span className="loader-dot"></span>
            <span className="loader-dot"></span>
              <span style={{ position: 'absolute', left: -9999 }} aria-live="polite">Загрузка...</span>
          </div>
        )}
        {!loading && tracks.length === 0 && (
            <div style={{ textAlign: 'center', color: '#aaa', marginTop: 30 }}>{t.nothingFound}</div>
        )}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tracks.map((track, idx) => (
              <TrackCard
                key={track.id}
                track={track}
                idx={idx}
                selectedTrack={selectedTrack}
                isPlaying={isPlaying}
                progress={selectedTrack && track.id === selectedTrack.id ? progress : 0}
                duration={selectedTrack && track.id === selectedTrack.id ? duration : 0}
                playFromSearch={playFromSearch}
                openPlayerPopup={openPlayerPopup}
                addToPlaylist={addToPlaylist}
                IconPlay={IconPlay}
                IconPause={IconPause}
                IconPlaylistAdd={IconPlaylistAdd}
                aria-label={`Воспроизвести трек ${track.title}`}
              />
          ))}
        </ul>
        {hasMore && !loading && (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <button onClick={loadMoreTracks} style={{ padding: 10, fontSize: 16 }}>{t.next}</button>
            </div>
          )}
        </div>
      )}
      {tab === 'player' && (
        <div className="App app-player">
          <div className="player-container">
            {isNarrow ? (
              <MiniPlayer
                asPortal={false}
                selectedTrack={selectedTrack}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onNext={playNext}
                onClose={() => { setSelectedTrack(null); setIsPlaying(false); }}
                progress={progress}
                duration={duration}
                formatTime={formatTime}
                IconPlay={IconPlay}
                IconPause={IconPause}
              />
            ) : (
              <Player
                selectedTrack={selectedTrack}
                isPlaying={isPlaying}
                audioRef={audioRef}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={playNext}
                playNext={playNext}
                playPrev={playPrev}
                progress={progress}
                duration={duration}
                buffered={buffered}
                isBuffering={isBuffering}
                handleSeek={handleSeek}
                handlePlayPause={handlePlayPause}
                formatTime={formatTime}
                IconPrev={IconPrev}
                IconNext={IconNext}
                IconPlay={IconPlay}
                IconPause={IconPause}
              />
            )}
          </div>
          {playlist.length > 0 && (
            <Playlist
              playlist={playlist}
                      selectedTrack={selectedTrack}
                      playFromPlaylist={playFromPlaylist}
                      openPlayerPopup={openPlayerPopup}
                      removeFromPlaylist={removeFromPlaylist}
              clearPlaylist={clearPlaylist}
                      isDragging={isDragging}
              setIsDragging={setIsDragging}
              sensors={sensors}
              IconChevronDown={IconChevronDown}
              IconChevronUp={IconChevronUp}
              arrayMove={arrayMove}
              playlistCollapsed={playlistCollapsed}
              setPlaylistCollapsed={setPlaylistCollapsed}
            />
          )}
        </div>
      )}
      {/* Мини-плеер: показываем только если выбран трек и tab === 'search' */}
      {tab === 'search' && selectedTrack && (
        <MiniPlayer
          asPortal={true}
          selectedTrack={selectedTrack}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onNext={playNext}
          onClose={() => { setSelectedTrack(null); setIsPlaying(false); }}
          progress={progress}
          duration={duration}
          formatTime={formatTime}
          IconPlay={IconPlay}
          IconPause={IconPause}
        />
      )}
    </ErrorBoundary>
  );
}

export default Page; 