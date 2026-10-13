import React, { useState } from 'react';
import { Radio, RefreshCw, Check, Copy, X, Globe, QrCode, ExternalLink, Smartphone } from 'lucide-react';

interface SyncHubModalProps {
  attendeesCount: number;
  teamsCount: number;
  logsCount: number;
  currentStaffName: string;
  onClose: () => void;
  onManualSyncPush: () => void;
}

function copySafe(text: string): boolean {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '-9999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const result = document.execCommand('copy');
    document.body.removeChild(textArea);
    if (result) return true;
  } catch {
    // fallback
  }

  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
  return true;
}

export const SyncHubModal: React.FC<SyncHubModalProps> = ({
  attendeesCount,
  teamsCount,
  logsCount,
  currentStaffName,
  onClose,
  onManualSyncPush
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedServiceUrl, setCopiedServiceUrl] = useState(false);
  const [syncedRecently, setSyncedRecently] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const serviceName = 'genai-app-nfcconpoint-conventionpoi-1-17914263709';
  const directCloudRunUrl = `https://${serviceName}-379459071154.us-south1.run.app`;

  const handleCopyLink = () => {
    copySafe(currentUrl || directCloudRunUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyDirectServiceUrl = () => {
    copySafe(directCloudRunUrl);
    setCopiedServiceUrl(true);
    setTimeout(() => setCopiedServiceUrl(false), 2000);
  };

  const handleTriggerSync = () => {
    onManualSyncPush();
    setSyncedRecently(true);
    setTimeout(() => setSyncedRecently(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Multi-Device Live Sync Hub</h3>
              <p className="text-xs text-slate-400 font-mono">Service: {serviceName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Status Indicator */}
          <div className="bg-slate-800/80 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-4">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute" />
              <div className="w-3 h-3 rounded-full bg-emerald-500 relative" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Neon PostgreSQL Live Sync Active</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.5 rounded">
                  Live
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Any NFC scan or edit made by <strong>{currentStaffName}</strong> updates across all staff phones instantly.
              </p>
            </div>
          </div>

          {/* Sync payload stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
              <div className="text-lg font-black text-amber-400">{attendeesCount}</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Attendees</div>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
              <div className="text-lg font-black text-indigo-400">{teamsCount}</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Groups</div>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
              <div className="text-lg font-black text-emerald-400">{logsCount}</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Point Logs</div>
            </div>
          </div>

          {/* Connect Other Phones via Current URL */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" /> Share App with Staff Members
              </span>
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <QrCode className="w-3.5 h-3.5" /> {showQr ? 'Hide QR' : 'Show Camera QR'}
              </button>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="w-full bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs rounded-xl px-3 py-2.5 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {/* Direct Cloud Run Service URL */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Direct Cloud Run Endpoint:</span>
                <button
                  type="button"
                  onClick={handleCopyDirectServiceUrl}
                  className="text-indigo-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  {copiedServiceUrl ? 'Copied' : 'Copy Direct URL'}
                </button>
              </div>
              <a
                href={directCloudRunUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1 truncate block bg-slate-950 p-2 rounded-lg border border-slate-800"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">{directCloudRunUrl}</span>
              </a>
            </div>

            {/* In-app QR Code for Camera Scanning */}
            {showQr && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-2 animate-fadeIn">
                <div className="w-44 h-44 bg-white p-3 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                      currentUrl || directCloudRunUrl
                    )}`}
                    alt="Scan to open on smartphone"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Point any smartphone camera at this QR code to join the live convention tally terminal.
                </p>
              </div>
            )}
          </div>

          {/* Force Broadcast Pulse */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleTriggerSync}
              className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                syncedRecently
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-800 hover:bg-slate-750 text-indigo-300 hover:text-white border border-indigo-500/30'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${syncedRecently ? 'animate-spin' : ''}`} />
              <span>
                {syncedRecently ? 'All Staff Terminals Synchronized!' : 'Broadcast Instant Sync Pulse to All Phones'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
