import uuid
from decimal import Decimal
from django.db import models


class MateriaPrima(models.Model):
    UNIDAD_CHOICES = [
        ("METRO", "Metro lineal"),
        ("METRO2", "Metro cuadrado"),
        ("KG", "Kilogramo"),
        ("UNIDAD", "Unidad"),
        ("ROLLO", "Rollo"),
        ("ATADO", "Atado"),
        ("PLANCHA", "Plancha"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=200, db_index=True)
    descripcion = models.TextField(blank=True)
    unidad = models.CharField(max_length=10, choices=UNIDAD_CHOICES)
    stock_actual = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    stock_minimo = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    costo_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    proveedor = models.ForeignKey(
        "proveedores.Proveedor",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="materias_primas",
    )
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "materias_primas"
        ordering = ["nombre"]

    def __str__(self):
        return f"{self.nombre} ({self.unidad})"

    @property
    def en_stock_critico(self):
        return self.stock_actual <= self.stock_minimo


class ProductoMateria(models.Model):
    """Cuánta materia prima requiere cada producto para fabricarse."""
    producto = models.ForeignKey(
        "catalogo.Producto", on_delete=models.CASCADE, related_name="materiales"
    )
    materia_prima = models.ForeignKey(
        MateriaPrima, on_delete=models.PROTECT, related_name="usos_en_productos"
    )
    cantidad_por_unidad = models.DecimalField(max_digits=10, decimal_places=3)

    class Meta:
        db_table = "producto_materia"
        unique_together = ("producto", "materia_prima")


class Lote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    materia_prima = models.ForeignKey(MateriaPrima, on_delete=models.PROTECT, related_name="lotes")
    numero_lote = models.CharField(max_length=50, unique=True)
    proveedor = models.ForeignKey(
        "proveedores.Proveedor",
        on_delete=models.SET_NULL,
        null=True,
        related_name="lotes_suministrados",
    )
    cantidad_inicial = models.DecimalField(max_digits=10, decimal_places=3)
    cantidad_disponible = models.DecimalField(max_digits=10, decimal_places=3)
    costo_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_recepcion = models.DateField()
    fecha_vencimiento = models.DateField(null=True, blank=True)
    observaciones = models.TextField(blank=True)

    class Meta:
        db_table = "lotes"
        ordering = ["-fecha_recepcion"]

    def __str__(self):
        return f"Lote {self.numero_lote}"


class AlertaStock(models.Model):
    materia_prima = models.ForeignKey(MateriaPrima, on_delete=models.CASCADE, related_name="alertas")
    stock_al_momento = models.DecimalField(max_digits=10, decimal_places=3)
    revisada = models.BooleanField(default=False)
    fecha_alerta = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "alertas_stock"
        ordering = ["-fecha_alerta"]


class MovimientoInventario(models.Model):
    TIPO_CHOICES = [
        ("ENTRADA", "Entrada por compra"),
        ("SALIDA_PRODUCCION", "Salida por inicio de producción"),
        ("AJUSTE_POSITIVO", "Ajuste positivo"),
        ("AJUSTE_NEGATIVO", "Ajuste negativo"),
        ("DEVOLUCION", "Devolución a proveedor"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    materia_prima = models.ForeignKey(MateriaPrima, on_delete=models.PROTECT, related_name="movimientos")
    lote = models.ForeignKey(Lote, on_delete=models.SET_NULL, null=True, blank=True)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    cantidad = models.DecimalField(max_digits=10, decimal_places=3)
    stock_antes = models.DecimalField(max_digits=10, decimal_places=3)
    stock_despues = models.DecimalField(max_digits=10, decimal_places=3)
    pedido = models.ForeignKey(
        "pedidos.Pedido",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="consumos_inventario",
    )
    justificacion = models.TextField(blank=True)
    usuario = models.ForeignKey("authentication.Usuario", on_delete=models.SET_NULL, null=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "movimientos_inventario"
        ordering = ["-fecha"]
