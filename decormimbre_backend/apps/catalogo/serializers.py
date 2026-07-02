from rest_framework import serializers
from .models import Categoria, Producto, Color


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ["id", "nombre", "descripcion", "imagen_url", "orden", "activo"]
        read_only_fields = ["id"]


class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ["id", "nombre", "hex", "r", "g", "b", "disponible"]
        read_only_fields = ["id", "hex"]

    def validate(self, attrs):
        for ch in ("r", "g", "b"):
            v = attrs.get(ch)
            if v is not None and not (0 <= v <= 255):
                raise serializers.ValidationError({ch: f"{ch.upper()} debe estar entre 0 y 255."})
        return attrs


class ProductoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source="categoria.nombre", read_only=True)

    class Meta:
        model = Producto
        fields = [
            "id", "nombre", "descripcion", "precio_base", "stock_actual",
            "stock_minimo", "imagen_url", "imagenes_adicionales", "categoria",
            "categoria_nombre", "material", "tiempo_produccion_dias", "personalizable",
            "activo", "fecha_creacion", "fecha_actualizacion",
        ]
        read_only_fields = ["id", "fecha_creacion", "fecha_actualizacion"]
