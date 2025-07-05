import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
      <button className="track-play-btn" onClick={() => { playFromPlaylist(idx); openPlayerPopup(); }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5V19L19 12L8 5Z" fill="currentColor"/></svg></button>
      <button className="playlist-btn" title="Удалить из плейлиста" onClick={e => { e.stopPropagation(); removeFromPlaylist(track.id); }} disabled={isDragging}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 7V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2m5 4v6m4-6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
    </li>
  );
}

export default SortableTrack; 