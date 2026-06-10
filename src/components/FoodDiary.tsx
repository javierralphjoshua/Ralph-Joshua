import React, { useState, useRef } from 'react';
import { FoodLogItem } from '../types';
import { Plus, Trash2, Camera, BrainCircuit, Check, Loader2, Upload, AlertCircle, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FoodDiaryProps {
  foodItems: FoodLogItem[];
  onAddFood: (item: Omit<FoodLogItem, 'id'>) => void;
  onRemoveFood: (id: string) => void;
  isCompleted?: boolean;
  proteinGoal?: number;
}

export default function FoodDiary({ foodItems, onAddFood, onRemoveFood, isCompleted = false, proteinGoal = 150 }: FoodDiaryProps) {
  // Current active category being logged
  const [loggingMealType, setLoggingMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | null>(null);
  const [addMode, setAddMode] = useState<'ai' | 'manual'>('ai');

  // Manual Entry Form State
  const [manualName, setManualName] = useState('');
  const [manualCal, setManualCal] = useState<number | ''>('');
  const [manualProtein, setManualProtein] = useState<number | ''>('');
  const [manualCarbs, setManualCarbs] = useState<number | ''>('');
  const [manualFat, setManualFat] = useState<number | ''>('');

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Totals for active day
  const totalCalories = foodItems.reduce((acc, curr) => acc + curr.calories, 0);
  const totalProtein = foodItems.reduce((acc, curr) => acc + (curr.protein || 0), 0);
  const totalCarbs = foodItems.reduce((acc, curr) => acc + (curr.carbs || 0), 0);
  const totalFat = foodItems.reduce((acc, curr) => acc + (curr.fat || 0), 0);

  // Filter food items by category
  const breakfastItems = foodItems.filter(item => item.mealType === 'breakfast');
  const lunchItems = foodItems.filter(item => item.mealType === 'lunch');
  const dinnerItems = foodItems.filter(item => item.mealType === 'dinner');
  const snackItems = foodItems.filter(item => !item.mealType || item.mealType === 'snack');

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || manualCal === '' || !loggingMealType) return;

    onAddFood({
      name: manualName,
      calories: Number(manualCal),
      protein: manualProtein !== '' ? Number(manualProtein) : undefined,
      carbs: manualCarbs !== '' ? Number(manualCarbs) : undefined,
      fat: manualFat !== '' ? Number(manualFat) : undefined,
      mealType: loggingMealType,
    });

    // Reset Form & Close
    setManualName('');
    setManualCal('');
    setManualProtein('');
    setManualCarbs('');
    setManualFat('');
    setLoggingMealType(null);
  };

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setAiError(null);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // call server-side Gemini estimator
  const handleAiEstimate = async () => {
    if (!aiPrompt.trim() && !imageFile) {
      setAiError('Please enter a description or upload a food photo first.');
      return;
    }

    setIsAiLoading(true);
    setAiError(null);
    setAiResult(null);

    try {
      let base64String = '';
      let mimeType = '';

      if (imageFile) {
        base64String = await fileToBase64(imageFile);
        mimeType = imageFile.type;
      }

      const response = await fetch('/api/estimate-calories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          textDescription: aiPrompt.trim(),
          imageData: base64String || undefined,
          imageMimeType: mimeType || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server error estimating calories');
      }

      setAiResult(data);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Connection failed. Please check internet.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAcceptAiResult = () => {
    if (!aiResult || !loggingMealType) return;

    onAddFood({
      name: aiResult.itemName,
      calories: aiResult.calories,
      protein: aiResult.protein,
      carbs: aiResult.carbs,
      fat: aiResult.fat,
      mealType: loggingMealType,
    });

    // Reset AI panel & Close
    setAiPrompt('');
    setAiResult(null);
    handleRemoveImage();
    setLoggingMealType(null);
  };

  const getMealCategoryIcon = (type: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    switch (type) {
      case 'breakfast': return '🍳';
      case 'lunch': return '☀️';
      case 'dinner': return '🥩';
      case 'snack': return '🍪';
    }
  };

  const renderCategoryBlock = (
    title: string,
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    items: FoodLogItem[]
  ) => {
    const categoryCalTotal = items.reduce((acc, curr) => acc + curr.calories, 0);
    const categoryProteinTotal = items.reduce((acc, curr) => acc + (curr.protein || 0), 0);

    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm" id={`category-${type}`}>
        {/* Category Header */}
        <div className="bg-zinc-950/60 border-b border-zinc-850 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getMealCategoryIcon(type)}</span>
            <span className="text-xs font-black uppercase text-white tracking-wider">{title}</span>
            {items.length > 0 && (
              <span className="text-[10px] bg-zinc-850 text-zinc-400 px-1.5 py-0.5 rounded font-mono font-medium">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right font-mono text-xs">
              <span className="text-zinc-400 font-bold">{categoryCalTotal}</span> <span className="text-[10px] text-zinc-500">kcal</span>
              {categoryProteinTotal > 0 && (
                <span className="text-lime-400 text-[10px] font-bold ml-2">({categoryProteinTotal}g P)</span>
              )}
            </div>
            {!isCompleted && (
              <button
                type="button"
                onClick={() => {
                  setLoggingMealType(type);
                  setAddMode('ai');
                }}
                className="bg-lime-400 hover:bg-lime-300 text-zinc-950 p-1.5 rounded-lg transition shadow-sm hover:scale-105 active:scale-95"
                title={`Add food item to ${title}`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            )}
          </div>
        </div>

        {/* Category Items List */}
        <div className="p-3 space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-4 text-[11px] text-zinc-500 font-medium">
              No items logged for {title.toLowerCase()}.
            </div>
          ) : (
            <div className="space-y-1.5">
              {items.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-zinc-950/40 border border-zinc-850 hover:border-zinc-800 px-3 py-2 rounded-lg flex items-center justify-between transition group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-200 truncate">{item.name}</p>
                    <p className="text-[9px] text-zinc-500 font-mono mt-0.5">
                      {item.protein || 0}g Pro / {item.carbs || 0}g Carb / {item.fat || 0}g Fat
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-xs font-black text-lime-400 font-mono">+{item.calories} cal</span>
                    {!isCompleted && (
                      <button
                        onClick={() => onRemoveFood(item.id)}
                        className="text-zinc-600 hover:text-rose-400 p-1 rounded hover:bg-zinc-900 transition"
                        title="Remove meal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inline bottom category CTA to match MyFitnessPal row additions */}
          {!isCompleted && (
            <button
              onClick={() => {
                setLoggingMealType(type);
                setAddMode('ai');
              }}
              className="w-full text-center py-1.5 mt-1 border border-zinc-800 hover:border-zinc-700/80 border-dashed rounded-lg text-[10px] uppercase font-bold text-zinc-400 hover:text-white transition flex items-center justify-center gap-1 cursor-pointer bg-zinc-950/20"
            >
              <Plus className="w-3 h-3 text-lime-400" />
              <span>Put {title} +</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {isCompleted && (
        <div className="bg-lime-500/10 border border-lime-500/20 text-lime-400 px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs">
          <AlertCircle className="w-3.5 h-3.5 text-lime-400 shrink-0" />
          <span>This day has been completed and locked. You can view all metrics here, but food logging is read-only. Re-open this day below to modify.</span>
        </div>
      )}

      {/* 1. Header Aggregates */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row gap-5 items-stretch sm:items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">Day Total Intake (Calories In)</span>
          <h4 className="text-2xl font-black text-white font-mono mt-0.5">{totalCalories} <span className="text-xs font-bold text-zinc-400">kcal</span></h4>
        </div>

        {/* Protein target bar */}
        <div className="flex-1 max-w-xs border-t sm:border-t-0 sm:border-l border-zinc-900 pt-3 sm:pt-0 sm:pl-4 flex flex-col justify-center">
          <div className="flex justify-between items-center mb-1 text-[10px]">
            <span className="text-zinc-500 uppercase font-black">Protein Target Goal</span>
            <span className="font-mono text-zinc-300">
              <span className={`font-bold ${totalProtein >= proteinGoal ? 'text-lime-400' : 'text-zinc-400'}`}>{totalProtein}g</span> / {proteinGoal}g
            </span>
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${totalProtein >= proteinGoal ? 'bg-lime-400' : 'bg-lime-400/50'}`}
              style={{ width: `${Math.min(100, (totalProtein / proteinGoal) * 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="flex gap-4 text-xs font-mono border-t sm:border-t-0 sm:border-l border-zinc-900 pt-3 sm:pt-0 sm:pl-4 justify-around items-center">
          <div className="text-center">
            <span className="text-[#a3e635] block text-[9px] uppercase font-bold">Protein</span>
            <span className="text-white font-bold block mt-0.5">{totalProtein}g</span>
          </div>
          <div className="text-center">
            <span className="text-amber-500 block text-[9px] uppercase font-semibold">Carbs</span>
            <span className="text-zinc-300 font-medium block mt-0.5">{totalCarbs}g</span>
          </div>
          <div className="text-center">
            <span className="text-red-500 block text-[9px] uppercase font-semibold">Fats</span>
            <span className="text-zinc-300 font-medium block mt-0.5">{totalFat}g</span>
          </div>
        </div>
      </div>

      {/* 2. MyFitnessPal Styled Four Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {renderCategoryBlock('Breakfast', 'breakfast', breakfastItems)}
        {renderCategoryBlock('Lunch', 'lunch', lunchItems)}
        {renderCategoryBlock('Dinner', 'dinner', dinnerItems)}
        {renderCategoryBlock('Snacks', 'snack', snackItems)}
      </div>

      {/* 3. Add Meal Overlay Dialog Modal */}
      <AnimatePresence>
        {loggingMealType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4"
              id="add-meal-modal"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setLoggingMealType(null);
                  setAiResult(null);
                  handleRemoveImage();
                }}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 p-1.5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title Header with Category badge */}
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{getMealCategoryIcon(loggingMealType)}</span>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Add food to {loggingMealType}
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-medium">Log ingredients or physical servings in your diary</p>
                </div>
              </div>

              {/* Toggle Tab */}
              <div className="flex bg-zinc-900/60 p-1 rounded-xl border border-zinc-900 gap-1">
                <button
                  type="button"
                  onClick={() => setAddMode('ai')}
                  className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-lg transition flex items-center justify-center gap-1.5 ${
                    addMode === 'ai' ? 'bg-lime-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span>Gemini AI nutrition</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('manual')}
                  className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-lg transition flex items-center justify-center gap-1.5 ${
                    addMode === 'manual' ? 'bg-lime-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Manual Input</span>
                </button>
              </div>

              {/* Tab 1: AI Smart Estimator */}
              {addMode === 'ai' && (
                <div className="space-y-4">
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Describe what you ate or snap/upload a food photograph. Gemini AI analyzes calorie count and macros instantly!
                  </p>

                  <div className="space-y-3">
                    {/* Picture Selector */}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      {!imagePreview ? (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-750 transition rounded-xl p-3 flex flex-col items-center justify-center gap-1 border-dashed text-xs text-zinc-400 hover:text-white"
                        >
                          <Camera className="w-4 h-4 text-lime-400" />
                          <span>Attach food picture (Optional)</span>
                        </button>
                      ) : (
                        <div className="bg-zinc-900 p-2 rounded-xl flex items-center justify-between gap-3 border border-zinc-800">
                          <img 
                            src={imagePreview} 
                            alt="Food preview" 
                            className="w-10 h-10 rounded-lg object-cover border border-zinc-800"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{imageFile?.name}</p>
                            <p className="text-[9px] text-zinc-500 uppercase font-bold font-mono">Image loaded</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="text-xs bg-zinc-850 hover:bg-zinc-800 text-zinc-300 px-2 py-1 rounded-lg"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Text Field */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
                        Describe portion contents
                      </label>
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Describe your meal in detail. You can enter multiple items on separate lines, e.g.:&#13;- 2 scrambled eggs&#13;- 1 slice of whole wheat toast with half an avocado"
                        rows={4}
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-lime-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition resize-y placeholder-zinc-650 min-h-[100px]"
                      />
                    </div>

                    {aiError && (
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg flex items-start gap-2 text-xs">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{aiError}</span>
                      </div>
                    )}

                    <AnimatePresence>
                      {aiResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="bg-zinc-900 border border-lime-500/20 p-4 rounded-xl space-y-4"
                        >
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-lime-400 flex items-center gap-1 mb-2">
                              <Sparkles className="w-3 h-3 text-lime-400" />
                              <span>Gemini AI Estimation</span>
                            </span>
                            <p className="text-[10px] text-zinc-400 leading-relaxed italic mb-1">{aiResult.description}</p>
                            <span className="text-[9px] text-zinc-500 italic block">✏️ You can manually adjust the values below before logging!</span>
                          </div>

                          {/* Editable Meal Name & Calories */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                              <label className="block text-[9px] text-zinc-500 uppercase font-bold mb-1">Adjust Name</label>
                              <input
                                type="text"
                                value={aiResult.itemName}
                                onChange={(e) => setAiResult({ ...aiResult, itemName: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-805 text-xs text-white font-bold rounded-lg px-2.5 py-1.5 focus:border-lime-400 focus:outline-none transition font-sans"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-zinc-500 uppercase font-bold mb-1 text-center">Calories</label>
                              <input
                                type="number"
                                min="0"
                                value={aiResult.calories}
                                onChange={(e) => setAiResult({ ...aiResult, calories: parseInt(e.target.value) || 0 })}
                                className="w-full bg-zinc-950 border border-zinc-805 text-xs text-lime-400 font-extrabold text-center font-mono rounded-lg px-2 py-1.5 focus:border-lime-400 focus:outline-none transition"
                              />
                            </div>
                          </div>

                          {/* Editable Macros Grid */}
                          <div>
                            <span className="block text-[9px] text-zinc-500 uppercase font-bold mb-1">Estimated Macronutrients</span>
                            <div className="grid grid-cols-3 gap-2 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-900 text-center font-mono text-xs">
                              <div>
                                <span className="block text-[9px] text-zinc-500 uppercase font-sans mb-1">Protein (g)</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={aiResult.protein}
                                  onChange={(e) => setAiResult({ ...aiResult, protein: parseInt(e.target.value) || 0 })}
                                  className="w-full bg-zinc-900 border border-zinc-805 focus:border-lime-500 rounded-md py-1 text-center text-white font-mono text-xs focus:outline-none"
                                />
                              </div>
                              <div>
                                <span className="block text-[9px] text-zinc-500 uppercase font-sans mb-1">Carbs (g)</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={aiResult.carbs}
                                  onChange={(e) => setAiResult({ ...aiResult, carbs: parseInt(e.target.value) || 0 })}
                                  className="w-full bg-zinc-900 border border-zinc-805 focus:border-lime-500 rounded-md py-1 text-center text-white font-mono text-xs focus:outline-none"
                                />
                              </div>
                              <div>
                                <span className="block text-[9px] text-zinc-500 uppercase font-sans mb-1">Fat (g)</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={aiResult.fat}
                                  onChange={(e) => setAiResult({ ...aiResult, fat: parseInt(e.target.value) || 0 })}
                                  className="w-full bg-zinc-900 border border-zinc-805 focus:border-lime-500 rounded-md py-1 text-center text-white font-mono text-xs focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Action Button Grid */}
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setAiResult(null)}
                              className="flex-1 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-850 font-bold uppercase py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>Discard</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleAcceptAiResult}
                              className="flex-[2] bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black tracking-wider uppercase py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Log AI Estimate</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {!aiResult && (
                    <button
                      type="button"
                      disabled={isAiLoading}
                      onClick={handleAiEstimate}
                      className="w-full bg-lime-500/10 hover:bg-lime-500/20 text-lime-400 font-extrabold tracking-wider uppercase py-3 rounded-xl text-xs transition border border-lime-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isAiLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-lime-400" />
                          <span>Gemini is Estimating...</span>
                        </>
                      ) : (
                        <>
                          <BrainCircuit className="w-4 h-4" />
                          <span>Analyze with Gemini</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Tab 2: Manual Entry Form */}
              {addMode === 'manual' && (
                <form onSubmit={handleAddManual} className="space-y-3.5">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] text-zinc-400 uppercase font-bold mb-1">Meal Name</label>
                      <input
                        type="text"
                        required
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        placeholder="e.g. Scrambled Eggs"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-lime-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase font-bold mb-1 text-center">Calories</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={manualCal}
                        onChange={(e) => setManualCal(e.target.value !== '' ? parseInt(e.target.value) || 0 : '')}
                        placeholder="kcal"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-lime-500 rounded-lg px-3 py-2 text-xs text-white text-center font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-zinc-900 pt-3">
                    <div>
                      <label className="block text-[9px] text-zinc-500 uppercase font-semibold mb-0.5 text-center">Protein (g)</label>
                      <input
                        type="number"
                        min="0"
                        value={manualProtein}
                        onChange={(e) => setManualProtein(e.target.value !== '' ? parseInt(e.target.value) || 0 : '')}
                        placeholder="0"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-lime-500 rounded-lg px-2 py-1.5 text-xs text-white text-center font-mono focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-zinc-500 uppercase font-semibold mb-0.5 text-center">Carbs (g)</label>
                      <input
                        type="number"
                        min="0"
                        value={manualCarbs}
                        onChange={(e) => setManualCarbs(e.target.value !== '' ? parseInt(e.target.value) || 0 : '')}
                        placeholder="0"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-lime-500 rounded-lg px-2 py-1.5 text-xs text-white text-center font-mono focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-zinc-500 uppercase font-semibold mb-0.5 text-center">Fat (g)</label>
                      <input
                        type="number"
                        min="0"
                        value={manualFat}
                        onChange={(e) => setManualFat(e.target.value !== '' ? parseInt(e.target.value) || 0 : '')}
                        placeholder="0"
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-lime-500 rounded-lg px-2 py-1.5 text-xs text-white text-center font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black tracking-wider uppercase py-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Add Meal to Diary</span>
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
