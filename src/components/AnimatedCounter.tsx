import * as React from "react"
import { motion, useMotionValue, useTransform, animate } from "motion/react"

interface AnimatedCounterProps {
  value: number
  duration?: number
}

export function AnimatedCounter({ value, duration = 1.5 }: AnimatedCounterProps) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest))

  React.useEffect(() => {
    const controls = animate(count, value, { duration })
    return () => controls.stop()
  }, [count, value, duration])

  return <motion.span>{rounded}</motion.span>
}
