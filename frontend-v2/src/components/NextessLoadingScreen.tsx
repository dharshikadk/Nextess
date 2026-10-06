import React, { useEffect, useRef, useState } from 'react';
import { ThemeMode } from '../types';

export const NEXTESS_DARK_LOADING_VIDEO = '/LogoAssets/Nextess_dlogo.mp4';
export const NEXTESS_LIGHT_LOADING_VIDEO = '/LogoAssets/Nextess_Llogo.mp4';
export const NEXTESS_DARK_LOGO_IMAGE = '/LogoAssets/Nextess_d_logo.jpg';
export const NEXTESS_LIGHT_LOGO_IMAGE = '/LogoAssets/Nextess_l_logo.jpg';

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
  const isDark = theme === 'dark';
  const isStart = mode === 'start';
  const loadingVideo = isDark ? NEXTESS_DARK_LOADING_VIDEO : NEXTESS_LIGHT_LOADING_VIDEO;
  const fallbackLogo = isDark ? NEXTESS_DARK_LOGO_IMAGE : NEXTESS_LIGHT_LOGO_IMAGE;

  useEffect(() => {
    setVideoFailed(false);
  }, [mode, visible, theme]);

  useEffect(() => {
    if (!visible || !videoRef.current) return;
    videoRef.current.play().catch(() => setVideoFailed(true));
  }, [visible, mode, theme]);

  if (!visible) return null;

  return (
    <div
      className={`nextess-loading-screen ${isDark ? 'nextess-loading-dark' : 'nextess-loading-light'}${isStart ? ' nextess-start-screen' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={message || (isStart ? 'Starting Nextess' : 'Loading Nextess')}
    >
      <div className="nextess-loading-content">
        {!videoFailed ? (
          <video
            ref={videoRef}
            className="nextess-loading-video"
            src={loadingVideo}
            autoPlay
            muted
            playsInline
            loop={!isStart}
            preload="auto"
            onEnded={isStart ? onVideoComplete : undefined}
            onError={() => {
              setVideoFailed(true);
              if (isStart) onVideoComplete?.();
            }}
          />
        ) : (
          <img className="nextess-loading-fallback" src={fallbackLogo} alt="Nextess" />
        )}
        {message && <span className="nextess-loading-message">{message}</span>}
      </div>
    </div>
  );
};
