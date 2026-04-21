import * as React from "react"
import { motion } from "motion/react"
import { Progress } from "@/components/ui/progress"
import { NutritionData, DailyGoal } from "@/types"

interface NutrientBarsProps {
  nutrition: NutritionData
  goals: DailyGoal
}

export function NutrientBars({ nutrition, goals }: NutrientBarsProps) {
  const nutrients = [
    { label: "Protein", value: nutrition.protein, goal: goals.protein, color: "bg-primary", unit: "g" },
    { label: "Carbs", value: nutrition.carbs, goal: goals.carbs, color: "bg-[#378ADD]", unit: "g" },
    { label: "Fat", value: nutrition.fat, goal: goals.fat, color: "bg-[#EF9F27]", unit: "g" },
    { label: "Fibre", value: nutrition.fibre, goal: goals.fibre, color: "bg-primary/60", unit: "g" },
    { label: "Sugar", value: nutrition.sugar, goal: 50, color: "bg-red-400", unit: "g" },
    { label: "Sodium", value: nutrition.sodium, goal: 2300, color: "bg-slate-400", unit: "mg" },
  ]

  return (
    <div className="space-y-6 px-2">
      {nutrients.map((n, i) => {
        const percentage = Math.min(100, Math.round((n.value / n.goal) * 100))
        return (
          <motion.div
            key={n.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="space-y-2"
          >
            <div className="flex justify-between items-end">
              <div className="space-y-0.5">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{n.label}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold">{n.value}{n.unit}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">/ {n.goal}{n.unit}</span>
                </div>
              </div>
              <span className="text-[10px] font-black text-primary">{percentage}%</span>
            </div>
            <Progress 
              value={percentage} 
              className="h-1.5 bg-muted" 
              indicatorClassName={n.color} 
            />
          </motion.div>
        )
      })}
    </div>
  )
}
