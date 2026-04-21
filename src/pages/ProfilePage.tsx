import * as React from "react"
import { motion } from "motion/react"
import {
  Activity,
  Bell,
  BellOff,
  Beef,
  Check,
  Download,
  Flame,
  Info,
  Loader2,
  LogOut,
  Minus,
  Monitor,
  Moon,
  Pencil,
  Plus,
  Ruler,
  Scale,
  Sun,
  Trash2,
  Wheat,
  Apple,
  Droplets,
} from "lucide-react"
import { format } from "date-fns"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useNutriStore } from "@/store/useNutriStore"
import type { ActivityLevel, ThemePreference, UserProfile } from "@/types"
import {
  calculateBmi,
  cmToInches,
  getActivityLabel,
  getBmiCategory,
  inchesToCm,
  kgToLb,
  lbToKg,
  roundToOne,
} from "@/lib/utils"

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

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "active", label: "Active" },
  { value: "very_active", label: "Very Active" },
]

type ProfileDraft = {
  age: number | null
  heightCm: number | null
  weightKg: number | null
  activityLevel: ActivityLevel
  unitSystem: UserProfile["unitSystem"]
}

export default function ProfilePage() {
  const { theme, setTheme } = useTheme()
  const {
    userProfile,
    dailyGoals,
    scanHistory,
    updateProfile,
    updateGoals,
    clearHistory,
    signOut,
  } = useNutriStore()

  const [isEditingName, setIsEditingName] = React.useState(false)
  const [tempName, setTempName] = React.useState(userProfile?.name || "")
  const [tempGoals, setTempGoals] = React.useState(
    dailyGoals || { calories: 2000, protein: 150, carbs: 250, fat: 65, fibre: 30 },
  )
  const [profileDraft, setProfileDraft] = React.useState<ProfileDraft>(createProfileDraft(userProfile))
  const [isSavingProfileDetails, setIsSavingProfileDetails] = React.useState(false)
  const [isClearDialogOpen, setIsClearDialogOpen] = React.useState(false)
  const [isClearingHistory, setIsClearingHistory] = React.useState(false)
  const [isSigningOut, setIsSigningOut] = React.useState(false)

  React.useEffect(() => {
    if (userProfile) {
      setTempName(userProfile.name)
      setProfileDraft(createProfileDraft(userProfile))
    }
    if (dailyGoals) setTempGoals(dailyGoals)
  }, [userProfile, dailyGoals])

  if (!userProfile || !dailyGoals) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
      </div>
    )
  }

  const bmi = calculateBmi(profileDraft.heightCm, profileDraft.weightKg)
  const completedProfileFields = [profileDraft.age, profileDraft.heightCm, profileDraft.weightKg].filter(Boolean).length
  const profileCompleteness = Math.round((completedProfileFields / 3) * 100)
  const displayedHeight =
    profileDraft.unitSystem === "metric"
      ? profileDraft.heightCm ?? ""
      : profileDraft.heightCm
        ? roundToOne(cmToInches(profileDraft.heightCm))
        : ""
  const displayedWeight =
    profileDraft.unitSystem === "metric"
      ? profileDraft.weightKg ?? ""
      : profileDraft.weightKg
        ? roundToOne(kgToLb(profileDraft.weightKg))
        : ""

  const handleSaveName = async () => {
    await updateProfile({ name: tempName.trim() })
    setIsEditingName(false)
  }

  const handleSaveGoals = async () => {
    await updateGoals(tempGoals)
  }

  const handleGoalChange = (key: keyof typeof dailyGoals, value: number) => {
    setTempGoals((prev) => ({ ...prev, [key]: Math.max(0, value) }))
  }

  const handleMeasureChange = (field: "heightCm" | "weightKg", rawValue: string) => {
    const parsed = Number.parseFloat(rawValue)

    if (Number.isNaN(parsed)) {
      setProfileDraft((prev) => ({ ...prev, [field]: null }))
      return
    }

    const normalizedValue =
      field === "heightCm"
        ? profileDraft.unitSystem === "metric"
          ? parsed
          : inchesToCm(parsed)
        : profileDraft.unitSystem === "metric"
          ? parsed
          : lbToKg(parsed)

    setProfileDraft((prev) => ({ ...prev, [field]: roundToOne(normalizedValue) }))
  }

  const handleSaveProfileDetails = async () => {
    setIsSavingProfileDetails(true)

    try {
      await updateProfile({
        age: profileDraft.age,
        heightCm: profileDraft.heightCm,
        weightKg: profileDraft.weightKg,
        activityLevel: profileDraft.activityLevel,
        unitSystem: profileDraft.unitSystem,
      })
    } finally {
      setIsSavingProfileDetails(false)
    }
  }

  const toggleDietaryPreference = async (preference: string) => {
    let nextPreferences = [...userProfile.dietaryPreferences]

    if (preference === "none") {
      nextPreferences = ["none"]
    } else {
      nextPreferences = nextPreferences.filter((item) => item !== "none")
      nextPreferences = nextPreferences.includes(preference)
        ? nextPreferences.filter((item) => item !== preference)
        : [...nextPreferences, preference]
    }

    await updateProfile({ dietaryPreferences: nextPreferences }, { silent: true })
  }

  const handleThemeChange = async (nextTheme: ThemePreference) => {
    setTheme(nextTheme)
    await updateProfile({ themePreference: nextTheme }, { silent: true })
  }

  const handleNotificationToggle = async (
    field: "notificationsDailyReminder" | "notificationsWeeklySummary",
    checked: boolean,
  ) => {
    await updateProfile({ [field]: checked } as Partial<UserProfile>, { silent: true })
  }

  const handleExportCSV = () => {
    const headers = ["Date", "Meal", "Type", "Calories", "Protein", "Carbs", "Fat", "Sugar", "Sodium", "Source", "Model"]
    const rows = scanHistory.map((scan) => [
      format(new Date(scan.timestamp), "yyyy-MM-dd HH:mm"),
      scan.foodItems[0]?.name ?? "Meal entry",
      scan.mealType,
      Math.round(scan.totalNutrition.calories),
      Math.round(scan.totalNutrition.protein),
      Math.round(scan.totalNutrition.carbs),
      Math.round(scan.totalNutrition.fat),
      Math.round(scan.totalNutrition.sugar),
      Math.round(scan.totalNutrition.sodium),
      scan.isManualEntry ? "manual" : "ai",
      scan.modelUsed,
    ])

    const csvContent = [headers.join(","), ...rows.map((entry) => entry.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `nutri_scans_history_${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
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

  const handleSignOut = async () => {
    setIsSigningOut(true)

    try {
      await signOut()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      <Card className="overflow-hidden border-none bg-card/50 shadow-sm backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground shadow-lg shadow-primary/20">
              {userProfile.name.split(" ").map((part) => part[0]).join("").toUpperCase()}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={tempName}
                      onChange={(event) => setTempName(event.target.value)}
                      className="h-8 w-44 text-center text-xl font-bold"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => void handleSaveName()}>
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold">{userProfile.name}</h2>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setIsEditingName(true)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Member since {format(new Date(userProfile.createdAt), "MMMM yyyy")}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge variant="secondary" className="rounded-full border-none bg-surface px-4 py-1 font-medium text-primary">
                {scanHistory.length} scans logged
              </Badge>
              <Badge variant="outline" className="rounded-full px-4 py-1">
                {getActivityLabel(profileDraft.activityLevel)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none bg-card/50 shadow-sm backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-info" />
            Health Profile
          </CardTitle>
          <CardDescription>
            These profile fields already exist in the database. Filling them in makes the app more informative and future-ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-border/50 bg-background/60 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">BMI Snapshot</p>
              <p className="mt-2 text-2xl font-black">{bmi ?? "--"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{getBmiCategory(bmi)}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/60 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Profile Completeness</p>
              <p className="mt-2 text-2xl font-black">{profileCompleteness}%</p>
              <p className="mt-1 text-sm text-muted-foreground">Age, height, and weight stored</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={profileDraft.age ?? ""}
                onChange={(event) =>
                  setProfileDraft((prev) => ({
                    ...prev,
                    age: event.target.value ? Number.parseInt(event.target.value, 10) : null,
                  }))
                }
                className="h-11 rounded-xl"
                placeholder="Years"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">
                Height ({profileDraft.unitSystem === "metric" ? "cm" : "in"})
              </Label>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="height"
                  type="number"
                  value={displayedHeight}
                  onChange={(event) => handleMeasureChange("heightCm", event.target.value)}
                  className="h-11 rounded-xl pl-10"
                  placeholder={profileDraft.unitSystem === "metric" ? "Height in cm" : "Height in inches"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">
                Weight ({profileDraft.unitSystem === "metric" ? "kg" : "lb"})
              </Label>
              <div className="relative">
                <Scale className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="weight"
                  type="number"
                  value={displayedWeight}
                  onChange={(event) => handleMeasureChange("weightKg", event.target.value)}
                  className="h-11 rounded-xl pl-10"
                  placeholder={profileDraft.unitSystem === "metric" ? "Weight in kg" : "Weight in lb"}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Unit Preference</Label>
                <p className="text-xs text-muted-foreground">Store body measurements in your preferred unit system.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${profileDraft.unitSystem === "metric" ? "text-foreground" : "text-muted-foreground"}`}>Metric</span>
                <Switch
                  checked={profileDraft.unitSystem === "imperial"}
                  onCheckedChange={(checked) =>
                    setProfileDraft((prev) => ({ ...prev, unitSystem: checked ? "imperial" : "metric" }))
                  }
                />
                <span className={`text-xs font-medium ${profileDraft.unitSystem === "imperial" ? "text-foreground" : "text-muted-foreground"}`}>Imperial</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Activity Level</Label>
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setProfileDraft((prev) => ({ ...prev, activityLevel: option.value }))}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      profileDraft.activityLevel === option.value
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "border border-border bg-background text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button className="w-full rounded-xl bg-primary hover:bg-primary/90" onClick={() => void handleSaveProfileDetails()} disabled={isSavingProfileDetails}>
            {isSavingProfileDetails ? "Saving Profile..." : "Save Health Profile"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-none bg-card/50 shadow-sm backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-alert" />
            Daily Nutrition Goals
          </CardTitle>
          <CardDescription>Set your daily targets for optimal health.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <GoalInput
              label="Calories"
              value={tempGoals.calories}
              unit="kcal"
              icon={<Flame className="h-4 w-4 text-alert" />}
              onChange={(value) => handleGoalChange("calories", value)}
            />
            <GoalInput
              label="Protein"
              value={tempGoals.protein}
              unit="g"
              icon={<Beef className="h-4 w-4 text-info" />}
              onChange={(value) => handleGoalChange("protein", value)}
            />
            <GoalInput
              label="Carbs"
              value={tempGoals.carbs}
              unit="g"
              icon={<Apple className="h-4 w-4 text-carbs" />}
              onChange={(value) => handleGoalChange("carbs", value)}
            />
            <GoalInput
              label="Fat"
              value={tempGoals.fat}
              unit="g"
              icon={<Droplets className="h-4 w-4 text-accent" />}
              onChange={(value) => handleGoalChange("fat", value)}
            />
            <GoalInput
              label="Fibre"
              value={tempGoals.fibre}
              unit="g"
              icon={<Wheat className="h-4 w-4 text-primary" />}
              onChange={(value) => handleGoalChange("fibre", value)}
            />
          </div>
          <Button className="w-full rounded-xl bg-primary hover:bg-primary/90" onClick={() => void handleSaveGoals()}>
            Save Goals
          </Button>
        </CardContent>
      </Card>

      <Card className="border-none bg-card/50 shadow-sm backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Dietary Preferences</CardTitle>
          <CardDescription>Personalize how the app interprets your meals.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((option) => {
              const isSelected = userProfile.dietaryPreferences.includes(option.value)
              return (
                <button
                  key={option.value}
                  onClick={() => void toggleDietaryPreference(option.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "border border-border bg-background text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none bg-card/50 shadow-sm backdrop-blur-sm">
        <CardHeader>
          <CardTitle>App Settings</CardTitle>
          <CardDescription>Persisted preferences backed by your profile record.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Theme</Label>
              <p className="text-xs text-muted-foreground">Sync your preferred theme with your profile.</p>
            </div>
            <div className="flex rounded-lg border border-border bg-background p-1">
              <ThemeButton active={theme === "light"} onClick={() => void handleThemeChange("light")} icon={<Sun className="h-4 w-4" />} />
              <ThemeButton active={theme === "dark"} onClick={() => void handleThemeChange("dark")} icon={<Moon className="h-4 w-4" />} />
              <ThemeButton active={theme === "system"} onClick={() => void handleThemeChange("system")} icon={<Monitor className="h-4 w-4" />} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label>Daily Reminders</Label>
              <p className="text-xs text-muted-foreground">Save your reminder preference to the profile table.</p>
            </div>
            <div className="flex items-center gap-2">
              {userProfile.notificationsDailyReminder ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
              <Switch
                checked={userProfile.notificationsDailyReminder}
                onCheckedChange={(checked) => void handleNotificationToggle("notificationsDailyReminder", checked)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label>Weekly Summary</Label>
              <p className="text-xs text-muted-foreground">Keep your summary preference stored for future automation.</p>
            </div>
            <div className="flex items-center gap-2">
              {userProfile.notificationsWeeklySummary ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
              <Switch
                checked={userProfile.notificationsWeeklySummary}
                onCheckedChange={(checked) => void handleNotificationToggle("notificationsWeeklySummary", checked)}
              />
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button variant="outline" className="w-full justify-start rounded-xl" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export Data (CSV)
            </Button>

            <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
              <DialogTrigger render={<Button variant="outline" className="w-full justify-start rounded-xl border-alert/20 text-alert hover:bg-alert/10 hover:text-alert" />}>
                <Trash2 className="mr-2 h-4 w-4" />
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
                  <Button variant="ghost" onClick={() => setIsClearDialogOpen(false)} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => void handleClearHistory()}
                    disabled={isClearingHistory}
                    className="rounded-xl bg-alert hover:bg-alert/90"
                  >
                    {isClearingHistory ? "Deleting..." : "Delete Everything"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="w-full justify-start rounded-xl border-alert/20 text-alert hover:bg-alert/10 hover:text-alert"
              onClick={() => void handleSignOut()}
              disabled={isSigningOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isSigningOut ? "Signing Out..." : "Sign Out"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 pt-4 text-center">
        <div className="space-y-1">
          <p className="text-lg font-bold">Nutri Scans v1.0</p>
          <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <Info className="h-3 w-3" /> AI-assisted meal analysis with profile-aware insights
          </p>
        </div>
      </div>
    </div>
  )
}

function createProfileDraft(profile?: UserProfile | null): ProfileDraft {
  return {
    age: profile?.age ?? null,
    heightCm: profile?.heightCm ?? null,
    weightKg: profile?.weightKg ?? null,
    activityLevel: profile?.activityLevel ?? "moderate",
    unitSystem: profile?.unitSystem ?? "metric",
  }
}

function GoalInput({
  label,
  value,
  unit,
  icon,
  onChange,
}: {
  label: string
  value: number
  unit: string
  icon: React.ReactNode
  onChange: (value: number) => void
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
          className="h-10 w-10 shrink-0 rounded-xl"
          onClick={() => onChange(value - (label === "Calories" ? 50 : 5))}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="relative flex-1">
          <Input
            type="number"
            value={value}
            onChange={(event) => onChange(Number.parseInt(event.target.value, 10) || 0)}
            className="h-10 rounded-xl pr-12 text-center font-bold"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
            {unit}
          </span>
        </div>
        <Button
          size="icon"
          variant="outline"
          className="h-10 w-10 shrink-0 rounded-xl"
          onClick={() => onChange(value + (label === "Calories" ? 50 : 5))}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function ThemeButton({
  active,
  onClick,
  icon,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md p-2 transition-all ${
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
    </button>
  )
}
