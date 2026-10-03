import React from 'react';
import { Vitals, WeatherType, QuestStage, PhysicalAffliction } from '../types/game';
import {
  Sun,
  CloudRain,
  CloudLightning,
  CloudFog,
  Navigation,
  Compass,
  Clock,
  Smartphone,
  AlertTriangle,
  Heart,
  Utensils,
  Droplets,
  Zap
} from 'lucide-react';

interface HUDProps {
  weather: WeatherType;
  gameHour: number;
  gameDay: number;
  questStage: QuestStage;
  nearestZoneDistance: number | null;
  nearestZoneName: string | null;
  afflictions: PhysicalAffliction[];
  onTogglePhone: () => void;
  onSetWeather: (w: WeatherType) => void;
}

export const HUD: React.FC<HUDProps> = ({
  weather,
  gameHour,
  gameDay,
  questStage,
  nearestZoneDistance,
  nearestZoneName,
  afflictions = [],
  onTogglePhone,
  onSetWeather,
}) => {
  // Format game hour (e.g. 14.5 -> "02:30 PM")
  const hourInt = Math.floor(gameHour) % 24;
  const minuteInt = Math.floor((gameHour % 1) * 60);
  const isPm = hourInt >= 12;
  const displayHour = hourInt % 12 === 0 ? 12 : hourInt % 12;
  const timeString = `${displayHour.toString().padStart(2, '0')}:${minuteInt
    .toString()
    .padStart(2, '0')} ${isPm ? 'PM' : 'AM'}`;

  // Meal window detection
  const isBreakfastTime = hourInt >= 7 && hourInt <= 10;
  const isLunchTime = hourInt >= 12 && hourInt <= 15;
  const isDinnerTime = hourInt >= 18 && hourInt <= 21;
  const currentMealWindow = isBreakfastTime
    ? 'Breakfast Window (7-10 AM)'
    : isLunchTime
    ? 'Lunch Window (12-3 PM)'
    : isDinnerTime
    ? 'Dinner Window (6-9 PM)'
    : null;

  // Quest objective message
  const questDetails = {
    GO_TO_BANK: {
      title: 'Task 1: Open Bank Account',
      desc: 'Walk to the Bank of Metropolis door to open your account, get a Visa debit card & $1,500 grant.',
    },
    ACTIVATE_SIM: {
      title: 'Task 2: Activate Phone & 5G SIM',
      desc: 'Go to the Nova Telecom store door to activate your SIM and unlock peer-to-peer mobile transfers.',
    },
    SEND_FIRST_TRANSFER: {
      title: 'Task 3: Make Instant P2P Transfer',
      desc: 'Open your side smartphone and send money instantly to a contact using the secure P2P transfer network.',
    },
    SURVIVE_AND_THRIVE: {
      title: 'Objective: Live & Thrive in City',
      desc: 'Eat 3 meals a day, hydrate constantly in sunny weather, dine at the restaurant, and sleep to survive!',
    },
  }[questStage];

  return (
    <div className="pointer-events-none fixed inset-0 z-30 select-none flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* TOP HEADER: TIME, WEATHER, QUEST BANNER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
        {/* Day, Time & Dynamic Weather Bar */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-xl text-white">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
            <Clock className="w-4 h-4 text-emerald-400" />
            <div className="leading-tight">
              <div className="text-xs font-bold font-mono">{timeString}</div>
              <div className="text-[10px] text-slate-400">Day {gameDay}</div>
            </div>
          </div>

          {/* Dynamic Weather System Indicator & Controls */}
          <div className="flex items-center gap-2 pl-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {weather === 'sunny' && <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />}
              {weather === 'rainy' && <CloudRain className="w-4 h-4 text-sky-400" />}
              {weather === 'stormy' && <CloudLightning className="w-4 h-4 text-purple-400 animate-pulse" />}
              {weather === 'foggy' && <CloudFog className="w-4 h-4 text-slate-400" />}
              <span className="capitalize">{weather}</span>
            </div>

            {/* Quick Weather Picker */}
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800 ml-1">
              {(['sunny', 'rainy', 'stormy', 'foggy'] as WeatherType[]).map((w) => (
                <button
                  key={w}
                  onClick={() => onSetWeather(w)}
                  title={`Change weather to ${w}`}
                  className={`p-1 rounded-lg text-xs transition-colors cursor-pointer ${
                    weather === w ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {w === 'sunny' ? '☀️' : w === 'rainy' ? '🌧️' : w === 'stormy' ? '⛈️' : '🌫️'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quest Tracker */}
        <div className="pointer-events-auto max-w-md w-full bg-slate-950/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-800 shadow-xl text-white">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-emerald-400" /> Active Mission
            </span>
            {nearestZoneName && nearestZoneDistance !== null && (
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                {nearestZoneName}: {Math.round(nearestZoneDistance)}m
              </span>
            )}
          </div>
          <div className="text-xs font-bold text-white">{questDetails.title}</div>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{questDetails.desc}</p>
        </div>
      </div>

      {/* MID-SCREEN: PHYSICAL PROBLEMS & SYMPTOMS WARNINGS */}
      <div className="space-y-2.5 max-w-sm pointer-events-auto">
        {/* Active Physical Afflictions Badges */}
        {afflictions.map((aff) => (
          <div
            key={aff.id}
            className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 backdrop-blur-md text-white shadow-xl animate-in slide-in-from-left duration-300"
          >
            <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
              <span>{aff.title}</span>
            </div>
            <p className="text-[11px] text-slate-200 mt-1 leading-tight">
              {aff.impactDescription}
            </p>
            <button
              onClick={onTogglePhone}
              className="mt-2 text-[10px] text-rose-300 font-semibold underline hover:text-white cursor-pointer"
            >
              Open Body Vitals App in Phone &rarr;
            </button>
          </div>
        ))}

        {currentMealWindow && afflictions.length === 0 && (
          <div className="px-3.5 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 backdrop-blur-md flex items-center gap-2.5 text-amber-200 shadow-lg animate-in slide-in-from-left duration-300">
            <Utensils className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-[11px]">
              <strong className="text-amber-300">Meal Time!</strong> {currentMealWindow}. Visit the restaurant or market.
            </div>
          </div>
        )}

        {weather === 'rainy' && (
          <div className="px-3.5 py-2 rounded-2xl bg-sky-500/15 border border-sky-500/30 backdrop-blur-md flex items-center gap-2.5 text-sky-200 shadow-lg text-[11px]">
            <CloudRain className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Wet streets reduce walk speed by 15% and increase fatigue buildup.</span>
          </div>
        )}
      </div>

      {/* BOTTOM SECTION: PHONE QUICK LAUNCHER & CONTROLS HELPER (NO ON-SCREEN VITALS, SHOWS IN APP ONLY) */}
      <div className="flex flex-col sm:flex-row items-end justify-between gap-4 w-full">
        {/* Smartphone Quick Launcher Pill */}
        <button
          onClick={onTogglePhone}
          className="pointer-events-auto px-4 py-2.5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 text-white hover:bg-slate-900 transition-all flex items-center gap-2.5 shadow-xl backdrop-blur-md cursor-pointer group hover:scale-105 active:scale-95"
        >
          <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>NovaPhone Pro</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-slate-400">View Body Vitals & Metropolis Bank</div>
          </div>
          <kbd className="ml-1 px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-mono">
            M
          </kbd>
        </button>

        {/* Controls helper hint */}
        <div className="pointer-events-auto bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800 text-[10px] text-slate-400 flex items-center gap-3">
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono font-bold">W</kbd><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono font-bold ml-1">A</kbd><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono font-bold ml-1">S</kbd><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono font-bold ml-1">D</kbd> Walk</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono font-bold">Shift</kbd> Sprint</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono font-bold">E</kbd> Interact Door</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded font-mono font-bold">M</kbd> Open Phone</span>
        </div>
      </div>
    </div>
  );
};
