import React from 'react';
import { render, screen } from '@testing-library/react';
import Player from '../Player';

const mockTrack = {
  id: '1',
  title: 'Test Track',
  user: { name: 'Test Artist' },
  artwork: { '150x150': 'test.jpg' },
  streamId: '12345',
};

describe('Player', () => {
  it('renders track title and artist', () => {
    render(
      <Player
        selectedTrack={mockTrack}
        isPlaying={false}
        audioRef={{}}
        onPlay={() => {}}
        onPause={() => {}}
        onEnded={() => {}}
        playNext={() => {}}
        playPrev={() => {}}
        progress={0}
        duration={100}
        buffered={[]}
        isBuffering={false}
        handleSeek={() => {}}
        handlePlayPause={() => {}}
        formatTime={s => `${s}`}
        IconPrev={() => <span>Prev</span>}
        IconNext={() => <span>Next</span>}
        IconPlay={() => <span>Play</span>}
        IconPause={() => <span>Pause</span>}
      />
    );
    expect(screen.getByText('Test Track')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
    expect(screen.getByLabelText('Воспроизвести')).toBeInTheDocument();
    expect(screen.getByLabelText('Следующий трек')).toBeInTheDocument();
    expect(screen.getByLabelText('Предыдущий трек')).toBeInTheDocument();
  });
}); 