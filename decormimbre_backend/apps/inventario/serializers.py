from decimal import Decimal
from rest_framework import serializers
from .models import MateriaPrima, Lote, MovimientoInventario, AlertaStock


class MateriaPrimaSerializer(serializers.ModelSerializer):
    en_stock_critico = serializers.BooleanField(read_only=True)

    class Meta:
        model = MateriaPrima
        fields = [
            "id", "nombre", "descripcion", "unidad", "stock_actual",
            "stock_minimo", "costo_unitario", "proveedor", "activo", "en_stock_critico",
        ]
        read_only_fields = ["id"]


class LoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lote
        fields = [
            "id", "materia_prima", "numero_lote", "proveedor",
            "cantidad_inicial", "cantidad_disponible", "costo_unitario",
            "fecha_recepcion", "fecha_vencimiento", "observaciones",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        lote = super().create(validated_data)
        mp = lote.materia_prima
        stock_antes = mp.stock_actual
        mp.stock_actual += lote.cantidad_inicial
        mp.save(update_fields=["stock_actual"])
        MovimientoInventario.objects.create(
            materia_prima=mp,
            lote=lote,
            tipo="ENTRADA",
            cantidad=lote.cantidad_inicial,
            stock_antes=stock_antes,
            stock_despues=mp.stock_actual,
            usuario=self.context["request"].user if self.context.get("request") else None,
            justificacion=f"Ingreso lote {lote.numero_lote}",
        )
        return lote


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientoInventario
        fields = [
            "id", "materia_prima", "lote", "tipo", "cantidad",
            "stock_antes", "stock_despues", "pedido", "justificacion", "usuario", "fecha",
        ]
        read_only_fields = ["id", "fecha", "usuario", "stock_antes", "stock_despues"]

    def validate(self, attrs):
        if attrs.get("tipo") in ("AJUSTE_POSITIVO", "AJUSTE_NEGATIVO") and not attrs.get("justificacion"):
            raise serializers.ValidationError({"justificacion": "Obligatoria para ajustes manuales."})
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["usuario"] = request.user if request else None
        mp = validated_data["materia_prima"]
        stock_antes = mp.stock_actual
        tipo = validated_data["tipo"]
        cantidad = validated_data["cantidad"]

        if tipo == "ENTRADA":
            mp.stock_actual += cantidad
        elif tipo == "SALIDA_PRODUCCION":
            mp.stock_actual = max(Decimal("0"), mp.stock_actual - cantidad)
        elif tipo == "AJUSTE_POSITIVO":
            mp.stock_actual += cantidad
        elif tipo == "AJUSTE_NEGATIVO":
            mp.stock_actual = max(Decimal("0"), mp.stock_actual - cantidad)
        elif tipo == "DEVOLUCION":
            mp.stock_actual += cantidad

        mp.save(update_fields=["stock_actual"])
        validated_data["stock_antes"] = stock_antes
        validated_data["stock_despues"] = mp.stock_actual
        return super().create(validated_data)


class AlertaStockSerializer(serializers.ModelSerializer):
    materia_prima_nombre = serializers.CharField(source="materia_prima.nombre", read_only=True)
    unidad = serializers.CharField(source="materia_prima.unidad", read_only=True)
    stock_minimo = serializers.DecimalField(
        source="materia_prima.stock_minimo", max_digits=10, decimal_places=3, read_only=True
    )

    class Meta:
        model = AlertaStock
        fields = [
            "id", "materia_prima", "materia_prima_nombre", "unidad",
            "stock_al_momento", "stock_minimo", "revisada", "fecha_alerta",
        ]
        read_only_fields = ["id", "fecha_alerta"]
