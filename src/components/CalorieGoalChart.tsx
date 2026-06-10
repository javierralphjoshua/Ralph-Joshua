import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Target, HelpCircle, Edit3, Check, RefreshCw } from 'lucide-react';

interface CalorieGoalChartProps {
  caloriesIn: number;
  caloriesOut: number;
  deficitGoal: number;
  customGoal?: number;
  onUpdateCustomGoal: (val: number | undefined) => void;
  isCompleted: boolean;
}

export default function CalorieGoalChart({
  caloriesIn,
  caloriesOut,
  deficitGoal,
  customGoal,
  onUpdateCustomGoal,
  isCompleted,
}: CalorieGoalChartProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState<string>('');

  // Calculated Calorie intake target
  const calculatedGoal = Math.max(1200, caloriesOut - deficitGoal);
  
  // Active target is either the custom manual override or the calculated baseline
  const activeGoal = customGoal !== undefined ? customGoal : calculatedGoal;

  const remaining = activeGoal - caloriesIn;
  const isSurplus = remaining < 0;
  const absoluteRemaining = Math.abs(remaining);

  // Generate Recharts Pie Chart data
  const data = isSurplus
    ? [
        { name: 'Target Intake Budget', value: activeGoal, color: '#a3e635' }, // lime-400
        { name: 'Calorie Surplus', value: absoluteRemaining, color: '#f43f5e' }, // rose-500
      ]
    : [
        { name: 'Logged Intake', value: caloriesIn, color: '#a3e635' }, // lime-400
        { name: 'Remaining Budget', value: Math.max(0, remaining), color: '#27272a' }, // zinc-800
      ];

  const handleEditClick = () => {
    setEditVal(activeGoal.toString());
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    const num = parseInt(editVal);
    if (!isNaN(num) && num > 0) {
      onUpdateCustomGoal(num);
    } else {
      onUpdateCustomGoal(undefined);
    }
    setIsEditing(false);
  };

  const handleResetClick = () => {
    onUpdateCustomGoal(undefined);
    setIsEditing(false);
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4 relative overflow-hidden" id="calorie-budget-card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-900 pb-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-[#a3e635] flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            <span>Daily Intake Budget Target (Calories In)</span>
          </h3>
          <p className="text-[10px] text-zinc-500 mt-1 leading-snug">
            {customGoal !== undefined 
              ? 'Using custom calorie intake target' 
              : `Deficit formula: Outflow (${caloriesOut} kcal) - Target Deficit (${deficitGoal} kcal)`}
          </p>
        </div>

        {/* Goal Calories Input */}
        <div className="flex items-center gap-2 shrink-0">
          {isEditing ? (
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
              <input
                type="number"
                min="500"
                max="10000"
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                className="w-16 bg-transparent text-xs text-white text-center font-bold font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveClick}
                className="p-1 hover:bg-zinc-800 rounded text-lime-400"
                title="Save goal"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </button>
              <button
                type="button"
                onClick={handleResetClick}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400"
                title="Reset to calculated target"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-zinc-900/50 border border-zinc-850 px-2.5 py-1 rounded-lg">
              <span className="text-[10px] text-zinc-400 font-medium select-none">Goal:</span>
              <span className="text-xs font-mono font-black text-white">{activeGoal} kcal</span>
              {!isCompleted && (
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="text-zinc-500 hover:text-white transition p-0.5"
                  title="Modify target calorie budget for today"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        {/* Dynamic Pie Chart Container */}
        <div className="md:col-span-2 flex justify-center h-40 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [`${value} kcal`, 'Value']}
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px' }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Absolute Center Stats */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
            <span className="text-[9px] uppercase font-bold text-zinc-500">Intake</span>
            <span className="text-lg font-black font-mono leading-none text-white mt-0.5">{caloriesIn}</span>
            <span className="text-[9px] text-zinc-400 mt-0.5 font-bold">Of {activeGoal} kcal</span>
          </div>
        </div>

        {/* Detailed Stats & Legend */}
        <div className="md:col-span-3 space-y-3 pl-0 sm:pl-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-900">
              <span className="text-[9px] uppercase font-bold text-zinc-500 block">Logged Intake</span>
              <span className="text-base font-black font-mono text-[#a3e635] mt-1 block">
                {caloriesIn} <span className="text-[10px] font-sans font-normal text-zinc-400">kcal</span>
              </span>
            </div>
            <div className={`p-2.5 rounded-lg border ${isSurplus ? 'bg-rose-950/10 border-rose-900/35' : 'bg-zinc-900/40 border-zinc-900'}`}>
              <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                {isSurplus ? 'Intake Surplus' : 'Remaining Budget'}
              </span>
              <span className={`text-base font-black font-mono mt-1 block ${isSurplus ? 'text-rose-500' : 'text-zinc-300'}`}>
                {absoluteRemaining} <span className="text-[10px] font-sans font-normal text-zinc-400">kcal</span>
              </span>
            </div>
          </div>

          <p className="text-[10px] text-zinc-400 leading-snug">
            {isSurplus ? (
              <span className="text-rose-400 font-medium">
                ⚠️ You have exceeded your target budget limit by <strong className="font-mono">{absoluteRemaining} kcal</strong>. To stay on pace with your fat loss goal, reduce future intakes or execute additional workouts.
              </span>
            ) : (
              <span className="text-zinc-400">
                ✓ You have <strong className="font-mono text-zinc-100">{absoluteRemaining} kcal</strong> remaining of physical food allowance to achieve your daily target today.
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
