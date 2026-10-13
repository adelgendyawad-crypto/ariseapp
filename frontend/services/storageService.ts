import { Attendee, Team, PointTransaction, AdminStaff } from '../types';
import { STORAGE_KEYS, INITIAL_TEAMS, INITIAL_ADMINS } from '../constants';

export const storageService = {
  loadTeams(): Record<string, Team> {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEAMS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading teams from storage:', e);
    }
    return INITIAL_TEAMS;
  },

  saveTeams(teams: Record<string, Team>) {
    try {
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
    } catch (e) {
      console.error('Failed to save teams to localStorage:', e);
    }
  },

  loadAttendees(): Attendee[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ATTENDEES);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        // Important: preserve empty array [] if user cleared all attendees!
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading attendees from storage:', e);
    }
    return [];
  },

  saveAttendees(attendees: Attendee[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.ATTENDEES, JSON.stringify(attendees));
    } catch (e) {
      console.error('Failed to save attendees to localStorage:', e);
    }
  },

  loadLogs(): PointTransaction[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading logs from storage:', e);
    }
    return [];
  },

  saveLogs(logs: PointTransaction[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save logs to localStorage:', e);
    }
  },

  loadAdmins(): AdminStaff[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADMINS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        if (Array.isArray(parsed) && parsed.length === 0) return INITIAL_ADMINS;
      }
    } catch (e) {
      console.warn('Error reading admins from storage:', e);
    }
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(INITIAL_ADMINS));
    return INITIAL_ADMINS;
  },

  saveAdmins(admins: AdminStaff[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
    } catch (e) {
      console.error('Failed to save admins to localStorage:', e);
    }
  },

  getActiveStaffId(): string {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_STAFF) || 'STAFF-01';
  },

  setActiveStaffId(id: string) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_STAFF, id);
  },

  // Export full convention database JSON for offline backup
  exportDatabaseBackup(): string {
    const data = {
      version: '4.0',
      exportedAt: new Date().toISOString(),
      teams: this.loadTeams(),
      attendees: this.loadAttendees(),
      admins: this.loadAdmins(),
      logs: this.loadLogs()
    };
    return JSON.stringify(data, null, 2);
  },

  // Restore database from uploaded JSON
  importDatabaseBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object') {
        if (parsed.teams) this.saveTeams(parsed.teams);
        if (Array.isArray(parsed.attendees)) this.saveAttendees(parsed.attendees);
        if (Array.isArray(parsed.admins)) this.saveAdmins(parsed.admins);
        if (Array.isArray(parsed.logs)) this.saveLogs(parsed.logs);
        return true;
      }
    } catch (e) {
      console.error('Failed to import database:', e);
    }
    return false;
  },

  // Clear completely to clean slate
  clearAllData() {
    this.saveAttendees([]);
    this.saveTeams({});
    this.saveLogs([]);
    this.saveAdmins([
      {
        id: 'STAFF-01',
        name: 'Lead Director',
        role: 'Convention Director',
        pin: '1234',
        avatar: 'https://picsum.photos/seed/director1/100/100',
        scansCount: 0
      }
    ]);
    this.setActiveStaffId('STAFF-01');
  }
};
