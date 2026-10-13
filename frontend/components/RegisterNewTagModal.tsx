import React, { useState } from 'react';
import { Attendee, Team } from '../types';
import { Radio, UserPlus, Check, X, ShieldAlert, Sparkles, Shuffle } from 'lucide-react';

interface RegisterNewTagModalProps {
  scannedTagId: string;
  teams: Record<string, Team>;
  existingCount: number;
  onClose: () => void;
  onRegister: (newAttendee: Attendee, startingPoints: number) => void;
}

export const RegisterNewTagModal: React.FC<RegisterNewTagModalProps> = ({
  scannedTagId,
  teams,
  existingCount,
  onClose,
  onRegister
}) => {
  const defaultTeam = Object.keys(teams)[0] || '';
  const [name, setName] = useState('');
  const [badgeId, setBadgeId] = useState(`CON-${existingCount + 101}`);
  const [teamId, setTeamId] = useState(defaultTeam);
  const [role, setRole] = useState<Attendee['role']>('Attendee');
  const [startingPoints, setStartingPoints] = useState<number>(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newAttendee: Attendee = {
      id: badgeId.trim() || `CON-${existingCount + 101}`,
      tagId: scannedTagId.trim(),
      name: name.trim(),
      role,
      teamId: teamId || Object.keys(teams)[0],
      points: startingPoints,
      avatarUrl: `https://picsum.photos/seed/${encodeURIComponent(name.trim())}/120/120`,
      checkInCount: 1,
      lastScannedAt: 'Just now (Registered)'
    };

    onRegister(newAttendee, startingPoints);
  };

  const handleGenId = () => {
    setBadgeId(`CON-${Math.floor(100 + Math.random() * 899)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden text-slate-100">
        {/* Banner Alert for Unregistered NFC Tag */}
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-indigo-950/90 p-4 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h3 className="font-bold text-white text-base">Unregistered NFC Chip Detected!</h3>
              <p className="text-xs text-amber-300/80 font-mono">
                Chip Serial: <span className="text-white font-bold">{scannedTagId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <div className="p-6 pb-2">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 text-xs text-slate-300 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">New Wristband / Badge Pairing</strong>
              <p className="text-slate-400 mt-0.5">
                This NFC wristband has not yet been linked to an attendee. Enter the attendee's details below to match this chip to their profile and team.
              </p>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
          <div className="space-y-3">
            {/* Player Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Player Full Name *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya Lin"
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Group / Team Choice */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Assign to Group / Team *
              </label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {Object.values(teams).map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.mascot} {team.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Grid for ID, Role, Points */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Badge ID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Badge ID
                  </label>
                  <button
                    type="button"
                    onClick={handleGenId}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                  >
                    <Shuffle className="w-3 h-3" /> Gen
                  </button>
                </div>
                <input
                  type="text"
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Convention Role */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Attendee['role'])}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="Attendee">Attendee</option>
                  <option value="Team Captain">Team Captain</option>
                  <option value="VIP">VIP</option>
                  <option value="Volunteer">Volunteer</option>
                </select>
              </div>

              {/* Starting Points */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Starting Points
                </label>
                <input
                  type="number"
                  min="0"
                  value={startingPoints}
                  onChange={(e) => setStartingPoints(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 text-amber-400 font-bold text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Check className="w-4 h-4" /> Match NFC Chip & Enroll Player
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
