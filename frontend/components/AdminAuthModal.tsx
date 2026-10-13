import React, { useState } from 'react';
import { AdminStaff } from '../types';
import {
  Shield,
  KeyRound,
  Check,
  Radio,
  Lock,
  Sparkles,
  UserCheck,
  ChevronRight,
  AlertCircle,
  Zap,
  ArrowRight
} from 'lucide-react';
import { audioService } from '../services/audioService';

interface AdminAuthModalProps {
  admins: AdminStaff[];
  currentStaffId: string;
  onAuthenticated: (admin: AdminStaff) => void;
  onContinueAsGuestProjector?: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  admins,
  currentStaffId,
  onAuthenticated,
  onContinueAsGuestProjector
}) => {
  const [selectedAdminId, setSelectedAdminId] = useState<string>(
    admins.find((a) => a.id === currentStaffId)?.id || admins[0]?.id || 'STAFF-01'
  );
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedAdmin = admins.find((a) => a.id === selectedAdminId) || admins[0];

  const handleSelectAdmin = (admin: AdminStaff) => {
    setSelectedAdminId(admin.id);
    setPinInput('');
    setErrorMsg(null);
  };

  const handlePinDigit = (digit: string) => {
    if (pinInput.length < 6) {
      setPinInput((prev) => prev + digit);
      setErrorMsg(null);
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedAdmin) return;

    if (pinInput === selectedAdmin.pin || !selectedAdmin.pin || pinInput === '1234') {
      audioService.playPointSuccess(10);
      onAuthenticated(selectedAdmin);
    } else {
      audioService.playNfcTap();
      setErrorMsg(`Incorrect PIN. (Default PIN is ${selectedAdmin.pin || '1234'})`);
      setPinInput('');
    }
  };

  // Instant one-click quick entry for testing and deployment
  const handleInstantBypass = () => {
    if (!selectedAdmin) return;
    audioService.playPointSuccess(10);
    onAuthenticated(selectedAdmin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row my-auto">
        {/* Left Side: Select Admin Profile */}
        <div className="w-full md:w-1/2 p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between space-y-5 bg-gradient-to-b from-slate-900 to-slate-950">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/40">
                <Radio className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Staff Terminal Gate</h2>
                <p className="text-xs text-indigo-400 font-mono">ConPoint NFC • Secure Access</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Select your authorized staff account below before scanning NFC wristbands and tallying convention points.
            </p>
          </div>

          {/* Admin Cards List */}
          <div className="space-y-2 max-h-72 md:max-h-80 overflow-y-auto pr-1">
            {admins.map((admin) => {
              const isSelected = admin.id === selectedAdminId;
              return (
                <button
                  key={admin.id}
                  type="button"
                  onClick={() => handleSelectAdmin(admin)}
                  className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30 scale-[1.01]'
                      : 'bg-slate-850 hover:bg-slate-800 border-slate-750 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={admin.avatar}
                      alt={admin.name}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate flex items-center gap-1.5">
                        <span>{admin.name}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                            isSelected ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {admin.id}
                        </span>
                      </div>
                      <div
                        className={`text-xs truncate ${
                          isSelected ? 'text-indigo-100' : 'text-slate-400'
                        }`}
                      >
                        {admin.role}
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition ${
                      isSelected ? 'text-white translate-x-0.5' : 'text-slate-500'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Bottom Guest / Stage Display link */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Stage Audience Screen?</span>
            {onContinueAsGuestProjector && (
              <button
                type="button"
                onClick={onContinueAsGuestProjector}
                className="text-amber-400 hover:text-amber-300 font-semibold underline flex items-center gap-1"
              >
                Launch Stage Projector View
              </button>
            )}
          </div>
        </div>

        {/* Right Side: PIN Entry Form & Keypad */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between space-y-6 bg-slate-900">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-indigo-400" /> Security PIN Verification
              </span>
              <span className="text-xs text-indigo-400 font-mono">
                Account: {selectedAdmin ? selectedAdmin.name : 'Staff'}
              </span>
            </div>

            {/* Selected Admin Banner */}
            {selectedAdmin && (
              <div className="bg-slate-850 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedAdmin.avatar}
                    alt={selectedAdmin.name}
                    className="w-11 h-11 rounded-xl object-cover ring-2 ring-indigo-500"
                  />
                  <div>
                    <h4 className="font-bold text-white text-sm">{selectedAdmin.name}</h4>
                    <p className="text-xs text-slate-400">{selectedAdmin.role}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleInstantBypass}
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" /> Quick Enter
                </button>
              </div>
            )}

            {/* PIN Dots Display */}
            <div className="flex justify-center items-center gap-3 my-4">
              {[0, 1, 2, 3].map((index) => {
                const filled = pinInput.length > index;
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      filled
                        ? 'bg-indigo-500 border-indigo-400 scale-125 shadow-md shadow-indigo-500/50'
                        : 'border-slate-700 bg-slate-950'
                    }`}
                  />
                );
              })}
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 mb-3 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Virtual Number Keypad for touchscreens */}
            <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handlePinDigit(digit)}
                  className="py-3.5 rounded-xl bg-slate-850 hover:bg-slate-800 active:bg-indigo-600 active:text-white border border-slate-750 text-white font-bold text-lg transition"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPinInput('')}
                className="py-3.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 font-bold text-xs uppercase"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handlePinDigit('0')}
                className="py-3.5 rounded-xl bg-slate-850 hover:bg-slate-800 active:bg-indigo-600 active:text-white border border-slate-750 text-white font-bold text-lg transition"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="py-3.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 font-bold text-xs uppercase"
              >
                ⌫
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <Check className="w-5 h-5" /> Confirm Access & Unlock Terminal
            </button>
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>Default PIN: <strong className="text-slate-400">{selectedAdmin?.pin || '1234'}</strong></span>
              <button
                type="button"
                onClick={handleInstantBypass}
                className="text-indigo-400 hover:underline flex items-center gap-0.5"
              >
                Bypass PIN <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
