from rest_framework import serializers
from .models import Usuario, LogActividad, Notificacion


class UsuarioSerializer(serializers.ModelSerializer):
    cliente_id = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = ["id", "nombre", "email", "rol", "activo", "fecha_creacion", "cliente_id"]
        read_only_fields = ["id", "fecha_creacion"]

    def get_cliente_id(self, obj):
        try:
            return str(obj.cliente_vinculado.id)
        except Exception:
            return None


class UsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Usuario
        fields = ["id", "nombre", "email", "rol", "password"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UsuarioUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, required=False)

    class Meta:
        model = Usuario
        fields = ["nombre", "email", "rol", "activo", "password"]

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class RegistroClienteSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    telefono = serializers.CharField(max_length=15)

    def validate_email(self, value):
        if Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ya existe una cuenta con este email.")
        return value


class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = [
            "id", "tipo", "titulo", "mensaje", "leida",
            "entidad_tipo", "entidad_id", "para_propietario", "fecha_creacion",
        ]
        read_only_fields = ["id", "fecha_creacion"]


class LogActividadSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source="usuario.nombre", read_only=True, default=None)

    class Meta:
        model = LogActividad
        fields = [
            "id", "usuario", "usuario_nombre", "modulo", "accion",
            "entidad_id", "descripcion", "datos_anteriores", "datos_nuevos",
            "ip_address", "timestamp",
        ]
        read_only_fields = ["id", "timestamp"]
