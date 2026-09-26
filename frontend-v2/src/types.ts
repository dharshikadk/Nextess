export type ActivePage =
  | 'dashboard'
  | 'missions' // default missions view (can be disciplines or map)
  | 'disciplines'
  | 'missions-map'
  | 'mission-detail'
  | 'mission-chamber'
  | 'leaderboard'
  | 'profile'
  | 'settings'
  | 'about';

export type ThemeMode = 'dark' | 'light';

export interface UserStats {
  kp: number;
  coins: number;
  streakDays: number;
  lockInDay: number;
  lockInTarget: number;
  level: number;
  title: string;
  name: string;
  handle: string;
  userClass: string;
  college: string;
  profession: string;
  isGuest: boolean;
  division: string;
  rank: number;
  accuracyRate: number;
  badgesCount: number;
  sparkySurgeActive: boolean;
  sparkyMinutesRemaining: number;
}

export interface LeaderboardEntry { rank:number; userId:string; name:string; username:string; kp:number; streakDays:number }
export interface V2DashboardData { user:any; streakDays:number; badgesCount:number; activeProgress:Array<{projectId:string;title:string;status:string;progressPercent:number}> }
