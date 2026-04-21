import * as React from "react"
import { useState, useMemo, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "motion/react"
import { format, startOfWeek, endOfWeek } from "date-fns"
import { User, ChevronRight, Loader2, NotebookPen, Sparkles } from "lucide-react"
import { useNutriStore } from "@/store/useNutriStore"
import { ScanResult } from "@/types"

// Components
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalorieRing } from "@/components/CalorieRing"
import { MacroCards } from "@/components/MacroCards"
import { MealCard, EmptyMealsState } from "@/components/MealCard"
import { QuickStats } from "@/components/QuickStats"
import { MealLogModal } from "@/components/MealLogModal"
import { ScanDetailModal } from "@/components/ScanDetailModal"
import { calculateLoggingStreak, getGreeting } from "@/lib/utils"

/**
 * Dashboard page component - the main landing view of the app.
 * Displays daily progress, macro breakdown, today's meals, and quick stats.
 */
export default function Dashboard(): React.JSX.Element | null {
  const navigate = useNavigate()
  const { 
    getTodayNutrition, 
    getGoalProgress, 
    dailyGoals, 
    scanHistory,
    userProfile,
    getTodayScans
  } = useNutriStore()

  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isMealLogOpen, setIsMealLogOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const todayNutrition = getTodayNutrition()
  const todayScans = getTodayScans()
  const goalProgress = getGoalProgress()

  const greeting = useMemo(() => getGreeting(), [])

  // Computed stats for QuickStats
  const streak = useMemo(() => calculateLoggingStreak(scanHistory), [scanHistory])

  const avgCalories = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now)
    const weekEnd = endOfWeek(now)
    
    const weekScans = scanHistory.filter(s => {
      const date = new Date(s.timestamp)
      return date >= weekStart && date <= weekEnd
    })
    
    if (weekScans.length === 0) return 0
    const total = weekScans.reduce((acc, s) => acc + s.totalNutrition.calories, 0)
    return total / 7 // Avg per day this week
  }, [scanHistory])

  const topNutrient = useMemo(() => {
    const progress = [
      { name: "Protein", val: goalProgress.protein },
      { name: "Carbs", val: goalProgress.carbs },
      { name: "Fat", val: goalProgress.fat },
    ]
    return progress.sort((a, b) => b.val - a.val)[0].name
  }, [goalProgress])

  const dailySignals = [
    {
      label: "Sugar",
      value: `${Math.round(todayNutrition.sugar)}g`,
      hint: `${Math.round((todayNutrition.sugar / 50) * 100)}% of 50g guide`,
      tone: "from-alert/10 text-alert",
    },
    {
      label: "Sodium",
      value: `${Math.round(todayNutrition.sodium)}mg`,
      hint: `${Math.round((todayNutrition.sodium / 2300) * 100)}% of 2300mg guide`,
      tone: "from-info/10 text-info",
    },
    {
      label: "Sat. Fat",
      value: `${Math.round(todayNutrition.saturatedFat)}g`,
      hint: `${Math.round((todayNutrition.saturatedFat / 20) * 100)}% of 20g guide`,
      tone: "from-accent/10 text-accent",
    },
  ]

  if (!isMounted || !userProfile || !dailyGoals) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12"
    >
      {/* 1. Greeting Header */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              {greeting}, {userProfile.name.split(' ')[0]}!
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {format(new Date(), "EEEE, MMMM do")}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm overflow-hidden">
            {userProfile.avatar ? (
              <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-6 h-6 text-primary" />
            )}
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-3 md:grid-cols-[1fr_auto]">
        <Button
          onClick={() => navigate("/scan")}
          className="h-14 rounded-2xl font-bold text-base"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Scan New Meal
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsMealLogOpen(true)}
          className="h-14 rounded-2xl font-bold text-base"
        >
          <NotebookPen className="mr-2 h-4 w-4" />
          Quick Log
        </Button>
      </motion.div>

      {/* 2. Daily Calorie Ring */}
      <motion.div variants={itemVariants}>
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm rounded-[32px] overflow-hidden">
          <CardContent className="p-0">
            <CalorieRing consumed={todayNutrition.calories} goal={dailyGoals.calories} />
          </CardContent>
        </Card>
      </motion.div>

      {/* 3. Macro Progress Bars */}
      <motion.div variants={itemVariants}>
        <MacroCards nutrition={todayNutrition} goals={dailyGoals} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm rounded-[32px]">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight">Today’s Nutrition Signals</h2>
                <p className="text-sm text-muted-foreground">Quick watchpoints from the additional data already stored with each scan.</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {dailySignals.map((signal) => (
                <div
                  key={signal.label}
                  className={`rounded-2xl border border-border/50 bg-gradient-to-br ${signal.tone} to-transparent p-4`}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{signal.label}</p>
                  <p className="mt-2 text-2xl font-black">{signal.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{signal.hint}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 4. Today's Meals Section */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black tracking-tight">Today's Meals</h2>
          <Link to="/history" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
            See all <ChevronRight size={14} />
          </Link>
        </div>

        <div className="space-y-3">
          {todayScans.length > 0 ? (
            todayScans.map((scan) => (
              <MealCard 
                key={scan.id} 
                scan={scan} 
                onClick={() => {
                  setSelectedScan(scan)
                  setIsDetailModalOpen(true)
                }}
              />
            ))
          ) : (
            <EmptyMealsState onScanClick={() => navigate("/scan")} />
          )}
        </div>
      </motion.div>

      {/* 5. Quick Stats Row */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-xl font-black tracking-tight px-2">Quick Stats</h2>
        <QuickStats 
          scansToday={todayScans.length}
          streak={streak}
          avgCalories={avgCalories}
          topNutrient={topNutrient}
        />
      </motion.div>

      <ScanDetailModal 
        scan={selectedScan} 
        open={isDetailModalOpen} 
        onOpenChange={setIsDetailModalOpen} 
      />
      <MealLogModal open={isMealLogOpen} onOpenChange={setIsMealLogOpen} />
    </motion.div>
  )
}
