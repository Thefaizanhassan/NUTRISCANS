import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { LayoutDashboard, Clock, Camera, TrendingUp, User, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const navItems = [
    { icon: LayoutDashboard, label: "Home", path: "/" },
    { icon: Clock, label: "History", path: "/history" },
    { icon: Camera, label: "Scan", path: "/scan", isCenter: true },
    { icon: TrendingUp, label: "Insights", path: "/insights" },
    { icon: User, label: "Profile", path: "/profile" },
  ]

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-[240px] fixed left-0 top-0 bottom-0 border-r border-border bg-card/50 backdrop-blur-xl z-50">
          <div className="p-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Camera className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-black text-xl tracking-tight">NutriScans</span>
            </Link>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon
              
              if (item.isCenter) {
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all mt-4 mb-6"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-bold">Scan Food</span>
                  </button>
                )
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group",
                    isActive 
                      ? "bg-primary/10 text-primary font-bold" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "text-primary")} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-border/50">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 rounded-2xl px-4 py-6"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 md:ml-[240px] min-h-screen relative">
          <div className="max-w-5xl mx-auto px-4 pt-6 pb-32 md:pb-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t-[0.5px] border-border/50 px-2 pb-safe-area-inset-bottom">
          <div className="flex items-center justify-around h-20 max-w-lg mx-auto relative">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon

              if (item.isCenter) {
                return (
                  <div key={item.path} className="relative -top-6">
                    <PulseRings />
                    <button
                      onClick={() => navigate(item.path)}
                      className="relative w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/40 active:scale-90 transition-transform z-10"
                    >
                      <Icon className="w-7 h-7" />
                    </button>
                  </div>
                )
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 w-16 h-full transition-all duration-200",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className={cn("w-6 h-6", isActive && "stroke-[2.5px]")} />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </TooltipProvider>
  )
}

function PulseRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-14 h-14 rounded-full bg-primary"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  )
}
