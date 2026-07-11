"""
Crea usuarios de demostración para probar el login (idempotente).

Uso:
    python manage.py crear_usuario_demo
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.authentication.models import Usuario


DEMOS = [
    # email, nombre, password, rol, is_staff, is_superuser
    ("admin@decormimbre.ec", "Administrador Demo", "Decormimbre2026", "ADMIN", True, True),
    ("cliente@decormimbre.ec", "Cliente Demo", "Cliente2026", "CLIENTE", False, False),
    ("artesano@decormimbre.ec", "Artesano Demo", "Artesano2026", "ARTESANO", False, False),
]


class Command(BaseCommand):
    help = "Crea/actualiza usuarios demo (admin y cliente) para probar el login."

    @transaction.atomic
    def handle(self, *args, **options):
        for email, nombre, password, rol, is_staff, is_superuser in DEMOS:
            usuario, created = Usuario.objects.get_or_create(
                email=email,
                defaults={"nombre": nombre, "rol": rol, "is_staff": is_staff, "is_superuser": is_superuser},
            )
            usuario.nombre = nombre
            usuario.rol = rol
            usuario.is_staff = is_staff
            usuario.is_superuser = is_superuser
            usuario.activo = True
            usuario.set_password(password)
            usuario.save()

            # Para el cliente demo, asegurar un perfil de Cliente vinculado
            if rol == "CLIENTE":
                try:
                    from apps.clientes.models import Cliente
                    Cliente.objects.get_or_create(
                        usuario_cuenta=usuario,
                        defaults={
                            "nombre_completo": nombre,
                            "email": email,
                            "telefono": "0980572561",
                            "cedula_ruc": "9999999999",
                        },
                    )
                except Exception as exc:  # noqa: BLE001
                    self.stdout.write(self.style.WARNING(f"  (No se pudo crear perfil de cliente: {exc})"))

            estado = "Creado" if created else "Actualizado"
            self.stdout.write(self.style.SUCCESS(f"{estado}: {email} / {password}  ({rol})"))

        # Pedido de ejemplo con tareas asignadas al artesano (para la vista del taller)
        try:
            from datetime import date, timedelta
            from decimal import Decimal
            from apps.clientes.models import Cliente
            from apps.catalogo.models import Producto, Categoria, Color
            from apps.pedidos.models import Pedido, ItemPedido, TareaProduccion

            artesano = Usuario.objects.filter(rol="ARTESANO").first()
            cliente = Cliente.objects.first()
            if artesano and cliente:
                categoria, _ = Categoria.objects.get_or_create(nombre="Exterior")
                producto, _ = Producto.objects.get_or_create(
                    nombre="Columpio colgante",
                    defaults=dict(descripcion="Columpio tejido para exterior.", precio_base=Decimal("480.00"), categoria=categoria, imagen_url="/products/colgante-nube.jpg"),
                )
                if not producto.imagen_url:
                    producto.imagen_url = "/products/colgante-nube.jpg"
                    producto.save(update_fields=["imagen_url"])
                color, _ = Color.objects.get_or_create(nombre="Azul cielo", defaults={"r": 125, "g": 180, "b": 216})

                # Materia prima con bajo stock + lista de materiales (para la verificación de inventario del tejedor)
                from apps.inventario.models import MateriaPrima, ProductoMateria
                materia, _ = MateriaPrima.objects.get_or_create(
                    nombre="Fibra de polialuminio",
                    defaults=dict(unidad="UNIDAD", stock_actual=Decimal("5"), stock_minimo=Decimal("8"), costo_unitario=Decimal("3.50")),
                )
                ProductoMateria.objects.get_or_create(producto=producto, materia_prima=materia, defaults={"cantidad_por_unidad": Decimal("12")})
                pedido, _ = Pedido.objects.get_or_create(
                    numero="PED-DEMO-001",
                    defaults=dict(
                        cliente=cliente, estado="EN_PRODUCCION",
                        artesano_estructura=artesano, artesano_tejido=artesano,
                        fecha_promesa_entrega=date.today() + timedelta(days=12),
                        total=Decimal("552.00"),
                    ),
                )
                ItemPedido.objects.get_or_create(
                    pedido=pedido, producto=producto,
                    defaults=dict(
                        cantidad=1, precio_unitario=Decimal("480.00"),
                        ancho_cm=Decimal("100"), alto_cm=Decimal("115"), largo_cm=Decimal("100"),
                        color=color, observaciones="Tejido cerrado tipo canasta, color azul cielo.",
                    ),
                )
                TareaProduccion.objects.get_or_create(pedido=pedido, tipo="ESTRUCTURA", defaults=dict(estado="EN_PROCESO", artesano=artesano, orden=1))
                TareaProduccion.objects.get_or_create(pedido=pedido, tipo="TEJIDO", defaults=dict(estado="PENDIENTE", artesano=artesano, orden=2))
                self.stdout.write(self.style.SUCCESS("Creado: pedido demo PED-DEMO-001 con tareas para el artesano"))
        except Exception as exc:  # noqa: BLE001
            self.stdout.write(self.style.WARNING(f"  (No se pudo sembrar el pedido demo: {exc})"))

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Listo. Admin → /admin/login · Cliente → /login · Artesano → /taller"))
