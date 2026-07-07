// Datos de contacto y de la empresa Decormimbre (fuente única de verdad)

export const EMPRESA = {
  nombre: 'Decormimbre',
  fundacion: 1999,
  email: 'decormimbre@yahoo.com',
  telefonoFijo: '(02) 256 4256',
  // WhatsApp / celular — formato internacional sin '+' para wa.me
  whatsapp: '593980572561',
  whatsappDisplay: '098 057 2561',
  direccion: 'Versalles N23-56, entre Mercadillo y Marchena, cerca del Mercado Santa Clara',
  ciudad: 'Quito, Ecuador',
  // Consulta usada por el embed de Google Maps
  mapsQuery: 'Decormimbre Versalles N23-56 y Marchena, Quito, Ecuador',
} as const

/** Enlace click-to-chat de WhatsApp con mensaje prellenado. */
export function waLink(
  mensaje = 'Hola Decormimbre 👋, quisiera más información sobre sus muebles de mimbre y polialuminio.',
): string {
  return `https://wa.me/${EMPRESA.whatsapp}?text=${encodeURIComponent(mensaje)}`
}

/** URL del mapa embebido de Google Maps (no requiere API key). */
export function mapsEmbedUrl(): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(EMPRESA.mapsQuery)}&output=embed`
}

/** URL para abrir la ubicación en Google Maps en una pestaña nueva. */
export function mapsLink(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(EMPRESA.mapsQuery)}`
}
