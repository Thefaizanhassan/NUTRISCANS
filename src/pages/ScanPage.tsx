import * as React from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import { toast } from "sonner"
import { useNutriStore } from "@/store/useNutriStore"
import { MOCK_SCANS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

// Components
import { ImageCapture } from "@/components/ImageCapture"
import { ContextInput } from "@/components/ContextInput"
import { MealTypeSelector } from "@/components/MealTypeSelector"
import { ScanningOverlay } from "@/components/ScanningOverlay"

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export default function ScanPage() {
  const navigate = useNavigate()
  const { setScanning, isScanning, setCurrentScan, userId } = useNutriStore()
  
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null)
  const [context, setContext] = React.useState("")
  const [mealType, setMealType] = React.useState<MealType>('breakfast')

  // Auto-select meal type based on time
  React.useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 11) setMealType('breakfast')
    else if (hour >= 11 && hour < 16) setMealType('lunch')
    else if (hour >= 16 && hour < 22) setMealType('dinner')
    else setMealType('snack')
  }, [])

  const handleAnalyze = async () => {
    if (!selectedImage || !userId) return
    
    setScanning(true)
    const analysisStartedAt = performance.now()
    
    try {
      // Simulate AI analysis delay. Replace this with the real model call when available.
      await new Promise(resolve => setTimeout(resolve, 2800))
      
      const randomMock = MOCK_SCANS[Math.floor(Math.random() * MOCK_SCANS.length)]
      const processingTimeMs = Math.round(performance.now() - analysisStartedAt)

      setCurrentScan({
        ...randomMock,
        id: crypto.randomUUID(),
        imageUrl: selectedImage,
        mealType,
        contextText: context,
        timestamp: new Date(),
        isManualEntry: false,
        processingTimeMs,
        rawAiResponse: {
          source: "mock-analysis",
          analyzedAt: new Date().toISOString(),
          mealType,
          context: context || null,
        },
      })

      toast.success("Analysis complete!")
      navigate("/results")
    } catch (error) {
      console.error("Analysis failed:", error)
      toast.error("Failed to analyze image. Please try again.")
    } finally {
      setScanning(false)
    }
  }

  const handleImageSelect = (image: string | null) => {
    setSelectedImage(image)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 p-6 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white pointer-events-auto hover:bg-black/40 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 pointer-events-auto">
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Viewfinder Mode</span>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* 1. Camera/Upload Area */}
      <div className="relative">
        <ImageCapture 
          selectedImage={selectedImage} 
          onImageSelect={handleImageSelect} 
        />
        <ScanningOverlay isVisible={isScanning} />
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-background rounded-t-[32px] -mt-8 relative z-20 pt-10 pb-32 space-y-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* 2. Context Input */}
          <ContextInput 
            value={context} 
            onChange={setContext} 
          />

          {/* 3. Meal Type Selector */}
          <MealTypeSelector 
            value={mealType} 
            onChange={setMealType} 
          />
        </motion.div>
      </div>

      {/* 4. Analyze Button (Fixed at bottom) */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent z-40">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleAnalyze}
            disabled={!selectedImage || isScanning}
            className={cn(
              "w-full h-16 rounded-2xl text-lg font-black tracking-tight transition-all duration-300 shadow-xl",
              selectedImage 
                ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-primary/30 hover:scale-[1.02] active:scale-95" 
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isScanning ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6" />
                <span>Analyze Nutrition</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
