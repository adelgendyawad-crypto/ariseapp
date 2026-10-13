import React, { useState } from 'react';
import { AdminStaff } from '../types';
import {
  Shield,
  UserCheck,
  Check,
  Download,
  Upload,
  UserPlus,
  Trash2,
  Edit2,
  X,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Globe,
  Terminal,
  Copy,
  Layers,
  Box,
  Code2,
  Info
} from 'lucide-react';
import { storageService } from '../services/storageService';

interface ManageAdminsViewProps {
  admins: AdminStaff[];
  activeStaffId: string;
  onSelectActiveStaff: (staffId: string) => void;
  onUpdateAdmin: (updatedAdmin: AdminStaff) => void;
  onAddAdmin?: (newAdmin: AdminStaff) => void;
  onDeleteAdmin?: (adminId: string) => void;
  onDatabaseRestored: () => void;
  onClearAllData?: () => void;
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

export const ManageAdminsView: React.FC<ManageAdminsViewProps> = ({
  admins,
  activeStaffId,
  onSelectActiveStaff,
  onUpdateAdmin,
  onAddAdmin,
  onDeleteAdmin,
  onDatabaseRestored,
  onClearAllData
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeployGuide, setShowDeployGuide] = useState(true);
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<AdminStaff['role']>('Scoring Marshall');
  const [editPin, setEditPin] = useState('');

  // Add Admin State
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<AdminStaff['role']>('Scoring Marshall');
  const [newPin, setNewPin] = useState('1234');

  const [resetConfirm, setResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [copiedDirectUrl, setCopiedDirectUrl] = useState(false);

  const serviceName = 'genai-app-nfcconpoint-conventionpoi-1-17914263709';
  const directCloudRunUrl = `https://${serviceName}-379459071154.us-south1.run.app`;

  const activeStaff = admins.find((a) => a.id === activeStaffId) || admins[0] || {
    id: 'STAFF-01',
    name: 'Lead Director',
    role: 'Convention Director',
    pin: '1234',
    avatar: 'https://picsum.photos/seed/director1/100/100',
    scansCount: 0
  };

  const handleCopyDirectUrl = () => {
    copySafe(directCloudRunUrl);
    setCopiedDirectUrl(true);
    setTimeout(() => setCopiedDirectUrl(false), 2500);
  };

  const handleDownloadBackup = () => {
    const json = storageService.exportDatabaseBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conpoint-convention-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (storageService.importDatabaseBackup(content)) {
        setImportStatus('Database successfully restored! All records loaded.');
        onDatabaseRestored();
        setTimeout(() => setImportStatus(null), 4000);
      } else {
        setImportStatus('Error: Invalid backup file format.');
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const nextIdNum = (admins.length + 1).toString().padStart(2, '0');
    const newAdmin: AdminStaff = {
      id: `STAFF-${nextIdNum}`,
      name: newName.trim(),
      role: newRole,
      pin: newPin.trim() || '1234',
      avatar: `https://picsum.photos/seed/${encodeURIComponent(newName.trim())}/100/100`,
      scansCount: 0
    };

    if (onAddAdmin) {
      onAddAdmin(newAdmin);
    }
    setNewName('');
    setShowAddForm(false);
  };

  const startEdit = (admin: AdminStaff) => {
    setEditingAdminId(admin.id);
    setEditName(admin.name);
    setEditRole(admin.role);
    setEditPin(admin.pin);
  };

  const saveEdit = (admin: AdminStaff) => {
    if (!editName.trim()) return;
    onUpdateAdmin({
      ...admin,
      name: editName.trim(),
      role: editRole,
      pin: editPin.trim() || admin.pin
    });
    setEditingAdminId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Active Scanner Authorization */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/40 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={activeStaff.avatar}
            alt={activeStaff.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-400 shadow-lg"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active Device Host
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                {activeStaff.id}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mt-0.5">{activeStaff.name}</h3>
            <p className="text-xs text-slate-400 font-mono truncate max-w-xs">{serviceName}</p>
          </div>
        </div>

        {/* Database Persistence & Backup Tools */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowDeployGuide(!showDeployGuide)}
            className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            title="Service Link Info & Source vs Container Explanation"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" /> Source vs Container Guide
          </button>

          <button
            onClick={handleDownloadBackup}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow"
            title="Download full database snapshot JSON file"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" /> Export Backup (.json)
          </button>

          <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow">
            <Upload className="w-3.5 h-3.5 text-emerald-400" /> Import Backup
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Cloud Run: Source vs Container Explanation Box */}
      {showDeployGuide && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-5 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Info className="w-4 h-4 text-emerald-400" />
              Why are there two services (Source vs. Container) & do you need both?
            </div>
            <button onClick={() => setShowDeployGuide(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Service 1: Source */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Code2 className="w-4 h-4" />
                </span>
                <span>1. Deployment type: <code className="text-indigo-300">Source</code></span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <strong className="text-white">What it is:</strong> This is the service built and deployed automatically by <strong className="text-indigo-400">Vertex AI App Builder</strong> directly from your web code repository.
              </p>
              <p className="text-slate-400 leading-relaxed">
                <strong className="text-white">How it updates:</strong> Every time you click <strong className="text-white">"Update app"</strong> in the App Builder dialog, this service receives your latest changes.
              </p>
            </div>

            {/* Service 2: Container */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Box className="w-4 h-4" />
                </span>
                <span>2. Deployment type: <code className="text-emerald-300">Container</code></span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <strong className="text-white">What it is:</strong> This service was created when you manually ran <code className="text-amber-300 font-mono text-[11px]">gcloud run deploy ... --image ...</code> in your terminal.
              </p>
              <p className="text-slate-400 leading-relaxed">
                <strong className="text-white">How it updates:</strong> It only updates when you re-deploy that specific pre-built docker container image tag manually from CLI.
              </p>
            </div>
          </div>

          {/* Verdict and Action */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl text-xs space-y-2">
            <div className="font-bold text-emerald-300 flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-emerald-400" />
              Do we need both?
            </div>
            <p className="text-slate-200 leading-relaxed">
              <strong className="text-white">No, you do NOT need both.</strong> They are two separate deployments of the same project. Since both connect to the same Neon PostgreSQL database through the backend, scores and attendees sync between them, but keeping both costs extra container resources and creates two separate URLs.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-emerald-500/20 text-[11px]">
              <span className="text-slate-300">
                <strong className="text-emerald-400">Recommended:</strong> Keep the <strong className="text-white">Source</strong> service (managed directly by App Builder via "Update app"). You can safely delete the <strong>Container</strong> one in the Cloud Run console by checking its box and clicking Delete.
              </span>
              <button
                onClick={handleCopyDirectUrl}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition shrink-0 flex items-center gap-1 shadow"
              >
                {copiedDirectUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDirectUrl ? 'URL Copied!' : 'Copy Live App URL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {importStatus && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs px-4 py-3 rounded-xl flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Admins Grid & Management */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" /> Authorized Convention Staff Admins
            </h3>
            <p className="text-xs text-slate-400">
              Add up to 15 admin accounts with staff PINs to authorize scoring terminals and attribute points.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add Staff Admin
            </button>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {admins.length} Staff
            </span>
          </div>
        </div>

        {/* Add Admin Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateAdmin}
            className="bg-slate-800/80 border border-indigo-500/40 rounded-xl p-4 shadow-xl space-y-3 animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">New Admin Staff Account</h4>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-300 mb-1">Staff Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-300 mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminStaff['role'])}
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Convention Director">Convention Director</option>
                  <option value="Floor Manager">Floor Manager</option>
                  <option value="Team Lead">Team Lead</option>
                  <option value="Scoring Marshall">Scoring Marshall</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase font-bold text-slate-300 mb-1">Staff PIN</label>
                <input
                  type="text"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="1234"
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow"
              >
                <Check className="w-3.5 h-3.5" /> Save Admin
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {admins.map((admin) => {
            const isActive = admin.id === activeStaffId;
            const isEditing = editingAdminId === admin.id;

            return (
              <div
                key={admin.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                  isActive
                    ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-400'
                    : 'bg-slate-800/70 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-900 border border-indigo-500 text-white text-xs font-bold rounded-lg px-2.5 py-1"
                      placeholder="Admin Name"
                    />
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as AdminStaff['role'])}
                      className="w-full bg-slate-900 border border-indigo-500 text-white text-xs rounded-lg px-2 py-1"
                    >
                      <option value="Convention Director">Convention Director</option>
                      <option value="Floor Manager">Floor Manager</option>
                      <option value="Team Lead">Team Lead</option>
                      <option value="Scoring Marshall">Scoring Marshall</option>
                    </select>
                    <input
                      type="text"
                      value={editPin}
                      onChange={(e) => setEditPin(e.target.value)}
                      className="w-full bg-slate-900 border border-indigo-500 text-white text-xs font-mono rounded-lg px-2.5 py-1"
                      placeholder="PIN"
                    />
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        onClick={() => saveEdit(admin)}
                        className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingAdminId(null)}
                        className="px-2.5 py-1 bg-slate-700 text-slate-300 text-xs rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <img
                          src={admin.avatar}
                          alt={admin.name}
                          className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-600 shrink-0"
                        />
                        {isActive && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-sm truncate">{admin.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                            {admin.id}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 block truncate">{admin.role}</span>
                        <span className="text-[11px] text-indigo-400 font-mono">
                          PIN: {admin.pin} • {admin.scansCount} scans
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(admin)}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
                          title="Edit Admin"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {admins.length > 1 && onDeleteAdmin && (
                          <button
                            onClick={() => onDeleteAdmin(admin.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                            title="Remove Admin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {isActive ? (
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/30 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" /> Active Scanner
                        </span>
                      ) : (
                        <button
                          onClick={() => onSelectActiveStaff(admin.id)}
                          className="px-2.5 py-1 bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition"
                        >
                          Select Host
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Clean slate reset zone */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>All players, groups, admins, and point tallies are saved directly in your browser.</span>
          {resetConfirm ? (
            <div className="flex items-center gap-2 bg-rose-950/80 p-2 rounded-xl border border-rose-500/40">
              <span className="text-rose-300 font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-rose-400" /> Wipe all players, groups & logs?
              </span>
              <button
                onClick={() => {
                  if (onClearAllData) onClearAllData();
                  setResetConfirm(false);
                }}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition"
              >
                Yes, Clear Everything
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="px-2 py-1 bg-slate-800 text-slate-300 rounded-lg"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setResetConfirm(true)}
              className="text-rose-400 hover:text-rose-300 font-bold underline flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All Data (Clean Slate)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
