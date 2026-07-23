from rest_framework import serializers
from .models import Cotizacion, ItemCotizacion, VersionCotizacion, SolicitudRapida


class ItemCotizacionSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)
    color_nombre = serializers.CharField(source="color.nombre", read_only=True, default=None)

    class Meta:
        model = ItemCotizacion
        fields = [
            "id", "producto", "producto_nombre", "cantidad", "precio_unitario",
            "descuento", "subtotal",
            "ancho_cm", "alto_cm", "largo_cm", "color", "color_nombre",
            "configuracion", "observaciones_item",
        ]
        read_only_fields = ["id", "subtotal"]

    def validate_descuento(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("El descuento debe estar entre 0 y 100.")
        return value


class VersionCotizacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VersionCotizacion
        fields = [
            "id", "numero_version", "snapshot_json",
            "creado_por", "motivo_cambio", "fecha_creacion",
        ]
        read_only_fields = ["id", "fecha_creacion"]


class CotizacionSerializer(serializers.ModelSerializer):
    items = ItemCotizacionSerializer(many=True, read_only=True)
    cliente_nombre = serializers.CharField(source="cliente.nombre_completo", read_only=True)
    versiones = VersionCotizacionSerializer(many=True, read_only=True)

    class Meta:
        model = Cotizacion
        fields = [
            "id", "numero", "cliente", "cliente_nombre", "estado", "version",
            "subtotal", "iva", "total", "forma_pago", "fecha_promesa_entrega",
            "fecha_creacion", "fecha_envio", "fecha_expiracion", "fecha_respuesta",
            "observaciones", "items", "versiones",
        ]
        read_only_fields = [
            "id", "numero", "version", "subtotal", "iva", "total",
            "fecha_creacion", "fecha_envio", "fecha_expiracion", "fecha_respuesta",
        ]


class CotizacionSnapshotSerializer(serializers.ModelSerializer):
    """Serializer ligero para snapshots — sin relaciones anidadas."""
    items = ItemCotizacionSerializer(many=True, read_only=True)

    class Meta:
        model = Cotizacion
        fields = [
            "id", "numero", "cliente", "estado", "version",
            "subtotal", "iva", "total", "forma_pago", "fecha_promesa_entrega",
            "fecha_creacion", "observaciones", "items",
        ]


class CambiarEstadoSerializer(serializers.Serializer):
    nuevo_estado = serializers.ChoiceField(choices=Cotizacion.ESTADO_CHOICES)


class SolicitudRapidaSerializer(serializers.ModelSerializer):
    cotizacion_numero = serializers.CharField(source="cotizacion.numero", read_only=True, default=None)

    class Meta:
        model = SolicitudRapida
        fields = [
            "id", "nombre", "email", "telefono", "descripcion",
            "cantidad", "notas", "fecha_solicitud", "estado",
            "usuario_vinculado", "cotizacion", "cotizacion_numero",
        ]
        read_only_fields = ["id", "fecha_solicitud", "usuario_vinculado", "cotizacion", "cotizacion_numero"]


class ConvertirSolicitudSerializer(serializers.Serializer):
    cliente_id = serializers.UUIDField()
    forma_pago = serializers.ChoiceField(
        choices=["50_50", "100_ANTICIPO", "100_ENTREGA", "PERSONALIZADO"],
        default="50_50",
    )
