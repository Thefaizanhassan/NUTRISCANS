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

export interface FoodItem {
  id: string;
  name: string;
  portionSize: string;
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
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: Date;
  modelUsed: string;
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
  createdAt: Date;
}

export interface DailySummary {
  date: string;
  scans: ScanResult[];
  totalNutrition: NutritionData;
  goalProgress: { [key in keyof DailyGoal]: number };
}
