import { useState } from "react"
import { format } from "date-fns"
import { ArrowLeft, ArrowUpRight, PencilLine, Search, Sparkles } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { ScanDetailModal } from "@/components/ScanDetailModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useNutriStore } from "@/store/useNutriStore"
import type { MealType, ScanResult } from "@/types"

export default function HistoryPage() {
  const navigate = useNavigate()
  const { scanHistory } = useNutriStore()
  const [search, setSearch] = useState("")
  const [mealFilter, setMealFilter] = useState<"all" | MealType>("all")
  const [entryFilter, setEntryFilter] = useState<"all" | "manual" | "ai">("all")
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const filteredHistory = scanHistory.filter((scan) => {
    const query = search.toLowerCase()
    const matchesSearch =
      scan.foodItems.some((item) => item.name.toLowerCase().includes(query)) ||
      scan.contextText?.toLowerCase().includes(query) ||
      scan.modelUsed.toLowerCase().includes(query)

    const matchesMeal = mealFilter === "all" || scan.mealType === mealFilter
    const matchesEntry =
      entryFilter === "all" ||
      (entryFilter === "manual" ? scan.isManualEntry : !scan.isManualEntry)

    return matchesSearch && matchesMeal && matchesEntry
  })

  const manualEntries = scanHistory.filter((scan) => scan.isManualEntry).length
  const averageConfidence =
    scanHistory.length > 0
      ? Math.round(scanHistory.reduce((total, scan) => total + scan.overallConfidence, 0) / scanHistory.length)
      : 0

  const handleViewDetails = (scan: ScanResult) => {
    setSelectedScan(scan)
    setIsDetailOpen(true)
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold">Nutrition History</h1>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search meals, context, or model..."
              className="rounded-full bg-card/50 pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <SummaryCard label="Total Scans" value={scanHistory.length.toString()} />
          <SummaryCard label="Manual Entries" value={manualEntries.toString()} />
          <SummaryCard label="Avg Confidence" value={`${averageConfidence}%`} />
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(["all", "breakfast", "lunch", "dinner", "snack"] as const).map((mealType) => (
              <Button
                key={mealType}
                variant={mealFilter === mealType ? "default" : "outline"}
                className="rounded-full capitalize"
                onClick={() => setMealFilter(mealType)}
              >
                {mealType === "all" ? "All Meals" : mealType}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {([
              { value: "all", label: "All Entries" },
              { value: "ai", label: "AI Scans" },
              { value: "manual", label: "Manual Logs" },
            ] as const).map((filter) => (
              <Button
                key={filter.value}
                variant={entryFilter === filter.value ? "secondary" : "outline"}
                className="rounded-full"
                onClick={() => setEntryFilter(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredHistory.map((scan) => (
            <Card key={scan.id} className="group border-none bg-card/50 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
              <CardContent className="p-0">
                <div className="relative aspect-video overflow-hidden rounded-t-3xl">
                  {scan.imageUrl ? (
                    <img
                      src={scan.imageUrl}
                      alt={scan.foodItems[0]?.name ?? "Meal"}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary">
                      <Search className="h-12 w-12 text-muted-foreground opacity-20" />
                    </div>
                  )}

                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <Badge className="rounded-full border-none bg-background/80 text-foreground backdrop-blur-md">
                      {scan.mealType}
                    </Badge>
                    <Badge variant="outline" className="rounded-full bg-background/70 backdrop-blur-md">
                      {scan.isManualEntry ? (
                        <>
                          <PencilLine className="mr-1 h-3 w-3" />
                          Manual
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-1 h-3 w-3" />
                          AI
                        </>
                      )}
                    </Badge>
                  </div>

                  <div className="absolute right-3 top-3">
                    <Badge className="rounded-full border-none bg-primary/90 text-primary-foreground">
                      {Math.round(scan.overallConfidence)}%
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="line-clamp-1 text-lg font-bold">{scan.foodItems[0]?.name ?? "Meal entry"}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(scan.timestamp), "MMM d, yyyy • h:mm a")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {scan.isManualEntry ? "Logged manually" : scan.modelUsed}
                      </p>
                    </div>
                    <p className="text-right font-bold text-primary">{Math.round(scan.totalNutrition.calories)} kcal</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-full font-normal">
                      P: {Math.round(scan.totalNutrition.protein)}g
                    </Badge>
                    <Badge variant="outline" className="rounded-full font-normal">
                      C: {Math.round(scan.totalNutrition.carbs)}g
                    </Badge>
                    <Badge variant="outline" className="rounded-full font-normal">
                      F: {Math.round(scan.totalNutrition.fat)}g
                    </Badge>
                    <Badge variant="outline" className="rounded-full font-normal">
                      Na: {Math.round(scan.totalNutrition.sodium)}mg
                    </Badge>
                  </div>

                  <Button
                    variant="secondary"
                    className="w-full rounded-xl group/btn"
                    onClick={() => handleViewDetails(scan)}
                  >
                    View Details
                    <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredHistory.length === 0 && (
          <div className="py-20 text-center">
            <p className="italic text-muted-foreground">No meals found matching your filters.</p>
          </div>
        )}
      </div>

      <ScanDetailModal
        scan={selectedScan}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-none bg-card/50 shadow-sm">
      <CardContent className="p-5">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-black">{value}</p>
      </CardContent>
    </Card>
  )
}
