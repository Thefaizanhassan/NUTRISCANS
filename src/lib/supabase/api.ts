import { supabase } from './client'
import type { User } from '@supabase/supabase-js'
import { 
  ScanResult, 
  UserProfile, 
  DailyGoal, 
  NutritionData, 
  DailySummary,
  FoodItem 
} from '@/types'

// --- Profile Operations ---

export async function getProfile(userId: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  
  return {
    id: data.id,
    name: data.display_name,
    avatar: data.avatar_url,
    dailyGoals: {
      calories: data.goal_calories,
      protein: data.goal_protein,
      carbs: data.goal_carbs,
      fat: data.goal_fat,
      fibre: data.goal_fibre,
    },
    dietaryPreferences: data.dietary_preferences ?? ['none'],
    createdAt: new Date(data.created_at)
  }
}

export async function ensureProfile(user: User): Promise<UserProfile> {
  try {
    return await getProfile(user.id)
  } catch (error: any) {
    if (error?.code !== 'PGRST116') throw error

    const metadata = user.user_metadata ?? {}
    const displayName =
      metadata.full_name ??
      metadata.name ??
      user.email?.split('@')[0] ??
      'User'

    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        display_name: displayName,
        avatar_url: metadata.avatar_url ?? null,
      })

    if (insertError && insertError.code !== '23505') {
      throw insertError
    }

    return getProfile(user.id)
  }
}

export async function updateProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
  const updateData: any = {}
  if (data.name !== undefined) updateData.display_name = data.name
  if (data.avatar !== undefined) updateData.avatar_url = data.avatar
  if (data.dietaryPreferences !== undefined) {
    updateData.dietary_preferences =
      data.dietaryPreferences.length > 0 ? data.dietaryPreferences : ['none']
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)

  if (error) throw error
}

export async function updateDailyGoals(userId: string, goals: DailyGoal): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      goal_calories: goals.calories,
      goal_protein: goals.protein,
      goal_carbs: goals.carbs,
      goal_fat: goals.fat,
      goal_fibre: goals.fibre,
    })
    .eq('id', userId)

  if (error) throw error
}

// --- Scan Operations ---

export interface CreateScanInput {
  userId: string
  imageUrl?: string
  imageStoragePath?: string
  contextText?: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  foodItems: Omit<FoodItem, 'id'>[]
  totalNutrition: NutritionData
  overallConfidence: number
  modelUsed?: string
  isManualEntry?: boolean
}

export async function createScan(input: CreateScanInput): Promise<ScanResult> {
  // 1. Insert scan record
  const { data: scanData, error: scanError } = await supabase
    .from('scans')
    .insert({
      user_id: input.userId,
      image_url: input.imageUrl,
      image_storage_path: input.imageStoragePath,
      context_text: input.contextText,
      meal_type: input.mealType,
      total_calories: input.totalNutrition.calories,
      total_protein: input.totalNutrition.protein,
      total_carbs: input.totalNutrition.carbs,
      total_fat: input.totalNutrition.fat,
      total_fibre: input.totalNutrition.fibre,
      total_sugar: input.totalNutrition.sugar,
      total_sodium: input.totalNutrition.sodium,
      total_saturated_fat: input.totalNutrition.saturatedFat,
      overall_confidence: input.overallConfidence,
      model_used: input.modelUsed || 'gemini-1.5-flash',
      is_manual_entry: input.isManualEntry || false,
    })
    .select()
    .single()

  if (scanError) throw scanError

  // 2. Bulk insert food items
  const foodItemsToInsert = input.foodItems.map((item, index) => ({
    scan_id: scanData.id,
    user_id: input.userId,
    name: item.name,
    portion_size: item.portionSize,
    calories: item.nutrition.calories,
    protein: item.nutrition.protein,
    carbs: item.nutrition.carbs,
    fat: item.nutrition.fat,
    fibre: item.nutrition.fibre,
    sugar: item.nutrition.sugar,
    sodium: item.nutrition.sodium,
    saturated_fat: item.nutrition.saturatedFat,
    confidence: item.confidence,
    sort_order: index,
  }))

  const { data: itemsData, error: itemsError } = await supabase
    .from('food_items')
    .insert(foodItemsToInsert)
    .select()

  if (itemsError) {
    await supabase
      .from('scans')
      .delete()
      .eq('id', scanData.id)

    throw itemsError
  }

  return {
    id: scanData.id,
    imageUrl: scanData.image_url,
    contextText: scanData.context_text,
    foodItems: itemsData.map(item => ({
      id: item.id,
      name: item.name,
      portionSize: item.portion_size,
      nutrition: {
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fibre: item.fibre,
        sugar: item.sugar,
        sodium: item.sodium,
        saturatedFat: item.saturated_fat,
      },
      confidence: item.confidence,
    })),
    totalNutrition: {
      calories: scanData.total_calories,
      protein: scanData.total_protein,
      carbs: scanData.total_carbs,
      fat: scanData.total_fat,
      fibre: scanData.total_fibre,
      sugar: scanData.total_sugar,
      sodium: scanData.total_sodium,
      saturatedFat: scanData.total_saturated_fat,
    },
    overallConfidence: scanData.overall_confidence,
    mealType: scanData.meal_type,
    timestamp: new Date(scanData.scanned_at),
    modelUsed: scanData.model_used,
  }
}

export async function getScanById(scanId: string): Promise<ScanResult> {
  const { data: scan, error: scanError } = await supabase
    .from('scans')
    .select('*, food_items(*)')
    .eq('id', scanId)
    .single()

  if (scanError) throw scanError

  return {
    id: scan.id,
    imageUrl: scan.image_url,
    contextText: scan.context_text,
    foodItems: scan.food_items.map((item: any) => ({
      id: item.id,
      name: item.name,
      portionSize: item.portion_size,
      nutrition: {
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fibre: item.fibre,
        sugar: item.sugar,
        sodium: item.sodium,
        saturatedFat: item.saturated_fat,
      },
      confidence: item.confidence,
    })),
    totalNutrition: {
      calories: scan.total_calories,
      protein: scan.total_protein,
      carbs: scan.total_carbs,
      fat: scan.total_fat,
      fibre: scan.total_fibre,
      sugar: scan.total_sugar,
      sodium: scan.total_sodium,
      saturatedFat: scan.total_saturated_fat,
    },
    overallConfidence: scan.overall_confidence,
    mealType: scan.meal_type,
    timestamp: new Date(scan.scanned_at),
    modelUsed: scan.model_used,
  }
}

export async function getUserScans(userId: string, options?: { 
  limit?: number, 
  offset?: number, 
  mealType?: string, 
  dateFrom?: string, 
  dateTo?: string 
}): Promise<ScanResult[]> {
  let query = supabase
    .from('scans')
    .select('*, food_items(*)')
    .eq('user_id', userId)
    .order('scanned_at', { ascending: false })

  if (options?.limit) query = query.limit(options.limit)
  if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  if (options?.mealType) query = query.eq('meal_type', options.mealType)
  if (options?.dateFrom) query = query.gte('scanned_at', options.dateFrom)
  if (options?.dateTo) query = query.lte('scanned_at', options.dateTo)

  const { data, error } = await query

  if (error) throw error

  return data.map(scan => ({
    id: scan.id,
    imageUrl: scan.image_url,
    contextText: scan.context_text,
    foodItems: scan.food_items.map((item: any) => ({
      id: item.id,
      name: item.name,
      portionSize: item.portion_size,
      nutrition: {
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fibre: item.fibre,
        sugar: item.sugar,
        sodium: item.sodium,
        saturatedFat: item.saturated_fat,
      },
      confidence: item.confidence,
    })),
    totalNutrition: {
      calories: scan.total_calories,
      protein: scan.total_protein,
      carbs: scan.total_carbs,
      fat: scan.total_fat,
      fibre: scan.total_fibre,
      sugar: scan.total_sugar,
      sodium: scan.total_sodium,
      saturatedFat: scan.total_saturated_fat,
    },
    overallConfidence: scan.overall_confidence,
    mealType: scan.meal_type,
    timestamp: new Date(scan.scanned_at),
    modelUsed: scan.model_used,
  }))
}

export async function deleteScan(scanId: string): Promise<void> {
  // Get image path first to delete from storage
  const { data: scan, error: fetchError } = await supabase
    .from('scans')
    .select('image_storage_path')
    .eq('id', scanId)
    .single()

  if (fetchError) throw fetchError

  // Delete from DB (cascades to food_items)
  const { error: deleteError } = await supabase
    .from('scans')
    .delete()
    .eq('id', scanId)

  if (deleteError) throw deleteError

  // Delete from storage if exists
  if (scan.image_storage_path) {
    try {
      await deleteScanImage(scan.image_storage_path)
    } catch (error) {
      console.warn('Failed to delete scan image from storage:', error)
    }
  }
}

export async function clearUserScans(userId: string): Promise<void> {
  const { data: scans, error: fetchError } = await supabase
    .from('scans')
    .select('image_storage_path')
    .eq('user_id', userId)

  if (fetchError) throw fetchError

  const { error: deleteError } = await supabase
    .from('scans')
    .delete()
    .eq('user_id', userId)

  if (deleteError) throw deleteError

  const imagePaths = (scans ?? [])
    .map((scan) => scan.image_storage_path)
    .filter((path): path is string => Boolean(path))

  if (imagePaths.length > 0) {
    try {
      await deleteScanImages(imagePaths)
    } catch (error) {
      console.warn('Failed to delete one or more scan images from storage:', error)
    }
  }
}

// --- Daily Summary Operations ---

export async function getDailySummary(userId: string, date: string): Promise<DailySummary> {
  const { data, error } = await supabase
    .from('daily_summaries')
    .select('*')
    .eq('user_id', userId)
    .eq('summary_date', date)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 is "no rows found"

  if (!data) {
    return {
      date,
      scans: [],
      totalNutrition: {
        calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sugar: 0, sodium: 0, saturatedFat: 0
      },
      goalProgress: {
        calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0
      }
    }
  }

  return {
    date: data.summary_date,
    scans: [], // We don't fetch full scans here for performance, use getUserScans if needed
    totalNutrition: {
      calories: data.total_calories,
      protein: data.total_protein,
      carbs: data.total_carbs,
      fat: data.total_fat,
      fibre: data.total_fibre,
      sugar: data.total_sugar,
      sodium: data.total_sodium,
      saturatedFat: 0, // Not stored in summary
    },
    goalProgress: {
      calories: data.goal_calories_pct,
      protein: data.goal_protein_pct,
      carbs: data.goal_carbs_pct,
      fat: data.goal_fat_pct,
      fibre: data.goal_fibre_pct,
    }
  }
}

export async function getWeeklySummaries(userId: string): Promise<DailySummary[]> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const dateStr = sevenDaysAgo.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('daily_summaries')
    .select('*')
    .eq('user_id', userId)
    .gte('summary_date', dateStr)
    .order('summary_date', { ascending: true })

  if (error) throw error

  return data.map(d => ({
    date: d.summary_date,
    scans: [],
    totalNutrition: {
      calories: d.total_calories,
      protein: d.total_protein,
      carbs: d.total_carbs,
      fat: d.total_fat,
      fibre: d.total_fibre,
      sugar: d.total_sugar,
      sodium: d.total_sodium,
      saturatedFat: 0,
    },
    goalProgress: {
      calories: d.goal_calories_pct,
      protein: d.goal_protein_pct,
      carbs: d.goal_carbs_pct,
      fat: d.goal_fat_pct,
      fibre: d.goal_fibre_pct,
    }
  }))
}

// --- Image Operations ---

export async function uploadScanImage(userId: string, file: File): Promise<string> {
  const timestamp = Date.now()
  const fileExt = file.name.split('.').pop()
  const path = `${userId}/${timestamp}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('scan-images')
    .upload(path, file)

  if (error) throw error
  return data.path
}

export function getScanImageUrl(path: string): string {
  const { data } = supabase.storage
    .from('scan-images')
    .getPublicUrl(path)
  
  return data.publicUrl
}

export async function deleteScanImage(path: string): Promise<void> {
  await deleteScanImages([path])
}

async function deleteScanImages(paths: string[]): Promise<void> {
  const { error } = await supabase.storage
    .from('scan-images')
    .remove(paths)

  if (error) throw error
}
