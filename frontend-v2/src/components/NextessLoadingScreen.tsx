import React, { useEffect, useRef, useState } from 'react';
import { ThemeMode } from '../types';

export const NEXTESS_DARK_LOADING_VIDEO = '/branding/Nextess_dlogo.mp4';
export const NEXTESS_LIGHT_LOADING_VIDEO = '/branding/Nextess_Llogo.mp4';
export const NEXTESS_DARK_LOGO_IMAGE = '/branding/Nextess_d_logo.jpg';
export const NEXTESS_LIGHT_LOGO_IMAGE = '/branding/Nextess_l_logo.jpg';

type LoadingMode = 'loading' | 'start';

interface NextessLoadingScreenProps {
  mode: LoadingMode;
  visible: boolean;
  theme: ThemeMode;
  onVideoComplete?: () => void;
  message?: string;
}

export const NextessLoadingScreen: React.FC<NextessLoadingScreenProps> = ({
  mode,
  visible,
  theme,
  onVideoComplete,
  message,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoComplete, setVideoComplete] = useState(false);
  const isDark = theme === 'dark';
  const isStart = mode === 'start';
  const loadingVideo = isDark ? NEXTESS_DARK_LOADING_VIDEO : NEXTESS_LIGHT_LOADING_VIDEO;
  const fallbackLogo = isDark ? NEXTESS_DARK_LOGO_IMAGE : NEXTESS_LIGHT_LOGO_IMAGE;

  useEffect(() => {
    setVideoFailed(false);
    setVideoComplete(false);
  }, [mode, visible, theme]);

  useEffect(() => {
    if (!visible || !videoRef.current) return;

    const video = videoRef.current;
    video.currentTime = 0;
    video.play().catch(() => {
      setVideoFailed(true);
      if (isStart) onVideoComplete?.();
    });
  }, [visible, mode, theme, isStart, onVideoComplete]);

  const handleVideoEnded = () => {
    if (isStart) {
      onVideoComplete?.();
      return;
    }

    // The loading animation is intentionally one-shot. Once the video finishes,
    // keep the already-loaded logo visible and let CSS provide the continuous flicker.
    setVideoComplete(true);
  };

  const handleVideoError = () => {
    setVideoFailed(true);
    if (isStart) onVideoComplete?.();
  };

  if (!visible) return null;

  const showFallback = videoFailed || videoComplete;

  return (
    <div
      className={`nextess-loading-screen ${isDark ? 'nextess-loading-dark' : 'nextess-loading-light'}${isStart ? ' nextess-start-screen' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={message || (isStart ? 'Starting Nextess' : 'Loading Nextess')}
    >
      <div className="nextess-loading-content">
        {showFallback ? (
          <img
            className="nextess-loading-fallback"
            src={fallbackLogo}
            alt="Nextess"
            decoding="async"
          />
        ) : (
          <video
            ref={videoRef}
            className="nextess-loading-video"
            src={loadingVideo}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={handleVideoEnded}
            onError={handleVideoError}
          />
        )}
        {message && <span className="nextess-loading-message">{message}</span>}
      </div>
    </div>
  );
};
