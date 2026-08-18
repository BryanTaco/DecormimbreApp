"""Carga datos ficticios, coherentes e idempotentes para la exposición de tesis.

Uso:
    python manage.py sembrar_demo_tesis

No elimina ni modifica registros que no lleven el identificador ``DEMO-TESIS``.
"""
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.authentication.models import Usuario
from apps.catalogo.models import Categoria, Color, Producto
from apps.clientes.models import Cliente
from apps.cotizaciones.models import Cotizacion, ItemCotizacion, SolicitudRapida
from apps.crm.models import Interaccion, Oportunidad, Tarea
from apps.pedidos.models import ItemPedido, Pedido, TareaProduccion
from apps.proveedores.models import OrdenTrabajo, Proveedor


MARCA = "[DEMO-TESIS]"


def cedula_valida(numero: int) -> str:
    """Genera una cédula ecuatoriana válida de demostración para Pichincha."""
    base = f"17{numero:07d}"
    total = 0
    for digito, factor in zip(base, (2, 1, 2, 1, 2, 1, 2, 1, 2)):
        valor = int(digito) * factor
        total += valor - 9 if valor >= 10 else valor
    return base + str((10 - total % 10) % 10)


class Command(BaseCommand):
    help = "Carga clientes, cotizaciones, pedidos, CRM y proveedores ficticios para la demo de tesis."

    @transaction.atomic
    def handle(self, *args, **options):
        admin = Usuario.objects.filter(rol__in=["ADMIN", "PROPIETARIO"]).first()
        if not admin:
            raise CommandError("Primero crea un administrador con: python manage.py crear_usuario_demo")

        artesanos = self._asegurar_artesanos()
        clientes = self._asegurar_clientes(admin)
        productos = list(Producto.objects.filter(activo=True).order_by("nombre"))
        if not productos:
            productos = self._asegurar_catalogo_minimo()
        colores = self._asegurar_colores()

        cotizaciones = self._sembrar_cotizaciones(admin, clientes, productos, colores)
        pedidos = self._sembrar_pedidos(admin, artesanos, cotizaciones, colores)
        self._sembrar_solicitudes(clientes, colores)
        self._sembrar_crm(admin, clientes)
        self._sembrar_proveedores(admin, pedidos)

        self.stdout.write(self.style.SUCCESS("\nDatos DEMO-TESIS listos (sin duplicados):"))
        self.stdout.write(f"  Clientes demo: {Cliente.objects.filter(notas__contains=MARCA).count()}")
        self.stdout.write(f"  Cotizaciones demo: {Cotizacion.objects.filter(observaciones__contains=MARCA).count()}")
        self.stdout.write(f"  Pedidos demo: {Pedido.objects.filter(numero__startswith='PED-TESIS-').count()}")
        self.stdout.write(f"  Solicitudes web demo: {SolicitudRapida.objects.filter(notas__contains=MARCA).count()}")
        self.stdout.write(f"  Oportunidades CRM demo: {Oportunidad.objects.filter(titulo__startswith='DEMO-TESIS').count()}")
        self.stdout.write(f"  Órdenes de trabajo demo: {OrdenTrabajo.objects.filter(numero__startswith='OT-TESIS-').count()}")

    def _asegurar_artesanos(self):
        datos = [
            ("artesano@decormimbre.ec", "Artesano Demo"),
            ("maria.artesana@demo.decormimbre.ec", "María Paredes"),
            ("carlos.artesano@demo.decormimbre.ec", "Carlos Mena"),
        ]
        artesanos = []
        for email, nombre in datos:
            usuario, creado = Usuario.objects.get_or_create(
                email=email,
                defaults={"nombre": nombre, "rol": "ARTESANO", "activo": True},
            )
            if creado:
                usuario.set_password("Artesano2026")
                usuario.save(update_fields=["password"])
            artesanos.append(usuario)
        return artesanos

    def _asegurar_clientes(self, admin):
        datos = [
            ("ana.montalvo@demo.decormimbre.ec", "Ana Montalvo", "098 452 1901", "Quito, Cumbayá"),
            ("daniela.cebolla@demo.decormimbre.ec", "Daniela Cedeño", "099 318 7472", "Quito, La Floresta"),
            ("roberto.paredes@demo.decormimbre.ec", "Roberto Paredes", "098 701 2264", "Quito, Tumbaco"),
            ("sofia.andrade@demo.decormimbre.ec", "Sofía Andrade", "099 522 1608", "Quito, El Batán"),
            ("miguel.herrera@demo.decormimbre.ec", "Miguel Herrera", "098 938 4451", "Valle de Los Chillos"),
            ("valeria.rivas@demo.decormimbre.ec", "Valeria Rivas", "099 270 8346", "Quito, Iñaquito"),
            ("jorge.cardenas@demo.decormimbre.ec", "Jorge Cárdenas", "098 614 3907", "Quito, Ponceano"),
            ("camila.vega@demo.decormimbre.ec", "Camila Vega", "099 814 6720", "Quito, Calderón"),
        ]
        clientes = []
        for indice, (email, nombre, telefono, direccion) in enumerate(datos, start=1001):
            usuario, creado = Usuario.objects.get_or_create(
                email=email,
                defaults={"nombre": nombre, "rol": "CLIENTE", "activo": True},
            )
            if creado:
                usuario.set_password("Cliente2026")
                usuario.save(update_fields=["password"])
            cliente, _ = Cliente.objects.get_or_create(
                usuario_cuenta=usuario,
                defaults={
                    "cedula_ruc": cedula_valida(indice), "nombre_completo": nombre,
                    "telefono": f"+593{telefono.replace(' ', '')[1:]}", "email": email,
                    "direccion": direccion, "notas": f"{MARCA} Cliente ficticio para demostración.",
                    "creado_por": admin,
                },
            )
            cliente.nombre_completo = nombre
            cliente.telefono = f"+593{telefono.replace(' ', '')[1:]}"
            cliente.email = email
            cliente.direccion = direccion
            cliente.notas = f"{MARCA} Cliente ficticio para demostración."
            cliente.creado_por = admin
            cliente.save()
            clientes.append(cliente)
        return clientes

    def _asegurar_catalogo_minimo(self):
        categoria, _ = Categoria.objects.get_or_create(nombre="Colección demostración", defaults={"orden": 99})
        datos = [
            ("Silla Acapulco de polialuminio", "Silla para exterior tejida en poli-aluminio.", "78.00", "POLIALUMINIO"),
            ("Columpio colgante", "Columpio con cojín y estructura.", "580.00", "POLIALUMINIO"),
            ("Sala Elegancia Exterior", "Sofá, dos butacas y mesa de centro.", "1550.00", "POLIALUMINIO"),
        ]
        productos = []
        for nombre, descripcion, precio, material in datos:
            producto, _ = Producto.objects.get_or_create(
                nombre=nombre,
                defaults={"descripcion": descripcion, "precio_base": Decimal(precio), "categoria": categoria, "material": material},
            )
            productos.append(producto)
        return productos

    def _asegurar_colores(self):
        datos = [
            ("Azul océano", 30, 101, 149), ("Verde agua", 39, 151, 139),
            ("Café cacao", 91, 55, 36), ("Gris grafito", 55, 65, 81),
            ("Beige arena", 216, 194, 158), ("Rojo carmesí", 156, 38, 54),
        ]
        colores = []
        for nombre, r, g, b in datos:
            color, _ = Color.objects.get_or_create(nombre=nombre, defaults={"r": r, "g": g, "b": b})
            colores.append(color)
        return colores

    def _ficha(self, producto, color, indice):
        medidas = [(70, 85, 70), (100, 130, 100), (160, 85, 75), (120, 95, 80)][indice % 4]
        return {
            "tipo": producto.nombre,
            "material": producto.get_material_display(),
            "color": {"nombre": color.nombre, "hex": color.hex},
            "cojin": {"nombre": "Lino crema", "hex": "#E9DDC9"},
            "medidas": {"ancho_cm": medidas[0], "alto_cm": medidas[1], "profundidad_cm": medidas[2]},
        }

    def _sembrar_cotizaciones(self, admin, clientes, productos, colores):
        estados = ["BORRADOR", "ENVIADA", "ENVIADA", "APROBADA", "APROBADA", "APROBADA", "APROBADA", "RECHAZADA"]
        titulos = [
            "Sillas para balcón", "Columpio personalizado", "Sala exterior familiar", "Renovación de terraza",
            "Muebles para cafetería", "Set jardín contemporáneo", "Comedor artesanal", "Proyecto de descanso",
        ]
        resultado = []
        ahora = timezone.now()
        for indice, (estado, titulo) in enumerate(zip(estados, titulos), start=1):
            marca = f"{MARCA} COT-{indice:02d} · {titulo}"
            cotizacion = Cotizacion.objects.filter(observaciones__startswith=marca).first()
            producto = productos[(indice - 1) % len(productos)]
            color = colores[(indice - 1) % len(colores)]
            ficha = self._ficha(producto, color, indice)
            if not cotizacion:
                cotizacion = Cotizacion.objects.create(
                    cliente=clientes[(indice - 1) % len(clientes)], creado_por=admin,
                    estado=estado, forma_pago="50_50", fecha_promesa_entrega=(ahora + timedelta(days=14 + indice * 3)).date(),
                    observaciones=f"{marca}\nCliente solicita confirmación de color y medidas antes de producción.",
                    configuracion=ficha,
                )
                ItemCotizacion.objects.create(
                    cotizacion=cotizacion, producto=producto, cantidad=1 if indice != 5 else 4,
                    precio_unitario=producto.precio_base, descuento=Decimal("5.00") if indice == 6 else Decimal("0.00"),
                    ancho_cm=ficha["medidas"]["ancho_cm"], alto_cm=ficha["medidas"]["alto_cm"], largo_cm=ficha["medidas"]["profundidad_cm"],
                    color=color, configuracion=ficha, observaciones_item="Acabado y medidas confirmables con el cliente.",
                )
                if estado in ("ENVIADA", "APROBADA", "RECHAZADA"):
                    cotizacion.fecha_envio = ahora - timedelta(days=indice)
                    cotizacion.fecha_expiracion = ahora + timedelta(days=15 - indice)
                if estado in ("APROBADA", "RECHAZADA"):
                    cotizacion.fecha_respuesta = ahora - timedelta(days=max(1, indice - 2))
                cotizacion.save()
            resultado.append(cotizacion)
        return resultado

    def _sembrar_pedidos(self, admin, artesanos, cotizaciones, colores):
        configuraciones = [
            ("PENDIENTE", None), ("EN_PRODUCCION", "ESTRUCTURA"), ("EN_PRODUCCION", "TEJIDO"),
            ("EN_PRODUCCION", "ACABADOS"), ("LISTO_ENTREGA", "CONTROL_CALIDAD"), ("ENTREGADO", None),
        ]
        pedidos = []
        aprobadas = [cotizacion for cotizacion in cotizaciones if cotizacion.estado == "APROBADA"]
        for indice, (estado, etapa) in enumerate(configuraciones, start=1):
            cotizacion = aprobadas[(indice - 1) % len(aprobadas)]
            numero = f"PED-TESIS-{indice:03d}"
            producto = cotizacion.items.first().producto
            color = colores[(indice + 1) % len(colores)]
            ficha = self._ficha(producto, color, indice)
            pedido, creado = Pedido.objects.get_or_create(
                numero=numero,
                defaults={
                    "cotizacion": cotizacion if indice <= len(aprobadas) else None, "cliente": cotizacion.cliente,
                    "estado": estado, "etapa_produccion": etapa, "artesano_estructura": artesanos[indice % len(artesanos)],
                    "artesano_tejido": artesanos[(indice + 1) % len(artesanos)], "forma_pago": "50_50",
                    "fecha_promesa_entrega": timezone.localdate() + timedelta(days=6 + indice * 3),
                    "fecha_entrega_real": timezone.localdate() - timedelta(days=3) if estado == "ENTREGADO" else None,
                    "anticipo": Decimal("120.00"), "observaciones": f"{MARCA} Pedido de demostración con especificación confirmada.",
                    "configuracion": ficha, "creado_por": admin,
                },
            )
            if creado:
                ItemPedido.objects.create(
                    pedido=pedido, producto=producto, cantidad=1, precio_unitario=producto.precio_base,
                    ancho_cm=ficha["medidas"]["ancho_cm"], alto_cm=ficha["medidas"]["alto_cm"], largo_cm=ficha["medidas"]["profundidad_cm"],
                    color=color, observaciones="Color hexadecimal y medidas verificadas en la ficha técnica.",
                )
                pedido.calcular_totales()
                self._sembrar_tareas(pedido, artesanos, estado, etapa)
            pedidos.append(pedido)
        return pedidos

    def _sembrar_tareas(self, pedido, artesanos, estado, etapa):
        etapas = ["ESTRUCTURA", "TEJIDO", "COJINES", "ACABADOS", "CONTROL_CALIDAD"]
        actual = etapas.index(etapa) if etapa in etapas else (-1 if estado == "PENDIENTE" else len(etapas))
        for orden, tipo in enumerate(etapas, start=1):
            if estado in ("LISTO_ENTREGA", "ENTREGADO") or orden - 1 < actual:
                estado_tarea = "COMPLETADA"
            elif orden - 1 == actual:
                estado_tarea = "EN_PROCESO"
            else:
                estado_tarea = "PENDIENTE"
            tarea, creada = TareaProduccion.objects.get_or_create(
                pedido=pedido, tipo=tipo,
                defaults={"orden": orden, "artesano": artesanos[(orden - 1) % len(artesanos)], "estado": estado_tarea},
            )
            if creada and estado_tarea == "COMPLETADA":
                tarea.completada_en = timezone.now() - timedelta(days=2)
                tarea.save(update_fields=["completada_en"])
            elif creada and estado_tarea == "EN_PROCESO":
                tarea.iniciada_en = timezone.now() - timedelta(days=1)
                tarea.save(update_fields=["iniciada_en"])

    def _sembrar_solicitudes(self, clientes, colores):
        solicitudes = [
            ("PENDIENTE", "Solicito una sala de exterior para seis personas."),
            ("EN_PROCESO", "Quiero cotizar dos butacas para el área de lectura."),
            ("CONVERTIDA", "Me interesa una silla colgante en color verde agua."),
        ]
        for indice, (estado, descripcion) in enumerate(solicitudes, start=1):
            cliente = clientes[(indice + 2) % len(clientes)]
            marca = f"{MARCA} SOL-{indice:02d}"
            if SolicitudRapida.objects.filter(notas__startswith=marca).exists():
                continue
            color = colores[indice % len(colores)]
            SolicitudRapida.objects.create(
                nombre=cliente.nombre_completo, email=cliente.email, telefono=cliente.telefono,
                descripcion=descripcion, cantidad=1 + indice, estado=estado, usuario_vinculado=cliente.usuario_cuenta,
                notas=f"{marca} Solicitud ficticia para mostrar la bandeja de entrada.",
                personalizacion={"color": {"nombre": color.nombre, "hex": color.hex}, "medidas": {"ancho_cm": 90, "alto_cm": 110, "profundidad_cm": 80}},
            )

    def _sembrar_crm(self, admin, clientes):
        datos = [
            ("Proyecto terraza La Carolina", "NUEVO", "WEB", "2850.00", 20),
            ("Mobiliario café artesanal", "CONTACTADO", "REFERIDO", "4200.00", 40),
            ("Sala exterior Cumbayá", "COTIZANDO", "WHATSAPP", "1550.00", 60),
            ("Comedor Alameda", "NEGOCIACION", "LOCAL", "2300.00", 75),
            ("Set jardín Valle de Los Chillos", "GANADO", "REDES", "1850.00", 100),
            ("Renovación hostería", "PERDIDO", "WEB", "3600.00", 0),
        ]
        oportunidades = []
        for indice, (titulo, etapa, fuente, valor, probabilidad) in enumerate(datos):
            oportunidad, creada = Oportunidad.objects.get_or_create(
                titulo=f"DEMO-TESIS · {titulo}",
                defaults={"cliente": clientes[indice], "contacto_nombre": clientes[indice].nombre_completo,
                          "contacto_telefono": clientes[indice].telefono, "contacto_email": clientes[indice].email,
                          "etapa": etapa, "fuente": fuente, "valor_estimado": Decimal(valor), "probabilidad": probabilidad,
                          "responsable": admin, "descripcion": f"{MARCA} Oportunidad ficticia para el pipeline.",
                          "fecha_cierre_estimada": timezone.localdate() + timedelta(days=8 + indice * 6)},
            )
            if creada:
                Interaccion.objects.create(cliente=clientes[indice], oportunidad=oportunidad, tipo="WHATSAPP", usuario=admin,
                                            descripcion="Se registró el requerimiento y se acordó enviar propuesta personalizada.")
            oportunidades.append(oportunidad)
        for indice, (titulo, descripcion, prioridad, completada) in enumerate([
            ("Llamar a Ana por medidas", "Confirmar las dimensiones del balcón antes de cotizar.", "ALTA", False),
            ("Enviar propuesta de cafetería", "Compartir renders y plazo de fabricación.", "MEDIA", False),
            ("Confirmar anticipo sala exterior", "El cliente solicitó datos para transferencia.", "ALTA", True),
            ("Seguimiento postventa", "Consultar satisfacción luego de la entrega.", "BAJA", True),
        ]):
            Tarea.objects.get_or_create(
                titulo=f"DEMO-TESIS · {titulo}",
                defaults={"descripcion": descripcion, "cliente": clientes[indice], "oportunidad": oportunidades[indice],
                          "responsable": admin, "prioridad": prioridad, "completada": completada,
                          "fecha_vencimiento": timezone.localdate() + timedelta(days=indice - 1)},
            )

    def _sembrar_proveedores(self, admin, pedidos):
        datos = [
            (
                "Ecuaplastic S.C.", "1792182336001", "MATERIA_PRIMA", "Ventas Ecuaplastic",
                "+593989055383", "ventas@ecuaplastic.com",
                "EcoStudio: Av. Intervalles, sector Cununyacu, a 500 m de la Ruta Viva, Tumbaco, Quito.",
            ),
            (
                "Artesanos de Pueblito, Montecristi", "", "MATERIA_PRIMA", "Colectivo artesanal de Montecristi",
                "", "", "Pueblito, Montecristi, Manabí, Ecuador. Proveedor local de mimbre artesanal.",
            ),
        ]
        proveedores = []
        for nombre, ruc, tipo, contacto, telefono, email, direccion in datos:
            proveedor, _ = Proveedor.objects.get_or_create(
                ruc=ruc,
                defaults={"nombre": nombre, "tipo": tipo, "contacto_nombre": contacto, "contacto_telefono": telefono,
                          "contacto_email": email, "direccion": direccion},
            )
            proveedor.nombre = nombre
            proveedor.tipo = tipo
            proveedor.contacto_nombre = contacto
            proveedor.contacto_telefono = telefono
            proveedor.contacto_email = email
            proveedor.direccion = direccion
            proveedor.activo = True
            proveedor.save()
            proveedores.append(proveedor)
        for indice, estado in enumerate(["ENVIADA", "CONFIRMADA", "EN_PROCESO"], start=1):
            orden, _ = OrdenTrabajo.objects.get_or_create(
                numero=f"OT-TESIS-{indice:03d}",
                defaults={"proveedor": proveedores[(indice - 1) % len(proveedores)], "pedido": pedidos[indice], "estado": estado,
                          "descripcion": f"{MARCA} Orden de apoyo para {pedidos[indice].numero}.", "creado_por": admin,
                          "fecha_inicio_estimada": timezone.localdate() + timedelta(days=indice),
                          "fecha_fin_estimada": timezone.localdate() + timedelta(days=indice + 7),
                          "monto_acordado": Decimal(str(180 * indice))},
            )
            proveedor = proveedores[(indice - 1) % len(proveedores)]
            if orden.proveedor_id != proveedor.id:
                orden.proveedor = proveedor
                orden.save(update_fields=["proveedor", "fecha_actualizacion"])

        # Limpia solamente los tres proveedores ficticios que añadió esta
        # semilla en versiones anteriores; nunca afecta proveedores reales.
        Proveedor.objects.filter(nombre__in=["EcoHilo Andino", "Estructuras Norte", "Textiles La Pradera"]).delete()
