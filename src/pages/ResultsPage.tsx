import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { useNutriStore } from "@/store/useNutriStore"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  Share2, 
  CheckCircle2, 
  RotateCcw, 
  Save, 
  Edit3, 
  Sparkles,
  Loader2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Components
import { AnimatedCounter } from "@/components/AnimatedCounter"
import { MacroDonut } from "@/components/MacroDonut"
import { NutrientBars } from "@/components/NutrientBars"
import { FoodItemList } from "@/components/FoodItemList"
import { deleteScanImage, getScanImageUrl, uploadScanImage } from "@/lib/supabase/api"

export default function ResultsPage() {
  const { currentScan, addScan, dailyGoals, setCurrentScan, userId } = useNutriStore()
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (!currentScan) {
      navigate("/scan")
    }
  }, [currentScan, navigate])

  if (!currentScan) return null

  const handleSave = async () => {
    if (isSaving) {
      return
    }

    if (!userId) {
      toast.error("User not authenticated")
      return
    }

    setIsSaving(true)
    let imageStoragePath: string | undefined

    try {
      let imageUrl = currentScan.imageUrl

      if (imageUrl.startsWith("data:")) {
        const file = await dataUrlToFile(imageUrl)
        imageStoragePath = await uploadScanImage(userId, file)
        imageUrl = getScanImageUrl(imageStoragePath)
      }

      await addScan({
        userId,
        imageUrl,
        imageStoragePath,
        contextText: currentScan.contextText,
        mealType: currentScan.mealType,
        modelUsed: currentScan.modelUsed,
        isManualEntry: currentScan.isManualEntry,
        processingTimeMs: currentScan.processingTimeMs ?? undefined,
        rawAiResponse: currentScan.rawAiResponse ?? null,
        foodItems: currentScan.foodItems.map(item => ({
          name: item.name,
          portionSize: item.portionSize,
          portionGrams: item.portionGrams,
          nutrition: item.nutrition,
          confidence: item.confidence,
        })),
        totalNutrition: currentScan.totalNutrition,
        overallConfidence: currentScan.overallConfidence,
      })

      setCurrentScan(null)
      navigate("/")
    } catch (error) {
      if (imageStoragePath) {
        try {
          await deleteScanImage(imageStoragePath)
        } catch (cleanupError) {
          console.warn("Failed to clean up uploaded image after save error:", cleanupError)
        }
      }
      console.error("Failed to save scan:", error)
      toast.error("Failed to save scan. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const goals = dailyGoals || {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    fibre: 30
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "bg-primary text-white"
    if (score >= 50) return "bg-yellow-500 text-white"
    return "bg-red-500 text-white"
  }

  const handleRescan = () => {
    setCurrentScan(null)
    navigate("/scan")
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* 1. Hero Image + Confidence Badge */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative h-[240px] w-full overflow-hidden rounded-b-[40px] shadow-xl z-10"
      >
        <img 
          src={currentScan.imageUrl} 
          alt="Meal" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
          <button 
            onClick={handleRescan}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all">
            <Share2 size={20} />
          </button>
        </div>

        <div className="absolute bottom-6 left-6">
          <Badge className="bg-white/20 backdrop-blur-md text-white border-none px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[10px]">
            {currentScan.mealType}
          </Badge>
        </div>

        <div className="absolute bottom-6 right-6">
          <Badge className={cn(
            "border-none px-4 py-1.5 rounded-full font-black shadow-lg flex items-center gap-1.5",
            getConfidenceColor(currentScan.overallConfidence)
          )}>
            <CheckCircle2 size={12} />
            {Math.round(currentScan.overallConfidence)}% Confident
          </Badge>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-6 pt-8 space-y-10"
      >
        {/* 2. Total Calories (Animated Counter) */}
        <motion.div variants={itemVariants} className="text-center space-y-1">
          <div className="text-6xl font-black tracking-tighter text-primary">
            <AnimatedCounter value={currentScan.totalNutrition.calories} />
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Total Estimated Calories</p>
        </motion.div>

        {/* 3. Macro Donut Chart */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Macro Distribution</h3>
          <div className="bg-card/30 backdrop-blur-sm rounded-[32px] p-6 border border-border/50">
            <MacroDonut nutrition={currentScan.totalNutrition} />
          </div>
        </motion.div>

        {/* 4. Macro Detail Bars */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Daily Goal Progress</h3>
          <div className="bg-card/30 backdrop-blur-sm rounded-[32px] p-6 border border-border/50">
            <NutrientBars nutrition={currentScan.totalNutrition} goals={goals} />
          </div>
        </motion.div>

        {/* 5. Identified Food Items */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Identified Items</h3>
          <FoodItemList items={currentScan.foodItems} />
        </motion.div>

        {/* 6. Context Used */}
        {currentScan.contextText && (
          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">AI Context Adjustments</h3>
            <div className="bg-primary/5 rounded-3xl p-5 border border-primary/10 flex gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                <Sparkles className="text-primary w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-primary/60 uppercase tracking-wider">Your Input</p>
                <p className="text-sm font-medium italic text-primary/80">"{currentScan.contextText}"</p>
                <p className="text-[10px] font-bold text-primary/40 mt-2">AI adjusted estimates based on your details</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* 7. Action Buttons (Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent z-40">
        <div className="max-w-lg mx-auto space-y-3">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRescan}
              className="flex-1 h-14 rounded-2xl font-bold border-border/50 bg-card/50 backdrop-blur-md"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Rescan
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-14 rounded-2xl font-bold border-border/50 bg-card/50 backdrop-blur-md"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-16 rounded-2xl bg-primary text-white font-black text-lg shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            {isSaving ? "Saving..." : "Save to Log"}
          </Button>
        </div>
      </div>
    </div>
  )
}

async function dataUrlToFile(dataUrl: string): Promise<File> {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  const extension = blob.type.split("/")[1] || "jpg"

  return new File([blob], `scan-${Date.now()}.${extension}`, {
    type: blob.type || "image/jpeg",
  })
}
