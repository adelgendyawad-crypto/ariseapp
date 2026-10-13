import React, { useState } from 'react';
import {
  Database,
  Cloud,
  Check,
  AlertTriangle,
  X,
  Copy,
  RefreshCw,
  ShieldCheck,
  Server,
  Share2,
  HelpCircle,
  Smartphone,
  Terminal,
  ExternalLink,
  Globe
} from 'lucide-react';
import { neonService } from '../services/neonService';
import { audioService } from '../services/audioService';

interface CloudSyncSettingsModalProps {
  onClose: () => void;
  onSyncNow: () => Promise<void>;
  currentStaffName: string;
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
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    if (successful) return true;
  } catch {
    // fallback
  }

  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
  return true;
}

export const CloudSyncSettingsModal: React.FC<CloudSyncSettingsModalProps> = ({
  onClose,
  onSyncNow,
  currentStaffName
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDirectLink, setCopiedDirectLink] = useState(false);
  const [copiedRule, setCopiedRule] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'rules' | 'service_info'>('status');

  const serviceName = 'genai-app-nfcconpoint-conventionpoi-1-17914263709';
  const directCloudRunUrl = `https://${serviceName}-379459071154.us-south1.run.app`;

  const DATABASE_CONFIG_SNIPPET = `# Backend environment only — never expose this in frontend code
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require`;

  const handleCopyRules = () => {
    copySafe(DATABASE_CONFIG_SNIPPET);
    setCopiedRule(true);
    setTimeout(() => setCopiedRule(false), 2000);
  };

  const handleCopyShareLink = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    copySafe(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyDirectLink = () => {
    copySafe(directCloudRunUrl);
    setCopiedDirectLink(true);
    setTimeout(() => setCopiedDirectLink(false), 2500);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      await neonService.testConnection();
      await onSyncNow();
      audioService.playPointSuccess(10);
      setTestResult({
        success: true,
        message: `Connected to Neon PostgreSQL. Real-time synchronization is active on service ${serviceName}.`
      });
    } catch (err: unknown) {
      audioService.playNfcTap();
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to connect to Neon.'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Cloud className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Neon PostgreSQL Live Synchronization</h3>
              <p className="text-xs text-slate-400 font-mono">Service: {serviceName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-5 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition border-b-2 whitespace-nowrap ${
              activeTab === 'status'
                ? 'border-indigo-500 text-white bg-slate-800'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Connection Status & Sync
          </button>
          <button
            onClick={() => setActiveTab('service_info')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'service_info'
                ? 'border-indigo-500 text-white bg-slate-800'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-indigo-400" /> 2. Service Endpoints
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'border-emerald-500 text-emerald-300 bg-slate-800'
                : 'border-transparent text-slate-400 hover:text-emerald-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 3. Security Rules
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 flex-1 leading-relaxed">
          {/* TAB 1: CONNECTION STATUS & TESTING */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2">
                <span className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-emerald-400" /> Real-time Synchronized Cloud Database
                </span>
                <p className="text-slate-400">
                  This deployment stores shared convention state in Neon PostgreSQL through the Node backend. Every admin smartphone accessing service <code className="text-emerald-300 font-mono">{serviceName}</code> sees live updates as NFC tags are scanned.
                </p>
              </div>

              {/* Linked database summary */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 font-mono text-[11px]">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-slate-400">
                  <span>Parameter</span>
                  <span>Active Value</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Service Name:</span>
                  <span className="text-emerald-400 font-bold truncate max-w-[280px]">{serviceName}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Provider:</span>
                  <span className="text-indigo-400 font-bold">Neon</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Database:</span>
                  <span className="text-emerald-400 font-bold">PostgreSQL</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Active Staff Session:</span>
                  <span className="text-amber-400 font-bold">{currentStaffName}</span>
                </div>
              </div>

              {/* Share Links */}
              <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-indigo-400" /> Share with Staff Smartphones
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy App Link'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Open this URL on all staff phones. Every phone connects to the same backend and updates simultaneously.
                </p>
              </div>

              {/* Test Connection Output */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                      : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{testResult.message}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400 text-[11px]">
                  Live updates are delivered by the backend with automatic polling fallback.
                </span>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow active:scale-95 disabled:opacity-50"
                >
                  {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span>Push & Test Live Sync</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SERVICE ENDPOINTS */}
          {activeTab === 'service_info' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2">
                <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" /> Active Service Endpoint
                </span>
                <p className="text-slate-300">
                  Your new Cloud Run service is active under:
                </p>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 flex items-center justify-between gap-2">
                  <span className="truncate">{directCloudRunUrl}</span>
                  <button
                    type="button"
                    onClick={handleCopyDirectLink}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
                    title="Copy direct URL"
                  >
                    {copiedDirectLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-slate-300">
                <div className="font-bold text-white text-xs">Direct Access via Mobile:</div>
                <p className="text-slate-400 text-[11px]">
                  Opening the direct URL on phones lets staff bypass any App Builder wrapper delays. Since <code className="text-amber-300 font-mono">--allow-unauthenticated</code> was specified during deployment, all staff members can immediately log into their admin terminal and start scanning.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: RULES ACCESS */}
          {activeTab === 'rules' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-2xl p-4 text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                  <ShieldCheck className="w-4 h-4" /> Server-side Database Credentials
                </div>
                <p className="text-xs text-emerald-200/90 leading-relaxed">
                  The Neon connection string is read only by the Node backend from <code className="bg-slate-900 px-1 rounded">DATABASE_URL</code>. It is never included in the browser bundle.
                </p>
              </div>

              {/* Code Snippet Box */}
              <div className="relative bg-slate-950 rounded-2xl border border-emerald-500/40 p-4 font-mono text-[11px] text-emerald-400 overflow-x-auto shadow-inner">
                <pre>{DATABASE_CONFIG_SNIPPET}</pre>
                <button
                  type="button"
                  onClick={handleCopyRules}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow"
                >
                  {copiedRule ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRule ? 'Copied!' : 'Copy Example'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
