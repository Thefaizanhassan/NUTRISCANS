import * as React from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Loader2, Mail, Lock, User as UserIcon } from "lucide-react"
import { toast } from "sonner"

export default function AuthPage() {
  const [mode, setMode] = React.useState<"signin" | "signup">("signin")
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isEmailLoading, setIsEmailLoading] = React.useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false)

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })
      if (error) throw error
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in")
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim() || !password) {
      toast.error("Enter your email and password")
      return
    }

    if (mode === "signup" && password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setIsEmailLoading(true)

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: name.trim() || undefined,
            },
          },
        })

        if (error) throw error

        if (data.session) {
          toast.success("Account created and signed in")
        } else {
          toast.success("Account created. Check your email to confirm your address.")
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) throw error
        toast.success("Signed in successfully")
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed")
    } finally {
      setIsEmailLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-primary/5 via-background to-background">
      <Card className="w-full max-w-md border-none shadow-2xl bg-card/50 backdrop-blur-xl rounded-[32px] overflow-hidden">
        <CardHeader className="text-center pt-12 pb-8">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/20 rotate-3">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tight">Nutri Scans</CardTitle>
          <CardDescription className="text-base font-medium">
            Your AI-powered nutrition companion
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-12 space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-center text-muted-foreground px-4">
              Create an account or sign in with email to track meals, set goals, and sync your nutrition history.
            </p>

            <Tabs value={mode} onValueChange={(value) => setMode(value as typeof mode)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-2xl">
                <TabsTrigger value="signin" className="rounded-xl font-semibold">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-xl font-semibold">Sign Up</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    className="h-12 rounded-2xl pl-10"
                    autoComplete="name"
                    disabled={isEmailLoading || isGoogleLoading}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="h-12 rounded-2xl pl-10"
                  autoComplete="email"
                  disabled={isEmailLoading || isGoogleLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                  className="h-12 rounded-2xl pl-10"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  disabled={isEmailLoading || isGoogleLoading}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isEmailLoading || isGoogleLoading}
              className="w-full h-12 rounded-2xl font-bold text-base"
            >
              {isEmailLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {mode === "signup" ? "Create Account" : "Sign In with Email"}
            </Button>
          </form>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Or continue with
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button 
              onClick={handleGoogleLogin} 
              disabled={isEmailLoading || isGoogleLoading}
              variant="outline"
              className="w-full h-14 rounded-2xl bg-white text-black hover:bg-white/90 border border-border shadow-sm font-bold text-lg flex items-center justify-center gap-3"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              {isGoogleLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Continue with Google"
              )}
            </Button>
          </div>
          
          <div className="pt-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Secure authentication via Supabase
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              If email confirmation is enabled in Supabase, new users will need to verify their email before signing in.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
