import React from 'react';
import { Attendee, Team } from '../types';
import { Trophy, TrendingUp, Users, Crown, Zap, Flame, PlusCircle, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface LiveLeaderboardProps {
  attendees: Attendee[];
  teams: Record<string, Team>;
  onSelectAttendee: (attendee: Attendee) => void;
  onOpenProjector: () => void;
}

export const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({
  attendees,
  teams,
  onSelectAttendee,
  onOpenProjector
}) => {
  const teamList = Object.values(teams);

  // Aggregate points per team
  const teamAggregates = teamList.map((team) => {
    const teamMembers = attendees.filter((a) => a.teamId === team.id);
    const totalPoints = teamMembers.reduce((sum, a) => sum + a.points, 0);
    const avgPoints = teamMembers.length > 0 ? (totalPoints / teamMembers.length).toFixed(1) : '0';
    return {
      ...team,
      memberCount: teamMembers.length,
      totalPoints,
      avgPoints: Number(avgPoints)
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints);

  const highestTeamPoints = Math.max(...teamAggregates.map((t) => t.totalPoints), 10);

  // Top Individual players
  const topPlayers = [...attendees].sort((a, b) => b.points - a.points).slice(0, 5);

  const chartData = teamAggregates.map((t) => ({
    name: t.name,
    points: t.totalPoints,
    color: t.colorHex,
    mascot: t.mascot
  }));

  if (teamList.length === 0 && attendees.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center shadow-xl space-y-5 max-w-xl mx-auto my-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Welcome to Convention Point Tracker</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your system is in Clean Slate mode ready for your event setup. Start by adding your tournament groups in the <strong>Groups</strong> tab, or bulk adding players in the <strong>Players</strong> tab.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Phone NFC Antenna Ready
          </span>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-emerald-400" /> +1, +3, +5, +10, +20 Points
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Podium / Team Banner */}
      {teamAggregates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {teamAggregates.map((team, index) => {
            const rank = index + 1;
            const pct = Math.round((team.totalPoints / highestTeamPoints) * 100);

            return (
              <div
                key={team.id}
                className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 hover:scale-[1.02] shadow-xl ${
                  rank === 1
                    ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/50 shadow-amber-500/10'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                {/* Rank badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{team.mascot}</span>
                    <div>
                      <h4 className="font-bold text-white text-base leading-tight">{team.name}</h4>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {team.memberCount} players
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow ${
                      rank === 1
                        ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300/60'
                        : rank === 2
                        ? 'bg-slate-300 text-slate-900'
                        : rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{rank}
                  </div>
                </div>

                {/* Total points */}
                <div className="my-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-black tracking-tight" style={{ color: team.colorHex }}>
                      {team.totalPoints.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 ml-1.5 uppercase font-semibold">Tally pts</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Avg {team.avgPoints} / player</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: team.colorHex
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
          No groups created yet. Switch to the <strong>Groups</strong> tab to create tournament divisions!
        </div>
      )}

      {/* Main Content Split: Team Comparison Chart & MVP Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Bar Comparison */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" /> Live Group Point Distribution
              </h3>
              <p className="text-xs text-slate-400">Instant =SUMIF aggregation from NFC badge check-ins</p>
            </div>
            <button
              onClick={onOpenProjector}
              className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold border border-indigo-500/30 transition flex items-center gap-1.5"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Open Stage Projector
            </button>
          </div>

          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-xs shadow-xl">
                            <p className="font-bold text-white flex items-center gap-1.5">
                              <span>{data.mascot}</span> {data.name}
                            </p>
                            <p className="text-amber-400 font-bold mt-1">{data.points} Total Points</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="points" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Create groups to display live visual chart
              </div>
            )}
          </div>
        </div>

        {/* Individual MVPs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" /> Individual MVPs
              </h3>
              <span className="text-xs font-medium text-slate-400">Top 5 Players</span>
            </div>

            <div className="space-y-3">
              {topPlayers.map((player, idx) => {
                const team = teams[player.teamId] || { name: 'Unassigned', colorHex: '#94a3b8', mascot: '🏷️' };
                return (
                  <div
                    key={player.id}
                    onClick={() => onSelectAttendee(player)}
                    className="flex items-center justify-between p-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={player.avatarUrl}
                          alt={player.name}
                          className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-600"
                        />
                        <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-slate-900 text-amber-400 text-[10px] font-black flex items-center justify-center border border-slate-700">
                          {idx + 1}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm group-hover:text-indigo-300 transition">
                          {player.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span style={{ color: team.colorHex }}>{team.mascot} {team.name}</span>
                          <span>•</span>
                          <span className="font-mono">{player.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-amber-400">{player.points}</div>
                      <div className="text-[10px] text-slate-400 uppercase">pts</div>
                    </div>
                  </div>
                );
              })}

              {topPlayers.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">
                  No scores recorded yet. Add attendees and scan tags to begin!
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <span className="text-xs text-slate-500">Tap any attendee to review profile & award points</span>
          </div>
        </div>
      </div>
    </div>
  );
};
