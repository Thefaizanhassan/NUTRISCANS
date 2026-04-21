import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Sparkles } from "lucide-react"

interface ScanningOverlayProps {
  isVisible: boolean
}

export function ScanningOverlay({ isVisible }: ScanningOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm overflow-hidden"
        >
          {/* Scanning Line */}
          <motion.div
            initial={{ top: "0%" }}
            animate={{ top: "100%" }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_20px_rgba(29,158,117,0.8)] z-10"
          />

          <div className="relative z-20 flex flex-col items-center gap-6">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30"
              >
                <Sparkles className="w-10 h-10 text-primary" />
              </motion.div>
              
              {/* Spinning Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 border-2 border-dashed border-primary/40 rounded-full"
              />
            </div>

            <div className="text-center space-y-2">
              <motion.h3
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-white font-black text-xl tracking-tight"
              >
                Analyzing your meal...
              </motion.h3>
              <p className="text-white/60 text-xs font-medium tracking-wide uppercase">
                AI is identifying ingredients
              </p>
            </div>

            {/* Progress Dots */}
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  className="w-2 h-2 bg-primary rounded-full"
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
