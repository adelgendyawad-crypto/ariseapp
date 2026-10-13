import React, { useState } from 'react';
import { Attendee, PointOption, Team } from '../types';
import { POINT_OPTIONS, ACTIVITIES } from '../constants';
import { audioService } from '../services/audioService';
import { X, Award, CheckCircle2, Zap, Radio, Shield, Sparkles } from 'lucide-react';

interface NfcScannerModalProps {
  attendee: Attendee;
  team: Team;
  staffName: string;
  onClose: () => void;
  onAwardPoints: (attendeeId: string, points: number, activity: string, note?: string) => void;
}

export const NfcScannerModal: React.FC<NfcScannerModalProps> = ({
  attendee,
  team,
  staffName,
  onClose,
  onAwardPoints
}) => {
  const [selectedPoints, setSelectedPoints] = useState<PointOption>(5);
  const [selectedActivity, setSelectedActivity] = useState<string>(ACTIVITIES[0]);
  const [customNote, setCustomNote] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioService.playPointSuccess(selectedPoints);
    setSubmitted(true);

    setTimeout(() => {
      onAwardPoints(attendee.id, selectedPoints, selectedActivity, customNote);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Top Tag & NFC Signal header */}
        <div className="bg-gradient-to-r from-indigo-900/60 via-slate-800 to-slate-900 p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400 flex items-center gap-1">
              <Radio className="w-3.5 h-3.5" /> NFC Chip Identified
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Attendee Profile Spotlight */}
        <div className="p-5 pb-3">
          <div className="flex items-center gap-4 bg-slate-800/70 border border-slate-700 rounded-xl p-3.5">
            <div className="relative">
              <img
                src={attendee.avatarUrl}
                alt={attendee.name}
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-slate-600 shadow-md"
              />
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow"
                style={{ backgroundColor: team.colorHex }}
                title={team.name}
              >
                {team.mascot}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold truncate text-white">{attendee.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono">
                  {attendee.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                <Shield className="w-3 h-3 text-indigo-400" /> Tag: <span className="text-slate-200">{attendee.tagId}</span>
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className="text-xs px-2.5 py-0.5 rounded-md font-medium border"
                  style={{
                    backgroundColor: `${team.colorHex}15`,
                    borderColor: `${team.colorHex}40`,
                    color: team.colorHex
                  }}
                >
                  {team.name}
                </span>
                <span className="text-xs text-slate-400">
                  Current: <strong className="text-amber-400">{attendee.points} pts</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form for Point Options */}
        <form onSubmit={handleSubmit} className="p-5 pt-2 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Select Points to Add
              </label>
              <span className="text-xs text-indigo-300 font-medium">Quick 5 Tally Options</span>
            </div>

            {/* The 5 Key Point Options: +1, +3, +5, +10, +20 */}
            <div className="grid grid-cols-5 gap-2">
              {POINT_OPTIONS.map((val) => {
                const isSelected = selectedPoints === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSelectedPoints(val)}
                    className={`relative py-3 px-1 rounded-xl font-bold text-center transition-all transform active:scale-95 border ${
                      isSelected
                        ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/30 scale-105'
                        : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-750 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-lg leading-tight">+{val}</div>
                    <div className="text-[10px] uppercase font-normal opacity-75">pts</div>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full shadow"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity Category Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Convention Activity / Reason
            </label>
            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {ACTIVITIES.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Staff Note (Optional)
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. 1st place in mini-pong playoff"
              className="w-full bg-slate-800/60 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Staff Authorized Indicator */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 py-1">
            <span>Staff Authorized: <strong className="text-slate-300">{staffName}</strong></span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Secure Sync
            </span>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={submitted}
            className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
              submitted
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-[0.98]'
            }`}
          >
            {submitted ? (
              <>
                <CheckCircle2 className="w-5 h-5 animate-bounce" /> Added +{selectedPoints} Points to {attendee.name}!
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-current" /> Confirm +{selectedPoints} Points Tally
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
