from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, LogActividad


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ["email", "nombre", "rol", "activo", "fecha_creacion"]
    list_filter = ["rol", "activo"]
    search_fields = ["email", "nombre"]
    ordering = ["email"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Información personal", {"fields": ("nombre", "rol")}),
        ("Permisos", {"fields": ("activo", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Fechas", {"fields": ("fecha_creacion", "ultimo_login")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "nombre", "rol", "password1", "password2"),
        }),
    )
    readonly_fields = ["fecha_creacion", "ultimo_login"]


@admin.register(LogActividad)
class LogActividadAdmin(admin.ModelAdmin):
    list_display = ["timestamp", "usuario", "modulo", "accion", "entidad_id"]
    list_filter = ["modulo", "accion"]
    search_fields = ["entidad_id", "descripcion"]
    readonly_fields = ["id", "timestamp"]
