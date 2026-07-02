from django.contrib import admin
from .models import Cliente


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ["nombre_completo", "cedula_ruc", "tipo", "telefono", "activo", "fecha_registro"]
    list_filter = ["tipo", "activo"]
    search_fields = ["nombre_completo", "cedula_ruc", "email"]
    readonly_fields = ["id", "fecha_registro", "fecha_actualizacion"]
