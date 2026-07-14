import uuid
from decimal import Decimal
from django.db import models, transaction
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError


FORMA_PAGO_CHOICES = [
    ("50_50", "50% anticipo – 50% contra entrega"),
    ("100_ANTICIPO", "100% anticipado"),
    ("100_ENTREGA", "100% contra entrega"),
    ("PERSONALIZADO", "Personalizado"),
]

ETAPA_PRODUCCION_CHOICES = [
    ("ESTRUCTURA", "Fabricando estructura de polialuminio"),
    ("TEJIDO", "Tejiendo con mimbre"),
    ("COJINES", "Elaborando cojines"),
    ("ACABADOS", "Acabados y pintura"),
    ("CONTROL_CALIDAD", "Control de calidad"),
]

# Orden secuencial estándar de etapas (sin cojines — se añade si el producto lo requiere)
ETAPAS_ORDEN_DEFAULT = ["ESTRUCTURA", "TEJIDO", "ACABADOS", "CONTROL_CALIDAD"]


class Pedido(models.Model):
    ESTADO_CHOICES = [
        ("PENDIENTE", "Pendiente"),
        ("EN_PRODUCCION", "En Producción"),
        ("LISTO_ENTREGA", "Listo para Entrega"),
        ("ENTREGADO", "Entregado"),
        ("CANCELADO", "Cancelado"),
    ]

    TRANSICIONES = {
        "PENDIENTE": ["EN_PRODUCCION", "CANCELADO"],
        "EN_PRODUCCION": ["LISTO_ENTREGA", "CANCELADO"],
        "LISTO_ENTREGA": ["ENTREGADO"],
        "ENTREGADO": [],
        "CANCELADO": [],
    }

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    numero = models.CharField(max_length=20, unique=True)
    # Token opaco para el enlace público de seguimiento /seguimiento/<token>
    tracking_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    cotizacion = models.OneToOneField(
        "cotizaciones.Cotizacion",
        on_delete=models.PROTECT,
        related_name="pedido",
        null=True, blank=True,
    )
    cliente = models.ForeignKey(
        "clientes.Cliente",
        on_delete=models.PROTECT,
        related_name="pedidos",
    )
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default="PENDIENTE")
    etapa_produccion = models.CharField(
        max_length=20, choices=ETAPA_PRODUCCION_CHOICES, null=True, blank=True
    )
    artesano_estructura = models.ForeignKey(
        "authentication.Usuario",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="pedidos_estructura",
        limit_choices_to={"rol": "ARTESANO"},
    )
    artesano_tejido = models.ForeignKey(
        "authentication.Usuario",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="pedidos_tejido",
        limit_choices_to={"rol": "ARTESANO"},
    )
    forma_pago = models.CharField(max_length=20, choices=FORMA_PAGO_CHOICES, default="50_50")
    fecha_promesa_entrega = models.DateField(null=True, blank=True)
    fecha_entrega_real = models.DateField(null=True, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    iva = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    anticipo = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    saldo_pendiente = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    observaciones = models.TextField(blank=True, default="")
    creado_por = models.ForeignKey(
        "authentication.Usuario",
        on_delete=models.SET_NULL,
        null=True, related_name="pedidos_creados",
    )
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pedidos"
        ordering = ["-fecha_creacion"]
        indexes = [
            models.Index(fields=["estado"]),
            models.Index(fields=["cliente"]),
            models.Index(fields=["fecha_promesa_entrega"]),
        ]

    def __str__(self):
        return f"Pedido {self.numero} – {self.cliente}"

    def save(self, *args, **kwargs):
        if not self.numero:
            with transaction.atomic():
                ultimo = Pedido.objects.select_for_update().order_by("-numero").first()
                if ultimo:
                    try:
                        siguiente = int(ultimo.numero.split("-")[-1]) + 1
                    except (ValueError, IndexError):
                        siguiente = Pedido.objects.count() + 1
                else:
                    siguiente = 1
                self.numero = f"PED-{siguiente:06d}"
                super().save(*args, **kwargs)
                return
        super().save(*args, **kwargs)

    def calcular_totales(self):
        items = self.items.all()
        subtotal = sum((i.subtotal for i in items), Decimal("0.00"))
        iva = (subtotal * settings.IVA_PORCENTAJE).quantize(Decimal("0.01"))
        total = subtotal + iva
        self.subtotal = subtotal
        self.iva = iva
        self.total = total
        self.saldo_pendiente = total - self.anticipo
        self.save(update_fields=["subtotal", "iva", "total", "saldo_pendiente"])

    def cambiar_estado(self, nuevo_estado, usuario):
        if nuevo_estado not in self.TRANSICIONES.get(self.estado, []):
            raise ValidationError(
                f"Transición '{self.estado}' → '{nuevo_estado}' no permitida."
            )
        estado_anterior = self.estado
        self.estado = nuevo_estado
        if nuevo_estado == "ENTREGADO":
            self.fecha_entrega_real = timezone.now().date()
        if nuevo_estado == "EN_PRODUCCION":
            self.etapa_produccion = "ESTRUCTURA"
        elif nuevo_estado in ("LISTO_ENTREGA", "ENTREGADO", "CANCELADO"):
            if nuevo_estado != "LISTO_ENTREGA":
                self.etapa_produccion = None
        self.save(update_fields=["estado", "fecha_entrega_real", "etapa_produccion"])
        LogEstadoPedido.objects.create(
            pedido=self,
            estado_anterior=estado_anterior,
            estado_nuevo=nuevo_estado,
            cambiado_por=usuario,
        )
        if nuevo_estado == "EN_PRODUCCION":
            self._crear_tareas_produccion(usuario)
        return self

    def _crear_tareas_produccion(self, usuario):
        """Crea las TareaProduccion en secuencia al pasar a EN_PRODUCCION."""
        asignaciones = {
            "ESTRUCTURA": self.artesano_estructura,
            "TEJIDO": self.artesano_tejido,
        }
        for orden, tipo in enumerate(ETAPAS_ORDEN_DEFAULT, start=1):
            TareaProduccion.objects.get_or_create(
                pedido=self,
                tipo=tipo,
                defaults={
                    "orden": orden,
                    "artesano": asignaciones.get(tipo),
                    "estado": "EN_PROCESO" if tipo == "ESTRUCTURA" else "PENDIENTE",
                    "iniciada_en": timezone.now() if tipo == "ESTRUCTURA" else None,
                },
            )

    def porcentaje_completado(self):
        tareas = self.tareas.all()
        if not tareas:
            return 0
        completadas = tareas.filter(estado="COMPLETADA").count()
        return int((completadas / tareas.count()) * 100)

    @property
    def costo_real(self):
        """Costo real de materiales del pedido. Usa el consumo registrado
        (SALIDA_PRODUCCION); si aún no hay consumos, lo estima con la lista de
        materiales (BOM)."""
        consumos = list(self.consumos_inventario.filter(tipo="SALIDA_PRODUCCION").select_related("materia_prima"))
        if consumos:
            total = sum((c.cantidad * c.materia_prima.costo_unitario for c in consumos), Decimal("0.00"))
            return total.quantize(Decimal("0.01"))
        from apps.inventario.models import ProductoMateria
        total = Decimal("0.00")
        for item in self.items.select_related("producto").all():
            for pm in ProductoMateria.objects.filter(producto=item.producto).select_related("materia_prima"):
                total += pm.cantidad_por_unidad * item.cantidad * pm.materia_prima.costo_unitario
        return total.quantize(Decimal("0.01"))

    @property
    def margen(self):
        """Margen = total cotizado − costo real de materiales."""
        return (self.total - self.costo_real).quantize(Decimal("0.01"))

    @property
    def margen_porcentaje(self):
        if not self.total:
            return Decimal("0.0")
        return ((self.margen / self.total) * 100).quantize(Decimal("0.1"))

    def _descontar_inventario(self):
        """Descuenta stock de materias primas con transacción atómica y validación de stock."""
        from apps.inventario.models import MateriaPrima, MovimientoInventario, ProductoMateria
        with transaction.atomic():
            for item in self.items.select_related("producto").all():
                relaciones = ProductoMateria.objects.filter(
                    producto=item.producto
                ).select_related("materia_prima")
                for pm in relaciones:
                    cantidad_total = pm.cantidad_por_unidad * item.cantidad
                    materia = MateriaPrima.objects.select_for_update().get(pk=pm.materia_prima.pk)
                    if materia.stock_actual < cantidad_total:
                        raise ValidationError(
                            f"Stock insuficiente de '{materia.nombre}': "
                            f"se necesitan {cantidad_total} {materia.get_unidad_display()} "
                            f"pero hay {materia.stock_actual} disponibles."
                        )
                    stock_antes = materia.stock_actual
                    materia.stock_actual -= cantidad_total
                    materia.save(update_fields=["stock_actual"])
                    MovimientoInventario.objects.create(
                        materia_prima=materia,
                        tipo="SALIDA_PRODUCCION",
                        cantidad=cantidad_total,
                        stock_antes=stock_antes,
                        stock_despues=materia.stock_actual,
                        justificacion=f"Pedido {self.numero}",
                        pedido=self,
                    )


class TareaProduccion(models.Model):
    TIPO_CHOICES = ETAPA_PRODUCCION_CHOICES
    ESTADO_CHOICES = [
        ("PENDIENTE", "Pendiente"),
        ("EN_PROCESO", "En proceso"),
        ("COMPLETADA", "Completada"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name="tareas")
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default="PENDIENTE")
    artesano = models.ForeignKey(
        "authentication.Usuario",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="tareas_asignadas",
        limit_choices_to={"rol": "ARTESANO"},
    )
    orden = models.PositiveSmallIntegerField(default=0)
    notas = models.TextField(blank=True)
    iniciada_en = models.DateTimeField(null=True, blank=True)
    completada_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "tareas_produccion"
        ordering = ["orden"]
        unique_together = ("pedido", "tipo")

    def __str__(self):
        return f"{self.get_tipo_display()} – {self.pedido.numero} ({self.get_estado_display()})"

    def iniciar(self, usuario=None):
        self.estado = "EN_PROCESO"
        self.iniciada_en = timezone.now()
        self.save(update_fields=["estado", "iniciada_en"])
        self.pedido.etapa_produccion = self.tipo
        self.pedido.save(update_fields=["etapa_produccion"])

    def completar(self, usuario, notas=""):
        with transaction.atomic():
            self.estado = "COMPLETADA"
            self.completada_en = timezone.now()
            if notas:
                self.notas = notas
            self.save(update_fields=["estado", "completada_en", "notas"])

            siguiente = (
                TareaProduccion.objects
                .filter(pedido=self.pedido, orden__gt=self.orden, estado="PENDIENTE")
                .order_by("orden")
                .first()
            )
            if siguiente:
                siguiente.iniciar(usuario)
            else:
                pedido = self.pedido
                pedido.refresh_from_db()
                if pedido.estado == "EN_PRODUCCION":
                    pedido.cambiar_estado("LISTO_ENTREGA", usuario)


class ItemPedido(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name="items")
    producto = models.ForeignKey("catalogo.Producto", on_delete=models.PROTECT)
    cantidad = models.PositiveIntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    ancho_cm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    alto_cm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    largo_cm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    color = models.ForeignKey(
        "catalogo.Color", on_delete=models.SET_NULL, null=True, blank=True
    )
    observaciones = models.TextField(blank=True, default="")

    class Meta:
        db_table = "pedido_items"

    def save(self, *args, **kwargs):
        self.subtotal = self.precio_unitario * self.cantidad
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.cantidad}x {self.producto} – {self.pedido.numero}"


class LogEstadoPedido(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name="logs_estado")
    estado_anterior = models.CharField(max_length=20)
    estado_nuevo = models.CharField(max_length=20)
    cambiado_por = models.ForeignKey(
        "authentication.Usuario", on_delete=models.SET_NULL, null=True
    )
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "pedido_logs_estado"
        ordering = ["-timestamp"]


class AlertaEntrega(models.Model):
    TIPO_CHOICES = [
        ("PROXIMO_VENCER", "Próximo a vencer"),
        ("VENCIDO", "Vencido"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name="alertas_entrega")
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    mensaje = models.TextField()
    revisada = models.BooleanField(default=False)
    fecha_alerta = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "pedido_alertas_entrega"
        ordering = ["-fecha_alerta"]

    def __str__(self):
        return f"Alerta {self.tipo} – Pedido {self.pedido.numero}"
