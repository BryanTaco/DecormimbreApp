from django.contrib import admin
from .models import Proveedor, OrdenTrabajo


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ["nombre", "ruc", "tipo", "contacto_email", "activo"]
    list_filter = ["tipo", "activo"]
    search_fields = ["nombre", "ruc"]
    readonly_fields = ["id", "fecha_creacion"]


@admin.register(OrdenTrabajo)
class OrdenTrabajoAdmin(admin.ModelAdmin):
    list_display = ["numero", "proveedor", "estado", "fecha_fin_estimada", "monto_acordado"]
    list_filter = ["estado"]
    search_fields = ["numero", "proveedor__nombre"]
    readonly_fields = ["id", "numero", "fecha_creacion"]
