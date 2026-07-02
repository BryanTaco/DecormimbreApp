from django.contrib import admin
from .models import Pedido, ItemPedido, LogEstadoPedido, AlertaEntrega


class ItemPedidoInline(admin.TabularInline):
    model = ItemPedido
    extra = 0
    readonly_fields = ["subtotal"]


class LogEstadoInline(admin.TabularInline):
    model = LogEstadoPedido
    extra = 0
    readonly_fields = ["estado_anterior", "estado_nuevo", "cambiado_por", "timestamp"]
    can_delete = False


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ["numero", "cliente", "estado", "total", "fecha_promesa_entrega", "fecha_creacion"]
    list_filter = ["estado"]
    search_fields = ["numero", "cliente__nombre_completo"]
    readonly_fields = [
        "id", "numero", "fecha_creacion", "subtotal", "iva", "total", "saldo_pendiente",
    ]
    inlines = [ItemPedidoInline, LogEstadoInline]


@admin.register(AlertaEntrega)
class AlertaEntregaAdmin(admin.ModelAdmin):
    list_display = ["pedido", "tipo", "revisada", "fecha_alerta"]
    list_filter = ["tipo", "revisada"]
    readonly_fields = ["id", "fecha_alerta"]
