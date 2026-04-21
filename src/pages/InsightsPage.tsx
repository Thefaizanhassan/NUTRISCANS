import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TrendingUp, Target, Zap, Brain } from "lucide-react"

export default function InsightsPage() {
  return (
    <div className="space-y-8 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold tracking-tight">Nutrition Insights</h1>
        <p className="text-muted-foreground mt-1">
          AI-powered analysis of your eating habits and progress.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              AI Recommendations
            </CardTitle>
            <CardDescription>Personalized tips based on your recent scans</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <p className="text-sm font-medium">Increase Protein Intake</p>
              <p className="text-xs text-muted-foreground mt-1">You've been slightly under your protein goal this week. Try adding Greek yogurt or eggs to your breakfast.</p>
            </div>
            <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10">
              <p className="text-sm font-medium">Consistent Tracking</p>
              <p className="text-xs text-muted-foreground mt-1">Great job logging 3 meals a day! Consistency is key to accurate trend analysis.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-info" />
              Weight Trends
            </CardTitle>
            <CardDescription>Projected progress based on calorie deficit</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[160px]">
            <p className="text-sm text-muted-foreground italic">Chart data will appear after 7 days of consistent logging.</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-alert" />
              Goal Consistency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Calorie Goal Met</span>
              <span className="text-sm font-bold">5/7 days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Protein Goal Met</span>
              <span className="text-sm font-bold">4/7 days</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-carbs" />
              Energy Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your energy peaks are most consistent when you have a high-protein lunch.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
