"""
Generador de PDF de cotización con soporte completo UTF-8.
Usa la fuente DejaVuSans para tildes, ñ y símbolos especiales.
"""
import io
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
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
    regular = FONTS_DIR / "DejaVuSans.ttf"
    bdfile = FONTS_DIR / "DejaVuSans-Bold.ttf"
    if bold and bdfile.exists():
        return "DejaVu-Bold"
    if regular.exists():
        return "DejaVu"
    return "Helvetica-Bold" if bold else "Helvetica"


AZUL = colors.HexColor("#003366")
AZUL_CLARO = colors.HexColor("#D6E4F0")
GRIS = colors.HexColor("#F2F2F2")


def generar_pdf_cotizacion(cotizacion) -> bytes:
    """
    Genera PDF de cotización y retorna bytes listos para FileResponse.
    """
    _register_fonts()
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2 * cm, leftMargin=2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
    )

    normal = ParagraphStyle("n", fontName=_f(), fontSize=9)
    bold = ParagraphStyle("b", fontName=_f(bold=True), fontSize=9)
    titulo = ParagraphStyle("t", fontName=_f(bold=True), fontSize=18, textColor=AZUL)

    story = []

    story.append(Paragraph("DECORMIMBRE", titulo))
    story.append(Paragraph("Muebles Artesanales Ecológicos · Quito, Ecuador", normal))
    story.append(HRFlowable(width="100%", thickness=2, color=AZUL))
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph(
        f"<b>COTIZACIÓN {cotizacion.numero}</b>  —  Versión v{cotizacion.version}", bold
    ))
    story.append(Spacer(1, 0.3 * cm))

    cliente = cotizacion.cliente
    datos_cliente = [
        ["Cliente:", cliente.nombre_completo, "Cédula/RUC:", cliente.cedula_ruc],
        ["Teléfono:", cliente.telefono, "Email:", cliente.email or "—"],
    ]
    t = Table(datos_cliente, colWidths=[3 * cm, 7 * cm, 3 * cm, 4 * cm])
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

    headers = ["#", "Producto", "Dimensiones (cm)", "Color", "Cant.", "P. Unit.", "Subtotal"]
    filas = [headers]
    for i, item in enumerate(cotizacion.items.select_related("producto", "color").all(), 1):
        dims = "—"
        if item.ancho_cm or item.alto_cm or item.largo_cm:
            partes = []
            if item.ancho_cm:
                partes.append(f"A:{item.ancho_cm}")
            if item.alto_cm:
                partes.append(f"H:{item.alto_cm}")
            if item.largo_cm:
                partes.append(f"L:{item.largo_cm}")
            dims = " | ".join(partes)

        color_txt = "—"
        if item.color:
            color_txt = f"{item.color.nombre}\n{item.color.hex}"

        filas.append([
            str(i), item.producto.nombre, dims, color_txt,
            str(item.cantidad),
            f"${item.precio_unitario:,.2f}",
            f"${item.subtotal:,.2f}",
        ])

    tabla_items = Table(filas, colWidths=[0.7*cm, 5*cm, 3.5*cm, 3*cm, 1.2*cm, 2.3*cm, 2.3*cm])
    tabla_items.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), _f()),
        ("FONTNAME", (0, 0), (-1, 0), _f(bold=True)),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("BACKGROUND", (0, 0), (-1, 0), AZUL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, GRIS]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("ALIGN", (4, 0), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(tabla_items)
    story.append(Spacer(1, 0.5 * cm))

    totales = [
        ["", "", "", "", "", "Subtotal:", f"${cotizacion.subtotal:,.2f}"],
        ["", "", "", "", "", "IVA (15%):", f"${cotizacion.iva:,.2f}"],
        ["", "", "", "", "", "TOTAL USD:", f"${cotizacion.total:,.2f}"],
    ]
    t_totales = Table(totales, colWidths=[0.7*cm, 5*cm, 3.5*cm, 3*cm, 1.2*cm, 2.3*cm, 2.3*cm])
    t_totales.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), _f()),
        ("FONTNAME", (5, 2), (6, 2), _f(bold=True)),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (5, 0), (6, -1), "RIGHT"),
        ("BACKGROUND", (5, 2), (6, 2), AZUL_CLARO),
        ("LINEABOVE", (5, 0), (6, 0), 1, AZUL),
    ]))
    story.append(t_totales)
    story.append(Spacer(1, 0.5 * cm))

    if cotizacion.fecha_expiracion:
        exp = cotizacion.fecha_expiracion.strftime("%d/%m/%Y")
        story.append(Paragraph(f"Esta cotización es válida hasta el <b>{exp}</b>.", normal))

    story.append(Spacer(1, 0.3 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=AZUL))
    story.append(Paragraph("Decormimbre · Muebles Artesanales Ecológicos · Quito, Ecuador", normal))

    doc.build(story)
    return buffer.getvalue()
