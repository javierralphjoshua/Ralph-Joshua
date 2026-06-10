export interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female';
  weight: number;
  weightUnit: 'lbs' | 'kg';
  height: number; // in cm
  waist: number;
  waistUnit: 'inches' | 'cm';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'extreme';
  bmrPreference: 'auto' | 'manual';
  manualBmr: number;
  startDate: string; // YYYY-MM-DD
  fatLossGoal: number; // target fat loss goal in lbs
  day1Photo?: string; // Base64 progress image for Day 1
  day30Photo?: string; // Base64 progress image for Day 30
  day1Weight?: number; // actual day 1 starting weight
  day30Weight?: number; // actual day 30 ending weight
}

export interface FoodLogItem {
  id: string;
  name: string;
  calories: number;
  protein?: number; // in grams
  carbs?: number; // in grams
  fat?: number; // in grams
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  dayNumber: number; // 1 to 30
  activeCalories: number; // calculated or manual calories burned
  activityChoice?: 'low' | 'medium' | 'high' | 'manual' | 'manual_total'; // level of workouts
  rating?: 'good_job' | 'pwede_na' | 'failed'; // daily review rating
  foodItems: FoodLogItem[];
  completed: boolean;
  notes?: string;
  notesTitle?: string;
  totalCaloriesOut?: number; // manual override for total calories out including basic BMR
  customCaloriesInGoal?: number; // optional user defined input limit for calorie intake
}

export interface ChallengeState {
  profile: UserProfile | null;
  logs: Record<string, DailyLog>; // Key is YYYY-MM-DD
}
