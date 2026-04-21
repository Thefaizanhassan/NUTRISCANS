import { ThemeProvider } from "@/components/ThemeProvider"
import { Layout } from "@/components/Layout"
import * as React from "react"
import { Suspense, lazy } from "react"
import { Routes, Route } from "react-router-dom"
import { Loader2 } from "lucide-react"
import type { Session } from "@supabase/supabase-js"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { useNutriStore } from "@/store/useNutriStore"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import AuthPage from "@/pages/AuthPage"

// Lazy loaded pages
const Dashboard = lazy(() => import("@/pages/Dashboard"))
const ScanPage = lazy(() => import("@/pages/ScanPage"))
const HistoryPage = lazy(() => import("@/pages/HistoryPage"))
const ProfilePage = lazy(() => import("@/pages/ProfilePage"))
const InsightsPage = lazy(() => import("@/pages/InsightsPage"))
const ResultsPage = lazy(() => import("@/pages/ResultsPage"))

/**
 * Loading fallback component for lazy-loaded routes.
 */
function PageLoader() {
  return (
    <div className="flex h-[60vh] w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
    </div>
  )
}

/**
 * Main application component.
 * Sets up the theme provider, layout shell, and routing.
 */
export default function App(): React.JSX.Element {
  const hydrate = useNutriStore((state) => state.hydrate)
  const resetState = useNutriStore((state) => state.resetState)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        void hydrate()
      } else {
        resetState()
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        void hydrate()
      } else {
        resetState()
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [hydrate, resetState])

  if (loading) {
    return <PageLoader />
  }

  if (!session) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthPage />
      </ThemeProvider>
    )
  }

  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </Suspense>
        </Layout>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
