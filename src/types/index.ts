export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  sugar: number;
  sodium: number;
  saturatedFat: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type UnitSystem = 'metric' | 'imperial';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface FoodItem {
  id: string;
  name: string;
  portionSize: string;
  portionGrams?: number | null;
  nutrition: NutritionData;
  confidence: number;
}

export interface ScanResult {
  id: string;
  imageUrl: string;
  contextText?: string;
  foodItems: FoodItem[];
  totalNutrition: NutritionData;
  overallConfidence: number;
  mealType: MealType;
  timestamp: Date;
  modelUsed: string;
  isManualEntry: boolean;
  processingTimeMs?: number | null;
  rawAiResponse?: Record<string, unknown> | null;
}

export interface DailyGoal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  dailyGoals: DailyGoal;
  dietaryPreferences: string[];
  heightCm?: number | null;
  weightKg?: number | null;
  age?: number | null;
  activityLevel: ActivityLevel;
  unitSystem: UnitSystem;
  themePreference: ThemePreference;
  notificationsDailyReminder: boolean;
  notificationsWeeklySummary: boolean;
  createdAt: Date;
}

export interface DailySummary {
  date: string;
  scans: ScanResult[];
  totalNutrition: NutritionData;
  scanCount: number;
  goalProgress: { [key in keyof DailyGoal]: number };
}
