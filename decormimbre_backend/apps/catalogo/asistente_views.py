"""
Asistente virtual de Decormimbre.

Endpoint público que responde preguntas de los usuarios sobre la empresa usando
la API de Claude (Anthropic). Si no hay ANTHROPIC_API_KEY configurada o el SDK no
está instalado, degrada de forma elegante a un respondedor local basado en la base
de conocimiento de la empresa, para que el asistente siga siendo útil.

La llamada al LLM ocurre SOLO en el backend: la API key nunca se expone al navegador.
"""
from rest_framework import serializers, status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.throttling import ScopedRateThrottle
from django.conf import settings

from utils.responses import success_response, error_response, validation_error_response
from .cotizador import detectar_cotizacion


def _formatear_cotizacion(c: dict) -> str:
    esp = c["especificaciones"]
    cojin = "con cojín incluido" if esp["incluye_cojin"] else "sin cojín"
    return (
        f"{c['producto']} en {c['material']}, tamaño {c['tamano'].lower()}, color {c['color'].lower()}.\n\n"
        f"Total: ${c['total']} (IVA incluido) — unitario ${c['precio_unitario']}\n"
        f"Medidas: {esp['dimensiones']}\n"
        f"Estructura: {esp['estructura']} ({cojin})\n"
        f"Producción: {esp['tiempo_produccion']}\n\n"
        f"Es un precio referencial. ¿Te la enviamos formal por WhatsApp (098 057 2561) o la personalizas en 3D?"
    )


# ── Base de conocimiento de la empresa (fuente del prompt y del fallback) ───────
EMPRESA_INFO = """
Decormimbre — Decoraciones (Quito, Ecuador). Fundada en 1999.
Empresa artesanal de fabricación, venta y decoración de muebles, especializada en
el tejido de mimbre. Más de dos décadas de trayectoria.

Ubicación: Versalles N23-56, entre Mercadillo y Marchena, cerca del Mercado Santa
Clara — Quito, Ecuador.
Contacto: WhatsApp/celular 098 057 2561 · teléfono fijo (02) 256 4256 ·
correo decormimbre@yahoo.com.

Qué hacemos: muebles de mimbre y madera, sofás, salas, comedores, muebles de
exterior en polialuminio, y decoración para el hogar (cestas, accesorios).

Materiales:
- Mimbre: fibra vegetal natural (sauce), tejida a mano. Ideal para interiores.
  Biodegradable, textura orgánica, +20 años de vida útil con cuidado básico.
- Polialuminio: fibra sintética de HDPE con alma de aluminio. Imita el mimbre pero
  resiste sol, lluvia, humedad y rayos UV. Ideal para exteriores. +10 años sin
  decolorarse. Sin mantenimiento especial (agua y jabón).

Servicios:
- Personalización: en la página "Personalizar" el cliente arma su mueble (tipo,
  material, color, color del cojín, dimensiones) y ve una vista previa 3D interactiva.
- Cotizaciones: se responden en menos de 24 horas por email o WhatsApp.
- Producción bajo pedido: cada pieza es única. Los muebles personalizados tardan
  aproximadamente entre 15 y 25 días hábiles según complejidad.
- Envíos a todo el Ecuador. En Quito entrega directa; a otras ciudades por
  transportistas de confianza.
- IVA del 15% aplicable según normativa ecuatoriana.
""".strip()

SYSTEM_PROMPT = f"""Eres el asistente virtual de Decormimbre, una empresa artesanal
ecuatoriana de muebles de mimbre y polialuminio. Respondes en español, con un tono
cálido, cercano y profesional, en respuestas breves (2-5 frases).

Usa ÚNICAMENTE la siguiente información de la empresa para responder. Si te preguntan
algo que no está aquí (por ejemplo un precio exacto o disponibilidad puntual), no lo
inventes: explica que para eso lo mejor es una cotización y ofrece el WhatsApp
098 057 2561 o la página de Personalizar/Contacto.

Si la pregunta no tiene nada que ver con Decormimbre ni con muebles/decoración,
redirige amablemente al tema de la empresa.

--- INFORMACIÓN DE DECORMIMBRE ---
{EMPRESA_INFO}
--- FIN DE LA INFORMACIÓN ---
"""


class MensajeSerializer(serializers.Serializer):
    mensaje = serializers.CharField(max_length=1000, trim_whitespace=True)
    # Historial opcional para dar contexto: [{"rol": "user"|"assistant", "texto": "..."}]
    historial = serializers.ListField(child=serializers.DictField(), required=False, default=list)


def _fallback_local(mensaje: str) -> str:
    """Respuesta basada en palabras clave cuando no hay LLM disponible."""
    m = mensaje.lower()
    if any(w in m for w in ["mimbre", "qué es el mimbre", "natural"]):
        return ("El mimbre es una fibra vegetal natural tejida a mano, ideal para "
                "interiores: cálida, biodegradable y con más de 20 años de vida útil. "
                "¿Quieres personalizar un mueble de mimbre?")
    if any(w in m for w in ["polialuminio", "exterior", "lluvia", "sol", "jardín", "jardin"]):
        return ("El polialuminio es una fibra sintética con alma de aluminio que imita "
                "el mimbre pero resiste sol, lluvia y humedad — perfecto para exteriores. "
                "Sin mantenimiento especial.")
    if any(w in m for w in ["precio", "cuánto", "cuanto", "costo", "cotiz"]):
        return ("Los precios dependen del mueble, material y medidas. Te preparamos una "
                "cotización en menos de 24 h: escríbenos por WhatsApp al 098 057 2561 o "
                "usa la página Personalizar.")
    if any(w in m for w in ["envío", "envio", "entrega", "despacho"]):
        return ("Hacemos envíos a todo el Ecuador. En Quito la entrega es directa; a "
                "otras ciudades coordinamos con transportistas de confianza.")
    if any(w in m for w in ["tiempo", "demora", "cuándo", "cuando", "días", "dias"]):
        return ("Los muebles personalizados tardan entre 15 y 25 días hábiles según la "
                "complejidad del diseño.")
    if any(w in m for w in ["dónde", "donde", "ubicación", "ubicacion", "dirección", "direccion", "local"]):
        return ("Estamos en Versalles N23-56 y Marchena, cerca del Mercado Santa Clara, "
                "Quito. Tel. (02) 256 4256 · WhatsApp 098 057 2561.")
    if any(w in m for w in ["hola", "buenas", "buenos días", "buenas tardes"]):
        return ("¡Hola! 👋 Soy el asistente de Decormimbre. Puedo contarte sobre nuestros "
                "muebles de mimbre y polialuminio, materiales, tiempos, envíos y cómo "
                "personalizar tu pieza. ¿Qué te gustaría saber?")
    return ("Con gusto te ayudo con información sobre nuestros muebles de mimbre y "
            "polialuminio, personalización, tiempos y envíos. Para precios o pedidos, "
            "escríbenos por WhatsApp al 098 057 2561. ¿En qué te ayudo?")


def _responder_con_claude(mensaje: str, historial: list) -> str | None:
    """Llama a la API de Claude. Devuelve None si no está disponible (para caer al fallback)."""
    api_key = getattr(settings, "ANTHROPIC_API_KEY", "")
    if not api_key:
        return None
    try:
        import anthropic
    except ImportError:
        return None

    # Construir mensajes con historial acotado (últimos 6 turnos)
    mensajes: list[anthropic.types.MessageParam] = []
    for turno in historial[-6:]:
        rol = turno.get("rol")
        texto = (turno.get("texto") or "").strip()
        if rol in ("user", "assistant") and texto:
            mensajes.append({"role": rol, "content": texto[:1000]})
    mensajes.append({"role": "user", "content": mensaje})

    try:
        client = anthropic.Anthropic(api_key=api_key)
        respuesta = client.messages.create(
            model=getattr(settings, "ASISTENTE_MODEL", "claude-opus-4-8"),
            max_tokens=512,
            system=SYSTEM_PROMPT,
            messages=mensajes,
        )
        partes = [b.text for b in respuesta.content if getattr(b, "type", None) == "text"]
        texto = "\n".join(p for p in partes if p).strip()
        return texto or None
    except Exception:
        # Cualquier fallo de red/API cae al fallback local.
        return None


class AsistenteView(APIView):
    """
    POST /api/v1/public/asistente/
    Body: {"mensaje": "...", "historial": [{"rol": "user"|"assistant", "texto": "..."}]}

    Responde preguntas del usuario sobre Decormimbre. Con IA (Claude) si hay API key;
    de lo contrario, con un respondedor local basado en la base de conocimiento.
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    versioning_class = None
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "asistente"

    def post(self, request):
        serializer = MensajeSerializer(data=request.data)
        if not serializer.is_valid():
            return validation_error_response(serializer)

        mensaje = serializer.validated_data["mensaje"].strip()
        historial = serializer.validated_data.get("historial", [])
        if not mensaje:
            return error_response("MENSAJE_VACIO", "Escribe una pregunta.", status_code=400)

        # Híbrido: si el mensaje pide un mueble concreto, el precio lo fija el
        # motor de reglas (nunca lo inventa la IA) y se responde al instante.
        cot = detectar_cotizacion(mensaje)
        if cot:
            return success_response(data={"respuesta": _formatear_cotizacion(cot), "ia": False, "cotizacion": cot})

        texto = _responder_con_claude(mensaje, historial)
        con_ia = texto is not None
        if texto is None:
            texto = _fallback_local(mensaje)

        return success_response(data={"respuesta": texto, "ia": con_ia})
