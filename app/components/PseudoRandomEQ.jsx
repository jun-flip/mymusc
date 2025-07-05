import React, { useState, useRef, useEffect } from 'react';

function PseudoRandomEQ({ isPlaying, barCount = 96 }) {
  const [heights, setHeights] = useState(() => Array(barCount).fill(18));
  const rafRef = useRef();

  useEffect(() => {
    if (!isPlaying) {
      setHeights(Array(barCount).fill(18));
      return;
    }
    let running = true;
    const animate = () => {
      if (!running) return;
      setHeights(prev => prev.map((h, i) => {
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

export default PseudoRandomEQ; 