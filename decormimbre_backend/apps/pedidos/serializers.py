from rest_framework import serializers
from .models import Pedido, ItemPedido, LogEstadoPedido, AlertaEntrega, TareaProduccion


class ItemPedidoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)
    color_nombre = serializers.CharField(source="color.nombre", read_only=True, default=None)

    class Meta:
        model = ItemPedido
        fields = [
            "id", "producto", "producto_nombre", "cantidad", "precio_unitario",
            "subtotal", "ancho_cm", "alto_cm", "largo_cm", "color", "color_nombre",
            "observaciones",
        ]
        read_only_fields = ["id", "subtotal"]


class LogEstadoPedidoSerializer(serializers.ModelSerializer):
    cambiado_por_email = serializers.EmailField(source="cambiado_por.email", read_only=True)

    class Meta:
        model = LogEstadoPedido
        fields = ["id", "estado_anterior", "estado_nuevo", "cambiado_por_email", "timestamp"]
        read_only_fields = ["id", "timestamp"]


class AlertaEntregaSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertaEntrega
        fields = ["id", "tipo", "mensaje", "revisada", "fecha_alerta"]
        read_only_fields = ["id", "fecha_alerta"]


class TareaProduccionSerializer(serializers.ModelSerializer):
    artesano_nombre = serializers.CharField(source="artesano.nombre", read_only=True, default=None)
    artesano_email = serializers.EmailField(source="artesano.email", read_only=True, default=None)
    tipo_display = serializers.CharField(source="get_tipo_display", read_only=True)
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)

    class Meta:
        model = TareaProduccion
        fields = [
            "id", "tipo", "tipo_display", "estado", "estado_display",
            "artesano", "artesano_nombre", "artesano_email",
            "orden", "notas", "iniciada_en", "completada_en",
        ]
        read_only_fields = ["id", "tipo", "estado", "orden", "iniciada_en", "completada_en"]


class PedidoSerializer(serializers.ModelSerializer):
    items = ItemPedidoSerializer(many=True, read_only=True)
    cliente_nombre = serializers.CharField(source="cliente.nombre_completo", read_only=True)
    logs_estado = LogEstadoPedidoSerializer(many=True, read_only=True)
    tareas = TareaProduccionSerializer(many=True, read_only=True)
    porcentaje_completado = serializers.SerializerMethodField()
    artesano_estructura_nombre = serializers.CharField(
        source="artesano_estructura.nombre", read_only=True, default=None
    )
    artesano_tejido_nombre = serializers.CharField(
        source="artesano_tejido.nombre", read_only=True, default=None
    )

    class Meta:
        model = Pedido
        fields = [
            "id", "numero", "cotizacion", "cliente", "cliente_nombre", "estado",
            "etapa_produccion",
            "artesano_estructura", "artesano_estructura_nombre",
            "artesano_tejido", "artesano_tejido_nombre",
            "forma_pago",
            "fecha_promesa_entrega", "fecha_entrega_real",
            "subtotal", "iva", "total", "anticipo", "saldo_pendiente",
            "observaciones", "items", "logs_estado", "tareas",
            "porcentaje_completado", "fecha_creacion",
        ]
        read_only_fields = [
            "id", "numero", "subtotal", "iva", "total", "saldo_pendiente",
            "fecha_entrega_real", "fecha_creacion", "etapa_produccion",
        ]

    def get_porcentaje_completado(self, obj):
        return obj.porcentaje_completado()


class PedidoPublicoSerializer(serializers.ModelSerializer):
    """Serializer reducido para el portal de tracking público."""
    cliente_nombre = serializers.CharField(source="cliente.nombre_completo", read_only=True)
    items = ItemPedidoSerializer(many=True, read_only=True)
    tareas = TareaProduccionSerializer(many=True, read_only=True)
    porcentaje_completado = serializers.SerializerMethodField()
    etapa_produccion_display = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = [
            "numero", "estado", "etapa_produccion", "etapa_produccion_display",
            "porcentaje_completado", "cliente_nombre",
            "fecha_promesa_entrega", "fecha_entrega_real",
            "items", "tareas",
        ]

    def get_porcentaje_completado(self, obj):
        return obj.porcentaje_completado()

    def get_etapa_produccion_display(self, obj):
        if not obj.etapa_produccion:
            return None
        return dict(obj.ETAPA_PRODUCCION_CHOICES).get(obj.etapa_produccion, obj.etapa_produccion)

    @property
    def ETAPA_PRODUCCION_CHOICES(self):
        from .models import ETAPA_PRODUCCION_CHOICES
        return ETAPA_PRODUCCION_CHOICES


class CambiarEstadoPedidoSerializer(serializers.Serializer):
    nuevo_estado = serializers.ChoiceField(choices=Pedido.ESTADO_CHOICES)


class CompletarTareaSerializer(serializers.Serializer):
    notas = serializers.CharField(required=False, allow_blank=True, default="")


class AgregarTareaSerializer(serializers.Serializer):
    tipo = serializers.ChoiceField(choices=TareaProduccion.TIPO_CHOICES)
    artesano = serializers.UUIDField(required=False, allow_null=True)
    orden = serializers.IntegerField(required=False, min_value=1)

    def validate_tipo(self, value):
        pedido = self.context.get("pedido")
        if pedido and TareaProduccion.objects.filter(pedido=pedido, tipo=value).exists():
            raise serializers.ValidationError(
                f"Ya existe una tarea de tipo '{value}' para este pedido."
            )
        return value
