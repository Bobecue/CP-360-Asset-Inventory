"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface InfiniteGridBackgroundProps {
  className?: string;
  cellSize?: number;
  duration?: number;
}

export function InfiniteGridBackground({
  className,
  cellSize = 40,
  duration = 20,
}: InfiniteGridBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute inset-0 -z-10 overflow-hidden pointer-events-none select-none",
        className
      )}
    >
      {/* Animated Grid Lines */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border) / 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border) / 0.08) 1px, transparent 1px)
          `,
          backgroundSize: `${cellSize}px ${cellSize}px`,
        }}
        animate={{
          backgroundPosition: ["0px 0px", `${cellSize}px ${cellSize}px`],
        }}
        transition={{
          duration,
          ease: "linear",
          repeat: Infinity,
        }}
      />

      {/* Radial gradient overlay mask to fade center and edges */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, hsl(var(--background) / 0.3) 0%, transparent 65%, hsl(var(--background)) 100%)`,
        }}
      />
    </div>
  );
}
