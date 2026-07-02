from django.contrib import admin
from .models import Categoria, Producto, Color


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ["nombre", "orden", "activo"]
    list_filter = ["activo"]
    search_fields = ["nombre"]


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ["nombre", "categoria", "precio_base", "stock_actual", "stock_minimo", "activo"]
    list_filter = ["categoria", "activo", "personalizable"]
    search_fields = ["nombre"]
    readonly_fields = ["id", "fecha_creacion", "fecha_actualizacion"]


@admin.register(Color)
class ColorAdmin(admin.ModelAdmin):
    list_display = ["nombre", "hex", "r", "g", "b", "disponible"]
    list_filter = ["disponible"]
    search_fields = ["nombre"]
