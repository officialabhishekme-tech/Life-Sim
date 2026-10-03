import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import {
  Wallet,
  Smartphone,
  CloudSun,
  ShieldCheck,
  Send,
  Sparkles,
  Gamepad2,
  Coffee,
  BedDouble,
  Droplets
} from 'lucide-react';

interface AuthScreenProps {
  onSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      console.error('Google Sign-In failed:', err);
      const msg = err instanceof Error ? err.message : 'Failed to sign in with Google';
      if (msg.includes('popup-closed-by-user')) {
        setErrorMsg('Sign-in cancelled. Please click the button to try again.');
      } else {
        setErrorMsg('Sign-in failed. Please verify popup permissions and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-950 text-white font-sans selection:bg-indigo-500 selection:text-white">
      {/* 3D-styled animated backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Floating ambient glow orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center gap-12">
        {/* Left column: Game lore & feature highlights */}
        <div className="flex-1 space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            3D Open World Life & Banking Simulator
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Live, Earn & <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              Master Your Wealth
            </span>
          </h1>

          <p className="text-slate-300 text-base leading-relaxed">
            Step into an interactive 3D city. Manage real-life bodily needs with meals, hydration,
            and sleep, survive dynamic rain and sunshine, open your bank account, get a debit card, and command your finances with an in-game smartphone.
          </p>

          {/* Quick feature grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">Bank & Debit Card</div>
                <div className="text-[11px] text-slate-400">Initial $1,500 grant</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">Live Mobile App</div>
                <div className="text-[11px] text-slate-400">Interactive charts</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                <CloudSun className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">Dynamic Weather</div>
                <div className="text-[11px] text-slate-400">Sun, rain & stamina</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Send className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">Instant P2P Pay</div>
                <div className="text-[11px] text-slate-400">Telco SIM unlock</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-slate-400 pt-2">
            <span className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-cyan-400" /> Hydration</span>
            <span className="flex items-center gap-1.5"><Coffee className="w-3.5 h-3.5 text-amber-400" /> 3 Meals Daily</span>
            <span className="flex items-center gap-1.5"><BedDouble className="w-3.5 h-3.5 text-violet-400" /> Restful Sleep</span>
          </div>
        </div>

        {/* Right column: Login Card */}
        <div className="w-full md:w-96">
          <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800/80 p-8 shadow-2xl backdrop-blur-xl">
            {/* Top icon header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 p-0.5 shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-white">
                  <Gamepad2 className="w-8 h-8 text-emerald-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white">Welcome, Citizen</h2>
              <p className="text-xs text-slate-400 mt-1">
                Sign in with your Google account to initialize your persistent open-world persona and bank vault.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs leading-relaxed">
                {errorMsg}
              </div>
            )}

            {/* ONLY Google Account Login as requested */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full relative group overflow-hidden rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3.5 px-4 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-3 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google OAuth 2.0 & Firebase Verified Security</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
