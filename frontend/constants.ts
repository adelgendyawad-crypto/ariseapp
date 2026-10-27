import { Team, Attendee, AdminStaff, PointOption } from './types';

export const POINT_OPTIONS: PointOption[] = [2, 5, 10, 15, 20];

export const STORAGE_KEYS = {
  ATTENDEES: 'conpoint_attendees_v4',
  TEAMS: 'conpoint_teams_v4',
  LOGS: 'conpoint_logs_v4',
  ADMINS: 'conpoint_admins_v4',
  ACTIVE_STAFF: 'conpoint_active_staff_id_v4'
};

// Default empty or starter teams
export const INITIAL_TEAMS: Record<string, Team> = {};

// Default 1 primary admin so the app is immediately operable
export const INITIAL_ADMINS: AdminStaff[] = [
  {
    id: 'STAFF-01',
    name: 'Lead Director',
    role: 'Convention Director',
    pin: '1234',
    avatar: 'https://picsum.photos/seed/director1/100/100',
    scansCount: 0
  }
];

export const ACTIVITIES = [
  'Attendance',
  'Participation',
  'Indoor/Outdoor Games',
  'Good Deed',
  'Workshop contribution'
];

export const DEFAULT_FALLBACK_TEAM: Team = {
  id: 'team-general',
  name: 'General Attendee',
  colorHex: '#6366f1',
  badgeBg: 'bg-indigo-500/10',
  badgeBorder: 'border-indigo-500/30',
  textColor: 'text-indigo-400',
  mascot: '⭐'
};
