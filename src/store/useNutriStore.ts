import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { 
  ScanResult, 
  UserProfile, 
  DailyGoal, 
  NutritionData, 
  DailySummary 
} from '@/types'
import { isSameDay, subDays, format } from 'date-fns'
import * as api from '@/lib/supabase/api'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'

interface NutriState {
  scanHistory: ScanResult[]
  currentScan: ScanResult | null
  userProfile: UserProfile | null
  dailyGoals: DailyGoal | null
  isScanning: boolean
  selectedDate: string
  syncStatus: 'synced' | 'syncing' | 'error'
  lastSyncedAt: number | null
  userId: string | null
  
  // Actions
  hydrate: () => Promise<void>
  setUserId: (id: string | null) => void
  addScan: (scan: api.CreateScanInput) => Promise<void>
  deleteScan: (id: string) => Promise<void>
  updateGoals: (goals: DailyGoal) => Promise<void>
  updateProfile: (profile: Partial<UserProfile>, options?: { silent?: boolean }) => Promise<void>
  clearHistory: () => Promise<void>
  signOut: () => Promise<void>
  setCurrentScan: (scan: ScanResult | null) => void
  setScanning: (status: boolean) => void
  setSelectedDate: (date: Date) => void
  resetState: () => void
  
  // Computed (as functions)
  getTodayScans: () => ScanResult[]
  getTodayNutrition: () => NutritionData
  getGoalProgress: () => { [key in keyof DailyGoal]: number }
  getWeeklyData: () => DailySummary[]
  getScansByDate: (date: Date) => ScanResult[]
  getScansByMealType: (type: string) => ScanResult[]
}

export const useNutriStore = create<NutriState>()(
  immer((set, get) => ({
    scanHistory: [],
    currentScan: null,
    userProfile: null,
    dailyGoals: null,
    isScanning: false,
    selectedDate: new Date().toISOString(),
    syncStatus: 'synced',
    lastSyncedAt: null,
    userId: null,

    setUserId: (id) => set((state) => { state.userId = id }),

    resetState: () => set((state) => {
      state.scanHistory = []
      state.currentScan = null
      state.userProfile = null
      state.dailyGoals = null
      state.isScanning = false
      state.selectedDate = new Date().toISOString()
      state.syncStatus = 'synced'
      state.lastSyncedAt = null
      state.userId = null
    }),

    hydrate: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      const userId = user?.id
      
      if (!userId) {
        get().resetState()
        return
      }

      set((state) => { 
        state.userId = userId
        state.syncStatus = 'syncing' 
      })

      try {
        const [profile, history] = await Promise.all([
          api.ensureProfile(user),
          api.getUserScans(userId, { limit: 50 })
        ])

        set((state) => {
          state.userProfile = profile
          state.dailyGoals = profile.dailyGoals
          state.scanHistory = history
          state.syncStatus = 'synced'
          state.lastSyncedAt = Date.now()
        })
      } catch (error) {
        console.error('Hydration failed:', error)
        set((state) => { state.syncStatus = 'error' })
        toast.error('Failed to sync data from cloud')
      }
    },

    addScan: async (scanInput) => {
      const userId = get().userId
      if (!userId) return

      // Optimistic update
      const tempId = crypto.randomUUID()
      const optimisticScan: ScanResult = {
        id: tempId,
        imageUrl: scanInput.imageUrl || '',
        contextText: scanInput.contextText,
        foodItems: scanInput.foodItems.map(item => ({ ...item, id: crypto.randomUUID() })),
        totalNutrition: scanInput.totalNutrition,
        overallConfidence: scanInput.overallConfidence,
        mealType: scanInput.mealType,
        timestamp: new Date(),
        modelUsed: scanInput.modelUsed || 'gemini-1.5-flash',
        isManualEntry: scanInput.isManualEntry || false,
        processingTimeMs: scanInput.processingTimeMs,
        rawAiResponse: scanInput.rawAiResponse ?? null,
      }

      const previousHistory = [...get().scanHistory]
      set((state) => {
        state.scanHistory.unshift(optimisticScan)
        state.syncStatus = 'syncing'
      })

      try {
        const realScan = await api.createScan(scanInput)
        set((state) => {
          const index = state.scanHistory.findIndex(s => s.id === tempId)
          if (index !== -1) state.scanHistory[index] = realScan
          state.syncStatus = 'synced'
          state.lastSyncedAt = Date.now()
        })
        toast.success('Meal saved to cloud')
      } catch (error) {
        set((state) => {
          state.scanHistory = previousHistory
          state.syncStatus = 'error'
        })
        toast.error('Failed to save meal to cloud')
      }
    },

    deleteScan: async (id) => {
      const previousHistory = [...get().scanHistory]
      set((state) => {
        state.scanHistory = state.scanHistory.filter(s => s.id !== id)
        state.syncStatus = 'syncing'
      })

      try {
        await api.deleteScan(id)
        set((state) => {
          state.syncStatus = 'synced'
          state.lastSyncedAt = Date.now()
        })
        toast.success('Meal deleted')
      } catch (error) {
        set((state) => {
          state.scanHistory = previousHistory
          state.syncStatus = 'error'
        })
        toast.error('Failed to delete meal from cloud')
      }
    },

    updateGoals: async (goals) => {
      const userId = get().userId
      if (!userId) return

      const previousGoals = get().dailyGoals
      set((state) => {
        state.dailyGoals = goals
        if (state.userProfile) state.userProfile.dailyGoals = goals
        state.syncStatus = 'syncing'
      })

      try {
        await api.updateDailyGoals(userId, goals)
        set((state) => {
          state.syncStatus = 'synced'
          state.lastSyncedAt = Date.now()
        })
        toast.success('Goals updated')
      } catch (error) {
        set((state) => {
          state.dailyGoals = previousGoals
          if (state.userProfile) state.userProfile.dailyGoals = previousGoals!
          state.syncStatus = 'error'
        })
        toast.error('Failed to update goals in cloud')
      }
    },

    updateProfile: async (profileUpdate, options) => {
      const userId = get().userId
      if (!userId) return

      const previousProfile = get().userProfile
      set((state) => {
        if (state.userProfile) {
          state.userProfile = { ...state.userProfile, ...profileUpdate }
        }
        state.syncStatus = 'syncing'
      })

      try {
        await api.updateProfile(userId, profileUpdate)
        set((state) => {
          state.syncStatus = 'synced'
          state.lastSyncedAt = Date.now()
        })
        if (!options?.silent) {
          toast.success('Profile updated')
        }
      } catch (error) {
        set((state) => {
          state.userProfile = previousProfile
          state.syncStatus = 'error'
        })
        toast.error('Failed to update profile in cloud')
      }
    },

    clearHistory: async () => {
      const userId = get().userId
      if (!userId) return

      const previousHistory = [...get().scanHistory]
      const previousCurrentScan = get().currentScan

      set((state) => {
        state.scanHistory = []
        state.currentScan = null
        state.syncStatus = 'syncing'
      })

      try {
        await api.clearUserScans(userId)
        set((state) => {
          state.syncStatus = 'synced'
          state.lastSyncedAt = Date.now()
        })
        toast.success('History cleared')
      } catch (error) {
        set((state) => {
          state.scanHistory = previousHistory
          state.currentScan = previousCurrentScan
          state.syncStatus = 'error'
        })
        toast.error('Failed to clear history from cloud')
      }
    },

    signOut: async () => {
      try {
        const { error } = await supabase.auth.signOut({ scope: 'global' })
        if (error) throw error
        get().resetState()
        toast.success('Signed out')
      } catch (error) {
        console.error('Sign out failed:', error)
        toast.error('Failed to sign out. Please try again.')
      }
    },

    setCurrentScan: (scan) => set((state) => { state.currentScan = scan }),

    setScanning: (status) => set((state) => { state.isScanning = status }),

    setSelectedDate: (date) => set((state) => { state.selectedDate = date.toISOString() }),

    getTodayScans: () => {
      const today = new Date()
      return get().scanHistory.filter((scan) => isSameDay(new Date(scan.timestamp), today))
    },

    getTodayNutrition: () => {
      const todayScans = get().getTodayScans()
      const initial: NutritionData = {
        calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sugar: 0, sodium: 0, saturatedFat: 0,
      }
      
      return todayScans.reduce((acc, scan) => {
        acc.calories += scan.totalNutrition.calories
        acc.protein += scan.totalNutrition.protein
        acc.carbs += scan.totalNutrition.carbs
        acc.fat += scan.totalNutrition.fat
        acc.fibre += scan.totalNutrition.fibre
        acc.sugar += scan.totalNutrition.sugar
        acc.sodium += scan.totalNutrition.sodium
        acc.saturatedFat += scan.totalNutrition.saturatedFat
        return acc
      }, initial)
    },

    getGoalProgress: () => {
      const todayNutrition = get().getTodayNutrition()
      const goals = get().dailyGoals
      if (!goals) return { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 }
      
      return {
        calories: goals.calories > 0 ? Math.round((todayNutrition.calories / goals.calories) * 100) : 0,
        protein: goals.protein > 0 ? Math.round((todayNutrition.protein / goals.protein) * 100) : 0,
        carbs: goals.carbs > 0 ? Math.round((todayNutrition.carbs / goals.carbs) * 100) : 0,
        fat: goals.fat > 0 ? Math.round((todayNutrition.fat / goals.fat) * 100) : 0,
        fibre: goals.fibre > 0 ? Math.round((todayNutrition.fibre / goals.fibre) * 100) : 0,
      }
    },

    getWeeklyData: () => {
      const history = get().scanHistory
      const goals = get().dailyGoals
      if (!goals) return []
      
      return Array.from({ length: 7 }).map((_, i) => {
        const date = subDays(new Date(), i)
        const dateStr = format(date, 'yyyy-MM-dd')
        const dayScans = history.filter((scan) => isSameDay(new Date(scan.timestamp), date))
        
        const totalNutrition = dayScans.reduce(
          (acc, scan) => {
            acc.calories += scan.totalNutrition.calories
            acc.protein += scan.totalNutrition.protein
            acc.carbs += scan.totalNutrition.carbs
            acc.fat += scan.totalNutrition.fat
            acc.fibre += scan.totalNutrition.fibre
            acc.sugar += scan.totalNutrition.sugar
            acc.sodium += scan.totalNutrition.sodium
            acc.saturatedFat += scan.totalNutrition.saturatedFat
            return acc
          },
          {
            calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sugar: 0, sodium: 0, saturatedFat: 0,
          } as NutritionData
        )

        return {
          date: dateStr,
          scans: dayScans,
          scanCount: dayScans.length,
          totalNutrition,
          goalProgress: {
            calories: goals.calories > 0 ? Math.round((totalNutrition.calories / goals.calories) * 100) : 0,
            protein: goals.protein > 0 ? Math.round((totalNutrition.protein / goals.protein) * 100) : 0,
            carbs: goals.carbs > 0 ? Math.round((totalNutrition.carbs / goals.carbs) * 100) : 0,
            fat: goals.fat > 0 ? Math.round((totalNutrition.fat / goals.fat) * 100) : 0,
            fibre: goals.fibre > 0 ? Math.round((totalNutrition.fibre / goals.fibre) * 100) : 0,
          },
        }
      })
    },

    getScansByDate: (date) => {
      return get().scanHistory.filter((scan) => isSameDay(new Date(scan.timestamp), date))
    },

    getScansByMealType: (type) => {
      return get().scanHistory.filter((scan) => scan.mealType === type)
    },
  }))
)
