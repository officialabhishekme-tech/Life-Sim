import React, { useState } from 'react';
import { User, Sparkles, Check, ArrowRight } from 'lucide-react';
import { sounds } from '../utils/audio';

interface CharacterSelectModalProps {
  initialName: string;
  onSelect: (gender: 'male' | 'female', characterName: string) => void;
}

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  initialName,
  onSelect,
}) => {
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
  const [name, setName] = useState(initialName || 'Citizen');

  const handleConfirm = () => {
    sounds.playNotification();
    onSelect(selectedGender, name.trim() || 'Citizen');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[36px] shadow-2xl p-6 sm:p-8 text-white overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Character Setup
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Choose Your Character
            </h2>
            <p className="text-xs text-slate-400">
              Select your citizen persona before stepping into the 3D open world.
            </p>
          </div>

          {/* Gender Selection Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Male Citizen */}
            <button
              type="button"
              onClick={() => {
                setSelectedGender('male');
                sounds.playStep();
              }}
              className={`relative p-5 rounded-3xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-3 ${
                selectedGender === 'male'
                  ? 'bg-slate-800/90 border-blue-500 shadow-xl shadow-blue-500/20 ring-2 ring-blue-500/40'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
              }`}
            >
              {selectedGender === 'male' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
              {/* Avatar Silhouette Visual */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-lg">
                <div className="w-full h-full rounded-[14px] bg-slate-950 flex flex-col items-center justify-center text-3xl">
                  👨
                </div>
              </div>
              <div>
                <div className="text-base font-bold text-white">Male</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Classic Jacket & Cap</div>
              </div>
            </button>

            {/* Female Citizen */}
            <button
              type="button"
              onClick={() => {
                setSelectedGender('female');
                sounds.playStep();
              }}
              className={`relative p-5 rounded-3xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-3 ${
                selectedGender === 'female'
                  ? 'bg-slate-800/90 border-rose-500 shadow-xl shadow-rose-500/20 ring-2 ring-rose-500/40'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
              }`}
            >
              {selectedGender === 'female' && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
              {/* Avatar Silhouette Visual */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-rose-500 to-purple-600 p-0.5 shadow-lg">
                <div className="w-full h-full rounded-[14px] bg-slate-950 flex flex-col items-center justify-center text-3xl">
                  👩
                </div>
              </div>
              <div>
                <div className="text-base font-bold text-white">Female</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Ponytail & Modern Fit</div>
              </div>
            </button>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Character Name:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your citizen name..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all cursor-pointer active:scale-95"
          >
            <span>Enter the Open World</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      </div>
    </div>
  );
};
