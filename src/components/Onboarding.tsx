import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { Activity, Calendar, TrendingUp, Camera, Upload, Trash2 } from 'lucide-react';

interface OnboardingProps {
  onSave: (profile: UserProfile) => void;
  initialProfile?: UserProfile | null;
}

export default function Onboarding({ onSave, initialProfile }: OnboardingProps) {
  const [readIntro, setReadIntro] = useState(initialProfile ? true : false);
  const [name, setName] = useState(initialProfile?.name || '');
  const [age, setAge] = useState<number | ''>(initialProfile?.age ?? 28);
  const [gender, setGender] = useState<'male' | 'female'>(initialProfile?.gender || 'male');
  const [weight, setWeight] = useState<number | ''>(initialProfile?.weight ?? 175);
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>(initialProfile?.weightUnit || 'lbs');
  const [height, setHeight] = useState<number | ''>(initialProfile?.height ?? 175); // cm
  
  const [activityLevel] = useState<UserProfile['activityLevel']>(
    initialProfile?.activityLevel || 'moderate'
  );
  
  const [fatLossGoal, setFatLossGoal] = useState<number | ''>(initialProfile?.fatLossGoal ?? 6);
  const [startDate, setStartDate] = useState(
    initialProfile?.startDate || new Date().toISOString().split('T')[0]
  );
  const [day1Photo, setDay1Photo] = useState<string>(initialProfile?.day1Photo || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto calculated BMR preview
  const calculateBmrValue = (): number => {
    const wNum = weight === '' ? 70 : weight;
    const hNum = height === '' ? 170 : height;
    const aNum = age === '' ? 30 : age;
    const wKg = weightUnit === 'lbs' ? wNum * 0.45359237 : wNum;
    if (gender === 'male') {
      return Math.round(88.362 + 13.397 * wKg + 4.799 * hNum - 5.677 * aNum);
    } else {
      return Math.round(447.593 + 9.247 * wKg + 3.098 * hNum - 4.330 * aNum);
    }
  };

  const calculatedBmr = calculateBmrValue();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setDay1Photo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalAge = age === '' ? 28 : Number(age);
    const finalWeight = weight === '' ? 175 : Number(weight);
    const finalHeight = height === '' ? 175 : Number(height);
    const finalFatLossGoal = fatLossGoal === '' ? 6 : Number(fatLossGoal);

    onSave({
      name: name.trim(),
      age: finalAge,
      gender,
      weight: finalWeight,
      weightUnit,
      height: finalHeight,
      waist: 0,
      waistUnit: 'inches',
      activityLevel,
      bmrPreference: 'auto',
      manualBmr: calculatedBmr,
      startDate,
      fatLossGoal: finalFatLossGoal,
      day1Photo: day1Photo || undefined,
    });
  };

  // End Date is 30 days later (inclusive of start date, so add 29 days)
  const getEndDate = () => {
    if (!startDate) return '';
    const d = new Date(startDate);
    d.setDate(d.getDate() + 29);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!readIntro) {
    return (
      <div className="max-w-xl mx-auto bg-black border border-zinc-850 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden" id="onboarding-intro-container">
        {/* Subtle radial gradients */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-lime-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative space-y-6">
          <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-4">
            <div className="bg-lime-400 p-2 rounded-xl text-zinc-950 font-black flex items-center justify-center shadow-[0_0_15px_rgba(163,230,53,0.3)]">
              <Activity className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white leading-none tracking-tight uppercase">Ragnar’s 30 Days Challenge</h1>
              <span className="text-xs text-lime-400 font-semibold block mt-1 tracking-wider uppercase">Fat loss is just Math</span>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-black text-white uppercase tracking-tight">
              📊 Tracking Calories is just Math
            </h2>
            <p className="text-zinc-300 text-sm leading-relaxed">
              In 30 days, challenge yourself to lose fats by tracking your calories in and out.
            </p>
            <p className="text-zinc-400 text-xs leading-relaxed">
              By logging your meals and workouts consistently, you make your progress fully clear, simple, and guaranteed.
            </p>
          </div>

          <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-black tracking-widest text-[#a3e635] uppercase">
              What we are tracking in this challenge:
            </h3>
            
            <div className="space-y-4 text-xs text-zinc-400">
              <div className="flex items-start gap-3">
                <span className="bg-lime-400 text-zinc-950 font-black h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-[10px] mt-0.5">1</span>
                <div>
                  <strong className="text-white block font-sans font-bold">Calories In (Daily Intake)</strong>
                  <span>Keep track of your physical meals, snacks, and protein intake to make sure you stay beneath your target budget limit.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="bg-lime-400 text-zinc-950 font-black h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-[10px] mt-0.5">2</span>
                <div>
                  <strong className="text-white block font-sans font-bold">Calories Out (Daily Output)</strong>
                  <span>Establish your active burned values and specific workouts. Added effort ensures consistent energy depletion.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="bg-lime-400 text-zinc-950 font-black h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-[10px] mt-0.5">3</span>
                <div>
                  <strong className="text-white block font-sans font-bold">Performance Ratings & Adherence</strong>
                  <span>Review automated calorie deficit and protein ratings to receive a daily grade for fat loss results and muscle safety.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-zinc-400 bg-zinc-900/10 border border-zinc-900 p-3 rounded-lg leading-snug">
            🚀 <strong>COMMITMENT TO SUCCESS:</strong> This simple dashboard is built for strict focus. Commit to logging your details daily, and see your physical results.
          </div>

          <button
            type="button"
            onClick={() => setReadIntro(true)}
            className="w-full bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black tracking-widest uppercase py-4 rounded-xl transition duration-150 transform hover:scale-[1.01] active:scale-[0.99] text-xs flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(163,230,53,0.15)] cursor-pointer"
          >
            <span>Start Now</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-black border border-zinc-850 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden" id="onboarding-form-container">
      {/* Visual neon background flourish */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-lime-500/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>
      
      <div className="text-center mb-8 relative">
        <h1 className="text-3xl font-black tracking-tight text-white uppercase sm:text-4xl">
          Ragnar’s 30 Days Challenge
        </h1>
        <p className="text-lime-400 text-xs mt-1 font-semibold tracking-wider uppercase">
          Fat loss is just Math
        </p>
      </div>

      <form onSubmit={handleStart} className="space-y-6 relative">
        {/* Section 1: Demographics */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-lime-400 border-b border-zinc-900 pb-1">
            1. Personal Bio & Metrics
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-405 uppercase mb-1.5">
                Challenger Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex"
                className="w-full bg-zinc-950 border border-zinc-900 focus:border-lime-400 rounded-xl px-4 py-3 text-white focus:outline-none transition text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-405 uppercase mb-1.5">
                  Age
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-900 focus:border-lime-400 rounded-xl px-4 py-3 text-white text-center focus:outline-none transition text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-405 uppercase mb-1.5">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                  className="w-full bg-zinc-950 border border-zinc-900 focus:border-lime-400 rounded-xl px-3 py-3 text-white focus:outline-none transition text-sm"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Weight */}
            <div>
              <label className="block text-xs font-semibold text-zinc-405 uppercase mb-1.5">
                Current Weight
              </label>
              <div className="flex bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden focus-within:border-lime-400 transition">
                <input
                  type="number"
                  step="0.1"
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent px-3 py-3 text-white text-center focus:outline-none text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setWeightUnit(weightUnit === 'lbs' ? 'kg' : 'lbs')}
                  className="bg-zinc-900 text-zinc-400 font-bold text-xs px-3 hover:bg-zinc-800 transition"
                >
                  {weightUnit}
                </button>
              </div>
            </div>

            {/* Height */}
            <div>
              <label className="block text-xs font-semibold text-zinc-405 uppercase mb-1.5">
                Height (cm)
              </label>
              <input
                type="number"
                required
                value={height}
                onChange={(e) => setHeight(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-900 focus:border-lime-400 rounded-xl px-4 py-3 text-white text-center focus:outline-none transition text-sm font-mono"
              />
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 font-bold uppercase">Estimated Daily Basal Metabolic Rate (BMR)</p>
              <p className="text-[10px] text-zinc-500">Auto calculated based on biological formulas</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-lime-400 font-mono">{calculatedBmr} <span className="text-xs font-medium text-zinc-500">kcal</span></div>
            </div>
          </div>
        </div>

        {/* Section 2: Progress Picture */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-lime-400 border-b border-zinc-900 pb-1">
            2. Day 1 Progress Photo
          </h3>
          
          <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl space-y-4">
            <div className="flex items-center gap-3 bg-lime-950/10 border border-lime-500/20 rounded-xl px-3 py-2 text-lime-400 text-xs">
              <Camera className="w-4 h-4 shrink-0 text-lime-400" />
              <span>📸 Compare visual body composition side-by-side with your Day 1 starting photo!</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="w-32 h-32 bg-zinc-900 border border-zinc-850 rounded-xl overflow-hidden shrink-0 flex items-center justify-center relative">
                {day1Photo ? (
                  <>
                    <img src={day1Photo} alt="Day 1 Progress" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setDay1Photo('')}
                      className="absolute top-1.5 right-1.5 bg-zinc-950/80 hover:bg-rose-500/85 text-white p-1 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-2 text-zinc-650">
                    <Camera className="w-8 h-8 mx-auto stroke-1" />
                    <span className="text-[9px] mt-1 block uppercase tracking-wider">No Photo</span>
                  </div>
                )}
              </div>

              <div className="flex-1 w-full space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-xs font-bold"
                >
                  <Upload className="w-4 h-4 text-lime-400" />
                  <span>Upload Day 1 Photo</span>
                </button>
                <p className="text-[10px] text-zinc-500 text-center sm:text-left">
                  Supports JPG, PNG, WebP format. Saved locally in your browser.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Target Fat Loss Goal */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-lime-400 border-b border-zinc-900 pb-1">
            3. Fat Loss Target
          </h3>

          <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl space-y-4">
            <div>
              <p className="text-xs text-zinc-400 font-bold uppercase mb-2">Pick your difficulty:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFatLossGoal(2)}
                  className={`px-4 py-3 rounded-xl border text-left transition duration-150 relative overflow-hidden cursor-pointer ${
                    fatLossGoal === 2 
                      ? 'border-lime-400 bg-lime-400/5 text-white' 
                      : 'border-zinc-900 bg-zinc-950 hover:border-zinc-800'
                  }`}
                >
                  <p className="text-xs font-bold uppercase text-zinc-500">Easy</p>
                  <p className="text-sm font-black text-white mt-1">2 lbs</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5 leading-tight">lose 2 pounds of fat</p>
                  {fatLossGoal === 2 && (
                    <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse"></div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFatLossGoal(4)}
                  className={`px-4 py-3 rounded-xl border text-left transition duration-150 relative overflow-hidden cursor-pointer ${
                    fatLossGoal === 4 
                      ? 'border-lime-400 bg-lime-400/5 text-white' 
                      : 'border-zinc-900 bg-zinc-950 hover:border-zinc-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold uppercase text-zinc-500">Medium</p>
                    <span className="text-[9px] bg-zinc-900 border border-zinc-850 px-1 py-0.2 rounded font-black text-lime-400 tracking-tight">Best</span>
                  </div>
                  <p className="text-sm font-black text-white mt-0.5">4 lbs</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5 leading-tight">lose 4 lbs (recommended)</p>
                  {fatLossGoal === 4 && (
                    <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse"></div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFatLossGoal(6)}
                  className={`px-4 py-3 rounded-xl border text-left transition duration-150 relative overflow-hidden cursor-pointer ${
                    fatLossGoal === 6 
                      ? 'border-lime-400 bg-lime-400/5 text-white' 
                      : 'border-zinc-900 bg-zinc-950 hover:border-zinc-800'
                  }`}
                >
                  <p className="text-xs font-bold uppercase text-zinc-500">Hard</p>
                  <p className="text-sm font-black text-white mt-1">6 lbs</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5 leading-tight">lose 6 lbs of fat</p>
                  {fatLossGoal === 6 && (
                    <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse"></div>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-900 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-zinc-400 font-bold uppercase">Or decide more. No problem:</p>
                <p className="text-[10px] text-zinc-500">Set any custom pounds of body fat to reduce</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={fatLossGoal}
                  onChange={(e) => setFatLossGoal(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                  className="w-20 bg-zinc-900 border border-zinc-800 focus:border-lime-400 rounded-lg px-2.5 py-1.5 text-white text-center font-bold text-lg font-mono focus:outline-none"
                />
                <span className="text-xs font-black text-[#a3e635] uppercase font-mono">lbs</span>
              </div>
            </div>

            {fatLossGoal !== '' && fatLossGoal > 0 && (
              <div className="text-[11px] text-zinc-400 border-t border-zinc-900 pt-3 leading-normal font-mono space-y-2">
                <div>
                  🔥 Targeted Fat Loss of <span className="text-lime-400 font-bold">{fatLossGoal} lbs</span> = cumulative net deficit of <span className="text-lime-400 font-bold">{(fatLossGoal * 3500).toLocaleString()} kcal</span>. This averages to <span className="text-lime-400 font-bold">{Math.round((fatLossGoal * 3500) / 30)} kcal</span> deficit each day.
                </div>
                <div className="bg-lime-950/20 border border-lime-500/20 rounded-lg p-2.5 text-xs text-lime-400">
                  ⚡ <strong>Estimated calorie intake to reach this goal:</strong> <span className="font-bold underline">{Math.max(800, calculatedBmr - Math.round((fatLossGoal * 3500) / 30))} kcal/day</span> (before adding workouts). Keep food calories eaten around or beneath this baseline to stay on pace!
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Time Setup */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-lime-400 border-b border-zinc-900 pb-1">
            4. Starting Date
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1.5 flex items-center">
                <Calendar className="w-3.5 h-3.5 text-lime-400 mr-1" /> Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 focus:border-lime-400 rounded-xl px-4 py-3 text-white focus:outline-none transition text-sm font-mono"
              />
            </div>

            <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex flex-col justify-center">
              <p className="text-[10px] text-zinc-500 font-bold uppercase">Challenge Ends</p>
              <p className="text-xs text-zinc-350 font-bold mt-1 font-mono">{getEndDate()}</p>
            </div>
          </div>
        </div>

        {/* CTA Launch */}
        <button
          type="submit"
          className="w-full bg-lime-400 hover:bg-lime-350 text-zinc-950 font-black tracking-wider uppercase py-4 rounded-xl transition duration-200 transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 text-sm shadow-[0_0_20px_rgba(163,230,53,0.15)] cursor-pointer"
        >
          <TrendingUp className="w-4 h-4 text-zinc-950 stroke-[3]" />
          <span>START THE MATH JOURNEY</span>
        </button>
      </form>
    </div>
  );
}
