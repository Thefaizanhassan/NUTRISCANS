import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Search, Filter, ArrowUpRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useNutriStore } from "@/store/useNutriStore"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { ScanDetailModal } from "@/components/ScanDetailModal"
import { ScanResult } from "@/types"

export default function HistoryPage() {
  const navigate = useNavigate()
  const { scanHistory } = useNutriStore()
  const [search, setSearch] = useState("")
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const filteredHistory = scanHistory.filter(scan => 
    scan.foodItems.some(item => item.name.toLowerCase().includes(search.toLowerCase()))
  )

  const handleViewDetails = (scan: ScanResult) => {
    setSelectedScan(scan)
    setIsDetailOpen(true)
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold">Nutrition History</h1>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search meals..." 
                className="pl-9 rounded-full bg-card/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="rounded-full">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHistory.map((scan) => (
            <Card key={scan.id} className="border-none shadow-sm bg-card/50 backdrop-blur-sm hover:shadow-md transition-all group">
              <CardContent className="p-0">
                <div className="aspect-video relative overflow-hidden rounded-t-3xl">
                  {scan.imageUrl ? (
                    <img 
                      src={scan.imageUrl} 
                      alt={scan.foodItems[0].name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                      <Search className="w-12 h-12 text-muted-foreground opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-background/80 backdrop-blur-md text-foreground border-none rounded-full">
                      {scan.mealType}
                    </Badge>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg line-clamp-1">{scan.foodItems[0].name}</h3>
                      <p className="text-sm text-muted-foreground">{format(new Date(scan.timestamp), 'MMM d, yyyy • h:mm a')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{scan.totalNutrition.calories} kcal</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full font-normal">P: {scan.totalNutrition.protein}g</Badge>
                    <Badge variant="outline" className="rounded-full font-normal">C: {scan.totalNutrition.carbs}g</Badge>
                    <Badge variant="outline" className="rounded-full font-normal">F: {scan.totalNutrition.fat}g</Badge>
                  </div>

                  <Button 
                    variant="secondary" 
                    className="w-full rounded-xl group/btn"
                    onClick={() => handleViewDetails(scan)}
                  >
                    View Details
                    <ArrowUpRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredHistory.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground italic">No meals found matching your search.</p>
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
