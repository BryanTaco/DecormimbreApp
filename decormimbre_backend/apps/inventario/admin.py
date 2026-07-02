from django.contrib import admin
from .models import MateriaPrima, Lote, MovimientoInventario, AlertaStock, ProductoMateria


@admin.register(MateriaPrima)
class MateriaPrimaAdmin(admin.ModelAdmin):
    list_display = ["nombre", "unidad", "stock_actual", "stock_minimo", "costo_unitario", "activo"]
    list_filter = ["unidad", "activo"]
    search_fields = ["nombre"]


@admin.register(Lote)
class LoteAdmin(admin.ModelAdmin):
    list_display = ["numero_lote", "materia_prima", "cantidad_disponible", "fecha_recepcion"]
    search_fields = ["numero_lote"]


@admin.register(MovimientoInventario)
class MovimientoInventarioAdmin(admin.ModelAdmin):
    list_display = ["materia_prima", "tipo", "cantidad", "stock_antes", "stock_despues", "fecha"]
    list_filter = ["tipo"]
    readonly_fields = ["id", "fecha"]


@admin.register(AlertaStock)
class AlertaStockAdmin(admin.ModelAdmin):
    list_display = ["materia_prima", "stock_al_momento", "revisada", "fecha_alerta"]
    list_filter = ["revisada"]
