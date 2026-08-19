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
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  const rep = poly ? 4 : 5
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

// ── Cordón/varilla entre dos puntos ──────────────────────────────────────────
// Coloca un cilindro orientado desde `a` hasta `b`. Se usa para los cordones del
// tejido (material wp) y para las patas metálicas (material fp).
function Cord({ a, b, r, mat }: { a: THREE.Vector3; b: THREE.Vector3; r: number; mat: WP | FP }) {
  const { pos, quat, len } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(b, a)
    const length = dir.length()
    const position = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5)
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0), dir.clone().normalize(),
    )
    return { pos: position, quat: quaternion, len: length }
  }, [a, b])
  return (
    <mesh position={pos} quaternion={quat} castShadow>
      <cylinderGeometry args={[r, r, len, 6]} />
      <meshStandardMaterial {...mat} />
    </mesh>
  )
}

// ── SILLA — Acapulco: aro tipo pera con cordones radiales y patas de trípode ──
// El aro y las patas usan el material de estructura (metal en polialuminio); los
// cordones radiales usan el tejido del material (mimbre cálido / polialuminio).
function SillaModel({ wp, fp }: { wp: WP; fp: FP; cp: FP }) {
  const R = 0.6         // radio del aro
  const rHole = 0.07    // radio del hueco central
  const D = 0.5         // profundidad del cuenco (hacia atrás)
  const N = 62          // nº de cordones radiales

  const cords = useMemo(() => {
    const arr: { a: THREE.Vector3; b: THREE.Vector3 }[] = []
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2
      arr.push({
        a: new THREE.Vector3(Math.cos(t) * R, Math.sin(t) * R, 0),
        b: new THREE.Vector3(Math.cos(t) * rHole, Math.sin(t) * rHole, -D),
      })
    }
    return arr
  }, [])

  // Patas de trípode + barras conectoras (esquinas de la base)
  const legs = useMemo(() => (
    [[0.42, 0.32], [-0.42, 0.32], [0.32, -0.42], [-0.32, -0.42]] as [number, number][]
  ).map(([x, z]) => ({
    a: new THREE.Vector3(x * 0.38, -0.02, z * 0.38),
    b: new THREE.Vector3(x, -0.9, z),
  })), [])
  const bars = useMemo(() => ([
    [new THREE.Vector3(0.42, -0.86, 0.32), new THREE.Vector3(-0.42, -0.86, 0.32)],
    [new THREE.Vector3(0.32, -0.86, -0.42), new THREE.Vector3(-0.32, -0.86, -0.42)],
  ] as [THREE.Vector3, THREE.Vector3][]), [])

  return (
    <group>
      {/* Cuenco de cordones (aro + tejido), forma de pera e inclinado atrás */}
      <group position={[0, 0.42, 0]} rotation={[-0.18, 0, 0]} scale={[1, 1.12, 1]}>
        {/* Aro exterior (marco) */}
        <mesh castShadow>
          <torusGeometry args={[R, 0.03, 16, 96]} />
          <meshStandardMaterial {...fp} />
        </mesh>
        {/* Cordones radiales (tejido) */}
        {cords.map((c, i) => (
          <Cord key={i} a={c.a} b={c.b} r={0.007} mat={wp} />
        ))}
        {/* Anillo del hueco central */}
        <mesh position={[0, 0, -D]}>
          <torusGeometry args={[rHole, 0.012, 10, 32]} />
          <meshStandardMaterial {...fp} />
        </mesh>
      </group>

      {/* Patas de trípode metálicas */}
      {legs.map((l, i) => (
        <Cord key={`leg${i}`} a={l.a} b={l.b} r={0.02} mat={fp} />
      ))}
      {/* Barras conectoras bajas */}
      {bars.map((bar, i) => (
        <Cord key={`bar${i}`} a={bar[0]} b={bar[1]} r={0.016} mat={fp} />
      ))}
    </group>
  )
}

// ── SOFÁ — loveseat nido redondeado (ref: sala-ebano.jpg) ─────────────────────
// Cuenco tejido bajo y ancho con respaldo curvo elevado atrás, cojín de asiento
// corrido y dos cojines de respaldo. Sin patas: el nido se apoya en el piso.
function SofaModel({ wp, fp, cp }: { wp: WP; fp: FP; cp: FP }) {
  return (
    <group>
      {/* Cuenco tejido (cuerpo) */}
      <mesh position={[0, -0.06, 0]} scale={[1.45, 1.05, 1]} castShadow receiveShadow>
        <sphereGeometry args={[0.72, 48, 28, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.58]} />
        <meshStandardMaterial {...wp} side={THREE.DoubleSide} />
      </mesh>
      {/* Respaldo curvo elevado (banda trasera) */}
      <mesh position={[0, -0.06, 0]} scale={[1.45, 1.05, 1]} rotation={[0, Math.PI, 0]} castShadow>
        <sphereGeometry args={[0.72, 48, 20, 0, Math.PI, Math.PI * 0.18, Math.PI * 0.27]} />
        <meshStandardMaterial {...wp} side={THREE.DoubleSide} />
      </mesh>
      {/* Borde del cuenco */}
      <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.45, 1, 1]}>
        <torusGeometry args={[0.7, 0.032, 12, 72]} />
        <meshStandardMaterial {...fp} />
      </mesh>
      {/* Remate superior del respaldo (sigue el borde de la banda trasera) */}
      <mesh position={[0, 0.575, 0]} rotation={[Math.PI / 2, 0, Math.PI]} scale={[1.45, 1, 1]}>
        <torusGeometry args={[0.39, 0.028, 10, 48, Math.PI]} />
        <meshStandardMaterial {...fp} />
      </mesh>
      {/* Cojín de asiento corrido */}
      <mesh position={[0, 0.0, 0.05]} scale={[1.4, 0.3, 0.85]} castShadow>
        <sphereGeometry args={[0.6, 32, 20]} />
        <meshStandardMaterial {...cp} />
      </mesh>
      {/* Cojines de respaldo */}
      {[-0.38, 0.38].map((x, i) => (
        <mesh key={i} position={[x, 0.3, -0.32]} rotation={[0.35, 0, 0]} scale={[1, 1, 0.42]} castShadow>
          <sphereGeometry args={[0.3, 24, 16]} />
          <meshStandardMaterial {...cp} />
        </mesh>
      ))}
    </group>
  )
}

// ── MESA — comedor cuadrado tejido (ref: set-comedor.jpg) ─────────────────────
// Faldón piramidal tejido que se ensancha hacia arriba, tapa tejida con marco y
// superficie interior tipo lino, como el comedor de la foto.
function MesaModel({ wp, fp }: { wp: WP; fp: FP }) {
  return (
    <group>
      {/* Faldón tejido (tronco piramidal de base cuadrada) */}
      <mesh position={[0, -0.39, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.88, 0.66, 1.0, 4, 1]} />
        <meshStandardMaterial {...wp} flatShading />
      </mesh>
      {/* Tapa tejida */}
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.52, 0.1, 1.14]} />
        <meshStandardMaterial {...wp} />
      </mesh>
      {/* Marco del borde de la tapa */}
      {([-1, 1] as number[]).map((s) => (
        <group key={s}>
          <mesh position={[0, 0.215, s * 0.57]}>
            <boxGeometry args={[1.52, 0.035, 0.05]} />
            <meshStandardMaterial {...fp} />
          </mesh>
          <mesh position={[s * 0.76, 0.215, 0]}>
            <boxGeometry args={[0.05, 0.035, 1.14]} />
            <meshStandardMaterial {...fp} />
          </mesh>
        </group>
      ))}
      {/* Superficie interior (lino) */}
      <mesh position={[0, 0.213, 0]}>
        <boxGeometry args={[1.38, 0.016, 1.0]} />
        <meshStandardMaterial color="#ded3c2" roughness={0.85} metalness={0} />
      </mesh>
    </group>
  )
}

// ── HAMACA — silla colgante tipo huevo bajo pérgola (ref: hamaca-jardin.jpg) ──
// Casco tejido en forma de huevo con abertura frontal, cojín adentro, colgado
// con cuerda de una viga de pérgola sobre dos postes de madera.
function HamacaModel({ wp, fp, cp }: { wp: WP; fp: FP; cp: FP }) {
  const gap = Math.PI * 0.62 // abertura frontal del casco
  const madera = { color: '#8a6a4c', roughness: 0.8, metalness: 0.05 }

  return (
    <group>
      {/* Pérgola: viga superior y postes */}
      <mesh position={[0, 1.22, 0]} castShadow>
        <boxGeometry args={[2.3, 0.11, 0.16]} />
        <meshStandardMaterial {...madera} />
      </mesh>
      {([-1.08, 1.08] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.17, 0]} castShadow>
          <boxGeometry args={[0.11, 2.2, 0.13]} />
          <meshStandardMaterial {...madera} />
        </mesh>
      ))}

      {/* Cuerda y argolla */}
      <mesh position={[0, 0.99, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.38, 8]} />
        <meshStandardMaterial color="#c9b18c" roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.055, 0.016, 8, 24]} />
        <meshStandardMaterial {...fp} />
      </mesh>

      {/* Casco huevo tejido con abertura frontal */}
      <mesh position={[0, 0.1, 0]} scale={[0.95, 1.12, 0.95]} castShadow receiveShadow>
        <sphereGeometry args={[0.62, 48, 32, Math.PI / 2 + gap / 2, Math.PI * 2 - gap]} />
        <meshStandardMaterial {...wp} side={THREE.DoubleSide} />
      </mesh>
      {/* Aro estructural del casco */}
      <mesh position={[0, 0.1, 0]} scale={[0.95, 1.12, 0.95]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.62, 0.02, 8, 48]} />
        <meshStandardMaterial {...fp} />
      </mesh>

      {/* Cojín interior y almohada */}
      <mesh position={[0, -0.24, 0.06]} scale={[1, 0.55, 1]} castShadow>
        <sphereGeometry args={[0.4, 28, 18]} />
        <meshStandardMaterial {...cp} />
      </mesh>
      <mesh position={[0, 0.06, -0.28]} rotation={[0.4, 0, 0]} scale={[1, 1, 0.45]} castShadow>
        <sphereGeometry args={[0.26, 22, 14]} />
        <meshStandardMaterial {...cp} />
      </mesh>
    </group>
  )
}

// ── CABECERA / DAYBED IGLOO — cápsula huevo abierta al frente (ref: daybeds-igloo.jpg)
function DaybedModel({ wp, fp, cp }: { wp: WP; fp: FP; cp: FP }) {
  const gap = Math.PI * 0.7 // abertura frontal

  return (
    <group>
      {/* Cúpula huevo alta, abierta al frente */}
      <mesh position={[0, -0.12, 0]} scale={[1.02, 1.35, 0.98]} castShadow receiveShadow>
        <sphereGeometry args={[0.66, 48, 32, Math.PI / 2 + gap / 2, Math.PI * 2 - gap, 0, Math.PI * 0.62]} />
        <meshStandardMaterial {...wp} side={THREE.DoubleSide} />
      </mesh>
      {/* Remate superior */}
      <mesh position={[0, 0.78, 0]} castShadow>
        <sphereGeometry args={[0.07, 16, 12]} />
        <meshStandardMaterial {...fp} />
      </mesh>
      {/* Base de tambor tejido */}
      <mesh position={[0, -0.63, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.62, 0.68, 0.5, 40]} />
        <meshStandardMaterial {...wp} />
      </mesh>
      {/* Aro entre cúpula y base */}
      <mesh position={[0, -0.38, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.64, 0.028, 10, 56]} />
        <meshStandardMaterial {...fp} />
      </mesh>
      {/* Colchón redondo */}
      <mesh position={[0, -0.3, 0.02]} castShadow>
        <cylinderGeometry args={[0.56, 0.56, 0.16, 36]} />
        <meshStandardMaterial {...cp} />
      </mesh>
      {/* Cojines dentro de la cúpula */}
      {[-0.28, 0.02, 0.3].map((x, i) => (
        <mesh key={i} position={[x, -0.08, -0.3]} rotation={[0.35, 0, 0]} scale={[1, 1, 0.42]} castShadow>
          <sphereGeometry args={[0.22, 20, 14]} />
          <meshStandardMaterial {...cp} />
        </mesh>
      ))}
    </group>
  )
}

// ── ACCESORIO / CESTAS — canasta grande + canasta con tapa (ref: hamaca-nido-oscura.jpg)
function AccesorioModel({ wp, fp, cp }: { wp: WP; fp: FP; cp: FP }) {
  return (
    <group position={[0, -0.48, 0]}>
      {/* Canasta principal */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.44, 0.32, 0.78, 36]} />
        <meshStandardMaterial {...wp} />
      </mesh>
      {/* Borde superior */}
      <mesh position={[0, 0.39, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.44, 0.028, 10, 44]} />
        <meshStandardMaterial {...fp} />
      </mesh>
      {/* Aros del tejido */}
      {[-0.2, 0.02, 0.24].map((y, i) => {
        const r = 0.32 + ((y + 0.39) / 0.78) * (0.44 - 0.32)
        return (
          <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, 0.014, 8, 40]} />
            <meshStandardMaterial {...fp} />
          </mesh>
        )
      })}
      {/* Manta doblada asomando */}
      <mesh position={[0, 0.4, 0]} scale={[1, 0.4, 1]} castShadow>
        <sphereGeometry args={[0.34, 24, 16]} />
        <meshStandardMaterial {...cp} />
      </mesh>
      {/* Asa (arco apoyado en el borde) */}
      <mesh position={[0, 0.39, 0]} castShadow>
        <torusGeometry args={[0.3, 0.024, 8, 32, Math.PI]} />
        <meshStandardMaterial {...fp} />
      </mesh>

      {/* Canasta pequeña con tapa, en el piso al lado */}
      <group position={[0.66, -0.19, 0.18]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.2, 0.15, 0.4, 28]} />
          <meshStandardMaterial {...wp} />
        </mesh>
        <mesh position={[0, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.05, 28]} />
          <meshStandardMaterial {...wp} />
        </mesh>
        <mesh position={[0, 0.27, 0]}>
          <sphereGeometry args={[0.035, 12, 10]} />
          <meshStandardMaterial {...fp} />
        </mesh>
        <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.19, 0.012, 8, 28]} />
          <meshStandardMaterial {...fp} />
        </mesh>
      </group>
    </group>
  )
}

// ── Model selector ────────────────────────────────────────────────────────────
function FurnitureModel({ tipo, color, mat, cushion }: { tipo: string; color: string; mat: string; cushion: string }) {
  const isPolyalu = mat === 'polialuminio'
  const isCombinado = mat === 'combinado'
  const hex = toneForMaterial(safeHex(color), isPolyalu)
  const texture = useMemo(() => makeWickerTexture(hex, mat), [hex, mat])

  // La textura ya trae el tono del material: base blanca para no oscurecerla.
  // Mimbre: fibra natural mate y áspera, estructura del mismo tono.
  // Polialuminio: tejido sintético satinado sobre ESTRUCTURA DE ALUMINIO gris —
  // la estructura metálica es la señal visual más clara entre ambos.
  // Combinado: apariencia cálida del mimbre con acabado satinado y estructura
  // de aluminio (fibra sintética símil-mimbre sobre alma metálica).
  const wp: WP = isPolyalu
    ? { map: texture, color: '#ffffff', roughness: 0.38, metalness: 0.12 }
    : isCombinado
      ? { map: texture, color: '#ffffff', roughness: 0.55, metalness: 0.06 }
      : { map: texture, color: '#ffffff', roughness: 0.93, metalness: 0 }
  const fp: FP = isPolyalu || isCombinado
    ? { color: '#aeb4bb', roughness: 0.3, metalness: 0.85 } // aluminio cepillado
    : { color: hex, roughness: 0.9, metalness: 0 }
  // Material del cojín (tela mate, color independiente del tejido)
  const cp: FP = { color: safeHex(cushion), roughness: 0.97, metalness: 0 }

  switch (tipo) {
    case 'silla':     return <SillaModel wp={wp} fp={fp} cp={cp} />
    case 'sofa':      return <SofaModel wp={wp} fp={fp} cp={cp} />
    case 'mesa':      return <MesaModel wp={wp} fp={fp} />
    case 'hamaca':    return <HamacaModel wp={wp} fp={fp} cp={cp} />
    case 'cabecera':  return <DaybedModel wp={wp} fp={fp} cp={cp} />
    case 'accesorio': return <AccesorioModel wp={wp} fp={fp} cp={cp} />
    default:          return <SofaModel wp={wp} fp={fp} cp={cp} />
  }
}

// ── Camera config per tipo ────────────────────────────────────────────────────
function cameraForTipo(tipo: string): [number, number, number] {
  switch (tipo) {
    case 'hamaca':   return [2.9, 1.5, 2.9]
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
