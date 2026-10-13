import { Attendee, Team, PointTransaction, CloudSyncConfig, CloudSyncState } from '../types';
import { firebaseService } from './firebaseService';
import firebaseConfig from '../firebase/config.json';

const CONFIG_STORAGE_KEY = 'conpoint_firebase_config_v3';

export const cloudSyncService = {
  getConfig(): CloudSyncConfig {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }

    return {
      firebaseProjectId: firebaseConfig.webAppConfig.projectId,
      roomCode: firebaseConfig.databaseId,
      collectionName: 'convention_state',
      autoSyncIntervalMs: 3000,
      isEnabled: true
    };
  },

  saveConfig(config: CloudSyncConfig) {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  },

  // Generates link for staff to open the app on other phones
  generateOneTapSyncLink(): string {
    return typeof window !== 'undefined' ? window.location.href : '';
  },

  // Delegates push to linked Firebase Firestore
  async pushToCloud(data: {
    attendees: Attendee[];
    teams: Record<string, Team>;
    logs: PointTransaction[];
    adminName: string;
  }): Promise<{ success: boolean; error?: string; errorType?: CloudSyncState['errorType'] }> {
    try {
      const res = await firebaseService.publishLiveConvention({
        attendees: data.attendees,
        teams: data.teams,
        logs: data.logs,
        admins: [],
        adminName: data.adminName
      });
      return res;
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Push failed',
        errorType: 'NETWORK'
      };
    }
  },

  // Delegates pull to linked Firebase Firestore
  async pullFromCloud(): Promise<{
    success: boolean;
    data?: {
      attendees: Attendee[];
      teams: Record<string, Team>;
      logs: PointTransaction[];
      lastUpdatedBy: string;
      updatedAt: number;
    };
    error?: string;
    errorType?: CloudSyncState['errorType'];
  }> {
    return new Promise((resolve) => {
      try {
        const unsubscribe = firebaseService.subscribeToLiveConvention(
          (cloudData) => {
            unsubscribe();
            resolve({
              success: true,
              data: {
                attendees: cloudData.attendees,
                teams: cloudData.teams,
                logs: cloudData.logs,
                lastUpdatedBy: cloudData.lastUpdatedBy,
                updatedAt: cloudData.updatedAt
              }
            });
          },
          (err) => {
            resolve({
              success: false,
              error: err.message,
              errorType: 'NETWORK'
            });
          }
        );
      } catch (e) {
        resolve({
          success: false,
          error: e instanceof Error ? e.message : 'Error accessing Firestore',
          errorType: 'NETWORK'
        });
      }
    });
  },

  // Smart non-destructive merger for multiple admins working concurrently
  mergeData(
    local: { attendees: Attendee[]; teams: Record<string, Team>; logs: PointTransaction[] },
    remote: { attendees: Attendee[]; teams: Record<string, Team>; logs: PointTransaction[] }
  ): { attendees: Attendee[]; teams: Record<string, Team>; logs: PointTransaction[] } {
    const mergedTeams = { ...local.teams, ...remote.teams };

    const attendeeMap = new Map<string, Attendee>();
    local.attendees.forEach((a) => attendeeMap.set(a.id, a));

    remote.attendees.forEach((rem) => {
      const loc = attendeeMap.get(rem.id);
      if (!loc) {
        attendeeMap.set(rem.id, rem);
      } else {
        if (rem.points > loc.points || rem.checkInCount > loc.checkInCount) {
          attendeeMap.set(rem.id, rem);
        } else if (rem.name !== loc.name || rem.teamId !== loc.teamId || rem.tagId !== loc.tagId) {
          attendeeMap.set(rem.id, { ...loc, name: rem.name, teamId: rem.teamId, tagId: rem.tagId });
        }
      }
    });

    const logMap = new Map<string, PointTransaction>();
    local.logs.forEach((l) => logMap.set(l.id, l));
    remote.logs.forEach((l) => logMap.set(l.id, l));

    const mergedLogs = Array.from(logMap.values()).sort(
      (a, b) => parseInt(b.id.replace('log-', '')) - parseInt(a.id.replace('log-', ''))
    );

    return {
      attendees: Array.from(attendeeMap.values()),
      teams: mergedTeams,
      logs: mergedLogs
    };
  }
};
