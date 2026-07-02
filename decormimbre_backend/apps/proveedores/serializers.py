from rest_framework import serializers
from .models import Proveedor, OrdenTrabajo


class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = [
            "id", "nombre", "ruc", "contacto_nombre", "contacto_telefono",
            "contacto_email", "tipo", "direccion", "activo", "fecha_creacion",
        ]
        read_only_fields = ["id", "fecha_creacion"]

    def validate_ruc(self, value):
        if not value.isdigit() or len(value) not in (10, 13):
            raise serializers.ValidationError("El RUC debe tener 10 o 13 dígitos.")
        return value


class OrdenTrabajoSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.CharField(source="proveedor.nombre", read_only=True)
    pedido_numero = serializers.CharField(source="pedido.numero", read_only=True, default=None)

    class Meta:
        model = OrdenTrabajo
        fields = [
            "id", "numero", "proveedor", "proveedor_nombre", "pedido", "pedido_numero",
            "estado", "descripcion", "fecha_inicio_estimada", "fecha_fin_estimada",
            "fecha_recepcion", "monto_acordado", "notas", "fecha_creacion",
        ]
        read_only_fields = ["id", "numero", "fecha_creacion"]
