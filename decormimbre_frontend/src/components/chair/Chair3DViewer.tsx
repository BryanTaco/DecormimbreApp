import { Suspense, useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

// ── Wicker texture generator ──────────────────────────────────────────────────
// Dos tejidos claramente distintos, según referencia real:
//  - mimbre: trama CERRADA y apretada (cesto plano over-under, sin huecos), cálida.
//  - polialuminio: trama ABIERTA tipo red (cordones cruzados con huecos), sintética.
function makeWickerTexture(hex: string, material: string): THREE.CanvasTexture {
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
  const poly = material === 'polialuminio'

  if (poly) {
    // ── Polialuminio: RED ABIERTA ──────────────────────────────────────────────
    // Fondo oscuro = huecos entre cordones; encima, malla diagonal fina.
    ctx.fillStyle = `rgb(${dk(r, 78)},${dk(g, 78)},${dk(b, 76)})`
    ctx.fillRect(0, 0, size, size)
    ctx.lineCap = 'round'
    const gap = 22
    // cordones en dos diagonales → malla romboidal con huecos
    for (const dir of [1, -1]) {
      ctx.strokeStyle = `rgb(${lt(r, 18)},${lt(g, 18)},${lt(b, 18)})`
      ctx.lineWidth = 5
      for (let i = -size; i < size * 2; i += gap) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i + dir * size, size)
        ctx.stroke()
      }
      // brillo sintético fino sobre cada cordón
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.lineWidth = 1.4
      for (let i = -size; i < size * 2; i += gap) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i + dir * size, size)
        ctx.stroke()
      }
    }
  } else {
    // ── Mimbre: CESTO CERRADO (over/under) ─────────────────────────────────────
    ctx.fillStyle = `rgb(${dk(r, 55)},${dk(g, 55)},${dk(b, 55)})` // costuras oscuras
    ctx.fillRect(0, 0, size, size)
    const cell = 26
    const light = `rgb(${lt(r, 22)},${lt(g, 22)},${lt(b, 22)})`
    const dark = `rgb(${dk(r, 12)},${dk(g, 12)},${dk(b, 12)})`
    const pad = 2
    const band = (x: number, y: number, w: number, h: number) => {
      ctx.beginPath()
      ctx.roundRect(x, y, w, h, 4)
      ctx.fill()
    }
    for (let gy = -1; gy * cell < size; gy++) {
      for (let gx = -1; gx * cell < size; gx++) {
        const x = gx * cell, y = gy * cell
        const over = (gx + gy) % 2 === 0
        // la banda "under" primero, la "over" encima → entrelazado cerrado
        if (over) {
          ctx.fillStyle = dark; band(x - pad, y + cell * 0.26, cell + pad * 2, cell * 0.48)   // horizontal (under)
          ctx.fillStyle = light; band(x + cell * 0.26, y - pad, cell * 0.48, cell + pad * 2)   // vertical (over)
        } else {
          ctx.fillStyle = dark; band(x + cell * 0.26, y - pad, cell * 0.48, cell + pad * 2)    // vertical (under)
          ctx.fillStyle = light; band(x - pad, y + cell * 0.26, cell + pad * 2, cell * 0.48)   // horizontal (over)
        }
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  const rep = poly ? 5 : 5
  tex.repeat.set(rep, rep)
  return tex
}

function safeHex(c: string) {
  return c.startsWith('#') && c.length === 7 ? c : '#C4A882'
}

// Ajusta el tono según el material para que la diferencia sea evidente en
// cualquier iluminación: el polialuminio se ve más frío (grafito/azulado) y algo
// más oscuro que el mimbre, que se mantiene cálido.
function toneForMaterial(hex: string, poly: boolean): string {
  if (!poly) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const t = 0.3 // mezcla hacia gris frío
  const [tr, tg, tb] = [92, 100, 110]
  const mix = (c: number, tc: number) => Math.round((c * (1 - t) + tc * t) * 0.9)
  const h = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')
  return `#${h(mix(r, tr))}${h(mix(g, tg))}${h(mix(b, tb))}`
}

type WP = { map: THREE.CanvasTexture; color: string; roughness: number; metalness: number }
type FP = { color: string; roughness: number; metalness: number }

// ── SILLA PAPASAN ─────────────────────────────────────────────────────────────
// Silla de mimbre tipo papasan: cuenco abierto e inclinado hacia atrás (asiento
// donde te sientas) + cojín redondo + base de tambor tejido. Se lee como silla.
function SillaOrbital({ wp, fp, cp }: { wp: WP; fp: FP; cp: FP }) {
  const R = 0.72
  const tilt = -0.42 // inclina la boca del cuenco hacia el frente/arriba

  return (
    <group position={[0, 0.05, 0]}>
      {/* Cuenco (media esfera abierta arriba) — asiento tejido */}
      <group rotation={[tilt, 0, 0]}>
        <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
          <sphereGeometry args={[R, 44, 32, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5]} />
          <meshStandardMaterial {...wp} side={THREE.DoubleSide} />
        </mesh>
        {/* Aro grueso del borde (la "boca" del cuenco donde te sientas) */}
        <mesh position={[0, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[R, 0.055, 16, 72]} />
          <meshStandardMaterial {...fp} />
        </mesh>
        {/* Costillas horizontales del tejido */}
        {[0.34, 0.62, 0.86].map((f, i) => {
          const rr = Math.sqrt(Math.max(0, 1 - f * f)) * R
          return (
            <mesh key={i} position={[0, 0.16 - f * R, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[rr, 0.02, 10, 56]} />
              <meshStandardMaterial {...fp} />
            </mesh>
          )
        })}
        {/* Cojín redondo dentro del cuenco */}
        <mesh position={[0, 0.12, 0]} scale={[1, 0.42, 1]} castShadow>
          <sphereGeometry args={[R * 0.82, 32, 24]} />
          <meshStandardMaterial {...cp} />
        </mesh>
        {/* Costura / botón central del cojín */}
        <mesh position={[0, 0.24, 0]}>
          <sphereGeometry args={[0.05, 16, 12]} />
          <meshStandardMaterial color={cp.color} roughness={1} metalness={0} />
        </mesh>
        {/* Cojín de respaldo apoyado atrás */}
        <mesh position={[0, 0.34, -0.34]} rotation={[0.5, 0, 0]} scale={[1, 1, 0.4]} castShadow>
          <sphereGeometry args={[R * 0.62, 28, 20]} />
          <meshStandardMaterial {...cp} />
        </mesh>
      </group>

      {/* Base tipo tambor tejido */}
      <mesh position={[0, -0.62, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.42, 0.42, 40]} />
        <meshStandardMaterial {...wp} />
      </mesh>
      {/* Aros de la base */}
      {[-0.42, -0.62, -0.82].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[i === 0 ? 0.34 : i === 1 ? 0.4 : 0.42, 0.022, 10, 48]} />
          <meshStandardMaterial {...fp} />
        </mesh>
      ))}
    </group>
  )
}

// ── SOFÁ ──────────────────────────────────────────────────────────────────────
function SofaModel({ wp, fp, cp }: { wp: WP; fp: FP; cp: FP }) {
  const legPositions: [number, number, number][] = [
    [-0.76, -0.28, 0.33], [0.76, -0.28, 0.33],
    [-0.76, -0.28, -0.33], [0.76, -0.28, -0.33],
  ]
  const seatX = [-0.42, 0.42]
  return (
    <group>
      {/* Base tejida del asiento */}
      <mesh position={[0, -0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.2, 0.82]} />
        <meshStandardMaterial {...wp} />
      </mesh>
      {/* Costillas de tejido en el frente de la base */}
      {[-0.02, -0.09].map((y, i) => (
        <mesh key={i} position={[0, y, 0.42]}>
          <boxGeometry args={[1.64, 0.02, 0.02]} />
          <meshStandardMaterial {...fp} />
        </mesh>
      ))}
      {/* Borde superior del asiento */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[1.78, 0.04, 0.9]} />
        <meshStandardMaterial {...fp} />
      </mesh>
      {/* Cojines de asiento */}
      {seatX.map((x, i) => (
        <mesh key={`s${i}`} position={[x, 0.16, 0.03]} castShadow>
          <boxGeometry args={[0.78, 0.16, 0.72]} />
          <meshStandardMaterial {...cp} />
        </mesh>
      ))}
      {/* Cojines de respaldo */}
      {seatX.map((x, i) => (
        <mesh key={`b${i}`} position={[x, 0.46, -0.3]} rotation={[-0.14, 0, 0]} castShadow>
          <boxGeometry args={[0.78, 0.5, 0.16]} />
          <meshStandardMaterial {...cp} />
        </mesh>
      ))}
      {/* Panel de respaldo tejido */}
      <mesh position={[0, 0.52, -0.4]} rotation={[-0.1, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.7, 0.12]} />
        <meshStandardMaterial {...wp} />
      </mesh>
      {/* Costillas verticales del respaldo */}
      {[-0.6, -0.3, 0, 0.3, 0.6].map((x, i) => (
        <mesh key={i} position={[x, 0.52, -0.34]} rotation={[-0.1, 0, 0]}>
          <boxGeometry args={[0.02, 0.66, 0.02]} />
          <meshStandardMaterial {...fp} />
        </mesh>
      ))}
      {/* Riel superior */}
      <mesh position={[0, 0.9, -0.41]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[1.72, 0.07, 0.14]} />
        <meshStandardMaterial {...fp} />
      </mesh>
      {/* Reposabrazos tejidos con remate */}
      {([-0.9, 0.9] as number[]).map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.24, -0.02]} castShadow>
            <boxGeometry args={[0.16, 0.56, 0.8]} />
            <meshStandardMaterial {...wp} />
          </mesh>
          <mesh position={[x, 0.53, -0.02]}>
            <boxGeometry args={[0.2, 0.05, 0.88]} />
            <meshStandardMaterial {...fp} />
          </mesh>
        </group>
      ))}
      {/* Patas */}
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <cylinderGeometry args={[0.044, 0.054, 0.38, 10]} />
          <meshStandardMaterial {...fp} />
        </mesh>
      ))}
    </group>
  )
}

// ── MESA ──────────────────────────────────────────────────────────────────────
// Mesa de centro TEJIDA con tapa de vidrio (no de madera, sin cojín): base de
// tambor de mimbre/polialuminio + aro superior + cristal redondo encima.
function MesaModel({ wp, fp }: { wp: WP; fp: FP }) {
  const R = 0.62
  return (
    <group position={[0, -0.05, 0]}>
      {/* Base de tambor tejido */}
      <mesh position={[0, -0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[R * 0.82, R * 0.92, 0.62, 48]} />
        <meshStandardMaterial {...wp} />
      </mesh>
      {/* Aros del tejido (refuerzos) */}
      {[0.24, 0.02, -0.2].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[R * (0.82 + i * 0.05), 0.022, 12, 56]} />
          <meshStandardMaterial {...fp} />
        </mesh>
      ))}
      {/* Base inferior (pie) */}
      <mesh position={[0, -0.33, 0]} castShadow>
        <cylinderGeometry args={[R * 0.95, R * 0.98, 0.06, 48]} />
        <meshStandardMaterial {...fp} />
      </mesh>
      {/* Aro superior donde apoya el vidrio */}
      <mesh position={[0, 0.31, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[R, 0.035, 14, 64]} />
        <meshStandardMaterial {...fp} />
      </mesh>
      {/* Tapa de vidrio redonda */}
      <mesh position={[0, 0.34, 0]} castShadow>
        <cylinderGeometry args={[R + 0.06, R + 0.06, 0.03, 64]} />
        <meshStandardMaterial color="#cfe3e6" roughness={0.08} metalness={0.05} transparent opacity={0.42} />
      </mesh>
      {/* Canto del vidrio */}
      <mesh position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[R + 0.06, 0.012, 10, 64]} />
        <meshStandardMaterial color="#eef6f7" roughness={0.1} metalness={0.1} transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

// ── HAMACA / COLUMPIO (Egg Chair) ─────────────────────────────────────────────
// Hamaca clásica de descanso: soporte de dos postes inclinados sobre una base,
// con la cama de tela colgando y combada (sag) entre los dos extremos.
function HamacaModel({ fp, cp }: { fp: FP; cp: FP }) {
  // Cada poste va de la base (±1.25, -0.85) a la punta alta (±0.98, 0.9)
  const post = (s: number) => {
    const ax = 1.25 * s, ay = -0.85
    const bx = 0.98 * s, by = 0.9
    const dx = bx - ax, dy = by - ay
    const len = Math.hypot(dx, dy)
    const angle = Math.atan2(dx, dy)
    return { pos: [(ax + bx) / 2, (ay + by) / 2, 0] as [number, number, number], rot: [0, 0, -angle] as [number, number, number], len }
  }

  return (
    <group position={[0, 0.05, 0]}>
      {/* Base: riel inferior a lo largo (eje X) */}
      <mesh position={[0, -0.88, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.7, 0.09, 0.09]} />
        <meshStandardMaterial {...fp} />
      </mesh>
      {/* Pies transversales (eje Z) en los extremos */}
      {([-1.25, 1.25] as number[]).map((x, i) => (
        <mesh key={i} position={[x, -0.88, 0]} castShadow>
          <boxGeometry args={[0.1, 0.09, 0.86]} />
          <meshStandardMaterial {...fp} />
        </mesh>
      ))}

      {/* Postes inclinados + punta */}
      {([1, -1] as number[]).map((s, i) => {
        const p = post(s)
        return (
          <group key={i}>
            <mesh position={p.pos} rotation={p.rot} castShadow>
              <cylinderGeometry args={[0.05, 0.06, p.len, 12]} />
              <meshStandardMaterial {...fp} />
            </mesh>
            {/* Punta / gancho */}
            <mesh position={[0.98 * s, 0.92, 0]} castShadow>
              <sphereGeometry args={[0.06, 16, 12]} />
              <meshStandardMaterial {...fp} />
            </mesh>
          </group>
        )
      })}

      {/* Cuerdas de suspensión (abanico a cada extremo) */}
      {([1, -1] as number[]).map((s) =>
        [-0.28, 0, 0.28].map((z, j) => {
          const ax = 0.98 * s, ay = 0.9
          const bx = 0.92 * s, by = 0.28
          const dx = bx - ax, dy = by - ay
          const len = Math.hypot(dx, dy, z)
          const angle = Math.atan2(bx - ax, by - ay)
          return (
            <mesh key={`${s}-${j}`} position={[(ax + bx) / 2, (ay + by) / 2, z / 2]} rotation={[0, 0, -angle]}>
              <cylinderGeometry args={[0.01, 0.01, len, 6]} />
              <meshStandardMaterial {...fp} />
            </mesh>
          )
        }),
      )}

      {/* Barras esparcidoras (spreader bars) en cada extremo de la cama */}
      {([0.92, -0.92] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.028, 0.028, 0.86, 12]} />
          <meshStandardMaterial {...fp} />
        </mesh>
      ))}

      {/* Cama de la hamaca — tela combada (bowl bajo y ancho) */}
      <mesh position={[0, 0.16, 0]} scale={[1.05, 0.42, 0.7]} castShadow receiveShadow>
        <sphereGeometry args={[0.9, 40, 24, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5]} />
        <meshStandardMaterial {...cp} side={THREE.DoubleSide} />
      </mesh>
      {/* Hilos de tejido de la cama (a lo largo) */}
      {[-0.24, -0.08, 0.08, 0.24].map((z, i) => (
        <mesh key={i} position={[0, -0.02, z]} scale={[1, 0.4, 1]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.9, 0.012, 6, 40, Math.PI]} />
          <meshStandardMaterial {...fp} />
        </mesh>
      ))}
      {/* Almohada en un extremo */}
      <mesh position={[0.6, 0.12, 0]} rotation={[0, 0, -0.3]} scale={[1, 0.5, 0.72]} castShadow>
        <sphereGeometry args={[0.24, 20, 16]} />
        <meshStandardMaterial {...cp} />
      </mesh>
    </group>
  )
}

// ── CABECERA / DAYBED IGLOO ───────────────────────────────────────────────────
function DaybedModel({ wp, fp, cp }: { wp: WP; fp: FP; cp: FP }) {
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
      {/* Colchón inferior */}
      <mesh position={[0, -0.04, 0.04]} scale={[0.9, 1, 0.74]} castShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.14, 32]} />
        <meshStandardMaterial {...cp} />
      </mesh>
      {/* Cojines de respaldo dentro de la cúpula */}
      {[-0.34, 0, 0.34].map((x, i) => (
        <mesh key={i} position={[x, 0.14, -0.32]} rotation={[0.5, 0, 0]} scale={[1, 1, 0.45]} castShadow>
          <sphereGeometry args={[0.26, 22, 16]} />
          <meshStandardMaterial {...cp} />
        </mesh>
      ))}
    </group>
  )
}

// ── ACCESORIO / CANASTA ───────────────────────────────────────────────────────
function AccesorioModel({ wp, fp, cp }: { wp: WP; fp: FP; cp: FP }) {
  return (
    <group>
      {/* Basket body */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.48, 0.34, 0.72, 36]} />
        <meshStandardMaterial {...wp} />
      </mesh>
      {/* Manta doblada dentro de la canasta (usa el color del cojín) */}
      <mesh position={[0, 0.36, 0]} scale={[1, 0.5, 1]} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.22, 32]} />
        <meshStandardMaterial {...cp} />
      </mesh>
      <mesh position={[0, 0.44, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.4, 0.05, 10, 40]} />
        <meshStandardMaterial {...cp} />
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
function FurnitureModel({ tipo, color, mat, cushion }: { tipo: string; color: string; mat: string; cushion: string }) {
  const isPolyalu = mat === 'polialuminio'
  const hex = toneForMaterial(safeHex(color), isPolyalu)
  const texture = useMemo(() => makeWickerTexture(hex, mat), [hex, mat])

  // Polialuminio: acabado satinado/plástico (brilla, poco áspero).
  // Mimbre: fibra natural mate y áspera.
  const roughness = isPolyalu ? 0.4 : 0.92
  const metalness = isPolyalu ? 0.3 : 0.0

  const wp: WP = { map: texture, color: hex, roughness, metalness }
  const fp: FP = { color: hex, roughness: roughness + 0.1, metalness }
  // Material del cojín (tela mate, color independiente del tejido)
  const cp: FP = { color: safeHex(cushion), roughness: 0.97, metalness: 0 }

  switch (tipo) {
    case 'silla':     return <SillaOrbital wp={wp} fp={fp} cp={cp} />
    case 'sofa':      return <SofaModel wp={wp} fp={fp} cp={cp} />
    case 'mesa':      return <MesaModel wp={wp} fp={fp} />
    case 'hamaca':    return <HamacaModel fp={fp} cp={cp} />
    case 'cabecera':  return <DaybedModel wp={wp} fp={fp} cp={cp} />
    case 'accesorio': return <AccesorioModel wp={wp} fp={fp} cp={cp} />
    default:          return <SofaModel wp={wp} fp={fp} cp={cp} />
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

type VistaId = 'orbita' | 'frente' | 'perfil' | 'superior'

// Posiciones de cámara por vista, derivadas del radio del tipo de mueble.
function vistasParaTipo(tipo: string): Record<VistaId, [number, number, number] | null> {
  const base = cameraForTipo(tipo)
  const r = Math.hypot(base[0], base[2]) // radio horizontal
  const y = base[1]
  return {
    orbita: null, // rotación libre / automática
    frente: [0, y * 0.8, r * 1.15],
    perfil: [r * 1.15, y * 0.8, 0.001],
    superior: [0.001, r * 1.7, 0.001],
  }
}

// Anima la cámara hacia la vista seleccionada (lerp suave).
function CameraRig({ target, controlsRef }: {
  target: [number, number, number] | null
  controlsRef: React.MutableRefObject<{ update: () => void } | null>
}) {
  const { camera } = useThree()
  const dest = useRef(new THREE.Vector3())
  useFrame(() => {
    if (!target) return
    dest.current.set(target[0], target[1], target[2])
    camera.position.lerp(dest.current, 0.1)
    controlsRef.current?.update()
  })
  return null
}

// Grupo con animación de entrada (aparece desde abajo con un pequeño rebote)
// y giro de plataforma opcional para un efecto de vitrina.
function StageGroup({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  const t = useRef(0)
  useFrame((_, delta) => {
    if (!ref.current) return
    t.current = Math.min(1, t.current + delta * 1.8)
    const e = 1 - Math.pow(1 - t.current, 3) // easeOutCubic
    ref.current.scale.setScalar(0.75 + 0.25 * e)
    ref.current.position.y = -0.5 * (1 - e)
  })
  return <group ref={ref}>{children}</group>
}

// Pedestal de vitrina bajo el mueble.
function Pedestal() {
  return (
    <mesh position={[0, -0.94, 0]} receiveShadow>
      <cylinderGeometry args={[1.75, 1.95, 0.08, 64]} />
      <meshStandardMaterial color="#efe6da" roughness={0.9} metalness={0.02} />
    </mesh>
  )
}

// ── Public API ────────────────────────────────────────────────────────────────
interface Props {
  color?: string
  material?: string
  tipo?: string
  height?: string | number
  autoRotate?: boolean
  cushionColor?: string
}

const VISTAS: { id: VistaId; label: string }[] = [
  { id: 'orbita', label: 'Órbita' },
  { id: 'frente', label: 'Frente' },
  { id: 'perfil', label: 'Perfil' },
  { id: 'superior', label: 'Arriba' },
]

export default function Chair3DViewer({
  color = '#C4A882',
  material = 'mimbre',
  tipo = 'sofa',
  height = 400,
  autoRotate = true,
  cushionColor = '#E4D8C4',
}: Props) {
  const camPos = cameraForTipo(tipo)
  const controlsRef = useRef<{ update: () => void } | null>(null)
  const [vista, setVista] = useState<VistaId>('orbita')
  const vistas = useMemo(() => vistasParaTipo(tipo), [tipo])

  // Al cambiar de tipo de mueble, volvemos a la vista en órbita.
  useEffect(() => { setVista('orbita') }, [tipo])

  const target = vistas[vista]
  const rotando = vista === 'orbita' && autoRotate

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

          <StageGroup>
            <FurnitureModel tipo={tipo} color={color} mat={material} cushion={cushionColor} />
            <Pedestal />
          </StageGroup>

          <ContactShadows
            position={[0, -0.92, 0]}
            opacity={0.36}
            scale={5}
            blur={2.8}
            far={1.4}
          />
          {/* Luz de relleno hemisférica en lugar de <Environment> (que descargaba
              un HDRI de una CDN externa y dejaba el visor en blanco si fallaba). */}
          <hemisphereLight args={['#fff6ec', '#6b5233', 0.65]} />

          <CameraRig target={target} controlsRef={controlsRef} />

          <OrbitControls
            ref={controlsRef as never}
            makeDefault
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            autoRotate={rotando}
            autoRotateSpeed={1.1}
            minPolarAngle={0.05}
            maxPolarAngle={Math.PI / 2.05}
            minDistance={2.0}
            maxDistance={6.5}
            onStart={() => setVista('orbita')}
          />
        </Suspense>
      </Canvas>

      {/* Controles de vista — "gira el mueble y míralo por todos lados" */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 4,
          padding: 4,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(92,64,51,0.1)',
          boxShadow: '0 4px 16px rgba(92,64,51,0.1)',
        }}
      >
        {VISTAS.map((v) => {
          const on = vista === v.id
          return (
            <button
              key={v.id}
              onClick={() => setVista(v.id)}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                fontWeight: on ? 600 : 500,
                letterSpacing: '0.02em',
                padding: '5px 12px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                background: on ? '#5C4033' : 'transparent',
                color: on ? '#fff' : 'rgba(92,64,51,0.65)',
                transition: 'all 200ms',
              }}
            >
              {v.label}
            </button>
          )
        })}
      </div>

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
        Arrastra para girar · Scroll para acercar · Elige una vista arriba
      </p>
    </div>
  )
}
