"""
Generación de fichas técnicas PDF para Decormimbre.

Fichas disponibles:
  - generar_ficha_tecnica(pedido)          → ficha completa (admin/propietario)
  - generar_ficha_tejedor(pedido)           → ficha del artesano tejedor
  - generar_ficha_estructurista(pedido)     → ficha del artesano estructurista
"""
import io
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    Flowable, SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, HRFlowable,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

FONTS_DIR = Path(__file__).resolve().parent.parent.parent / "utils" / "fonts"
_fonts_registered = False


def _register_fonts():
    global _fonts_registered
    if _fonts_registered:
        return
    regular = FONTS_DIR / "DejaVuSans.ttf"
    bold = FONTS_DIR / "DejaVuSans-Bold.ttf"
    if regular.exists():
        pdfmetrics.registerFont(TTFont("DejaVu", str(regular)))
    if bold.exists():
        pdfmetrics.registerFont(TTFont("DejaVu-Bold", str(bold)))
    _fonts_registered = True


def _f(bold=False):
    _register_fonts()
    if bold and (FONTS_DIR / "DejaVuSans-Bold.ttf").exists():
        return "DejaVu-Bold"
    if (FONTS_DIR / "DejaVuSans.ttf").exists():
        return "DejaVu"
    return "Helvetica-Bold" if bold else "Helvetica"


AZUL = colors.HexColor("#003366")
VERDE = colors.HexColor("#1a5e2a")
NARANJA = colors.HexColor("#8B4513")
GRIS = colors.HexColor("#F2F2F2")
GRIS_MEDIO = colors.HexColor("#D0D0D0")


def _hex_to_color(hex_str: str):
    hex_str = hex_str.lstrip("#")
    if len(hex_str) == 6:
        r, g, b = int(hex_str[0:2], 16), int(hex_str[2:4], 16), int(hex_str[4:6], 16)
        return colors.Color(r / 255, g / 255, b / 255)
    return colors.white


def _doc(buffer, color_borde=None):
    return SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2 * cm, leftMargin=2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
    )


def _estilos(color_acento=None):
    color_acento = color_acento or AZUL
    return {
        "normal": ParagraphStyle("n", fontName=_f(), fontSize=9),
        "titulo": ParagraphStyle("t", fontName=_f(bold=True), fontSize=15, textColor=color_acento),
        "subtitulo": ParagraphStyle("s", fontName=_f(bold=True), fontSize=11, textColor=color_acento),
        "acento": color_acento,
    }


# ── Ficha Técnica Completa (Admin) ─────────────────────────────────────────────

def generar_ficha_tecnica(pedido) -> bytes:
    """Ficha técnica completa con precio, cliente y todos los detalles."""
    _register_fonts()
    buffer = io.BytesIO()
    doc = _doc(buffer)
    e = _estilos(AZUL)
    story: list[Flowable] = []

    story.append(Paragraph("DECORMIMBRE — Ficha Técnica de Producción", e["titulo"]))
    story.append(HRFlowable(width="100%", thickness=2, color=AZUL))
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph(f"Pedido: {pedido.numero}", e["subtitulo"]))
    story.append(Spacer(1, 0.2 * cm))

    cliente = pedido.cliente
    datos_header = [
        ["Cliente:", cliente.nombre_completo, "Estado:", pedido.get_estado_display()],
        ["Cédula/RUC:", cliente.cedula_ruc, "Entrega prometida:",
         pedido.fecha_promesa_entrega.strftime("%d/%m/%Y") if pedido.fecha_promesa_entrega else "—"],
        ["Teléfono:", cliente.telefono, "Total:", f"${pedido.total:,.2f}"],
    ]
    t_header = Table(datos_header, colWidths=[3*cm, 7*cm, 3.5*cm, 3.5*cm])
    t_header.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), _f()),
        ("FONTNAME", (0, 0), (0, -1), _f(bold=True)),
        ("FONTNAME", (2, 0), (2, -1), _f(bold=True)),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BACKGROUND", (0, 0), (-1, -1), GRIS),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.white),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 0.5 * cm))

    story.append(Paragraph("Detalle de Ítems", e["subtitulo"]))
    story.append(Spacer(1, 0.2 * cm))

    headers = ["#", "Producto", "Dimensiones (cm)", "Cant.", "Color", "Muestra", "Obs."]
    filas = [headers]
    for i, item in enumerate(pedido.items.select_related("producto", "color").all(), 1):
        dims = _formato_dims(item)
        color_nombre = "—"
        muestra = ""
        if item.color:
            color_nombre = item.color.nombre
            muestra = item.color.hex
        filas.append([
            str(i), item.producto.nombre, dims, str(item.cantidad),
            color_nombre, muestra, item.observaciones or "—",
        ])

    tabla = Table(filas, colWidths=[0.6*cm, 4.5*cm, 3.5*cm, 1*cm, 2.5*cm, 1.5*cm, 3.4*cm])
    style = _estilo_tabla_base(AZUL)
    for row_idx, item in enumerate(pedido.items.select_related("color").all(), 1):
        if item.color and item.color.hex:
            style.append(("BACKGROUND", (5, row_idx), (5, row_idx), _hex_to_color(item.color.hex)))
    tabla.setStyle(TableStyle(style))
    story.append(tabla)

    story.extend(_footer(pedido, e))
    doc.build(story)
    return buffer.getvalue()


# ── Ficha del Tejedor ──────────────────────────────────────────────────────────

def generar_ficha_tejedor(pedido) -> bytes:
    """
    Ficha para el artesano tejedor.
    Destaca: colores exactos (muestra visual), dimensiones, observaciones de tejido.
    Omite precios.
    """
    _register_fonts()
    buffer = io.BytesIO()
    doc = _doc(buffer)
    e = _estilos(VERDE)
    story: list[Flowable] = []

    story.append(Paragraph("DECORMIMBRE — Orden de Tejido", e["titulo"]))
    story.append(HRFlowable(width="100%", thickness=2, color=VERDE))
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph(f"Pedido: {pedido.numero}", e["subtitulo"]))
    story.append(Spacer(1, 0.2 * cm))

    entrega = pedido.fecha_promesa_entrega.strftime("%d/%m/%Y") if pedido.fecha_promesa_entrega else "—"
    info = [
        ["Artesano tejedor:", pedido.artesano_tejido.nombre if pedido.artesano_tejido else "—",
         "Entrega al cliente:", entrega],
        ["Etapa actual:", pedido.get_etapa_produccion_display() or "—",
         "Material:", "Mimbre natural"],
    ]
    t = Table(info, colWidths=[4*cm, 6*cm, 3.5*cm, 3.5*cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), _f()),
        ("FONTNAME", (0, 0), (0, -1), _f(bold=True)),
        ("FONTNAME", (2, 0), (2, -1), _f(bold=True)),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BACKGROUND", (0, 0), (-1, -1), GRIS),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.white),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.5 * cm))

    story.append(Paragraph("Especificaciones de tejido por ítem", e["subtitulo"]))
    story.append(Spacer(1, 0.15 * cm))
    story.append(Paragraph(
        "⚠ Respete los colores exactos indicados. Use la muestra de color como referencia.",
        ParagraphStyle("alerta", fontName=_f(), fontSize=8, textColor=colors.HexColor("#8B0000")),
    ))
    story.append(Spacer(1, 0.2 * cm))

    headers = ["#", "Producto", "Ancho", "Alto", "Largo", "Color exacto", "Muestra", "Notas de tejido"]
    filas = [headers]
    for i, item in enumerate(pedido.items.select_related("producto", "color").all(), 1):
        color_nombre = item.color.nombre if item.color else "SIN COLOR — consultar"
        hex_val = item.color.hex if item.color else ""
        obs = item.observaciones or "—"
        filas.append([
            str(i), item.producto.nombre,
            f"{item.ancho_cm} cm" if item.ancho_cm else "—",
            f"{item.alto_cm} cm" if item.alto_cm else "—",
            f"{item.largo_cm} cm" if item.largo_cm else "—",
            color_nombre, hex_val, obs,
        ])

    anchos = [0.6*cm, 3.5*cm, 1.5*cm, 1.5*cm, 1.5*cm, 3*cm, 1.5*cm, 4.9*cm]
    tabla = Table(filas, colWidths=anchos)
    style = _estilo_tabla_base(VERDE)
    for row_idx, item in enumerate(pedido.items.select_related("color").all(), 1):
        if item.color and item.color.hex:
            c = _hex_to_color(item.color.hex)
            style.append(("BACKGROUND", (6, row_idx), (6, row_idx), c))
    tabla.setStyle(TableStyle(style))
    story.append(tabla)

    story.append(Spacer(1, 0.5 * cm))
    story.append(Paragraph(
        "Una vez finalizado el tejido, marcar la tarea como COMPLETADA en el sistema.",
        ParagraphStyle("rec", fontName=_f(), fontSize=8, textColor=VERDE),
    ))

    story.extend(_footer(pedido, e))
    doc.build(story)
    return buffer.getvalue()


# ── Ficha del Estructurista ────────────────────────────────────────────────────

def generar_ficha_estructurista(pedido) -> bytes:
    """
    Ficha para el artesano estructurista.
    Destaca: dimensiones exactas, cantidad de planchas de polialuminio, orden de corte.
    Omite colores de tejido y precios.
    """
    _register_fonts()
    buffer = io.BytesIO()
    doc = _doc(buffer)
    e = _estilos(NARANJA)
    story: list[Flowable] = []

    story.append(Paragraph("DECORMIMBRE — Orden de Estructura", e["titulo"]))
    story.append(HRFlowable(width="100%", thickness=2, color=NARANJA))
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph(f"Pedido: {pedido.numero}", e["subtitulo"]))
    story.append(Spacer(1, 0.2 * cm))

    entrega = pedido.fecha_promesa_entrega.strftime("%d/%m/%Y") if pedido.fecha_promesa_entrega else "—"
    info = [
        ["Artesano estructurista:", pedido.artesano_estructura.nombre if pedido.artesano_estructura else "—",
         "Entrega al cliente:", entrega],
        ["Etapa actual:", pedido.get_etapa_produccion_display() or "—",
         "Material:", "Polialuminio (Tetrapack reciclado)"],
    ]
    t = Table(info, colWidths=[4.5*cm, 5.5*cm, 3.5*cm, 3.5*cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), _f()),
        ("FONTNAME", (0, 0), (0, -1), _f(bold=True)),
        ("FONTNAME", (2, 0), (2, -1), _f(bold=True)),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BACKGROUND", (0, 0), (-1, -1), GRIS),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.white),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.5 * cm))

    story.append(Paragraph("Especificaciones estructurales por ítem", e["subtitulo"]))
    story.append(Spacer(1, 0.15 * cm))
    story.append(Paragraph(
        "⚠ Verifique las dimensiones antes de cortar. Las medidas son en centímetros.",
        ParagraphStyle("alerta", fontName=_f(), fontSize=8, textColor=colors.HexColor("#8B0000")),
    ))
    story.append(Spacer(1, 0.2 * cm))

    headers = ["#", "Producto / Mueble", "Cant.", "Ancho (cm)", "Alto (cm)", "Largo (cm)", "Observaciones"]
    filas = [headers]
    for i, item in enumerate(pedido.items.select_related("producto").all(), 1):
        filas.append([
            str(i),
            item.producto.nombre,
            str(item.cantidad),
            str(item.ancho_cm) if item.ancho_cm else "—",
            str(item.alto_cm) if item.alto_cm else "—",
            str(item.largo_cm) if item.largo_cm else "—",
            item.observaciones or "—",
        ])

    anchos = [0.6*cm, 5*cm, 1.2*cm, 2.2*cm, 2.2*cm, 2.2*cm, 3.6*cm]
    tabla = Table(filas, colWidths=anchos)
    tabla.setStyle(TableStyle(_estilo_tabla_base(NARANJA)))
    story.append(tabla)

    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph("Proceso de fabricación de estructura:", e["subtitulo"]))
    story.append(Spacer(1, 0.1 * cm))
    pasos = [
        "1. Cortar las planchas de polialuminio según las dimensiones indicadas.",
        "2. Soldar o remachar los marcos de acuerdo al diseño del producto.",
        "3. Lijar bordes y verificar medidas finales antes de pasar a tejido.",
        "4. Marcar con el número de pedido antes de entregar al tejedor.",
    ]
    for paso in pasos:
        story.append(Paragraph(paso, ParagraphStyle("paso", fontName=_f(), fontSize=8, leftIndent=0.3*cm)))

    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph(
        "Una vez finalizada la estructura, marcar la tarea como COMPLETADA en el sistema.",
        ParagraphStyle("rec", fontName=_f(), fontSize=8, textColor=NARANJA),
    ))

    story.extend(_footer(pedido, e))
    doc.build(story)
    return buffer.getvalue()


# ── Helpers internos ───────────────────────────────────────────────────────────

def _formato_dims(item) -> str:
    if not any([item.ancho_cm, item.alto_cm, item.largo_cm]):
        return "—"
    partes = []
    if item.ancho_cm:
        partes.append(f"A:{item.ancho_cm}")
    if item.alto_cm:
        partes.append(f"H:{item.alto_cm}")
    if item.largo_cm:
        partes.append(f"L:{item.largo_cm}")
    return " | ".join(partes)


def _estilo_tabla_base(color_cabecera) -> list:
    return [
        ("FONTNAME", (0, 0), (-1, -1), _f()),
        ("FONTNAME", (0, 0), (-1, 0), _f(bold=True)),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("BACKGROUND", (0, 0), (-1, 0), color_cabecera),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, GRIS]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]


def _footer(pedido, e) -> list:
    story: list[Flowable] = [Spacer(1, 0.5 * cm)]
    if pedido.observaciones:
        story.append(Paragraph(
            "Observaciones generales:",
            ParagraphStyle("obs_t", fontName=_f(bold=True), fontSize=9),
        ))
        story.append(Paragraph(pedido.observaciones, e["normal"]))
        story.append(Spacer(1, 0.3 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=e["acento"]))
    story.append(Paragraph(
        "Decormimbre · Muebles Artesanales Ecológicos · Quito, Ecuador",
        e["normal"],
    ))
    return story
