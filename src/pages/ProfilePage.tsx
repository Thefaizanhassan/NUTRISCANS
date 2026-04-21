import * as React from "react"
import { motion } from "motion/react"
import { 
  User, 
  ChevronRight, 
  Flame, 
  Beef, 
  Apple, 
  Droplets, 
  Wheat, 
  Moon, 
  Sun, 
  Monitor, 
  Download, 
  Trash2, 
  Pencil,
  Check,
  Plus,
  Minus,
  Info,
  Loader2
} from "lucide-react"
import { useTheme } from "next-themes"
import { useNutriStore } from "@/store/useNutriStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { format } from "date-fns"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const DIETARY_OPTIONS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "keto", label: "Keto" },
  { value: "low_carb", label: "Low-Carb" },
  { value: "gluten_free", label: "Gluten-Free" },
  { value: "dairy_free", label: "Dairy-Free" },
  { value: "halal", label: "Halal" },
  { value: "none", label: "None" },
] as const

export default function ProfilePage() {
  const { theme, setTheme } = useTheme()
  const { 
    userProfile, 
    dailyGoals, 
    scanHistory, 
    updateProfile, 
    updateGoals,
    clearHistory 
  } = useNutriStore()

  const [isEditingName, setIsEditingName] = React.useState(false)
  const [tempName, setTempName] = React.useState(userProfile?.name || "")
  const [tempGoals, setTempGoals] = React.useState(dailyGoals || { calories: 2000, protein: 150, carbs: 250, fat: 65, fibre: 30 })
  const [isClearDialogOpen, setIsClearDialogOpen] = React.useState(false)
  const [isClearingHistory, setIsClearingHistory] = React.useState(false)

  // Sync temp state when profile/goals load
  React.useEffect(() => {
    if (userProfile) setTempName(userProfile.name)
    if (dailyGoals) setTempGoals(dailyGoals)
  }, [userProfile, dailyGoals])

  if (!userProfile || !dailyGoals) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
      </div>
    )
  }

  const handleSaveName = async () => {
    await updateProfile({ name: tempName.trim() })
    setIsEditingName(false)
  }

  const handleSaveGoals = async () => {
    await updateGoals(tempGoals)
  }

  const handleGoalChange = (key: keyof typeof dailyGoals, value: number) => {
    setTempGoals(prev => ({ ...prev, [key]: Math.max(0, value) }))
  }

  const toggleDietaryPreference = (pref: string) => {
    let newPrefs = [...userProfile.dietaryPreferences]
    if (pref === "none") {
      newPrefs = ["none"]
    } else {
      newPrefs = newPrefs.filter(p => p !== "none")
      if (newPrefs.includes(pref)) {
        newPrefs = newPrefs.filter(p => p !== pref)
      } else {
        newPrefs.push(pref)
      }
    }
    updateProfile({ dietaryPreferences: newPrefs })
  }

  const handleExportCSV = () => {
    const headers = ["Date", "Meal", "Type", "Calories", "Protein", "Carbs", "Fat"]
    const rows = scanHistory.map(scan => [
      format(new Date(scan.timestamp), 'yyyy-MM-dd HH:mm'),
      scan.foodItems[0].name,
      scan.mealType,
      scan.totalNutrition.calories,
      scan.totalNutrition.protein,
      scan.totalNutrition.carbs,
      scan.totalNutrition.fat
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `nutri_scans_history_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Data exported as CSV")
  }

  const handleClearHistory = async () => {
    setIsClearingHistory(true)

    try {
      await clearHistory()
      setIsClearDialogOpen(false)
    } finally {
      setIsClearingHistory(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      {/* Profile Header */}
      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-lg shadow-primary/20">
              {userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input 
                      value={tempName} 
                      onChange={(e) => setTempName(e.target.value)}
                      className="h-8 w-40 text-center font-bold text-xl"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={handleSaveName}>
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold">{userProfile.name}</h2>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setIsEditingName(true)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Member since {format(new Date(userProfile.createdAt), 'MMMM yyyy')}
              </p>
            </div>

            <Badge variant="secondary" className="rounded-full px-4 py-1 bg-surface text-primary border-none font-medium">
              🔍 {scanHistory.length} scans
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Daily Nutrition Goals */}
      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-alert" />
            Daily Nutrition Goals
          </CardTitle>
          <CardDescription>Set your daily targets for optimal health</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <GoalInput 
              label="Calories" 
              value={tempGoals.calories} 
              unit="kcal" 
              icon={<Flame className="w-4 h-4 text-alert" />}
              onChange={(v) => handleGoalChange('calories', v)}
            />
            <GoalInput 
              label="Protein" 
              value={tempGoals.protein} 
              unit="g" 
              icon={<Beef className="w-4 h-4 text-info" />}
              onChange={(v) => handleGoalChange('protein', v)}
            />
            <GoalInput 
              label="Carbs" 
              value={tempGoals.carbs} 
              unit="g" 
              icon={<Apple className="w-4 h-4 text-carbs" />}
              onChange={(v) => handleGoalChange('carbs', v)}
            />
            <GoalInput 
              label="Fat" 
              value={tempGoals.fat} 
              unit="g" 
              icon={<Droplets className="w-4 h-4 text-accent" />}
              onChange={(v) => handleGoalChange('fat', v)}
            />
            <GoalInput 
              label="Fibre" 
              value={tempGoals.fibre} 
              unit="g" 
              icon={<Wheat className="w-4 h-4 text-primary" />}
              onChange={(v) => handleGoalChange('fibre', v)}
            />
          </div>
          <Button className="w-full rounded-xl bg-primary hover:bg-primary/90" onClick={handleSaveGoals}>
            Save Goals
          </Button>
        </CardContent>
      </Card>

      {/* Dietary Preferences */}
      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Dietary Preferences</CardTitle>
          <CardDescription>Personalize your nutrition analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((option) => {
              const isSelected = userProfile.dietaryPreferences.includes(option.value)
              return (
                <button
                  key={option.value}
                  onClick={() => toggleDietaryPreference(option.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isSelected 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "bg-background border border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* App Settings */}
      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>App Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Theme</Label>
              <p className="text-xs text-muted-foreground">Customize your viewing experience</p>
            </div>
            <div className="flex bg-background p-1 rounded-lg border border-border">
              <ThemeButton active={theme === 'light'} onClick={() => setTheme('light')} icon={<Sun className="w-4 h-4" />} />
              <ThemeButton active={theme === 'dark'} onClick={() => setTheme('dark')} icon={<Moon className="w-4 h-4" />} />
              <ThemeButton active={theme === 'system'} onClick={() => setTheme('system')} icon={<Monitor className="w-4 h-4" />} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Unit Preference</Label>
              <p className="text-xs text-muted-foreground">Metric (g, ml) or Imperial (oz, lb)</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Metric</span>
              <Switch defaultChecked />
              <span className="text-xs font-medium text-muted-foreground">Imperial</span>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button variant="outline" className="w-full justify-start rounded-xl" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export Data (CSV)
            </Button>
            
            <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
              <DialogTrigger render={<Button variant="outline" className="w-full justify-start rounded-xl text-alert hover:text-alert hover:bg-alert/10 border-alert/20" />}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All History
              </DialogTrigger>
              <DialogContent className="rounded-3xl">
                <DialogHeader>
                  <DialogTitle>Clear All History?</DialogTitle>
                  <DialogDescription>
                    This will permanently delete all {scanHistory.length} meal scans. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="ghost" onClick={() => setIsClearDialogOpen(false)} className="rounded-xl">Cancel</Button>
                  <Button variant="destructive" onClick={handleClearHistory} disabled={isClearingHistory} className="rounded-xl bg-alert hover:bg-alert/90">
                    {isClearingHistory ? "Deleting..." : "Delete Everything"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* About Section */}
      <div className="text-center space-y-4 pt-4">
        <div className="space-y-1">
          <p className="font-bold text-lg">Nutri Scans v1.0</p>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            <Info className="w-3 h-3" /> Powered by AI Vision Analysis
          </p>
        </div>
        <div className="flex items-center justify-center gap-6 text-xs font-medium text-primary">
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="hover:underline">Terms of Service</a>
          <a href="#" className="hover:underline">Contact Support</a>
        </div>
      </div>
    </div>
  )
}

function GoalInput({ label, value, unit, icon, onChange }: { 
  label: string, 
  value: number, 
  unit: string, 
  icon: React.ReactNode,
  onChange: (v: number) => void 
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          size="icon" 
          variant="outline" 
          className="h-10 w-10 rounded-xl shrink-0"
          onClick={() => onChange(value - (label === 'Calories' ? 50 : 5))}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <div className="relative flex-1">
          <Input 
            type="number" 
            value={value} 
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            className="h-10 rounded-xl pr-12 font-bold text-center"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
            {unit}
          </span>
        </div>
        <Button 
          size="icon" 
          variant="outline" 
          className="h-10 w-10 rounded-xl shrink-0"
          onClick={() => onChange(value + (label === 'Calories' ? 50 : 5))}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

function ThemeButton({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-md transition-all ${
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
    </button>
  )
}
