"use client"

export default function GlobalLoading() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
      style={{ minHeight: "100vh" }}
    >
      {/* Radial glow behind logo */}
      <div
        className="absolute rounded-full"
        style={{
          width: 200,
          height: 200,
          background:
            "radial-gradient(circle, hsl(0 72% 40% / 0.25) 0%, transparent 70%)",
          animation: "radialGlow 2.4s ease-in-out infinite",
        }}
      />

      {/* Brand text — pulsing */}
      <div
        className="relative flex flex-col items-center"
        style={{ animation: "logoPulse 2.4s ease-in-out infinite" }}
      >
        <span
          className="text-primary font-[family-name:var(--font-galindo)] text-5xl sm:text-6xl tracking-wide select-none"
        >
          KRAVINGS
        </span>
        <span
          className="text-primary/70 font-[family-name:var(--font-galindo)] text-lg sm:text-xl tracking-[0.35em] select-none -mt-1"
        >
          by ARF
        </span>
      </div>

      {/* Subtle tagline */}
      <p
        className="mt-6 text-sm text-muted-foreground animate-fade-in tracking-wide"
      >
        Preparing your feast…
      </p>
    </div>
  )
}
