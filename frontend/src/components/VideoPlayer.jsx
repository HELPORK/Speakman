import React, { useRef, useState } from 'react';

export default function VideoPlayer({ src, className = '' }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  function togglePlay(e) {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  function skip(seconds, e) {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(v.currentTime + seconds, 0), v.duration || Infinity);
  }

  return (
    <div className={`video-player ${className}`} onClick={(e) => e.stopPropagation()}>
      <video
        ref={videoRef}
        src={src}
        playsInline
        onEnded={() => setPlaying(false)}
        onClick={togglePlay}
      />
      <div className="video-controls">
        <button aria-label="Back 10 seconds" onClick={(e) => skip(-10, e)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M4 12a8 8 0 1 1 2.5 5.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M4 7v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>10</span>
        </button>
        <button className="video-play-btn" aria-label={playing ? 'Pause' : 'Play'} onClick={togglePlay}>
          {playing ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 4.5v15l13-7.5-13-7.5Z" />
            </svg>
          )}
        </button>
        <button aria-label="Forward 10 seconds" onClick={(e) => skip(10, e)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M20 12a8 8 0 1 0-2.5 5.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M20 7v5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>10</span>
        </button>
      </div>
    </div>
  );
}
