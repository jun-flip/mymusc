import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TrackCard from '../TrackCard';

describe('TrackCard', () => {
  const mockTrack = {
    id: '1',
    title: 'Track 1',
    user: { name: 'Artist 1' },
    artwork: { '150x150': 'test.jpg' },
  };
  it('renders track title and artist', () => {
    render(
      <TrackCard
        track={mockTrack}
        idx={0}
        selectedTrack={null}
        playFromSearch={() => {}}
        openPlayerPopup={() => {}}
        addToPlaylist={() => {}}
      />
    );
    expect(screen.getByText('Track 1')).toBeInTheDocument();
    expect(screen.getByText('Artist 1')).toBeInTheDocument();
  });
  it('calls playFromSearch and openPlayerPopup on play button click', () => {
    const playFromSearch = jest.fn();
    const openPlayerPopup = jest.fn();
    render(
      <TrackCard
        track={mockTrack}
        idx={0}
        selectedTrack={null}
        playFromSearch={playFromSearch}
        openPlayerPopup={openPlayerPopup}
        addToPlaylist={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /воспроизвести/i }));
    expect(playFromSearch).toHaveBeenCalledWith(0);
    expect(openPlayerPopup).toHaveBeenCalled();
  });
}); 