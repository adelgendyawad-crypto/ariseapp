import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  Firestore
} from 'firebase/firestore';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  Auth,
  User
} from 'firebase/auth';
import firebaseConfig from '../firebase/config.json';
import { Attendee, Team, PointTransaction, AdminStaff } from '../types';
import { storageService } from './storageService';

// Initialize Firebase App, Firestore, and Auth targeting the user's linked database
const app = initializeApp(firebaseConfig.webAppConfig);
const db = getFirestore(app, firebaseConfig.databaseId);
const auth = getAuth(app);

// Unique session ID generated per device instance to differentiate local actions from remote updates
let deviceSessionId: string = '';
export function getDeviceSessionId(): string {
  if (!deviceSessionId) {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      let saved = window.sessionStorage.getItem('conpoint_device_session_id');
      if (!saved) {
        saved = 'DEV-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
        window.sessionStorage.setItem('conpoint_device_session_id', saved);
      }
      deviceSessionId = saved;
    } else {
      deviceSessionId = 'DEV-' + Math.random().toString(36).substring(2, 9);
    }
  }
  return deviceSessionId;
}

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

let activeUser: User | null = null;
let authPromise: Promise<User> | null = null;

export const firebaseService = {
  // Ensure an authenticated session exists before any read/write to satisfy `request.auth != null`
  async initAuth(): Promise<User> {
    if (activeUser) return activeUser;
    if (authPromise) return authPromise;

    authPromise = new Promise<User>((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          activeUser = user;
          unsubscribe();
          resolve(user);
        } else {
          try {
            const credential = await signInAnonymously(auth);
            activeUser = credential.user;
            unsubscribe();
            resolve(credential.user);
          } catch (err) {
            unsubscribe();
            reject(err);
          }
        }
      });
    });

    return authPromise;
  },

  // Real-time listener: triggers instantly whenever ANY admin anywhere adds points or edits players/groups
  subscribeToLiveConvention(
    onData: (data: ConventionCloudData) => void,
    onError: (err: Error) => void,
    onDocumentMissing?: () => void
  ): () => void {
    const docRef = doc(db, 'convention_state', 'live_data');

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const raw = snapshot.data();
          let parsedPayload = null;
          if (raw.payloadJson) {
            try {
              parsedPayload = JSON.parse(raw.payloadJson);
            } catch (e) {
              console.warn('Failed to parse payloadJson from Firestore:', e);
            }
          }

          onData({
            attendees: parsedPayload?.attendees || raw.attendees || [],
            teams: parsedPayload?.teams || raw.teams || {},
            logs: parsedPayload?.logs || raw.logs || [],
            admins: parsedPayload?.admins || raw.admins || [],
            lastUpdatedBy: raw.lastUpdatedBy || 'Staff Admin',
            updatedAt: raw.updatedAt || Date.now(),
            sourceSessionId: raw.sourceSessionId || '',
            actionSummary: raw.actionSummary || ''
          });
        } else {
          // Document does not exist or was deleted; trigger initial seeding
          if (onDocumentMissing) {
            onDocumentMissing();
          }
        }
      },
      (error) => {
        console.error('Firestore realtime listener error:', error);
        onError(error);
      }
    );

    return unsubscribe;
  },

  // Publish state updates to Firestore so all connected phones receive it instantly
  async publishLiveConvention(data: {
    attendees: Attendee[];
    teams: Record<string, Team>;
    logs: PointTransaction[];
    admins: AdminStaff[];
    adminName: string;
    actionSummary?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      await this.initAuth();
      const docRef = doc(db, 'convention_state', 'live_data');
      const sessionId = getDeviceSessionId();

      await setDoc(
        docRef,
        {
          updatedAt: Date.now(),
          lastUpdatedBy: data.adminName,
          sourceSessionId: sessionId,
          actionSummary: data.actionSummary || '',
          payloadJson: JSON.stringify({
            attendees: data.attendees,
            teams: data.teams,
            logs: data.logs.slice(0, 150),
            admins: data.admins
          })
        },
        { merge: true }
      );

      return { success: true };
    } catch (err) {
      console.error('Error publishing update to Firestore:', err);
      const message = err instanceof Error ? err.message : 'Unknown write error';
      return { success: false, error: message };
    }
  },

  // Re-establish clean cloud database
  async reinitializeCloudDatabase(cleanState?: {
    attendees?: Attendee[];
    teams?: Record<string, Team>;
    logs?: PointTransaction[];
    admins?: AdminStaff[];
    adminName?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      await this.initAuth();
      const docRef = doc(db, 'convention_state', 'live_data');

      const initialAttendees = cleanState?.attendees ?? storageService.loadAttendees();
      const initialTeams = cleanState?.teams ?? storageService.loadTeams();
      const initialLogs = cleanState?.logs ?? storageService.loadLogs();
      const initialAdmins = cleanState?.admins ?? storageService.loadAdmins();
      const staffName = cleanState?.adminName ?? 'System Setup';

      await setDoc(docRef, {
        updatedAt: Date.now(),
        lastUpdatedBy: staffName,
        sourceSessionId: getDeviceSessionId(),
        actionSummary: 'Database Initialized / Seeded',
        payloadJson: JSON.stringify({
          attendees: initialAttendees,
          teams: initialTeams,
          logs: initialLogs.slice(0, 150),
          admins: initialAdmins
        })
      });

      return { success: true };
    } catch (err) {
      console.error('Error re-establishing cloud database:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }
};
