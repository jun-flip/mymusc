import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableTrack from './SortableTrack';

function Playlist({
  playlist,
  selectedTrack,
  playFromPlaylist,
  openPlayerPopup,
  removeFromPlaylist,
  clearPlaylist,
  isDragging,
  setIsDragging,
  sensors,
  IconChevronDown,
  IconChevronUp,
  arrayMove,
  playlistCollapsed,
  setPlaylistCollapsed,
}) {
  if (!playlist.length) return null;
  return (
    <div className={`playlist-popup${playlistCollapsed ? ' playlist-popup--collapsed' : ''}`} onClick={() => setIsDragging(false)} role="dialog" aria-modal="true">
      <div className="playlist-title playlist-title-sticky">
        <span className="playlist-title-text">Плейлист</span>
        <div className="playlist-title-actions">
          <button
            className="playlist-clear-btn"
            onClick={() => setPlaylistCollapsed && setPlaylistCollapsed(c => !c)}
            title={playlistCollapsed ? 'Развернуть плейлист' : 'Свернуть плейлист'}
            aria-label={playlistCollapsed ? 'Развернуть плейлист' : 'Свернуть плейлист'}
            disabled={isDragging}
          >
            {playlistCollapsed ? <IconChevronUp /> : <IconChevronDown />}
          </button>
        </div>
      </div>
      {!playlistCollapsed && (
        <div className="playlist-scrollable" onClick={e => e.stopPropagation()} style={{ overflowY: 'auto', maxHeight: '60vh', margin: 0, padding: 0 }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={({ active, over }) => {
              setIsDragging(false);
              if (active.id !== over?.id) {
                const oldIndex = playlist.findIndex(t => t.id === active.id);
                const newIndex = playlist.findIndex(t => t.id === over.id);
                arrayMove(playlist, oldIndex, newIndex);
              }
            }}
            onDragCancel={() => setIsDragging(false)}
          >
            <SortableContext items={playlist.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {playlist.map((track, idx) => (
                  <SortableTrack
                    key={track.id}
                    track={track}
                    idx={idx}
                    selectedTrack={selectedTrack}
                    playFromPlaylist={playFromPlaylist}
                    openPlayerPopup={openPlayerPopup}
                    removeFromPlaylist={removeFromPlaylist}
                    isDragging={isDragging}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          {/* Кнопка очистки плейлиста внизу */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '18px 0 6px 0' }}>
            <button
              className="playlist-clear-btn-text"
              onClick={e => { e.stopPropagation(); clearPlaylist(); }}
              disabled={isDragging}
              style={{ color: '#ff5500', background: 'none', border: 'none', fontSize: '1.08rem', cursor: 'pointer', padding: '8px 18px', borderRadius: 8 }}
              aria-label="Очистить плейлист"
            >
              Очистить плейлист
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Playlist; 