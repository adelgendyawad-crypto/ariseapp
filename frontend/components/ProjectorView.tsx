import React, { useEffect, useState } from 'react';
import { Attendee, Team } from '../types';
import { Trophy, Flame, Minimize2, Sparkles } from 'lucide-react';

interface ProjectorViewProps {
  attendees: Attendee[];
  teams: Record<string, Team>;
  onExit: () => void;
}

export const ProjectorView: React.FC<ProjectorViewProps> = ({ attendees, teams, onExit }) => {
  const [tickerIndex, setTickerIndex] = useState(0);

  // Compute standings
  const teamStandings = Object.values(teams).map((t) => {
    const members = attendees.filter((a) => a.teamId === t.id);
    const total = members.reduce((sum, a) => sum + a.points, 0);
    return {
      ...t,
      total,
      count: members.length
    };
  }).sort((a, b) => b.total - a.total);

  const highest = Math.max(...teamStandings.map((t) => t.total), 1);
  const topPlayers = [...attendees].sort((a, b) => b.points - a.points).slice(0, 4);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col p-6 sm:p-10 select-none overflow-hidden">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/50">
            <Trophy className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider bg-gradient-to-r from-white via-indigo-200 to-amber-300 bg-clip-text text-transparent">
              Convention Championship Arena
            </h1>
            <p className="text-xs text-slate-400 font-mono tracking-widest flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE STAGE TALLY • 200 PLAYERS • NFC SYNCHRONIZED
            </p>
          </div>
        </div>

        <button
          onClick={onExit}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-2"
        >
          <Minimize2 className="w-4 h-4" /> Exit Fullscreen
        </button>
      </div>

      {/* Main Arena Cards: Dynamic Teams */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 items-stretch overflow-y-auto">
        {teamStandings.map((team, idx) => {
          const rank = idx + 1;
          const pct = Math.round((team.total / highest) * 100);

          return (
            <div
              key={team.id}
              className={`rounded-3xl p-6 flex flex-col justify-between border relative overflow-hidden transition-all duration-500 ${
                rank === 1
                  ? 'bg-gradient-to-b from-amber-950/60 via-slate-900 to-slate-950 border-amber-500 shadow-2xl shadow-amber-500/20 scale-105 z-10'
                  : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              {rank === 1 && (
                <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 font-black text-xs px-4 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1 shadow">
                  <Flame className="w-3.5 h-3.5 fill-current" /> Leader
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{team.mascot}</span>
                  <div className="text-2xl font-black text-slate-500">#{rank}</div>
                </div>

                <h3 className="text-xl font-black text-white">{team.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{team.count} Convention Attendees</p>
              </div>

              <div className="my-6 text-center">
                <div className="text-6xl font-black tracking-tight" style={{ color: team.colorHex }}>
                  {team.total}
                </div>
                <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mt-1">
                  Team Score
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>Domination</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: team.colorHex
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Live Top Scorers Spotlight */}
      <div className="mt-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wider">
          <Sparkles className="w-4 h-4" /> Leading MVP Contenders:
        </div>

        <div className="flex flex-wrap items-center gap-6">
          {topPlayers.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-400">#{i + 1}</span>
              <span className="text-sm font-semibold text-white">{p.name}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                {p.points} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
