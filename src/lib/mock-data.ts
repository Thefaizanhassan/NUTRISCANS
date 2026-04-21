import { ScanResult, DailyGoal, UserProfile, DailySummary, NutritionData } from '@/types';
import { subDays, format } from 'date-fns';

export const MOCK_DAILY_GOALS: DailyGoal = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65,
  fibre: 30,
};

export const MOCK_USER: UserProfile = {
  id: 'user_123',
  name: 'Faizan',
  dailyGoals: MOCK_DAILY_GOALS,
  dietaryPreferences: ['High Protein', 'Low Sugar'],
  createdAt: new Date('2024-01-01'),
};

const emptyNutrition: NutritionData = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fibre: 0,
  sugar: 0,
  sodium: 0,
  saturatedFat: 0,
};

export const MOCK_SCANS: ScanResult[] = [
  {
    id: 'scan_1',
    imageUrl: 'https://picsum.photos/seed/chicken/600/400',
    contextText: 'Homemade dinner',
    mealType: 'dinner',
    timestamp: new Date(),
    modelUsed: 'gemini-2.0-flash',
    overallConfidence: 95,
    foodItems: [
      {
        id: 'item_1',
        name: 'Grilled chicken breast',
        portionSize: '200g',
        confidence: 98,
        nutrition: {
          calories: 330,
          protein: 62,
          carbs: 0,
          fat: 7,
          fibre: 0,
          sugar: 0,
          sodium: 150,
          saturatedFat: 2,
        },
      },
      {
        id: 'item_2',
        name: 'Brown rice',
        portionSize: '150g',
        confidence: 95,
        nutrition: {
          calories: 170,
          protein: 4,
          carbs: 35,
          fat: 1.5,
          fibre: 3,
          sugar: 0.5,
          sodium: 5,
          saturatedFat: 0.3,
        },
      },
      {
        id: 'item_3',
        name: 'Steamed broccoli and carrots',
        portionSize: '100g',
        confidence: 92,
        nutrition: {
          calories: 45,
          protein: 3,
          carbs: 9,
          fat: 0.5,
          fibre: 4,
          sugar: 3,
          sodium: 40,
          saturatedFat: 0.1,
        },
      },
    ],
    totalNutrition: {
      calories: 545,
      protein: 69,
      carbs: 44,
      fat: 9,
      fibre: 7,
      sugar: 3.5,
      sodium: 195,
      saturatedFat: 2.4,
    },
  },
  {
    id: 'scan_2',
    imageUrl: 'https://picsum.photos/seed/toast/600/400',
    mealType: 'breakfast',
    timestamp: new Date(),
    modelUsed: 'gemini-2.0-flash',
    overallConfidence: 92,
    foodItems: [
      {
        id: 'item_4',
        name: 'Avocado toast with eggs',
        portionSize: '2 slices',
        confidence: 94,
        nutrition: {
          calories: 480,
          protein: 22,
          carbs: 38,
          fat: 28,
          fibre: 12,
          sugar: 4,
          sodium: 450,
          saturatedFat: 6,
        },
      },
    ],
    totalNutrition: {
      calories: 480,
      protein: 22,
      carbs: 38,
      fat: 28,
      fibre: 12,
      sugar: 4,
      sodium: 450,
      saturatedFat: 6,
    },
  },
  {
    id: 'scan_3',
    imageUrl: 'https://picsum.photos/seed/yogurt/600/400',
    mealType: 'snack',
    timestamp: new Date(),
    modelUsed: 'gemini-2.0-flash',
    overallConfidence: 96,
    foodItems: [
      {
        id: 'item_5',
        name: 'Greek yogurt with berries and granola',
        portionSize: '250g',
        confidence: 97,
        nutrition: {
          calories: 320,
          protein: 18,
          carbs: 45,
          fat: 8,
          fibre: 5,
          sugar: 18,
          sodium: 80,
          saturatedFat: 3,
        },
      },
    ],
    totalNutrition: {
      calories: 320,
      protein: 18,
      carbs: 45,
      fat: 8,
      fibre: 5,
      sugar: 18,
      sodium: 80,
      saturatedFat: 3,
    },
  },
  {
    id: 'scan_4',
    imageUrl: 'https://picsum.photos/seed/poke/600/400',
    mealType: 'lunch',
    timestamp: new Date(),
    modelUsed: 'gemini-2.0-flash',
    overallConfidence: 89,
    foodItems: [
      {
        id: 'item_6',
        name: 'Salmon poke bowl',
        portionSize: '450g',
        confidence: 90,
        nutrition: {
          calories: 650,
          protein: 35,
          carbs: 75,
          fat: 22,
          fibre: 8,
          sugar: 12,
          sodium: 950,
          saturatedFat: 4,
        },
      },
    ],
    totalNutrition: {
      calories: 650,
      protein: 35,
      carbs: 75,
      fat: 22,
      fibre: 8,
      sugar: 12,
      sodium: 950,
      saturatedFat: 4,
    },
  },
  {
    id: 'scan_5',
    imageUrl: 'https://picsum.photos/seed/pasta/600/400',
    mealType: 'dinner',
    timestamp: new Date(),
    modelUsed: 'gemini-2.0-flash',
    overallConfidence: 94,
    foodItems: [
      {
        id: 'item_7',
        name: 'Pasta with marinara sauce',
        portionSize: '300g',
        confidence: 95,
        nutrition: {
          calories: 420,
          protein: 12,
          carbs: 78,
          fat: 6,
          fibre: 6,
          sugar: 8,
          sodium: 550,
          saturatedFat: 1,
        },
      },
    ],
    totalNutrition: {
      calories: 420,
      protein: 12,
      carbs: 78,
      fat: 6,
      fibre: 6,
      sugar: 8,
      sodium: 550,
      saturatedFat: 1,
    },
  },
];

export const MOCK_WEEKLY_DATA: DailySummary[] = Array.from({ length: 7 }).map((_, i) => {
  const date = subDays(new Date(), i);
  const dateStr = format(date, 'yyyy-MM-dd');
  
  // Randomize daily nutrition around the goals
  const totalNutrition: NutritionData = {
    calories: Math.floor(MOCK_DAILY_GOALS.calories * (0.85 + Math.random() * 0.3)),
    protein: Math.floor(MOCK_DAILY_GOALS.protein * (0.7 + Math.random() * 0.4)),
    carbs: Math.floor(MOCK_DAILY_GOALS.carbs * (0.8 + Math.random() * 0.3)),
    fat: Math.floor(MOCK_DAILY_GOALS.fat * (0.8 + Math.random() * 0.4)),
    fibre: Math.floor(MOCK_DAILY_GOALS.fibre * (0.6 + Math.random() * 0.6)),
    sugar: 25 + Math.floor(Math.random() * 40),
    sodium: 1500 + Math.floor(Math.random() * 1500),
    saturatedFat: 10 + Math.floor(Math.random() * 15),
  };

  return {
    date: dateStr,
    scans: MOCK_SCANS.slice(0, 2 + Math.floor(Math.random() * 3)),
    totalNutrition,
    goalProgress: {
      calories: Math.min(100, Math.round((totalNutrition.calories / MOCK_DAILY_GOALS.calories) * 100)),
      protein: Math.min(100, Math.round((totalNutrition.protein / MOCK_DAILY_GOALS.protein) * 100)),
      carbs: Math.min(100, Math.round((totalNutrition.carbs / MOCK_DAILY_GOALS.carbs) * 100)),
      fat: Math.min(100, Math.round((totalNutrition.fat / MOCK_DAILY_GOALS.fat) * 100)),
      fibre: Math.min(100, Math.round((totalNutrition.fibre / MOCK_DAILY_GOALS.fibre) * 100)),
    },
  };
});
