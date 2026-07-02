import uuid
from django.db import models
from .validators import validar_cedula_o_ruc


class Cliente(models.Model):
    TIPO_CHOICES = [
        ("NATURAL", "Persona Natural"),
        ("EMPRESA", "Empresa / Persona Jurídica"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cedula_ruc = models.CharField(max_length=13, unique=True, db_index=True)
    nombre_completo = models.CharField(max_length=200, db_index=True)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default="NATURAL")
    telefono = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    notas = models.TextField(blank=True)
    activo = models.BooleanField(default=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    creado_por = models.ForeignKey(
        "authentication.Usuario",
        on_delete=models.SET_NULL,
        null=True,
        related_name="clientes_creados",
    )

    class Meta:
        db_table = "clientes"
        ordering = ["-fecha_registro"]
        indexes = [
            models.Index(fields=["cedula_ruc"]),
            models.Index(fields=["nombre_completo"]),
            models.Index(fields=["activo"]),
        ]

    def __str__(self):
        return f"{self.nombre_completo} ({self.cedula_ruc})"

    def clean(self):
        validar_cedula_o_ruc(self.cedula_ruc, self.tipo)
