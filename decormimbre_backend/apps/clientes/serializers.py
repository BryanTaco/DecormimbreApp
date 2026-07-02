from decimal import Decimal
from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from utils.validators import validar_cedula_o_ruc
from .models import Cliente


class ClienteSerializer(serializers.ModelSerializer):
    total_pedidos = serializers.SerializerMethodField()
    total_compras = serializers.SerializerMethodField()

    class Meta:
        model = Cliente
        fields = [
            "id", "cedula_ruc", "nombre_completo", "tipo", "telefono",
            "email", "direccion", "notas", "activo", "fecha_registro",
            "fecha_actualizacion", "total_pedidos", "total_compras",
        ]
        read_only_fields = ["id", "fecha_registro", "fecha_actualizacion"]

    def validate_cedula_ruc(self, value):
        value = value.strip()
        if self.instance and value != self.instance.cedula_ruc:
            raise serializers.ValidationError(
                "La cédula/RUC no puede modificarse una vez registrado."
            )
        return value

    def validate(self, attrs):
        cedula_ruc = attrs.get("cedula_ruc", getattr(self.instance, "cedula_ruc", None))
        tipo = attrs.get("tipo", getattr(self.instance, "tipo", "NATURAL"))
        if cedula_ruc:
            try:
                validar_cedula_o_ruc(cedula_ruc, tipo)
            except DjangoValidationError as e:
                raise serializers.ValidationError(
                    {"cedula_ruc": e.message}
                )
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["creado_por"] = request.user if request else None
        return super().create(validated_data)

    def get_total_pedidos(self, obj):
        return obj.pedidos.count() if hasattr(obj, "pedidos") else 0

    def get_total_compras(self, obj):
        if not hasattr(obj, "pedidos"):
            return "0.00"
        from django.db.models import Sum
        total = (
            obj.pedidos.filter(estado="ENTREGADO").aggregate(t=Sum("total"))["t"]
            or Decimal("0.00")
        )
        return str(total)
