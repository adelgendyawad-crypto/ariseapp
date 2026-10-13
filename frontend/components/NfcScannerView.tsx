import React, { useState, useEffect } from 'react';
import { Attendee, Team } from '../types';
import { audioService } from '../services/audioService';
import {
  Radio,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  Search,
  PlusCircle,
  HelpCircle,
  Play,
  RotateCcw
} from 'lucide-react';

interface NfcScannerViewProps {
  attendees: Attendee[];
  teams: Record<string, Team>;
  onTagScanned: (tagId: string) => void;
}

export const NfcScannerView: React.FC<NfcScannerViewProps> = ({
  attendees,
  teams,
  onTagScanned
}) => {
  const [hardwareSupported, setHardwareSupported] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [hardwareStatus, setHardwareStatus] = useState<string>('Initializing sensor...');
  const [manualInput, setManualInput] = useState<string>('');
  const [lastScannedTag, setLastScannedTag] = useState<string | null>(null);

  // Initialize Native Web NFC Reader if supported (Android Chrome / compatible Web NFC browsers)
  const initWebNfc = async () => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      try {
        setHardwareSupported(true);
        // @ts-expect-error Web NFC NDEFReader API
        const ndef = new window.NDEFReader();
        await ndef.scan();
        setIsScanning(true);
        setHardwareStatus('Phone NFC Sensor Active • Hold wristband to phone back');

        // @ts-expect-error NDEFReader onreading listener
        ndef.onreading = (event: { serialNumber?: string }) => {
          const serial = event.serialNumber || `NFC-${Math.floor(10 + Math.random() * 89)}`;
          audioService.playNfcTap();
          setLastScannedTag(serial);
          onTagScanned(serial);
        };

        // @ts-expect-error NDEFReader onreadingerror listener
        ndef.onreadingerror = () => {
          setHardwareStatus('Tag read error: please hold wristband steady against sensor');
        };
      } catch (err) {
        console.warn('Web NFC activation error:', err);
        setHardwareSupported(false);
        setIsScanning(false);
        setHardwareStatus('Web NFC permission required or disabled in browser flags');
      }
    } else {
      setHardwareSupported(false);
      setIsScanning(false);
      setHardwareStatus('Hardware Web NFC is native to Chrome on Android. Simulator ready!');
    }
  };

  useEffect(() => {
    initWebNfc();
  }, []);

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    audioService.playNfcTap();
    const tag = manualInput.trim();
    setLastScannedTag(tag);
    onTagScanned(tag);
    setManualInput('');
  };

  const handleSimulateQuickTag = (tagId: string) => {
    audioService.playNfcTap();
    setLastScannedTag(tagId);
    onTagScanned(tagId);
  };

  const handleSimulateUnknownTag = () => {
    const randomHex = Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase().padStart(6, '0');
    const newTag = `NFC-NEW-${randomHex.slice(0, 4)}`;
    audioService.playNfcTap();
    setLastScannedTag(newTag);
    onTagScanned(newTag);
  };

  return (
    <div className="space-y-6">
      {/* Top NFC Hardware Status Card */}
      <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background effect */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Visual Scanner Target Phone Radar */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative flex items-center justify-center w-36 h-36">
              {/* Radar waves */}
              <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping opacity-60" />
              <div className="absolute inset-3 rounded-full border border-indigo-500/40 animate-pulse" />
              <div className="absolute inset-6 rounded-full border-2 border-dashed border-indigo-400/50" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-600/40 text-white">
                <Radio className="w-10 h-10 animate-pulse text-amber-300" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {hardwareSupported ? 'Hardware NFC Sensor Listening' : 'Virtual NFC Scanner Ready'}
              </span>
              <p className="text-xs text-slate-400 font-mono max-w-xs">{hardwareStatus}</p>
            </div>

            {!hardwareSupported && (
              <button
                onClick={initWebNfc}
                className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-semibold border border-indigo-500/30 transition flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" /> Retry Requesting Phone NFC
              </button>
            )}
          </div>

          {/* Scanner Instructions & Workflow */}
          <div className="flex-1 max-w-xl space-y-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Smartphone className="w-6 h-6 text-indigo-400" /> Phone NFC Antenna Scanner
              </h2>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                Hold an attendee's NFC fabric wristband or badge lanyard against the top-rear of your smartphone to scan.
              </p>
            </div>

            {/* Smart Matching Behavior Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                  <CheckCircle2 className="w-4 h-4" /> Registered NFC Tag
                </div>
                <p className="text-xs text-slate-400">
                  Instantly pops up with the player's name, team badge, and the 5 point options (<strong>+1, +3, +5, +10, +20</strong>).
                </p>
              </div>

              <div className="bg-slate-800/80 border border-amber-500/40 rounded-2xl p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                  <PlusCircle className="w-4 h-4" /> Unregistered Tag
                </div>
                <p className="text-xs text-slate-400">
                  Automatically launches <strong>"Enroll New Player"</strong> modal to match the new wristband with a name and group immediately.
                </p>
              </div>
            </div>

            {/* Manual Tag ID Scan Form */}
            <form onSubmit={handleManualScanSubmit} className="flex items-center gap-2 pt-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Or enter NFC Tag ID or Badge ID (e.g. NFC-AA-01)..."
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow active:scale-95 shrink-0"
              >
                Scan Tag
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Simulator Test Triggers (For testing both registered & unregistered tags) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Instant NFC Tag Simulator (Quick Test)
            </h3>
            <p className="text-xs text-slate-400">
              Tap any test wristband below to test the automatic scanner recognition:
            </p>
          </div>

          <button
            onClick={handleSimulateUnknownTag}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> Simulate Unregistered NFC Tag
          </button>
        </div>

        {/* Existing registered chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {attendees.slice(0, 8).map((att) => {
            const team = teams[att.teamId] || { name: 'Unknown', colorHex: '#94a3b8', mascot: '❓' };
            return (
              <button
                key={att.id}
                onClick={() => handleSimulateQuickTag(att.tagId)}
                className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/60 rounded-xl p-3 text-left transition flex items-center justify-between gap-2 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={att.avatarUrl}
                    alt={att.name}
                    className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-600 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="font-bold text-white text-xs block truncate group-hover:text-indigo-400">
                      {att.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {att.tagId} • {team.mascot}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700 shrink-0">
                  {att.points}p
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
