import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  r: number
  g: number
  b: number
  baseAlpha: number
  phase: number
  phaseSpeed: number
}

interface LineData {
  x1: number
  y1: number
  x2: number
  y2: number
  alpha: number
  width: number
  r: number
  g: number
  b: number
}

const PALETTE: [number, number, number][] = [
  [167, 139, 250],  // violet-400
  [139, 92, 246],   // violet-500
  [99, 102, 241],   // indigo-500
  [196, 181, 253],  // violet-300
  [129, 140, 248],  // indigo-400
  [216, 180, 254],  // purple-300
]

const COUNT = 90
const DEPTH = 600
const CONNECT_DIST = 160
const FOV = 500

export default function AnimatedBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function rand(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const particles: Particle[] = Array.from({ length: COUNT }, () => {
      const [r, g, b] = PALETTE[Math.floor(Math.random() * PALETTE.length)]
      return {
        x: rand(-900, 900),
        y: rand(-650, 650),
        z: rand(-DEPTH / 2, DEPTH / 2),
        vx: rand(-0.28, 0.28),
        vy: rand(-0.28, 0.28),
        vz: rand(-0.18, 0.18),
        r, g, b,
        baseAlpha: rand(0.45, 0.95),
        phase: rand(0, Math.PI * 2),
        phaseSpeed: rand(0.008, 0.025),
      }
    })

    function project(x: number, y: number, z: number) {
      const scale = FOV / (FOV + z + DEPTH * 0.5)
      return {
        sx: canvas!.width / 2 + x * scale,
        sy: canvas!.height / 2 + y * scale,
        scale,
      }
    }

    function tick() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      // update
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.z += p.vz
        p.phase += p.phaseSpeed
        if (p.x > 750 || p.x < -750) p.vx *= -1
        if (p.y > 550 || p.y < -550) p.vy *= -1
        if (p.z > DEPTH / 2 || p.z < -DEPTH / 2) p.vz *= -1
      }

      // project all
      const proj = particles.map(p => ({ ...project(p.x, p.y, p.z), p }))

      // 收集所有連線資料，之後分組一次 stroke（減少 ctx state 切換）
      const lines: LineData[] = []

      for (let i = 0; i < proj.length; i++) {
        for (let j = i + 1; j < proj.length; j++) {
          const dx = proj[i].sx - proj[j].sx
          const dy = proj[i].sy - proj[j].sy
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONNECT_DIST) {
            const proximity = 1 - dist / CONNECT_DIST
            const avgScale = (proj[i].scale + proj[j].scale) / 2
            const alpha = proximity * proximity * 0.5 * avgScale * 2.5
            const { r, g, b } = proj[i].p
            lines.push({
              x1: proj[i].sx, y1: proj[i].sy,
              x2: proj[j].sx, y2: proj[j].sy,
              alpha,
              width: proximity * 1.2,
              r, g, b,
            })
          }
        }
      }

      // 按透明度分 3 組，每組一次 stroke
      const HIGH = lines.filter(l => l.alpha > 0.15)
      const MID  = lines.filter(l => l.alpha > 0.07 && l.alpha <= 0.15)
      const LOW  = lines.filter(l => l.alpha <= 0.07)

      for (const group of [HIGH, MID, LOW]) {
        if (group.length === 0) continue
        ctx!.beginPath()
        for (const l of group) {
          ctx!.moveTo(l.x1, l.y1)
          ctx!.lineTo(l.x2, l.y2)
        }
        const sample = group[Math.floor(group.length / 2)]
        ctx!.strokeStyle = `rgba(${sample.r},${sample.g},${sample.b},${sample.alpha})`
        ctx!.lineWidth = sample.width
        ctx!.stroke()
      }

      // draw particles（使用 shadowBlur 取代 radialGradient，減少 GC 壓力）
      for (const { sx, sy, scale, p } of proj) {
        const pulse = 0.7 + 0.3 * Math.sin(p.phase)
        const alpha = p.baseAlpha * pulse * Math.min(scale * 2, 1)
        const radius = Math.max(1.4, scale * 6)

        ctx!.save()
        ctx!.shadowBlur = radius * 8
        ctx!.shadowColor = `rgba(${p.r},${p.g},${p.b},${alpha * 0.8})`
        ctx!.beginPath()
        ctx!.arc(sx, sy, radius, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`
        ctx!.fill()
        ctx!.restore()
      }

      animId = requestAnimationFrame(tick)
    }

    tick()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      role="presentation"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.65 }}
    />
  )
}
