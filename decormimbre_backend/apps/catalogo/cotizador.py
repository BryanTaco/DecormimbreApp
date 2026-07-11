"""
Motor de cotización rápida (reglas) de Decormimbre.

Calcula precio y especificaciones a partir de un PRODUCTO BASE (con sus medidas,
estructura y precio de referencia) y unos ajustes (material, tamaño, color). Es
determinista: nunca "inventa" precios. La capa conversacional (Claude) se apoya
en este motor para dar cotizaciones al instante.
"""
from __future__ import annotations

IVA = 0.15
TIEMPO_PRODUCCION = "15 a 25 días hábiles"

# Producto base: precio de referencia para tamaño estándar en su material base.
PRODUCTOS_BASE = {
    "columpio": {
        "nombre": "Columpio colgante",
        "imagen": "/products/colgante-nube.jpg",
        "categoria": "Exterior",
        "precio_base": 480,
        "material_base": "mimbre",
        "dimensiones": "100 × 100 × 115 cm (asiento Ø 95 cm)",
        "estructura": "Aro colgante reforzado, cadena de acero inoxidable y gancho de techo con capacidad hasta 150 kg",
        "cojin": True,
    },
    "papasan": {
        "nombre": "Silla Papasan (Nido)",
        "imagen": "/products/papasan-set.jpg",
        "categoria": "Sala",
        "precio_base": 260,
        "material_base": "mimbre",
        "dimensiones": "95 × 95 × 90 cm",
        "estructura": "Base circular de mimbre sobre pie tejido; cojín envolvente",
        "cojin": True,
    },
    "sofa": {
        "nombre": "Sofá Serena",
        "imagen": "/products/sala-modular-oscura.jpg",
        "categoria": "Sala",
        "precio_base": 620,
        "material_base": "polialuminio",
        "dimensiones": "180 × 90 × 75 cm",
        "estructura": "Estructura de aluminio con tejido de polialuminio; cojines de espuma HR",
        "cojin": True,
    },
    "mesa": {
        "nombre": "Mesa tejida",
        "imagen": "/products/comedor-tejido.jpg",
        "categoria": "Comedor",
        "precio_base": 340,
        "material_base": "mimbre",
        "dimensiones": "120 × 70 × 75 cm",
        "estructura": "Bastidor de aluminio tejido a mano con tapa de vidrio templado",
        "cojin": False,
    },
    "colgante_huevo": {
        "nombre": "Butaca colgante huevo",
        "imagen": "/products/set-exterior-huevo.jpg",
        "categoria": "Exterior",
        "precio_base": 520,
        "material_base": "polialuminio",
        "dimensiones": "105 × 105 × 195 cm (con soporte)",
        "estructura": "Soporte de acero epoxicado + cápsula tejida en polialuminio; cojín impermeable",
        "cojin": True,
    },
    "silla": {
        "nombre": "Silla artesanal",
        "imagen": "/products/silla-artesanal.jpg",
        "categoria": "Comedor",
        "precio_base": 145,
        "material_base": "mimbre",
        "dimensiones": "45 × 50 × 95 cm",
        "estructura": "Estructura de madera/aluminio con respaldo y asiento tejidos a mano",
        "cojin": False,
    },
}

# Sinónimos → clave de producto (para detectar en texto libre)
ALIAS = {
    "columpio": "columpio", "columpios": "columpio", "hamaca colgante": "columpio",
    "papasan": "papasan", "nido": "papasan", "silla nido": "papasan",
    "sofa": "sofa", "sofá": "sofa", "sala": "sofa", "sillon": "sofa", "sillón": "sofa",
    "mesa": "mesa", "comedor": "mesa",
    "huevo": "colgante_huevo", "colgante": "colgante_huevo", "butaca colgante": "colgante_huevo",
    "silla": "silla", "sillas": "silla",
}

MATERIAL_FACTOR = {"mimbre": 1.0, "polialuminio": 1.18}
TAMANO_FACTOR = {"pequeno": 0.85, "estandar": 1.0, "grande": 1.30}
TAMANO_LABEL = {"pequeno": "Pequeño", "estandar": "Estándar", "grande": "Grande"}
COLOR_RECARGO = {"estandar": 0.0, "personalizado": 0.06}  # color a medida: +6%


def _money(n: float) -> float:
    return round(float(n), 2)


def cotizar(producto: str, material: str = "", tamano: str = "estandar",
            color: str = "estandar", cantidad: int = 1) -> dict | None:
    """Devuelve la cotización de un producto base o None si el producto no existe."""
    clave = ALIAS.get((producto or "").strip().lower(), (producto or "").strip().lower())
    base = PRODUCTOS_BASE.get(clave)
    if not base:
        return None

    material = (material or base["material_base"]).strip().lower()
    if material not in MATERIAL_FACTOR:
        material = base["material_base"]
    tamano = (tamano or "estandar").strip().lower()
    if tamano not in TAMANO_FACTOR:
        tamano = "estandar"
    color_key = "personalizado" if (color or "").strip().lower() not in ("", "estandar", "estándar") else "estandar"
    cantidad = max(1, int(cantidad or 1))

    mf, tf, cr = MATERIAL_FACTOR[material], TAMANO_FACTOR[tamano], COLOR_RECARGO[color_key]
    precio_unitario = _money(base["precio_base"] * mf * tf * (1 + cr))
    subtotal = _money(precio_unitario * cantidad)
    iva = _money(subtotal * IVA)
    total = _money(subtotal + iva)

    desglose = [
        {"concepto": f"{base['nombre']} — base ({base['material_base']}, estándar)", "valor": _money(base["precio_base"])},
    ]
    if mf != 1.0:
        desglose.append({"concepto": f"Material {material} (×{mf})", "valor": _money(base['precio_base'] * (mf - 1))})
    if tf != 1.0:
        signo = "+" if tf > 1 else "−"
        desglose.append({"concepto": f"Tamaño {TAMANO_LABEL[tamano].lower()} ({signo}{abs(round((tf-1)*100))}%)", "valor": _money(base['precio_base'] * mf * (tf - 1))})
    if cr:
        desglose.append({"concepto": "Color personalizado (+6%)", "valor": _money(base['precio_base'] * mf * tf * cr)})

    return {
        "producto": base["nombre"],
        "imagen": base.get("imagen", ""),
        "categoria": base["categoria"],
        "material": material,
        "tamano": TAMANO_LABEL[tamano],
        "color": "Personalizado" if color_key == "personalizado" else "Estándar",
        "cantidad": cantidad,
        "precio_unitario": precio_unitario,
        "subtotal": subtotal,
        "iva": iva,
        "total": total,
        "moneda": "USD",
        "especificaciones": {
            "dimensiones": base["dimensiones"],
            "estructura": base["estructura"],
            "incluye_cojin": base["cojin"],
            "tiempo_produccion": TIEMPO_PRODUCCION,
        },
        "desglose": desglose,
        "nota": "Precio referencial. La cotización final se confirma según medidas exactas y acabados.",
    }


def detectar_cotizacion(texto: str) -> dict | None:
    """Extrae producto/material/color de texto libre y cotiza (para el chat sin IA)."""
    t = (texto or "").lower()
    clave = None
    for alias, k in ALIAS.items():
        if alias in t:
            clave = k
            break
    if not clave:
        return None
    material = "polialuminio" if "polialuminio" in t or "exterior" in t else ("mimbre" if "mimbre" in t else "")
    tamano = "grande" if "grande" in t else ("pequeno" if any(w in t for w in ["pequeñ", "pequen", "chico"]) else "estandar")
    color = "personalizado" if any(w in t for w in ["azul", "verde", "rojo", "negro", "blanco", "gris", "color", "personaliz"]) else "estandar"
    return cotizar(clave, material=material, tamano=tamano, color=color)
