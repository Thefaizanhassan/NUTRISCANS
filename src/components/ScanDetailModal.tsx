import * as React from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useNutriStore } from "@/store/useNutriStore"
import { format } from "date-fns"
import { Trash2, Calendar, Clock, Info, X, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { ScanResult } from "@/types"
import { motion, useSpring, useTransform, animate, AnimatePresence } from "framer-motion"

interface ScanDetailModalProps {
  scan: ScanResult | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ScanDetailModal({ scan, open, onOpenChange }: ScanDetailModalProps) {
  const { deleteScan, dailyGoals } = useNutriStore()
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false)

  if (!scan) return null

  const handleDelete = () => {
    deleteScan(scan.id)
    toast.success("Scan deleted")
    onOpenChange(false)
    setIsConfirmingDelete(false)
  }

  const nutrition = scan.totalNutrition
  const confidence = scan.overallConfidence

  const goals = dailyGoals || {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    fibre: 30
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "bg-primary text-primary-foreground"
    if (score >= 50) return "bg-carbs text-white"
    return "bg-alert text-white"
  }

  const getConfidenceIcon = (score: number) => {
    if (score >= 80) return <CheckCircle2 className="w-3 h-3 mr-1" />
    if (score >= 50) return <AlertTriangle className="w-3 h-3 mr-1" />
    return <AlertCircle className="w-3 h-3 mr-1" />
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none bg-background sm:rounded-3xl h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col">
          {/* Mobile Close Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4 z-50 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 sm:hidden"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-5 h-5" />
          </Button>

          <div className="overflow-y-auto flex-1">
            <div className="aspect-video w-full relative">
              {scan.imageUrl ? (
                <img 
                  src={scan.imageUrl} 
                  alt="Scanned food" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <Info className="w-12 h-12 text-muted-foreground opacity-20" />
                </div>
              )}
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge className="bg-background/80 backdrop-blur-md text-foreground border-none rounded-full px-3 py-1 font-bold">
                  {scan.mealType.toUpperCase()}
                </Badge>
                <Badge className={`${getConfidenceColor(confidence)} border-none rounded-full px-3 py-1 font-bold flex items-center`}>
                  {getConfidenceIcon(confidence)}
                  {confidence}% Confidence
                </Badge>
              </div>
            </div>

            <div className="p-6 space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {scan.foodItems[0].name}
                    {scan.foodItems.length > 1 && ` +${scan.foodItems.length - 1} more`}
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(scan.timestamp), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(scan.timestamp), 'h:mm a')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <AnimatedNumber value={nutrition.calories} />
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Total kcal</p>
                </div>
              </div>

              {scan.contextText && (
                <div className="bg-surface/50 p-4 rounded-2xl border border-primary/10">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Your Context</p>
                  <p className="text-sm text-primary/80 italic">"{scan.contextText}"</p>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Macro Breakdown</h3>
                <div className="space-y-4">
                  <MacroProgress label="Protein" value={nutrition.protein} goal={goals.protein} color="bg-info" />
                  <MacroProgress label="Carbs" value={nutrition.carbs} goal={goals.carbs} color="bg-carbs" />
                  <MacroProgress label="Fat" value={nutrition.fat} goal={goals.fat} color="bg-accent" />
                  <MacroProgress label="Fibre" value={nutrition.fibre} goal={goals.fibre} color="bg-primary" />
                  <MacroProgress label="Sugar" value={nutrition.sugar} goal={25} color="bg-alert" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Identified Items</h3>
                <div className="divide-y divide-border">
                  {scan.foodItems.map((item) => (
                    <div key={item.id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.portionSize}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{item.nutrition.calories} kcal</p>
                        <p className="text-[10px] text-muted-foreground">{item.confidence}% match</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-background border-t border-border flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl text-alert hover:text-alert hover:bg-alert/10 border-alert/20" 
              onClick={() => setIsConfirmingDelete(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Scan
            </Button>
            <Button 
              className="flex-1 rounded-xl" 
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <DialogContent className="rounded-3xl max-w-[340px]">
          <DialogHeader>
            <DialogTitle>Delete Scan?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this scan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 mt-4">
            <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setIsConfirmingDelete(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1 rounded-xl bg-alert hover:bg-alert/90" onClick={handleDelete}>Delete</Button>
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
      onUpdate: (latest) => setDisplayValue(Math.round(latest))
    })
    return () => controls.stop()
  }, [value])

  return <p className="text-4xl font-black text-primary tabular-nums">{displayValue}</p>
}

function MacroProgress({ label, value, goal, color }: { label: string, value: number, goal: number, color: string }) {
  const percentage = Math.min(100, Math.round((value / goal) * 100))
  
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-muted-foreground">{label}</span>
        <span>{value}g <span className="text-muted-foreground font-medium">/ {goal}g ({percentage}%)</span></span>
      </div>
      <Progress value={percentage} className="h-1.5 bg-secondary" indicatorClassName={color} />
    </div>
  )
}
