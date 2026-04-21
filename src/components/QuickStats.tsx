import * as React from "react"
import { motion } from "motion/react"
import { Camera, Zap, Flame, Target } from "lucide-react"

interface QuickStatsProps {
  scansToday: number
  streak: number
  avgCalories: number
  topNutrient: string
}

export function QuickStats({ scansToday, streak, avgCalories, topNutrient }: QuickStatsProps) {
  const stats = [
    { label: "Scans Today", value: scansToday, icon: Camera, color: "bg-primary/10", iconColor: "text-primary" },
    { label: "Streak", value: `${streak} days`, icon: Zap, color: "bg-accent/10", iconColor: "text-accent" },
    { label: "Avg Calories", value: Math.round(avgCalories), icon: Flame, color: "bg-alert/10", iconColor: "text-alert" },
    { label: "Top Nutrient", value: topNutrient, icon: Target, color: "bg-info/10", iconColor: "text-info" },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 + index * 0.05 }}
          className="p-4 rounded-2xl bg-card/50 border border-border/50 shadow-sm flex flex-col gap-3"
        >
          <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center`}>
            <stat.icon size={16} className={stat.iconColor} />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
            <p className="text-sm font-black">{stat.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
