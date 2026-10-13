import { Attendee, Team, PointTransaction, AdminStaff } from '../types';
import { storageService } from './storageService';

export interface ConventionCloudData {
  attendees: Attendee[];
  teams: Record<string, Team>;
  logs: PointTransaction[];
  admins: AdminStaff[];
  lastUpdatedBy: string;
  updatedAt: number;
  sourceSessionId?: string;
  actionSummary?: string;
}

let deviceSessionId = '';

export function getDeviceSessionId(): string {
  if (!deviceSessionId) {
    const saved = window.sessionStorage.getItem('conpoint_device_session_id');
    deviceSessionId = saved || `DEV-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
    window.sessionStorage.setItem('conpoint_device_session_id', deviceSessionId);
  }
  return deviceSessionId;
}

async function requestState(): Promise<ConventionCloudData | null> {
  const response = await fetch('/api/convention-state');
  if (response.status === 404) return null;
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Database request failed (${response.status})`);
  }
  return response.json();
}

export const neonService = {
  async testConnection(): Promise<void> {
    const response = await fetch('/api/convention-state');
    if (!response.ok && response.status !== 404) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Database request failed (${response.status})`);
    }
  },

  subscribeToLiveConvention(
    onData: (data: ConventionCloudData) => void,
    onError: (err: Error) => void,
    onDocumentMissing?: () => void
  ): () => void {
    let stopped = false;
    let missingReported = false;
    let lastDeliveredAt = 0;
    const events = new EventSource('/api/convention-state/events');

    const deliver = (state: ConventionCloudData) => {
      if (!stopped && state.updatedAt > lastDeliveredAt) {
        lastDeliveredAt = state.updatedAt;
        onData(state);
      }
    };

    events.addEventListener('state', (event) => {
      if (stopped) return;
      try {
        deliver(JSON.parse((event as MessageEvent).data));
      } catch {
        onError(new Error('Received invalid state from the database.'));
      }
    });

    events.onerror = () => {
      if (!stopped) onError(new Error('Live database connection interrupted. Retrying…'));
    };

    // Polling also picks up writes handled by another backend instance.
    const poll = async () => {
      try {
        const state = await requestState();
        if (stopped) return;
        if (state) {
          missingReported = false;
          deliver(state);
        } else if (!missingReported) {
          missingReported = true;
          onDocumentMissing?.();
        }
      } catch (error) {
        if (!stopped) onError(error instanceof Error ? error : new Error('Database connection failed.'));
      }
    };

    void poll();
    const pollTimer = window.setInterval(poll, 3000);

    return () => {
      stopped = true;
      events.close();
      window.clearInterval(pollTimer);
    };
  },

  async publishLiveConvention(data: {
    attendees: Attendee[];
    teams: Record<string, Team>;
    logs: PointTransaction[];
    admins: AdminStaff[];
    adminName: string;
    actionSummary?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/convention-state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, sourceSessionId: getDeviceSessionId() }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Database write failed (${response.status})`);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown write error' };
    }
  },

  async reinitializeCloudDatabase(cleanState?: {
    attendees?: Attendee[];
    teams?: Record<string, Team>;
    logs?: PointTransaction[];
    admins?: AdminStaff[];
    adminName?: string;
  }): Promise<{ success: boolean; error?: string }> {
    return this.publishLiveConvention({
      attendees: cleanState?.attendees ?? storageService.loadAttendees(),
      teams: cleanState?.teams ?? storageService.loadTeams(),
      logs: cleanState?.logs ?? storageService.loadLogs(),
      admins: cleanState?.admins ?? storageService.loadAdmins(),
      adminName: cleanState?.adminName ?? 'System Setup',
      actionSummary: 'Database Initialized / Seeded',
    });
  },
};
