"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  color,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  color?: "green" | "yellow" | "red"
}) {
  const getColor = () => {
    switch (color) {
      case "green": return "#10b981"
      case "yellow": return "#f59e0b"
      case "red": return "#ef4444"
      default: return "#10b981"
    }
  }

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 transition-all"
        style={{ 
          transform: `translateX(-${100 - (value || 0)}%)`,
          backgroundColor: getColor()
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
