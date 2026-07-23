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
    """Actualización administrativa: permite cambiar rol y estado. Solo para IsAdmin."""
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


class PerfilUpdateSerializer(serializers.ModelSerializer):
    """
    Actualización del propio perfil (PUT /me/).
    NO expone 'rol' ni 'activo' para evitar escalada de privilegios.
    """
    password = serializers.CharField(write_only=True, min_length=8, required=False)

    class Meta:
        model = Usuario
        fields = ["nombre", "email", "password"]

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
    apellido = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    cedula = serializers.CharField(min_length=10, max_length=10)
    password = serializers.CharField(write_only=True, min_length=8)
    telefono = serializers.CharField(max_length=20)

    def validate_email(self, value):
        if Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError("Ya existe una cuenta con este email.")
        return value

    def validate_cedula(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("La cédula debe contener solo dígitos.")
        from utils.validators import validar_cedula_ecuatoriana
        from django.core.exceptions import ValidationError as DjangoValidationError
        from apps.clientes.models import Cliente
        try:
            validar_cedula_ecuatoriana(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e.message))
        if Cliente.objects.filter(cedula_ruc__in=[value, f"{value}001"]).exists():
            raise serializers.ValidationError("Esta cédula ya tiene una cuenta registrada.")
        return value

    def validate_telefono(self, value):
        import re
        limpio = re.sub(r"[\s\-().]", "", value)
        if not re.fullmatch(r"\+\d{8,15}", limpio):
            raise serializers.ValidationError("Incluye el código de país, ej: +593 99 123 4567.")
        return limpio

    def validate_password(self, value):
        import re
        from django.contrib.auth.password_validation import validate_password as django_validate
        from django.core.exceptions import ValidationError as DjangoValidationError

        errores = []
        if not re.search(r"[A-ZÁÉÍÓÚÑ]", value):
            errores.append("al menos una letra mayúscula")
        if not re.search(r"[a-záéíóúñ]", value):
            errores.append("al menos una letra minúscula")
        if not re.search(r"\d", value):
            errores.append("al menos un número")
        if errores:
            raise serializers.ValidationError(f"La contraseña debe tener {', '.join(errores)}.")
        try:
            django_validate(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages)[0])
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
