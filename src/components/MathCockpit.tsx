import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  Scale,
  Activity,
  Shield,
  Zap,
  Search,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Flame as BurnIcon
} from 'lucide-react';
import { UserProfile, DailyLog } from '../types';

interface MathCockpitProps {
  profile: UserProfile;
  stats: {
    totalIn: number;
    totalOut: number;
    totalDeficit: number;
    fatBurnedLbs: number;
    daysProgressed: number;
    avgCaloriesOut: number;
    avgProteinIn: number;
  };
  logs: Record<string, DailyLog>;
  onReset: () => void;
  onOpenSettings: () => void;
}

export default function MathCockpit({ profile, stats, logs, onReset, onOpenSettings }: MathCockpitProps) {
  // Check if user has active logged days
  const hasLogs = stats.daysProgressed > 0;

  // Fallbacks to match mockup exactly if no logs are completed yet, otherwise bind to live tracker
  const currentDay = hasLogs ? Math.min(30, Math.max(1, stats.daysProgressed)) : 4;
  const fatLossValue = hasLogs ? stats.fatBurnedLbs : 0.45;
  const cumulativeDeficitValue = hasLogs ? stats.totalDeficit : 1574;
  const dailyAvgDeficitValue = hasLogs ? (stats.daysProgressed > 0 ? Math.round(stats.totalDeficit / stats.daysProgressed) : 0) : 1574;
  const avgProteinValue = hasLogs ? stats.avgProteinIn : 36;

  // Goals
  const targetFatGoal = hasLogs ? (profile.fatLossGoal || 4) : 4;
  const targetDailyDeficitGoal = hasLogs ? Math.round((profile.fatLossGoal * 3500) / 30) : 467;
  const proteinMin = hasLogs ? Math.round((profile.weight * (profile.weightUnit === 'lbs' ? 1 : 2.2)) * 0.7) : 136;
  const proteinMax = hasLogs ? Math.round((profile.weight * (profile.weightUnit === 'lbs' ? 1 : 2.2)) * 1.0) : 194;

  // Simple sparkline arrays for visual accuracy
  const sparklineDataHero = [12, 10, 18, 22, 15, 30, 24, 38, 45];
  const sparklineDailyAvg = [400, 310, 600, 450, 720, 520, 630];

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  return (
    <div className="bg-[#121214] border border-zinc-850 rounded-[28px] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] relative p-5 sm:p-7 text-white select-none">
      
      {/* Subtle Mathematical Formula Watermark Pattern */}
      <div className="absolute inset-0 select-none pointer-events-none opacity-5 overflow-hidden font-mono text-[9px] text-zinc-500 leading-none space-y-16 py-12 px-6">
        <div className="flex justify-between">
          <span>{"\\Delta E = m \\cdot c^2"}</span>
          <span>{"\\sum_{i=1}^{n} x_i"}</span>
        </div>
        <div className="flex justify-around">
          <span>{"\\int_{a}^{b} f(x) dx = F(b) - F(a)"}</span>
        </div>
        <div className="flex justify-between">
          <span>{"BMR = 10W + 6.25H - 5A + 5"}</span>
          <span>{"\\mu = \\frac{1}{N}\\sum_{i=1}^{N}x_i"}</span>
        </div>
        <div className="flex justify-around text-lime-400 font-bold opacity-30">
          <span>{"FAT\\_LOSS\\_JUST_MATH = TRUE"}</span>
        </div>
        <div className="flex justify-between">
          <span>{"\\sigma^2 = \\frac{\\sum(x - \\mu)^2}{N}"}</span>
          <span>{"\\theta = \\omega \\cdot t"}</span>
        </div>
        <div className="flex justify-around">
          <span>{"f(X) = \\int_{-\\infty}^{\\infty} P(X|\\omega) d\\omega"}</span>
        </div>
        <div className="flex justify-between">
          <span>{"Deficit = Total\\_Out - Calories\\_In"}</span>
          <span>{"\\pi \\approx 3.14159"}</span>
        </div>
      </div>

      {/* Grid Overlay for premium tactical layout lines */}
      <div className="absolute inset-0 bg-[#0e0d10] bg-[radial-gradient(#1e1d22_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_80%,transparent_100%)] opacity-40 pointer-events-none z-0"></div>

      {/* Content Container */}
      <div className="relative z-10 space-y-6">

        {/* Challenge overall progress bar */}
        <div className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-3 flex items-center justify-between text-xs text-zinc-400 font-semibold shadow-inner">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse shadow-[0_0_8px_rgba(163,230,53,0.6)]"></span>
            <span className="uppercase tracking-wider text-[10px]">Overall Challenge Timeline:</span>
          </div>
          <div className="grow mx-4 bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-850">
            <div
              className="bg-lime-400 h-full transition-all duration-300 shadow-[0_0_10px_#a3e635]"
              style={{ width: `${(currentDay / 30) * 100}%` }}
            ></div>
          </div>
          <span className="font-mono text-white text-xs bg-zinc-900 px-2.5 py-0.5 rounded border border-zinc-850 flex items-center gap-1.5">
            <span>Day {currentDay}/30</span>
            <span className="text-zinc-650">•</span>
            <span className="text-lime-400 font-bold">{Math.round((currentDay / 30) * 100)}% Completed</span>
          </span>
        </div>

        {/* Dynamic Bento Box Cards Display Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* 1. HERO CARD: Total Fat Loss (High Impact Gauge) */}
          <div className="bg-gradient-to-b from-zinc-950 to-[#0e0d11] border border-zinc-900 rounded-2xl p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02),_0_8px_24px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col justify-between space-y-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-lime-500/5 rounded-full blur-3xl pointer-events-none z-0"></div>
            <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse z-20 shadow-[0_0_8px_#a3e635]"></div>

            <div className="flex items-center gap-1.5 text-zinc-550 border-b border-zinc-900/60 pb-2.5">
              <Scale className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">TOTAL FAT LOSS</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                {/* Large Neon/Red Weight Metric */}
                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className={`text-4xl sm:text-5xl font-extrabold tracking-tight transition-colors duration-350 ${
                    fatLossValue < 0 
                      ? 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.45)]' 
                      : 'text-[#a3e635] drop-shadow-[0_0_12px_rgba(163,230,53,0.45)]'
                  }`}>
                    {fatLossValue?.toFixed(2)}
                  </span>
                  <span className="text-zinc-400 text-xs font-sans font-black tracking-widest">LBS</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-2 font-mono font-black uppercase">
                  Goal: {targetFatGoal} lbs
                </p>
              </div>

              {/* Glowing Circular Gauge overlay */}
              {(() => {
                const ratio = Math.min(1, Math.max(0, fatLossValue / (targetFatGoal || 4)));
                const percentage = Math.round(ratio * 100);
                const radius = 28;
                const circum = 2 * Math.PI * radius;
                const strokeDashoffset = circum - ratio * circum;
                return (
                  <div className="relative flex items-center justify-center shrink-0">
                    <svg className="w-18 h-18 origin-center -rotate-90">
                      <circle
                        cx="36"
                        cy="36"
                        r={radius}
                        className="fill-none stroke-zinc-900 stroke-[3]"
                      />
                      <circle
                        cx="36"
                        cy="36"
                        r={radius}
                        className="fill-none stroke-lime-500/10 stroke-[5] blur-[1px]"
                      />
                      <circle
                        cx="36"
                        cy="36"
                        r={radius}
                        className="fill-none stroke-[#a3e635] stroke-[3.5] transition-all duration-500"
                        strokeDasharray={circum}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                      <span className="text-[11px] font-black text-white">{percentage}%</span>
                      <span className="text-[7px] uppercase text-zinc-500 font-sans tracking-tight font-extrabold">target</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="pt-2 border-t border-zinc-900/80">
              <div className="w-full h-5" title="Progress bio trend">
                <svg viewBox="0 0 100 20" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="sparkGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a3e635" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#a3e635" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M 0,20 ${sparklineDataHero.map((val, i) => `L ${(i / (sparklineDataHero.length - 1)) * 100},${20 - (val / 50) * 18}`).join(' ')} L 100,20 Z`}
                    fill="url(#sparkGlow)"
                    className="opacity-40"
                  />
                  <path
                    d={sparklineDataHero.map((val, i) => `${i === 0 ? 'M' : 'L'} ${(i / (sparklineDataHero.length - 1)) * 100},${20 - (val / 50) * 18}`).join(' ')}
                    fill="none"
                    stroke="#a3e635"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_3px_#a3e635]"
                  />
                  <circle
                    cx="100"
                    cy={20 - (sparklineDataHero[sparklineDataHero.length - 1] / 50) * 18}
                    r="2"
                    fill="#ffffff"
                    stroke="#a3e635"
                    strokeWidth="1.2"
                  />
                </svg>
              </div>
              <span className="text-[8px] uppercase font-black tracking-widest text-zinc-500 block text-right mt-1 leading-none">
                30D METRIC PATH TREND
              </span>
            </div>
          </div>

          {/* 2. CALORIE METRICS ANALYSIS: Dual Sections */}
          <div className="bg-gradient-to-b from-zinc-950 to-[#0e0d11] border border-zinc-900 rounded-2xl overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.02),_0_8px_24px_rgba(0,0,0,0.6)] relative flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none z-0"></div>

            <div className="bg-zinc-950/95 px-4 py-2.5 border-b border-zinc-900 flex justify-between items-center shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-300">
                CALORIE METRICS ANALYSIS
              </span>
              <span className="text-[8px] font-black text-blue-400 tracking-widest bg-blue-500/15 px-2 py-0.5 rounded border border-blue-500/20 uppercase font-mono">
                Pure Biophysics
              </span>
            </div>

            <div className="grid grid-cols-2 divide-x divide-zinc-900/90 grow">
              
              {/* LEFT: Cumulative Deficit */}
              <div className="p-4 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-500/10 animate-pulse" />
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-zinc-500">CUMULATIVE DEFICIT</span>
                  </div>
                  <div className="flex items-baseline gap-0.5 mt-2 font-mono">
                    <span className={`text-xl sm:text-2xl font-black ${
                      cumulativeDeficitValue < 0 ? 'text-rose-455 text-rose-400' : 'text-white'
                    }`}>
                      {cumulativeDeficitValue.toLocaleString()}
                    </span>
                    <span className="text-[8.5px] font-bold text-zinc-550 uppercase">kcal</span>
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-zinc-900/60">
                  <div className="h-1 bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-900">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-lime-400 h-full shadow-[0_0_5px_rgba(249,115,22,0.5)] transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, (cumulativeDeficitValue / 14000) * 100))}%` }}
                    ></div>
                  </div>
                  <span className="text-[8px] text-zinc-500 tracking-wider block font-black uppercase">
                    Deficit running total
                  </span>
                </div>
              </div>

              {/* RIGHT: Daily Average Deficit */}
              <div className="p-4 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Activity className="w-3.5 h-3.5 text-lime-400" />
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-zinc-500">DAILY AVG DEFICIT</span>
                  </div>
                  <div className="flex items-baseline gap-0.5 mt-2 font-mono">
                    <span className={`text-xl sm:text-2xl font-black drop-shadow-[0_0_8px_rgba(163,230,53,0.3)] ${
                      dailyAvgDeficitValue < 0 
                        ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]' 
                        : 'text-[#a3e635]'
                    }`}>
                      {dailyAvgDeficitValue.toLocaleString()}
                    </span>
                    <span className="text-[8.5px] font-bold text-zinc-500 uppercase">kcal</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-zinc-900/60">
                  <div className="flex justify-between items-baseline text-[7px] uppercase font-bold text-zinc-500 tracking-wider">
                    <span>
                      Target: {targetDailyDeficitGoal} kcal/day
                    </span>
                  </div>
                  
                  {/* Gauge speedometer line viz micro sparkline */}
                  <div className="w-full h-4 relative">
                    <svg viewBox="0 0 100 15" className="w-full h-full overflow-visible">
                      <path
                        d={sparklineDailyAvg.map((val, i) => `${i === 0 ? 'M' : 'L'} ${(i / (sparklineDailyAvg.length - 1)) * 100},${13 - (val / 1200) * 10}`).join(' ')}
                        fill="none"
                        stroke="#60a5fa"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        className="opacity-80"
                      />
                      <line
                        x1="0"
                        y1={13 - (targetDailyDeficitGoal / 1200) * 10}
                        x2="100"
                        y2={13 - (targetDailyDeficitGoal / 1200) * 10}
                        stroke="#a3e635"
                        strokeDasharray="2 2"
                        strokeWidth="1"
                        className="opacity-75"
                      />
                    </svg>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 3. PROTEIN CARD: Average Protein / Day Focus */}
          <div className="bg-gradient-to-b from-zinc-950 to-[#0e0d11] border border-zinc-900 rounded-2xl p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02),_0_8px_24px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col justify-between space-y-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex justify-between items-center border-b border-zinc-900/60 pb-2.5">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <span className="text-xs">🥩</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">AVG PROTEIN / DAY FOCUS</span>
              </div>
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black">
                Muscle Target
              </span>
            </div>

            <div className="flex justify-between items-baseline">
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#a3e635] drop-shadow-[0_0_8px_rgba(163,230,53,0.3)]">
                  {avgProteinValue}
                </span>
                <span className="text-[10px] font-bold text-zinc-500 font-sans tracking-tight">G / DAY</span>
              </div>

              <span className="text-[10px] font-mono font-bold text-zinc-400">
                Goal Range: {proteinMin}g - {proteinMax}g
              </span>
            </div>

            {/* Range visualization slider */}
            <div className="space-y-1.5">
              <div className="relative h-2.5 bg-zinc-950 border border-zinc-900/80 rounded-full">
                {(() => {
                  const totalScale = 220; // 0g to 220g scale
                  const leftPct = (proteinMin / totalScale) * 100;
                  const widthPct = ((proteinMax - proteinMin) / totalScale) * 100;
                  const currentPct = (avgProteinValue / totalScale) * 100;
                  
                  return (
                    <>
                      {/* safe sweet spot zone highlight bar */}
                      <div
                        className="absolute top-0.5 bottom-0.5 bg-blue-500/25 border border-blue-500/20 rounded shadow-[0_0_8px_rgba(59,130,246,0.15)] z-0"
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      ></div>
                      
                      {/* Current marker dot indicator */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -ml-1 transition-all duration-500 z-10"
                        style={{ left: `${currentPct}%` }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-white ring-2 ring-lime-400 border border-zinc-950 shadow-[0_0_10px_#a3e635]"></div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="flex justify-between text-[7px] font-mono text-zinc-500 uppercase font-bold">
                <span>0g</span>
                <span className="text-blue-400 font-sans font-extrabold tracking-widest text-[7.5px]">★ PROTEIN SWEET SPOT</span>
                <span>220g</span>
              </div>
            </div>

            {avgProteinValue < proteinMin ? (
              <div className="bg-rose-500/5 border border-rose-500/10 p-2 rounded-xl text-[9px] text-rose-450 leading-relaxed text-rose-400 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-rose-400 animate-pulse shrink-0" />
                <span>Below lean body protection trigger. Adjust protein logs.</span>
              </div>
            ) : (
              <div className="bg-lime-505/5 border border-lime-500/15 p-2 rounded-xl text-[9px] text-lime-400 leading-relaxed font-bold flex items-center gap-1.5 bg-lime-500/5">
                <CheckCircle2 className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                <span>Safeguard active. Nitrogen fibers fully protected from erosion.</span>
              </div>
            )}
          </div>

        </div>



      </div>

      {/* Floating alert component popup toasts */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-2xl max-w-xs flex items-center gap-3"
          >
            <div className="bg-lime-950/20 text-lime-400 p-1.5 rounded-lg border border-lime-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs text-zinc-200 font-bold tracking-wide">{toast}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
