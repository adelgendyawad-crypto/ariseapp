import { Attendee, Team, PointTransaction, SyncPayload } from '../types';

type SyncCallback = (payload: SyncPayload) => void;

class RealtimeSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<SyncCallback> = new Set();
  private channelName: string = 'conpoint_live_mesh_channel';
  private syncVersion: number = 0;

  constructor() {
    this.initChannel();
    this.listenCrossTabStorage();
  }

  private initChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type === 'CONPOINT_STATE_SYNC') {
            const payload: SyncPayload = event.data.payload;
            this.notifyListeners(payload);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported in this frame:', err);
      }
    }
  }

  // Cross-window / Cross-tab instantaneous storage event listener
  private listenCrossTabStorage() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === 'conpoint_live_sync_pulse' && event.newValue) {
          try {
            const payload: SyncPayload = JSON.parse(event.newValue);
            this.notifyListeners(payload);
          } catch (e) {
            console.error('Error parsing storage sync pulse:', e);
          }
        }
      });
    }
  }

  public subscribe(cb: SyncCallback) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notifyListeners(payload: SyncPayload) {
    this.syncVersion = Math.max(this.syncVersion, payload.version);
    this.listeners.forEach((cb) => {
      try {
        cb(payload);
      } catch (err) {
        console.error('Error dispatching sync payload:', err);
      }
    });
  }

  // Broadcast immediate update to all staff devices & screens
  public broadcastUpdate(data: {
    sourceAdminId: string;
    sourceAdminName: string;
    actionSummary: string;
    attendees: Attendee[];
    teams: Record<string, Team>;
    logs: PointTransaction[];
  }) {
    this.syncVersion += 1;
    const payload: SyncPayload = {
      version: this.syncVersion,
      updatedAt: Date.now(),
      sourceAdminId: data.sourceAdminId,
      sourceAdminName: data.sourceAdminName,
      actionSummary: data.actionSummary,
      attendees: data.attendees,
      teams: data.teams,
      logs: data.logs
    };

    // 1. BroadcastChannel (active tabs/windows)
    if (this.channel) {
      try {
        this.channel.postMessage({
          type: 'CONPOINT_STATE_SYNC',
          payload
        });
      } catch {
        // Channel may be closing
      }
    }

    // 2. Storage event pulse (forces sync across any other browser session on this device)
    try {
      localStorage.setItem('conpoint_live_sync_pulse', JSON.stringify(payload));
    } catch {
      // Storage quota or restriction
    }
  }
}

export const syncService = new RealtimeSyncService();
