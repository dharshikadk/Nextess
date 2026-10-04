import React from 'react';
import { ActivePage, ThemeMode, UserStats } from '../types';
import { MissionRuntime } from './mission/MissionRuntime';

interface MissionChamberViewProps {
  theme: ThemeMode;
  stats: UserStats;
  onNavigate: (page: ActivePage) => void;
  onAwardKP: (amount: number) => void;
  onShowToast: (msg: string) => void;
}

export const MissionChamberView: React.FC<MissionChamberViewProps> = ({ theme, stats, onNavigate, onShowToast }) => (
  <MissionRuntime
    theme={theme}
    isGuest={stats.isGuest}
    onNavigate={onNavigate}
    onExit={() => {
      onShowToast('Mission chamber closed.');
      onNavigate('missions-map');
    }}
    onShowToast={onShowToast}
  />
);
