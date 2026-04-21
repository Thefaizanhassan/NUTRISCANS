import * as React from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { NutritionData } from "@/types"

interface MacroDonutProps {
  nutrition: NutritionData
}

export function MacroDonut({ nutrition }: MacroDonutProps) {
  const data = [
    { name: "Protein", value: nutrition.protein, color: "#1D9E75" },
    { name: "Carbs", value: nutrition.carbs, color: "#378ADD" },
    { name: "Fat", value: nutrition.fat, color: "#EF9F27" },
  ]

  const totalGrams = nutrition.protein + nutrition.carbs + nutrition.fat

  return (
    <div 
      className="w-full h-[240px] relative"
      role="img"
      aria-label={`Macro breakdown: ${nutrition.protein}g protein, ${nutrition.carbs}g carbs, ${nutrition.fat}g fat`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            itemStyle={{ fontWeight: 'bold' }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-black text-foreground">{Math.round(totalGrams)}g</span>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Macros</span>
      </div>

      <div className="flex justify-center gap-6 mt-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
