import * as React from "react"
import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"
import { ScanResult } from "@/types"
import { format } from "date-fns"
import { PencilLine, Sparkles, Utensils } from "lucide-react"

interface MealCardProps {
  scan: ScanResult
  onClick?: () => void
  key?: string | number
}

export function MealCard({ scan, onClick }: MealCardProps) {
  const mealName = scan.foodItems[0]?.name || "Unknown Meal"
  const time = format(new Date(scan.timestamp), "h:mm a")

  return (
    <motion.div
      whileHover={{ scale: 1.01, x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center justify-between p-4 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-sm cursor-pointer group transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-muted flex items-center justify-center border border-border/50 relative">
          {scan.imageUrl ? (
            <img 
              src={scan.imageUrl} 
              alt={mealName} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          ) : (
            <Utensils className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        
        <div className="space-y-1">
          <h4 className="font-bold text-sm line-clamp-1">{mealName}</h4>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] h-5 px-2 rounded-lg bg-primary/10 text-primary border-none font-bold uppercase tracking-tighter">
              {scan.mealType}
            </Badge>
            <Badge variant="outline" className="h-5 rounded-lg px-2 text-[10px] font-bold uppercase tracking-tighter">
              {scan.isManualEntry ? (
                <>
                  <PencilLine className="mr-1 h-3 w-3" />
                  Manual
                </>
              ) : (
                <>
                  <Sparkles className="mr-1 h-3 w-3" />
                  AI
                </>
              )}
            </Badge>
            <span className="text-[10px] font-medium text-muted-foreground">{time}</span>
          </div>
        </div>
      </div>

      <div className="text-right">
        <p className="text-sm font-black text-foreground">{scan.totalNutrition.calories} <span className="text-[10px] font-bold text-muted-foreground uppercase">kcal</span></p>
        <p className="text-[10px] font-medium text-muted-foreground">{Math.round(scan.overallConfidence)}% confidence</p>
        <p className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">View Details</p>
      </div>
    </motion.div>
  )
}

export function EmptyMealsState({ onScanClick }: { onScanClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4 bg-card/30 rounded-3xl border border-dashed border-border/50">
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-2">
        <Utensils className="w-10 h-10 text-muted-foreground/50" />
      </div>
      <div className="space-y-1">
        <h3 className="font-bold text-lg">No meals scanned yet today</h3>
        <p className="text-sm text-muted-foreground max-w-[240px]">
          Track your first meal to see your nutrition progress here.
        </p>
      </div>
      <button
        onClick={onScanClick}
        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
      >
        Scan Now
      </button>
    </div>
  )
}
