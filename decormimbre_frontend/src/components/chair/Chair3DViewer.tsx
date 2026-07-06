import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei'
import * as THREE from 'three'

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

  // Base fill
  ctx.fillStyle = `rgb(${r},${g},${b})`
  ctx.fillRect(0, 0, size, size)

  const step = 22

  // Horizontal weave strands
  for (let y = 0; y < size; y += step * 2) {
    ctx.fillStyle = `rgb(${dk(r,40)},${dk(g,40)},${dk(b,40)})`
    ctx.fillRect(0, y, size, step - 2)
    ctx.fillStyle = `rgb(${lt(r,25)},${lt(g,25)},${lt(b,25)})`
    ctx.fillRect(0, y + step, size, step - 2)
  }

  // Vertical weave strands (interleaved)
  for (let x = 0; x < size; x += step) {
    const even = Math.floor(x / step) % 2 === 0
    ctx.fillStyle = `rgb(${lt(r,18)},${lt(g,18)},${lt(b,18)})`
    ctx.fillRect(x, even ? 0 : step, step - 4, size - step)

    // Knot at intersection
    ctx.fillStyle = `rgb(${dk(r,28)},${dk(g,28)},${dk(b,28)})`
    for (let y = even ? 0 : step; y < size; y += step * 2) {
      ctx.beginPath()
      ctx.arc(x + (step - 4) / 2, y + step / 2, 3.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(5, 5)
  return tex
}

function safeHex(color: string): string {
  return color.startsWith('#') && color.length === 7 ? color : '#C4A882'
}

interface ChairModelProps {
  color: string
  mat: string
}

function ChairModel({ color, mat }: ChairModelProps) {
  const hex = safeHex(color)
  const texture = useMemo(() => makeWickerTexture(hex), [hex])

  const isPolyalu = mat === 'polialuminio'
  const roughness = isPolyalu ? 0.30 : 0.85
  const metalness = isPolyalu ? 0.10 : 0.01

  const wickerProps = {
    map: texture,
    color: hex,
    roughness,
    metalness,
  }
  const frameProps = {
    color: hex,
    roughness: roughness + 0.08,
    metalness,
  }

  return (
    <group>
      {/* ── SEAT ── */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.18, 0.09, 1.02]} />
        <meshStandardMaterial {...wickerProps} />
      </mesh>
      {/* Seat rim */}
      <mesh position={[0, 0.054, 0]} castShadow>
        <boxGeometry args={[1.26, 0.036, 1.1]} />
        <meshStandardMaterial {...frameProps} />
      </mesh>

      {/* ── FRONT LEGS ── */}
      {([-0.5, 0.5] as const).map((x, i) => (
        <mesh key={`fl${i}`} position={[x, -0.44, 0.44]} rotation={[0.04, 0, i === 0 ? -0.04 : 0.04]} castShadow>
          <cylinderGeometry args={[0.042, 0.054, 0.88, 8]} />
          <meshStandardMaterial {...frameProps} />
        </mesh>
      ))}

      {/* ── BACK LEGS (extend above seat to support backrest) ── */}
      {([-0.5, 0.5] as const).map((x, i) => (
        <mesh key={`bl${i}`} position={[x, 0.16, -0.44]} rotation={[-0.04, 0, i === 0 ? -0.04 : 0.04]} castShadow>
          <cylinderGeometry args={[0.042, 0.054, 2.08, 8]} />
          <meshStandardMaterial {...frameProps} />
        </mesh>
      ))}

      {/* ── STRETCHERS ── */}
      <mesh position={[0, -0.6, 0.44]} castShadow>
        <boxGeometry args={[0.96, 0.042, 0.042]} />
        <meshStandardMaterial {...frameProps} />
      </mesh>
      <mesh position={[0, -0.6, -0.44]} castShadow>
        <boxGeometry args={[0.96, 0.042, 0.042]} />
        <meshStandardMaterial {...frameProps} />
      </mesh>
      {([-0.5, 0.5] as const).map((x, i) => (
        <mesh key={`st${i}`} position={[x, -0.6, 0]} castShadow>
          <boxGeometry args={[0.042, 0.042, 0.84]} />
          <meshStandardMaterial {...frameProps} />
        </mesh>
      ))}

      {/* ── BACKREST PANEL ── */}
      <mesh position={[0, 0.72, -0.45]} rotation={[-0.07, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.04, 0.82, 0.072]} />
        <meshStandardMaterial {...wickerProps} />
      </mesh>
      {/* Top rail */}
      <mesh position={[0, 1.145, -0.44]} rotation={[-0.07, 0, 0]} castShadow>
        <boxGeometry args={[1.14, 0.072, 0.1]} />
        <meshStandardMaterial {...frameProps} />
      </mesh>
      {/* Bottom rail */}
      <mesh position={[0, 0.305, -0.45]} rotation={[-0.07, 0, 0]} castShadow>
        <boxGeometry args={[1.08, 0.055, 0.082]} />
        <meshStandardMaterial {...frameProps} />
      </mesh>

      {/* ── ARMRESTS ── */}
      {([-0.595, 0.595] as const).map((x, i) => (
        <mesh key={`ar${i}`} position={[x, 0.22, -0.02]} rotation={[0, 0, i === 0 ? 0.05 : -0.05]} castShadow>
          <boxGeometry args={[0.075, 0.062, 0.86]} />
          <meshStandardMaterial {...frameProps} />
        </mesh>
      ))}
    </group>
  )
}

interface Props {
  color?: string
  material?: string
  height?: string | number
}

export default function Chair3DViewer({ color = '#C4A882', material = 'mimbre', height = 400 }: Props) {
  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [2.9, 1.85, 2.7], fov: 38 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.52} />
          <directionalLight
            position={[4, 7, 3]}
            intensity={1.5}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={0.5}
            shadow-camera-far={20}
            shadow-camera-left={-3}
            shadow-camera-right={3}
            shadow-camera-top={3}
            shadow-camera-bottom={-3}
          />
          <directionalLight position={[-3, 3, -2]} intensity={0.45} />
          <pointLight position={[0, 2, 1]} intensity={0.25} />

          <ChairModel color={color} mat={material} />

          <ContactShadows
            position={[0, -0.88, 0]}
            opacity={0.38}
            scale={4.5}
            blur={2.5}
            far={1.2}
          />

          <Environment preset="apartment" />

          <OrbitControls
            makeDefault
            enablePan={false}
            autoRotate
            autoRotateSpeed={1.4}
            minPolarAngle={0.15}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={2.2}
            maxDistance={6}
          />
        </Suspense>
      </Canvas>

      <p style={{
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
      }}>
        Arrastra para rotar · Scroll para zoom
      </p>
    </div>
  )
}
