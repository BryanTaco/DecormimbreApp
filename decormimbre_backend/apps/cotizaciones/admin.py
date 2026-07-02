from django.contrib import admin
from .models import Cotizacion, ItemCotizacion, VersionCotizacion


class ItemCotizacionInline(admin.TabularInline):
    model = ItemCotizacion
    extra = 0
    readonly_fields = ["subtotal"]


@admin.register(Cotizacion)
class CotizacionAdmin(admin.ModelAdmin):
    list_display = ["numero", "cliente", "estado", "total", "version", "fecha_creacion"]
    list_filter = ["estado"]
    search_fields = ["numero", "cliente__nombre_completo"]
    readonly_fields = ["id", "numero", "fecha_creacion", "subtotal", "iva", "total"]
    inlines = [ItemCotizacionInline]


@admin.register(VersionCotizacion)
class VersionCotizacionAdmin(admin.ModelAdmin):
    list_display = ["cotizacion", "numero_version", "motivo_cambio", "fecha_creacion"]
    readonly_fields = ["id", "fecha_creacion"]
