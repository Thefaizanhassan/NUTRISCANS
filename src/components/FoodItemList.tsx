import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { ChevronDown, ChevronUp, Dot } from "lucide-react"
import { FoodItem } from "@/types"

interface FoodItemListProps {
  items: FoodItem[]
}

export function FoodItemList({ items }: FoodItemListProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="space-y-3 px-2">
      {items.map((item) => (
        <div 
          key={item.id}
          className="bg-card/50 border border-border/50 rounded-2xl overflow-hidden transition-all"
        >
          <button
            onClick={() => toggleExpand(item.id)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <div className="text-left">
                <p className="font-bold text-sm">{item.name}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                  {item.portionSize} • {item.nutrition.calories} kcal
                </p>
              </div>
            </div>
            {expandedId === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <AnimatePresence>
            {expandedId === item.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4"
              >
                <div className="pt-2 border-t border-border/50 grid grid-cols-3 gap-2">
                  <div className="bg-muted/30 p-2 rounded-xl text-center">
                    <p className="text-xs font-black">{item.nutrition.protein}g</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Protein</p>
                  </div>
                  <div className="bg-muted/30 p-2 rounded-xl text-center">
                    <p className="text-xs font-black">{item.nutrition.carbs}g</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Carbs</p>
                  </div>
                  <div className="bg-muted/30 p-2 rounded-xl text-center">
                    <p className="text-xs font-black">{item.nutrition.fat}g</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Fat</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
