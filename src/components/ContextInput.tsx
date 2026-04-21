import * as React from "react"
import { Sparkles } from "lucide-react"
import { motion } from "motion/react"

interface ContextInputProps {
  value: string
  onChange: (value: string) => void
}

export function ContextInput({ value, onChange }: ContextInputProps) {
  const maxLength = 200

  return (
    <div className="space-y-2 px-6">
      <div className="flex items-center gap-2 text-primary mb-1">
        <Sparkles size={14} className="fill-primary/20" />
        <span className="text-[10px] font-black uppercase tracking-widest">AI Enhancement</span>
      </div>
      
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          placeholder="Add details to improve accuracy... (e.g., 'homemade biryani with coconut oil')"
          className="w-full bg-card/50 border border-border/50 rounded-2xl p-4 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none placeholder:text-muted-foreground/50"
        />
        <div className="absolute bottom-3 right-4 text-[10px] font-bold text-muted-foreground/40">
          {value.length}/{maxLength}
        </div>
      </div>
      
      <p className="text-[10px] text-muted-foreground/60 px-1">
        Optional — helps our AI identify ingredients and cooking methods
      </p>
    </div>
  )
}
