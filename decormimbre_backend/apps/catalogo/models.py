import uuid
from django.db import models


class Categoria(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    imagen_url = models.URLField(blank=True, null=True)
    orden = models.PositiveIntegerField(default=0)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "categorias"
        ordering = ["orden", "nombre"]

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    MATERIAL_CHOICES = [
        ("MIMBRE", "Mimbre (natural)"),
        ("POLIALUMINIO", "Polialuminio (Tetrapack reciclado)"),
        ("COMBINADO", "Combinado (mimbre y polialuminio)"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=200, db_index=True)
    descripcion = models.TextField()
    precio_base = models.DecimalField(max_digits=10, decimal_places=2)
    stock_actual = models.PositiveIntegerField(default=0)
    stock_minimo = models.PositiveIntegerField(default=2)
    imagen_url = models.URLField(blank=True, null=True)
    imagenes_adicionales = models.JSONField(default=list)
    categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT, related_name="productos")
    material = models.CharField(max_length=20, choices=MATERIAL_CHOICES, default="COMBINADO")
    tiempo_produccion_dias = models.PositiveSmallIntegerField(
        default=7,
        help_text="Días estimados para fabricar una unidad de este producto.",
    )
    personalizable = models.BooleanField(default=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "productos"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Color(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=100)
    hex = models.CharField(max_length=7)
    r = models.PositiveSmallIntegerField()
    g = models.PositiveSmallIntegerField()
    b = models.PositiveSmallIntegerField()
    disponible = models.BooleanField(default=True)

    class Meta:
        db_table = "colores"
        ordering = ["nombre"]

    def save(self, *args, **kwargs):
        self.hex = f"#{self.r:02X}{self.g:02X}{self.b:02X}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nombre} ({self.hex})"
