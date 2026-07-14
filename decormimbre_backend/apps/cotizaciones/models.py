import uuid
from decimal import Decimal
from django.conf import settings
from django.db import models, transaction
from django.utils import timezone
from django.core.exceptions import ValidationError


FORMA_PAGO_CHOICES = [
    ("50_50", "50% anticipo – 50% contra entrega"),
    ("100_ANTICIPO", "100% anticipado"),
    ("100_ENTREGA", "100% contra entrega"),
    ("PERSONALIZADO", "Personalizado"),
]


class Cotizacion(models.Model):
    ESTADO_CHOICES = [
        ("BORRADOR", "Borrador"),
        ("ENVIADA", "Enviada al cliente"),
        ("APROBADA", "Aprobada"),
        ("RECHAZADA", "Rechazada"),
        ("EXPIRADA", "Expirada"),
    ]
    TRANSICIONES = {
        "BORRADOR": ["ENVIADA"],
        "ENVIADA": ["APROBADA", "RECHAZADA", "EXPIRADA", "BORRADOR"],
        "RECHAZADA": ["BORRADOR"],
        "EXPIRADA": ["BORRADOR"],
        "APROBADA": [],
    }
    DIAS_VALIDEZ = 15

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    numero = models.CharField(max_length=20, unique=True, editable=False)
    cliente = models.ForeignKey(
        "clientes.Cliente", on_delete=models.PROTECT, related_name="cotizaciones"
    )
    creado_por = models.ForeignKey(
        "authentication.Usuario", on_delete=models.SET_NULL, null=True
    )
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default="BORRADOR", db_index=True)
    version = models.PositiveIntegerField(default=1)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    iva = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    forma_pago = models.CharField(max_length=20, choices=FORMA_PAGO_CHOICES, default="50_50")
    fecha_promesa_entrega = models.DateField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_envio = models.DateTimeField(null=True, blank=True)
    fecha_expiracion = models.DateTimeField(null=True, blank=True)
    fecha_respuesta = models.DateTimeField(null=True, blank=True)
    observaciones = models.TextField(blank=True)

    class Meta:
        db_table = "cotizaciones"
        ordering = ["-fecha_creacion"]

    def __str__(self):
        return f"{self.numero} — {self.cliente.nombre_completo}"

    def save(self, *args, **kwargs):
        if not self.numero:
            with transaction.atomic():
                self.numero = self._generar_numero()
                super().save(*args, **kwargs)
                return
        super().save(*args, **kwargs)

    def _generar_numero(self) -> str:
        """Genera número correlativo seguro ante concurrencia usando SELECT FOR UPDATE."""
        anio = timezone.now().year
        prefix = f"COT-{anio}-"
        ultimo = (
            Cotizacion.objects.select_for_update()
            .filter(numero__startswith=prefix)
            .order_by("-numero")
            .first()
        )
        siguiente = (int(ultimo.numero.split("-")[-1]) + 1) if ultimo else 1
        return f"{prefix}{siguiente:04d}"

    def calcular_totales(self):
        self.subtotal = sum(
            (item.subtotal for item in self.items.all()), Decimal("0.00")
        )
        self.iva = (self.subtotal * settings.IVA_PORCENTAJE).quantize(Decimal("0.01"))
        self.total = self.subtotal + self.iva
        self.save(update_fields=["subtotal", "iva", "total"])

    def cambiar_estado(self, nuevo_estado: str, usuario) -> None:
        estados_permitidos = self.TRANSICIONES.get(self.estado, [])
        if nuevo_estado not in estados_permitidos:
            raise ValidationError(
                f"No se puede cambiar de '{self.estado}' a '{nuevo_estado}'. "
                f"Transiciones permitidas: {estados_permitidos}"
            )
        estado_anterior = self.estado
        self.estado = nuevo_estado

        if nuevo_estado == "ENVIADA":
            self.fecha_envio = timezone.now()
            self.fecha_expiracion = timezone.now() + timezone.timedelta(days=self.DIAS_VALIDEZ)
            self._crear_snapshot(usuario, "Cotización enviada al cliente")

        elif nuevo_estado == "APROBADA":
            self.fecha_respuesta = timezone.now()
            self._crear_pedido_automatico(usuario)

        elif nuevo_estado in ("RECHAZADA", "EXPIRADA"):
            self.fecha_respuesta = timezone.now()

        elif nuevo_estado == "BORRADOR":
            self.version += 1
            self._crear_snapshot(usuario, f"Nueva versión v{self.version}")

        self.save()

    def _crear_snapshot(self, usuario, motivo: str) -> None:
        import json
        from rest_framework.renderers import JSONRenderer
        from .serializers import CotizacionSnapshotSerializer
        rendered = JSONRenderer().render(CotizacionSnapshotSerializer(self).data)
        snapshot = json.loads(rendered)
        VersionCotizacion.objects.create(
            cotizacion=self,
            numero_version=self.version,
            snapshot_json=snapshot,
            creado_por=usuario,
            motivo_cambio=motivo,
        )

    def _crear_pedido_automatico(self, usuario):
        from apps.pedidos.models import Pedido, ItemPedido
        pedido = Pedido.objects.create(
            cliente=self.cliente,
            cotizacion=self,
            creado_por=usuario,
            subtotal=self.subtotal,
            iva=self.iva,
            total=self.total,
            forma_pago=self.forma_pago,
            fecha_promesa_entrega=self.fecha_promesa_entrega,
            observaciones=f"Generado automáticamente desde cotización {self.numero}",
        )
        for item in self.items.all():
            precio_pedido = (
                (item.subtotal / item.cantidad).quantize(Decimal("0.01"))
                if item.cantidad > 0 else item.precio_unitario
            )
            ItemPedido.objects.create(
                pedido=pedido,
                producto=item.producto,
                cantidad=item.cantidad,
                precio_unitario=precio_pedido,
                ancho_cm=item.ancho_cm,
                alto_cm=item.alto_cm,
                largo_cm=item.largo_cm,
                color=item.color,
                observaciones=item.observaciones_item,
            )
        return pedido


class ItemCotizacion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cotizacion = models.ForeignKey(Cotizacion, on_delete=models.CASCADE, related_name="items")
    producto = models.ForeignKey("catalogo.Producto", on_delete=models.PROTECT)
    cantidad = models.PositiveIntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    descuento = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("0.00"), blank=True,
        help_text="Porcentaje de descuento (0–100).",
    )
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    ancho_cm = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True)
    alto_cm = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True)
    largo_cm = models.DecimalField(max_digits=6, decimal_places=1, null=True, blank=True)
    color = models.ForeignKey("catalogo.Color", on_delete=models.SET_NULL, null=True, blank=True)
    configuracion = models.JSONField(default=dict, blank=True)
    observaciones_item = models.TextField(blank=True)

    class Meta:
        db_table = "items_cotizacion"

    def save(self, *args, **kwargs):
        base = self.precio_unitario * self.cantidad
        if self.descuento:
            base = base * (1 - self.descuento / Decimal("100"))
        self.subtotal = base.quantize(Decimal("0.01"))
        super().save(*args, **kwargs)
        self.cotizacion.calcular_totales()


class VersionCotizacion(models.Model):
    cotizacion = models.ForeignKey(Cotizacion, on_delete=models.CASCADE, related_name="versiones")
    numero_version = models.PositiveIntegerField()
    snapshot_json = models.JSONField()
    creado_por = models.ForeignKey("authentication.Usuario", on_delete=models.SET_NULL, null=True)
    motivo_cambio = models.TextField(blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "versiones_cotizacion"
        ordering = ["numero_version"]
        unique_together = ("cotizacion", "numero_version")
