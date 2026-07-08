from rest_framework import serializers
from .models import Oportunidad, Interaccion, Tarea


class OportunidadSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source="cliente.nombre_completo", read_only=True, default=None)
    responsable_nombre = serializers.CharField(source="responsable.nombre", read_only=True, default=None)
    etapa_display = serializers.CharField(source="get_etapa_display", read_only=True)

    class Meta:
        model = Oportunidad
        fields = [
            "id", "titulo", "cliente", "cliente_nombre",
            "contacto_nombre", "contacto_telefono", "contacto_email",
            "etapa", "etapa_display", "valor_estimado", "probabilidad", "fuente",
            "responsable", "responsable_nombre", "descripcion",
            "fecha_cierre_estimada", "fecha_creacion", "cerrada_en",
        ]
        read_only_fields = ["id", "fecha_creacion", "cerrada_en"]


class InteraccionSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source="usuario.nombre", read_only=True, default=None)
    tipo_display = serializers.CharField(source="get_tipo_display", read_only=True)

    class Meta:
        model = Interaccion
        fields = [
            "id", "cliente", "oportunidad", "tipo", "tipo_display",
            "descripcion", "usuario", "usuario_nombre", "fecha",
        ]
        read_only_fields = ["id", "fecha", "usuario"]


class TareaSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source="cliente.nombre_completo", read_only=True, default=None)
    oportunidad_titulo = serializers.CharField(source="oportunidad.titulo", read_only=True, default=None)
    responsable_nombre = serializers.CharField(source="responsable.nombre", read_only=True, default=None)

    class Meta:
        model = Tarea
        fields = [
            "id", "titulo", "descripcion", "cliente", "cliente_nombre",
            "oportunidad", "oportunidad_titulo", "responsable", "responsable_nombre",
            "prioridad", "fecha_vencimiento", "completada", "completada_en", "fecha_creacion",
        ]
        read_only_fields = ["id", "completada_en", "fecha_creacion"]
