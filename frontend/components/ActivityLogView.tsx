import React from 'react';
import { PointTransaction, Team } from '../types';
import { History, ArrowUpRight, RotateCcw, ShieldCheck } from 'lucide-react';

interface ActivityLogViewProps {
  logs: PointTransaction[];
  teams: Record<string, Team>;
  onUndo: (logId: string) => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ logs, teams, onUndo }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" /> Real-time NFC Transaction Log
          </h3>
          <p className="text-xs text-slate-400">All points awarded via wristband/card NFC scans</p>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          {logs.length} Scans Logged
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-xs uppercase bg-slate-800/80 text-slate-400 border-b border-slate-700">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Attendee</th>
              <th className="px-4 py-3">Group / Team</th>
              <th className="px-4 py-3">Points</th>
              <th className="px-4 py-3">Activity</th>
              <th className="px-4 py-3">Staff Host</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {logs.map((log) => {
              const team = teams[log.teamId] || { name: 'Unknown', colorHex: '#94a3b8', mascot: '❓' };
              return (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400 font-mono">
                    {log.timestamp}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-semibold text-white">{log.attendeeName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{log.attendeeId}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className="px-2 py-0.5 rounded-md text-xs font-medium"
                      style={{
                        backgroundColor: `${team.colorHex}20`,
                        color: team.colorHex
                      }}
                    >
                      {team.mascot} {team.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-400 text-sm">
                      <ArrowUpRight className="w-4 h-4" /> +{log.pointsAwarded}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300 max-w-xs truncate">
                    {log.activity}
                    {log.note && <span className="block text-[11px] text-slate-500 italic font-normal">"{log.note}"</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> {log.staffName}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <button
                      onClick={() => onUndo(log.id)}
                      className="text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition"
                      title="Undo this transaction"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}

            {logs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-xs">
                  No NFC transactions recorded yet. Scan an attendee wristband to begin!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
