import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNutriStore } from "@/store/useNutriStore"
import { toast } from "sonner"
import { ScanResult, FoodItem } from "@/types"

interface MealLogModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MealLogModal({ open, onOpenChange }: MealLogModalProps) {
  const { addScan, userId } = useNutriStore()
  const [name, setName] = useState("")
  const [calories, setCalories] = useState("")
  const [protein, setProtein] = useState("")
  const [carbs, setCarbs] = useState("")
  const [fat, setFat] = useState("")
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !calories || !userId) {
      if (!userId) toast.error("User not authenticated")
      else toast.error("Please enter at least a name and calories")
      return
    }

    setIsSubmitting(true)
    
    try {
      const nutrition = {
        calories: Number(calories),
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        fibre: 0,
        sugar: 0,
        sodium: 0,
        saturatedFat: 0,
      }

      const scanInput = {
        userId,
        imageUrl: "https://picsum.photos/seed/manual/400/300",
        mealType,
        totalNutrition: nutrition,
        overallConfidence: 100,
        isManualEntry: true,
        foodItems: [{
          name,
          portionSize: "1 serving",
          nutrition,
          confidence: 100,
        }],
      }

      await addScan(scanInput)
      toast.success("Meal logged successfully!")
      onOpenChange(false)
      resetForm()
    } catch (error) {
      toast.error("Failed to log meal")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setName("")
    setCalories("")
    setProtein("")
    setCarbs("")
    setFat("")
    setMealType('lunch')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>Log a Meal</DialogTitle>
          <DialogDescription>
            Enter your meal details manually to track your nutrition.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Meal Name</Label>
            <Input 
              id="name" 
              placeholder="e.g., Chicken Pasta" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calories">Calories (kcal)</Label>
              <Input 
                id="calories" 
                type="number" 
                placeholder="0" 
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein">Protein (g)</Label>
              <Input 
                id="protein" 
                type="number" 
                placeholder="0" 
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input 
                id="carbs" 
                type="number" 
                placeholder="0" 
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">Fat (g)</Label>
              <Input 
                id="fat" 
                type="number" 
                placeholder="0" 
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Meal Type</Label>
            <Tabs value={mealType} onValueChange={(v) => setMealType(v as typeof mealType)} className="w-full">
              <TabsList className="grid w-full grid-cols-4 rounded-xl">
                <TabsTrigger value="breakfast" className="text-[10px] sm:text-xs rounded-lg">B-fast</TabsTrigger>
                <TabsTrigger value="lunch" className="text-[10px] sm:text-xs rounded-lg">Lunch</TabsTrigger>
                <TabsTrigger value="dinner" className="text-[10px] sm:text-xs rounded-lg">Dinner</TabsTrigger>
                <TabsTrigger value="snack" className="text-[10px] sm:text-xs rounded-lg">Snack</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full rounded-xl" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Meal Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
