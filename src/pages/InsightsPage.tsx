import * as React from "react"
import { motion } from "motion/react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Brain, Salad, Scale, Target, TrendingUp, Zap } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useNutriStore } from "@/store/useNutriStore"
import type { DailySummary } from "@/types"
import * as api from "@/lib/supabase/api"
import {
  buildWeeklySummariesFromScans,
  calculateBmi,
  getActivityLabel,
  getBmiCategory,
  parseSummaryDate,
  roundToOne,
} from "@/lib/utils"

const PIE_COLORS = ["#1D9E75", "#378ADD", "#EF9F27", "#534AB7"]

export default function InsightsPage() {
  const userId = useNutriStore((state) => state.userId)
  const userProfile = useNutriStore((state) => state.userProfile)
  const dailyGoals = useNutriStore((state) => state.dailyGoals)
  const scanHistory = useNutriStore((state) => state.scanHistory)
  const [weeklySummaries, setWeeklySummaries] = React.useState<DailySummary[]>([])
  const [isLoadingSummaries, setIsLoadingSummaries] = React.useState(true)

  React.useEffect(() => {
    let isCancelled = false

    const loadWeeklySummaries = async () => {
      if (!userId) {
        setWeeklySummaries([])
        setIsLoadingSummaries(false)
        return
      }

      setIsLoadingSummaries(true)

      try {
        const summaries = await api.getWeeklySummaries(userId)
        if (!isCancelled) {
          setWeeklySummaries(summaries)
        }
      } catch (error) {
        if (!isCancelled) {
          setWeeklySummaries([])
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingSummaries(false)
        }
      }
    }

    void loadWeeklySummaries()

    return () => {
      isCancelled = true
    }
  }, [userId, scanHistory])

  const fallbackWeeklyData = React.useMemo(
    () => buildWeeklySummariesFromScans(scanHistory, dailyGoals),
    [dailyGoals, scanHistory],
  )
  const activeWeeklyData = weeklySummaries.length > 0 ? weeklySummaries : fallbackWeeklyData
  const hasAnyScans = scanHistory.length > 0

  const chartData = activeWeeklyData.map((summary) => ({
    day: parseSummaryDate(summary.date).toLocaleDateString(undefined, { weekday: "short" }),
    calories: Math.round(summary.totalNutrition.calories),
    protein: Math.round(summary.totalNutrition.protein),
    fibre: Math.round(summary.totalNutrition.fibre),
    sugar: Math.round(summary.totalNutrition.sugar),
    scanCount: summary.scanCount ?? summary.scans.length,
  }))

  const mealDistribution = React.useMemo(() => {
    const counts = scanHistory.reduce<Record<string, number>>((acc, scan) => {
      acc[scan.mealType] = (acc[scan.mealType] ?? 0) + 1
      return acc
    }, {})

    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [scanHistory])

  const averageCalories =
    activeWeeklyData.length > 0
      ? Math.round(
          activeWeeklyData.reduce((sum, summary) => sum + summary.totalNutrition.calories, 0) /
            activeWeeklyData.length,
        )
      : 0
  const averageProtein =
    activeWeeklyData.length > 0
      ? Math.round(
          activeWeeklyData.reduce((sum, summary) => sum + summary.totalNutrition.protein, 0) /
            activeWeeklyData.length,
        )
      : 0
  const averageConfidence =
    scanHistory.length > 0
      ? Math.round(scanHistory.reduce((sum, scan) => sum + scan.overallConfidence, 0) / scanHistory.length)
      : 0
  const loggedDays = activeWeeklyData.filter((summary) => (summary.scanCount ?? summary.scans.length) > 0).length

  const goalHitCounts = {
    calories: activeWeeklyData.filter((summary) => summary.goalProgress.calories >= 100).length,
    protein: activeWeeklyData.filter((summary) => summary.goalProgress.protein >= 100).length,
    fibre: activeWeeklyData.filter((summary) => summary.goalProgress.fibre >= 100).length,
  }

  const averageSugar =
    activeWeeklyData.length > 0
      ? roundToOne(
          activeWeeklyData.reduce((sum, summary) => sum + summary.totalNutrition.sugar, 0) /
            activeWeeklyData.length,
        )
      : 0
  const averageSodium =
    activeWeeklyData.length > 0
      ? Math.round(
          activeWeeklyData.reduce((sum, summary) => sum + summary.totalNutrition.sodium, 0) /
            activeWeeklyData.length,
        )
      : 0
  const manualEntries = scanHistory.filter((scan) => scan.isManualEntry).length

  const recommendations = React.useMemo(() => {
    const items: { title: string; body: string; tone: string }[] = []

    if (dailyGoals && averageProtein < dailyGoals.protein * 0.9) {
      items.push({
        title: "Increase protein consistency",
        body: "Your weekly protein average is still below your configured goal. Adding a high-protein breakfast or snack would close the gap fastest.",
        tone: "bg-primary/5 border-primary/10",
      })
    }

    if (averageSodium > 1800) {
      items.push({
        title: "Watch sodium-heavy meals",
        body: "Your recent scans are trending high in sodium. Consider swapping one processed or restaurant meal for a lower-sodium homemade option.",
        tone: "bg-info/5 border-info/10",
      })
    }

    if (averageSugar > 35) {
      items.push({
        title: "Reduce added sugars",
        body: "Sugar intake is running high relative to common daily guidance. Try pairing sweet meals with more fibre or protein to smooth the spike.",
        tone: "bg-alert/5 border-alert/10",
      })
    }

    if (loggedDays < 5) {
      items.push({
        title: "Log more consistently",
        body: "You have rich scan data, but only a few active days this week. Capturing more days will make the trend charts and recommendations more reliable.",
        tone: "bg-accent/5 border-accent/10",
      })
    }

    if (items.length === 0) {
      items.push({
        title: "Strong weekly balance",
        body: "Your logged meals show balanced macro coverage and solid consistency. Keep using the mix of AI scans and manual logging to maintain trend accuracy.",
        tone: "bg-primary/5 border-primary/10",
      })
    }

    return items.slice(0, 3)
  }, [averageProtein, averageSodium, averageSugar, dailyGoals, loggedDays])

  const bmi = calculateBmi(userProfile?.heightCm, userProfile?.weightKg)

  if (!userProfile || !dailyGoals) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Zap className="h-8 w-8 animate-pulse text-primary opacity-30" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold tracking-tight">Nutrition Insights</h1>
        <p className="mt-1 text-muted-foreground">
          Real trends powered by your scan history, stored summary data, and profile settings.
        </p>
      </motion.div>

      {!hasAnyScans ? (
        <Card className="border-none bg-card/50 shadow-sm backdrop-blur-sm">
          <CardContent className="flex h-[220px] flex-col items-center justify-center text-center">
            <TrendingUp className="mb-4 h-10 w-10 text-primary opacity-30" />
            <p className="text-lg font-bold">Not enough data yet</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Start scanning or logging meals to unlock weekly trends, goal consistency, and deeper nutrition insights.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InsightStatCard label="Avg Daily Calories" value={`${averageCalories}`} hint="Across the last 7 days" icon={TrendingUp} tone="text-alert" />
            <InsightStatCard label="Avg Daily Protein" value={`${averageProtein}g`} hint="Uses stored macro totals" icon={Salad} tone="text-primary" />
            <InsightStatCard label="Avg Scan Confidence" value={`${averageConfidence}%`} hint="From AI/manual history" icon={Brain} tone="text-info" />
            <InsightStatCard label="Logged Days" value={`${loggedDays}/7`} hint={`${manualEntries} manual entries included`} icon={Target} tone="text-accent" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
            <Card className="border-none bg-card/50 shadow-sm backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Weekly Calorie Trend</CardTitle>
                <CardDescription>
                  Uses `daily_summaries` when available and falls back to live scan aggregation otherwise.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                {isLoadingSummaries && weeklySummaries.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading summary trends...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="caloriesFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#1D9E75" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip />
                      <ReferenceLine y={dailyGoals.calories} stroke="#D85A30" strokeDasharray="4 4" />
                      <Area type="monotone" dataKey="calories" stroke="#1D9E75" fill="url(#caloriesFill)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-none bg-card/50 shadow-sm backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Meal Distribution</CardTitle>
                <CardDescription>How your recent entries are spread across meal types.</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={mealDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4}>
                      {mealDistribution.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap justify-center gap-4">
                  {mealDistribution.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      {entry.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card className="border-none bg-card/50 shadow-sm backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-alert" />
                  Goal Consistency
                </CardTitle>
                <CardDescription>How often your weekly summaries crossed 100% of your configured goals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <GoalConsistencyRow label="Calories" value={goalHitCounts.calories} />
                <GoalConsistencyRow label="Protein" value={goalHitCounts.protein} />
                <GoalConsistencyRow label="Fibre" value={goalHitCounts.fibre} />
                <div className="rounded-2xl border border-border/50 bg-background/60 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Average Watchpoints</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-2xl font-black">{averageSugar}g</p>
                      <p className="text-xs text-muted-foreground">Avg sugar per day</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black">{averageSodium}mg</p>
                      <p className="text-xs text-muted-foreground">Avg sodium per day</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-card/50 shadow-sm backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-info" />
                  Profile Signals
                </CardTitle>
                <CardDescription>Surface data from your profile table that was previously unused in the UI.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <ProfileSignal label="Activity Level" value={getActivityLabel(userProfile.activityLevel)} />
                  <ProfileSignal label="Unit Preference" value={userProfile.unitSystem === "metric" ? "Metric" : "Imperial"} />
                  <ProfileSignal label="BMI" value={bmi ? `${bmi}` : "Add height and weight"} />
                  <ProfileSignal label="BMI Status" value={getBmiCategory(bmi)} />
                </div>
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="protein" fill="#378ADD" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="fibre" fill="#1D9E75" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none bg-card/50 shadow-sm backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Recommendations
              </CardTitle>
              <CardDescription>Generated from the nutrition, logging, and profile data you’re already storing.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {recommendations.map((recommendation) => (
                <div key={recommendation.title} className={`rounded-2xl border p-4 ${recommendation.tone}`}>
                  <p className="text-sm font-bold">{recommendation.title}</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{recommendation.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function InsightStatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
  tone: string
}) {
  return (
    <Card className="border-none bg-card/50 shadow-sm backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-black">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          </div>
          <Icon className={`h-5 w-5 ${tone}`} />
        </div>
      </CardContent>
    </Card>
  )
}

function GoalConsistencyRow({ label, value }: { label: string; value: number }) {
  const percentage = Math.round((value / 7) * 100)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-bold">
        <span>{label}</span>
        <span className="text-muted-foreground">{value}/7 days</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  )
}

function ProfileSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/60 p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-bold">{value}</p>
    </div>
  )
}
