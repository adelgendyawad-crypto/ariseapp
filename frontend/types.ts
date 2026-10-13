export type TeamId = string;

export interface Team {
  id: TeamId;
  name: string;
  colorHex: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  mascot: string;
}

export interface Attendee {
  id: string; // e.g. "CON-001" to "CON-250"
  tagId: string; // e.g. "NFC-A1-01"
  name: string;
  role: 'Attendee' | 'Team Captain' | 'VIP' | 'Volunteer';
  teamId: TeamId;
  points: number;
  avatarUrl: string;
  lastScannedAt?: string;
  checkInCount: number;
}

export interface AdminStaff {
  id: string; // e.g. "STAFF-01"
  name: string;
  role: 'Convention Director' | 'Floor Manager' | 'Team Lead' | 'Scoring Marshall';
  pin: string;
  avatar: string;
  scansCount: number;
}

export interface PointTransaction {
  id: string;
  attendeeId: string;
  attendeeName: string;
  teamId: TeamId;
  pointsAwarded: number;
  activity: string;
  staffName: string;
  staffId?: string;
  timestamp: string;
  note?: string;
}

export type PointOption = 1 | 3 | 5 | 10 | 20;

export interface NfcScanResult {
  serialNumber?: string;
  tagId: string;
  recordData?: string;
}

export interface SyncPayload {
  version: number;
  updatedAt: number;
  sourceSessionId: string;
  sourceAdminId: string;
  sourceAdminName: string;
  actionSummary?: string;
  attendees: Attendee[];
  teams: Record<string, Team>;
  logs: PointTransaction[];
  admins?: AdminStaff[];
}

export type AppView = 'dashboard' | 'scanner' | 'players' | 'groups' | 'admins' | 'logs' | 'sync' | 'projector';
