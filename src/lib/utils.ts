import { clsx, type ClassValue } from "clsx"
import { eachDayOfInterval, endOfDay, format, isSameDay, parseISO, startOfDay, subDays } from "date-fns"
import { twMerge } from "tailwind-merge"
import type { ActivityLevel, DailySummary, ScanResult } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns a time-based greeting string.
 * @returns {string} "Good morning", "Good afternoon", or "Good evening"
 */
export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export function kgToLb(value: number): number {
  return value * 2.20462
}

export function lbToKg(value: number): number {
  return value / 2.20462
}

export function cmToInches(value: number): number {
  return value / 2.54
}

export function inchesToCm(value: number): number {
  return value * 2.54
}

export function roundToOne(value: number): number {
  return Math.round(value * 10) / 10
}

export function calculateBmi(heightCm?: number | null, weightKg?: number | null): number | null {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null
  const heightM = heightCm / 100
  return roundToOne(weightKg / (heightM * heightM))
}

export function getBmiCategory(bmi?: number | null): string {
  if (!bmi) return "Unavailable"
  if (bmi < 18.5) return "Underweight"
  if (bmi < 25) return "Healthy range"
  if (bmi < 30) return "Overweight"
  return "Obesity range"
}

export function formatProcessingTime(processingTimeMs?: number | null): string | null {
  if (!processingTimeMs || processingTimeMs <= 0) return null
  if (processingTimeMs < 1000) return `${processingTimeMs} ms`
  return `${roundToOne(processingTimeMs / 1000)} s`
}

export function calculateLoggingStreak(scanHistory: ScanResult[]): number {
  if (scanHistory.length === 0) return 0

  const uniqueDays = new Set(
    scanHistory.map((scan) => format(startOfDay(new Date(scan.timestamp)), "yyyy-MM-dd"))
  )

  let streak = 0
  let cursor = startOfDay(new Date())

  while (uniqueDays.has(format(cursor, "yyyy-MM-dd"))) {
    streak += 1
    cursor = subDays(cursor, 1)
  }

  return streak
}

export function getActivityLabel(level: ActivityLevel): string {
  switch (level) {
    case "sedentary":
      return "Sedentary"
    case "light":
      return "Lightly active"
    case "moderate":
      return "Moderately active"
    case "active":
      return "Active"
    case "very_active":
      return "Very active"
  }
}

export function buildWeeklySummariesFromScans(
  scanHistory: ScanResult[],
  goals: { calories: number; protein: number; carbs: number; fat: number; fibre: number } | null,
): DailySummary[] {
  const interval = eachDayOfInterval({
    start: startOfDay(subDays(new Date(), 6)),
    end: endOfDay(new Date()),
  })

  return interval.map((day) => {
    const scans = scanHistory.filter((scan) => isSameDay(new Date(scan.timestamp), day))
    const totalNutrition = scans.reduce(
      (acc, scan) => ({
        calories: acc.calories + scan.totalNutrition.calories,
        protein: acc.protein + scan.totalNutrition.protein,
        carbs: acc.carbs + scan.totalNutrition.carbs,
        fat: acc.fat + scan.totalNutrition.fat,
        fibre: acc.fibre + scan.totalNutrition.fibre,
        sugar: acc.sugar + scan.totalNutrition.sugar,
        sodium: acc.sodium + scan.totalNutrition.sodium,
        saturatedFat: acc.saturatedFat + scan.totalNutrition.saturatedFat,
      }),
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fibre: 0,
        sugar: 0,
        sodium: 0,
        saturatedFat: 0,
      },
    )

    return {
      date: format(day, "yyyy-MM-dd"),
      scans,
      scanCount: scans.length,
      totalNutrition,
      goalProgress: {
        calories: goals?.calories ? Math.round((totalNutrition.calories / goals.calories) * 100) : 0,
        protein: goals?.protein ? Math.round((totalNutrition.protein / goals.protein) * 100) : 0,
        carbs: goals?.carbs ? Math.round((totalNutrition.carbs / goals.carbs) * 100) : 0,
        fat: goals?.fat ? Math.round((totalNutrition.fat / goals.fat) * 100) : 0,
        fibre: goals?.fibre ? Math.round((totalNutrition.fibre / goals.fibre) * 100) : 0,
      },
    }
  })
}

export function parseSummaryDate(date: string): Date {
  return parseISO(`${date}T00:00:00`)
}
