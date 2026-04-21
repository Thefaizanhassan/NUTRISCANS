import * as React from "react"
import { animate } from "framer-motion"
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  Info,
  PencilLine,
  Sparkles,
  TimerReset,
  Trash2,
  X,
} from "lucide-react"
import { format } from "date-fns"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useNutriStore } from "@/store/useNutriStore"
import type { ScanResult } from "@/types"
import { formatProcessingTime } from "@/lib/utils"

interface ScanDetailModalProps {
  scan: ScanResult | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ScanDetailModal({ scan, open, onOpenChange }: ScanDetailModalProps) {
  const { deleteScan, dailyGoals } = useNutriStore()
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  if (!scan) return null

  const nutrition = scan.totalNutrition
  const confidence = scan.overallConfidence
  const goals = dailyGoals || {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    fibre: 30,
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      await deleteScan(scan.id)
      onOpenChange(false)
      setIsConfirmingDelete(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const metaRows = [
    {
      label: "Entry source",
      value: scan.isManualEntry ? "Manual log" : "AI analysis",
      icon: scan.isManualEntry ? PencilLine : Sparkles,
    },
    {
      label: "Model",
      value: scan.modelUsed || "Unknown",
      icon: Cpu,
    },
    {
      label: "Processing time",
      value: formatProcessingTime(scan.processingTimeMs) ?? "Not captured",
      icon: TimerReset,
    },
  ]

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[100dvh] flex-col overflow-hidden border-none bg-background p-0 sm:h-auto sm:max-h-[90vh] sm:max-w-[680px] sm:rounded-3xl">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 z-50 rounded-full bg-black/20 text-white backdrop-blur-md hover:bg-black/40 sm:hidden"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="flex-1 overflow-y-auto">
            <div className="relative aspect-video w-full">
              {scan.imageUrl ? (
                <img
                  src={scan.imageUrl}
                  alt="Scanned food"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-secondary">
                  <Info className="h-12 w-12 text-muted-foreground opacity-20" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <Badge className="rounded-full border-none bg-background/80 px-3 py-1 font-bold text-foreground backdrop-blur-md">
                  {scan.mealType.toUpperCase()}
                </Badge>
                <Badge className={`${getConfidenceColor(confidence)} rounded-full border-none px-3 py-1 font-bold`}>
                  {getConfidenceIcon(confidence)}
                  {Math.round(confidence)}% Confidence
                </Badge>
                <Badge variant="outline" className="rounded-full bg-background/70 text-foreground backdrop-blur-md">
                  {scan.isManualEntry ? "Manual Entry" : "AI Scan"}
                </Badge>
              </div>
            </div>

            <div className="space-y-8 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {scan.foodItems[0]?.name ?? "Meal entry"}
                    {scan.foodItems.length > 1 && ` +${scan.foodItems.length - 1} more`}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(scan.timestamp), "MMM d, yyyy")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(scan.timestamp), "h:mm a")}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <AnimatedNumber value={nutrition.calories} />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total kcal</p>
                </div>
              </div>

              {scan.contextText ? (
                <div className="rounded-2xl border border-primary/10 bg-surface/50 p-4">
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">Your Context</p>
                  <p className="text-sm italic text-primary/80">"{scan.contextText}"</p>
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-3">
                {metaRows.map((row) => (
                  <div key={row.label} className="rounded-2xl border border-border/50 bg-card/40 p-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <row.icon className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{row.label}</span>
                    </div>
                    <p className="mt-3 text-sm font-bold">{row.value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Nutrition Progress</h3>
                <div className="space-y-4">
                  <MacroProgress label="Protein" value={nutrition.protein} goal={goals.protein} color="bg-info" />
                  <MacroProgress label="Carbs" value={nutrition.carbs} goal={goals.carbs} color="bg-carbs" />
                  <MacroProgress label="Fat" value={nutrition.fat} goal={goals.fat} color="bg-accent" />
                  <MacroProgress label="Fibre" value={nutrition.fibre} goal={goals.fibre} color="bg-primary" />
                  <MacroProgress label="Sugar" value={nutrition.sugar} goal={50} color="bg-alert" />
                  <MacroProgress label="Sodium" value={nutrition.sodium} goal={2300} color="bg-slate-400" unit="mg" />
                  <MacroProgress label="Saturated Fat" value={nutrition.saturatedFat} goal={20} color="bg-amber-500" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Identified Items</h3>
                <div className="divide-y divide-border">
                  {scan.foodItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-bold text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.portionSize}
                          {item.portionGrams ? ` • ${Math.round(item.portionGrams)}g` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{Math.round(item.nutrition.calories)} kcal</p>
                        <p className="text-[10px] text-muted-foreground">{Math.round(item.confidence)}% match</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 border-t border-border bg-background p-6">
            <Button
              variant="outline"
              className="flex-1 rounded-xl border-alert/20 text-alert hover:bg-alert/10 hover:text-alert"
              onClick={() => setIsConfirmingDelete(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Scan
            </Button>
            <Button className="flex-1 rounded-xl" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <DialogContent className="max-w-[340px] rounded-3xl">
          <DialogHeader>
            <DialogTitle>Delete Scan?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this scan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex-row gap-2">
            <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setIsConfirmingDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl bg-alert hover:bg-alert/90"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = React.useState(0)

  React.useEffect(() => {
    const controls = animate(0, value, {
      duration: 1,
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    })

    return () => controls.stop()
  }, [value])

  return <p className="text-4xl font-black tabular-nums text-primary">{displayValue}</p>
}

function MacroProgress({
  label,
  value,
  goal,
  color,
  unit = "g",
}: {
  label: string
  value: number
  goal: number
  color: string
  unit?: string
}) {
  const percentage = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-muted-foreground">{label}</span>
        <span>
          {Math.round(value)}
          {unit} <span className="font-medium text-muted-foreground">/ {goal}{unit} ({percentage}%)</span>
        </span>
      </div>
      <Progress value={percentage} className="h-1.5 bg-secondary" indicatorClassName={color} />
    </div>
  )
}

function getConfidenceColor(score: number) {
  if (score >= 80) return "bg-primary text-primary-foreground"
  if (score >= 50) return "bg-carbs text-white"
  return "bg-alert text-white"
}

function getConfidenceIcon(score: number) {
  if (score >= 80) return <CheckCircle2 className="mr-1 h-3 w-3" />
  if (score >= 50) return <AlertTriangle className="mr-1 h-3 w-3" />
  return <AlertCircle className="mr-1 h-3 w-3" />
}
