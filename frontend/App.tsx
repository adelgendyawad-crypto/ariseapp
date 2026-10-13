import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Attendee, PointTransaction, AppView, Team, AdminStaff, SyncPayload } from './types';
import { audioService } from './services/audioService';
import { storageService } from './services/storageService';
import { syncService } from './services/syncService';
import { neonService, ConventionCloudData, getDeviceSessionId } from './services/neonService';
import { NfcScannerModal } from './components/NfcScannerModal';
import { RegisterNewTagModal } from './components/RegisterNewTagModal';
import { NfcScannerView } from './components/NfcScannerView';
import { LiveLeaderboard } from './components/LiveLeaderboard';
import { ManagePlayersView } from './components/ManagePlayersView';
import { ManageGroupsView } from './components/ManageGroupsView';
import { ManageAdminsView } from './components/ManageAdminsView';
import { ActivityLogView } from './components/ActivityLogView';
import { ProjectorView } from './components/ProjectorView';
import { AiCommentaryModal } from './components/AiCommentaryModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { SyncHubModal } from './components/SyncHubModal';
import { CloudSyncSettingsModal } from './components/CloudSyncSettingsModal';
import {
  Radio,
  Trophy,
  Users,
  Layers,
  History,
  Smartphone,
  Sparkles,
  Maximize2,
  Lock,
  Shield,
  Wifi,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function App() {
  const [view, setView] = useState<AppView>('dashboard');

  // Groups/Teams state (real-time Neon sync across all phones)
  const [teams, setTeams] = useState<Record<string, Team>>(() => storageService.loadTeams());

  // Attendees state (real-time Neon sync across all phones)
  const [attendees, setAttendees] = useState<Attendee[]>(() => storageService.loadAttendees());

  // Admin staff state (real-time Neon sync across all phones)
  const [admins, setAdmins] = useState<AdminStaff[]>(() => storageService.loadAdmins());
  const [activeStaffId, setActiveStaffId] = useState<string>(() => storageService.getActiveStaffId());

  // Transaction logs state (real-time Neon sync across all phones)
  const [logs, setLogs] = useState<PointTransaction[]>(() => storageService.loadLogs());

  // Admin Security Gate State: Mandatory selection of admin account + PIN
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('conpoint_auth_verified') === 'true';
  });

  const [nfcStatusText, setNfcStatusText] = useState<string>('NFC Ready');
  const [liveSyncToast, setLiveSyncToast] = useState<string | null>(null);
  const [showSyncHub, setShowSyncHub] = useState<boolean>(false);
  const [showCloudSettings, setShowCloudSettings] = useState<boolean>(false);

  // Neon PostgreSQL realtime connection status
  const [databaseStatus, setDatabaseStatus] = useState<{
    status: 'connecting' | 'connected' | 'error';
    lastSyncedAt: number | null;
    errorMessage: string | null;
    lastUpdatedBy?: string;
  }>({
    status: 'connecting',
    lastSyncedAt: null,
    errorMessage: null
  });

  // Active Scanned Attendee Modal
  const [scannedAttendee, setScannedAttendee] = useState<Attendee | null>(null);
  const [unregisteredTagId, setUnregisteredTagId] = useState<string | null>(null);
  const [showAiHype, setShowAiHype] = useState<boolean>(false);

  const localActionTimestamp = useRef<number>(0);

  // Save to local device storage as fallback
  useEffect(() => {
    storageService.saveTeams(teams);
  }, [teams]);

  useEffect(() => {
    storageService.saveAttendees(attendees);
  }, [attendees]);

  useEffect(() => {
    storageService.saveAdmins(admins);
  }, [admins]);

  useEffect(() => {
    storageService.setActiveStaffId(activeStaffId);
  }, [activeStaffId]);

  useEffect(() => {
    storageService.saveLogs(logs);
  }, [logs]);

  const activeStaff = admins.find((a) => a.id === activeStaffId) || admins[0] || {
    id: 'STAFF-01',
    name: 'Admin Host',
    role: 'Convention Director',
    pin: '1234',
    avatar: 'https://picsum.photos/seed/director1/100/100',
    scansCount: 0
  };

  // Peer-to-peer / BroadcastChannel synchronization (for instant tab/window responses)
  useEffect(() => {
    const unsubscribe = syncService.subscribe((payload: SyncPayload) => {
      audioService.playNfcTap();
      setAttendees(payload.attendees);
      setTeams(payload.teams);
      setLogs(payload.logs);
      if (payload.admins && payload.admins.length > 0) {
        setAdmins(payload.admins);
      }

      setLiveSyncToast(
        payload.actionSummary ||
          `Peer Sync: Updated by ${payload.sourceAdminName} (${new Date(payload.updatedAt).toLocaleTimeString()})`
      );
      setTimeout(() => setLiveSyncToast(null), 4000);
    });

    return () => unsubscribe();
  }, []);

  // Re-establish Neon cloud data with current local state
  const handleReestablishCloudData = useCallback(async () => {
    setDatabaseStatus((prev) => ({ ...prev, status: 'connecting', errorMessage: null }));
    const result = await neonService.reinitializeCloudDatabase({
      attendees,
      teams,
      logs,
      admins,
      adminName: activeStaff.name
    });

    if (result.success) {
      setDatabaseStatus({
        status: 'connected',
        lastSyncedAt: Date.now(),
        errorMessage: null,
        lastUpdatedBy: activeStaff.name
      });
      setLiveSyncToast('Neon PostgreSQL Connected & Synced!');
      setTimeout(() => setLiveSyncToast(null), 4000);
    } else {
      setDatabaseStatus({
        status: 'error',
        lastSyncedAt: null,
        errorMessage: result.error || 'Failed to re-establish'
      });
    }
  }, [attendees, teams, logs, admins, activeStaff.name]);

  // Realtime Neon PostgreSQL listener across all phones
  useEffect(() => {
    let unsubscribeDatabase: (() => void) | null = null;

    async function setupDatabase() {
      try {
        setDatabaseStatus((prev) => ({ ...prev, status: 'connecting' }));

        unsubscribeDatabase = neonService.subscribeToLiveConvention(
          (cloudData: ConventionCloudData) => {
            const mySessionId = getDeviceSessionId();
            const isFromOtherDevice = cloudData.sourceSessionId !== mySessionId;
            const timeSinceLocalAction = Date.now() - localActionTimestamp.current;

            // When an update arrives from another admin's phone, update all screens instantly
            if (isFromOtherDevice || timeSinceLocalAction > 1500) {
              setAttendees(cloudData.attendees);
              setTeams(cloudData.teams);
              setLogs(cloudData.logs);
              if (cloudData.admins && cloudData.admins.length > 0) {
                setAdmins(cloudData.admins);
              }

              if (isFromOtherDevice) {
                audioService.playNfcTap();
                setLiveSyncToast(
                  cloudData.actionSummary ||
                    `Cloud Sync: Updated by ${cloudData.lastUpdatedBy} (${new Date(cloudData.updatedAt).toLocaleTimeString()})`
                );
                setTimeout(() => setLiveSyncToast(null), 3500);
              }
            }

            setDatabaseStatus({
              status: 'connected',
              lastSyncedAt: cloudData.updatedAt || Date.now(),
              errorMessage: null,
              lastUpdatedBy: cloudData.lastUpdatedBy
            });
          },
          (err) => {
            console.error('Neon realtime subscription error:', err);
            setDatabaseStatus({
              status: 'error',
              lastSyncedAt: null,
              errorMessage: err.message
            });
          },
          () => {
            // Cloud document does not exist yet; auto-seed it with the current state
            handleReestablishCloudData();
          }
        );
      } catch (err: unknown) {
        console.error('Neon database initialization error:', err);
        setDatabaseStatus({
          status: 'error',
          lastSyncedAt: null,
          errorMessage: err instanceof Error ? err.message : 'Database connection error'
        });
      }
    }

    setupDatabase();

    return () => {
      if (unsubscribeDatabase) {
        unsubscribeDatabase();
      }
    };
  }, [activeStaff.name, handleReestablishCloudData]);

  // Master broadcast function: writes to Neon and the local mesh simultaneously
  const broadcastMeshUpdate = useCallback(
    (actionSummary: string, newAttendees = attendees, newTeams = teams, newLogs = logs, newAdmins = admins) => {
      localActionTimestamp.current = Date.now();

      // 1. Instant Peer-to-peer Broadcast
      syncService.broadcastUpdate({
        sourceSessionId: getDeviceSessionId(),
        sourceAdminId: activeStaff.id,
        sourceAdminName: activeStaff.name,
        actionSummary,
        attendees: newAttendees,
        teams: newTeams,
        logs: newLogs,
        admins: newAdmins
      });

      // 2. Publish to Neon PostgreSQL so all other phones update immediately
      neonService
        .publishLiveConvention({
          attendees: newAttendees,
          teams: newTeams,
          logs: newLogs,
          admins: newAdmins,
          adminName: activeStaff.name,
          actionSummary
        })
        .then((res) => {
          if (res.success) {
            setDatabaseStatus({
              status: 'connected',
              lastSyncedAt: Date.now(),
              errorMessage: null,
              lastUpdatedBy: activeStaff.name
            });
          } else {
            setDatabaseStatus((prev) => ({
              ...prev,
              status: 'error',
              errorMessage: res.error || 'Failed to sync to cloud'
            }));
          }
        })
        .catch(() => {
          // Gracefully handles network blips
        });
    },
    [activeStaff, attendees, teams, logs, admins]
  );

  // Compute team scores
  const teamScores = React.useMemo(() => {
    const scores: Record<string, number> = {};
    attendees.forEach((a) => {
      scores[a.teamId] = (scores[a.teamId] || 0) + a.points;
    });
    return scores;
  }, [attendees]);

  // Handle whenever ANY NFC Tag is scanned (from phone hardware or screen buttons)
  const handleNfcTagScanned = useCallback(
    (scannedTag: string) => {
      audioService.playNfcTap();
      const cleanTag = scannedTag.trim().toLowerCase();

      const matched = attendees.find(
        (a) => a.tagId.toLowerCase() === cleanTag || a.id.toLowerCase() === cleanTag
      );

      if (matched) {
        setUnregisteredTagId(null);
        setScannedAttendee(matched);
      } else {
        setScannedAttendee(null);
        setUnregisteredTagId(scannedTag.trim());
      }
    },
    [attendees]
  );

  // Hardware Web NFC background listener for phone sensor
  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      try {
        // @ts-expect-error Web NFC NDEFReader API
        const ndef = new window.NDEFReader();
        ndef
          .scan()
          .then(() => {
            setNfcStatusText('Phone NFC Sensor Active • Ready to scan wristbands');

            // @ts-expect-error NDEFReader onreading
            ndef.onreading = (event: { serialNumber?: string }) => {
              const serial = event.serialNumber || `NFC-${Math.floor(10 + Math.random() * 89)}`;
              handleNfcTagScanned(serial);
            };

            // @ts-expect-error NDEFReader onreadingerror
            ndef.onreadingerror = () => {
              setNfcStatusText('Tag read error, hold wristband steady against phone');
            };
          })
          .catch((err: unknown) => {
            console.warn('Web NFC scan error:', err);
            setNfcStatusText('Web NFC permissions required or simulator mode active');
          });
      } catch (err) {
        console.warn('NDEFReader not available:', err);
      }
    } else {
      setNfcStatusText('NFC Scanner Ready (Web NFC / Virtual)');
    }
  }, [handleNfcTagScanned]);

  // Award Points to a player
  const handleAwardPoints = (attendeeId: string, points: number, activity: string, note?: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let updatedPlayerName = '';
    const updatedAttendees = attendees.map((a) => {
      if (a.id === attendeeId) {
        updatedPlayerName = a.name;
        return {
          ...a,
          points: a.points + points,
          checkInCount: a.checkInCount + 1,
          lastScannedAt: 'Just now'
        };
      }
      return a;
    });

    setAttendees(updatedAttendees);

    const updatedAdmins = admins.map((adm) =>
      adm.id === activeStaffId ? { ...adm, scansCount: adm.scansCount + 1 } : adm
    );
    setAdmins(updatedAdmins);

    const target = attendees.find((a) => a.id === attendeeId);
    let updatedLogs = logs;
    if (target) {
      const newLog: PointTransaction = {
        id: `log-${Date.now()}`,
        attendeeId: target.id,
        attendeeName: target.name,
        teamId: target.teamId,
        pointsAwarded: points,
        activity,
        staffName: activeStaff.name,
        staffId: activeStaff.id,
        timestamp: timeStr,
        note
      };
      updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
    }

    broadcastMeshUpdate(
      `Points added: +${points} pts to ${updatedPlayerName} by ${activeStaff.name}`,
      updatedAttendees,
      teams,
      updatedLogs,
      updatedAdmins
    );
  };

  // Register newly matched NFC tag
  const handleRegisterNewTagPlayer = (newAttendee: Attendee, startingPoints: number) => {
    audioService.playPointSuccess(startingPoints || 5);
    const updatedAttendees = [newAttendee, ...attendees];
    setAttendees(updatedAttendees);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newLog: PointTransaction = {
      id: `log-${Date.now()}`,
      attendeeId: newAttendee.id,
      attendeeName: newAttendee.name,
      teamId: newAttendee.teamId,
      pointsAwarded: startingPoints,
      activity: 'NFC Badge Registration & Initial Check-In',
      staffName: activeStaff.name,
      staffId: activeStaff.id,
      timestamp: timeStr,
      note: `Paired with tag: ${newAttendee.tagId}`
    };
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);

    setUnregisteredTagId(null);
    setScannedAttendee(newAttendee);

    broadcastMeshUpdate(
      `New player registered: ${newAttendee.name} by ${activeStaff.name}`,
      updatedAttendees,
      teams,
      updatedLogs,
      admins
    );
  };

  // Undo transaction
  const handleUndoLog = (logId: string) => {
    const targetLog = logs.find((l) => l.id === logId);
    if (!targetLog) return;

    const updatedAttendees = attendees.map((a) => {
      if (a.id === targetLog.attendeeId) {
        return {
          ...a,
          points: Math.max(0, a.points - targetLog.pointsAwarded)
        };
      }
      return a;
    });

    const updatedLogs = logs.filter((l) => l.id !== logId);
    setAttendees(updatedAttendees);
    setLogs(updatedLogs);

    broadcastMeshUpdate(
      `Transaction reversed for ${targetLog.attendeeName} (-${targetLog.pointsAwarded} pts)`,
      updatedAttendees,
      teams,
      updatedLogs,
      admins
    );
  };

  // Players Management Handlers
  const handleAddPlayer = (newPlayer: Attendee) => {
    const updated = [newPlayer, ...attendees];
    setAttendees(updated);
    broadcastMeshUpdate(`Player added: ${newPlayer.name}`, updated, teams, logs, admins);
  };

  const handleBulkAddPlayers = (newPlayers: Attendee[]) => {
    const updated = [...newPlayers, ...attendees];
    setAttendees(updated);
    broadcastMeshUpdate(`Bulk imported ${newPlayers.length} players`, updated, teams, logs, admins);
  };

  const handleClearAllPlayers = () => {
    setAttendees([]);
    storageService.saveAttendees([]);
    broadcastMeshUpdate(`All players cleared from roster`, [], teams, logs, admins);
  };

  const handleEditPlayer = (updatedPlayer: Attendee) => {
    const updated = attendees.map((a) => (a.id === updatedPlayer.id ? updatedPlayer : a));
    setAttendees(updated);
    broadcastMeshUpdate(`Updated player: ${updatedPlayer.name}`, updated, teams, logs, admins);
  };

  const handleDeletePlayer = (playerId: string) => {
    const target = attendees.find((a) => a.id === playerId);
    const updated = attendees.filter((a) => a.id !== playerId);
    setAttendees(updated);
    broadcastMeshUpdate(`Removed player: ${target?.name || playerId}`, updated, teams, logs, admins);
  };

  // Groups Management Handlers
  const handleAddGroup = (newGroup: Team) => {
    const updated = { ...teams, [newGroup.id]: newGroup };
    setTeams(updated);
    broadcastMeshUpdate(`Created group: ${newGroup.name}`, attendees, updated, logs, admins);
  };

  const handleEditGroup = (updatedGroup: Team) => {
    const updated = { ...teams, [updatedGroup.id]: updatedGroup };
    setTeams(updated);
    broadcastMeshUpdate(`Updated group: ${updatedGroup.name}`, attendees, updated, logs, admins);
  };

  const handleDeleteGroup = (groupId: string) => {
    const remainingTeamIds = Object.keys(teams).filter((id) => id !== groupId);
    const fallbackId = remainingTeamIds[0] || 'team-general';

    const updatedAttendees = attendees.map((a) =>
      a.teamId === groupId ? { ...a, teamId: fallbackId } : a
    );

    const updatedTeams = { ...teams };
    delete updatedTeams[groupId];

    setAttendees(updatedAttendees);
    setTeams(updatedTeams);
    broadcastMeshUpdate(`Deleted group: ${groupId}`, updatedAttendees, updatedTeams, logs, admins);
  };

  // Admins Handlers
  const handleAddAdmin = (newAdmin: AdminStaff) => {
    const updated = [...admins, newAdmin];
    setAdmins(updated);
    broadcastMeshUpdate(`Added admin staff: ${newAdmin.name}`, attendees, teams, logs, updated);
  };

  const handleDeleteAdmin = (adminId: string) => {
    setAdmins((prev) => {
      const remaining = prev.filter((a) => a.id !== adminId);
      if (activeStaffId === adminId && remaining.length > 0) {
        setActiveStaffId(remaining[0].id);
      }
      broadcastMeshUpdate(`Removed admin staff ID ${adminId}`, attendees, teams, logs, remaining);
      return remaining;
    });
  };

  const handleClearAllData = () => {
    storageService.clearAllData();
    const freshTeams = storageService.loadTeams();
    const freshAdmins = storageService.loadAdmins();
    setTeams(freshTeams);
    setAttendees([]);
    setAdmins(freshAdmins);
    setActiveStaffId(storageService.getActiveStaffId());
    setLogs([]);
    broadcastMeshUpdate(`System data cleared to clean slate`, [], freshTeams, [], freshAdmins);
  };

  const handleDatabaseRestored = () => {
    const restoredTeams = storageService.loadTeams();
    const restoredAttendees = storageService.loadAttendees();
    const restoredLogs = storageService.loadLogs();
    const restoredAdmins = storageService.loadAdmins();
    setTeams(restoredTeams);
    setAttendees(restoredAttendees);
    setAdmins(restoredAdmins);
    setLogs(restoredLogs);
    setActiveStaffId(storageService.getActiveStaffId());
    broadcastMeshUpdate(
      `Database restored from backup snapshot`,
      restoredAttendees,
      restoredTeams,
      restoredLogs,
      restoredAdmins
    );
  };

  const handleAdminAuthenticated = (admin: AdminStaff) => {
    setActiveStaffId(admin.id);
    setIsAuthenticated(true);
    sessionStorage.setItem('conpoint_auth_verified', 'true');
  };

  // Fullscreen Projector Mode
  if (view === 'projector') {
    return <ProjectorView attendees={attendees} teams={teams} onExit={() => setView('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* MANDATORY ADMIN GATE MODAL */}
      {!isAuthenticated && (
        <AdminAuthModal
          admins={admins}
          currentStaffId={activeStaffId}
          onAuthenticated={handleAdminAuthenticated}
          onContinueAsGuestProjector={() => {
            setIsAuthenticated(true);
            setView('projector');
          }}
        />
      )}

      {/* Real-time synchronization Toast alert */}
      {liveSyncToast && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-fadeIn backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold">{liveSyncToast}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg text-white tracking-tight">ConPoint NFC</h1>
              <button
                onClick={() => setShowCloudSettings(true)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 transition ${
                  databaseStatus.status === 'connected'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : databaseStatus.status === 'error'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                }`}
                title="Neon PostgreSQL Status (Click for details)"
              >
                <Cloud className="w-3 h-3" />
                <span>
                  {databaseStatus.status === 'connected'
                    ? 'Neon Live Synced'
                    : databaseStatus.status === 'connecting'
                    ? 'Connecting...'
                    : 'Cloud Notice (Click)'}
                </span>
              </button>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {attendees.length} Attendees • {Object.keys(teams).length} Groups • Real-Time Neon Sync Across All Phones
            </p>
          </div>
        </div>

        {/* Header Right controls */}
        <div className="flex items-center gap-2.5">
          {/* Active Admin Indicator & Switch Account */}
          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 text-xs transition"
            title="Switch Staff Account"
          >
            <img src={activeStaff.avatar} alt={activeStaff.name} className="w-5 h-5 rounded-md object-cover" />
            <span className="hidden sm:inline font-semibold text-slate-200">{activeStaff.name}</span>
            <span className="text-[10px] text-indigo-400 font-mono">({activeStaff.id})</span>
          </button>

          {/* Cloud Database Hub */}
          <button
            onClick={() => setShowCloudSettings(true)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
              databaseStatus.status === 'connected'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title="Cloud Server Database Sync"
          >
            <Cloud className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Neon Hub</span>
          </button>

          {/* Quick NFC Scanner Tab Jump */}
          <button
            onClick={() => setView('scanner')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 transition active:scale-95 ${
              view === 'scanner'
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/50'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white shadow-emerald-600/20'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Phone NFC</span>
            <span className="sm:hidden">NFC</span>
          </button>

          {/* AI Stadium PA */}
          <button
            onClick={() => setShowAiHype(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-semibold text-xs flex items-center gap-1.5 transition"
            title="AI Arena Announcer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">AI PA</span>
          </button>

          {/* Projector Fullscreen Mode */}
          <button
            onClick={() => setView('projector')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Launch Stage Projector"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Lock Terminal Gate */}
          <button
            onClick={() => {
              sessionStorage.removeItem('conpoint_auth_verified');
              setIsAuthenticated(false);
            }}
            className="p-2 rounded-xl border bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
            title="Lock Staff Terminal"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Re-establish notification if disconnected or document missing */}
      {databaseStatus.status === 'error' && (
        <div className="bg-amber-950/80 border-b border-amber-500/50 px-4 py-2.5 text-xs text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Neon Real-Time Status:</strong> {databaseStatus.errorMessage || 'Cloud data is unavailable.'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleReestablishCloudData}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center gap-1 shadow"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-establish Cloud Data
            </button>
            <button
              onClick={() => setShowCloudSettings(true)}
              className="underline text-amber-300 text-[11px]"
            >
              Settings
            </button>
          </div>
        </div>
      )}

      {/* NFC Status Banner */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-mono text-emerald-300">{nfcStatusText}</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[11px]">
          <span>Point Increments: <strong>+1, +3, +5, +10, +20 pts</strong></span>
          <span>•</span>
          <span>Logged in: <strong className="text-white">{activeStaff.name}</strong></span>
          <span>•</span>
          <button
            onClick={() => setShowCloudSettings(true)}
            className="text-emerald-400 hover:underline flex items-center gap-1"
          >
            <Wifi className="w-3 h-3" /> Cloud Database: Neon PostgreSQL
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setView('dashboard')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition ${
              view === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Trophy className="w-4 h-4" /> Team Standings & MVPs
          </button>

          <button
            onClick={() => setView('scanner')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition ${
              view === 'scanner'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-emerald-400/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" /> Phone NFC Scanner
          </button>

          <button
            onClick={() => setView('players')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition ${
              view === 'players'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-400" /> Players & Roster ({attendees.length})
          </button>

          <button
            onClick={() => setView('groups')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition ${
              view === 'groups'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-400" /> Groups ({Object.keys(teams).length})
          </button>

          <button
            onClick={() => setView('admins')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition ${
              view === 'admins'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-400" /> Staff Admins ({admins.length})
          </button>

          <button
            onClick={() => setView('logs')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition ${
              view === 'logs'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <History className="w-4 h-4" /> Audit Logs ({logs.length})
          </button>
        </div>

        {/* View Switching */}
        {view === 'dashboard' && (
          <LiveLeaderboard
            attendees={attendees}
            teams={teams}
            onSelectAttendee={(att) => handleNfcTagScanned(att.tagId)}
            onOpenProjector={() => setView('projector')}
          />
        )}

        {view === 'scanner' && (
          <NfcScannerView
            attendees={attendees}
            teams={teams}
            onTagScanned={handleNfcTagScanned}
          />
        )}

        {view === 'players' && (
          <ManagePlayersView
            attendees={attendees}
            teams={teams}
            onAddPlayer={handleAddPlayer}
            onBulkAddPlayers={handleBulkAddPlayers}
            onClearAllPlayers={handleClearAllPlayers}
            onEditPlayer={handleEditPlayer}
            onDeletePlayer={handleDeletePlayer}
            onSimulateNfcTap={(att) => handleNfcTagScanned(att.tagId)}
          />
        )}

        {view === 'groups' && (
          <ManageGroupsView
            teams={teams}
            attendees={attendees}
            onAddGroup={handleAddGroup}
            onEditGroup={handleEditGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        )}

        {view === 'admins' && (
          <ManageAdminsView
            admins={admins}
            activeStaffId={activeStaffId}
            onSelectActiveStaff={setActiveStaffId}
            onUpdateAdmin={(updated) => setAdmins((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))}
            onAddAdmin={handleAddAdmin}
            onDeleteAdmin={handleDeleteAdmin}
            onDatabaseRestored={handleDatabaseRestored}
            onClearAllData={handleClearAllData}
          />
        )}

        {view === 'logs' && <ActivityLogView logs={logs} teams={teams} onUndo={handleUndoLog} />}
      </main>

      {/* Floating Quick Tap Bar on Mobile */}
      <div className="fixed bottom-4 right-4 z-30 sm:hidden flex items-center gap-2">
        <button
          onClick={() => setShowCloudSettings(true)}
          className="w-12 h-12 rounded-full bg-slate-800 text-indigo-400 border border-indigo-500/40 shadow-xl flex items-center justify-center active:scale-95"
          title="Cloud Server Database"
        >
          <Cloud className="w-5 h-5" />
        </button>
        <button
          onClick={() => setView('scanner')}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-600 text-white shadow-2xl flex items-center justify-center active:scale-95 ring-2 ring-emerald-400/50"
          title="Open NFC Scanner"
        >
          <Radio className="w-6 h-6 animate-pulse" />
        </button>
      </div>

      {/* POP-UP 1: Registered Attendee Point Tally (+1, +3, +5, +10, +20 points) */}
      {scannedAttendee && (
        <NfcScannerModal
          attendee={scannedAttendee}
          team={
            teams[scannedAttendee.teamId] || {
              id: 'team-general',
              name: 'General Attendee',
              colorHex: '#6366f1',
              badgeBg: '',
              badgeBorder: '',
              textColor: '',
              mascot: '⭐'
            }
          }
          staffName={activeStaff.name}
          onClose={() => setScannedAttendee(null)}
          onAwardPoints={handleAwardPoints}
        />
      )}

      {/* POP-UP 2: Unregistered NFC Chip -> Enroll New Player screen */}
      {unregisteredTagId && (
        <RegisterNewTagModal
          scannedTagId={unregisteredTagId}
          teams={teams}
          existingCount={attendees.length}
          onClose={() => setUnregisteredTagId(null)}
          onRegister={handleRegisterNewTagPlayer}
        />
      )}

      {/* Peer Mesh Sync Hub Modal */}
      {showSyncHub && (
        <SyncHubModal
          attendeesCount={attendees.length}
          teamsCount={Object.keys(teams).length}
          logsCount={logs.length}
          currentStaffName={activeStaff.name}
          onClose={() => setShowSyncHub(false)}
          onManualSyncPush={() => {
            broadcastMeshUpdate('Manual full synchronization pulse triggered');
          }}
        />
      )}

      {/* Cloud Server Database Settings & Permission Troubleshooting */}
      {showCloudSettings && (
        <CloudSyncSettingsModal
          onClose={() => setShowCloudSettings(false)}
          onSyncNow={async () => {
            await handleReestablishCloudData();
          }}
          currentStaffName={activeStaff.name}
        />
      )}

      {/* AI Commentary Modal */}
      {showAiHype && (
        <AiCommentaryModal
          teams={teams}
          teamScores={teamScores}
          attendees={attendees}
          onClose={() => setShowAiHype(false)}
        />
      )}
    </div>
  );
}
