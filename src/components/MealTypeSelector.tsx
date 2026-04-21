import * as React from "react"
import { cn } from "@/lib/utils"

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

interface MealTypeSelectorProps {
  value: MealType
  onChange: (value: MealType) => void
}

export function MealTypeSelector({ value, onChange }: MealTypeSelectorProps) {
  const types: { id: MealType; label: string }[] = [
    { id: 'breakfast', label: 'Breakfast' },
    { id: 'lunch', label: 'Lunch' },
    { id: 'dinner', label: 'Dinner' },
    { id: 'snack', label: 'Snack' },
  ]

  return (
    <div className="px-6 space-y-3">
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Meal Type</span>
      <div className="flex flex-wrap gap-2">
        {types.map((type) => {
          const isActive = value === type.id
          return (
            <button
              key={type.id}
              onClick={() => onChange(type.id)}
              aria-pressed={isActive}
              className={cn(
                "px-5 py-2.5 rounded-full text-xs font-bold transition-all border",
                isActive 
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105" 
                  : "bg-transparent text-muted-foreground border-border/50 hover:border-primary/30"
              )}
            >
              {type.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
