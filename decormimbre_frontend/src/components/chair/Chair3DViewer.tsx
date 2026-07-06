import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei'
import * as THREE from 'three'

// ── Wicker texture generator ──────────────────────────────────────────────────
function makeWickerTexture(hex: string): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const dk = (n: number, a: number) => Math.max(0, n - a)
  const lt = (n: number, a: number) => Math.min(255, n + a)

  ctx.fillStyle = `rgb(${r},${g},${b})`
  ctx.fillRect(0, 0, size, size)

  const step = 18
  for (let y = 0; y < size; y += step * 2) {
    ctx.fillStyle = `rgb(${dk(r, 50)},${dk(g, 50)},${dk(b, 50)})`
    ctx.fillRect(0, y, size, step - 3)
    ctx.fillStyle = `rgb(${lt(r, 32)},${lt(g, 32)},${lt(b, 32)})`
    ctx.fillRect(0, y + step, size, step - 3)
  }
  for (let x = 0; x < size; x += step) {
    const even = Math.floor(x / step) % 2 === 0
    ctx.fillStyle = `rgb(${lt(r, 22)},${lt(g, 22)},${lt(b, 22)})`
    ctx.fillRect(x, even ? 0 : step, step - 4, size)
    ctx.fillStyle = `rgb(${dk(r, 32)},${dk(g, 32)},${dk(b, 32)})`
    for (let ky = even ? 0 : step; ky < size; ky += step * 2) {
      ctx.beginPath()
      ctx.arc(x + (step - 4) / 2, ky + step / 2, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(4, 4)
  return tex
}

function safeHex(c: string) {
  return c.startsWith('#') && c.length === 7 ? c : '#C4A882'
}

type WP = { map: THREE.CanvasTexture; color: string; roughness: number; metalness: number }
type FP = { color: string; roughness: number; metalness: number }

// ── SILLA ORBITAL ─────────────────────────────────────────────────────────────
// Silla tipo nido: gran esfera cóncava como asiento/respaldo + base en arco
function SillaOrbital({ wp, fp }: { wp: WP; fp: FP }) {
  // Approximate curved arc legs using 4 cylinder segments per leg
  const legSegments = (side: number) => {
    const segs: { pos: [number, number, number]; rot: [number, number, number]; len: number }[] = []
    const n = 4
    for (let i = 0; i < n; i++) {
      const t0 = (i / n) * Math.PI
      const t1 = ((i + 1) / n) * Math.PI
      const x0 = Math.sin(t0) * 0.26 * side
      const y0 = -Math.cos(t0) * 0.26 - 0.56
      const x1 = Math.sin(t1) * 0.26 * side
      const y1 = -Math.cos(t1) * 0.26 - 0.56
      const dx = x1 - x0, dy = y1 - y0
      const len = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dx, dy)
      segs.push({ pos: [(x0 + x1) / 2, (y0 + y1) / 2, 0], rot: [0, 0, -angle], len })
    }
    return segs
  }

  return (
    <group>
      {/* Main spherical bowl — wicker shell */}
      <mesh position={[0, 0.15, 0.04]} rotation={[0.12, 0, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.66, 36, 32, 0, Math.PI * 2, 0, Math.PI * 0.76]} />
        <meshStandardMaterial {...wp} side={THREE.DoubleSide} />
      </mesh>
      {/* Outer rim ring */}
      <mesh position={[0, 0.15, 0.04]} rotation={[0.12, 0, 0]}>
        <torusGeometry args={[0.66, 0.03, 14, 64]} />
        <meshStandardMaterial {...fp} />
      </mesh>
      {/* Horizontal inner ribs */}
      {[0.32, 0.58].map((v, i) => {
        const rv = Math.sqrt(Math.max(0, 1 - v * v)) * 0.66
        return (
          <mesh key={i} position={[0, 0.15 + v * 0.66 * 0.95, 0.04]} rotation={[0.12, 0, 0]}>
            <torusGeometry args={[rv, 0.016, 8, 48]} />
            <meshStandardMaterial {...fp} />
          </mesh>
        )
      })}
      {/* Seat disc at bottom of sphere */}
      <mesh position={[0, -0.2, 0.12]} rotation={[0.15, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.52, 0.5, 0.1, 36]} />
        <meshStandardMaterial {...wp} />
      </mesh>
      {/* Arc legs — left */}
      {legSegments(1).map((s, i) => (
        <mesh key={`ll${i}`} position={s.pos} rotation={s.rot} castShadow>
          <cylinderGeometry args={[0.024, 0.024, s.len, 8]} />
          <meshStandardMaterial {...fp} />
        </mesh>
      ))}
      {/* Arc legs — right */}
      {legSegments(-1).map((s, i) => (
        <mesh key={`lr${i}`} position={s.pos} rotation={s.rot} castShadow>
          <cylinderGeometry args={[0.024, 0.024, s.len, 8]} />
          <meshStandardMaterial {...fp} />
        </mesh>
      ))}
      {/* Bottom crossbar */}
      <mesh position={[0, -0.82, 0]} castShadow>
        <boxGeometry args={[0.56, 0.024, 0.024]} />
        <meshStandardMaterial {...fp} />
      </mesh>
    </group>
  )
}

// ── SOFÁ ──────────────────────────────────────────────────────────────────────
function SofaModel({ wp, fp }: { wp: WP; fp: FP }) {
  const legPositions: [number, number, number][] = [
    [-0.76, -0.28, 0.33], [0.76, -0.28, 0.33],
    [-0.76, -0.28, -0.33], [0.76, -0.28, -0.33],
  ]
  return (
    <group>
      {/* Seat cushion */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.68, 0.18, 0.8]} />
        <meshStandardMaterial {...wp} />
      </mesh>
      {/* Seat rim */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1.76, 0.04, 0.88]} />
        <meshStandardMaterial {...fp} />
      </mesh>
      {/* Backrest wicker panel */}
      <mesh position={[0, 0.48, -0.35]} rotation={[-0.1, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.74, 0.15]} />
        <meshStandardMaterial {...wp} />
      </mesh>
      {/* Back top rail */}
      <mesh position={[0, 0.88, -0.36]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[1.6, 0.06, 0.13]} />
        <meshStandardMaterial {...fp} />
      </mesh>
      {/* Back side rails */}
      {([-0.76, 0.76] as [number, number][]).map(([x], i) => (
        <mesh key={i} position={[x, 0.48, -0.35]} rotation={[-0.1, 0, 0]}>
          <boxGeometry args={[0.06, 0.8, 0.13]} />
          <meshStandardMaterial {...fp} />
        </mesh>
      ))}
      {/* Left armrest */}
      <mesh position={[-0.86, 0.24, -0.02]} castShadow>
        <boxGeometry args={[0.15, 0.52, 0.78]} />
        <meshStandardMaterial {...wp} />
      </mesh>
      {/* Right armrest */}
      <mesh position={[0.86, 0.24, -0.02]} castShadow>
        <boxGeometry args={[0.15, 0.52, 0.78]} />
        <meshStandardMaterial {...wp} />
      </mesh>
      {/* Armrest top caps */}
      {([-0.86, 0.86] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.51, -0.02]}>
          <boxGeometry args={[0.19, 0.045, 0.86]} />
          <meshStandardMaterial {...fp} />
        </mesh>
      ))}
      {/* Legs */}
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <cylinderGeometry args={[0.044, 0.054, 0.38, 9]} />
          <meshStandardMaterial {...fp} />
        </mesh>
      ))}
    </group>
  )
}

// ── MESA ──────────────────────────────────────────────────────────────────────
function MesaModel({ wp, fp }: { wp: WP; fp: FP }) {
  const legPos: [number, number, number][] = [
    [-0.66, -0.12, 0.38], [0.66, -0.12, 0.38],
    [-0.66, -0.12, -0.38], [0.66, -0.12, -0.38],
  ]
  return (
    <group>
      {/* Tabletop */}
      <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.52, 0.07, 0.96]} />
        <meshStandardMaterial {...wp} />
      </mesh>
      {/* Top rim */}
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[1.6, 0.04, 1.04]} />
        <meshStandardMaterial {...fp} />
      </mesh>
      {/* Apron — front/back */}
      {([0.42, -0.42] as number[]).map((z, i) => (
        <mesh key={i} position={[0, 0.28, z]} castShadow>
          <boxGeometry args={[1.34, 0.13, 0.055]} />
          <meshStandardMaterial {...wp} />
        </mesh>
      ))}
      {/* Apron — sides */}
      {([-0.68, 0.68] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.28, 0]} castShadow>
          <boxGeometry args={[0.055, 0.13, 0.8]} />
          <meshStandardMaterial {...wp} />
        </mesh>
      ))}
      {/* Legs */}
      {legPos.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <cylinderGeometry args={[0.046, 0.058, 0.78, 10]} />
          <meshStandardMaterial {...fp} />
        </mesh>
      ))}
      {/* Crossbar stretchers */}
      <mesh position={[0, -0.26, 0.38]} castShadow>
        <boxGeometry args={[1.3, 0.03, 0.03]} />
        <meshStandardMaterial {...fp} />
      </mesh>
      <mesh position={[0, -0.26, -0.38]} castShadow>
        <boxGeometry args={[1.3, 0.03, 0.03]} />
        <meshStandardMaterial {...fp} />
      </mesh>
    </group>
  )
}

// ── HAMACA / COLUMPIO (Egg Chair) ─────────────────────────────────────────────
function HamacaModel({ wp, fp }: { wp: WP; fp: FP }) {
  return (
    <group>
      {/* Top hanging bar */}
      <mesh position={[0, 1.46, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 1.0, 8]} />
        <meshStandardMaterial {...fp} />
      </mesh>
      {/* Chains / ropes */}
      {([-0.28, 0.28] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.88, 0]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 1.16, 6]} />
          <meshStandardMaterial {...fp} />
        </mesh>
      ))}
      {/* Egg / teardrop shell */}
      <mesh position={[0, 0.14, 0]} scale={[0.9, 1.08, 0.78]} castShadow receiveShadow>
        <sphereGeometry args={[0.64, 36, 32, 0, Math.PI * 2, 0, Math.PI * 0.8]} />
        <meshStandardMaterial {...wp} side={THREE.DoubleSide} />
      </mesh>
      {/* Rim ring */}
      <mesh position={[0, 0.14, 0]} scale={[0.9, 1, 0.78]}>
        <torusGeometry args={[0.64, 0.028, 12, 56]} />
        <meshStandardMaterial {...fp} />
      </mesh>
      {/* Horizontal wicker ribs */}
      {[0.3, 0.55, 0.74].map((v, i) => {
        const rv = Math.sqrt(Math.max(0, 1 - v * v)) * 0.64
        return (
          <mesh key={i} position={[0, 0.14 + v * 0.64 * 1.08, 0]} scale={[0.9, 1, 0.78]}>
            <torusGeometry args={[rv, 0.016, 8, 40]} />
            <meshStandardMaterial {...fp} />
          </mesh>
        )
      })}
      {/* Seat / bottom platform */}
      <mesh position={[0, -0.38, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.44, 0.42, 0.1, 32]} />
        <meshStandardMaterial {...wp} />
      </mesh>
      {/* Cushion */}
      <mesh position={[0, -0.3, 0.04]} scale={[0.82, 1, 0.68]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
        <meshStandardMaterial color="#d9cfc2" roughness={0.95} metalness={0} />
      </mesh>
    </group>
  )
}

// ── CABECERA / DAYBED IGLOO ───────────────────────────────────────────────────
function DaybedModel({ wp, fp }: { wp: WP; fp: FP }) {
  return (
    <group>
      {/* Igloo dome shell */}
      <mesh position={[0, 0.06, 0]} scale={[1.08, 0.92, 0.84]} castShadow receiveShadow>
        <sphereGeometry args={[0.74, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
        <meshStandardMaterial {...wp} side={THREE.DoubleSide} />
      </mesh>
      {/* Base ring */}
      <mesh position={[0, 0.06, 0]} scale={[1.08, 1, 0.84]}>
        <torusGeometry args={[0.74, 0.032, 12, 56]} />
        <meshStandardMaterial {...fp} />
      </mesh>
      {/* Horizontal wicker ribs on dome */}
      {[0.25, 0.5, 0.68].map((v, i) => {
        const rv = Math.sqrt(Math.max(0, 1 - v * v)) * 0.74
        return (
          <mesh key={i} position={[0, 0.06 + v * 0.74 * 0.92, 0]} scale={[1.08, 1, 0.84]}>
            <torusGeometry args={[rv, 0.018, 8, 48]} />
            <meshStandardMaterial {...fp} />
          </mesh>
        )
      })}
      {/* Vertical wicker ribs (like cage bars) */}
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2
        return (
          <mesh key={i} position={[
            Math.sin(angle) * 0.74 * 1.08 * 0.5,
            0.28,
            Math.cos(angle) * 0.74 * 0.84 * 0.5
          ]} rotation={[0, -angle, 0.5]} castShadow>
            <boxGeometry args={[0.018, 0.52, 0.018]} />
            <meshStandardMaterial {...fp} />
          </mesh>
        )
      })}
      {/* Base cylinder platform */}
      <mesh position={[0, -0.18, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.84, 0.84, 0.24, 36]} />
        <meshStandardMaterial {...wp} />
      </mesh>
      {/* Inner cushion */}
      <mesh position={[0, -0.06, 0.04]} scale={[0.88, 1, 0.72]}>
        <cylinderGeometry args={[0.68, 0.68, 0.1, 32]} />
        <meshStandardMaterial color="#e2d4bc" roughness={0.92} metalness={0} />
      </mesh>
    </group>
  )
}

// ── ACCESORIO / CANASTA ───────────────────────────────────────────────────────
function AccesorioModel({ wp, fp }: { wp: WP; fp: FP }) {
  return (
    <group>
      {/* Basket body */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.48, 0.34, 0.72, 36]} />
        <meshStandardMaterial {...wp} />
      </mesh>
      {/* Bottom disc */}
      <mesh position={[0, -0.37, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.34, 0.04, 32]} />
        <meshStandardMaterial {...wp} />
      </mesh>
      {/* Top rim */}
      <mesh position={[0, 0.37, 0]}>
        <torusGeometry args={[0.48, 0.03, 10, 40]} />
        <meshStandardMaterial {...fp} />
      </mesh>
      {/* Horizontal weave bands */}
      {[-0.22, 0, 0.22].map((y, i) => {
        const r = 0.34 + (y + 0.37) / 0.72 * (0.48 - 0.34)
        return (
          <mesh key={i} position={[0, y, 0]}>
            <torusGeometry args={[r, 0.018, 8, 36]} />
            <meshStandardMaterial {...fp} />
          </mesh>
        )
      })}
      {/* Handle arch */}
      <mesh position={[0, 0.68, 0]} rotation={[0, 0, 0]} castShadow>
        <torusGeometry args={[0.32, 0.028, 10, 32, Math.PI]} />
        <meshStandardMaterial {...fp} />
      </mesh>
      {/* Small decorative basket in front */}
      <mesh position={[0.18, 0.5, 0.38]} scale={[0.45, 0.45, 0.45]} castShadow>
        <cylinderGeometry args={[0.42, 0.3, 0.6, 24]} />
        <meshStandardMaterial {...wp} />
      </mesh>
      <mesh position={[0.18, 0.72, 0.38]} scale={[0.45, 0.45, 0.45]}>
        <torusGeometry args={[0.42, 0.04, 8, 24]} />
        <meshStandardMaterial {...fp} />
      </mesh>
    </group>
  )
}

// ── Model selector ────────────────────────────────────────────────────────────
function FurnitureModel({ tipo, color, mat }: { tipo: string; color: string; mat: string }) {
  const hex = safeHex(color)
  const texture = useMemo(() => makeWickerTexture(hex), [hex])

  const isPolyalu = mat === 'polialuminio'
  const roughness = isPolyalu ? 0.28 : 0.82
  const metalness = isPolyalu ? 0.12 : 0.01

  const wp: WP = { map: texture, color: hex, roughness, metalness }
  const fp: FP = { color: hex, roughness: roughness + 0.1, metalness }

  switch (tipo) {
    case 'silla':     return <SillaOrbital wp={wp} fp={fp} />
    case 'sofa':      return <SofaModel wp={wp} fp={fp} />
    case 'mesa':      return <MesaModel wp={wp} fp={fp} />
    case 'hamaca':    return <HamacaModel wp={wp} fp={fp} />
    case 'cabecera':  return <DaybedModel wp={wp} fp={fp} />
    case 'accesorio': return <AccesorioModel wp={wp} fp={fp} />
    default:          return <SofaModel wp={wp} fp={fp} />
  }
}

// ── Camera config per tipo ────────────────────────────────────────────────────
function cameraForTipo(tipo: string): [number, number, number] {
  switch (tipo) {
    case 'hamaca':   return [2.4, 2.2, 2.4]
    case 'cabecera': return [2.6, 1.8, 2.6]
    case 'mesa':     return [2.8, 2.2, 2.8]
    default:         return [2.7, 1.8, 2.5]
  }
}

// ── Public API ────────────────────────────────────────────────────────────────
interface Props {
  color?: string
  material?: string
  tipo?: string
  height?: string | number
}

export default function Chair3DViewer({
  color = '#C4A882',
  material = 'mimbre',
  tipo = 'sofa',
  height = 400,
}: Props) {
  const camPos = cameraForTipo(tipo)

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: camPos, fov: 38 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.55} />
          <directionalLight
            position={[4, 7, 3]}
            intensity={1.6}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={0.5}
            shadow-camera-far={22}
            shadow-camera-left={-3}
            shadow-camera-right={3}
            shadow-camera-top={3}
            shadow-camera-bottom={-3}
          />
          <directionalLight position={[-3, 3, -2]} intensity={0.5} />
          <pointLight position={[0, 2, 1]} intensity={0.3} />

          <FurnitureModel tipo={tipo} color={color} mat={material} />

          <ContactShadows
            position={[0, -0.92, 0]}
            opacity={0.36}
            scale={5}
            blur={2.8}
            far={1.4}
          />
          <Environment preset="apartment" />

          <OrbitControls
            makeDefault
            enablePan={false}
            autoRotate
            autoRotateSpeed={1.2}
            minPolarAngle={0.1}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={2.0}
            maxDistance={6.5}
          />
        </Suspense>
      </Canvas>

      <p
        style={{
          position: 'absolute',
          bottom: 6,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 10,
          color: 'rgba(92,64,51,0.32)',
          fontFamily: 'var(--font-body)',
          letterSpacing: '0.1em',
          pointerEvents: 'none',
          margin: 0,
          userSelect: 'none',
        }}
      >
        Arrastra para rotar · Scroll para zoom
      </p>
    </div>
  )
}
