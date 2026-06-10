import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, BarChart, Bar, Cell } from 'recharts';
import { DailyLog, UserProfile } from '../types';
import { Sparkles, TrendingDown, Flame } from 'lucide-react';

interface ChartsProps {
  logs: Record<string, DailyLog>;
  profile: UserProfile;
}

export default function Charts({ logs, profile }: ChartsProps) {
  // Generate data for 30 days
  const chartData = Array.from({ length: 30 }, (_, index) => {
    const dayNum = index + 1;
    
    // Calculate date for this day number
    const startDateObj = new Date(profile.startDate);
    startDateObj.setDate(startDateObj.getDate() + index);
    const dateStr = startDateObj.toISOString().split('T')[0];
    
    const log = logs[dateStr];
    
    const caloriesIn = log ? log.foodItems.reduce((acc, curr) => acc + curr.calories, 0) : 0;
    const caloriesOut = log
      ? (log.activityChoice === 'manual_total' && log.totalCaloriesOut !== undefined
          ? log.totalCaloriesOut
          : (profile.manualBmr + log.activeCalories))
      : 0;
    
    // Burned is Out minus In (Can be negative if user ate more than burned)
    const netDailyBurned = log ? (caloriesOut - caloriesIn) : 0;
    const isLogged = !!log && log.completed;

    return {
      dayLabel: `Day ${dayNum}`,
      dateStr,
      caloriesIn: isLogged ? caloriesIn : null,
      caloriesOut: isLogged ? caloriesOut : null,
      deficit: isLogged ? netDailyBurned : 0,
      isLogged,
    };
  });

  // Calculate cumulative stats
  let totalCumulativeDeficit = 0;
  const processCumulativeData = chartData.map((d) => {
    if (d.isLogged) {
      totalCumulativeDeficit += d.deficit;
    }
    const cumulativeFatLbs = totalCumulativeDeficit / 3500;
    return {
      ...d,
      cumulativeDeficit: totalCumulativeDeficit,
      // Fat burned in lbs. If negative, it is fat gained.
      fatLbs: Number(cumulativeFatLbs.toFixed(2)),
    };
  });

  const lastLoggedDay = [...processCumulativeData].reverse().find(d => d.isLogged);
  const currentTotalFatBurned = lastLoggedDay ? lastLoggedDay.fatLbs : 0;

  // Custom tooltips
  const CustomDeficitTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const deficitValue = data.deficit;
      const isDeficit = deficitValue >= 0;
      
      return (
        <div className="bg-zinc-950 border border-zinc-805 p-3 rounded-lg text-xs leading-none shadow-xl">
          <p className="font-bold text-zinc-300 mb-2">{data.dayLabel} ({data.dateStr})</p>
          <div className="space-y-1 text-[11px]">
            <p className="text-zinc-400">Calories In: <span className="text-white font-mono font-bold">{data.caloriesIn} kcal</span></p>
            <p className="text-zinc-400">Calories Out: <span className="text-white font-mono font-bold">{data.caloriesOut} kcal</span></p>
            <div className="border-t border-zinc-800 my-1 pt-1"></div>
            <p className={isDeficit ? "text-lime-400 font-bold" : "text-rose-400 font-bold"}>
              {isDeficit ? "🔥 Net Deficit:" : "⚠️ Net Surplus:"} {Math.abs(deficitValue)} kcal
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomFatTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const fatLbs = data.fatLbs;
      const isLost = fatLbs >= 0;
      
      return (
        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-xs leading-none shadow-xl">
          <p className="font-bold text-zinc-300 mb-2">{data.dayLabel} Trajectory</p>
          <div className="space-y-1.5 text-[11px]">
            <p className="text-zinc-400">Cumulative Net Deficit: <span className="text-white font-mono font-bold">{data.cumulativeDeficit} kcal</span></p>
            <p className={isLost ? "text-lime-400 font-black" : "text-rose-400 font-black"}>
              {isLost ? "🔥 Fat Burned:" : "⚠️ Fat Gained:"} {Math.abs(fatLbs)} lbs
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Cumulative Fat Burned Trajectory */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-lime-400 uppercase bg-lime-500/10 px-2 py-0.5 rounded">Cumulative</span>
            <h3 className="text-sm font-bold text-white uppercase mt-1">Mathematical Fat Loss Trajectory (lbs)</h3>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-400 block uppercase">Current status</span>
            <span className={`text-xl font-black ${currentTotalFatBurned >= 0 ? "text-lime-400" : "text-rose-400"}`}>
              {currentTotalFatBurned >= 0 ? `-${currentTotalFatBurned} lbs` : `+${Math.abs(currentTotalFatBurned)} lbs`}
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processCumulativeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentTotalFatBurned >= 0 ? "#a3e635" : "#f43f5e"} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={currentTotalFatBurned >= 0 ? "#a3e635" : "#f43f5e"} stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="dayLabel" stroke="#71717a" fontSize={10} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomFatTooltip />} cursor={{ stroke: '#52525b', strokeWidth: 1 }} />
              <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'Baseline', position: 'top', fill: '#ef4444', fontSize: 9 }} />
              <Area 
                type="monotone" 
                dataKey="fatLbs" 
                stroke={currentTotalFatBurned >= 0 ? "#a3e635" : "#f43f5e"} 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorFat)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-[10px] text-zinc-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-lime-400" />
          <span>Fat timeline shows absolute delta in weight. Positive values represent pure fat reduction.</span>
        </div>
      </div>

      {/* Chart 2: Daily Deficit/Surplus Bars */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-lime-400 uppercase bg-lime-500/10 px-2 py-0.5 rounded">Daily Delta</span>
            <h3 className="text-sm font-bold text-white uppercase mt-1">Calorie Deficit or Surplus</h3>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-400 block uppercase">Fat-Eater Ratio</span>
            <span className="text-xs text-zinc-300 font-mono">3,500 kcal = 1 lb fat</span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="dayLabel" stroke="#71717a" fontSize={10} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomDeficitTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <ReferenceLine y={0} stroke="#52525b" />
              <Bar 
                dataKey="deficit" 
              >
                {chartData.map((entry, idx) => {
                  const isDeficit = entry.deficit >= 0;
                  return (
                    <Cell 
                      key={`cell-${idx}`}
                      fill={isDeficit ? "#a3e635" : "#f43f5e"}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 text-[10px] text-zinc-400 flex items-center gap-1.5 justify-start">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-lime-400"></div>
            <span className="mr-3">Deficit (Fat Burned)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <span>Surplus (Fat Gained)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
