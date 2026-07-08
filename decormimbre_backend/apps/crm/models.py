import uuid
from django.db import models
from django.utils import timezone


class Oportunidad(models.Model):
    """Oportunidad de venta (deal) para el embudo/pipeline del CRM."""
    ETAPA_CHOICES = [
        ("NUEVO", "Nuevo"),
        ("CONTACTADO", "Contactado"),
        ("COTIZANDO", "Cotizando"),
        ("NEGOCIACION", "Negociación"),
        ("GANADO", "Ganado"),
        ("PERDIDO", "Perdido"),
    ]
    FUENTE_CHOICES = [
        ("WEB", "Sitio web"),
        ("WHATSAPP", "WhatsApp"),
        ("REFERIDO", "Referido"),
        ("REDES", "Redes sociales"),
        ("LOCAL", "Visita al local"),
        ("OTRO", "Otro"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    titulo = models.CharField(max_length=200)
    cliente = models.ForeignKey(
        "clientes.Cliente", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="oportunidades",
    )
    # Datos de contacto cuando aún no hay ficha de cliente (lead frío)
    contacto_nombre = models.CharField(max_length=200, blank=True, default="")
    contacto_telefono = models.CharField(max_length=20, blank=True, default="")
    contacto_email = models.EmailField(blank=True, default="")

    etapa = models.CharField(max_length=20, choices=ETAPA_CHOICES, default="NUEVO", db_index=True)
    valor_estimado = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    probabilidad = models.PositiveSmallIntegerField(default=30)  # 0-100 %
    fuente = models.CharField(max_length=20, choices=FUENTE_CHOICES, default="WEB")
    responsable = models.ForeignKey(
        "authentication.Usuario", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="oportunidades",
    )
    descripcion = models.TextField(blank=True, default="")
    fecha_cierre_estimada = models.DateField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    cerrada_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "crm_oportunidades"
        ordering = ["-fecha_creacion"]
        indexes = [models.Index(fields=["etapa"]), models.Index(fields=["cliente"])]

    def __str__(self):
        return f"{self.titulo} [{self.get_etapa_display()}]"

    def save(self, *args, **kwargs):
        # Marca la fecha de cierre cuando pasa a un estado final
        if self.etapa in ("GANADO", "PERDIDO") and self.cerrada_en is None:
            self.cerrada_en = timezone.now()
        if self.etapa not in ("GANADO", "PERDIDO"):
            self.cerrada_en = None
        super().save(*args, **kwargs)


class Interaccion(models.Model):
    """Registro de comunicación/nota con un cliente u oportunidad (bitácora)."""
    TIPO_CHOICES = [
        ("LLAMADA", "Llamada"),
        ("WHATSAPP", "WhatsApp"),
        ("EMAIL", "Correo"),
        ("REUNION", "Reunión"),
        ("NOTA", "Nota"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cliente = models.ForeignKey(
        "clientes.Cliente", on_delete=models.CASCADE, null=True, blank=True,
        related_name="interacciones",
    )
    oportunidad = models.ForeignKey(
        Oportunidad, on_delete=models.CASCADE, null=True, blank=True,
        related_name="interacciones",
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default="NOTA")
    descripcion = models.TextField()
    usuario = models.ForeignKey(
        "authentication.Usuario", on_delete=models.SET_NULL, null=True,
        related_name="interacciones",
    )
    fecha = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "crm_interacciones"
        ordering = ["-fecha"]

    def __str__(self):
        return f"{self.get_tipo_display()} — {self.fecha:%Y-%m-%d}"


class Tarea(models.Model):
    """Tarea / recordatorio de seguimiento (follow-up)."""
    PRIORIDAD_CHOICES = [("ALTA", "Alta"), ("MEDIA", "Media"), ("BAJA", "Baja")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, default="")
    cliente = models.ForeignKey(
        "clientes.Cliente", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="tareas_crm",
    )
    oportunidad = models.ForeignKey(
        Oportunidad, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="tareas",
    )
    responsable = models.ForeignKey(
        "authentication.Usuario", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="tareas_crm",
    )
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default="MEDIA")
    fecha_vencimiento = models.DateField(null=True, blank=True, db_index=True)
    completada = models.BooleanField(default=False)
    completada_en = models.DateTimeField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "crm_tareas"
        ordering = ["completada", "fecha_vencimiento", "-fecha_creacion"]

    def __str__(self):
        return self.titulo

    def save(self, *args, **kwargs):
        if self.completada and self.completada_en is None:
            self.completada_en = timezone.now()
        if not self.completada:
            self.completada_en = None
        super().save(*args, **kwargs)
