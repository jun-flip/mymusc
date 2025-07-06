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
  // Проверяем, что track существует и имеет необходимые свойства
  if (!track || !track.id) {
    console.error('Invalid track in SortableTrack:', track);
    return null;
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isDraggingItem } = useSortable({ id: track.id });
  
  const trackTitle = track.title || 'Без названия';
  const artistName = track.user?.name || 'Неизвестный исполнитель';
  const artworkUrl = track.artwork?.['150x150'] || 'https://audius.co/favicon.ico';

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
      <img src={artworkUrl} alt={trackTitle} width={40} height={40} style={{ borderRadius: 8, marginRight: 10, objectFit: 'cover' }} />
      <span style={{ flex: 1 }}>
        <b>{trackTitle}</b> <br />
        <span style={{ color: '#aaa' }}>{artistName}</span>
      </span>
      <button className="track-play-btn" onClick={() => { 
        try {
          playFromPlaylist(idx); 
          openPlayerPopup(); 
        } catch (error) {
          console.error('Error playing track:', error);
        }
      }}><IconPlay /></button>
      <button className="playlist-btn" title="Удалить из плейлиста" onClick={e => { 
        e.stopPropagation(); 
        try {
          removeFromPlaylist(track.id); 
        } catch (error) {
          console.error('Error removing track:', error);
        }
      }} disabled={isDragging}><IconDelete /></button>
    </li>
  );
}

// Вспомогательная функция для извлечения числового id из permalink
function extractTrackNumericId(permalink) {
  if (!permalink || typeof permalink !== 'string') {
    console.warn('Invalid permalink:', permalink);
    return null;
  }
  const match = permalink.match(/-(\d+)$/);
  return match ? match[1] : null;
}

// Правильный Error Boundary компонент
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || this.state.error?.toString() || 'Неизвестная ошибка';
      return (
        <div style={{ 
          color: '#ff5500', 
          padding: 32, 
          textAlign: 'center', 
          fontSize: 20,
          background: '#1a1a1a',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h2>Что-то пошло не так</h2>
          <p style={{ color: '#aaa', fontSize: 16, marginTop: 10 }}>{errorMessage}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: 20,
              padding: '10px 20px',
              background: '#ff5500',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            Перезагрузить страницу
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Компонент для обработки ошибок сети
function NetworkErrorHandler({ error, onRetry, onClose, onSkipNext }) {
  if (!error) return null;

  // Разбиваем сообщение на строки для лучшего отображения
  const errorLines = error.split('\n').filter(line => line.trim());

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      background: '#ff5500',
      color: 'white',
      padding: '15px 20px',
      borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 1000,
      maxWidth: 400,
      fontSize: 14,
      lineHeight: 1.4
    }}>
      <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <strong style={{ fontSize: 16 }}>⚠️ Ошибка воспроизведения</strong>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: 18,
            padding: 0,
            marginLeft: 10,
            lineHeight: 1
          }}
          aria-label="Закрыть"
        >
          ×
        </button>
      </div>
      
      <div style={{ marginBottom: 15 }}>
        {errorLines.map((line, index) => (
          <p key={index} style={{ 
            margin: index === 0 ? '0 0 8px 0' : '0 0 4px 0', 
            fontSize: index === 0 ? 14 : 13,
            opacity: index === 0 ? 1 : 0.9
          }}>
            {line}
          </p>
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {onRetry && (
          <button 
            onClick={onRetry}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 'bold',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
          >
            🔄 Попробовать снова
          </button>
        )}
        
        {onSkipNext && (
          <button 
            onClick={onSkipNext}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.25)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
          >
            ⏭️ Следующий трек
          </button>
        )}
        
        <button 
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 13,
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
          onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
        >
          Закрыть
        </button>
      </div>
    </div>
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
  const [isPlaying, setIsPlaying] = useState(false);
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
  const [networkError, setNetworkError] = useState(null); // состояние для ошибок сети
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState(null);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unavailableTracks, setUnavailableTracks] = useState(new Set());

  useEffect(() => { setIsClient(true); }, []);

  // Инициализация query и playlist из localStorage только на клиенте
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedQuery = localStorage.getItem('lastQuery');
        if (savedQuery && typeof savedQuery === 'string') {
          setQuery(savedQuery);
        }
        
        const raw = localStorage.getItem(PLAYLIST_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.tracks && Array.isArray(parsed.tracks) && parsed.ts) {
            if (Date.now() - parsed.ts <= PLAYLIST_TTL) {
              // Добавляем streamId для каждого трека, если его нет
              const validTracks = parsed.tracks.filter(track => track && track.id).map(track => ({
                ...track,
                streamId: track.streamId || extractTrackNumericId(track.permalink),
              }));
              setPlaylist(validTracks);
            } else {
              localStorage.removeItem(PLAYLIST_KEY);
            }
          }
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
        // Очищаем поврежденные данные
        try {
          localStorage.removeItem('lastQuery');
          localStorage.removeItem(PLAYLIST_KEY);
        } catch (cleanupError) {
          console.error('Error cleaning up localStorage:', cleanupError);
        }
      }
    }
  }, []);

  // Автофокус на поле поиска
  useEffect(() => { 
    try {
      if (inputRef.current && typeof inputRef.current.focus === 'function') {
        inputRef.current.focus();
      }
    } catch (error) {
      console.error('Error focusing input:', error);
    }
  }, []);

  // Сохранять последний запрос
  useEffect(() => { 
    if (typeof window !== 'undefined' && query && typeof query === 'string') {
      try {
        localStorage.setItem('lastQuery', query);
      } catch (error) {
        console.error('Error saving query to localStorage:', error);
      }
    }
  }, [query]);

  // Сохранять плейлист
  useEffect(() => {
    if (isDragging) return; // Не синхронизируем во время drag
    if (typeof window !== 'undefined' && Array.isArray(playlist)) {
      try {
        localStorage.setItem(PLAYLIST_KEY, JSON.stringify({ 
          tracks: playlist.filter(track => track && track.id), 
          ts: Date.now() 
        }));
      } catch (error) {
        console.error('Error saving playlist to localStorage:', error);
      }
    }
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
    if (!track || !track.id) {
      console.error('Cannot add invalid track to playlist:', track);
      return;
    }
    
    const trackWithStreamId = {
      ...track,
      streamId: track.streamId || extractTrackNumericId(track.permalink),
    };
    
    setPlaylist(pl => pl.find(t => t.id === track.id) ? pl : [...pl, trackWithStreamId]);
  };

  // Воспроизведение/пауза
  const handlePlayPause = () => {
    try {
      if (!audioRef.current) return;
      if (audioRef.current.paused) {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
          setIsPlaying(false);
        });
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error in handlePlayPause:', error);
      setIsPlaying(false);
    }
  };

  // Прогресс и длительность
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const update = () => {
      try {
        if (audio.currentTime !== undefined && audio.duration !== undefined) {
          setProgress(audio.currentTime);
          setDuration(audio.duration);
        }
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    };
    
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('durationchange', update);
    return () => {
      try {
        audio.removeEventListener('timeupdate', update);
        audio.removeEventListener('durationchange', update);
      } catch (error) {
        console.error('Error removing event listeners:', error);
      }
    };
  }, [selectedTrack]);

  // Перемотка по прогресс-бару
  const handleSeek = e => {
    try {
      if (!audioRef.current || !duration) return;
      const rect = e.target.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      if (isFinite(newTime) && newTime >= 0) {
        audioRef.current.currentTime = newTime;
      }
    } catch (error) {
      console.error('Error in handleSeek:', error);
    }
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

  const searchTracks = async (query) => {
    if (!query || !query.trim()) {
      console.warn('Empty search query');
      return;
    }

    setSearchQuery(query.trim());
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const response = await fetch(`/api/audius/search?q=${encodeURIComponent(query.trim())}&offset=0&limit=20`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search API error:', response.status, errorText);
        
        let errorMessage = 'Ошибка поиска';
        if (response.status === 502 || response.status === 503) {
          errorMessage = 'Сервис поиска временно недоступен. Попробуйте позже или поищите "demo" для тестовых треков.';
        } else if (response.status === 404) {
          errorMessage = 'Поиск не найден';
        } else if (response.status >= 500) {
          errorMessage = 'Внутренняя ошибка сервера';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data || !Array.isArray(data.data)) {
        console.error('Invalid search response:', data);
        throw new Error('Неверный формат ответа от сервера');
      }

      // Валидируем данные треков
      const validTracks = data.data.filter(track => 
        track && 
        track.id && 
        track.title && 
        typeof track.title === 'string' &&
        track.title.trim().length > 0
      );

      if (validTracks.length === 0) {
        setSearchResults([]);
        setSearchError('По вашему запросу ничего не найдено');
      } else {
        setSearchResults(validTracks);
        setSearchError(null);
      }

      setHasMoreResults(validTracks.length === 20);
      console.log(`Search successful: ${validTracks.length} tracks found`);
      
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setSearchError(error.message || 'Произошла ошибка при поиске');
    } finally {
      setIsSearching(false);
    }
  };

  const loadMoreTracks = async () => {
    if (!searchQuery || !searchQuery.trim() || isSearching || !hasMoreResults) {
      return;
    }

    setIsSearching(true);
    
    try {
      const nextOffset = searchResults.length;
      const response = await fetch(`/api/audius/search?q=${encodeURIComponent(searchQuery.trim())}&offset=${nextOffset}&limit=20`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Load more API error:', response.status, errorText);
        throw new Error('Ошибка загрузки дополнительных результатов');
      }

      const data = await response.json();
      
      if (!data || !Array.isArray(data.data)) {
        console.error('Invalid load more response:', data);
        throw new Error('Неверный формат ответа от сервера');
      }

      // Валидируем новые данные треков
      const validNewTracks = data.data.filter(track => 
        track && 
        track.id && 
        track.title && 
        typeof track.title === 'string' &&
        track.title.trim().length > 0
      );

      if (validNewTracks.length > 0) {
        setSearchResults(prev => [...prev, ...validNewTracks]);
        setHasMoreResults(validNewTracks.length === 20); // Если получили меньше 20, значит больше нет
      } else {
        setHasMoreResults(false);
      }

      console.log(`Load more successful: ${validNewTracks.length} additional tracks`);
      
    } catch (error) {
      console.error('Load more error:', error);
      setSearchError(error.message || 'Ошибка загрузки дополнительных результатов');
    } finally {
      setIsSearching(false);
    }
  };

  // Удалить из плейлиста
  const removeFromPlaylist = id => {
    setPlaylist(pl => pl.filter(t => t.id !== id));
  };

  // Очистить плейлист
  const clearPlaylist = () => setPlaylist([]);

  // Воспроизвести из плейлиста
  const playFromPlaylist = idx => {
    const track = playlist[idx];
    if (!track || !track.id) {
      console.error('Cannot play invalid track from playlist:', track);
      return;
    }
    
    if (selectedTrack && track.id === selectedTrack.id) {
      // Уже выбран этот трек — не перезапускать
      return;
    }
    setSelectedTrack(track);
    setShouldPlayOnTrackChange(true);
    setExpanded(false);
    setPlayingFromPlaylist(true);
  };

  // Воспроизвести из поиска
  const playFromSearch = idx => {
    const track = searchResults[idx];
    if (!track || !track.id) {
      console.error('Cannot play invalid track:', track);
      return;
    }
    
    try {
      setSelectedTrack(track);
      setShouldPlayOnTrackChange(true);
      setCurrentTrackIndex(idx);
      setCurrentTrackSource('search');
    } catch (error) {
      console.error('Error in playFromSearch:', error);
    }
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
      try {
        const buf = [];
        if (audio.buffered && audio.buffered.length) {
          for (let i = 0; i < audio.buffered.length; i++) {
            const start = audio.buffered.start(i);
            const end = audio.buffered.end(i);
            if (isFinite(start) && isFinite(end) && start >= 0 && end > start) {
              buf.push({ start, end });
            }
          }
        }
        setBuffered(buf);
      } catch (error) {
        console.error('Error updating buffer:', error);
        setBuffered([]);
      }
    };
    
    try {
      audio.addEventListener('progress', updateBuffered);
      updateBuffered();
    } catch (error) {
      console.error('Error setting up buffer listener:', error);
    }
    
    return () => {
      try {
        audio.removeEventListener('progress', updateBuffered);
      } catch (error) {
        console.error('Error removing buffer listener:', error);
      }
    };
  }, [selectedTrack]);

  // События буферизации
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleWaiting = () => {
      try {
        setIsBuffering(true);
      } catch (error) {
        console.error('Error in handleWaiting:', error);
      }
    };
    
    const handleCanPlay = () => {
      try {
        setIsBuffering(false);
      } catch (error) {
        console.error('Error in handleCanPlay:', error);
      }
    };
    
    try {
      audio.addEventListener('waiting', handleWaiting);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('canplaythrough', handleCanPlay);
    } catch (error) {
      console.error('Error setting up audio event listeners:', error);
    }
    
    return () => {
      try {
        audio.removeEventListener('waiting', handleWaiting);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('canplaythrough', handleCanPlay);
      } catch (error) {
        console.error('Error removing audio event listeners:', error);
      }
    };
  }, [selectedTrack]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTab = localStorage.getItem('tab');
        if (savedTab && ['search', 'player'].includes(savedTab)) {
          setTab(savedTab);
        }
        
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
          setTheme(savedTheme);
        }
        
        const savedLang = localStorage.getItem('lang');
        if (savedLang && ['ru', 'en'].includes(savedLang)) {
          setLang(savedLang);
        }
      } catch (error) {
        console.error('Error loading settings from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && tab && ['search', 'player'].includes(tab)) {
      try {
        localStorage.setItem('tab', tab);
      } catch (error) {
        console.error('Error saving tab to localStorage:', error);
      }
    }
    // Не сбрасываем selectedTrack и isPlaying при смене tab
  }, [tab]);

  useEffect(() => {
    if (typeof window !== 'undefined' && theme && ['light', 'dark'].includes(theme)) {
      try {
        document.body.classList.toggle('theme-light', theme === 'light');
        document.body.classList.toggle('theme-dark', theme === 'dark');
        localStorage.setItem('theme', theme);
      } catch (error) {
        console.error('Error applying theme:', error);
      }
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window !== 'undefined' && lang && ['ru', 'en'].includes(lang)) {
      try {
        localStorage.setItem('lang', lang);
      } catch (error) {
        console.error('Error saving language to localStorage:', error);
      }
    }
  }, [lang]);

  // useEffect для устойчивого старта воспроизведения после смены трека
  useEffect(() => {
    if (!selectedTrack || !shouldPlayOnTrackChange) return;
    const audio = audioRef.current;
    if (!audio) return;
    
    const tryPlay = () => {
      try {
        audio.play().catch(error => {
          console.error('Error playing audio in tryPlay:', error);
          setIsPlaying(false);
        });
        setIsPlaying(true);
        setShouldPlayOnTrackChange(false);
      } catch (error) {
        console.error('Error in tryPlay:', error);
        setIsPlaying(false);
        setShouldPlayOnTrackChange(false);
      }
    };
    
    try {
      if (audio.readyState >= 3) {
        tryPlay();
      } else {
        const handleCanPlay = () => {
          try {
            tryPlay();
          } catch (error) {
            console.error('Error in canplay handler:', error);
          }
        };
        
        audio.addEventListener('canplay', handleCanPlay, { once: true });
        return () => {
          try {
            audio.removeEventListener('canplay', handleCanPlay);
          } catch (error) {
            console.error('Error removing canplay listener:', error);
          }
        };
      }
    } catch (error) {
      console.error('Error setting up audio play:', error);
      setIsPlaying(false);
      setShouldPlayOnTrackChange(false);
    }
  }, [selectedTrack, shouldPlayOnTrackChange]);

  const t = translations[lang] || translations.ru; // fallback на русский

  // Проверяем, что все необходимые функции существуют
  const safePlayFromSearch = (idx) => {
    try {
      if (typeof playFromSearch === 'function') {
        playFromSearch(idx);
      } else {
        console.error('playFromSearch is not a function');
      }
    } catch (error) {
      console.error('Error in playFromSearch:', error);
    }
  };

  const safeOpenPlayerPopup = () => {
    try {
      if (typeof openPlayerPopup === 'function') {
        openPlayerPopup();
      } else {
        console.error('openPlayerPopup is not a function');
      }
    } catch (error) {
      console.error('Error in openPlayerPopup:', error);
    }
  };

  const safeAddToPlaylist = (track) => {
    try {
      if (typeof addToPlaylist === 'function') {
        addToPlaylist(track);
      } else {
        console.error('addToPlaylist is not a function');
      }
    } catch (error) {
      console.error('Error in addToPlaylist:', error);
    }
  };

  // Функция для повторной попытки воспроизведения текущего трека
  const retryCurrentTrack = () => {
    if (!selectedTrack) return;
    
    console.log('Retrying playback for track:', selectedTrack.title);
    setNetworkError(null); // Очищаем ошибку
    
    // Сбрасываем состояние аудио
    if (audioRef.current) {
      try {
        audioRef.current.load(); // Перезагружаем аудио элемент
        setShouldPlayOnTrackChange(true); // Запускаем воспроизведение
      } catch (error) {
        console.error('Error retrying track:', error);
        setNetworkError('Не удалось повторить воспроизведение');
      }
    }
  };

  // Функция для перехода к следующему треку при ошибке
  const skipToNextOnError = () => {
    console.log('Skipping to next track due to error');
    setNetworkError(null);
    playNext();
  };

  // Функция для проверки недоступности трека
  const isTrackUnavailable = (trackId) => {
    return unavailableTracks.has(trackId);
  };

  // Функция для отметки трека как недоступного
  const markTrackAsUnavailable = (trackId) => {
    setUnavailableTracks(prev => new Set([...prev, trackId]));
  };

  return (
    <ErrorBoundary>
      <div className="app">
        <NetworkErrorHandler 
          error={networkError} 
          onRetry={retryCurrentTrack}
          onClose={() => setNetworkError(null)}
          onSkipNext={skipToNextOnError}
        />
        
        <div className="main-content">
          <div className="search-section">
            <SearchForm 
              onSearch={searchTracks}
              isLoading={isSearching}
              searchResults={searchResults}
              loadMore={loadMoreTracks}
              hasMore={hasMoreResults}
            />
          </div>

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
              onError={(e) => {
                console.error('Audio error details:', {
                  error: e,
                  errorType: e?.type,
                  errorCode: e?.target?.error?.code,
                  errorMessage: e?.target?.error?.message,
                  trackId: selectedTrack?.id,
                  streamId: selectedTrack?.streamId,
                  trackTitle: selectedTrack?.title
                });
                
                setIsPlaying(false);
                
                // Отмечаем трек как недоступный
                if (selectedTrack?.id) {
                  markTrackAsUnavailable(selectedTrack.id);
                }
                
                // Определяем тип ошибки и показываем соответствующее сообщение
                let errorMessage = 'Не удалось воспроизвести трек';
                
                if (e?.target?.error) {
                  const error = e.target.error;
                  switch (error.code) {
                    case 1: // MEDIA_ERR_ABORTED
                      errorMessage = 'Воспроизведение было прервано';
                      break;
                    case 2: // MEDIA_ERR_NETWORK
                      errorMessage = 'Ошибка сети при загрузке аудио. Возможные причины:\n• Проблемы с интернет-соединением\n• Audius сервис временно недоступен\n• Трек удалён или недоступен';
                      break;
                    case 3: // MEDIA_ERR_DECODE
                      errorMessage = 'Ошибка декодирования аудио файла';
                      break;
                    case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
                      errorMessage = 'Формат аудио не поддерживается';
                      break;
                    default:
                      errorMessage = `Ошибка воспроизведения (код: ${error.code}). Возможные причины:\n• Трек временно недоступен\n• Проблемы с Audius сервисом\n• Трек был удалён`;
                  }
                } else {
                  // Если нет детальной информации об ошибке
                  errorMessage = 'Не удалось загрузить аудио. Возможные причины:\n• Трек удалён или недоступен\n• Временные проблемы с Audius\n• Проблемы с интернет-соединением';
                }
                
                setNetworkError(errorMessage);
                
                // Логируем для диагностики
                console.warn('Audio playback failed:', {
                  track: selectedTrack?.title,
                  artist: selectedTrack?.user?.name,
                  trackId: selectedTrack?.id,
                  streamId: selectedTrack?.streamId,
                  error: e
                });
              }}
              style={{ display: 'none' }}
              controls={false}
            />
          )}
          {tab === 'search' && (
          <div className="App">
            <h1><span style={{ color: '#ff5500' }}>FREE</span>ZBY</h1>
            {!loading && (!tracks || tracks.length === 0) && (
                <div style={{ textAlign: 'center', color: '#aaa', marginTop: 30 }}>{t.nothingFound}</div>
            )}
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {Array.isArray(tracks) && tracks.map((track, idx) => {
                if (!track || !track.id) {
                  console.warn('Skipping invalid track in render:', track);
                  return null;
                }
                return (
                  <TrackCard
                    key={track.id}
                    track={track}
                    idx={idx}
                    selectedTrack={selectedTrack}
                    isPlaying={isPlaying}
                    progress={selectedTrack && track.id === selectedTrack.id ? progress : 0}
                    duration={selectedTrack && track.id === selectedTrack.id ? duration : 0}
                    playFromSearch={safePlayFromSearch}
                    openPlayerPopup={safeOpenPlayerPopup}
                    addToPlaylist={safeAddToPlaylist}
                    IconPlay={IconPlay}
                    IconPause={IconPause}
                    IconPlaylistAdd={IconPlaylistAdd}
                    isTrackUnavailable={isTrackUnavailable}
                    aria-label={`Воспроизвести трек ${track.title || 'Без названия'}`}
                  />
                );
              })}
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
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default Page; 