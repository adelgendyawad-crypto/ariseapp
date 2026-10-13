import React, { useState } from 'react';
import { Attendee, Team } from '../types';
import {
  Users,
  UserPlus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Radio,
  Sparkles,
  Filter,
  Shuffle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Coins,
  Cpu,
  FileSpreadsheet,
  AlertCircle,
  Plus
} from 'lucide-react';

interface ManagePlayersViewProps {
  attendees: Attendee[];
  teams: Record<string, Team>;
  onAddPlayer: (player: Attendee) => void;
  onEditPlayer: (player: Attendee) => void;
  onDeletePlayer: (playerId: string) => void;
  onSimulateNfcTap: (player: Attendee) => void;
  onBulkAddPlayers?: (players: Attendee[]) => void;
  onClearAllPlayers?: () => void;
}

const ITEMS_PER_PAGE = 25;

export const ManagePlayersView: React.FC<ManagePlayersViewProps> = ({
  attendees,
  teams,
  onAddPlayer,
  onEditPlayer,
  onDeletePlayer,
  onSimulateNfcTap,
  onBulkAddPlayers,
  onClearAllPlayers
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'points' | 'name' | 'id'>('points');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Single Player Form State
  const defaultTeamId = Object.keys(teams)[0] || '';
  const [newName, setNewName] = useState('');
  const [newId, setNewId] = useState('');
  const [newTagId, setNewTagId] = useState('');
  const [newTeamId, setNewTeamId] = useState(defaultTeamId);
  const [newRole, setNewRole] = useState<Attendee['role']>('Attendee');
  const [newStartingPoints, setNewStartingPoints] = useState<number>(0);

  // Edit Player State
  const [editName, setEditName] = useState('');
  const [editTeamId, setEditTeamId] = useState('');
  const [editRole, setEditRole] = useState<Attendee['role']>('Attendee');
  const [editTagId, setEditTagId] = useState('');
  const [editPoints, setEditPoints] = useState<number>(0);

  // Bulk Import State
  const [bulkText, setBulkText] = useState('');
  const [bulkDefaultTeam, setBulkDefaultTeam] = useState(defaultTeamId);
  const [bulkStartingPoints, setBulkStartingPoints] = useState(0);
  const [bulkParsedCount, setBulkParsedCount] = useState(0);
  const [batchQuantity, setBatchQuantity] = useState<number>(50);

  const handleAutoFillNewPlayer = () => {
    const nextNum = (attendees.length + 1).toString().padStart(3, '0');
    const randHex = Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase().padStart(4, '0');
    setNewId(`CON-${nextNum}`);
    setNewTagId(`NFC-${randHex.slice(0, 2)}-${randHex.slice(2, 4)}`);
  };

  const handleGenerateEditHex = () => {
    const randHex = Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase().padStart(4, '0');
    setEditTagId(`NFC-${randHex.slice(0, 2)}-${randHex.slice(2, 4)}`);
  };

  const handleOpenAddForm = () => {
    handleAutoFillNewPlayer();
    setNewName('');
    setNewStartingPoints(0);
    setNewTeamId(Object.keys(teams)[0] || '');
    setShowAddForm(true);
  };

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newAttendee: Attendee = {
      id: newId.trim() || `CON-${(attendees.length + 1).toString().padStart(3, '0')}`,
      tagId: newTagId.trim() || `NFC-${Math.floor(Math.random() * 90 + 10)}-${Math.floor(Math.random() * 90 + 10)}`,
      name: newName.trim(),
      role: newRole,
      teamId: newTeamId || Object.keys(teams)[0] || 'team-general',
      points: Number(newStartingPoints) || 0,
      avatarUrl: `https://picsum.photos/seed/${encodeURIComponent(newName.trim())}/120/120`,
      checkInCount: 0,
      lastScannedAt: 'Never'
    };

    onAddPlayer(newAttendee);
    setShowAddForm(false);
  };

  const startEdit = (player: Attendee) => {
    setEditingPlayerId(player.id);
    setEditName(player.name);
    setEditTeamId(player.teamId);
    setEditRole(player.role);
    setEditTagId(player.tagId);
    setEditPoints(player.points);
  };

  const saveEdit = (original: Attendee) => {
    if (!editName.trim()) return;
    onEditPlayer({
      ...original,
      name: editName.trim(),
      teamId: editTeamId,
      role: editRole,
      tagId: editTagId.trim() || original.tagId,
      points: Math.max(0, Number(editPoints) || 0),
      avatarUrl: `https://picsum.photos/seed/${encodeURIComponent(editName.trim())}/120/120`
    });
    setEditingPlayerId(null);
  };

  // Bulk Process Parser: handles single name per line OR CSV: "Name, TeamId/Name, TagId, Points"
  const parseBulkInput = (): Attendee[] => {
    if (!bulkText.trim()) return [];
    const lines = bulkText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const teamList = Object.values(teams);
    const existingTotal = attendees.length;

    const parsedList: Attendee[] = [];

    lines.forEach((line, index) => {
      // Split by comma or tab
      const parts = line.split(/[,\t]/).map((p) => p.trim());
      const name = parts[0] || `Attendee ${existingTotal + index + 1}`;
      let assignedTeamId = bulkDefaultTeam || (teamList[0] ? teamList[0].id : 'team-general');

      if (parts[1]) {
        // Find if parts[1] matches a team name or ID
        const matchedTeam = teamList.find(
          (t) => t.id.toLowerCase() === parts[1].toLowerCase() || t.name.toLowerCase() === parts[1].toLowerCase()
        );
        if (matchedTeam) assignedTeamId = matchedTeam.id;
      }

      const serialHex = (existingTotal + index + 1).toString(16).toUpperCase().padStart(4, '0');
      const tagId = parts[2] || `NFC-${serialHex.slice(0, 2)}-${serialHex.slice(2, 4)}`;
      const points = parts[3] ? parseInt(parts[3]) || 0 : bulkStartingPoints;
      const id = `CON-${(existingTotal + index + 1).toString().padStart(3, '0')}`;

      parsedList.push({
        id,
        tagId,
        name,
        role: 'Attendee',
        teamId: assignedTeamId,
        points,
        avatarUrl: `https://picsum.photos/seed/${encodeURIComponent(name)}/120/120`,
        checkInCount: 0,
        lastScannedAt: 'Never'
      });
    });

    return parsedList;
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseBulkInput();
    if (parsed.length === 0) return;

    if (onBulkAddPlayers) {
      onBulkAddPlayers(parsed);
    } else {
      parsed.forEach((p) => onAddPlayer(p));
    }

    setBulkText('');
    setShowBulkModal(false);
  };

  // Quick generator for numbered slots: e.g., Player 1 to Player 250
  const handleGenerateBatchTemplate = () => {
    const teamList = Object.values(teams);
    const lines: string[] = [];
    const startNum = attendees.length + 1;

    for (let i = 0; i < batchQuantity; i++) {
      const num = startNum + i;
      const team = teamList.length > 0 ? teamList[i % teamList.length].name : 'Default';
      lines.push(`Player ${num}, ${team}`);
    }

    setBulkText(lines.join('\n'));
  };

  // Filter and sort
  const filtered = attendees
    .filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.tagId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTeam = selectedTeamFilter === 'all' || a.teamId === selectedTeamFilter;
      return matchesSearch && matchesTeam;
    })
    .sort((a, b) => {
      if (sortBy === 'points') return b.points - a.points;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return a.id.localeCompare(b.id);
    });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> Attendees Roster & Player Manager
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Database className="w-3 h-3" /> {attendees.length} Attendees Saved
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage all attendees. Add single players, bulk import from Excel/CSV, or edit Names, Groups, NFC IDs, and Points.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Bulk Import Button */}
          <button
            onClick={() => {
              setBulkDefaultTeam(Object.keys(teams)[0] || '');
              setShowBulkModal(true);
            }}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-750 text-indigo-300 hover:text-white border border-indigo-500/40 rounded-xl text-xs sm:text-sm font-bold shadow transition flex items-center gap-1.5 active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Bulk Add Players
          </button>

          {/* Add Single Player */}
          <button
            onClick={handleOpenAddForm}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> Add Player
          </button>

          {/* Clear All Players */}
          {attendees.length > 0 && (
            <div>
              {showClearConfirm ? (
                <div className="flex items-center gap-1 bg-rose-950/90 border border-rose-600/50 p-1 rounded-xl">
                  <button
                    onClick={() => {
                      if (onClearAllPlayers) onClearAllPlayers();
                      setShowClearConfirm(false);
                    }}
                    className="px-2.5 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg"
                  >
                    Confirm Clear All
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="p-2.5 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 rounded-xl border border-slate-700 transition"
                  title="Clear all players in roster"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 bg-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Bulk Add & Import Players</h3>
                  <p className="text-xs text-slate-400">Paste names from Excel, CSV, or generate attendee slots up to 250</p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Quick Template Generator */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick Numbered Attendee Slots Generator
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Generate placeholder attendees ready to have their NFC wristbands paired at the door.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={batchQuantity}
                    onChange={(e) => setBatchQuantity(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value={25}>+25 Attendees</option>
                    <option value={50}>+50 Attendees</option>
                    <option value={100}>+100 Attendees</option>
                    <option value={200}>+200 Attendees</option>
                    <option value={250}>+250 Attendees</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleGenerateBatchTemplate}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shrink-0"
                  >
                    Generate Slots
                  </button>
                </div>
              </div>

              {/* Paste Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-300">
                    Paste Attendee Roster (One per line or CSV)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Format: <code className="text-indigo-300 font-mono">Name, Group, NFC_ID, Points</code>
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={bulkText}
                  onChange={(e) => {
                    setBulkText(e.target.value);
                    const lines = e.target.value.split('\n').filter((l) => l.trim().length > 0);
                    setBulkParsedCount(lines.length);
                  }}
                  placeholder={`Alice Vance, Solar Phoenix\nBob Miller, Cyber Titans\nCharlie Chen\nDiana Prince, Vortex Vipers, NFC-FF-09, 10`}
                  className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xs rounded-xl p-3.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Bulk Default Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Fallback Group (If not specified in row)
                  </label>
                  <select
                    value={bulkDefaultTeam}
                    onChange={(e) => setBulkDefaultTeam(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {Object.values(teams).map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.mascot} {team.name}
                      </option>
                    ))}
                    {Object.keys(teams).length === 0 && (
                      <option value="team-general">General Attendee</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Default Starting Points
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={bulkStartingPoints}
                    onChange={(e) => setBulkStartingPoints(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 text-amber-400 font-bold text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Ready to import: <strong className="text-indigo-400">{parseBulkInput().length} attendees</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={parseBulkInput().length === 0}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow"
                  >
                    <Check className="w-4 h-4" /> Import {parseBulkInput().length} Players
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Single Player Collapsible Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreatePlayer}
          className="bg-slate-800/80 border border-indigo-500/40 rounded-xl p-4 sm:p-5 shadow-xl space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Add Attendee to Convention
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Player Full Name *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Jordan Hayes"
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Assigned Group / Team *
              </label>
              <select
                value={newTeamId}
                onChange={(e) => setNewTeamId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {Object.values(teams).map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.mascot} {team.name}
                  </option>
                ))}
                {Object.keys(teams).length === 0 && (
                  <option value="team-general">General Attendee (Create group in Groups tab)</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Convention Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as Attendee['role'])}
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Attendee">Standard Attendee</option>
                <option value="Team Captain">Team Captain</option>
                <option value="VIP">VIP</option>
                <option value="Volunteer">Volunteer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Badge Code (ID)
              </label>
              <input
                type="text"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                placeholder="CON-001"
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase text-slate-300">
                  NFC Tag Chip ID
                </label>
                <button
                  type="button"
                  onClick={handleAutoFillNewPlayer}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                >
                  <Shuffle className="w-3 h-3" /> Gen Hex
                </button>
              </div>
              <input
                type="text"
                value={newTagId}
                onChange={(e) => setNewTagId(e.target.value)}
                placeholder="NFC-A1-2B"
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Starting Points
              </label>
              <input
                type="number"
                min="0"
                value={newStartingPoints}
                onChange={(e) => setNewStartingPoints(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 text-amber-400 font-bold text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
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
              <Check className="w-4 h-4" /> Save & Enroll Player
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search players by name, badge ID (e.g. CON-042), or NFC Tag..."
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Group Filter */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedTeamFilter}
              onChange={(e) => {
                setSelectedTeamFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none py-1.5"
            >
              <option value="all" className="bg-slate-800">All Groups ({attendees.length})</option>
              {Object.values(teams).map((team) => (
                <option key={team.id} value={team.id} className="bg-slate-800">
                  {team.mascot} {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'points' | 'name' | 'id')}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none py-1.5"
            >
              <option value="points" className="bg-slate-800">Top Points</option>
              <option value="name" className="bg-slate-800">Name (A-Z)</option>
              <option value="id" className="bg-slate-800">Badge ID</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roster & Management Table with Inline Points and NFC Chip Editing */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-xs uppercase bg-slate-800/90 text-slate-400 border-b border-slate-700">
            <tr>
              <th className="px-4 py-3">Player / Attendee</th>
              <th className="px-4 py-3">Assigned Group</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" /> NFC Tag Chip
                </span>
              </th>
              <th className="px-4 py-3">
                <span className="flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400" /> Score (Pts)
                </span>
              </th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {paginated.map((attendee) => {
              const isEditing = editingPlayerId === attendee.id;
              const team = teams[attendee.teamId] || {
                name: 'Unassigned',
                mascot: '🏷️',
                colorHex: '#94a3b8'
              };

              return (
                <tr
                  key={attendee.id}
                  className={`transition ${
                    isEditing ? 'bg-indigo-950/40 ring-1 ring-indigo-500/50' : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Name and avatar */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={attendee.avatarUrl}
                          alt={attendee.name}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-indigo-500 shrink-0"
                        />
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-slate-950 border border-indigo-500 text-white text-sm rounded-lg px-2.5 py-1 focus:outline-none font-semibold w-40 sm:w-44"
                            placeholder="Player name"
                            autoFocus
                          />
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {attendee.id}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <img
                          src={attendee.avatarUrl}
                          alt={attendee.name}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
                        />
                        <div>
                          <div
                            className="font-bold text-white text-sm hover:text-indigo-400 transition cursor-pointer"
                            onClick={() => startEdit(attendee)}
                            title="Click to edit player details"
                          >
                            {attendee.name}
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">{attendee.id}</span>
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Group Selection */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {isEditing ? (
                      <select
                        value={editTeamId}
                        onChange={(e) => setEditTeamId(e.target.value)}
                        className="bg-slate-950 border border-indigo-500 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none font-medium"
                      >
                        {Object.values(teams).map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.mascot} {t.name}
                          </option>
                        ))}
                        {Object.keys(teams).length === 0 && (
                          <option value="team-general">General</option>
                        )}
                      </select>
                    ) : (
                      <span
                        className="px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer hover:opacity-80"
                        onClick={() => startEdit(attendee)}
                        title="Click to edit group"
                        style={{
                          backgroundColor: `${team.colorHex}20`,
                          color: team.colorHex
                        }}
                      >
                        <span>{team.mascot}</span>
                        <span>{team.name}</span>
                      </span>
                    )}
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
                    {isEditing ? (
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as Attendee['role'])}
                        className="bg-slate-950 border border-indigo-500 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                      >
                        <option value="Attendee">Attendee</option>
                        <option value="Team Captain">Team Captain</option>
                        <option value="VIP">VIP</option>
                        <option value="Volunteer">Volunteer</option>
                      </select>
                    ) : (
                      <span>{attendee.role}</span>
                    )}
                  </td>

                  {/* NFC Tag Chip */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editTagId}
                          onChange={(e) => setEditTagId(e.target.value)}
                          placeholder="e.g. NFC-AA-01"
                          className="w-28 sm:w-32 bg-slate-950 border border-indigo-500 text-indigo-300 font-mono text-xs rounded-lg px-2 py-1 focus:outline-none"
                          title="NFC Wristband / Chip Serial Number"
                        />
                        <button
                          type="button"
                          onClick={handleGenerateEditHex}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-indigo-300 transition"
                          title="Generate Random NFC Tag Serial"
                        >
                          <Shuffle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span
                        onClick={() => startEdit(attendee)}
                        className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 cursor-pointer hover:border-indigo-500 hover:text-indigo-300 transition"
                        title="Click to edit NFC chip"
                      >
                        {attendee.tagId}
                      </span>
                    )}
                  </td>

                  {/* Score */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={editPoints}
                          onChange={(e) => setEditPoints(parseInt(e.target.value) || 0)}
                          className="w-20 bg-slate-950 border border-amber-500 text-amber-400 font-black text-sm rounded-lg px-2 py-1 focus:outline-none text-right"
                          title="Edit Total Score Balance"
                        />
                        <span className="text-[10px] text-slate-500 font-bold uppercase">pts</span>
                      </div>
                    ) : (
                      <div
                        onClick={() => startEdit(attendee)}
                        className="cursor-pointer group flex items-baseline"
                        title="Click to manually edit player score"
                      >
                        <span className="font-black text-amber-400 text-sm group-hover:underline">
                          {attendee.points}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">pts</span>
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => saveEdit(attendee)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                          title="Save Changes"
                        >
                          <Check className="w-3.5 h-3.5" /> Save
                        </button>
                        <button
                          onClick={() => setEditingPlayerId(null)}
                          className="p-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition"
                          title="Cancel Editing"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSimulateNfcTap(attendee)}
                          className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold border border-indigo-500/30 transition flex items-center gap-1"
                          title="Trigger NFC +Points Tally Modal"
                        >
                          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> Add Pts
                        </button>

                        <button
                          onClick={() => startEdit(attendee)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                          title="Edit Name, Group, NFC Tag ID, or Points"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {deleteConfirmId === attendee.id ? (
                          <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-600/50 p-1 rounded-lg">
                            <button
                              onClick={() => {
                                onDeletePlayer(attendee.id);
                                setDeleteConfirmId(null);
                              }}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded"
                              title="Confirm Remove"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-slate-400 hover:text-white p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(attendee.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            title="Remove Player from Tournament"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-xs">
                  <div className="max-w-sm mx-auto space-y-3">
                    <p className="font-semibold text-slate-300">No attendees currently in roster</p>
                    <p className="text-slate-500 text-[11px]">
                      Add individual players with &quot;Add Player&quot;, use &quot;Bulk Add Players&quot; to import from a spreadsheet, or tap your smartphone against an unregistered NFC wristband!
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-400">
          <span>
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} attendees
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-slate-800 rounded-lg text-slate-200 font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
