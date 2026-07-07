import { EMPRESA, mapsEmbedUrl, mapsLink } from '@/lib/empresa'

// Mapa embebido de Google Maps con la ubicación del local (sin API key).
export default function MapEmbed({ height = 320 }: { height?: number }) {
  return (
    <div
      className="rounded-[2rem] overflow-hidden border border-[rgba(92,64,51,0.1)]"
      style={{ background: '#fff' }}
    >
      <iframe
        title="Ubicación de Decormimbre"
        src={mapsEmbedUrl()}
        width="100%"
        height={height}
        style={{ border: 0, display: 'block' }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'rgba(92,64,51,0.7)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {EMPRESA.direccion} — {EMPRESA.ciudad}
        </p>
        <a
          href={mapsLink()}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            fontWeight: 600,
            color: '#5C4033',
            whiteSpace: 'nowrap',
            textDecoration: 'none',
          }}
        >
          Cómo llegar →
        </a>
      </div>
    </div>
  )
}
