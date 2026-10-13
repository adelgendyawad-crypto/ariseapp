import React, { useState } from 'react';
import { Team, Attendee } from '../types';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  Trophy,
  Palette,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface ManageGroupsViewProps {
  teams: Record<string, Team>;
  attendees: Attendee[];
  onAddGroup: (newGroup: Team) => void;
  onEditGroup: (updatedGroup: Team) => void;
  onDeleteGroup: (groupId: string) => void;
}

const PRESET_COLORS = [
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#a855f7', // Purple
  '#ef4444', // Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316'  // Orange
];

const PRESET_MASCOTS = ['🔥', '⚡', '🐍', '🐙', '🦅', '🐺', '🦁', '🐉', '⚔️', '🚀', '💎', '🛡️'];

export const ManageGroupsView: React.FC<ManageGroupsViewProps> = ({
  teams,
  attendees,
  onAddGroup,
  onEditGroup,
  onDeleteGroup
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New Group Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [newMascot, setNewMascot] = useState('🦅');
  const [newColorHex, setNewColorHex] = useState('#ef4444');

  // Edit Group State
  const [editName, setEditName] = useState('');
  const [editMascot, setEditMascot] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const slug = `team-${newGroupName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const newTeam: Team = {
      id: slug,
      name: newGroupName.trim(),
      colorHex: newColorHex,
      badgeBg: `${newColorHex}15`,
      badgeBorder: `border-[${newColorHex}]/30`,
      textColor: `text-[${newColorHex}]`,
      mascot: newMascot
    };

    onAddGroup(newTeam);
    setNewGroupName('');
    setShowAddForm(false);
  };

  const startEdit = (team: Team) => {
    setEditingGroupId(team.id);
    setEditName(team.name);
    setEditMascot(team.mascot);
    setEditColor(team.colorHex);
  };

  const saveEdit = (original: Team) => {
    if (!editName.trim()) return;
    onEditGroup({
      ...original,
      name: editName.trim(),
      mascot: editMascot,
      colorHex: editColor
    });
    setEditingGroupId(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> Convention Groups & Team Names
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {Object.keys(teams).length} Groups
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Customize group names, mascots, and division colors that aggregate attendee points on live arena screens.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New Group
        </button>
      </div>

      {/* Add New Group Modal / Card */}
      {showAddForm && (
        <form
          onSubmit={handleCreateGroup}
          className="bg-slate-800/80 border border-indigo-500/40 rounded-xl p-4 sm:p-5 shadow-xl space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Create New Convention Division
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Group Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Group Name *
              </label>
              <input
                type="text"
                required
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g. Thunder Hawks, Shadow Wolves"
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Mascot Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Mascot / Icon
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMascot}
                  onChange={(e) => setNewMascot(e.target.value)}
                  className="w-14 text-center text-xl bg-slate-900 border border-slate-700 text-white rounded-xl py-2 focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex flex-wrap gap-1">
                  {PRESET_MASCOTS.slice(0, 5).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setNewMascot(m)}
                      className="p-1 rounded bg-slate-700/50 hover:bg-slate-700 text-sm"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Color Palette */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-400" /> Choose Division Theme Color
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                {PRESET_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setNewColorHex(hex)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      newColorHex === hex ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110 opacity-80'
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  title="Custom hex color"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow"
            >
              <Check className="w-4 h-4" /> Save Group
            </button>
          </div>
        </form>
      )}

      {/* Groups Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(teams).map((team) => {
          const isEditing = editingGroupId === team.id;
          const members = attendees.filter((a) => a.teamId === team.id);
          const totalPoints = members.reduce((sum, a) => sum + a.points, 0);

          return (
            <div
              key={team.id}
              className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-slate-600 transition"
            >
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-900 border border-indigo-500 text-white text-sm font-bold rounded-xl px-3 py-1.5 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
                        Mascot
                      </label>
                      <input
                        type="text"
                        value={editMascot}
                        onChange={(e) => setEditMascot(e.target.value)}
                        className="w-12 text-center text-lg bg-slate-900 border border-indigo-500 text-white rounded-xl py-1"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">
                        Color
                      </label>
                      <div className="flex items-center gap-1.5">
                        {PRESET_COLORS.slice(0, 4).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setEditColor(c)}
                            className="w-5 h-5 rounded-full"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-1.5 pt-2">
                    <button
                      onClick={() => saveEdit(team)}
                      className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                    <button
                      onClick={() => setEditingGroupId(null)}
                      className="px-3 py-1 bg-slate-700 text-slate-300 text-xs rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-2 rounded-xl bg-slate-900 border border-slate-700">
                        {team.mascot}
                      </span>
                      <div>
                        <h3 className="font-bold text-white text-base leading-snug">{team.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: team.colorHex }}
                          />
                          <span className="text-xs text-slate-400 font-mono">
                            {members.length} players enrolled
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(team)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                        title="Edit Group Name & Color"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {deleteConfirmId === team.id ? (
                        <div className="flex items-center gap-1 bg-rose-950 p-1 rounded-lg">
                          <button
                            onClick={() => {
                              onDeleteGroup(team.id);
                              setDeleteConfirmId(null);
                            }}
                            className="text-[11px] font-bold px-2 py-0.5 bg-rose-600 text-white rounded"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-slate-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(team.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Delete Group"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary Metric */}
                  <div className="bg-slate-900/80 rounded-xl p-3 flex items-center justify-between border border-slate-800">
                    <div>
                      <span className="text-xs text-slate-400 block uppercase font-medium">Aggregated Tally</span>
                      <span className="text-2xl font-black" style={{ color: team.colorHex }}>
                        {totalPoints} pts
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block uppercase font-medium">Avg per player</span>
                      <span className="text-sm font-bold text-slate-200">
                        {members.length > 0 ? (totalPoints / members.length).toFixed(1) : 0}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
