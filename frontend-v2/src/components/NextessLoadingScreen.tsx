import React, { useEffect, useRef, useState } from 'react';
export const NEXTESS_LOADING_VIDEO = '/branding/NextessLogo.webm';
export const NEXTESS_START_VIDEO = '/branding/Nextess-logo-start-animation.webm';
export const NEXTESS_LOGO_IMAGE = '/branding/NextessLogopic.png';
type LoadingMode = 'loading' | 'start';
interface NextessLoadingScreenProps { mode: LoadingMode; visible: boolean; onVideoComplete?: () => void; message?: string; }
export const NextessLoadingScreen: React.FC<NextessLoadingScreenProps> = ({ mode, visible, onVideoComplete, message }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const isStart = mode === 'start';
  useEffect(() => { setVideoFailed(false); }, [mode, visible]);
  useEffect(() => { if (!visible || !videoRef.current) return; videoRef.current.play().catch(() => setVideoFailed(true)); }, [visible, mode]);
  if (!visible) return null;
  return <div className={'nextess-loading-screen' + (isStart ? ' nextess-start-screen' : '')} role="status" aria-live="polite" aria-label={message || (isStart ? 'Starting Nextess' : 'Loading Nextess')}>
    <div className="nextess-loading-content">
      {!videoFailed ? <video ref={videoRef} className="nextess-loading-video" src={isStart ? NEXTESS_START_VIDEO : NEXTESS_LOADING_VIDEO} autoPlay muted playsInline loop={!isStart} preload="auto" onEnded={isStart ? onVideoComplete : undefined} onError={() => setVideoFailed(true)} /> : <img className="nextess-loading-fallback" src={NEXTESS_LOGO_IMAGE} alt="Nextess" />}
      {message && <span className="nextess-loading-message">{message}</span>}
    </div>
  </div>;
}