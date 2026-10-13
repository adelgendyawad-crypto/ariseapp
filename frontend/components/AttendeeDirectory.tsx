import React, { useState } from 'react';
import { Attendee, Team } from '../types';
import { Search, Radio, Filter } from 'lucide-react';

interface AttendeeDirectoryProps {
  attendees: Attendee[];
  teams: Record<string, Team>;
  onSelectAttendee: (attendee: Attendee) => void;
  onSimulateNfcTap: (attendee: Attendee) => void;
}

export const AttendeeDirectory: React.FC<AttendeeDirectoryProps> = ({
  attendees,
  teams,
  onSelectAttendee,
  onSimulateNfcTap
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');

  const filtered = attendees.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.tagId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = selectedTeamFilter === 'all' || a.teamId === selectedTeamFilter;
    return matchesSearch && matchesTeam;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by attendee name, ID (e.g. CON-102), or Tag ID..."
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedTeamFilter}
            onChange={(e) => setSelectedTeamFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Groups ({attendees.length})</option>
            {Object.values(teams).map((team) => (
              <option key={team.id} value={team.id}>
                {team.mascot} {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Attendee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map((attendee) => {
          const team = teams[attendee.teamId] || { name: 'Unknown', colorHex: '#94a3b8', mascot: '❓' };
          return (
            <div
              key={attendee.id}
              className="bg-slate-800/70 border border-slate-700/80 hover:border-slate-600 rounded-xl p-3.5 transition flex items-center justify-between gap-3 group"
            >
              <div
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                onClick={() => onSelectAttendee(attendee)}
              >
                <img
                  src={attendee.avatarUrl}
                  alt={attendee.name}
                  className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-600 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-sm truncate group-hover:text-indigo-400 transition">
                      {attendee.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="font-mono text-[11px] text-slate-300">{attendee.id}</span>
                    <span>•</span>
                    <span style={{ color: team.colorHex }} className="font-medium text-[11px]">
                      {team.mascot} {team.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    NFC: {attendee.tagId}
                  </div>
                </div>
              </div>

              {/* Point pill and instant NFC Tap button */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="text-right">
                  <span className="text-base font-black text-amber-400">{attendee.points}</span>
                  <span className="text-[10px] text-slate-400 ml-1">pts</span>
                </div>
                <button
                  onClick={() => onSimulateNfcTap(attendee)}
                  className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold border border-indigo-500/40 transition flex items-center gap-1 shadow-sm"
                  title="Simulate smartphone NFC tag tap"
                >
                  <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                  <span>Tap NFC</span>
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            No attendees found matching your search query.
          </div>
        )}
      </div>
    </div>
  );
};
