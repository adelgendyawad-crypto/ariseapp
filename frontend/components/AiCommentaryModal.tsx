import React, { useState } from 'react';
import { Attendee, Team } from '../types';
import { generateConventionHypeCommentary } from '../services/geminiService';
import { Sparkles, Megaphone, Loader2, RefreshCw, X, Radio } from 'lucide-react';

interface AiCommentaryModalProps {
  teams: Record<string, Team>;
  teamScores: Record<string, number>;
  attendees: Attendee[];
  onClose: () => void;
}

export const AiCommentaryModal: React.FC<AiCommentaryModalProps> = ({
  teams,
  teamScores,
  attendees,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [commentary, setCommentary] = useState<{
    title: string;
    commentary: string;
    mvpHonorable: string;
    tipForHost: string;
  } | null>(null);

  const fetchHype = async () => {
    setLoading(true);
    const sorted = [...attendees].sort((a, b) => b.points - a.points);
    const result = await generateConventionHypeCommentary(teams, teamScores, sorted);
    setCommentary(result);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchHype();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        <div className="bg-gradient-to-r from-purple-900/60 via-slate-800 to-indigo-900/60 p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Gemini Arena Announcer</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-sm text-slate-400">Analyzing live NFC wristband points & momentum swing...</p>
            </div>
          ) : commentary ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4">
                <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> Stadium PA System
                </span>
                <h4 className="text-lg font-black text-white mt-1">{commentary.title}</h4>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">{commentary.commentary}</p>
              </div>

              <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3.5">
                <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
                  Spotlight Award
                </span>
                <p className="text-sm text-slate-200 mt-1">{commentary.mvpHonorable}</p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Host Pro-Tip
                </span>
                <p className="text-xs text-slate-300 mt-1 italic">{commentary.tipForHost}</p>
              </div>
            </div>
          ) : null}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              onClick={fetchHype}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh AI Commentary
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
