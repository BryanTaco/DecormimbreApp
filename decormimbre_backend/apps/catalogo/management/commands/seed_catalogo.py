"""
Siembra el catálogo en la base de datos con los productos del sitio (idempotente).

Uso:
    python manage.py seed_catalogo
"""
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.catalogo.models import Categoria, Producto


# Espejo del catálogo del frontend (nombre, categoría, material, precio, imagen, descripción)
PRODUCTOS = [
    ("Sofá Serena", "Sala", "COMBINADO", 620, "sala-modular-oscura.jpg", "Sala modular en tejido resistente. Estructura de polialuminio con acabado artesanal."),
    ("Silla Nido", "Sala", "MIMBRE", 185, "papasan-set.jpg", "Sillas papasan tejidas a mano. Forma que abraza el cuerpo, diseño ecuatoriano."),
    ("Set Jardín Pacífico", "Exterior", "POLIALUMINIO", 890, "set-exterior-huevo.jpg", "Set completo para exteriores con sillas nido. Tejido resistente al sol y la lluvia."),
    ("Silla Sierra", "Comedor", "POLIALUMINIO", 95, "silla-artesanal.jpg", "Silla artesanal tejida. Resistente y fácil de mantener, ideal para comedores."),
    ("Butaca Andina", "Sala", "MIMBRE", 180, "colgante-huevo-azul.jpg", "Silla colgante tipo huevo con cojín. Diseño ecuatoriano, cómoda y elegante."),
    ("Cestas Artesanales", "Accesorios", "MIMBRE", 45, "cesta-mantas.jpg", "Cestas tejidas a mano en mimbre natural. Perfectas para decoración y almacenaje."),
    ("Chaise Terraza", "Exterior", "POLIALUMINIO", 340, "chaise-piscina-real.jpg", "Chaise longue para terrazas y piscinas. Polialuminio resistente al sol y la humedad."),
    ("Sala Íntima", "Dormitorio", "MIMBRE", 260, "set-sala-tejido.jpg", "Conjunto tejido de textura cálida y natural, perfecto para espacios de descanso."),
    ("Sillas Comedor Raíz", "Comedor", "MIMBRE", 120, "comedor-tejido.jpg", "Juego de comedor con sillas de respaldo tejido y mesa central artesanal."),
    ("Butacas Sunroom", "Sala", "MIMBRE", 320, "butacas-sunroom.jpg", "Par de butacas tejidas para espacios luminosos. Comodidad y textura natural."),
    ("Sillones Ventanal", "Sala", "MIMBRE", 360, "sillones-ventanal.jpg", "Sillones envolventes de mimbre tejido, perfectos junto a grandes ventanales."),
    ("Loveseat Riviera", "Exterior", "MIMBRE", 520, "loveseat-riviera.jpg", "Bancada de mimbre con cojín para exteriores. Elegancia clásica y durabilidad."),
    ("Silla Orbital", "Sala", "MIMBRE", 195, "silla-circular.jpg", "Silla circular que abraza el cuerpo. Tejida a mano por artesanos ecuatorianos."),
    ("Set Sala Ébano", "Sala", "POLIALUMINIO", 780, "sala-ebano.jpg", "Set de sala en polialuminio oscuro con cojines premium para interiores exigentes."),
    ("Set Comedor Redondo", "Comedor", "POLIALUMINIO", 890, "set-comedor.jpg", "Mesa redonda con sillas tejidas. Ideal para comedores y terrazas techadas."),
    ("Silla Nido Tejida", "Sala", "MIMBRE", 185, "silla-nido.jpg", "Silla nido de mimbre natural con forma oval envolvente."),
    ("Hamaca Jardín", "Exterior", "COMBINADO", 340, "hamaca-jardin.jpg", "Silla colgante para terrazas y jardines. Descanso al aire libre con estilo."),
    ("Daybed Iglú", "Dormitorio", "MIMBRE", 760, "daybeds-igloo.jpg", "Daybed tejido tipo iglú con cojines. Un refugio de descanso para dormitorio o terraza."),
    # Fotos nuevas
    ("Butaca Colgante Nube", "Exterior", "MIMBRE", 340, "colgante-nube.jpg", "Silla colgante tipo huevo con cojín envolvente. Descanso suspendido para terraza o interior."),
    ("Bandejas de Mimbre", "Accesorios", "MIMBRE", 35, "bandejas-mimbre.jpg", "Bandejas artesanales tejidas a mano. Fusión de arte y naturaleza para servir y decorar."),
    ("Comedor Terraza", "Comedor", "COMBINADO", 780, "comedor-terraza.jpg", "Juego de comedor para terraza con sillas tejidas y mesa resistente al exterior."),
    ("Set Jardín Real", "Exterior", "MIMBRE", 920, "set-jardin-real.jpg", "Set de jardín con sillas tipo pavo real y mesa redonda. Tejido natural de alto detalle."),
    ("Sala Curva Marfil", "Sala", "MIMBRE", 690, "sala-curva-marfil.jpg", "Conjunto de sala curvo en tonos marfil. Sofá y butacas tejidas de líneas suaves."),
    ("Butacas Cromía", "Sala", "MIMBRE", 360, "butacas-cromia.jpg", "Butacas tejidas en colores a elección (mostaza, azul y más). Carácter y comodidad."),
    ("Set Modular Olivo", "Exterior", "POLIALUMINIO", 980, "set-modular-olivo.jpg", "Set modular redondo para exterior con cojines verde olivo. Polialuminio resistente."),
    ("Taburete Terraza", "Exterior", "POLIALUMINIO", 160, "taburete-terraza.jpg", "Taburete alto tejido para barras y terrazas. Resistente al sol y la humedad."),
    ("Set Terraza Cobre", "Exterior", "POLIALUMINIO", 850, "set-terraza-cobre.jpg", "Set de terraza en tonos cobre para azoteas. Sillones tejidos con cojines premium."),
    ("Búhos Decorativos", "Accesorios", "MIMBRE", 55, "buhos-decorativos.jpg", "Figuras decorativas de búho tejidas a mano. Pieza artesanal única para tu hogar."),
    ("Dúo Papasan", "Sala", "MIMBRE", 370, "duo-papasan.jpg", "Par de sillas papasan tejidas en mimbre natural. Forma envolvente y acogedora."),
    ("Comedor Alameda", "Comedor", "COMBINADO", 820, "comedor-alameda.jpg", "Comedor de líneas cálidas con sillas de respaldo tejido y mesa amplia."),
]


class Command(BaseCommand):
    help = "Crea/actualiza el catálogo de productos con las imágenes del sitio."

    @transaction.atomic
    def handle(self, *args, **options):
        creados = actualizados = 0
        for nombre, categoria_nombre, material, precio, imagen, descripcion in PRODUCTOS:
            categoria, _ = Categoria.objects.get_or_create(nombre=categoria_nombre)
            producto, created = Producto.objects.get_or_create(
                nombre=nombre,
                defaults={
                    "descripcion": descripcion,
                    "precio_base": Decimal(str(precio)),
                    "categoria": categoria,
                    "material": material,
                    "imagen_url": f"/products/{imagen}",
                    "activo": True,
                    "personalizable": True,
                },
            )
            if not created:
                producto.descripcion = descripcion
                producto.precio_base = Decimal(str(precio))
                producto.categoria = categoria
                producto.material = material
                producto.imagen_url = f"/products/{imagen}"
                producto.activo = True
                producto.save()
                actualizados += 1
            else:
                creados += 1

        self.stdout.write(self.style.SUCCESS(
            f"Catálogo sembrado: {creados} creados, {actualizados} actualizados "
            f"({Producto.objects.count()} productos en total)."
        ))
