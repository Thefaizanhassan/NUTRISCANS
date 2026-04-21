import * as React from "react"
import { motion } from "motion/react"
import { Beef, Apple, Droplets } from "lucide-react"
import { cn } from "@/lib/utils"

interface MacroCardProps {
  label: string
  value: number
  goal: number
  icon: React.ReactNode
  color: string
  delay: number
}

function MacroCard({ label, value, goal, icon, color, delay }: MacroCardProps) {
  const percentage = Math.min(Math.round((value / goal) * 100), 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="flex-1 bg-card/50 backdrop-blur-sm p-4 rounded-2xl border border-border/50 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn("p-2 rounded-xl", `bg-[${color}]/10`)} style={{ backgroundColor: `${color}15` }}>
          {React.cloneElement(icon as React.ReactElement<{ size?: number; color?: string }>, { size: 18, color: color })}
        </div>
        <span className="text-xs font-bold" style={{ color }}>{percentage}%</span>
      </div>
      
      <div className="space-y-1 mb-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-black">{value}g <span className="text-muted-foreground font-medium text-[10px]">/ {goal}g</span></p>
      </div>

      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: delay + 0.3, duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </motion.div>
  )
}

interface MacroCardsProps {
  nutrition: {
    protein: number
    carbs: number
    fat: number
  }
  goals: {
    protein: number
    carbs: number
    fat: number
  }
}

export function MacroCards({ nutrition, goals }: MacroCardsProps) {
  return (
    <div className="flex gap-3">
      <MacroCard
        label="Protein"
        value={nutrition.protein}
        goal={goals.protein}
        icon={<Beef />}
        color="#1D9E75"
        delay={0.1}
      />
      <MacroCard
        label="Carbs"
        value={nutrition.carbs}
        goal={goals.carbs}
        icon={<Apple />}
        color="#378ADD"
        delay={0.2}
      />
      <MacroCard
        label="Fat"
        value={nutrition.fat}
        goal={goals.fat}
        icon={<Droplets />}
        color="#EF9F27"
        delay={0.3}
      />
    </div>
  )
}
