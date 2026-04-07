"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { toast } from "sonner"

// Game constants
const CANVAS_WIDTH = 400
const CANVAS_HEIGHT = 150
const GROUND_Y = 120
const GRAVITY = 0.6
const JUMP_FORCE = -11
const OBSTACLE_SPEED = 3
const OBSTACLE_INTERVAL = 90 // frames

// Food-themed obstacle types
const OBSTACLES = [
  { emoji: "🥤", w: 20, h: 30 },
  { emoji: "📦", w: 25, h: 25 },
  { emoji: "🍕", w: 22, h: 22 },
  { emoji: "🥡", w: 20, h: 28 },
]

interface Obstacle {
  x: number
  w: number
  h: number
  emoji: string
}

export default function DinoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [gameState, setGameState] = useState<"idle" | "playing" | "over">("idle")
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const gameRef = useRef({
    dino: { y: GROUND_Y, vy: 0, jumping: false },
    obstacles: [] as Obstacle[],
    frame: 0,
    score: 0,
    running: false,
    hitMilestones: new Set<number>(),
  })

  // Audio context for sound effects
  const audioCtxRef = useRef<AudioContext | null>(null)

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    return audioCtxRef.current
  }

  // Jump sound — short rising boop
  const playJumpSound = useCallback(() => {
    try {
      const ctx = getAudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(400, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.12)
    } catch { /* audio unavailable */ }
  }, [])

  // Game over sound — descending buzz
  const playGameOverSound = useCallback(() => {
    try {
      const ctx = getAudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "square"
      osc.frequency.setValueAtTime(300, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.35)
    } catch { /* audio unavailable */ }
  }, [])

  // Milestone chime — two cheerful ascending notes
  const playMilestoneSound = useCallback(() => {
    try {
      const ctx = getAudioCtx()
      const now = ctx.currentTime
      ;[523, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.35, now + i * 0.12)
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.2)
        osc.connect(gain).connect(ctx.destination)
        osc.start(now + i * 0.12)
        osc.stop(now + i * 0.12 + 0.2)
      })
    } catch { /* audio unavailable */ }
  }, [])

  // Score milestones
  const MILESTONES = [100, 200, 500, 1000]
  const MILESTONE_MESSAGES: Record<number, string> = {
    100: "🔥 You're on fire! Score 100!",
    200: "⚡ Unstoppable! Score 200!",
    500: "🚀 Legendary! Score 500!",
    1000: "👑 GOD MODE! Score 1000!",
  }

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem("arf-dino-highscore")
    if (saved) setHighScore(parseInt(saved))
  }, [])

  // Intersection observer
  useEffect(() => {
    if (!containerRef.current) return
    const obs = new IntersectionObserver(
      ([e]) => setIsVisible(e.isIntersecting),
      { threshold: 0.1 }
    )
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  const jump = useCallback(() => {
    const g = gameRef.current
    if (gameState === "idle") {
      startGame()
      return
    }
    if (gameState === "over") return
    if (!g.dino.jumping) {
      g.dino.vy = JUMP_FORCE
      g.dino.jumping = true
      playJumpSound()
    }
  }, [gameState, playJumpSound])

  const startGame = useCallback(() => {
    const g = gameRef.current
    g.dino = { y: GROUND_Y, vy: 0, jumping: false }
    g.obstacles = []
    g.frame = 0
    g.score = 0
    g.running = true
    g.hitMilestones = new Set()
    setScore(0)
    setGameState("playing")
  }, [])

  // Handle input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault()
        jump()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [jump])

  // Game loop
  useEffect(() => {
    if (gameState !== "playing" || !isVisible) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number
    const g = gameRef.current

    const loop = () => {
      if (!g.running) return

      // Update dino
      g.dino.vy += GRAVITY
      g.dino.y += g.dino.vy
      if (g.dino.y >= GROUND_Y) {
        g.dino.y = GROUND_Y
        g.dino.vy = 0
        g.dino.jumping = false
      }

      // Spawn obstacles
      g.frame++
      if (g.frame % OBSTACLE_INTERVAL === 0) {
        const type = OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)]
        g.obstacles.push({
          x: CANVAS_WIDTH + 10,
          w: type.w,
          h: type.h,
          emoji: type.emoji,
        })
      }

      // Update obstacles
      const speed = OBSTACLE_SPEED + Math.floor(g.score / 200) * 0.5
      g.obstacles = g.obstacles.filter((o) => o.x > -40)
      for (const o of g.obstacles) {
        o.x -= speed
      }

      // Collision detection
      const dinoBox = { x: 30, y: g.dino.y - 24, w: 20, h: 24 }
      for (const o of g.obstacles) {
        const oBox = { x: o.x, y: GROUND_Y - o.h, w: o.w, h: o.h }
        if (
          dinoBox.x < oBox.x + oBox.w &&
          dinoBox.x + dinoBox.w > oBox.x &&
          dinoBox.y < oBox.y + oBox.h &&
          dinoBox.y + dinoBox.h > oBox.y
        ) {
          // Game over
          g.running = false
          setGameState("over")
          playGameOverSound()
          if (g.score > highScore) {
            setHighScore(g.score)
            localStorage.setItem("arf-dino-highscore", g.score.toString())
          }
          return
        }
      }

      // Score
      g.score++
      if (g.score % 5 === 0) setScore(g.score)

      // Check milestones
      for (const m of MILESTONES) {
        if (g.score >= m && !g.hitMilestones.has(m)) {
          g.hitMilestones.add(m)
          playMilestoneSound()
          toast.success(MILESTONE_MESSAGES[m], { duration: 2000 })
        }
      }

      // Draw
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Ground line
      ctx.strokeStyle = "hsl(35, 20%, 75%)"
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(0, GROUND_Y + 2)
      ctx.lineTo(CANVAS_WIDTH, GROUND_Y + 2)
      ctx.stroke()
      ctx.setLineDash([])

      // Ground dots (moving)
      ctx.fillStyle = "hsl(35, 20%, 80%)"
      for (let i = 0; i < 15; i++) {
        const dx = ((i * 35 + g.frame * 2) % (CANVAS_WIDTH + 10)) - 5
        ctx.fillRect(dx, GROUND_Y + 6 + Math.random() * 4, 2, 1)
      }

      // Draw dino (runner character) — flipped to face right
      const dinoX = 40
      const dinoY = g.dino.y
      ctx.save()
      ctx.translate(dinoX, dinoY)
      ctx.scale(-1, 1) // Flip horizontally so runner faces right
      ctx.font = "22px serif"
      ctx.textAlign = "center"
      const runFrame = Math.floor(g.frame / 6) % 2
      ctx.fillText(g.dino.jumping ? "🏃" : (runFrame === 0 ? "🏃" : "🚶"), 0, 0)
      ctx.restore()

      // Draw obstacles
      for (const o of g.obstacles) {
        ctx.font = `${Math.max(o.w, o.h)}px serif`
        ctx.textAlign = "center"
        ctx.fillText(o.emoji, o.x + o.w / 2, GROUND_Y)
      }

      // Clouds
      ctx.fillStyle = "hsl(0, 0%, 88%)"
      const cx1 = ((g.frame * 0.3) % 500) - 30
      ctx.beginPath()
      ctx.arc(cx1, 25, 10, 0, Math.PI * 2)
      ctx.arc(cx1 + 12, 22, 8, 0, Math.PI * 2)
      ctx.arc(cx1 + 24, 25, 10, 0, Math.PI * 2)
      ctx.fill()

      const cx2 = ((g.frame * 0.2 + 200) % 500) - 30
      ctx.beginPath()
      ctx.arc(cx2, 40, 8, 0, Math.PI * 2)
      ctx.arc(cx2 + 10, 37, 6, 0, Math.PI * 2)
      ctx.arc(cx2 + 20, 40, 8, 0, Math.PI * 2)
      ctx.fill()

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [gameState, isVisible, highScore])

  return (
    <div ref={containerRef} className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] text-muted-foreground font-medium">🎮 Play while you wait!</p>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-muted-foreground">
            Score: <strong className="text-foreground">{score}</strong>
          </span>
          <span className="text-muted-foreground">
            Best: <strong className="text-primary">{highScore}</strong>
          </span>
        </div>
      </div>

      <div
        className="relative rounded-xl overflow-hidden border border-border bg-card cursor-pointer select-none"
        onClick={jump}
        onTouchStart={(e) => {
          e.preventDefault()
          jump()
        }}
        role="button"
        tabIndex={0}
        aria-label="Jump - tap or press space"
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full"
          style={{ maxWidth: CANVAS_WIDTH, display: "block", margin: "0 auto" }}
        />

        {/* Overlay states */}
        {gameState === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm">
            <p className="text-lg font-bold mb-1">🏃 Dino Runner</p>
            <p className="text-xs text-muted-foreground mb-3">Dodge the food obstacles!</p>
            <button
              onClick={(e) => { e.stopPropagation(); startGame() }}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              Tap to Play
            </button>
          </div>
        )}

        {gameState === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm">
            <p className="text-lg font-bold text-red-400 mb-1">Game Over!</p>
            <p className="text-sm text-muted-foreground mb-0.5">Score: <strong className="text-foreground">{score}</strong></p>
            {score >= highScore && score > 0 && (
              <p className="text-xs text-primary font-semibold mb-2">🎉 New High Score!</p>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); startGame() }}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground/60 text-center mt-1.5">
        Tap or press Space to jump
      </p>
    </div>
  )
}
