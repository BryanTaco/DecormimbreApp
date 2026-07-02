import uuid
from django.db import models
from django.utils import timezone


class Proveedor(models.Model):
    TIPO_CHOICES = [
        ("MATERIA_PRIMA", "Materia Prima"),
        ("SERVICIO", "Servicio"),
        ("AMBOS", "Ambos"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=200)
    ruc = models.CharField(max_length=13, unique=True)
    contacto_nombre = models.CharField(max_length=150, blank=True, default="")
    contacto_telefono = models.CharField(max_length=20, blank=True, default="")
    contacto_email = models.EmailField(blank=True, default="")
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default="MATERIA_PRIMA")
    direccion = models.TextField(blank=True, default="")
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "proveedores"
        ordering = ["nombre"]
        indexes = [
            models.Index(fields=["ruc"]),
            models.Index(fields=["activo"]),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.ruc})"


class OrdenTrabajo(models.Model):
    ESTADO_CHOICES = [
        ("BORRADOR", "Borrador"),
        ("ENVIADA", "Enviada"),
        ("CONFIRMADA", "Confirmada"),
        ("EN_PROCESO", "En Proceso"),
        ("RECIBIDA", "Recibida"),
        ("CANCELADA", "Cancelada"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    numero = models.CharField(max_length=20, unique=True)
    proveedor = models.ForeignKey(
        Proveedor, on_delete=models.PROTECT, related_name="ordenes_trabajo"
    )
    pedido = models.ForeignKey(
        "pedidos.Pedido",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="ordenes_trabajo",
    )
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default="BORRADOR")
    descripcion = models.TextField(blank=True, default="")
    fecha_inicio_estimada = models.DateField(null=True, blank=True)
    fecha_fin_estimada = models.DateField(null=True, blank=True)
    fecha_recepcion = models.DateField(null=True, blank=True)
    monto_acordado = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    notas = models.TextField(blank=True, default="")
    creado_por = models.ForeignKey(
        "authentication.Usuario",
        on_delete=models.SET_NULL,
        null=True, related_name="ordenes_trabajo_creadas",
    )
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ordenes_trabajo"
        ordering = ["-fecha_creacion"]
        indexes = [
            models.Index(fields=["estado"]),
            models.Index(fields=["proveedor"]),
        ]

    def __str__(self):
        return f"OT-{self.numero} – {self.proveedor.nombre}"

    def save(self, *args, **kwargs):
        if not self.numero:
            ultimo = OrdenTrabajo.objects.order_by("-fecha_creacion").first()
            siguiente = (int(ultimo.numero.split("-")[-1]) + 1) if ultimo else 1
            self.numero = f"OT-{siguiente:06d}"
        super().save(*args, **kwargs)
