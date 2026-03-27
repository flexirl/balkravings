"use client"

/**
 * Morphing dots loader — used for route-level loading states.
 * Three dots bounce and morph from circles to rounded squares.
 */
export function DotLoader({ text = "Loading" }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="flex items-center gap-2.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3.5 h-3.5 bg-primary"
            style={{
              borderRadius: "50%",
              animation: `dotBounce 1.4s ease-in-out ${i * 0.16}s infinite, dotMorph 1.4s ease-in-out ${i * 0.16}s infinite`,
            }}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground tracking-wide animate-fade-in">
        {text}
      </p>
    </div>
  )
}
