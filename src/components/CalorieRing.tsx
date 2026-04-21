import * as React from "react"
import { motion } from "motion/react"

interface CalorieRingProps {
  consumed: number
  goal: number
}

export function CalorieRing({ consumed, goal }: CalorieRingProps) {
  const percentage = Math.min(Math.round((consumed / goal) * 100), 100)
  // const radius = 80
  // const stroke = 12
  // const normalizedRadius = radius - stroke * 2
  // const circumference = normalizedRadius * 2 * Math.PI
  const radius = 110   // increased from 80
  const stroke = 14    // slightly thicker for balance
  const normalizedRadius = radius - stroke * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div 
      className="flex flex-col items-center justify-center relative py-8"
      role="progressbar"
      aria-valuenow={consumed}
      aria-valuemin={0}
      aria-valuemax={goal}
      aria-label={`Calorie progress: ${consumed} of ${goal} kcal`}
    >
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        {/* Background Circle */}
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          className="text-muted/20"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress Circle */}
        <motion.circle
          stroke="#1D9E75"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + " " + circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black tracking-tighter">
            {consumed.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground font-medium">
            / {goal.toLocaleString()}
          </span>
          {/* <span className="text-2xl font-black tracking-tighter">
            {consumed.toLocaleString()}
          </span>

          <span className="text-xs text-muted-foreground font-medium">
            / {goal.toLocaleString()}
          </span> */}
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">
          kcal consumed
        </span>
        {/* <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
          kcal consumed
        </span> */}
      </div>
    </div>
  )
}
